import { makeToolPart } from "@/test/factories";
import { normalizeToolName, summarizeToolGroup } from "../toolNormalize";

describe("normalizeToolName", () => {
  it("maps read to Read/read", () => {
    expect(normalizeToolName("read")).toEqual({ label: "Read", kind: "read" });
  });

  it("maps read_file to Read/read", () => {
    expect(normalizeToolName("read_file")).toEqual({ label: "Read", kind: "read" });
  });

  it("maps write to Edit/edit", () => {
    expect(normalizeToolName("write")).toEqual({ label: "Edit", kind: "edit" });
  });

  it("maps edit_file to Edit/edit", () => {
    expect(normalizeToolName("edit_file")).toEqual({ label: "Edit", kind: "edit" });
  });

  it("maps bash to Execute/execute", () => {
    expect(normalizeToolName("bash")).toEqual({ label: "Execute", kind: "execute" });
  });

  it("maps grep to Search/search", () => {
    expect(normalizeToolName("grep")).toEqual({ label: "Search", kind: "search" });
  });

  it("maps glob to Search/search", () => {
    expect(normalizeToolName("glob")).toEqual({ label: "Search", kind: "search" });
  });

  it("is case-insensitive", () => {
    expect(normalizeToolName("READ_FILE")).toEqual({ label: "Read", kind: "read" });
  });

  it("returns original name for unknown tools", () => {
    expect(normalizeToolName("unknown_xyz")).toEqual({ label: "unknown_xyz", kind: "other" });
  });

  it("returns empty string for empty input", () => {
    expect(normalizeToolName("")).toEqual({ label: "", kind: "other" });
  });

  it("matches partial tool names containing known keys", () => {
    expect(normalizeToolName("custom_bash_runner")).toEqual({ label: "Execute", kind: "execute" });
  });
});

describe("summarizeToolGroup", () => {
  it("returns empty string for empty array", () => {
    expect(summarizeToolGroup([])).toBe("");
  });

  it("returns singular for one tool", () => {
    const parts = [makeToolPart({ tool: "read_file" })];
    expect(summarizeToolGroup(parts)).toBe("1 read");
  });

  it("returns plural for multiple same tools", () => {
    const parts = [makeToolPart({ tool: "read_file" }), makeToolPart({ tool: "read" })];
    expect(summarizeToolGroup(parts)).toBe("2 reads");
  });

  it("sorts by count descending for mixed tools", () => {
    const parts = [
      makeToolPart({ tool: "read_file" }),
      makeToolPart({ tool: "read" }),
      makeToolPart({ tool: "edit" }),
    ];
    expect(summarizeToolGroup(parts)).toBe("2 reads, 1 edit");
  });

  it("handles all same kind", () => {
    const parts = [
      makeToolPart({ tool: "bash" }),
      makeToolPart({ tool: "bash" }),
      makeToolPart({ tool: "bash" }),
    ];
    expect(summarizeToolGroup(parts)).toBe("3 executes");
  });
});
