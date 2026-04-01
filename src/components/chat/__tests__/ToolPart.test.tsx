import { makeToolPart } from "@/test/factories";
import { resetAllStores } from "@/test/setup";
import { normalizeToolName } from "@/transcript/toolNormalize";

jest.mock("expo-router");

function formatInput(input: unknown): string {
  return typeof input === "string" ? input : JSON.stringify(input, null, 2);
}

function formatOutput(output: unknown): string {
  return typeof output === "string" ? output : JSON.stringify(output);
}

describe("ToolPart logic", () => {
  beforeEach(resetAllStores);

  it("normalizes known tool names to labels", () => {
    const part = makeToolPart({ tool: "read_file" });
    expect(normalizeToolName(String(part.tool)).label).toBe("Read");
  });

  it("keeps unknown tool names as label", () => {
    const part = makeToolPart({ tool: "custom_tool_xyz" as never });
    expect(normalizeToolName(String(part.tool)).label).toBe("custom_tool_xyz");
  });

  it("formats string input unchanged", () => {
    expect(formatInput("raw input")).toBe("raw input");
  });

  it("formats object input as pretty JSON", () => {
    expect(formatInput({ file: "a.ts" })).toBe(JSON.stringify({ file: "a.ts" }, null, 2));
  });

  it("formats output using compact JSON for non-string values", () => {
    expect(formatOutput({ ok: true })).toBe(JSON.stringify({ ok: true }));
  });
});
