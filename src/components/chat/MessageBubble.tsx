import { Text } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { Message } from "@/client/types";
import type { RenderItem } from "@/transcript/types";
import { PartRenderer } from "./PartRenderer";
import { ToolGroup } from "./ToolGroup";

const BUBBLE_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 2,
} as const;

interface Props {
  message: Message;
  items: RenderItem[];
}

export function MessageBubble({ message, items }: Props) {
  const isUser = message.role === "user";
  const isMobile = useIsMobile();

  if (isUser) {
    return (
      <Animated.View
        entering={FadeInUp.duration(250)}
        style={BUBBLE_SHADOW}
        className={isMobile ? "max-w-[80%] self-end rounded-2xl bg-user-bubble px-3 py-2.5" : "max-w-[85%] self-end rounded-2xl bg-user-bubble px-4 py-3"}
      >
        {items.length > 0 ? (
          items.map((item, idx) =>
            item.kind === "tool-group" ? (
              <ToolGroup key={`tg-${idx}`} group={item} />
            ) : (
              <PartRenderer key={item.part.id ?? `part-${idx}`} part={item.part} />
            ),
          )
        ) : (
          // Fallback: pre-API-fix sessions may have content field
          <Text className="text-user-bubble-foreground">
            {"content" in message ? String(message.content) : ""}
          </Text>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInUp.duration(250)}
      style={isMobile ? undefined : BUBBLE_SHADOW}
      className={isMobile ? "max-w-full self-start border-l-2 border-primary/20 pl-3 py-2" : "max-w-[85%] self-start rounded-2xl bg-assistant-bubble px-4 py-3"}
    >
      {items.map((item, idx) =>
        item.kind === "tool-group" ? (
          <ToolGroup key={`tg-${idx}`} group={item} />
        ) : (
          <PartRenderer key={item.part.id ?? `part-${idx}`} part={item.part} />
        ),
      )}
    </Animated.View>
  );
}
