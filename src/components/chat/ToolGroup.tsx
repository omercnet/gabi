import Feather from "@expo/vector-icons/Feather";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePreferencesStore } from "@/stores/preferencesStore";
import type { CollapsedToolGroup } from "@/transcript/types";
import { ToolPart } from "./ToolPart";

interface Props {
  group: CollapsedToolGroup;
}

export function ToolGroup({ group }: Props) {
  const collapseByDefault = usePreferencesStore((s) => s.collapseToolGroups);
  const [expanded, setExpanded] = useState(!collapseByDefault);
  const isMobile = useIsMobile();

  return (
    <View className="my-1">
      <Pressable
        onPress={() => setExpanded(!expanded)}
        className={
          isMobile
            ? "rounded-md bg-tool/10 px-2 py-1.5 active:opacity-80"
            : "rounded-md bg-tool/10 px-3 py-2 active:opacity-80"
        }
      >
        <View className="flex-row items-center gap-1.5">
          <Feather
            name={expanded ? "chevron-down" : "chevron-right"}
            size={12}
            className="text-tool"
          />
          <Text className="font-medium text-tool text-xs">
            {isMobile ? `${group.parts.length} tools` : group.summary}
          </Text>
        </View>
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
