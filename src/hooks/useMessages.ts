import { useMemo } from "react";
import { useMessageStore } from "@/stores/messageStore";
import { groupParts } from "@/transcript/groupMessages";
import { processMessages } from "@/transcript/processMessages";
import type { HydratedMessage, RenderItem } from "@/transcript/types";
import type { Message, Part } from "@/client/types";

const EMPTY_MESSAGES: Message[] = [];
const EMPTY_PARTS: Record<string, Record<string, Part>> = {};

interface MessageView {
  message: HydratedMessage["message"];
  items: RenderItem[];
}

export function useMessages(sessionId: string | null): MessageView[] {
  const messages = useMessageStore((s) =>
    sessionId ? (s.messagesBySession[sessionId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES,
  );
  const partsByMessage = useMessageStore((s) => s.partsByMessage ?? EMPTY_PARTS);

  return useMemo(() => {
    if (!sessionId) return [];
    const hydrated = processMessages(messages, partsByMessage);
    return hydrated.map((h) => ({
      message: h.message,
      items: groupParts(h.parts),
    }));
  }, [sessionId, messages, partsByMessage]);
}
