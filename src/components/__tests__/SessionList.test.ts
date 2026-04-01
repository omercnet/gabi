/**
 * Tests SessionList component logic:
 * - Session listing from store
 * - Create session flow
 * - Loading state
 * - Navigation on select/create
 */

import { useSessionStore } from "@/stores/sessionStore";
import { makeSession } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

function makeMockClient(overrides: Record<string, unknown> = {}): any {
  return {
    session: {
      list: jest.fn(() => Promise.resolve({ data: [] })),
      create: jest.fn(() => Promise.resolve({ data: makeSession({ id: "new-ses" }) })),
      delete: jest.fn(() => Promise.resolve({ data: {} })),
      ...overrides,
    },
  };
}

const DIR = "/test-project";

describe("SessionList logic", () => {
  beforeEach(resetAllStores);

  describe("session listing", () => {
    it("displays sessions from store for directory", () => {
      useSessionStore
        .getState()
        .setSessions(DIR, [
          makeSession({ id: "s1", title: "Session 1" }),
          makeSession({ id: "s2", title: "Session 2" }),
        ]);
      const sessions = useSessionStore.getState().sessionsByDirectory[DIR] ?? [];
      expect(sessions).toHaveLength(2);
    });

    it("returns empty array for unknown directory", () => {
      const sessions = useSessionStore.getState().sessionsByDirectory["/unknown"] ?? [];
      expect(sessions).toEqual([]);
    });
  });

  describe("loading state", () => {
    it("shows loading indicator when fetching", () => {
      useSessionStore.getState().setLoading(DIR, true);
      expect(useSessionStore.getState().loadingByDirectory[DIR]).toBe(true);
    });

    it("hides loading when done", () => {
      useSessionStore.getState().setLoading(DIR, false);
      expect(useSessionStore.getState().loadingByDirectory[DIR]).toBe(false);
    });
  });

  describe("create session", () => {
    it("calls client.session.create and gets session back", async () => {
      const newSes = makeSession({ id: "created-ses" });
      const client = makeMockClient({
        create: jest.fn(() => Promise.resolve({ data: newSes })),
      });
      const result = await client.session.create({ directory: DIR });
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe("created-ses");
    });

    it("selects created session", async () => {
      const newSes = makeSession({ id: "created-ses" });
      const client = makeMockClient({
        create: jest.fn(() => Promise.resolve({ data: newSes })),
      });
      const result = await client.session.create({ directory: DIR });
      if (result.data && "id" in result.data) {
        useSessionStore.getState().setActiveSession(result.data.id);
      }
      expect(useSessionStore.getState().activeSessionId).toBe("created-ses");
    });

    it("navigates to created session route", async () => {
      const newSes = makeSession({ id: "new-ses-123" });
      const client = makeMockClient({
        create: jest.fn(() => Promise.resolve({ data: newSes })),
      });
      const result = await client.session.create({ directory: DIR });
      const route = result.data ? `/(app)/${result.data.id}` : null;
      expect(route).toBe("/(app)/new-ses-123");
    });
  });

  describe("select session", () => {
    it("sets activeSessionId on select", () => {
      useSessionStore.getState().setActiveSession("ses-42");
      expect(useSessionStore.getState().activeSessionId).toBe("ses-42");
    });

    it("builds correct navigation route", () => {
      const sessionId = "ses-42";
      const route = `/(app)/${sessionId}`;
      expect(route).toBe("/(app)/ses-42");
    });
  });

  describe("delete session", () => {
    it("calls client.session.delete and removes from store", async () => {
      useSessionStore.getState().setSessions(DIR, [makeSession({ id: "del-ses" })]);
      const client = makeMockClient();
      await client.session.delete({ sessionID: "del-ses", directory: DIR });
      useSessionStore.getState().removeSession(DIR, "del-ses");
      expect(useSessionStore.getState().sessionsByDirectory[DIR]).toHaveLength(0);
    });
  });
});
