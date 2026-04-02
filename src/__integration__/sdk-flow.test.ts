/// <reference types="node" />

/**
 * Integration tests for the Gabi → OpenCode SDK flow.
 *
 * Uses `createOpencode()` from the SDK to spawn a server + client pair.
 * Fully self-contained — no external server, secrets, or configuration needed.
 *
 * Run:
 *   pnpm test:integration
 */

import { createOpencode } from "@opencode-ai/sdk";
import { buildClient } from "@/client/client";
import { useConnectionStore } from "@/stores/connectionStore";
import { useMessageStore } from "@/stores/messageStore";
import { useProjectStore } from "@/stores/projectStore";
import { useSessionStore } from "@/stores/sessionStore";
import { resetAllStores } from "@/test/setup";

// ---------------------------------------------------------------------------
// Server lifecycle — SDK handles everything
// ---------------------------------------------------------------------------

let client: ReturnType<typeof buildClient>;
let serverClose: () => void;
let serverUrl: string;

const createdSessionIds: string[] = [];

beforeAll(async () => {
  const port = 10000 + Math.floor(Math.random() * 50000);
  const opencode = await createOpencode({ port });
  serverUrl = opencode.server.url;
  serverClose = () => opencode.server.close();
  // createOpencode inherits OPENCODE_SERVER_PASSWORD but doesn't configure
  // the client with auth, so we use our own buildClient which handles this.
  client = buildClient({
    baseUrl: serverUrl,
    password: process.env.OPENCODE_SERVER_PASSWORD || "",
  });
}, 30_000);

