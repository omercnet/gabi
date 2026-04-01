import { useEffect, useRef } from "react";
import { FlatList, View } from "react-native";
import type { Message } from "@/client/types";
import type { RenderItem } from "@/transcript/types";
import { MessageBubble } from "./MessageBubble";

interface MessageView {
  message: Message;
  items: RenderItem[];
}

interface Props {
  messages: MessageView[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: Props) {
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, isStreaming]);

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(item) => item.message.id}
      renderItem={({ item }) => <MessageBubble message={item.message} items={item.items} />}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      showsVerticalScrollIndicator={false}
    />
  );
}
