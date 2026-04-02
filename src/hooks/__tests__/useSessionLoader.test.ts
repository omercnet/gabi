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
    await loadSessionMessages(client, sessionId);

    expect(client.session.messages).toHaveBeenCalledWith(sessionId);
    expect(useMessageStore.getState().messagesBySession[sessionId]).toEqual(expectedMessages);
  });
});
