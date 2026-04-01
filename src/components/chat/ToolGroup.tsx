import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { usePreferencesStore } from "@/stores/preferencesStore";
import type { CollapsedToolGroup } from "@/transcript/types";
import { ToolPart } from "./ToolPart";

interface Props {
  group: CollapsedToolGroup;
}

export function ToolGroup({ group }: Props) {
  const collapseByDefault = usePreferencesStore((s) => s.collapseToolGroups);
  const [expanded, setExpanded] = useState(!collapseByDefault);

  return (
    <View className="my-1">
      <Pressable onPress={() => setExpanded(!expanded)} className="rounded-md bg-tool/10 px-3 py-2">
        <Text className="font-medium text-tool text-xs">
          {expanded ? "▼" : "▶"} {group.summary}
        </Text>
      </Pressable>
      {expanded ? (
        <View className="ml-2 border-tool/20 border-l-2 pl-2">
          {group.parts.map((part) => (
            <ToolPart key={part.id} part={part} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
