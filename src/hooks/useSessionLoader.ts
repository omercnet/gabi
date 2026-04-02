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
): Promise<void> {
  if (!(client && sessionId)) return;
  const messagesApi = client.session.messages as unknown as (
    arg: string | { sessionID: string },
  ) => Promise<unknown>;
  const result = await messagesApi(sessionId).catch(() => messagesApi({ sessionID: sessionId }));
  const messages = normalizeMessages(result);
  useMessageStore.getState().setMessages(sessionId, messages);
}
