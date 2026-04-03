import Feather from "@expo/vector-icons/Feather";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { ReasoningPart as ReasoningPartType } from "@/client/types";

interface Props {
  part: ReasoningPartType;
}

export function ReasoningPart({ part }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable onPress={() => setExpanded(!expanded)} className="my-1 active:opacity-80">
      <View className="rounded-md bg-reasoning/10 px-3 py-2">
        <View className="flex-row items-center gap-1.5">
          <Feather
            name={expanded ? "chevron-down" : "chevron-right"}
            size={12}
            className="text-reasoning"
          />
          <Text className="font-medium text-reasoning text-xs">Thinking</Text>
        </View>
        {expanded && "text" in part ? (
          <Text className="mt-1 text-muted text-xs">{part.text}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
