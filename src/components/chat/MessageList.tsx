import Feather from "@expo/vector-icons/Feather";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import type { Message } from "@/client/types";
import type { RenderItem } from "@/transcript/types";
import { MessageBubble } from "./MessageBubble";
import { StreamingIndicator } from "./StreamingIndicator";
import { useIsMobile } from "@/hooks/useIsMobile";

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
  const [showScrollFAB, setShowScrollFAB] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    setShowScrollFAB(distanceFromBottom > 200);
  }, []);

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  return (
    <View className="flex-1">
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.message.id}
        renderItem={({ item }) => <MessageBubble message={item.message} items={item.items} />}
        ListFooterComponent={isStreaming ? <StreamingIndicator /> : null}
        contentContainerStyle={isMobile ? { paddingHorizontal: 12, paddingVertical: 8, gap: 8 } : { padding: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={100}
      />
      {showScrollFAB ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute bottom-4 right-4"
        >
          <Pressable
            onPress={scrollToBottom}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface shadow-lg active:opacity-80"
            accessibilityLabel="Scroll to bottom"
          >
            <Feather name="chevrons-down" size={20} className="text-foreground" />
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}
