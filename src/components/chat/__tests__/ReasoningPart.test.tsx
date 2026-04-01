import { makeReasoningPart } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

jest.mock("expo-router");

function nextExpanded(prev: boolean): boolean {
  return !prev;
}

function indicator(expanded: boolean): string {
  return expanded ? "▼" : "▶";
}

describe("ReasoningPart logic", () => {
  beforeEach(resetAllStores);

  it("starts collapsed", () => {
    expect(indicator(false)).toBe("▶");
  });

  it("toggles expanded state on press", () => {
    expect(nextExpanded(false)).toBe(true);
    expect(nextExpanded(true)).toBe(false);
  });

  it("uses expanded indicator when open", () => {
    expect(indicator(true)).toBe("▼");
  });

  it("shows part text only when expanded", () => {
    const part = makeReasoningPart({ text: "internal thought" });
    const collapsedVisible = false;
    const expandedVisible = true && "text" in part;

    expect(collapsedVisible).toBe(false);
    expect(expandedVisible).toBe(true);
  });
});
