import Feather from "@expo/vector-icons/Feather";
import { useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePlaceholderColor } from "@/lib/colors";

interface Props {
  onSend: (text: string) => Promise<void>;
  onAbort: () => Promise<void>;
  isStreaming: boolean;
  disabled: boolean;
}

export function ChatInput({ onSend, onAbort, isStreaming, disabled }: Props) {
  const [text, setText] = useState("");
  const isMobile = useIsMobile();
  const placeholderColor = usePlaceholderColor();

  const handleSend = async () => {
    if (!text.trim() || isStreaming) return;
    const msg = text;
    setText("");
    await onSend(msg);
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }) => {
    if (Platform.OS === "web" && e.nativeEvent.key === "Enter") {
      handleSend();
    }
  };

  return (
    <View className={isMobile ? "border-border border-t bg-surface px-3 py-2" : "border-border border-t bg-surface px-4 py-3"}>
      <View className="flex-row items-end gap-2">
        <TextInput
          className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-foreground"
          placeholder={isMobile ? "Ask..." : "Ask anything..."}
          placeholderTextColor={placeholderColor}
          value={text}
          onChangeText={setText}
          onKeyPress={handleKeyPress}
          multiline={true}
          editable={!disabled}
          style={{ maxHeight: 120 }}
        />
        {isStreaming ? (
          <Pressable
            className={isMobile ? "h-10 w-10 items-center justify-center rounded-full bg-destructive active:opacity-80" : "rounded-xl bg-destructive px-4 py-3 active:opacity-80"}
            onPress={onAbort}
          >
            {isMobile ? (
              <Feather name="square" size={16} className="text-destructive-foreground" />
            ) : (
              <Text className="font-semibold text-destructive-foreground">Stop</Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            className={isMobile ? "h-10 w-10 items-center justify-center rounded-full bg-primary active:opacity-80 active:scale-[0.98]" : "rounded-xl bg-primary px-4 py-3 active:opacity-80 active:scale-[0.98]"}
            onPress={handleSend}
            disabled={disabled || !text.trim()}
          >
            {isMobile ? (
              <Feather name="arrow-up" size={18} className="text-primary-foreground" />
            ) : (
              <Text className="font-semibold text-primary-foreground">Send</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}
