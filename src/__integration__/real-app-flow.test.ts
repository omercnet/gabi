/// <reference types="node" />

/**
 * REAL APP FLOW integration tests — NO MOCKS.
 *
 * Tests the exact same code paths the app uses:
 * - loadSessionMessages (the function ChatScreen calls)
 * - SSEManager (the class useSSE creates)
 * - Store population (sessionStore, messageStore)
 * - processMessages + sort (the function that crashed on time.created)
 * - Session list for pre-existing sessions
 * - Message deduplication
 *
 * Every test uses a real opencode server via createOpencode().
 * Every bug the user found by "just loading the app" would be caught here.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createOpencode } from "@opencode-ai/sdk";
import { buildClient } from "@/client/client";
import { SSEManager } from "@/client/sse";

import { loadSessionMessages } from "@/hooks/useSessionLoader";
import { useMessageStore } from "@/stores/messageStore";
import { useProjectStore } from "@/stores/projectStore";
import { useSessionStore } from "@/stores/sessionStore";
import { resetAllStores } from "@/test/setup";
import { processMessages } from "@/transcript/processMessages";

// ---------------------------------------------------------------------------
// Server lifecycle
// ---------------------------------------------------------------------------

type Client = ReturnType<typeof buildClient>;

let client: Client;
let serverClose: () => void;
let serverUrl: string;
const DIR = process.cwd();

beforeAll(async () => {
  const port = 10000 + Math.floor(Math.random() * 50000);
  delete process.env.OPENCODE_SERVER_PASSWORD;
  const opencode = await createOpencode({ port });
  serverUrl = opencode.server.url;
  serverClose = () => opencode.server.close();
  client = buildClient({ baseUrl: serverUrl });
}, 30_000);

afterAll(() => {
  serverClose?.();
});

// Track sessions for cleanup
const createdSessionIds: string[] = [];
afterAll(async () => {
  for (const id of createdSessionIds) {
    await client.session.delete({ sessionID: id, directory: DIR }).catch(() => undefined);
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createSession(title?: string) {
  const result = await client.session.create({
    directory: DIR,
    ...(title ? { title } : {}),
  });
  const session = result.data!;
  createdSessionIds.push(session.id);
  return session;
}

async function listSessions() {
  const result = await client.session.list({ directory: DIR });
  return (
    (result.data as Array<{
      id: string;
      title?: string;
      time?: { created: number; updated: number };
    }>) ?? []
  );
}

// ---------------------------------------------------------------------------
// Suite 1: loadSessionMessages — the exact function ChatScreen calls
// ---------------------------------------------------------------------------

describe("Real flow: loadSessionMessages", () => {
  beforeEach(resetAllStores);

  it("loads messages from a real session into the messageStore", async () => {
    const session = await createSession("Load test");

    // Call the exact function ChatScreen's useEffect calls
    await loadSessionMessages(client, session.id, DIR);

    const stored = useMessageStore.getState().messagesBySession[session.id];
    expect(stored).toBeDefined();
    // New session has 0 messages — that's fine, the point is no crash
    expect(Array.isArray(stored)).toBe(true);
  });

  it("does NOT double-fetch for the same session (deduplication)", async () => {
    const session = await createSession("Dedup test");

    // First call populates the store
    await loadSessionMessages(client, session.id, DIR);

    // Spy on the client to verify no second fetch
    const spy = jest.spyOn(client.session, "messages");
    await loadSessionMessages(client, session.id, DIR);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("force=true re-fetches even when already loaded", async () => {
    const session = await createSession("Force test");

    await loadSessionMessages(client, session.id, DIR);

    const spy = jest.spyOn(client.session, "messages");
    await loadSessionMessages(client, session.id, DIR, { force: true });
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("concurrent calls for the same session only fetch once", async () => {
    const session = await createSession("Concurrent test");

    const spy = jest.spyOn(client.session, "messages");
    // Fire two concurrent calls
    await Promise.all([
      loadSessionMessages(client, session.id, DIR, { force: true }),
      loadSessionMessages(client, session.id, DIR, { force: true }),
    ]);
    // Only one actual HTTP request should have been made
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("does not crash when client is null", async () => {
    await expect(loadSessionMessages(null, "fake-id", DIR)).resolves.toBeUndefined();
  });

  it("does not crash when sessionId is empty", async () => {
    await expect(loadSessionMessages(client, "", DIR)).resolves.toBeUndefined();
  });

  it("does not crash when directory is empty", async () => {
    await expect(loadSessionMessages(client, "fake-id", "")).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Suite 2: SSEManager — real server connection
// ---------------------------------------------------------------------------

describe("Real flow: SSEManager", () => {
  it("connects to real server and fires onStatusChange('connected')", async () => {
    const onEvent = jest.fn();
    const onStatusChange = jest.fn();
    const manager = new SSEManager({
      client,
      directory: DIR,
      onEvent,
      onStatusChange,
    });

    manager.start();
    await new Promise((r) => setTimeout(r, 800));

    expect(onStatusChange).toHaveBeenCalledWith("connected");
    manager.stop();
    expect(onStatusChange).toHaveBeenCalledWith("disconnected");
  }, 10_000);

  it("start() is idempotent — second call does not double-subscribe", async () => {
    const spy = jest.spyOn(client.event, "subscribe");
    const manager = new SSEManager({
      client,
      directory: DIR,
      onEvent: jest.fn(),
      onStatusChange: jest.fn(),
    });

    manager.start();
    manager.start(); // second call should be no-op
    await new Promise((r) => setTimeout(r, 300));

    expect(spy).toHaveBeenCalledTimes(1);
    manager.stop();
    spy.mockRestore();
  }, 5_000);

  it("stop() cleans up without error", () => {
    const manager = new SSEManager({
      client,
      directory: DIR,
      onEvent: jest.fn(),
      onStatusChange: jest.fn(),
    });
    manager.start();
    expect(() => manager.stop()).not.toThrow();
  });

  it("stop() before start() does not crash", () => {
    const manager = new SSEManager({
      client,
      directory: DIR,
      onEvent: jest.fn(),
      onStatusChange: jest.fn(),
    });
    expect(() => manager.stop()).not.toThrow();
  });

  it("event.subscribe returns object with iterable stream", async () => {
    const result = await client.event.subscribe({ directory: DIR });
    expect(result).toBeDefined();
    const stream = (result as { stream?: unknown }).stream ?? result;
    expect(stream && typeof stream === "object" && Symbol.asyncIterator in stream).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Suite 3: Session list → store population → message loading (full flow)
// ---------------------------------------------------------------------------

describe("Real flow: session list → store → messages", () => {
  beforeEach(resetAllStores);

  it("full flow: create session → list → populate store → load messages", async () => {
    // Step 1: Create a session (simulates user clicking "New Session")
    const session = await createSession("Full flow test");

    // Step 2: List sessions (simulates useSessions.useEffect on mount)
    const sessions = await listSessions();
    expect(sessions.find((s) => s.id === session.id)).toBeDefined();

    // Step 3: Populate sessionStore (simulates setSessions in useSessions)
    useSessionStore.getState().setSessions(DIR, sessions as never[]);
    const stored = useSessionStore.getState().sessionsByDirectory[DIR];
    expect(stored?.find((s) => s.id === session.id)).toBeDefined();

    // Step 4: Load messages (simulates ChatScreen useEffect)
    await loadSessionMessages(client, session.id, DIR);
    const messages = useMessageStore.getState().messagesBySession[session.id];
    expect(messages).toBeDefined();
    expect(Array.isArray(messages)).toBe(true);
  });

  it("sessions with undefined time do not crash setSessions sort", async () => {
    // Simulate what happens when the API returns sessions with missing time
    const sessionsWithBadTime = [
      { id: "bad-1", title: "Bad", time: undefined },
      { id: "bad-2", title: "Also Bad" },
    ];
    expect(() =>
      useSessionStore.getState().setSessions(DIR, sessionsWithBadTime as never[]),
    ).not.toThrow();
  });

  it("processMessages does not crash with undefined time (regression)", async () => {
    const session = await createSession("Time regression");
    const messages = [
      {
        id: "m1",
        sessionID: session.id,
        role: "user",
        time: undefined,
      },
      {
        id: "m2",
        sessionID: session.id,
        role: "assistant",
        time: { created: 1000, updated: 1000 },
      },
    ] as never[];

    expect(() => processMessages(messages, {})).not.toThrow();
    const result = processMessages(messages, {});
    expect(result).toHaveLength(2);
  });

  it("clearSession removes messages AND parts (no memory leak)", async () => {
    const session = await createSession("Leak test");
    const fakeMsg = { id: "leak-msg", sessionID: session.id, role: "user" };
    const fakePart = { id: "leak-part", type: "text", text: "hello", messageID: "leak-msg" };

    useMessageStore.getState().setMessages(session.id, [fakeMsg] as never[]);
    useMessageStore.getState().upsertPart(session.id, "leak-msg", fakePart as never);

    expect(useMessageStore.getState().partsByMessage["leak-msg"]).toBeDefined();

    useMessageStore.getState().clearSession(session.id);

    expect(useMessageStore.getState().messagesBySession[session.id]).toBeUndefined();
    expect(useMessageStore.getState().partsByMessage["leak-msg"]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Suite 4: Pre-existing sessions (the bug the user reported)
// ---------------------------------------------------------------------------

describe("Real flow: pre-existing sessions across server restarts", () => {
  let PERSIST_DIR: string;

  beforeAll(() => {
    PERSIST_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "gabi-persist-"));
  });

  it("sessions created on server A are visible on server B", async () => {
    // Server 1: create sessions
    const port1 = 10000 + Math.floor(Math.random() * 50000);
    delete process.env.OPENCODE_SERVER_PASSWORD;
    const oc1 = await createOpencode({ port: port1 });
    const c1 = buildClient({ baseUrl: oc1.server.url });

    const s1 = await c1.session.create({ directory: PERSIST_DIR });
    const s2 = await c1.session.create({ directory: PERSIST_DIR });
    const id1 = s1.data!.id;
    const id2 = s2.data!.id;

    oc1.server.close();
    await new Promise((r) => setTimeout(r, 300));

    // Server 2: fresh instance
    const port2 = 10000 + Math.floor(Math.random() * 50000);
    const oc2 = await createOpencode({ port: port2 });
    const c2 = buildClient({ baseUrl: oc2.server.url });

    const sessions = await c2.session.list({ directory: PERSIST_DIR });
    const list = (sessions.data as Array<{ id: string }>) ?? [];

    expect(list.find((s) => s.id === id1)).toBeDefined();
    expect(list.find((s) => s.id === id2)).toBeDefined();

    // Cleanup
    await c2.session.delete({ sessionID: id1, directory: PERSIST_DIR }).catch(() => undefined);
    await c2.session.delete({ sessionID: id2, directory: PERSIST_DIR }).catch(() => undefined);
    oc2.server.close();
  }, 60_000);

  it("store correctly populates from pre-existing session list", async () => {
    const port = 10000 + Math.floor(Math.random() * 50000);
    delete process.env.OPENCODE_SERVER_PASSWORD;
    const oc = await createOpencode({ port });
    const c = buildClient({ baseUrl: oc.server.url });

    // Create sessions as if they pre-existed
    const s1 = await c.session.create({ directory: PERSIST_DIR });
    const s2 = await c.session.create({ directory: PERSIST_DIR });

    // Simulate what useSessions does on mount
    const result = await c.session.list({ directory: PERSIST_DIR });
    const list = (result.data as Array<{ id: string }>) ?? [];

    resetAllStores();
    useSessionStore.getState().setSessions(PERSIST_DIR, list as never[]);

    const stored = useSessionStore.getState().sessionsByDirectory[PERSIST_DIR] ?? [];
    expect(stored.find((s) => s.id === s1.data!.id)).toBeDefined();
    expect(stored.find((s) => s.id === s2.data!.id)).toBeDefined();

    // Then load messages for the first session (simulates navigating to it)
    await loadSessionMessages(c, s1.data!.id, PERSIST_DIR);
    const msgs = useMessageStore.getState().messagesBySession[s1.data!.id];
    expect(msgs).toBeDefined();
    expect(Array.isArray(msgs)).toBe(true);

    // Cleanup
    await c.session
      .delete({ sessionID: s1.data!.id, directory: PERSIST_DIR })
      .catch(() => undefined);
    await c.session
      .delete({ sessionID: s2.data!.id, directory: PERSIST_DIR })
      .catch(() => undefined);
    oc.server.close();
  }, 30_000);
});

// ---------------------------------------------------------------------------
// Suite 5: Multi-session message isolation (real server)
// ---------------------------------------------------------------------------

describe("Real flow: multi-session message isolation", () => {
  beforeEach(resetAllStores);

  it("loading messages for session A does not affect session B store", async () => {
    const sA = await createSession("Session A");
    const sB = await createSession("Session B");

    await loadSessionMessages(client, sA.id, DIR);
    await loadSessionMessages(client, sB.id, DIR);

    const msgsA = useMessageStore.getState().messagesBySession[sA.id];
    const msgsB = useMessageStore.getState().messagesBySession[sB.id];

    expect(msgsA).toBeDefined();
    expect(msgsB).toBeDefined();
    // Each session has its own independent message array
    expect(msgsA).not.toBe(msgsB);
  });

  it("clearing session A messages does not affect session B", async () => {
    const sA = await createSession("Clear A");
    const sB = await createSession("Keep B");

    await loadSessionMessages(client, sA.id, DIR);
    await loadSessionMessages(client, sB.id, DIR);

    useMessageStore.getState().clearSession(sA.id);

    expect(useMessageStore.getState().messagesBySession[sA.id]).toBeUndefined();
    expect(useMessageStore.getState().messagesBySession[sB.id]).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Suite 6: Multi-project isolation (real server)
// ---------------------------------------------------------------------------

describe("Real flow: multi-project isolation", () => {
  let DIR_A: string;
  let DIR_B: string;

  beforeAll(() => {
    DIR_A = fs.mkdtempSync(path.join(os.tmpdir(), "gabi-proj-a-"));
    DIR_B = fs.mkdtempSync(path.join(os.tmpdir(), "gabi-proj-b-"));
  });

  beforeEach(resetAllStores);

  it("sessions in project A are not visible in project B", async () => {
    const sA = await client.session.create({ directory: DIR_A });
    createdSessionIds.push(sA.data!.id);

    const listB = await client.session.list({ directory: DIR_B });
    const sessionsB = (listB.data as Array<{ id: string }>) ?? [];

    expect(sessionsB.find((s) => s.id === sA.data!.id)).toBeUndefined();

    await client.session
      .delete({ sessionID: sA.data!.id, directory: DIR_A })
      .catch(() => undefined);
  });

  it("store isolates sessions per directory", async () => {
    const sA = await client.session.create({ directory: DIR_A });
    const sB = await client.session.create({ directory: DIR_B });
    createdSessionIds.push(sA.data!.id, sB.data!.id);

    const listA = await client.session.list({ directory: DIR_A });
    const listB = await client.session.list({ directory: DIR_B });

    useSessionStore.getState().setSessions(DIR_A, (listA.data as never[]) ?? []);
    useSessionStore.getState().setSessions(DIR_B, (listB.data as never[]) ?? []);

    const storedA = useSessionStore.getState().sessionsByDirectory[DIR_A] ?? [];
    const storedB = useSessionStore.getState().sessionsByDirectory[DIR_B] ?? [];

    expect(storedA.find((s) => s.id === sA.data!.id)).toBeDefined();
    expect(storedA.find((s) => s.id === sB.data!.id)).toBeUndefined();
    expect(storedB.find((s) => s.id === sB.data!.id)).toBeDefined();
    expect(storedB.find((s) => s.id === sA.data!.id)).toBeUndefined();

    await client.session
      .delete({ sessionID: sA.data!.id, directory: DIR_A })
      .catch(() => undefined);
    await client.session
      .delete({ sessionID: sB.data!.id, directory: DIR_B })
      .catch(() => undefined);
  });

  it("project store holds both projects independently", () => {
    const pA = useProjectStore.getState().addProject("Alpha", DIR_A);
    const pB = useProjectStore.getState().addProject("Beta", DIR_B);

    expect(useProjectStore.getState().projects.find((p) => p.id === pA.id)?.directory).toBe(DIR_A);
    expect(useProjectStore.getState().projects.find((p) => p.id === pB.id)?.directory).toBe(DIR_B);
  });
});

// ---------------------------------------------------------------------------
// Suite 7: Performance with real server
// ---------------------------------------------------------------------------

describe("Real flow: performance", () => {
  it("health check < 200ms", async () => {
    const start = Date.now();
    await client.global.health();
    expect(Date.now() - start).toBeLessThan(200);
  });

  it("session.create < 1000ms", async () => {
    const start = Date.now();
    const s = await createSession("Perf create");
    expect(Date.now() - start).toBeLessThan(1000);
    await client.session.delete({ sessionID: s.id, directory: DIR }).catch(() => undefined);
  });

  it("session.list < 500ms", async () => {
    const start = Date.now();
    await listSessions();
    expect(Date.now() - start).toBeLessThan(500);
  });

  it("loadSessionMessages < 1000ms for empty session", async () => {
    const s = await createSession("Perf messages");
    resetAllStores();
    const start = Date.now();
    await loadSessionMessages(client, s.id, DIR);
    expect(Date.now() - start).toBeLessThan(1000);
  });

  it("SSEManager connects in < 2000ms", async () => {
    const onStatusChange = jest.fn();
    const manager = new SSEManager({
      client,
      directory: DIR,
      onEvent: jest.fn(),
      onStatusChange,
    });

    const start = Date.now();
    manager.start();
    await new Promise((r) => setTimeout(r, 1500));
    const elapsed = Date.now() - start;

    expect(onStatusChange).toHaveBeenCalledWith("connected");
    expect(elapsed).toBeLessThan(2000);
    manager.stop();
  }, 5_000);
});
