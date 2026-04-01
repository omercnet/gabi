import type { Message, Part, ToolPart } from "@/client/types";

export interface HydratedMessage {
  message: Message;
  parts: Part[];
}

export interface CollapsedToolGroup {
  kind: "tool-group";
  parts: ToolPart[];
  summary: string;
}

export interface SinglePart {
  kind: "part";
  part: Part;
}

export type RenderItem = CollapsedToolGroup | SinglePart;
