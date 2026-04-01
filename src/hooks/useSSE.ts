import { useEffect, useRef } from "react";
import { SSEManager } from "@/client/sse";
import type { OpencodeClient, SSEEvent } from "@/client/types";
import { useConnectionStore } from "@/stores/connectionStore";
import { useMessageStore } from "@/stores/messageStore";
import { usePermissionStore } from "@/stores/permissionStore";
import { useQuestionStore } from "@/stores/questionStore";
import { useSessionStore } from "@/stores/sessionStore";

export function useSSE(client: OpencodeClient | null, directory: string | null): void {
  const managerRef = useRef<SSEManager | null>(null);
  const setSseStatus = useConnectionStore((s) => s.setSseStatus);
  const upsertPart = useMessageStore((s) => s.upsertPart);
  const removePart = useMessageStore((s) => s.removePart);
  const upsertMessage = useMessageStore((s) => s.upsertMessage);
  const removeMessage = useMessageStore((s) => s.removeMessage);
  const setStreaming = useMessageStore((s) => s.setStreaming);
  const upsertSession = useSessionStore((s) => s.upsertSession);
  const removeSession = useSessionStore((s) => s.removeSession);
  const upsertPermission = usePermissionStore((s) => s.upsert);
  const removePermission = usePermissionStore((s) => s.remove);
  const upsertQuestion = useQuestionStore((s) => s.upsert);

  useEffect(() => {
    if (!(client && directory)) return;

    const handleEvent = (event: SSEEvent) => {
      switch (event.type) {
        case "message.part.updated":
          upsertPart(
            event.properties.sessionID,
            event.properties.part.messageID,
            event.properties.part,
          );
          break;
        case "message.part.removed":
          removePart(
            event.properties.sessionID,
            event.properties.messageID,
            event.properties.partID,
          );
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
    };

    const manager = new SSEManager({
      client,
      directory,
      onEvent: handleEvent,
      onStatusChange: setSseStatus,
    });

    managerRef.current = manager;
    manager.start();

    return () => {
      manager.stop();
      managerRef.current = null;
    };
  }, [
    client,
    directory,
    setSseStatus,
    upsertPart,
    removePart,
    upsertMessage,
    removeMessage,
    setStreaming,
    upsertSession,
    removeSession,
    upsertPermission,
    removePermission,
    upsertQuestion,
  ]);
}
