/**
 * Tests useSSE event routing logic by exercising the same store actions
 * that the hook dispatches for each SSE event type.
 *
 * We test the routing contract: given event type X, the correct store
 * action is called with the correct arguments. This avoids React rendering
 * entirely (which hits NativeWind/CSS-interop transform issues in jest).
 */

import type { SSEEvent } from "@/client/types";
import { useMessageStore } from "@/stores/messageStore";
import { usePermissionStore } from "@/stores/permissionStore";
import { useQuestionStore } from "@/stores/questionStore";
import { useSessionStore } from "@/stores/sessionStore";
import {
  makePermissionRequest,
  makeQuestionRequest,
  makeSession,
  makeTextPart,
  makeToolPart,
  makeUserMessage,
} from "@/test/factories";
import { resetAllStores } from "@/test/setup";

/**
 * Mirrors the handleEvent switch in useSSE.ts.
 * This lets us test the routing logic without React/rendering.
 */
function routeEvent(event: SSEEvent, directory: string): void {
  const { upsertPart, removePart, upsertMessage, removeMessage, setStreaming } =
    useMessageStore.getState();
  const { upsertSession, removeSession } = useSessionStore.getState();
  const { upsert: upsertPermission, remove: removePermission } = usePermissionStore.getState();
  const { upsert: upsertQuestion } = useQuestionStore.getState();

  switch (event.type) {
    case "message.part.updated":
      upsertPart(
        event.properties.sessionID,
        event.properties.part.messageID,
        event.properties.part,
      );
      break;
    case "message.part.removed":
      removePart(event.properties.sessionID, event.properties.messageID, event.properties.partID);
      break;
    case "message.updated":
      upsertMessage(event.properties.sessionID, event.properties.info);
      break;
    case "message.removed":
      removeMessage(event.properties.sessionID, event.properties.messageID);
      break;
    case "session.created":
      upsertSession(directory, event.properties.info);
      break;
    case "session.updated":
      upsertSession(directory, event.properties.info);
      break;
    case "session.deleted":
      removeSession(directory, event.properties.info.id);
      break;
    case "session.status":
      if (event.properties.status.type === "busy") {
        setStreaming(event.properties.sessionID);
      } else if (event.properties.status.type === "idle") {
        setStreaming(null);
      }
      break;
    case "session.idle":
      setStreaming(null);
      break;
    case "permission.asked":
      upsertPermission(event.properties);
      break;
    case "permission.replied":
      removePermission(event.properties.requestID);
      break;
    case "question.asked":
      upsertQuestion(event.properties);
      break;
  }
}

const DIR = "/test-project";

