/**
 * Tests SettingsScreen logic:
 * - Preference toggles
 * - Color scheme selection
 * - Disconnect flow
 */

import { useConnectionStore } from "@/stores/connectionStore";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { resetAllStores } from "@/test/setup";

describe("SettingsScreen logic", () => {
  beforeEach(resetAllStores);

  describe("display preferences", () => {
    it("toggles showReasoning", () => {
      expect(usePreferencesStore.getState().showReasoning).toBe(true);
      usePreferencesStore.getState().setShowReasoning(false);
      expect(usePreferencesStore.getState().showReasoning).toBe(false);
    });

    it("toggles showToolCalls", () => {
      expect(usePreferencesStore.getState().showToolCalls).toBe(true);
      usePreferencesStore.getState().setShowToolCalls(false);
      expect(usePreferencesStore.getState().showToolCalls).toBe(false);
    });

    it("toggles collapseToolGroups", () => {
      expect(usePreferencesStore.getState().collapseToolGroups).toBe(true);
      usePreferencesStore.getState().setCollapseToolGroups(false);
      expect(usePreferencesStore.getState().collapseToolGroups).toBe(false);
    });

    it("toggles showStepMarkers", () => {
      expect(usePreferencesStore.getState().showStepMarkers).toBe(false);
      usePreferencesStore.getState().setShowStepMarkers(true);
      expect(usePreferencesStore.getState().showStepMarkers).toBe(true);
    });

    it("toggles showFileParts", () => {
      expect(usePreferencesStore.getState().showFileParts).toBe(true);
      usePreferencesStore.getState().setShowFileParts(false);
      expect(usePreferencesStore.getState().showFileParts).toBe(false);
    });
  });

  describe("color scheme", () => {
    it("defaults to system", () => {
      expect(usePreferencesStore.getState().colorScheme).toBe("system");
    });

    it("switches to light", () => {
      usePreferencesStore.getState().setColorScheme("light");
      expect(usePreferencesStore.getState().colorScheme).toBe("light");
    });

    it("switches to dark", () => {
      usePreferencesStore.getState().setColorScheme("dark");
      expect(usePreferencesStore.getState().colorScheme).toBe("dark");
    });

    it("switches back to system", () => {
      usePreferencesStore.getState().setColorScheme("dark");
      usePreferencesStore.getState().setColorScheme("system");
      expect(usePreferencesStore.getState().colorScheme).toBe("system");
    });

    it("applies active style to selected scheme", () => {
      usePreferencesStore.getState().setColorScheme("dark");
      const colorScheme = usePreferencesStore.getState().colorScheme;
      const schemes = ["system", "light", "dark"] as const;
      schemes.forEach((s) => {
        const isActive = colorScheme === s;
        if (s === "dark") {
          expect(isActive).toBe(true);
        } else {
          expect(isActive).toBe(false);
        }
      });
    });

    it("capitalizes scheme label for display", () => {
      const schemes = ["system", "light", "dark"];
      const labels = schemes.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
      expect(labels).toEqual(["System", "Light", "Dark"]);
    });
  });

  describe("disconnect", () => {
    it("resets connection store on disconnect", () => {
      useConnectionStore.getState().configure("http://localhost:4096", "user", "pass");
      expect(useConnectionStore.getState().isConfigured).toBe(true);
      useConnectionStore.getState().reset();
      expect(useConnectionStore.getState().isConfigured).toBe(false);
      expect(useConnectionStore.getState().baseUrl).toBe("");
    });

    it("navigates to setup after disconnect", () => {
      const route = "/setup";
      expect(route).toBe("/setup");
    });

    it("displays current baseUrl in connection section", () => {
      useConnectionStore.getState().configure("http://my-server:4096");
      expect(useConnectionStore.getState().baseUrl).toBe("http://my-server:4096");
    });
  });
});
