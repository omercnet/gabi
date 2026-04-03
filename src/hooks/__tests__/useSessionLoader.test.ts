import { useMessageStore } from "@/stores/messageStore";
import { makeAssistantMessage, makeUserMessage } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

describe("session message loading contract (red)", () => {
  beforeEach(resetAllStores);

  it("messageStore is empty for a session that has not received SSE events", () => {
    expect(useMessageStore.getState().messagesBySession["ses-existing"]).toBeUndefined();
  });

  it("useMessages contract: empty store yields empty messages for selected session", () => {
    const messages = useMessageStore.getState().messagesBySession["ses-existing"] ?? [];
    expect(messages).toEqual([]);
  });

  it("loadSessionMessages fetches from API and populates store", async () => {
    const sessionId = "ses-existing";
    const expectedMessages = [
      makeUserMessage({ id: "msg-user-1", sessionID: sessionId }),
      makeAssistantMessage({ id: "msg-assistant-1", sessionID: sessionId }),
    ];

    const client = {
      session: {
        messages: jest.fn().mockResolvedValue(expectedMessages),
      },
    };

    const { loadSessionMessages } = require("@/hooks/useSessionLoader");
    await loadSessionMessages(client, sessionId, "/home/test");

    expect(client.session.messages).toHaveBeenCalledWith({
      sessionID: sessionId,
      directory: "/home/test",
    });
    expect(useMessageStore.getState().messagesBySession[sessionId]).toEqual(expectedMessages);
  });

  it("does NOT fetch again if messages are already loaded (deduplication by cache)", async () => {
    const sessionId = "ses-cached";
    // Pre-populate the store as if messages were already loaded
    useMessageStore.getState().setMessages(sessionId, [makeUserMessage({ id: "m1" })]);

    const client = { session: { messages: jest.fn().mockResolvedValue([]) } };
    const { loadSessionMessages } = require("@/hooks/useSessionLoader");
    await loadSessionMessages(client, sessionId, "/home/test");

    // Should not have fetched since messages are already in store
    expect(client.session.messages).not.toHaveBeenCalled();
  });

  it("fetches again when force=true even if already loaded", async () => {
    const sessionId = "ses-force";
    useMessageStore.getState().setMessages(sessionId, [makeUserMessage({ id: "m1" })]);

    const freshMessages = [makeAssistantMessage({ id: "m2", sessionID: sessionId })];
    const client = {
      session: {
        messages: jest.fn().mockResolvedValue({ data: freshMessages }),
      },
    };
    const { loadSessionMessages } = require("@/hooks/useSessionLoader");
    await loadSessionMessages(client, sessionId, "/home/test", { force: true });

    expect(client.session.messages).toHaveBeenCalledTimes(1);
    expect(useMessageStore.getState().messagesBySession[sessionId]).toEqual(freshMessages);
  });

  it("does not make concurrent duplicate requests for the same session", async () => {
    const sessionId = "ses-concurrent";
    let resolveMessages!: (v: unknown) => void;
    const pending = new Promise((r) => (resolveMessages = r));

    const client = {
      session: {
        messages: jest.fn().mockReturnValue(pending),
      },
    };

    const { loadSessionMessages } = require("@/hooks/useSessionLoader");
    // Fire two concurrent calls
    const p1 = loadSessionMessages(client, sessionId, "/home/test");
    const p2 = loadSessionMessages(client, sessionId, "/home/test");

    resolveMessages([]);
    await Promise.all([p1, p2]);

    // Only one actual fetch should have been made
    expect(client.session.messages).toHaveBeenCalledTimes(1);
  });
});
