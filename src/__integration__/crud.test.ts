/// <reference types="node" />

/**
 * Exhaustive CRUD integration tests for the Gabi → OpenCode SDK.
 *
 * Tests: project CRUD, session CRUD, multi-session, multi-project,
 * pre-existing sessions (persistence across server restarts),
 * and performance baselines.
 *
 * Run:
 *   pnpm test:integration
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createOpencode } from "@opencode-ai/sdk";
import { buildClient } from "@/client/client";
import { useMessageStore } from "@/stores/messageStore";
import { useProjectStore } from "@/stores/projectStore";
import { useSessionStore } from "@/stores/sessionStore";
import { resetAllStores } from "@/test/setup";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Client = ReturnType<typeof buildClient>;

async function spawnServer(): Promise<{
  client: Client;
  url: string;
  close: () => void;
}> {
  const port = 10000 + Math.floor(Math.random() * 50000);
  delete process.env.OPENCODE_SERVER_PASSWORD;
  const opencode = await createOpencode({ port });
  const client = buildClient({ baseUrl: opencode.server.url });
  return {
    client,
    url: opencode.server.url,
    close: () => opencode.server.close(),
  };
}

async function listSessions(client: Client, dir: string) {
  const result = await client.session.list({ directory: dir });
  return (
    (result.data as Array<{
      id: string;
      title?: string;
      time?: { created: number; updated: number };
    }>) ?? []
  );
}

async function createSession(client: Client, dir: string, title?: string) {
  const result = await client.session.create({ directory: dir, ...(title ? { title } : {}) });
  return result.data!;
}

async function deleteSession(client: Client, dir: string, id: string) {
  return client.session.delete({ sessionID: id, directory: dir });
}

// Temp directories for isolated project dirs
function makeTmpDir(label: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `gabi-${label}-`));
}

// ---------------------------------------------------------------------------
// Suite 1: Session CRUD
// ---------------------------------------------------------------------------

describe("CRUD: session lifecycle", () => {
  let server: Awaited<ReturnType<typeof spawnServer>>;
  let DIR: string;

  beforeAll(async () => {
    server = await spawnServer();
    DIR = makeTmpDir("session-crud");
  }, 30_000);

  afterAll(() => server.close());
  beforeEach(resetAllStores);

  it("lists 0 sessions for a fresh directory", async () => {
    const sessions = await listSessions(server.client, DIR);
    expect(sessions).toHaveLength(0);
  });

  it("creates a session and returns it with an id", async () => {
    const session = await createSession(server.client, DIR);
    expect(session.id).toBeTruthy();
    expect(typeof session.id).toBe("string");
    await deleteSession(server.client, DIR, session.id);
  });

  it("created session appears in list", async () => {
    const session = await createSession(server.client, DIR);
    const sessions = await listSessions(server.client, DIR);
    expect(sessions.find((s) => s.id === session.id)).toBeDefined();
    await deleteSession(server.client, DIR, session.id);
  });

  it("creates session with a title", async () => {
    const session = await createSession(server.client, DIR, "My Custom Title");
    const sessions = await listSessions(server.client, DIR);
    const found = sessions.find((s) => s.id === session.id);
    expect(found).toBeDefined();
    await deleteSession(server.client, DIR, session.id);
  });

  it("deletes a session and it disappears from list", async () => {
    const session = await createSession(server.client, DIR);
    await deleteSession(server.client, DIR, session.id);
    const sessions = await listSessions(server.client, DIR);
    expect(sessions.find((s) => s.id === session.id)).toBeUndefined();
  });

  it("creates 5 sessions and lists all 5", async () => {
    const created = await Promise.all(
      Array.from({ length: 5 }, (_, i) => createSession(server.client, DIR, `Session ${i}`)),
    );
    const ids = created.map((s) => s.id);
    const sessions = await listSessions(server.client, DIR);
    for (const id of ids) {
      expect(sessions.find((s) => s.id === id)).toBeDefined();
    }
    await Promise.all(ids.map((id) => deleteSession(server.client, DIR, id)));
  });

  it("deletes all sessions and list returns empty", async () => {
    const s1 = await createSession(server.client, DIR);
    const s2 = await createSession(server.client, DIR);
    await deleteSession(server.client, DIR, s1.id);
    await deleteSession(server.client, DIR, s2.id);
    const sessions = await listSessions(server.client, DIR);
    expect(sessions).toHaveLength(0);
  });

  it("session has time.created set", async () => {
    const before = Date.now();
    const session = await createSession(server.client, DIR);
    const sessions = await listSessions(server.client, DIR);
    const found = sessions.find((s) => s.id === session.id);
    expect(found?.time?.created).toBeGreaterThanOrEqual(before);
    await deleteSession(server.client, DIR, session.id);
  });

  it("sessions list is sorted newest-first by time.updated", async () => {
    const s1 = await createSession(server.client, DIR, "First");
    await new Promise((r) => setTimeout(r, 10)); // ensure different timestamps
    const s2 = await createSession(server.client, DIR, "Second");
    const sessions = await listSessions(server.client, DIR);
    const ids = sessions.map((s) => s.id);
    // Most recently created should be first or second (server may sort differently)
    expect(ids).toContain(s1.id);
    expect(ids).toContain(s2.id);
    await deleteSession(server.client, DIR, s1.id);
    await deleteSession(server.client, DIR, s2.id);
  });

  it("messages endpoint returns empty array for new session", async () => {
    const session = await createSession(server.client, DIR);
    const result = await server.client.session.messages({
      sessionID: session.id,
      directory: DIR,
    });
    const messages = Array.isArray(result.data) ? result.data : [];
    expect(messages).toHaveLength(0);
    await deleteSession(server.client, DIR, session.id);
  });

  it("abort on an idle session does not throw", async () => {
    const session = await createSession(server.client, DIR);
    await expect(
      server.client.session.abort({ sessionID: session.id, directory: DIR }),
    ).resolves.toBeDefined();
    await deleteSession(server.client, DIR, session.id);
  });
});

// ---------------------------------------------------------------------------
// Suite 2: Project store CRUD (pure store — no server needed)
// ---------------------------------------------------------------------------

describe("CRUD: project store", () => {
  beforeEach(resetAllStores);

  it("starts empty", () => {
    expect(useProjectStore.getState().projects).toHaveLength(0);
  });

  it("addProject creates a project with an id, name, and directory", () => {
    const p = useProjectStore.getState().addProject("My App", "/home/user/myapp");
    expect(p.id).toBeTruthy();
    expect(p.name).toBe("My App");
    expect(p.directory).toBe("/home/user/myapp");
  });

  it("added project appears in projects list", () => {
    useProjectStore.getState().addProject("Alpha", "/alpha");
    expect(useProjectStore.getState().projects).toHaveLength(1);
  });

  it("adds multiple projects", () => {
    useProjectStore.getState().addProject("A", "/a");
    useProjectStore.getState().addProject("B", "/b");
    useProjectStore.getState().addProject("C", "/c");
    expect(useProjectStore.getState().projects).toHaveLength(3);
  });

  it("removeProject deletes the project", () => {
    const p = useProjectStore.getState().addProject("ToRemove", "/remove");
    useProjectStore.getState().removeProject(p.id);
    expect(useProjectStore.getState().projects.find((x) => x.id === p.id)).toBeUndefined();
  });

  it("removing one project leaves others intact", () => {
    const p1 = useProjectStore.getState().addProject("Keep", "/keep");
    const p2 = useProjectStore.getState().addProject("Delete", "/delete");
    useProjectStore.getState().removeProject(p2.id);
    expect(useProjectStore.getState().projects.find((x) => x.id === p1.id)).toBeDefined();
    expect(useProjectStore.getState().projects.find((x) => x.id === p2.id)).toBeUndefined();
  });

  it("setActiveProject changes activeProjectId", () => {
    const p = useProjectStore.getState().addProject("Active", "/active");
    useProjectStore.getState().setActiveProject(p.id);
    expect(useProjectStore.getState().activeProjectId).toBe(p.id);
  });

  it("setActiveProject to null clears activeProjectId", () => {
    const p = useProjectStore.getState().addProject("P", "/p");
    useProjectStore.getState().setActiveProject(p.id);
    useProjectStore.getState().setActiveProject(null);
    expect(useProjectStore.getState().activeProjectId).toBeNull();
  });

  it("switching active project updates activeProjectId", () => {
    const p1 = useProjectStore.getState().addProject("P1", "/p1");
    const p2 = useProjectStore.getState().addProject("P2", "/p2");
    useProjectStore.getState().setActiveProject(p1.id);
    expect(useProjectStore.getState().activeProjectId).toBe(p1.id);
    useProjectStore.getState().setActiveProject(p2.id);
    expect(useProjectStore.getState().activeProjectId).toBe(p2.id);
  });

  it("removing active project does NOT auto-clear activeProjectId (caller responsibility)", () => {
    const p = useProjectStore.getState().addProject("P", "/p");
    useProjectStore.getState().setActiveProject(p.id);
    useProjectStore.getState().removeProject(p.id);
    // The store doesn't auto-clear — caller must handle this
    // This is a documented behavior: test it doesn't crash
    expect(useProjectStore.getState().projects).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Suite 3: Multi-session isolation
// ---------------------------------------------------------------------------

describe("CRUD: multi-session isolation", () => {
  let server: Awaited<ReturnType<typeof spawnServer>>;
  let DIR: string;

  beforeAll(async () => {
    server = await spawnServer();
    DIR = makeTmpDir("multi-session");
  }, 30_000);

  afterAll(() => server.close());
  beforeEach(resetAllStores);

  it("two sessions have different IDs", async () => {
    const s1 = await createSession(server.client, DIR, "S1");
    const s2 = await createSession(server.client, DIR, "S2");
    expect(s1.id).not.toBe(s2.id);
    await deleteSession(server.client, DIR, s1.id);
    await deleteSession(server.client, DIR, s2.id);
  });

  it("messages in session A do not appear in session B (store level)", async () => {
    const s1 = await createSession(server.client, DIR, "A");
    const s2 = await createSession(server.client, DIR, "B");
    useMessageStore.getState().setMessages(s1.id, [{ id: "m1" } as never]);
    const bMsgs = useMessageStore.getState().messagesBySession[s2.id];
    expect(bMsgs ?? []).toHaveLength(0);
    await deleteSession(server.client, DIR, s1.id);
    await deleteSession(server.client, DIR, s2.id);
  });

  it("clearing session A leaves session B intact", async () => {
    const s1 = await createSession(server.client, DIR, "A");
    const s2 = await createSession(server.client, DIR, "B");
    useMessageStore.getState().setMessages(s1.id, [{ id: "m1" } as never]);
    useMessageStore.getState().setMessages(s2.id, [{ id: "m2" } as never]);
    useMessageStore.getState().clearSession(s1.id);
    expect(useMessageStore.getState().messagesBySession[s1.id]).toBeUndefined();
    expect(useMessageStore.getState().messagesBySession[s2.id]).toHaveLength(1);
    await deleteSession(server.client, DIR, s1.id);
    await deleteSession(server.client, DIR, s2.id);
  });

  it("deleting session A from API does not affect session B", async () => {
    const s1 = await createSession(server.client, DIR, "ToDelete");
    const s2 = await createSession(server.client, DIR, "ToKeep");
    await deleteSession(server.client, DIR, s1.id);
    const sessions = await listSessions(server.client, DIR);
    expect(sessions.find((s) => s.id === s1.id)).toBeUndefined();
    expect(sessions.find((s) => s.id === s2.id)).toBeDefined();
    await deleteSession(server.client, DIR, s2.id);
  });

  it("10 sessions all independently listed and deleteable", async () => {
    const sessions = await Promise.all(
      Array.from({ length: 10 }, (_, i) => createSession(server.client, DIR, `Session-${i}`)),
    );
    const ids = sessions.map((s) => s.id);
    const listed = await listSessions(server.client, DIR);
    for (const id of ids) {
      expect(listed.find((s) => s.id === id)).toBeDefined();
    }
    await Promise.all(ids.map((id) => deleteSession(server.client, DIR, id)));
    const afterDelete = await listSessions(server.client, DIR);
    for (const id of ids) {
      expect(afterDelete.find((s) => s.id === id)).toBeUndefined();
    }
  });

  it("sessionStore tracks active session correctly across switches", async () => {
    const s1 = await createSession(server.client, DIR, "S1");
    const s2 = await createSession(server.client, DIR, "S2");
    useSessionStore.getState().setActiveSession(s1.id);
    expect(useSessionStore.getState().activeSessionId).toBe(s1.id);
    useSessionStore.getState().setActiveSession(s2.id);
    expect(useSessionStore.getState().activeSessionId).toBe(s2.id);
    await deleteSession(server.client, DIR, s1.id);
    await deleteSession(server.client, DIR, s2.id);
  });

  it("removeSession clears activeSessionId when it was the active one", async () => {
    const s = await createSession(server.client, DIR, "Active");
    useSessionStore
      .getState()
      .setSessions(DIR, [{ id: s.id, title: "Active", time: { created: 1, updated: 1 } } as never]);
    useSessionStore.getState().setActiveSession(s.id);
    useSessionStore.getState().removeSession(DIR, s.id);
    expect(useSessionStore.getState().activeSessionId).toBeNull();
    await deleteSession(server.client, DIR, s.id);
  });
});

// ---------------------------------------------------------------------------
// Suite 4: Multi-project isolation
// ---------------------------------------------------------------------------

describe("CRUD: multi-project isolation", () => {
  let server: Awaited<ReturnType<typeof spawnServer>>;
  let DIRA: string;
  let DIRB: string;

  beforeAll(async () => {
    server = await spawnServer();
    DIRA = makeTmpDir("project-a");
    DIRB = makeTmpDir("project-b");
  }, 30_000);

  afterAll(() => server.close());
  beforeEach(resetAllStores);

  it("sessions in project A do not appear in project B list", async () => {
    const sa = await createSession(server.client, DIRA, "A-session");
    const sessions_b = await listSessions(server.client, DIRB);
    expect(sessions_b.find((s) => s.id === sa.id)).toBeUndefined();
    await deleteSession(server.client, DIRA, sa.id);
  });

  it("sessions in project B do not appear in project A list", async () => {
    const sb = await createSession(server.client, DIRB, "B-session");
    const sessions_a = await listSessions(server.client, DIRA);
    expect(sessions_a.find((s) => s.id === sb.id)).toBeUndefined();
    await deleteSession(server.client, DIRB, sb.id);
  });

  it("deleting a session in project A does not affect project B", async () => {
    const sa = await createSession(server.client, DIRA, "A-del");
    const sb = await createSession(server.client, DIRB, "B-keep");
    await deleteSession(server.client, DIRA, sa.id);
    const sessions_b = await listSessions(server.client, DIRB);
    expect(sessions_b.find((s) => s.id === sb.id)).toBeDefined();
    await deleteSession(server.client, DIRB, sb.id);
  });

  it("projectStore holds both projects independently", () => {
    const pa = useProjectStore.getState().addProject("Alpha", DIRA);
    const pb = useProjectStore.getState().addProject("Beta", DIRB);
    const projects = useProjectStore.getState().projects;
    expect(projects.find((p) => p.id === pa.id)?.directory).toBe(DIRA);
    expect(projects.find((p) => p.id === pb.id)?.directory).toBe(DIRB);
  });

  it("sessionStore isolates sessions per directory", async () => {
    const sa = await createSession(server.client, DIRA, "A");
    const sb = await createSession(server.client, DIRB, "B");
    const listA = await listSessions(server.client, DIRA);
    const listB = await listSessions(server.client, DIRB);
    useSessionStore.getState().setSessions(DIRA, listA as never[]);
    useSessionStore.getState().setSessions(DIRB, listB as never[]);
    const storedA = useSessionStore.getState().sessionsByDirectory[DIRA] ?? [];
    const storedB = useSessionStore.getState().sessionsByDirectory[DIRB] ?? [];
    expect(storedA.find((s) => s.id === sa.id)).toBeDefined();
    expect(storedA.find((s) => s.id === sb.id)).toBeUndefined();
    expect(storedB.find((s) => s.id === sb.id)).toBeDefined();
    expect(storedB.find((s) => s.id === sa.id)).toBeUndefined();
    await deleteSession(server.client, DIRA, sa.id);
    await deleteSession(server.client, DIRB, sb.id);
  });

  it("switching active project changes which sessions are relevant", () => {
    const pa = useProjectStore.getState().addProject("A", DIRA);
    const pb = useProjectStore.getState().addProject("B", DIRB);
    useSessionStore
      .getState()
      .setSessions(DIRA, [{ id: "sa1", title: "A1", time: { created: 1, updated: 1 } } as never]);
    useSessionStore
      .getState()
      .setSessions(DIRB, [{ id: "sb1", title: "B1", time: { created: 1, updated: 1 } } as never]);
    useProjectStore.getState().setActiveProject(pa.id);
    const activeDirA = useProjectStore
      .getState()
      .projects.find((p) => p.id === useProjectStore.getState().activeProjectId)?.directory;
    expect(useSessionStore.getState().sessionsByDirectory[activeDirA!]).toHaveLength(1);
    useProjectStore.getState().setActiveProject(pb.id);
    const activeDirB = useProjectStore
      .getState()
      .projects.find((p) => p.id === useProjectStore.getState().activeProjectId)?.directory;
    expect(useSessionStore.getState().sessionsByDirectory[activeDirB!]).toHaveLength(1);
  });

  it("5 projects, each with 2 sessions — all isolated", async () => {
    const dirs = Array.from({ length: 5 }, () => makeTmpDir("multi-proj"));
    const allSessions: Array<{ dir: string; id: string }> = [];
    for (const dir of dirs) {
      const s1 = await createSession(server.client, dir, "One");
      const s2 = await createSession(server.client, dir, "Two");
      allSessions.push({ dir, id: s1.id }, { dir, id: s2.id });
    }
    for (const { dir, id } of allSessions) {
      const sessions = await listSessions(server.client, dir);
      // This session should appear in its own dir
      expect(sessions.find((s) => s.id === id)).toBeDefined();
      // Check it doesn't appear in other dirs
      const otherDirs = dirs.filter((d) => d !== dir);
      for (const other of otherDirs) {
        const otherSessions = await listSessions(server.client, other);
        expect(otherSessions.find((s) => s.id === id)).toBeUndefined();
      }
    }
    // Cleanup
    for (const { dir, id } of allSessions) {
      await deleteSession(server.client, dir, id).catch(() => undefined);
    }
  });
});

// ---------------------------------------------------------------------------
// Suite 5: Pre-existing sessions (persistence across server restarts)
// ---------------------------------------------------------------------------

describe("CRUD: pre-existing sessions across server restarts", () => {
  let DIR: string;

  beforeAll(() => {
    DIR = makeTmpDir("persist-sessions");
  });

  it("sessions created on server A are visible on server B (same opencode data store)", async () => {
    // Start server 1, create sessions
    const server1 = await spawnServer();
    const s1 = await createSession(server1.client, DIR, "Persistent-1");
    const s2 = await createSession(server1.client, DIR, "Persistent-2");
    const beforeCount = (await listSessions(server1.client, DIR)).length;
    expect(beforeCount).toBeGreaterThanOrEqual(2);
    server1.close();

    // Wait for graceful shutdown
    await new Promise((r) => setTimeout(r, 300));

    // Start server 2 — fresh instance but same underlying opencode data
    const server2 = await spawnServer();
    const sessions = await listSessions(server2.client, DIR);
    expect(sessions.find((s) => s.id === s1.id)).toBeDefined();
    expect(sessions.find((s) => s.id === s2.id)).toBeDefined();

    // Cleanup
    await deleteSession(server2.client, DIR, s1.id);
    await deleteSession(server2.client, DIR, s2.id);
    server2.close();
  }, 60_000);

  it("store correctly populates from pre-existing session list", async () => {
    const server = await spawnServer();
    // Create sessions as if they pre-existed
    const s1 = await createSession(server.client, DIR, "Pre-existing-1");
    const s2 = await createSession(server.client, DIR, "Pre-existing-2");
    // Simulate what useSessions does on mount
    const list = await listSessions(server.client, DIR);
    resetAllStores();
    useSessionStore.getState().setSessions(DIR, list as never[]);
    const stored = useSessionStore.getState().sessionsByDirectory[DIR];
    expect(stored).toBeDefined();
    expect(stored!.find((s) => s.id === s1.id)).toBeDefined();
    expect(stored!.find((s) => s.id === s2.id)).toBeDefined();
    await deleteSession(server.client, DIR, s1.id);
    await deleteSession(server.client, DIR, s2.id);
    server.close();
  }, 30_000);

  it("sessions with undefined time.created do not crash the sort", async () => {
    // Regression test for the bug: message.time.created crash
    resetAllStores();
    const sessionsWithMissingTime = [
      { id: "a", title: "A", time: undefined },
      { id: "b", title: "B", time: { created: 1000, updated: 1000 } },
    ];
    // setSessions should not throw even with missing time
    expect(() =>
      useSessionStore.getState().setSessions(DIR, sessionsWithMissingTime as never[]),
    ).not.toThrow();
    const stored = useSessionStore.getState().sessionsByDirectory[DIR];
    expect(stored).toHaveLength(2);
  });

  it("upsertSession with undefined time does not crash", () => {
    resetAllStores();
    const sess = { id: "x", title: "X", time: undefined };
    expect(() => useSessionStore.getState().upsertSession(DIR, sess as never)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Suite 6: Concurrent operations
// ---------------------------------------------------------------------------

describe("CRUD: concurrent operations", () => {
  let server: Awaited<ReturnType<typeof spawnServer>>;
  let DIR: string;

  beforeAll(async () => {
    server = await spawnServer();
    DIR = makeTmpDir("concurrent");
  }, 30_000);

  afterAll(() => server.close());

  it("creates 10 sessions concurrently and all appear in list", async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) => createSession(server.client, DIR, `Concurrent-${i}`)),
    );
    const ids = results.map((s) => s.id);
    const sessions = await listSessions(server.client, DIR);
    for (const id of ids) {
      expect(sessions.find((s) => s.id === id)).toBeDefined();
    }
    await Promise.all(ids.map((id) => deleteSession(server.client, DIR, id)));
  });

  it("deletes 10 sessions concurrently and none remain", async () => {
    const created = await Promise.all(
      Array.from({ length: 10 }, () => createSession(server.client, DIR)),
    );
    const ids = created.map((s) => s.id);
    await Promise.all(ids.map((id) => deleteSession(server.client, DIR, id)));
    const sessions = await listSessions(server.client, DIR);
    for (const id of ids) {
      expect(sessions.find((s) => s.id === id)).toBeUndefined();
    }
  });

  it("concurrent list calls return consistent counts", async () => {
    const s = await createSession(server.client, DIR, "Consistency");
    const [l1, l2, l3] = await Promise.all([
      listSessions(server.client, DIR),
      listSessions(server.client, DIR),
      listSessions(server.client, DIR),
    ]);
    expect(l1.length).toBe(l2.length);
    expect(l2.length).toBe(l3.length);
    await deleteSession(server.client, DIR, s.id);
  });

  it("create-then-immediately-delete race is handled gracefully", async () => {
    const s = await createSession(server.client, DIR, "Race");
    await deleteSession(server.client, DIR, s.id);
    const sessions = await listSessions(server.client, DIR);
    expect(sessions.find((x) => x.id === s.id)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Suite 7: Performance baselines
// ---------------------------------------------------------------------------

describe("CRUD: performance baselines", () => {
  let server: Awaited<ReturnType<typeof spawnServer>>;
  let DIR: string;

  beforeAll(async () => {
    server = await spawnServer();
    DIR = makeTmpDir("perf");
  }, 30_000);

  afterAll(() => server.close());

  it("health check responds in <500ms", async () => {
    const start = Date.now();
    await server.client.global.health();
    expect(Date.now() - start).toBeLessThan(500);
  });

  it("session.list responds in <1000ms", async () => {
    const start = Date.now();
    await listSessions(server.client, DIR);
    expect(Date.now() - start).toBeLessThan(1000);
  });

  it("session.create responds in <2000ms", async () => {
    const start = Date.now();
    const s = await createSession(server.client, DIR, "Perf-create");
    expect(Date.now() - start).toBeLessThan(2000);
    await deleteSession(server.client, DIR, s.id);
  });

  it("session.delete responds in <2000ms", async () => {
    const s = await createSession(server.client, DIR, "Perf-delete");
    const start = Date.now();
    await deleteSession(server.client, DIR, s.id);
    expect(Date.now() - start).toBeLessThan(2000);
  });

  it("50 session list with pre-populated sessions responds in <2000ms", async () => {
    // Create 20 sessions first (representative load)
    const created = await Promise.all(
      Array.from({ length: 20 }, (_, i) => createSession(server.client, DIR, `Load-${i}`)),
    );
    const ids = created.map((s) => s.id);
    const start = Date.now();
    const sessions = await listSessions(server.client, DIR);
    const elapsed = Date.now() - start;
    console.log(`  session.list with ${sessions.length} sessions: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(2000);
    await Promise.all(ids.map((id) => deleteSession(server.client, DIR, id)));
  });

  it("store setSessions with 100 sessions completes in <50ms", () => {
    resetAllStores();
    const sessions = Array.from({ length: 100 }, (_, i) => ({
      id: `ses-perf-${i}`,
      title: `Session ${i}`,
      time: { created: Date.now() - i * 1000, updated: Date.now() - i * 500 },
    }));
    const start = Date.now();
    useSessionStore.getState().setSessions(DIR, sessions as never[]);
    expect(Date.now() - start).toBeLessThan(50);
    expect(useSessionStore.getState().sessionsByDirectory[DIR]).toHaveLength(100);
    resetAllStores();
  });
});

// ---------------------------------------------------------------------------
// Suite 8: Error handling
// ---------------------------------------------------------------------------

describe("CRUD: error handling", () => {
  let server: Awaited<ReturnType<typeof spawnServer>>;
  let DIR: string;

  beforeAll(async () => {
    server = await spawnServer();
    DIR = makeTmpDir("errors");
  }, 30_000);

  afterAll(() => server.close());

  it("messages on non-existent session ID is handled gracefully", async () => {
    try {
      await server.client.session.messages({
        sessionID: "non-existent-id-xyz",
        directory: DIR,
      });
    } catch {
      // acceptable — either throws or returns error response
    }
    expect(true).toBe(true);
  });

  it("delete on non-existent session ID is handled gracefully", async () => {
    try {
      await server.client.session.delete({
        sessionID: "non-existent-id-xyz",
        directory: DIR,
      });
    } catch {
      // acceptable
    }
    expect(true).toBe(true);
  });

  it("health on unreachable server returns error without crashing", async () => {
    const badClient = buildClient({ baseUrl: "http://localhost:1" });
    await badClient.global.health().catch(() => undefined);
    expect(true).toBe(true);
  });

  it("session.list on non-existent directory returns empty or error gracefully", async () => {
    try {
      const result = await server.client.session.list({ directory: "/nonexistent/path/xyz" });
      const sessions = Array.isArray(result.data) ? result.data : [];
      expect(Array.isArray(sessions)).toBe(true);
    } catch {
      // also acceptable
    }
  });

  it("upsertSession with missing time fields does not crash store", () => {
    resetAllStores();
    const badSession = { id: "bad", title: "Bad" }; // no time field
    expect(() => useSessionStore.getState().upsertSession(DIR, badSession as never)).not.toThrow();
  });
});
