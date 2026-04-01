import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { ReasoningPart as ReasoningPartType } from "@/client/types";

interface Props {
  part: ReasoningPartType;
}

export function ReasoningPart({ part }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable onPress={() => setExpanded(!expanded)} className="my-1">
      <View className="rounded-md bg-reasoning/10 px-3 py-2">
        <Text className="text-xs font-medium text-reasoning">{expanded ? "▼" : "▶"} Thinking</Text>
        {expanded && "text" in part ? (
          <Text className="mt-1 text-xs text-muted">{part.text}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
