/**
 * Tests event routing paths used by useSSE.
 * Direct store method calls matching the switch-case in useSSE's handleEvent.
 */
import { useConnectionStore } from "@/stores/connectionStore";
import { useMessageStore } from "@/stores/messageStore";
import { usePermissionStore } from "@/stores/permissionStore";
import { useQuestionStore } from "@/stores/questionStore";
import { useSessionStore } from "@/stores/sessionStore";
import {
  makePermissionRequest,
  makeQuestionRequest,
  makeSession,
  makeTextPart,
  makeUserMessage,
} from "@/test/factories";
import { resetAllStores } from "@/test/setup";

describe("useSSE event routing", () => {
  beforeEach(resetAllStores);

  describe("message.part.updated", () => {
    it("adds part to message store", () => {
      const part = makeTextPart({ id: "p1", messageID: "msg-1" });
      useMessageStore.getState().upsertPart("ses-1", "msg-1", part);
      expect(useMessageStore.getState().partsByMessage["msg-1"]["p1"]).toBeDefined();
    });
  });

  describe("message.part.removed", () => {
    it("removes part from message store", () => {
      useMessageStore.getState().upsertPart("ses-1", "msg-1", makeTextPart({ id: "p1", messageID: "msg-1" }));
      useMessageStore.getState().removePart("ses-1", "msg-1", "p1");
      expect(useMessageStore.getState().partsByMessage["msg-1"]["p1"]).toBeUndefined();
    });
  });

  describe("message.updated", () => {
    it("upserts message into session", () => {
      useMessageStore.getState().upsertMessage("ses-1", makeUserMessage({ id: "m1", sessionID: "ses-1" }));
      expect(useMessageStore.getState().messagesBySession["ses-1"]).toHaveLength(1);
    });
  });

  describe("message.removed", () => {
    it("removes message from session", () => {
      useMessageStore.getState().upsertMessage("ses-1", makeUserMessage({ id: "m1" }));
      useMessageStore.getState().removeMessage("ses-1", "m1");
      expect(useMessageStore.getState().messagesBySession["ses-1"]).toHaveLength(0);
    });
  });

  describe("session.created", () => {
    it("adds session to directory", () => {
      useSessionStore.getState().upsertSession("/proj", makeSession({ id: "s1" }));
      expect(useSessionStore.getState().sessionsByDirectory["/proj"]).toHaveLength(1);
    });
  });

  describe("session.updated", () => {
    it("updates existing session", () => {
      useSessionStore.getState().upsertSession("/proj", makeSession({ id: "s1", title: "Old" }));
      useSessionStore.getState().upsertSession("/proj", makeSession({ id: "s1", title: "New" }));
      expect(useSessionStore.getState().sessionsByDirectory["/proj"]![0].title).toBe("New");
    });
  });

  describe("session.deleted", () => {
    it("removes session from directory", () => {
      useSessionStore.getState().upsertSession("/proj", makeSession({ id: "s1" }));
      useSessionStore.getState().removeSession("/proj", "s1");
      expect(useSessionStore.getState().sessionsByDirectory["/proj"]!.find((s) => s.id === "s1")).toBeUndefined();
    });
  });

  describe("session.status", () => {
    it("busy sets streaming session", () => {
      useMessageStore.getState().setStreaming("ses-1");
      expect(useMessageStore.getState().streamingSessionId).toBe("ses-1");
    });

    it("idle clears streaming", () => {
      useMessageStore.getState().setStreaming("ses-1");
      useMessageStore.getState().setStreaming(null);
      expect(useMessageStore.getState().streamingSessionId).toBeNull();
    });
  });

  describe("session.idle", () => {
    it("clears streaming", () => {
      useMessageStore.getState().setStreaming("ses-1");
      useMessageStore.getState().setStreaming(null);
      expect(useMessageStore.getState().streamingSessionId).toBeNull();
    });
  });

  describe("permission.asked", () => {
    it("upserts into pending", () => {
      usePermissionStore.getState().upsert(makePermissionRequest({ id: "p1" }));
      expect(usePermissionStore.getState().pending).toHaveLength(1);
    });
  });

  describe("permission.replied", () => {
    it("removes from pending", () => {
      usePermissionStore.getState().upsert(makePermissionRequest({ id: "p1" }));
      usePermissionStore.getState().remove("p1");
      expect(usePermissionStore.getState().pending).toHaveLength(0);
    });
  });

  describe("question.asked", () => {
    it("upserts into pending", () => {
      useQuestionStore.getState().upsert(makeQuestionRequest({ id: "q1" }));
      expect(useQuestionStore.getState().pending).toHaveLength(1);
    });
  });

  describe("SSE status routing", () => {
    it("connected status", () => {
      useConnectionStore.getState().setSseStatus("connected");
      expect(useConnectionStore.getState().sseStatus).toBe("connected");
    });

    it("reconnecting status", () => {
      useConnectionStore.getState().setSseStatus("reconnecting");
      expect(useConnectionStore.getState().sseStatus).toBe("reconnecting");
    });

    it("disconnected status", () => {
      useConnectionStore.getState().setSseStatus("disconnected");
      expect(useConnectionStore.getState().sseStatus).toBe("disconnected");
    });
  });
});