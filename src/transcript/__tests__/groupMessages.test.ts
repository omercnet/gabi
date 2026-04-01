import { makeTextPart, makeToolPart } from "@/test/factories";
import { groupParts } from "../groupMessages";

describe("groupParts", () => {
  it("returns empty array for empty input", () => {
    expect(groupParts([])).toEqual([]);
  });

  it("wraps single text part as SinglePart", () => {
    const part = makeTextPart();
    const result = groupParts([part]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("part");
  });

  it("does NOT group a single tool part", () => {
    const part = makeToolPart();
    const result = groupParts([part]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("part");
  });

  it("groups 2 consecutive tool parts into tool-group", () => {
    const parts = [makeToolPart(), makeToolPart()];
    const result = groupParts(parts);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("tool-group");
    if (result[0].kind === "tool-group") {
      expect(result[0].parts).toHaveLength(2);
    }
  });

  it("groups 3 consecutive tool parts into single tool-group", () => {
    const parts = [makeToolPart(), makeToolPart(), makeToolPart()];
    const result = groupParts(parts);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("tool-group");
  });

  it("does not group non-adjacent tools: tool, text, tool", () => {
    const parts = [makeToolPart(), makeTextPart(), makeToolPart()];
    const result = groupParts(parts);
    expect(result).toHaveLength(3);
    expect(result.every((r) => r.kind === "part")).toBe(true);
  });

  it("groups correctly: text, tool, tool, text", () => {
    const parts = [makeTextPart(), makeToolPart(), makeToolPart(), makeTextPart()];
    const result = groupParts(parts);
    expect(result).toHaveLength(3);
    expect(result[0].kind).toBe("part");
    expect(result[1].kind).toBe("tool-group");
    expect(result[2].kind).toBe("part");
  });

  it("creates two groups: tool, tool, text, tool, tool", () => {
    const parts = [makeToolPart(), makeToolPart(), makeTextPart(), makeToolPart(), makeToolPart()];
    const result = groupParts(parts);
    expect(result).toHaveLength(3);
    expect(result[0].kind).toBe("tool-group");
    expect(result[1].kind).toBe("part");
    expect(result[2].kind).toBe("tool-group");
  });

  it("groups all tools (5) into single group", () => {
    const parts = Array.from({ length: 5 }, () => makeToolPart());
    const result = groupParts(parts);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("tool-group");
  });

  it("tool-group has non-empty summary", () => {
    const parts = [makeToolPart(), makeToolPart()];
    const result = groupParts(parts);
    if (result[0].kind === "tool-group") {
      expect(result[0].summary.length).toBeGreaterThan(0);
    }
  });
});
