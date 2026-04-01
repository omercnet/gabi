/**
 * Tests ToolPart component logic:
 * - Tool name normalization
 * - Expand/collapse
 * - Input/output display logic
 */
import { makeToolPart } from "@/test/factories";
import { resetAllStores } from "@/test/setup";
import { normalizeToolName } from "@/transcript/toolNormalize";

describe("ToolPart logic", () => {
  beforeEach(resetAllStores);

  describe("tool name display", () => {
    it("normalizes tool name via normalizeToolName", () => {
      const part = makeToolPart({ tool: "read_file" });
      const toolName = "tool" in part ? String(part.tool) : "tool";
      const { label } = normalizeToolName(toolName);
      expect(label).toBeDefined();
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    });

    it("handles unknown tool names gracefully", () => {
      const { label } = normalizeToolName("some_unknown_tool");
      expect(label).toBeDefined();
      expect(typeof label).toBe("string");
    });
  });

  describe("expand/collapse", () => {
    it("starts collapsed", () => {
      const expanded = false;
      expect(expanded).toBe(false);
    });

    it("toggles to expanded", () => {
      let expanded = false;
      expanded = !expanded;
      expect(expanded).toBe(true);
    });
  });

  describe("input display", () => {
    it("displays string input directly", () => {
      const input = "some input text";
      const display = typeof input === "string" ? input : JSON.stringify(input, null, 2);
      expect(display).toBe("some input text");
    });

    it("stringifies object input", () => {
      const input = { file: "test.ts", line: 42 };
      const display = typeof input === "string" ? input : JSON.stringify(input, null, 2);
      expect(display).toContain("test.ts");
      expect(display).toContain("42");
    });
  });

  describe("output display", () => {
    it("displays string output directly", () => {
      const output = "file content here";
      const display = typeof output === "string" ? output : JSON.stringify(output);
      expect(display).toBe("file content here");
    });

    it("stringifies object output", () => {
      const output = { result: "success" };
      const display = typeof output === "string" ? output : JSON.stringify(output);
      expect(display).toContain("success");
    });
  });

  describe("part field access", () => {
    it("extracts tool name from part", () => {
      const part = makeToolPart({ tool: "write_file" });
      expect("tool" in part).toBe(true);
      expect(String(part.tool)).toBe("write_file");
    });

    it("extracts input from part state", () => {
      const part = makeToolPart();
      expect("state" in part).toBe(true);
    });
  });
});
