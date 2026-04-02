import type { Message, OpencodeClient } from "@/client/types";
import { useMessageStore } from "@/stores/messageStore";

function normalizeMessages(result: unknown): Message[] {
  if (Array.isArray(result)) return result as Message[];
  if (result && typeof result === "object" && "data" in result) {
    const data = (result as { data?: unknown }).data;
    return Array.isArray(data) ? (data as Message[]) : [];
  }
  return [];
}

export async function loadSessionMessages(
  client: OpencodeClient | null,
  sessionId: string,
  directory: string,
): Promise<void> {
  if (!(client && sessionId && directory)) return;
  const result = await client.session.messages({ sessionID: sessionId, directory });
  const messages = normalizeMessages(result);
  useMessageStore.getState().setMessages(sessionId, messages);
}
