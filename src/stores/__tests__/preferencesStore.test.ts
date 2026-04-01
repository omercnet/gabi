import { resetAllStores } from "@/test/setup";
import { usePreferencesStore } from "../preferencesStore";

describe("preferencesStore", () => {
  beforeEach(resetAllStores);
  it("has correct defaults", () => {
    const s = usePreferencesStore.getState();
    expect(s.showReasoning).toBe(true);
    expect(s.showToolCalls).toBe(true);
    expect(s.showStepMarkers).toBe(false);
    expect(s.showFileParts).toBe(true);
    expect(s.collapseToolGroups).toBe(true);
    expect(s.colorScheme).toBe("system");
  });

  it("setShowReasoning toggles", () => {
    usePreferencesStore.getState().setShowReasoning(false);
    expect(usePreferencesStore.getState().showReasoning).toBe(false);
  });

  it("setShowToolCalls toggles", () => {
    usePreferencesStore.getState().setShowToolCalls(false);
    expect(usePreferencesStore.getState().showToolCalls).toBe(false);
  });

  it("setShowStepMarkers toggles", () => {
    usePreferencesStore.getState().setShowStepMarkers(true);
    expect(usePreferencesStore.getState().showStepMarkers).toBe(true);
  });

  it("setShowFileParts toggles", () => {
    usePreferencesStore.getState().setShowFileParts(false);
    expect(usePreferencesStore.getState().showFileParts).toBe(false);
  });

  it("setCollapseToolGroups toggles", () => {
    usePreferencesStore.getState().setCollapseToolGroups(false);
    expect(usePreferencesStore.getState().collapseToolGroups).toBe(false);
  });

  it("setColorScheme changes scheme", () => {
    usePreferencesStore.getState().setColorScheme("dark");
    expect(usePreferencesStore.getState().colorScheme).toBe("dark");
    usePreferencesStore.getState().setColorScheme("light");
    expect(usePreferencesStore.getState().colorScheme).toBe("light");
  });
});
