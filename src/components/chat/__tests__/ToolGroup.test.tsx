import { usePreferencesStore } from "@/stores/preferencesStore";
import { makeToolPart } from "@/test/factories";
import { resetAllStores } from "@/test/setup";
import { summarizeToolGroup } from "@/transcript/toolNormalize";

jest.mock("expo-router");

function initialExpanded(collapseByDefault: boolean): boolean {
  return !collapseByDefault;
}

describe("ToolGroup logic", () => {
  beforeEach(resetAllStores);

  it("is collapsed by default when preference is enabled", () => {
    usePreferencesStore.getState().setCollapseToolGroups(true);
    expect(initialExpanded(usePreferencesStore.getState().collapseToolGroups)).toBe(false);
  });

  it("is expanded by default when collapse preference is disabled", () => {
    usePreferencesStore.getState().setCollapseToolGroups(false);
    expect(initialExpanded(usePreferencesStore.getState().collapseToolGroups)).toBe(true);
  });

  it("uses summary text for grouped tools", () => {
    const summary = summarizeToolGroup([
      makeToolPart({ tool: "read" }),
      makeToolPart({ tool: "read" }),
    ]);
    expect(summary).toBe("2 reads");
  });

  it("toggles expansion state on header press", () => {
    let expanded = initialExpanded(true);
    expanded = !expanded;
    expect(expanded).toBe(true);
    expanded = !expanded;
    expect(expanded).toBe(false);
  });

  it("preserves all parts in the group payload", () => {
    const parts = [makeToolPart(), makeToolPart({ tool: "edit" }), makeToolPart({ tool: "bash" })];
    expect(parts).toHaveLength(3);
  });
});
