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

/** Track in-flight fetches to prevent duplicate concurrent requests for the same session. */
const inflightFetches = new Map<string, Promise<void>>();

export async function loadSessionMessages(
  client: OpencodeClient | null,
  sessionId: string,
  directory: string,
  { force = false }: { force?: boolean } = {},
): Promise<void> {
  if (!(client && sessionId && directory)) return;

  // Skip if already loaded and not forced
  if (!force) {
    const existing = useMessageStore.getState().messagesBySession[sessionId];
    if (existing !== undefined) return;
  }

  // Deduplicate concurrent requests for same session
  const key = `${sessionId}:${directory}`;
  const inflight = inflightFetches.get(key);
  if (inflight) return inflight;

  const fetch = (async () => {
    try {
      const result = await client.session.messages({ sessionID: sessionId, directory });
      const messages = normalizeMessages(result);
      useMessageStore.getState().setMessages(sessionId, messages);
    } finally {
      inflightFetches.delete(key);
    }
  })();

  inflightFetches.set(key, fetch);
  return fetch;
}
