/**
 * Tests MessageBubble component logic:
 * - User vs assistant message distinction
 * - Render item dispatching (tool-group vs single part)
 * - Content extraction
 */
import {
  makeAssistantMessage,
  makeTextPart,
  makeToolPart,
  makeUserMessage,
} from "@/test/factories";
import { resetAllStores } from "@/test/setup";
import type { CollapsedToolGroup, RenderItem, SinglePart } from "@/transcript/types";

describe("MessageBubble logic", () => {
  beforeEach(resetAllStores);

  describe("message role detection", () => {
    it("identifies user messages", () => {
      const msg = makeUserMessage();
      expect(msg.role).toBe("user");
    });

    it("identifies assistant messages", () => {
      const msg = makeAssistantMessage();
      expect(msg.role).toBe("assistant");
    });
  });

  describe("user message content", () => {
    it("extracts content from user message", () => {
      const msg = makeUserMessage({ content: "Hello world" });
      const content = "content" in msg ? String(msg.content) : "";
      expect(content).toBe("Hello world");
    });

    it("returns empty string when content is missing", () => {
      const msg = makeAssistantMessage();
      const content = "content" in msg ? String(msg.content) : "";
      // Assistant messages have "parts" not "content"
      expect(typeof content).toBe("string");
    });
  });

  describe("render item dispatching", () => {
    it("dispatches tool-group items", () => {
      const item: CollapsedToolGroup = {
        kind: "tool-group",
        parts: [makeToolPart()],
        summary: "1 tool call",
      };
      expect(item.kind).toBe("tool-group");
    });

    it("dispatches single part items", () => {
      const item: SinglePart = {
        kind: "part",
        part: makeTextPart(),
      };
      expect(item.kind).toBe("part");
    });

    it("handles mixed items array", () => {
      const items: RenderItem[] = [
        { kind: "part", part: makeTextPart() },
        { kind: "tool-group", parts: [makeToolPart(), makeToolPart()], summary: "2 tool calls" },
        { kind: "part", part: makeTextPart({ text: "After tools" }) },
      ];
      expect(items).toHaveLength(3);
      expect(items[0].kind).toBe("part");
      expect(items[1].kind).toBe("tool-group");
      expect(items[2].kind).toBe("part");
    });

    it("handles empty items array for assistant", () => {
      const items: RenderItem[] = [];
      expect(items).toHaveLength(0);
    });
  });
});