describe("useSSE event routing", () => {
  beforeEach(resetAllStores);

  describe("message.part.updated", () => {
    it("upserts part into messageStore", () => {
      const part = makeTextPart({ id: "p1", messageID: "msg-1", sessionID: "ses-1" });
      routeEvent(
        {
          type: "message.part.updated",
          properties: { sessionID: "ses-1", part },
        } as unknown as SSEEvent,
        DIR,
      );
      expect(useMessageStore.getState().partsByMessage["msg-1"]?.p1).toBeDefined();
      expect(useMessageStore.getState().partsByMessage["msg-1"]?.p1?.type).toBe("text");
    });

    it("updates existing part with same id", () => {
      const part1 = makeTextPart({ id: "p1", messageID: "msg-1", text: "v1" });
      const part2 = makeTextPart({ id: "p1", messageID: "msg-1", text: "v2" });
      routeEvent(
        {
          type: "message.part.updated",
          properties: { sessionID: "ses-1", part: part1 },
        } as unknown as SSEEvent,
        DIR,
      );
      routeEvent(
        {
          type: "message.part.updated",
          properties: { sessionID: "ses-1", part: part2 },
        } as unknown as SSEEvent,
        DIR,
      );
      expect(
        (useMessageStore.getState().partsByMessage["msg-1"]?.p1 as { text: string }).text,
      ).toBe("v2");
    });

    it("stores tool parts correctly", () => {
      const part = makeToolPart({ id: "tp1", messageID: "msg-1" });
      routeEvent(
        {
          type: "message.part.updated",
          properties: { sessionID: "ses-1", part },
        } as unknown as SSEEvent,
        DIR,
      );
      expect(useMessageStore.getState().partsByMessage["msg-1"]?.tp1?.type).toBe("tool");
    });
  });

  describe("message.part.removed", () => {
    it("removes part from messageStore", () => {
      const part = makeTextPart({ id: "p1", messageID: "msg-1" });
      useMessageStore.getState().upsertPart("ses-1", "msg-1", part);
      routeEvent(
        {
          type: "message.part.removed",
          properties: { sessionID: "ses-1", messageID: "msg-1", partID: "p1" },
        } as unknown as SSEEvent,
        DIR,
      );
      expect(useMessageStore.getState().partsByMessage["msg-1"]?.p1).toBeUndefined();
    });

    it("is safe when part does not exist", () => {
      routeEvent(
        {
          type: "message.part.removed",
          properties: { sessionID: "ses-1", messageID: "msg-1", partID: "nonexistent" },
        } as unknown as SSEEvent,
        DIR,
      );
      expect(useMessageStore.getState().partsByMessage).toBeDefined();
    });
  });

  describe("message.updated", () => {
    it("adds new message to session", () => {
      const msg = makeUserMessage({ id: "msg-1", sessionID: "ses-1" });
      routeEvent(
        {
          type: "message.updated",
          properties: { sessionID: "ses-1", info: msg },
        } as unknown as SSEEvent,
        DIR,
      );
      expect(useMessageStore.getState().messagesBySession["ses-1"]).toHaveLength(1);
    });

    it("updates existing message by id", () => {
      const msg = makeUserMessage({ id: "msg-1", sessionID: "ses-1" });
      useMessageStore.getState().upsertMessage("ses-1", msg);
      const updated = { ...msg } as unknown as typeof msg;
      routeEvent(
        {
          type: "message.updated",
          properties: { sessionID: "ses-1", info: updated },
        } as unknown as SSEEvent,
        DIR,
      );
      expect(useMessageStore.getState().messagesBySession["ses-1"]).toHaveLength(1);
    });
  });

  describe("message.removed", () => {
    it("removes message from session", () => {
      useMessageStore.getState().setMessages("ses-1", [makeUserMessage({ id: "msg-1" })]);
      routeEvent(
        {
          type: "message.removed",
          properties: { sessionID: "ses-1", messageID: "msg-1" },
        } as unknown as SSEEvent,
        DIR,
      );
      expect(useMessageStore.getState().messagesBySession["ses-1"]).toHaveLength(0);
    });
  });

  describe("session.created", () => {
    it("adds session to directory listing", () => {
      const session = makeSession({ id: "new-ses", title: "New Session" });
      routeEvent(
        { type: "session.created", properties: { info: session } } as unknown as SSEEvent,
        DIR,
      );
      expect(useSessionStore.getState().sessionsByDirectory[DIR]).toHaveLength(1);
      expect(useSessionStore.getState().sessionsByDirectory[DIR]?.[0]?.title).toBe("New Session");
    });
  });

  describe("session.updated", () => {
    it("updates session in directory listing", () => {
      const session = makeSession({ id: "ses-1", title: "Original" });
      useSessionStore.getState().setSessions(DIR, [session]);
      const updated = makeSession({ id: "ses-1", title: "Updated" });
      routeEvent(
        { type: "session.updated", properties: { info: updated } } as unknown as SSEEvent,
        DIR,
      );
      expect(useSessionStore.getState().sessionsByDirectory[DIR]?.[0]?.title).toBe("Updated");
    });

    it("appends if session id not found", () => {
      useSessionStore.getState().setSessions(DIR, [makeSession({ id: "ses-1" })]);
      routeEvent(
        {
          type: "session.updated",
          properties: { info: makeSession({ id: "ses-2" }) },
        } as unknown as SSEEvent,
        DIR,
      );
      expect(useSessionStore.getState().sessionsByDirectory[DIR]).toHaveLength(2);
    });
  });

  describe("session.deleted", () => {
    it("removes session from directory listing", () => {
      useSessionStore.getState().setSessions(DIR, [makeSession({ id: "ses-del" })]);
      routeEvent(
        { type: "session.deleted", properties: { info: { id: "ses-del" } } } as unknown as SSEEvent,
        DIR,
      );
      expect(useSessionStore.getState().sessionsByDirectory[DIR]).toHaveLength(0);
    });

    it("clears activeSessionId if deleted session was active", () => {
      useSessionStore.getState().setSessions(DIR, [makeSession({ id: "ses-active" })]);
      useSessionStore.getState().setActiveSession("ses-active");
      routeEvent(
        {
          type: "session.deleted",
          properties: { info: { id: "ses-active" } },
        } as unknown as SSEEvent,
        DIR,
      );
      expect(useSessionStore.getState().activeSessionId).toBeNull();
    });
  });

  describe("session.status", () => {
    it("sets streaming on busy", () => {
      routeEvent(
        {
          type: "session.status",
          properties: { sessionID: "ses-1", status: { type: "busy" } },
        } as unknown as SSEEvent,
        DIR,
      );
      expect(useMessageStore.getState().streamingSessionId).toBe("ses-1");
    });

    it("clears streaming on idle", () => {
      useMessageStore.getState().setStreaming("ses-1");
      routeEvent(
        {
          type: "session.status",
          properties: { sessionID: "ses-1", status: { type: "idle" } },
        } as unknown as SSEEvent,
        DIR,
      );
      expect(useMessageStore.getState().streamingSessionId).toBeNull();
    });

    it("ignores other status types", () => {
      routeEvent(
        {
          type: "session.status",
          properties: { sessionID: "ses-1", status: { type: "error" } },
        } as unknown as SSEEvent,
        DIR,
      );
      expect(useMessageStore.getState().streamingSessionId).toBeNull();
    });
  });

  describe("session.idle", () => {
    it("clears streaming session", () => {
      useMessageStore.getState().setStreaming("ses-1");
      routeEvent({ type: "session.idle", properties: {} } as unknown as SSEEvent, DIR);
      expect(useMessageStore.getState().streamingSessionId).toBeNull();
    });
  });

  describe("permission.asked", () => {
    it("adds permission request to store", () => {
      const perm = makePermissionRequest({ id: "perm-1" });
      routeEvent({ type: "permission.asked", properties: perm } as unknown as SSEEvent, DIR);
      expect(usePermissionStore.getState().pending).toHaveLength(1);
      expect(usePermissionStore.getState().pending[0]?.id).toBe("perm-1");
    });

    it("upserts existing permission with same id", () => {
      const perm1 = makePermissionRequest({ id: "perm-1", permission: "file.read" });
      const perm2 = makePermissionRequest({ id: "perm-1", permission: "file.write" });
      routeEvent({ type: "permission.asked", properties: perm1 } as unknown as SSEEvent, DIR);
      routeEvent({ type: "permission.asked", properties: perm2 } as unknown as SSEEvent, DIR);
      expect(usePermissionStore.getState().pending).toHaveLength(1);
      expect(usePermissionStore.getState().pending[0]?.permission).toBe("file.write");
    });
  });

  describe("permission.replied", () => {
    it("removes permission from store", () => {
      usePermissionStore.getState().upsert(makePermissionRequest({ id: "perm-1" }));
      routeEvent(
        { type: "permission.replied", properties: { requestID: "perm-1" } } as unknown as SSEEvent,
        DIR,
      );
      expect(usePermissionStore.getState().pending).toHaveLength(0);
    });
  });

  describe("question.asked", () => {
    it("adds question to store", () => {
      const q = makeQuestionRequest({ id: "q-1" });
      routeEvent({ type: "question.asked", properties: q } as unknown as SSEEvent, DIR);
      expect(useQuestionStore.getState().pending).toHaveLength(1);
    });

    it("upserts existing question with same id", () => {
      const q1 = makeQuestionRequest({ id: "q-1" });
      const q2 = makeQuestionRequest({ id: "q-1" });
      routeEvent({ type: "question.asked", properties: q1 } as unknown as SSEEvent, DIR);
      routeEvent({ type: "question.asked", properties: q2 } as unknown as SSEEvent, DIR);
      expect(useQuestionStore.getState().pending).toHaveLength(1);
    });
  });
});
