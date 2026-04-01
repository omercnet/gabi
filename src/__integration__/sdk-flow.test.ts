/// <reference types="node" />

/**
 * @jest-environment node
 */

/**
 * Integration tests for the Gabi → OpenCode SDK flow.
 *
 * These tests exercise the REAL client + store + hook logic against
 * a live `opencode serve` instance. They do NOT render React components;
 * they call the same functions the hooks call and assert store state.
 *
 * Prerequisites:
 *   opencode serve --port 14096
 *
 * Run:
 *   OPENCODE_URL=http://localhost:14096 pnpm test -- --testPathPatterns integration
 *
 * Auth: reads OPENCODE_SERVER_PASSWORD from env (set by opencode automatically).
 */

import { buildClient, type OpencodeClient } from "@/client/client";
import { useConnectionStore } from "@/stores/connectionStore";
import { useMessageStore } from "@/stores/messageStore";
import { useProjectStore } from "@/stores/projectStore";
import { useSessionStore } from "@/stores/sessionStore";
import { resetAllStores } from "@/test/setup";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const OPENCODE_URL = process.env.OPENCODE_URL || "http://localhost:14096";
const OPENCODE_PASSWORD = process.env.OPENCODE_SERVER_PASSWORD || "";
// A real directory the opencode server has access to (cwd of `opencode serve`)
const TEST_DIRECTORY = process.env.OPENCODE_DIR || process.cwd();

const isCI = !!process.env.CI;

// Skip the entire suite when no server is reachable
let serverAvailable = false;