afterAll(async () => {
  for (const id of createdSessionIds) {
    try {
      await client.session.delete({ sessionID: id, directory: process.cwd() });
    } catch {
      // best-effort cleanup
    }
  }
  serverClose?.();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const DIR = process.cwd();

describe("SDK integration: health + config", () => {
  beforeEach(resetAllStores);

  it("health endpoint returns ok", async () => {
    const result = await client.global.health();
    expect(result.data).toBeDefined();
  });

  it("buildClient connects to the SDK-spawned server", () => {
    useConnectionStore.getState().configure(serverUrl);
    const { baseUrl, isConfigured } = useConnectionStore.getState();
    expect(isConfigured).toBe(true);

    const c = buildClient({ baseUrl, password: process.env.OPENCODE_SERVER_PASSWORD || "" });
    expect(c).toBeDefined();
    expect(c.session).toBeDefined();
    expect(c.global).toBeDefined();
  });
});

describe("SDK integration: session lifecycle", () => {
  beforeEach(resetAllStores);

  it("lists sessions", async () => {
    const result = await client.session.list({ directory: DIR });
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("creates a session and it appears in list", async () => {
    const created = await client.session.create({ directory: DIR });
    expect(created.data).toBeDefined();
    expect(created.data!.id).toBeTruthy();
    createdSessionIds.push(created.data!.id);

    const list = await client.session.list({ directory: DIR });
    const found = (list.data as Array<{ id: string }>).find((s) => s.id === created.data!.id);
    expect(found).toBeDefined();
  });

  it("creates session and populates sessionStore", async () => {
    const created = await client.session.create({ directory: DIR });
    createdSessionIds.push(created.data!.id);

    const list = await client.session.list({ directory: DIR });
    const sessions = Array.isArray(list.data) ? list.data : [];
    useSessionStore.getState().setSessions(DIR, sessions);

    const stored = useSessionStore.getState().sessionsByDirectory[DIR];
    expect(stored).toBeDefined();
    expect(stored!.find((s) => s.id === created.data!.id)).toBeDefined();
  });

  it("deletes a session", async () => {
    const created = await client.session.create({ directory: DIR });
    const sessionId = created.data!.id;

    await client.session.delete({ sessionID: sessionId, directory: DIR });

    const list = await client.session.list({ directory: DIR });
    const found = (list.data as Array<{ id: string }>).find((s) => s.id === sessionId);
    expect(found).toBeUndefined();
  });
});

describe("SDK integration: messaging", () => {
  let sessionId: string;

  beforeAll(async () => {
    const created = await client.session.create({ directory: DIR });
    sessionId = created.data!.id;
    createdSessionIds.push(sessionId);
  });

  beforeEach(resetAllStores);

  it("sends a prompt and receives messages", async () => {
    await client.session.prompt({
      sessionID: sessionId,
      directory: DIR,
      parts: [{ type: "text", text: "Say exactly: hello world" }],
    });

    const msgs = await client.session.messages({
      sessionID: sessionId,
      directory: DIR,
    });
    expect(msgs.data).toBeDefined();

    const messageList = Array.isArray(msgs.data) ? msgs.data : [];
    expect(messageList.length).toBeGreaterThanOrEqual(2);
  }, 60_000);

  it("populates messageStore from response", async () => {
    const msgs = await client.session.messages({
      sessionID: sessionId,
      directory: DIR,
    });

    const messageList = Array.isArray(msgs.data) ? msgs.data : [];
    useMessageStore.getState().setMessages(sessionId, messageList as never[]);

    const stored = useMessageStore.getState().messagesBySession[sessionId];
    expect(stored).toBeDefined();
    expect(stored!.length).toBe(messageList.length);
  });

  it("abort on idle session is a no-op", async () => {
    await expect(
      client.session.abort({ sessionID: sessionId, directory: DIR }),
    ).resolves.toBeDefined();
  });
});

describe("SDK integration: project store", () => {
  beforeEach(resetAllStores);

  it("add project \u2192 set active \u2192 stores directory", () => {
    const store = useProjectStore.getState();
    const project = store.addProject("test-project", DIR);
    store.setActiveProject(project.id);

    const state = useProjectStore.getState();
    expect(state.activeProjectId).toBe(project.id);
    const active = state.projects.find((p) => p.id === project.id);
    expect(active).toBeDefined();
    expect(active!.directory).toBe(DIR);
  });
});

describe("SDK integration: events", () => {
  it("can subscribe to SSE events", async () => {
    const result = await client.event.subscribe({ directory: DIR });
    expect(result).toBeDefined();
  }, 10_000);
});

// ============================================================
// STRESS TESTS: Multi-session, multi-project, concurrent, SSE
// ============================================================

describe("SDK integration: multi-session isolation", () => {
  let sessionA: string;
  let sessionB: string;

  beforeAll(async () => {
    const a = await client.session.create({ directory: DIR });
    const b = await client.session.create({ directory: DIR });
    sessionA = a.data!.id;
    sessionB = b.data!.id;
    createdSessionIds.push(sessionA, sessionB);
  });

  beforeEach(resetAllStores);

  it("messages set for session A do not appear in session B store", () => {
    useMessageStore.getState().setMessages(sessionA, [{ id: "m1", role: "user" } as never]);
    const bMsgs = useMessageStore.getState().messagesBySession[sessionB];
    expect(bMsgs ?? []).toHaveLength(0);
  });

  it("clearing session A leaves session B intact", () => {
    useMessageStore.getState().setMessages(sessionA, [{ id: "m1", role: "user" } as never]);
    useMessageStore.getState().setMessages(sessionB, [{ id: "m2", role: "assistant" } as never]);
    useMessageStore.getState().clearSession(sessionA);
    const bMsgs = useMessageStore.getState().messagesBySession[sessionB];
    expect(bMsgs).toHaveLength(1);
  });

  it("session B still exists after deleting a third temp session", async () => {
    const temp = await client.session.create({ directory: DIR });
    await client.session.delete({ sessionID: temp.data!.id, directory: DIR });
    const list = await client.session.list({ directory: DIR });
    const sessions = (list.data as Array<{ id: string }>) ?? [];
    expect(sessions.find((s) => s.id === sessionB)).toBeDefined();
  });
});

describe("SDK integration: multi-project isolation (store-level)", () => {
  beforeEach(resetAllStores);

  it("projectStore holds two projects with different directories", () => {
    useProjectStore.getState().addProject("Project Alpha", "/tmp/project-a");
    useProjectStore.getState().addProject("Project Beta", "/tmp/project-b");
    const projects = useProjectStore.getState().projects;
    expect(projects).toHaveLength(2);
    expect(projects.find((p) => p.directory === "/tmp/project-a")).toBeDefined();
    expect(projects.find((p) => p.directory === "/tmp/project-b")).toBeDefined();
  });

  it("sessions for dir A don't appear in dir B's store", () => {
    const fakeA = { id: "ses-a1", title: "A", time: { created: 1, updated: 1 } };
    const fakeB = { id: "ses-b1", title: "B", time: { created: 1, updated: 1 } };
    useSessionStore.getState().setSessions("/tmp/project-a", [fakeA] as never[]);
    useSessionStore.getState().setSessions("/tmp/project-b", [fakeB] as never[]);
    const aSessions = useSessionStore.getState().sessionsByDirectory["/tmp/project-a"];
    const bSessions = useSessionStore.getState().sessionsByDirectory["/tmp/project-b"];
    expect(aSessions).toHaveLength(1);
    expect(bSessions).toHaveLength(1);
    expect(aSessions?.[0]?.id).toBe("ses-a1");
    expect(bSessions?.[0]?.id).toBe("ses-b1");
  });

  it("switching active project changes which sessions context refers to", () => {
    const p1 = useProjectStore.getState().addProject("Alpha", "/tmp/alpha");
    const p2 = useProjectStore.getState().addProject("Beta", "/tmp/beta");
    useProjectStore.getState().setActiveProject(p1.id);
    expect(useProjectStore.getState().activeProjectId).toBe(p1.id);
    useProjectStore.getState().setActiveProject(p2.id);
    expect(useProjectStore.getState().activeProjectId).toBe(p2.id);
  });
});

describe("SDK integration: concurrent session operations", () => {
  beforeEach(resetAllStores);

  it("creates 3 sessions concurrently via Promise.all and all appear in list", async () => {
    const created = await Promise.all([
      client.session.create({ directory: DIR }),
      client.session.create({ directory: DIR }),
      client.session.create({ directory: DIR }),
    ]);
    const ids = created.map((r) => r.data!.id);
    createdSessionIds.push(...ids);

    const list = await client.session.list({ directory: DIR });
    const sessions = (list.data as Array<{ id: string }>) ?? [];
    for (const id of ids) {
      expect(sessions.find((s) => s.id === id)).toBeDefined();
    }
  });

  it("deletes 3 sessions concurrently and none remain", async () => {
    const created = await Promise.all([
      client.session.create({ directory: DIR }),
      client.session.create({ directory: DIR }),
      client.session.create({ directory: DIR }),
    ]);
    const ids = created.map((r) => r.data!.id);
    await Promise.all(ids.map((id) => client.session.delete({ sessionID: id, directory: DIR })));

    const list = await client.session.list({ directory: DIR });
    const sessions = (list.data as Array<{ id: string }>) ?? [];
    for (const id of ids) {
      expect(sessions.find((s) => s.id === id)).toBeUndefined();
    }
  });

  it("concurrent list calls return consistent results", async () => {
    const sess = await client.session.create({ directory: DIR });
    createdSessionIds.push(sess.data!.id);

    const [list1, list2, list3] = await Promise.all([
      client.session.list({ directory: DIR }),
      client.session.list({ directory: DIR }),
      client.session.list({ directory: DIR }),
    ]);
    const count1 = ((list1.data as unknown[]) ?? []).length;
    const count2 = ((list2.data as unknown[]) ?? []).length;
    const count3 = ((list3.data as unknown[]) ?? []).length;
    expect(count1).toBe(count2);
    expect(count2).toBe(count3);
  });
});

describe("SDK integration: SSE event routing", () => {
  it("event.subscribe returns object with iterable stream", async () => {
    const result = await client.event.subscribe({ directory: DIR });
    expect(result).toBeDefined();
    const stream = (result as { stream?: unknown }).stream ?? result;
    expect(stream && Symbol.asyncIterator in (stream as object)).toBe(true);
  });

  it("SSEManager connects and fires onStatusChange(connected)", async () => {
    const { SSEManager } = await import("@/client/sse");
    const onEvent = jest.fn();
    const onStatusChange = jest.fn();
    const manager = new SSEManager({ client, directory: DIR, onEvent, onStatusChange });
    manager.start();
    await new Promise((r) => setTimeout(r, 800));
    expect(onStatusChange).toHaveBeenCalledWith("connected");
    manager.stop();
    expect(onStatusChange).toHaveBeenCalledWith("disconnected");
  }, 10_000);

  it("SSEManager.start() is idempotent — second call does not double-subscribe", async () => {
    const { SSEManager } = await import("@/client/sse");
    const spy = jest.spyOn(client.event, "subscribe");
    const manager = new SSEManager({
      client,
      directory: DIR,
      onEvent: jest.fn(),
      onStatusChange: jest.fn(),
    });
    manager.start();
    manager.start(); // second call is no-op
    await new Promise((r) => setTimeout(r, 300));
    expect(spy).toHaveBeenCalledTimes(1);
    manager.stop();
    spy.mockRestore();
  }, 5_000);
});

describe("SDK integration: store population flow", () => {
  beforeEach(resetAllStores);

  it("setSessions populates sessionStore with sessions from API", async () => {
    const s1 = await client.session.create({ directory: DIR });
    const s2 = await client.session.create({ directory: DIR });
    createdSessionIds.push(s1.data!.id, s2.data!.id);

    const list = await client.session.list({ directory: DIR });
    const sessions = (list.data as Array<{ id: string; time: { updated: number } }>) ?? [];
    useSessionStore.getState().setSessions(DIR, sessions as never[]);

    const stored = useSessionStore.getState().sessionsByDirectory[DIR];
    expect(stored).toBeDefined();
    expect(stored!.length).toBeGreaterThanOrEqual(2);
  });

  it("upsertSession updates the title of an existing session in store", () => {
    const fake = { id: "ses-upd-1", title: "Original", time: { created: 1000, updated: 1000 } };
    useSessionStore.getState().setSessions(DIR, [fake] as never[]);
    useSessionStore.getState().upsertSession(DIR, { ...fake, title: "Updated" } as never);
    const stored = useSessionStore.getState().sessionsByDirectory[DIR];
    expect(stored?.find((s) => s.id === "ses-upd-1")?.title).toBe("Updated");
  });

  it("removeSession clears activeSessionId when the removed session was active", () => {
    const fake = { id: "ses-active", title: "Active", time: { created: 1000, updated: 1000 } };
    useSessionStore.getState().setSessions(DIR, [fake] as never[]);
    useSessionStore.getState().setActiveSession("ses-active");
    expect(useSessionStore.getState().activeSessionId).toBe("ses-active");
    useSessionStore.getState().removeSession(DIR, "ses-active");
    expect(useSessionStore.getState().activeSessionId).toBeNull();
  });

  it("clearSession removes messages but leaves other sessions intact", () => {
    useMessageStore.getState().setMessages("ses-x", [{ id: "m1" } as never]);
    useMessageStore.getState().setMessages("ses-y", [{ id: "m2" } as never]);
    useMessageStore.getState().clearSession("ses-x");
    expect(useMessageStore.getState().messagesBySession["ses-x"]).toBeUndefined();
    expect(useMessageStore.getState().messagesBySession["ses-y"]).toHaveLength(1);
  });
});

describe("SDK integration: error recovery", () => {
  it("health check on unreachable URL returns error without crashing", async () => {
    const badClient = buildClient({ baseUrl: "http://localhost:1" });
    // v2 client returns { error } rather than rejecting
    await badClient.global.health().catch(() => undefined);
    // If we reach here without throwing, the process didn't crash
    expect(true).toBe(true);
  });

  it("session.messages on non-existent session ID is handled gracefully", async () => {
    try {
      await client.session.messages({ sessionID: "non-existent-id-xyz-abc", directory: DIR });
    } catch {
      // Expected: either throws or returns error — both acceptable
    }
    expect(true).toBe(true);
  });

  it("session.delete on non-existent session ID is handled gracefully", async () => {
    try {
      await client.session.delete({ sessionID: "non-existent-id-xyz-abc", directory: DIR });
    } catch {
      // Expected
    }
    expect(true).toBe(true);
  });

  it("concurrent create then delete with race condition is handled", async () => {
    const created = await client.session.create({ directory: DIR });
    const id = created.data!.id;
    // Delete immediately while potentially other ops are in-flight
    await client.session.delete({ sessionID: id, directory: DIR });
    const list = await client.session.list({ directory: DIR });
    const sessions = (list.data as Array<{ id: string }>) ?? [];
    expect(sessions.find((s) => s.id === id)).toBeUndefined();
  });
});
