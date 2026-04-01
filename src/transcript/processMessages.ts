import type { Message, Part } from "@/client/types";
import type { HydratedMessage } from "./types";

export function processMessages(
  messages: Message[],
  partsByMessage: Record<string, Record<string, Part>>,
): HydratedMessage[] {
  return messages
    .map((message) => {
      const partsMap = partsByMessage[message.id] ?? {};
      const parts = Object.values(partsMap);
      return { message, parts };
    })
    .sort((a, b) => a.message.time.created - b.message.time.created);
}
