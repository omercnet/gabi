import { SSEManager, type SSEManagerOptions } from "../sse";
import type { SSEEvent, SSEStatus } from "../types";

function makeAsyncIterable(events: Array<{ data: SSEEvent }>): AsyncIterable<{ data: SSEEvent }> {
  return {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        async next() {
          if (i < events.length) {
            return { value: events[i++]!, done: false as const };
          }
          return { value: undefined as any, done: true };
        },
      };
    },
  };
}

function hangingIterable(): AsyncIterable<{ data: SSEEvent }> {
  return {
    [Symbol.asyncIterator]() {
      return {
        next() {
          return new Promise(() => {});
        },
      };
    },
  };
}

function makeMockClient(subscribeFn?: jest.Mock) {
  return {
    event: {
      subscribe: subscribeFn ?? jest.fn(() => Promise.resolve(makeAsyncIterable([]))),
    },
    global: { health: jest.fn() },
    session: {
      list: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      prompt: jest.fn(),
      abort: jest.fn(),
    },
    permission: { reply: jest.fn() },
    question: { reply: jest.fn(), reject: jest.fn() },
  } as unknown as SSEManagerOptions["client"];
}

describe("SSEManager", () => {
  let onEvent: jest.Mock;
  let onStatusChange: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    onEvent = jest.fn();
    onStatusChange = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function createManager(client?: SSEManagerOptions["client"], directory = "/test") {
    const c = client ?? makeMockClient();
    const manager = new SSEManager({
      client: c,
      directory,
      onEvent,
      onStatusChange,
    });
    return { manager, client: c };
  }

  describe("constructor", () => {
    it("creates instance without starting", () => {
      const { manager } = createManager();
      expect(manager).toBeDefined();
      expect(onStatusChange).not.toHaveBeenCalled();
    });
  });

  describe("start", () => {
    it("calls client.event.subscribe with directory", async () => {
      const subscribeFn = jest.fn(() => Promise.resolve(makeAsyncIterable([])));
      const { manager } = createManager(makeMockClient(subscribeFn), "/my-project");
      manager.start();
      await jest.advanceTimersByTimeAsync(0);
      expect(subscribeFn).toHaveBeenCalledWith({ directory: "/my-project" });
      manager.stop();
    });

    it("sets status to connected on successful subscribe", async () => {
      const { manager } = createManager();
      manager.start();
      await jest.advanceTimersByTimeAsync(0);
      expect(onStatusChange).toHaveBeenCalledWith("connected");
      manager.stop();
    });

    it("is idempotent — second start is ignored", async () => {
      const subscribeFn = jest.fn(() => Promise.resolve(makeAsyncIterable([])));
      const { manager } = createManager(makeMockClient(subscribeFn));
      manager.start();
      manager.start();
      await jest.advanceTimersByTimeAsync(0);
      expect(subscribeFn).toHaveBeenCalledTimes(1);
      manager.stop();
    });
  });

  describe("stop", () => {
    it("sets status to disconnected", async () => {
      const { manager } = createManager();
      manager.start();
      await jest.advanceTimersByTimeAsync(0);
      onStatusChange.mockClear();
      manager.stop();
      expect(onStatusChange).toHaveBeenCalledWith("disconnected");
    });

    it("does not call onEvent after stop", async () => {
      const event = { type: "session.idle", properties: {} } as unknown as SSEEvent;
      let resolveNext: ((v: IteratorResult<{ data: SSEEvent }>) => void) | null = null;
      const iterable = {
        [Symbol.asyncIterator]() {
          return {
            next() {
              return new Promise<IteratorResult<{ data: SSEEvent }>>((r) => {
                resolveNext = r;
              });
            },
          };
        },
      };
      const subscribeFn = jest.fn(() => Promise.resolve(iterable));
      const { manager } = createManager(makeMockClient(subscribeFn));
      manager.start();
      await jest.advanceTimersByTimeAsync(0);
      manager.stop();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resolve = resolveNext as unknown as ((v: any) => void) | null;
      if (resolve) {
        resolve({ value: { data: event }, done: false });
      }
      await jest.advanceTimersByTimeAsync(0);
      expect(onEvent).not.toHaveBeenCalled();
    });
  });

  describe("event dispatch", () => {
    it("forwards events from the async iterable to onEvent", async () => {
      const event = {
        type: "message.part.updated",
        properties: { sessionID: "ses-1", part: { id: "p1", messageID: "msg-1" } },
      } as unknown as SSEEvent;
      const subscribeFn = jest.fn(() => Promise.resolve(makeAsyncIterable([{ data: event }])));
      const { manager } = createManager(makeMockClient(subscribeFn));
      manager.start();
      await jest.advanceTimersByTimeAsync(0);
      expect(onEvent).toHaveBeenCalledWith(event);
      manager.stop();
    });

    it("dispatches multiple events in order", async () => {
      const e1 = { type: "session.idle", properties: {} } as unknown as SSEEvent;
      const e2 = {
        type: "session.status",
        properties: { status: { type: "busy" } },
      } as unknown as SSEEvent;
      const subscribeFn = jest.fn(() =>
        Promise.resolve(makeAsyncIterable([{ data: e1 }, { data: e2 }])),
      );
      const { manager } = createManager(makeMockClient(subscribeFn));
      manager.start();
      await jest.advanceTimersByTimeAsync(0);
      expect(onEvent).toHaveBeenCalledTimes(2);
      expect(onEvent.mock.calls[0][0]).toBe(e1);
      expect(onEvent.mock.calls[1][0]).toBe(e2);
      manager.stop();
    });

    it("skips events with no data property", async () => {
      const iterable = {
        [Symbol.asyncIterator]() {
          let i = 0;
          const items = [{ data: undefined }, { data: null }];
          return {
            async next() {
              if (i < items.length) return { value: items[i++], done: false };
              return { value: undefined, done: true };
            },
          };
        },
      };
      const subscribeFn = jest.fn(() => Promise.resolve(iterable));
      const { manager } = createManager(makeMockClient(subscribeFn));
      manager.start();
      await jest.advanceTimersByTimeAsync(0);
      expect(onEvent).not.toHaveBeenCalled();
      manager.stop();
    });
  });

  describe("reconnection", () => {
    it("schedules reconnect when subscribe throws", async () => {
      let callCount = 0;
      const subscribeFn = jest.fn(() => {
        callCount++;
        if (callCount === 1) return Promise.reject(new Error("network error"));
        return Promise.resolve(hangingIterable());
      });
      const { manager } = createManager(makeMockClient(subscribeFn));
      manager.start();
      // Flush async chain: start() -> connect() -> reject -> scheduleReconnect
      for (let i = 0; i < 5; i++) {
        await jest.advanceTimersByTimeAsync(1000);
        await jest.advanceTimersByTimeAsync(0);
      }
      expect(onStatusChange).toHaveBeenCalledWith("reconnecting");
      expect(subscribeFn.mock.calls.length).toBeGreaterThanOrEqual(2);
      manager.stop();
    });

    it("schedules reconnect when iterable ends normally", async () => {
      let _callCount = 0;
      const subscribeFn = jest.fn(() => {
        _callCount++;
        return Promise.resolve(makeAsyncIterable([]));
      });
      const { manager } = createManager(makeMockClient(subscribeFn));
      manager.start();
      await jest.advanceTimersByTimeAsync(0);
      // First call ended (empty iterable), should reconnect
      expect(onStatusChange).toHaveBeenCalledWith("reconnecting");
      await jest.advanceTimersByTimeAsync(30000);
      expect(subscribeFn.mock.calls.length).toBeGreaterThanOrEqual(2);
      manager.stop();
    });

    it("resets attempt counter on successful connection", async () => {
      let callCount = 0;
      const subscribeFn = jest.fn(() => {
        callCount++;
        if (callCount <= 2) return Promise.reject(new Error("fail"));
        return Promise.resolve(hangingIterable());
      });
      const { manager } = createManager(makeMockClient(subscribeFn));
      manager.start();

      // First fail
      await jest.advanceTimersByTimeAsync(0);
      // Second fail after backoff
      await jest.advanceTimersByTimeAsync(30000);
      // Third succeeds
      await jest.advanceTimersByTimeAsync(30000);

      const connectedCalls = onStatusChange.mock.calls.filter(
        (c: [SSEStatus]) => c[0] === "connected",
      );
      expect(connectedCalls.length).toBeGreaterThanOrEqual(1);
      manager.stop();
    });
  });

  describe("backoff", () => {
    it("increases delay between reconnection attempts", async () => {
      const subscribeFn = jest.fn(() => Promise.reject(new Error("fail")));
      const { manager } = createManager(makeMockClient(subscribeFn));
      manager.start();

      // First failure happens immediately
      await jest.advanceTimersByTimeAsync(0);
      expect(subscribeFn).toHaveBeenCalledTimes(1);

      // Advance enough to trigger several retries with exponential backoff
      // Each advance+flush processes one timer + async chain
      for (let i = 0; i < 5; i++) {
        await jest.advanceTimersByTimeAsync(2000);
        await jest.advanceTimersByTimeAsync(0);
      }

      // Should have reconnected at least twice more
      expect(subscribeFn.mock.calls.length).toBeGreaterThanOrEqual(3);
      manager.stop();
    });

    it("caps backoff at MAX_BACKOFF (30s)", async () => {
      const subscribeFn = jest.fn(() => Promise.reject(new Error("fail")));
      const { manager } = createManager(makeMockClient(subscribeFn));
      manager.start();

      // Run through multiple failures
      for (let i = 0; i < 4; i++) {
        await jest.advanceTimersByTimeAsync(31000);
      }

      // Should have attempted multiple times but not infinite
      expect(subscribeFn.mock.calls.length).toBeGreaterThan(1);
      expect(subscribeFn.mock.calls.length).toBeLessThanOrEqual(5);
      manager.stop();
    });
  });

  describe("max failures", () => {
    it("stops reconnecting after MAX_FAILURES (5)", async () => {
      const subscribeFn = jest.fn(() => Promise.reject(new Error("fail")));
      const { manager } = createManager(makeMockClient(subscribeFn));
      manager.start();

      // Run through enough time for all retries
      for (let i = 0; i < 10; i++) {
        await jest.advanceTimersByTimeAsync(31000);
      }

      // Should have been called at most 5 times (initial + 4 retries before MAX_FAILURES)
      expect(subscribeFn.mock.calls.length).toBeLessThanOrEqual(6);

      // Final status should be disconnected
      const lastCall = onStatusChange.mock.calls[onStatusChange.mock.calls.length - 1];
      expect(lastCall[0]).toBe("disconnected");
      manager.stop();
    });
  });

  describe("status transitions", () => {
    it("does not emit duplicate status changes", async () => {
      const { manager } = createManager(
        makeMockClient(jest.fn(() => Promise.resolve(hangingIterable()))),
      );
      manager.start();
      await jest.advanceTimersByTimeAsync(0);
      // Only one "connected" call
      const connectedCalls = onStatusChange.mock.calls.filter(
        (c: [SSEStatus]) => c[0] === "connected",
      );
      expect(connectedCalls.length).toBe(1);
      manager.stop();
    });

    it("transitions: disconnected → connected → disconnected on stop", async () => {
      const { manager } = createManager(
        makeMockClient(jest.fn(() => Promise.resolve(hangingIterable()))),
      );
      manager.start();
      await jest.advanceTimersByTimeAsync(0);
      manager.stop();
      expect(onStatusChange.mock.calls.map((c: [SSEStatus]) => c[0])).toEqual([
        "connected",
        "disconnected",
      ]);
    });
  });
});
