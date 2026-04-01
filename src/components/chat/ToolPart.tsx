import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { ToolPart as ToolPartType } from "@/client/types";
import { normalizeToolName } from "@/transcript/toolNormalize";

interface Props {
  part: ToolPartType;
}

export function ToolPart({ part }: Props) {
  const [expanded, setExpanded] = useState(false);
  const toolName = "tool" in part ? String(part.tool) : "tool";
  const { label } = normalizeToolName(toolName);

  return (
    <Pressable onPress={() => setExpanded(!expanded)} className="my-1">
      <View className="rounded-md bg-tool/10 px-3 py-2">
        <View className="flex-row items-center gap-2">
          <Text className="font-medium text-tool text-xs">{label}</Text>
          <Text className="text-muted text-xs">{expanded ? "▼" : "▶"}</Text>
        </View>
        {expanded ? (
          <View className="mt-2">
            {"input" in part ? (
              <Text className="font-mono text-muted text-xs">
                {typeof part.input === "string" ? part.input : JSON.stringify(part.input, null, 2)}
              </Text>
            ) : null}
            {"output" in part ? (
              <View className="mt-1 border-border border-t pt-1">
                <Text className="font-mono text-muted text-xs" numberOfLines={20}>
                  {typeof part.output === "string" ? part.output : JSON.stringify(part.output)}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
