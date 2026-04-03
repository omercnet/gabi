import { Text, View } from "react-native";
import type { Part } from "@/client/types";
import { MarkdownRenderer } from "@/components/shared";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { ReasoningPart } from "./ReasoningPart";
import { ToolPart } from "./ToolPart";

interface Props {
  part: Part;
}

export function PartRenderer({ part }: Props) {
  const showReasoning = usePreferencesStore((s) => s.showReasoning);
  const showToolCalls = usePreferencesStore((s) => s.showToolCalls);
  const showStepMarkers = usePreferencesStore((s) => s.showStepMarkers);
  const showFileParts = usePreferencesStore((s) => s.showFileParts);

  switch (part.type) {
    case "text":
      return (
        <View className="py-1">
          <MarkdownRenderer content={part.text} />
        </View>
      );
    case "reasoning":
      return showReasoning ? <ReasoningPart part={part} /> : null;
    case "tool":
      return showToolCalls ? <ToolPart part={part} /> : null;
    case "file":
      return showFileParts ? (
        <View className="my-1 rounded-md bg-surface px-3 py-2">
          <Text className="text-muted text-xs">
            📄 {"filename" in part ? String(part.filename) : "file"}
          </Text>
        </View>
      ) : null;
    case "step-start":
    case "step-finish":
      return showStepMarkers ? <View className="my-2 border-border border-t" /> : null;
    case "subtask":
      return (
        <View className="my-1 rounded-md bg-surface px-3 py-2">
          <Text className="text-muted text-xs">⚡ {part.description}</Text>
        </View>
      );
    default:
      return null;
  }
}
