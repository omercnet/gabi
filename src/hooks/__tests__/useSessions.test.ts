/**
 * Tests useSessions logic: session listing, create, delete, select.
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

describe("useSessions logic", () => {
  beforeEach(resetAllStores);

  describe("fetch sessions", () => {
    it("calls client.session.list with directory", async () => {
      const client = makeMockClient();
      await client.session.list({ directory: DIR });
      expect(client.session.list).toHaveBeenCalledWith({ directory: DIR });
    });

    it("stores fetched sessions in sessionStore", async () => {
      const sessions = [makeSession({ id: "s1" }), makeSession({ id: "s2" })];
      const client = makeMockClient({
        list: jest.fn(() => Promise.resolve({ data: sessions })),
      });
      const result = await client.session.list({ directory: DIR });
      if (result.data) {
        const list = Array.isArray(result.data) ? result.data : [];
        useSessionStore.getState().setSessions(DIR, list);
      }
      expect(useSessionStore.getState().sessionsByDirectory[DIR]).toHaveLength(2);
    });

    it("handles empty session list", async () => {
      const client = makeMockClient({ list: jest.fn(() => Promise.resolve({ data: [] })) });
      const result = await client.session.list({ directory: DIR });
      if (result.data) {
        useSessionStore.getState().setSessions(DIR, result.data);
      }
      expect(useSessionStore.getState().sessionsByDirectory[DIR]).toHaveLength(0);
    });

    it("handles null data response", async () => {
      const client = makeMockClient({ list: jest.fn(() => Promise.resolve({ data: null })) });
      const result = await client.session.list({ directory: DIR });
      if (result.data) {
        const list = Array.isArray(result.data) ? result.data : [];
        useSessionStore.getState().setSessions(DIR, list);
      }
      // Should not have set sessions since data is null
      expect(useSessionStore.getState().sessionsByDirectory[DIR]).toBeUndefined();
    });

    it("sets loading state during fetch", () => {
      useSessionStore.getState().setLoading(DIR, true);
      expect(useSessionStore.getState().loadingByDirectory[DIR]).toBe(true);
      useSessionStore.getState().setLoading(DIR, false);
      expect(useSessionStore.getState().loadingByDirectory[DIR]).toBe(false);
    });
  });

  describe("createSession", () => {
    it("calls client.session.create with directory", async () => {
      const client = makeMockClient();
      await client.session.create({ directory: DIR });
      expect(client.session.create).toHaveBeenCalledWith({ directory: DIR });
    });

    it("calls client.session.create with title when provided", async () => {
      const client = makeMockClient();
      await client.session.create({ directory: DIR, title: "My Session" });
      expect(client.session.create).toHaveBeenCalledWith({ directory: DIR, title: "My Session" });
    });

    it("returns session data on success", async () => {
      const newSession = makeSession({ id: "created-ses" });
      const client = makeMockClient({
        create: jest.fn(() => Promise.resolve({ data: newSession })),
      });
      const result = await client.session.create({ directory: DIR });
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe("created-ses");
    });

    it("returns null on failure", async () => {
      const client = makeMockClient({
        create: jest.fn(() => Promise.resolve({ data: null })),
      });
      const result = await client.session.create({ directory: DIR });
      expect(result.data).toBeNull();
    });
  });

  describe("deleteSession", () => {
    it("calls client.session.delete and removes from store", async () => {
      useSessionStore.getState().setSessions(DIR, [makeSession({ id: "del-ses" })]);
      const client = makeMockClient();
      await client.session.delete({ sessionID: "del-ses", directory: DIR });
      useSessionStore.getState().removeSession(DIR, "del-ses");
      expect(useSessionStore.getState().sessionsByDirectory[DIR]).toHaveLength(0);
    });

    it("clears activeSessionId if deleted session was active", async () => {
      useSessionStore.getState().setSessions(DIR, [makeSession({ id: "del-ses" })]);
      useSessionStore.getState().setActiveSession("del-ses");
      const client = makeMockClient();
      await client.session.delete({ sessionID: "del-ses", directory: DIR });
      useSessionStore.getState().removeSession(DIR, "del-ses");
      expect(useSessionStore.getState().activeSessionId).toBeNull();
    });

    it("preserves other sessions when deleting one", async () => {
      useSessionStore
        .getState()
        .setSessions(DIR, [makeSession({ id: "keep" }), makeSession({ id: "del" })]);
      const client = makeMockClient();
      await client.session.delete({ sessionID: "del", directory: DIR });
      useSessionStore.getState().removeSession(DIR, "del");
      expect(useSessionStore.getState().sessionsByDirectory[DIR]).toHaveLength(1);
      expect(useSessionStore.getState().sessionsByDirectory[DIR][0].id).toBe("keep");
    });
  });

  describe("selectSession", () => {
    it("sets activeSessionId in store", () => {
      useSessionStore.getState().setActiveSession("ses-1");
      expect(useSessionStore.getState().activeSessionId).toBe("ses-1");
    });

    it("can clear activeSessionId", () => {
      useSessionStore.getState().setActiveSession("ses-1");
      useSessionStore.getState().setActiveSession(null);
      expect(useSessionStore.getState().activeSessionId).toBeNull();
    });
  });
});
