import type { ToolPart } from "@/client/types";

export type ToolKind = "read" | "edit" | "execute" | "search" | "other";

interface NormalizedTool {
  label: string;
  kind: ToolKind;
}

const TOOL_MAP: Record<string, NormalizedTool> = {
  read: { label: "Read", kind: "read" },
  read_file: { label: "Read", kind: "read" },
  write: { label: "Edit", kind: "edit" },
  write_file: { label: "Edit", kind: "edit" },
  edit: { label: "Edit", kind: "edit" },
  edit_file: { label: "Edit", kind: "edit" },
  bash: { label: "Execute", kind: "execute" },
  shell: { label: "Execute", kind: "execute" },
  terminal: { label: "Execute", kind: "execute" },
  grep: { label: "Search", kind: "search" },
  glob: { label: "Search", kind: "search" },
  find: { label: "Search", kind: "search" },
  search: { label: "Search", kind: "search" },
};

export function normalizeToolName(toolName: string): NormalizedTool {
  const lower = toolName.toLowerCase();
  if (TOOL_MAP[lower]) return TOOL_MAP[lower];

  for (const [key, value] of Object.entries(TOOL_MAP)) {
    if (lower.includes(key)) return value;
  }

  return { label: toolName, kind: "other" };
}

export function summarizeToolGroup(parts: ToolPart[]): string {
  const counts: Record<string, number> = {};
  for (const part of parts) {
    const name = "tool" in part ? (part as ToolPart & { tool: string }).tool : "tool";
    const { label } = normalizeToolName(name);
    counts[label] = (counts[label] ?? 0) + 1;
  }

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([label, count]) => `${count} ${label.toLowerCase()}${count > 1 ? "s" : ""}`)
    .join(", ");
}
