import { usePreferencesStore } from "@/stores/preferencesStore";
import { makeFilePart, makeReasoningPart, makeTextPart, makeToolPart } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

jest.mock("expo-router");

function shouldRender(type: string): boolean {
  const state = usePreferencesStore.getState();
  switch (type) {
    case "reasoning":
      return state.showReasoning;
    case "tool":
      return state.showToolCalls;
    case "file":
      return state.showFileParts;
    case "step-start":
    case "step-finish":
      return state.showStepMarkers;
    case "text":
    case "subtask":
      return true;
    default:
      return false;
  }
}

describe("PartRenderer logic", () => {
  beforeEach(resetAllStores);

  it("renders text parts regardless of preferences", () => {
    const part = makeTextPart();
    expect(shouldRender(part.type)).toBe(true);
  });

  it("respects showReasoning preference", () => {
    usePreferencesStore.getState().setShowReasoning(false);
    expect(shouldRender(makeReasoningPart().type)).toBe(false);
  });

  it("respects showToolCalls preference", () => {
    usePreferencesStore.getState().setShowToolCalls(false);
    expect(shouldRender(makeToolPart().type)).toBe(false);
  });

  it("respects showFileParts preference", () => {
    usePreferencesStore.getState().setShowFileParts(false);
    expect(shouldRender(makeFilePart().type)).toBe(false);
  });

  it("hides step markers by default", () => {
    expect(shouldRender("step-start")).toBe(false);
    expect(shouldRender("step-finish")).toBe(false);
  });

  it("shows step markers when enabled", () => {
    usePreferencesStore.getState().setShowStepMarkers(true);
    expect(shouldRender("step-start")).toBe(true);
    expect(shouldRender("step-finish")).toBe(true);
  });

  it("always renders subtask parts", () => {
    expect(shouldRender("subtask")).toBe(true);
  });

  it("returns false for unknown part types", () => {
    expect(shouldRender("unknown-type")).toBe(false);
  });
});
