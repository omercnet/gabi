import type { Message, Part } from "@/client/types";
import { useMessageStore } from "@/stores/messageStore";

/**
 * The session messages endpoint returns Array<{ info: Message; parts: Part[] }>
 * NOT a flat Message[]. This function unwraps both slices into the store.
 * SSE events send flat Message (in event.properties.info) — those are handled separately.
 */
function hydrateFromApiResponse(sessionId: string, raw: unknown): void {
  // Unwrap { data: [...] } envelope if present
  const payload =
    raw && typeof raw === "object" && "data" in raw ? (raw as { data: unknown }).data : raw;

  if (!Array.isArray(payload)) return;

  const messages: Message[] = [];

  for (const item of payload) {
    if (!item || typeof item !== "object") continue;

    let msg: Message;
    let parts: Part[] = [];

    if ("info" in item) {
      // API shape: { info: Message, parts: Part[] }
      msg = (item as { info: Message }).info;
      parts = (item as { parts?: Part[] }).parts ?? [];
    } else if ("id" in item) {
      // Flat Message shape (legacy / direct SDK client shape)
      msg = item as Message;
    } else {
      continue;
    }

    if (!msg?.id) continue;
    messages.push(msg);

    // Populate partsByMessage from embedded parts
    for (const part of parts) {
      if (part?.id) {
        useMessageStore.getState().upsertPart(sessionId, msg.id, part);
      }
    }
  }

  useMessageStore.getState().setMessages(sessionId, messages);
}

/** Track in-flight fetches to prevent duplicate concurrent requests for the same session. */
const inflightFetches = new Map<string, Promise<void>>();

export async function loadSessionMessages(
  client: {
    session: { messages: (args: { sessionID: string; directory: string }) => Promise<unknown> };
  } | null,
  sessionId: string,
  directory: string,
  { force = false }: { force?: boolean } = {},
): Promise<void> {
  if (!(client && sessionId && directory)) return;

  if (!force) {
    const existing = useMessageStore.getState().messagesBySession[sessionId];
    if (existing !== undefined) return;
  }

  const key = `${sessionId}:${directory}`;
  const inflight = inflightFetches.get(key);
  if (inflight) return inflight;

  const fetch = (async () => {
    try {
      const result = await client.session.messages({ sessionID: sessionId, directory });
      hydrateFromApiResponse(sessionId, result);
    } finally {
      inflightFetches.delete(key);
    }
  })();

  inflightFetches.set(key, fetch);
  return fetch;
}
