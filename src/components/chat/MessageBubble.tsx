import { Text, View } from "react-native";
import type { Message } from "@/client/types";
import type { RenderItem } from "@/transcript/types";
import { PartRenderer } from "./PartRenderer";
import { ToolGroup } from "./ToolGroup";

interface Props {
  message: Message;
  items: RenderItem[];
}

export function MessageBubble({ message, items }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <View className="max-w-[85%] self-end rounded-2xl bg-user-bubble px-4 py-3">
        <Text className="text-user-bubble-foreground">
          {"content" in message ? String(message.content) : ""}
        </Text>
      </View>
    );
  }

  return (
    <View className="max-w-[85%] self-start rounded-2xl bg-assistant-bubble px-4 py-3">
      {items.map((item, idx) =>
        item.kind === "tool-group" ? (
          <ToolGroup key={`tg-${idx}`} group={item} />
        ) : (
          <PartRenderer key={item.part.id} part={item.part} />
        ),
      )}
    </View>
  );
}
