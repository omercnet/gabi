/**
 * Tests PartRenderer component logic:
 * - Conditional rendering based on preferences
 * - Part type dispatching
 */

import type { Part } from "@/client/types";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { makeFilePart, makeReasoningPart, makeTextPart, makeToolPart } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

function shouldRenderPart(
  part: Part,
  prefs: ReturnType<typeof usePreferencesStore.getState>,
): boolean {
  switch (part.type) {
    case "text":
      return true;
    case "reasoning":
      return prefs.showReasoning;
    case "tool":
      return prefs.showToolCalls;
    case "file":
      return prefs.showFileParts;
    case "step-start":
    case "step-finish":
      return prefs.showStepMarkers;
    case "subtask":
      return true;
    default:
      return false;
  }
}

describe("PartRenderer logic", () => {
  beforeEach(resetAllStores);

  describe("text parts", () => {
    it("always renders text parts", () => {
      const prefs = usePreferencesStore.getState();
      expect(shouldRenderPart(makeTextPart(), prefs)).toBe(true);
    });

    it("renders text parts even with all prefs disabled", () => {
      usePreferencesStore.getState().setShowReasoning(false);
      usePreferencesStore.getState().setShowToolCalls(false);
      usePreferencesStore.getState().setShowFileParts(false);
      const prefs = usePreferencesStore.getState();
      expect(shouldRenderPart(makeTextPart(), prefs)).toBe(true);
    });
  });

  describe("reasoning parts", () => {
    it("renders when showReasoning is true", () => {
      usePreferencesStore.getState().setShowReasoning(true);
      expect(shouldRenderPart(makeReasoningPart(), usePreferencesStore.getState())).toBe(true);
    });

    it("hides when showReasoning is false", () => {
      usePreferencesStore.getState().setShowReasoning(false);
      expect(shouldRenderPart(makeReasoningPart(), usePreferencesStore.getState())).toBe(false);
    });
  });

  describe("tool parts", () => {
    it("renders when showToolCalls is true", () => {
      usePreferencesStore.getState().setShowToolCalls(true);
      expect(shouldRenderPart(makeToolPart(), usePreferencesStore.getState())).toBe(true);
    });

    it("hides when showToolCalls is false", () => {
      usePreferencesStore.getState().setShowToolCalls(false);
      expect(shouldRenderPart(makeToolPart(), usePreferencesStore.getState())).toBe(false);
    });
  });

  describe("file parts", () => {
    it("renders when showFileParts is true", () => {
      usePreferencesStore.getState().setShowFileParts(true);
      expect(shouldRenderPart(makeFilePart(), usePreferencesStore.getState())).toBe(true);
    });

    it("hides when showFileParts is false", () => {
      usePreferencesStore.getState().setShowFileParts(false);
      expect(shouldRenderPart(makeFilePart(), usePreferencesStore.getState())).toBe(false);
    });
  });

  describe("step markers", () => {
    it("renders when showStepMarkers is true", () => {
      usePreferencesStore.getState().setShowStepMarkers(true);
      const stepPart = {
        id: "s1",
        type: "step-start" as const,
        sessionID: "ses-1",
        messageID: "msg-1",
      } as Part;
      expect(shouldRenderPart(stepPart, usePreferencesStore.getState())).toBe(true);
    });

    it("hides when showStepMarkers is false (default)", () => {
      const stepPart = {
        id: "s1",
        type: "step-start" as const,
        sessionID: "ses-1",
        messageID: "msg-1",
      } as Part;
      expect(shouldRenderPart(stepPart, usePreferencesStore.getState())).toBe(false);
    });
  });

  describe("subtask parts", () => {
    it("always renders subtask parts", () => {
      const subtaskPart = {
        id: "sub1",
        type: "subtask" as const,
        sessionID: "ses-1",
        messageID: "msg-1",
        description: "Do thing",
      } as Part;
      expect(shouldRenderPart(subtaskPart, usePreferencesStore.getState())).toBe(true);
    });
  });

  describe("unknown part types", () => {
    it("returns false for unknown types", () => {
      const unknownPart = {
        id: "u1",
        type: "unknown" as never,
        sessionID: "ses-1",
        messageID: "msg-1",
      } as Part;
      expect(shouldRenderPart(unknownPart, usePreferencesStore.getState())).toBe(false);
    });
  });
});
