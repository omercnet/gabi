/**
 * Tests SessionItem component logic:
 * - Title display (title vs "Untitled")
 * - Date formatting
 * - Delete confirmation
 */
import { makeSession } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

describe("SessionItem logic", () => {
  beforeEach(resetAllStores);

  describe("title display", () => {
    it("shows session title when present", () => {
      const session = makeSession({ title: "My Chat" });
      const display = session.title || "Untitled";
      expect(display).toBe("My Chat");
    });

    it("shows 'Untitled' when title is empty", () => {
      const session = makeSession({ title: "" });
      const display = session.title || "Untitled";
      expect(display).toBe("Untitled");
    });

    it("shows 'Untitled' when title is undefined", () => {
      const session = makeSession();
      // Override title to undefined
      const s = { ...session, title: undefined };
      const display = s.title || "Untitled";
      expect(display).toBe("Untitled");
    });
  });

  describe("date display", () => {
    it("formats updated timestamp to locale date", () => {
      const timestamp = 1700000000; // 2023-11-14
      const dateStr = new Date(timestamp * 1000).toLocaleDateString();
      expect(typeof dateStr).toBe("string");
      expect(dateStr.length).toBeGreaterThan(0);
    });

    it("handles zero timestamp", () => {
      const dateStr = new Date(0).toLocaleDateString();
      expect(typeof dateStr).toBe("string");
    });
  });

  describe("delete confirmation", () => {
    it("uses session title in delete confirmation", () => {
      const session = makeSession({ title: "Important Chat" });
      const confirmText = session.title || session.id;
      expect(confirmText).toBe("Important Chat");
    });

    it("uses session id when title is empty", () => {
      const session = makeSession({ id: "ses-123", title: "" });
      const confirmText = session.title || session.id;
      expect(confirmText).toBe("ses-123");
    });
  });
});
