import { useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";

interface Props {
  onSend: (text: string) => Promise<void>;
  onAbort: () => Promise<void>;
  isStreaming: boolean;
  disabled: boolean;
}

export function ChatInput({ onSend, onAbort, isStreaming, disabled }: Props) {
  const [text, setText] = useState("");

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
    <View className="border-t border-border bg-surface px-4 py-3">
      <View className="flex-row items-end gap-2">
        <TextInput
          className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-foreground"
          placeholder="Ask anything..."
          placeholderTextColor="#737373"
          value={text}
          onChangeText={setText}
          onKeyPress={handleKeyPress}
          multiline
          editable={!disabled}
          style={{ maxHeight: 120 }}
        />
        {isStreaming ? (
          <Pressable className="rounded-xl bg-destructive px-4 py-3" onPress={onAbort}>
            <Text className="font-semibold text-destructive-foreground">Stop</Text>
          </Pressable>
        ) : (
          <Pressable
            className="rounded-xl bg-primary px-4 py-3"
            onPress={handleSend}
            disabled={disabled || !text.trim()}
          >
            <Text className="font-semibold text-primary-foreground">Send</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
