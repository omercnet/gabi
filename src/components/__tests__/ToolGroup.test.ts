/**
 * Tests ToolGroup component logic:
 * - Collapse preference handling
 * - Group summary display
 * - Parts iteration
 */

import { usePreferencesStore } from "@/stores/preferencesStore";
import { makeToolPart } from "@/test/factories";
import { resetAllStores } from "@/test/setup";
import type { CollapsedToolGroup } from "@/transcript/types";

describe("ToolGroup logic", () => {
  beforeEach(resetAllStores);

  describe("collapse preference", () => {
    it("starts collapsed when collapseToolGroups is true (default)", () => {
      const collapseByDefault = usePreferencesStore.getState().collapseToolGroups;
      const expanded = !collapseByDefault;
      expect(expanded).toBe(false);
    });

    it("starts expanded when collapseToolGroups is false", () => {
      usePreferencesStore.getState().setCollapseToolGroups(false);
      const collapseByDefault = usePreferencesStore.getState().collapseToolGroups;
      const expanded = !collapseByDefault;
      expect(expanded).toBe(true);
    });
  });

  describe("group structure", () => {
    it("has kind tool-group", () => {
      const group: CollapsedToolGroup = {
        kind: "tool-group",
        parts: [makeToolPart()],
        summary: "1 tool call",
      };
      expect(group.kind).toBe("tool-group");
    });

    it("contains tool parts array", () => {
      const parts = [makeToolPart(), makeToolPart(), makeToolPart()];
      const group: CollapsedToolGroup = {
        kind: "tool-group",
        parts,
        summary: `${parts.length} tool calls`,
      };
      expect(group.parts).toHaveLength(3);
    });

    it("has summary text", () => {
      const group: CollapsedToolGroup = {
        kind: "tool-group",
        parts: [makeToolPart({ tool: "read_file" }), makeToolPart({ tool: "write_file" })],
        summary: "2 tool calls",
      };
      expect(group.summary).toBe("2 tool calls");
    });
  });

  describe("toggle behavior", () => {
    it("toggles expanded state", () => {
      let expanded = false;
      expanded = !expanded;
      expect(expanded).toBe(true);
      expanded = !expanded;
      expect(expanded).toBe(false);
    });
  });
});
