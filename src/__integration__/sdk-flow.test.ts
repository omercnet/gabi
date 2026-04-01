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