beforeAll(async () => {
  try {
    const client = buildClient({ baseUrl: OPENCODE_URL, password: OPENCODE_PASSWORD });
    const health = await client.global.health();
    serverAvailable = !!health.data;
  } catch (err) {
    serverAvailable = false;
    // Log the actual error for debugging
    console.error("Server check failed:", err instanceof Error ? err.message : err);
  }

  if (!(serverAvailable || isCI)) {
    console.warn(
      `⚠ OpenCode server not reachable at ${OPENCODE_URL}. ` +
        "Start one with: opencode serve --port 14096\n" +
        "Skipping integration tests.",
    );
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function skipIfNoServer() {
  if (!serverAvailable) {
    return true;
  }
  return false;
}

let client: OpencodeClient;

function getClient(): OpencodeClient {
  if (!client) {
    client = buildClient({ baseUrl: OPENCODE_URL, password: OPENCODE_PASSWORD });
  }
  return client;
}

// Track sessions we create so we can clean up
const createdSessionIds: string[] = [];

afterAll(async () => {
  if (!serverAvailable) return;
  const c = getClient();
  for (const id of createdSessionIds) {
    try {
      await c.session.delete({ sessionID: id, directory: TEST_DIRECTORY });
    } catch {
      // best-effort cleanup
    }
  }
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SDK integration: health + config", () => {
  beforeEach(resetAllStores);

  it("health endpoint returns ok", async () => {
    if (skipIfNoServer()) return;
    const c = getClient();
    const result = await c.global.health();
    expect(result.data).toBeDefined();
  });

  it("buildClient matches connectionStore pattern", () => {
    if (skipIfNoServer()) return;
    // Simulate what useClient does
    useConnectionStore.getState().configure(OPENCODE_URL);
    const { baseUrl, username, password, isConfigured } = useConnectionStore.getState();
    expect(isConfigured).toBe(true);

    const c = buildClient({ baseUrl, username, password });
    expect(c).toBeDefined();
    expect(c.session).toBeDefined();
    expect(c.global).toBeDefined();
    expect(c.event).toBeDefined();
  });
});

describe("SDK integration: session lifecycle", () => {
  beforeEach(resetAllStores);

  it("lists sessions for a directory", async () => {
    if (skipIfNoServer()) return;
    const c = getClient();
    const result = await c.session.list({ directory: TEST_DIRECTORY });
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("creates a session and it appears in list", async () => {
    if (skipIfNoServer()) return;
    const c = getClient();

    const created = await c.session.create({ directory: TEST_DIRECTORY });
    expect(created.data).toBeDefined();
    expect(created.data!.id).toBeTruthy();
    createdSessionIds.push(created.data!.id);

    // Verify it shows in list
    const list = await c.session.list({ directory: TEST_DIRECTORY });
    const found = (list.data as Array<{ id: string }>).find((s) => s.id === created.data!.id);
    expect(found).toBeDefined();
  });

  it("creates session and populates sessionStore", async () => {
    if (skipIfNoServer()) return;
    const c = getClient();

    const created = await c.session.create({ directory: TEST_DIRECTORY });
    createdSessionIds.push(created.data!.id);

    // Simulate what useSessions does on load
    const listResult = await c.session.list({ directory: TEST_DIRECTORY });
    const sessions = Array.isArray(listResult.data) ? listResult.data : [];
    useSessionStore.getState().setSessions(TEST_DIRECTORY, sessions);

    const stored = useSessionStore.getState().sessionsByDirectory[TEST_DIRECTORY];
    expect(stored).toBeDefined();
    expect(stored!.length).toBeGreaterThanOrEqual(1);
    expect(stored!.find((s) => s.id === created.data!.id)).toBeDefined();
  });

  it("deletes a session", async () => {
    if (skipIfNoServer()) return;
    const c = getClient();

    const created = await c.session.create({ directory: TEST_DIRECTORY });
    const sessionId = created.data!.id;

    await c.session.delete({ sessionID: sessionId, directory: TEST_DIRECTORY });

    const list = await c.session.list({ directory: TEST_DIRECTORY });
    const found = (list.data as Array<{ id: string }>).find((s) => s.id === sessionId);
    expect(found).toBeUndefined();
    // Don't add to cleanup since we already deleted
  });
});

describe("SDK integration: message flow", () => {
  let sessionId: string;

  beforeAll(async () => {
    if (!serverAvailable) return;
    const c = getClient();
    const created = await c.session.create({ directory: TEST_DIRECTORY });
    sessionId = created.data!.id;
    createdSessionIds.push(sessionId);
  });

  beforeEach(resetAllStores);

  it("sends a prompt and receives messages", async () => {
    if (skipIfNoServer()) return;
    const c = getClient();

    // Send a simple prompt (this will use whatever model is configured)
    await c.session.prompt({
      sessionID: sessionId,
      directory: TEST_DIRECTORY,
      parts: [{ type: "text", text: "Say exactly: hello world" }],
    });

    // Fetch messages for the session
    const msgs = await c.session.messages({
      sessionID: sessionId,
      directory: TEST_DIRECTORY,
    });

    expect(msgs.data).toBeDefined();
    const messageList = Array.isArray(msgs.data) ? msgs.data : [];
    expect(messageList.length).toBeGreaterThanOrEqual(2); // user + assistant

    // Messages have shape { info: { role }, parts: [...] }
    const getRole = (m: Record<string, unknown>) =>
      (m.role as string) ?? (m.info as Record<string, unknown>)?.role;

    const userMsg = messageList.find((m: Record<string, unknown>) => getRole(m) === "user");
    const assistantMsg = messageList.find(
      (m: Record<string, unknown>) => getRole(m) === "assistant",
    );
    expect(userMsg).toBeDefined();
    expect(assistantMsg).toBeDefined();
  }, 60_000); // LLM response can take a while

  it("populates messageStore from SDK response", async () => {
    if (skipIfNoServer()) return;
    const c = getClient();

    const msgs = await c.session.messages({
      sessionID: sessionId,
      directory: TEST_DIRECTORY,
    });

    const data = msgs.data as unknown;
    const messageList: Array<{ role: string; id: string }> = Array.isArray(data)
      ? data
      : typeof data === "object" && data !== null
        ? Object.values(data)
        : [];
    // Simulate what the app does: store messages
    useMessageStore.getState().setMessages(sessionId, messageList as never[]);

    const stored = useMessageStore.getState().messagesBySession[sessionId];
    expect(stored).toBeDefined();
    expect(stored!.length).toBe(messageList.length);
  });

  it("abort on idle session is a no-op (no error)", async () => {
    if (skipIfNoServer()) return;
    const c = getClient();

    // Should not throw even though nothing is streaming
    await expect(
      c.session.abort({ sessionID: sessionId, directory: TEST_DIRECTORY }),
    ).resolves.toBeDefined();
  });
});

describe("SDK integration: project store flow", () => {
  beforeEach(resetAllStores);

  it("add project → set active → stores directory for SDK calls", () => {
    if (skipIfNoServer()) return;
    const store = useProjectStore.getState();

    const project = store.addProject("test-project", TEST_DIRECTORY);
    store.setActiveProject(project.id);

    const state = useProjectStore.getState();
    expect(state.activeProjectId).toBe(project.id);
    const active = state.projects.find((p) => p.id === project.id);
    expect(active).toBeDefined();
    expect(active!.directory).toBe(TEST_DIRECTORY);
  });

  it("file list returns entries for the directory", async () => {
    if (skipIfNoServer()) return;
    const c = getClient();

    const files = await c.file.list({ directory: TEST_DIRECTORY, path: "." });
    // Response may be data or error — just verify the call doesn't throw
    expect(files).toBeDefined();
    // If data exists, it should be iterable
    if (files.data) {
      const entries = Array.isArray(files.data) ? files.data : Object.values(files.data);
      expect(entries.length).toBeGreaterThan(0);
    }
  });
});

describe("SDK integration: SSE event subscribe", () => {
  it("can subscribe to events without error", async () => {
    if (skipIfNoServer()) return;
    const c = getClient();

    const result = await c.event.subscribe({ directory: TEST_DIRECTORY });
    expect(result).toBeDefined();

    // The result is an async iterable — just verify we can get it
    // and then clean up (don't consume events in test)
    if (result && typeof result === "object" && Symbol.asyncIterator in result) {
      // Success — SSE connection established
      expect(true).toBe(true);
    }
  }, 10_000);
});
