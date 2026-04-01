import { useMessageStore } from "@/stores/messageStore";
import {
  makeAssistantMessage,
  makeTextPart,
  makeToolPart,
  makeUserMessage,
} from "@/test/factories";
import { resetAllStores } from "@/test/setup";
import { groupParts } from "@/transcript/groupMessages";
import { processMessages } from "@/transcript/processMessages";

describe("useMessages store-driven behavior", () => {
  beforeEach(resetAllStores);

  function getMessageView(sessionId: string | null) {
    const state = useMessageStore.getState();
    const messages = sessionId ? (state.messagesBySession[sessionId] ?? []) : [];
    const partsByMessage = state.partsByMessage;

    if (!sessionId) return [];

    const hydrated = processMessages(messages, partsByMessage);
    return hydrated.map((h) => ({
      message: h.message,
      items: groupParts(h.parts),
    }));
  }

  it("returns empty array when sessionId is null", () => {
    expect(getMessageView(null)).toEqual([]);
  });

  it("returns empty array when session has no messages", () => {
    expect(getMessageView("ses-1")).toEqual([]);
  });

  it("hydrates message with parts into render items", () => {
    const message = makeUserMessage({ id: "m1", sessionID: "ses-1" });
    const textPart = makeTextPart({ id: "p1", messageID: "m1", sessionID: "ses-1", text: "hello" });

    useMessageStore.getState().upsertMessage("ses-1", message);
    useMessageStore.getState().upsertPart("ses-1", "m1", textPart);

    const view = getMessageView("ses-1");

    expect(view).toHaveLength(1);
    expect(view[0].message.id).toBe("m1");
    expect(view[0].items).toEqual([{ kind: "part", part: textPart }]);
  });

  it("sorts output by message created time", () => {
    const newer = makeUserMessage({
      id: "m-new",
      sessionID: "ses-1",
      time: { created: 200 },
    });
    const older = makeAssistantMessage({
      id: "m-old",
      sessionID: "ses-1",
      time: { created: 100 },
    });

    useMessageStore.getState().upsertMessage("ses-1", newer);
    useMessageStore.getState().upsertMessage("ses-1", older);

    const view = getMessageView("ses-1");
    expect(view.map((v) => v.message.id)).toEqual(["m-old", "m-new"]);
  });

  it("keeps parts scoped to each message", () => {
    const m1 = makeUserMessage({ id: "m1", sessionID: "ses-1" });
    const m2 = makeAssistantMessage({ id: "m2", sessionID: "ses-1" });
    const p1 = makeTextPart({ id: "p1", messageID: "m1", sessionID: "ses-1", text: "one" });
    const p2 = makeTextPart({ id: "p2", messageID: "m2", sessionID: "ses-1", text: "two" });

    useMessageStore.getState().upsertMessage("ses-1", m1);
    useMessageStore.getState().upsertMessage("ses-1", m2);
    useMessageStore.getState().upsertPart("ses-1", "m1", p1);
    useMessageStore.getState().upsertPart("ses-1", "m2", p2);

    const view = getMessageView("ses-1");
    expect(view[0].items).toEqual([{ kind: "part", part: p1 }]);
    expect(view[1].items).toEqual([{ kind: "part", part: p2 }]);
  });

  it("groups consecutive tool parts into a tool-group render item", () => {
    const message = makeAssistantMessage({ id: "m1", sessionID: "ses-1" });
    const t1 = makeToolPart({
      id: "t1",
      messageID: "m1",
      sessionID: "ses-1",
      tool: "read",
      callID: "c1",
    });
    const t2 = makeToolPart({
      id: "t2",
      messageID: "m1",
      sessionID: "ses-1",
      tool: "write",
      callID: "c2",
    });

    useMessageStore.getState().upsertMessage("ses-1", message);
    useMessageStore.getState().upsertPart("ses-1", "m1", t1);
    useMessageStore.getState().upsertPart("ses-1", "m1", t2);

    const view = getMessageView("ses-1");

    expect(view[0].items).toHaveLength(1);
    expect(view[0].items[0]).toEqual(
      expect.objectContaining({
        kind: "tool-group",
        parts: [t1, t2],
      }),
    );
  });

  it("does not create tool-group for a single tool part", () => {
    const message = makeAssistantMessage({ id: "m1", sessionID: "ses-1" });
    const t1 = makeToolPart({ id: "t1", messageID: "m1", sessionID: "ses-1" });

    useMessageStore.getState().upsertMessage("ses-1", message);
    useMessageStore.getState().upsertPart("ses-1", "m1", t1);

    const view = getMessageView("ses-1");
    expect(view[0].items).toEqual([{ kind: "part", part: t1 }]);
  });

  it("ignores parts for messages not present in session message list", () => {
    const message = makeUserMessage({ id: "m1", sessionID: "ses-1" });
    const orphanPart = makeTextPart({ id: "orphan", messageID: "m-missing", sessionID: "ses-1" });

    useMessageStore.getState().upsertMessage("ses-1", message);
    useMessageStore.getState().upsertPart("ses-1", "m-missing", orphanPart);

    const view = getMessageView("ses-1");
    expect(view).toHaveLength(1);
    expect(view[0].items).toEqual([]);
  });
});
