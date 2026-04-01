import { resetAllStores } from "@/test/setup";
import { makeAssistantMessage, makeTextPart, makeUserMessage } from "@/test/factories";
import { useMessageStore } from "../messageStore";

describe("messageStore", () => {
  beforeEach(resetAllStores);
  describe("setMessages", () => {
    it("replaces messages for a session", () => {
      const msgs = [makeUserMessage({ id: "m1" })];
      useMessageStore.getState().setMessages("ses-1", msgs);
      expect(useMessageStore.getState().messagesBySession["ses-1"]).toHaveLength(1);
    });

    it("does not affect other sessions", () => {
      useMessageStore.getState().setMessages("ses-1", [makeUserMessage()]);
      useMessageStore.getState().setMessages("ses-2", [makeUserMessage()]);
      expect(useMessageStore.getState().messagesBySession["ses-1"]).toHaveLength(1);
    });
  });

  describe("upsertMessage", () => {
    it("appends new message to empty session", () => {
      useMessageStore.getState().upsertMessage("ses-1", makeUserMessage({ id: "m1" }));
      expect(useMessageStore.getState().messagesBySession["ses-1"]).toHaveLength(1);
    });

    it("updates existing message by id", () => {
      const msg = makeUserMessage({ id: "m1" });
      useMessageStore.getState().upsertMessage("ses-1", msg);
      const updated = { ...msg, content: "updated" } as typeof msg;
      useMessageStore.getState().upsertMessage("ses-1", updated);
      const msgs = useMessageStore.getState().messagesBySession["ses-1"];
      expect(msgs).toHaveLength(1);
    });
  });

  describe("removeMessage", () => {
    it("removes message by id", () => {
      useMessageStore.getState().setMessages("ses-1", [makeUserMessage({ id: "m1" })]);
      useMessageStore.getState().removeMessage("ses-1", "m1");
      expect(useMessageStore.getState().messagesBySession["ses-1"]).toHaveLength(0);
    });

    it("is safe on non-existent id", () => {
      useMessageStore.getState().setMessages("ses-1", [makeUserMessage({ id: "m1" })]);
      useMessageStore.getState().removeMessage("ses-1", "nope");
      expect(useMessageStore.getState().messagesBySession["ses-1"]).toHaveLength(1);
    });
  });

  describe("upsertPart", () => {
    it("adds part to message", () => {
      const part = makeTextPart({ id: "p1" });
      useMessageStore.getState().upsertPart("ses-1", "msg-1", part);
      expect(useMessageStore.getState().partsByMessage["msg-1"]["p1"]).toBe(part);
    });

    it("updates existing part by id", () => {
      const part = makeTextPart({ id: "p1", text: "v1" });
      useMessageStore.getState().upsertPart("ses-1", "msg-1", part);
      const updated = makeTextPart({ id: "p1", text: "v2" });
      useMessageStore.getState().upsertPart("ses-1", "msg-1", updated);
      expect(useMessageStore.getState().partsByMessage["msg-1"]["p1"].type).toBe("text");
    });
  });

  describe("removePart", () => {
    it("removes part from message", () => {
      useMessageStore.getState().upsertPart("ses-1", "msg-1", makeTextPart({ id: "p1" }));
      useMessageStore.getState().removePart("ses-1", "msg-1", "p1");
      expect(useMessageStore.getState().partsByMessage["msg-1"]["p1"]).toBeUndefined();
    });
  });

  describe("setStreaming", () => {
    it("sets and clears streamingSessionId", () => {
      useMessageStore.getState().setStreaming("ses-1");
      expect(useMessageStore.getState().streamingSessionId).toBe("ses-1");
      useMessageStore.getState().setStreaming(null);
      expect(useMessageStore.getState().streamingSessionId).toBeNull();
    });
  });

  describe("clearSession", () => {
    it("removes messagesBySession entry", () => {
      useMessageStore.getState().setMessages("ses-1", [makeUserMessage()]);
      useMessageStore.getState().clearSession("ses-1");
      expect(useMessageStore.getState().messagesBySession["ses-1"]).toBeUndefined();
    });
  });
});
