import { SSEManager } from "../sse";
import type { SSEEvent, SSEStatus } from "../types";

function makeMockClient() {
  return {
    event: { subscribe: jest.fn() },
    global: { health: jest.fn() },
    session: { list: jest.fn(), create: jest.fn(), delete: jest.fn(), prompt: jest.fn(), abort: jest.fn() },
    permission: { reply: jest.fn() },
    question: { reply: jest.fn(), reject: jest.fn() },
    file: { status: jest.fn() },
  };
}

type MockClient = ReturnType<typeof makeMockClient>;

function hangingIterable() {
  return {
    [Symbol.asyncIterator]: () => ({
      next: () => new Promise<never>(() => {}),
    }),
  };
}

function flushMicrotasks() {
  return new Promise<void>((resolve) => process.nextTick(resolve));
}

describe("SSEManager", () => {
  let client: MockClient;
  let events: SSEEvent[];
  let statuses: SSEStatus[];
  let manager: SSEManager;

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask"] });
    client = makeMockClient();
    events = [];
    statuses = [];
  });

  afterEach(() => {
    manager?.stop();
    jest.useRealTimers();
  });

  function createManager() {
    manager = new SSEManager({
      client: client as any,
      directory: "/test/project",
      onEvent: (e) => events.push(e),
      onStatusChange: (s) => statuses.push(s),
    });
    return manager;
  }

  describe("lifecycle", () => {
    it("does not connect until start() is called", () => {
      (client.event.subscribe as jest.Mock).mockResolvedValue(hangingIterable());
      createManager();
      expect(client.event.subscribe).not.toHaveBeenCalled();
    });

    it("calls subscribe on start()", () => {
      (client.event.subscribe as jest.Mock).mockResolvedValue(hangingIterable());
      createManager();
      manager.start();
      expect(client.event.subscribe).toHaveBeenCalledWith({ directory: "/test/project" });
    });

    it("start() is idempotent when already running", () => {
      (client.event.subscribe as jest.Mock).mockResolvedValue(hangingIterable());
      createManager();
      manager.start();
      manager.start();
      expect(client.event.subscribe).toHaveBeenCalledTimes(1);
    });

    it("stop() sets status to disconnected", async () => {
      (client.event.subscribe as jest.Mock).mockResolvedValue(hangingIterable());
      createManager();
      manager.start();
      await flushMicrotasks();
      manager.stop();
      expect(statuses).toContain("disconnected");
    });

    it("can restart after stop", async () => {
      (client.event.subscribe as jest.Mock).mockResolvedValue(hangingIterable());
      createManager();
      manager.start();
      await flushMicrotasks();
      manager.stop();
      manager.start();
      expect(client.event.subscribe).toHaveBeenCalledTimes(2);
    });
  });

  describe("status transitions", () => {
    it("transitions to connected on successful subscribe", async () => {
      (client.event.subscribe as jest.Mock).mockResolvedValue(hangingIterable());
      createManager();
      manager.start();
      await flushMicrotasks();
      expect(statuses).toContain("connected");
    });

    it("does not emit duplicate connected status", async () => {
      (client.event.subscribe as jest.Mock).mockResolvedValue(hangingIterable());
      createManager();
      manager.start();
      await flushMicrotasks();
      const connectedCount = statuses.filter((s) => s === "connected").length;
      expect(connectedCount).toBe(1);
    });
  });

  describe("event delivery", () => {
    it("delivers events from the async iterable", async () => {
      const fakeEvent = { type: "message.updated", properties: {} } as unknown as SSEEvent;
      let callCount = 0;
      (client.event.subscribe as jest.Mock).mockResolvedValue({
        [Symbol.asyncIterator]: () => ({
          next: () => {
            callCount++;
            if (callCount === 1) return Promise.resolve({ done: false, value: { data: fakeEvent } });
            return new Promise<never>(() => {});
          },
        }),
      });
      createManager();
      manager.start();
      await flushMicrotasks();
      await flushMicrotasks();
      expect(events).toHaveLength(1);
      expect(events[0]).toBe(fakeEvent);
    });

    it("ignores events without data field", async () => {
      let callCount = 0;
      const items = [{ noData: true }, { data: null }];
      (client.event.subscribe as jest.Mock).mockResolvedValue({
        [Symbol.asyncIterator]: () => ({
          next: () => {
            if (callCount < items.length) return Promise.resolve({ done: false, value: items[callCount++] });
            return new Promise<never>(() => {});
          },
        }),
      });
      createManager();
      manager.start();
      await flushMicrotasks();
      await flushMicrotasks();
      expect(events).toHaveLength(0);
    });

    it("delivers multiple events in sequence", async () => {
      const ev1 = { type: "message.updated", properties: { id: 1 } } as unknown as SSEEvent;
      const ev2 = { type: "session.idle", properties: { id: 2 } } as unknown as SSEEvent;
      let callCount = 0;
      (client.event.subscribe as jest.Mock).mockResolvedValue({
        [Symbol.asyncIterator]: () => ({
          next: () => {
            callCount++;
            if (callCount === 1) return Promise.resolve({ done: false, value: { data: ev1 } });
            if (callCount === 2) return Promise.resolve({ done: false, value: { data: ev2 } });
            return new Promise<never>(() => {});
          },
        }),
      });
      createManager();
      manager.start();
      await flushMicrotasks();
      await flushMicrotasks();
      await flushMicrotasks();
      expect(events).toHaveLength(2);
    });
  });

  describe("reconnect behavior", () => {
    it("schedules reconnect after subscribe error", async () => {
      (client.event.subscribe as jest.Mock)
        .mockRejectedValueOnce(new Error("network"))
        .mockResolvedValue(hangingIterable());
      createManager();
      manager.start();
      await flushMicrotasks();
      expect(statuses).toContain("reconnecting");
      expect(client.event.subscribe).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(2000);
      await flushMicrotasks();
      expect(client.event.subscribe).toHaveBeenCalledTimes(2);
    });

    it("schedules reconnect after stream ends normally", async () => {
      let callCount = 0;
      (client.event.subscribe as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            [Symbol.asyncIterator]: () => ({
              next: () => Promise.resolve({ done: true, value: undefined }),
            }),
          });
        }
        return Promise.resolve(hangingIterable());
      });
      createManager();
      manager.start();
      await flushMicrotasks();
      await flushMicrotasks();
      await flushMicrotasks();
      expect(callCount).toBe(1);
      expect(statuses).toContain("reconnecting");
      jest.advanceTimersByTime(2000);
      await flushMicrotasks();
      expect(callCount).toBe(2);
    });

    it("gives up after MAX_FAILURES (5) consecutive errors", async () => {
      (client.event.subscribe as jest.Mock).mockRejectedValue(new Error("fail"));
      createManager();
      manager.start();
      for (let i = 0; i < 6; i++) {
        await flushMicrotasks();
        jest.advanceTimersByTime(60000);
      }
      await flushMicrotasks();
      expect(statuses[statuses.length - 1]).toBe("disconnected");
    });

    it("does not reconnect after giving up", async () => {
      (client.event.subscribe as jest.Mock).mockRejectedValue(new Error("fail"));
      createManager();
      manager.start();
      for (let i = 0; i < 8; i++) {
        await flushMicrotasks();
        jest.advanceTimersByTime(60000);
      }
      await flushMicrotasks();
      const finalCallCount = (client.event.subscribe as jest.Mock).mock.calls.length;
      jest.advanceTimersByTime(120000);
      await flushMicrotasks();
      expect((client.event.subscribe as jest.Mock).mock.calls.length).toBe(finalCallCount);
    });
  });

  describe("stop during operations", () => {
    it("does not reconnect after stop", async () => {
      (client.event.subscribe as jest.Mock).mockResolvedValue(hangingIterable());
      createManager();
      manager.start();
      await flushMicrotasks();
      manager.stop();
      const callCount = (client.event.subscribe as jest.Mock).mock.calls.length;
      jest.advanceTimersByTime(60000);
      await flushMicrotasks();
      expect((client.event.subscribe as jest.Mock).mock.calls.length).toBe(callCount);
    });

    it("does not deliver events after stop", async () => {
      (client.event.subscribe as jest.Mock).mockResolvedValue(hangingIterable());
      createManager();
      manager.start();
      await flushMicrotasks();
      manager.stop();
      expect(events).toHaveLength(0);
    });

    it("double stop is safe", async () => {
      (client.event.subscribe as jest.Mock).mockResolvedValue(hangingIterable());
      createManager();
      manager.start();
      await flushMicrotasks();
      expect(() => manager.stop()).not.toThrow();
      expect(() => manager.stop()).not.toThrow();
    });
  });
});