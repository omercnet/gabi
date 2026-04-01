import { useCallback } from "react";
import type { OpencodeClient } from "@/client/types";
import { useMessageStore } from "@/stores/messageStore";

interface SendMessageResult {
  send: (text: string) => Promise<void>;
  abort: () => Promise<void>;
  isStreaming: boolean;
}

export function useSendMessage(
  client: OpencodeClient | null,
  sessionId: string | null,
  directory: string,
): SendMessageResult {
  const streamingSessionId = useMessageStore((s) => s.streamingSessionId);
  const isStreaming = streamingSessionId === sessionId;

  const send = useCallback(
    async (text: string) => {
      if (!(client && sessionId && text.trim())) return;

      await client.session.prompt({
        sessionID: sessionId,
        directory,
        parts: [{ type: "text", text }],
      });
    },
    [client, sessionId, directory],
  );

  const abort = useCallback(async () => {
    if (!(client && sessionId)) return;
    await client.session.abort({ sessionID: sessionId, directory });
  }, [client, sessionId, directory]);

  return { send, abort, isStreaming };
}
