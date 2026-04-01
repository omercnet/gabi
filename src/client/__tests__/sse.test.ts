import type { OpencodeClient, SSEEvent, SSEStatus } from "@/client/types";
import { makeSession } from "@/test/factories";
import { resetAllStores } from "@/test/setup";
import { SSEManager } from "../sse";

type InternalSSEManager = {
  client: OpencodeClient;
  directory: string;
  onEvent: (event: SSEEvent) => void;
  onStatusChange: (status: SSEStatus) => void;
  attempt: number;
  running: boolean;
  status: SSEStatus;
  connect: () => Promise<void>;
  getBackoff: () => number;
  scheduleReconnect: () => void;
};

function streamFrom(items: Array<{ data?: unknown }>): AsyncIterable<{ data?: unknown }> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const item of items) {
        yield item;
      }
    },
  };
}

function pendingStream(): AsyncIterable<{ data?: unknown }> {
  return {
    async *[Symbol.asyncIterator]() {
      await new Promise<never>(() => undefined);
    },
  };
}

async function flushAsync(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("SSEManager", () => {
  beforeEach(() => {
    resetAllStores();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  function createManager(overrides?: {
    subscribe?: jest.Mock;
    onEvent?: jest.Mock;
    onStatusChange?: jest.Mock;
  }): {
    manager: SSEManager;
    subscribeMock: jest.Mock;
    onEvent: jest.Mock;
    onStatusChange: jest.Mock;
  } {
    const subscribeMock = overrides?.subscribe ?? jest.fn();
    const client = {
      event: {
        subscribe: subscribeMock,
      },
    } as unknown as OpencodeClient;

    const onEvent = overrides?.onEvent ?? jest.fn();
    const onStatusChange = overrides?.onStatusChange ?? jest.fn();

    const manager = new SSEManager({
      client,
      directory: "/tmp/project",
      onEvent,
      onStatusChange,
    });

    return { manager, subscribeMock, onEvent, onStatusChange };
  }

  it("constructor sets expected properties", () => {
    const { manager, onEvent, onStatusChange } = createManager();
    const internal = manager as unknown as InternalSSEManager;

    expect(internal.directory).toBe("/tmp/project");
    expect(internal.onEvent).toBe(onEvent);
    expect(internal.onStatusChange).toBe(onStatusChange);
    expect(internal.status).toBe("disconnected");
  });

  it("start() calls connect()", () => {
    const { manager } = createManager();
    const connectSpy = jest.spyOn(manager as unknown as InternalSSEManager, "connect");

    manager.start();

    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  it("start() is idempotent", () => {
    const { manager } = createManager();
    const connectSpy = jest.spyOn(manager as unknown as InternalSSEManager, "connect");

    manager.start();
    manager.start();

    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  it("stop() sets disconnected status and aborts controller", async () => {
    const subscribeMock = jest.fn().mockResolvedValue(pendingStream());
    const { manager, onStatusChange } = createManager({ subscribe: subscribeMock });
    const abortSpy = jest.spyOn(AbortController.prototype, "abort");

    manager.start();
    await flushAsync();
    manager.stop();

    expect(abortSpy).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenLastCalledWith("disconnected");
  });

  it("forwards stream events to onEvent callback", async () => {
    const event = {
      type: "session.updated",
      properties: { info: makeSession({ id: "ses-42" }) },
    } as SSEEvent;
    const subscribeMock = jest.fn().mockResolvedValue(streamFrom([{ data: event }]));
    const { manager, onEvent } = createManager({ subscribe: subscribeMock });

    manager.start();
    await flushAsync();

    expect(onEvent).toHaveBeenCalledWith(event);
  });

  it("calculates exponential backoff values (500, 1000, 2000)", () => {
    const { manager } = createManager();
    const internal = manager as unknown as InternalSSEManager;
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    internal.attempt = 0;
    expect(internal.getBackoff()).toBe(500);

    internal.attempt = 1;
    expect(internal.getBackoff()).toBe(1000);

    internal.attempt = 2;
    expect(internal.getBackoff()).toBe(2000);
  });

  it("caps max backoff at 30000", () => {
    const { manager } = createManager();
    const internal = manager as unknown as InternalSSEManager;
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    internal.attempt = 20;

    expect(internal.getBackoff()).toBe(30000);
  });

  it("applies jitter in 0.8x to 1.2x range", () => {
    const { manager } = createManager();
    const internal = manager as unknown as InternalSSEManager;

    internal.attempt = 0;
    jest.spyOn(Math, "random").mockReturnValue(0);
    expect(internal.getBackoff()).toBe(400);

    jest.spyOn(Math, "random").mockReturnValue(1);
    expect(internal.getBackoff()).toBeCloseTo(600, 6);
  });

  it("reconnects when stream ends", async () => {
    const subscribeMock = jest.fn().mockResolvedValue(streamFrom([]));
    const { manager, onStatusChange } = createManager({ subscribe: subscribeMock });

    manager.start();
    await flushAsync();

    expect(onStatusChange).toHaveBeenCalledWith("connected");
    expect(onStatusChange).toHaveBeenCalledWith("reconnecting");
    expect(jest.getTimerCount()).toBe(1);
  });

  it("stops reconnecting after max 5 failures and sets disconnected", async () => {
    const subscribeMock = jest.fn().mockRejectedValue(new Error("boom"));
    const { manager, onStatusChange } = createManager({ subscribe: subscribeMock });
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    manager.start();
    await flushAsync();

    for (let i = 0; i < 4; i++) {
      jest.runOnlyPendingTimers();
      await flushAsync();
    }

    expect(subscribeMock).toHaveBeenCalledTimes(5);
    expect(onStatusChange).toHaveBeenLastCalledWith("disconnected");
    expect(jest.getTimerCount()).toBe(0);
  });

  it("transitions disconnected -> connected", async () => {
    const subscribeMock = jest.fn().mockResolvedValue(pendingStream());
    const { manager, onStatusChange } = createManager({ subscribe: subscribeMock });

    manager.start();
    await flushAsync();

    expect(onStatusChange).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenCalledWith("connected");
  });

  it("transitions connected -> reconnecting -> connected", async () => {
    const subscribeMock = jest
      .fn()
      .mockRejectedValueOnce(new Error("first failure"))
      .mockResolvedValueOnce(pendingStream());
    const { manager, onStatusChange } = createManager({ subscribe: subscribeMock });
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    manager.start();
    await flushAsync();
    jest.runOnlyPendingTimers();
    await flushAsync();

    expect(onStatusChange.mock.calls.map((call) => call[0])).toEqual(["reconnecting", "connected"]);
  });

  it("transitions reconnecting -> disconnected at failure threshold", () => {
    const { manager, onStatusChange } = createManager();
    const internal = manager as unknown as InternalSSEManager;

    internal.running = true;
    internal.attempt = 4;
    internal.status = "reconnecting";
    internal.scheduleReconnect();

    expect(onStatusChange).toHaveBeenCalledWith("disconnected");
  });

  it("calls subscribe with directory", async () => {
    const subscribeMock = jest.fn().mockResolvedValue(streamFrom([]));
    const { manager } = createManager({ subscribe: subscribeMock });

    manager.start();
    await flushAsync();

    expect(subscribeMock).toHaveBeenCalledWith({ directory: "/tmp/project" });
  });

  it("ignores events without data payload", async () => {
    const subscribeMock = jest.fn().mockResolvedValue(streamFrom([{ data: undefined }, {}]));
    const { manager, onEvent } = createManager({ subscribe: subscribeMock });

    manager.start();
    await flushAsync();

    expect(onEvent).not.toHaveBeenCalled();
  });

  it("does not schedule reconnect after stop()", async () => {
    const subscribeMock = jest.fn().mockResolvedValue(pendingStream());
    const { manager } = createManager({ subscribe: subscribeMock });

    manager.start();
    await flushAsync();
    manager.stop();
    jest.runOnlyPendingTimers();

    expect(jest.getTimerCount()).toBe(0);
  });

  it("resets attempt counter to zero on successful connect", async () => {
    const subscribeMock = jest.fn().mockResolvedValue(pendingStream());
    const { manager } = createManager({ subscribe: subscribeMock });
    const internal = manager as unknown as InternalSSEManager;

    internal.attempt = 3;
    manager.start();
    await flushAsync();

    expect(internal.attempt).toBe(0);
  });

  it("scheduleReconnect sets reconnecting and schedules timer under threshold", () => {
    const { manager } = createManager();
    const internal = manager as unknown as InternalSSEManager;
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5);

    internal.running = true;
    internal.attempt = 0;
    internal.scheduleReconnect();

    expect(internal.status).toBe("reconnecting");
    expect(jest.getTimerCount()).toBe(1);
    randomSpy.mockRestore();
  });
});
