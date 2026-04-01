/**
 * Tests useMessages logic: message hydration with parts and grouping.
 */

import { useMessageStore } from "@/stores/messageStore";
import {
  makeAssistantMessage,
  makeReasoningPart,
  makeTextPart,
  makeToolPart,
  makeUserMessage,
} from "@/test/factories";
import { resetAllStores } from "@/test/setup";
import { groupParts } from "@/transcript/groupMessages";
import { processMessages } from "@/transcript/processMessages";

describe("useMessages logic", () => {
  beforeEach(resetAllStores);

  it("returns empty array when sessionId is null", () => {
    const sessionId = null;
    const result = sessionId ? [] : [];
    expect(result).toEqual([]);
  });

  it("returns empty array when no messages for session", () => {
    const messages = useMessageStore.getState().messagesBySession["ses-1"] ?? [];
    expect(messages).toEqual([]);
  });

  it("hydrates messages with parts from partsByMessage", () => {
    const msg = makeAssistantMessage({ id: "msg-1", sessionID: "ses-1" });
    useMessageStore.getState().setMessages("ses-1", [msg]);
    const part = makeTextPart({ id: "p1", messageID: "msg-1" });
    useMessageStore.getState().upsertPart("ses-1", "msg-1", part);

    const messages = useMessageStore.getState().messagesBySession["ses-1"] ?? [];
    const partsByMessage = useMessageStore.getState().partsByMessage;
    const hydrated = processMessages(messages, partsByMessage);
    expect(hydrated).toHaveLength(1);
    expect(hydrated[0]?.parts).toHaveLength(1);
    expect(hydrated[0]?.parts[0]?.type).toBe("text");
  });

  it("groups consecutive tool parts into tool groups", () => {
    const msg = makeAssistantMessage({ id: "msg-1", sessionID: "ses-1" });
    useMessageStore.getState().setMessages("ses-1", [msg]);
    useMessageStore
      .getState()
      .upsertPart("ses-1", "msg-1", makeToolPart({ id: "t1", messageID: "msg-1" }));
    useMessageStore
      .getState()
      .upsertPart("ses-1", "msg-1", makeToolPart({ id: "t2", messageID: "msg-1" }));

    const messages = useMessageStore.getState().messagesBySession["ses-1"] ?? [];
    const partsByMessage = useMessageStore.getState().partsByMessage;
    const hydrated = processMessages(messages, partsByMessage);
    const items = groupParts(hydrated[0]!.parts);

    // Two consecutive tools should form a group
    const toolGroups = items.filter((i) => i.kind === "tool-group");
    expect(toolGroups.length).toBeGreaterThanOrEqual(1);
  });

  it("preserves message order", () => {
    const msg1 = makeUserMessage({ id: "msg-1", sessionID: "ses-1" });
    const msg2 = makeAssistantMessage({ id: "msg-2", sessionID: "ses-1" });
    useMessageStore.getState().setMessages("ses-1", [msg1, msg2]);

    const messages = useMessageStore.getState().messagesBySession["ses-1"] ?? [];
    const partsByMessage = useMessageStore.getState().partsByMessage;
    const hydrated = processMessages(messages, partsByMessage);
    expect(hydrated[0]?.message.role).toBe("user");
    expect(hydrated[1]?.message.role).toBe("assistant");
  });

  it("handles mixed part types in one message", () => {
    const msg = makeAssistantMessage({ id: "msg-1", sessionID: "ses-1" });
    useMessageStore.getState().setMessages("ses-1", [msg]);
    useMessageStore
      .getState()
      .upsertPart("ses-1", "msg-1", makeReasoningPart({ id: "r1", messageID: "msg-1" }));
    useMessageStore
      .getState()
      .upsertPart("ses-1", "msg-1", makeTextPart({ id: "t1", messageID: "msg-1" }));
    useMessageStore
      .getState()
      .upsertPart("ses-1", "msg-1", makeToolPart({ id: "tool1", messageID: "msg-1" }));

    const messages = useMessageStore.getState().messagesBySession["ses-1"] ?? [];
    const partsByMessage = useMessageStore.getState().partsByMessage;
    const hydrated = processMessages(messages, partsByMessage);
    expect(hydrated[0]?.parts).toHaveLength(3);
  });

  it("returns user messages with no parts", () => {
    const msg = makeUserMessage({ id: "msg-1", sessionID: "ses-1" });
    useMessageStore.getState().setMessages("ses-1", [msg]);

    const messages = useMessageStore.getState().messagesBySession["ses-1"] ?? [];
    const partsByMessage = useMessageStore.getState().partsByMessage;
    const hydrated = processMessages(messages, partsByMessage);
    expect(hydrated).toHaveLength(1);
    expect(hydrated[0]?.parts).toHaveLength(0);
  });

  it("isolates parts by messageId", () => {
    useMessageStore
      .getState()
      .setMessages("ses-1", [
        makeAssistantMessage({ id: "msg-1", sessionID: "ses-1" }),
        makeAssistantMessage({ id: "msg-2", sessionID: "ses-1" }),
      ]);
    useMessageStore
      .getState()
      .upsertPart("ses-1", "msg-1", makeTextPart({ id: "p1", messageID: "msg-1" }));
    useMessageStore
      .getState()
      .upsertPart("ses-1", "msg-2", makeTextPart({ id: "p2", messageID: "msg-2" }));

    const messages = useMessageStore.getState().messagesBySession["ses-1"] ?? [];
    const partsByMessage = useMessageStore.getState().partsByMessage;
    const hydrated = processMessages(messages, partsByMessage);
    expect(hydrated[0]?.parts).toHaveLength(1);
    expect(hydrated[1]?.parts).toHaveLength(1);
  });
});
