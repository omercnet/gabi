import type { Part, ToolPart } from "@/client/types";
import { summarizeToolGroup } from "./toolNormalize";
import type { RenderItem } from "./types";

function isToolPart(part: Part): part is ToolPart {
  return part.type === "tool";
}

export function groupParts(parts: Part[]): RenderItem[] {
  const items: RenderItem[] = [];
  let toolBuffer: ToolPart[] = [];

  const flushToolBuffer = () => {
    if (toolBuffer.length >= 2) {
      items.push({
        kind: "tool-group",
        parts: [...toolBuffer],
        summary: summarizeToolGroup(toolBuffer),
      });
    } else {
      for (const t of toolBuffer) {
        items.push({ kind: "part", part: t });
      }
    }
    toolBuffer = [];
  };

  for (const part of parts) {
    if (isToolPart(part)) {
      toolBuffer.push(part);
    } else {
      flushToolBuffer();
      items.push({ kind: "part", part });
    }
  }

  flushToolBuffer();
  return items;
}
