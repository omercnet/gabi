import { useSessionStore } from "@/stores/sessionStore";
import { makeSession } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

describe("useSessions store paths", () => {
  beforeEach(resetAllStores);

  it("returns empty sessions for untouched directory", () => {
    expect(useSessionStore.getState().sessionsByDirectory["/project"] ?? []).toEqual([]);
  });

  it("setSessions replaces sessions for a directory", () => {
    useSessionStore.getState().setSessions("/project", [makeSession({ id: "s1" })]);
    useSessionStore.getState().setSessions("/project", [makeSession({ id: "s2" })]);

    const list = useSessionStore.getState().sessionsByDirectory["/project"];
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe("s2");
  });

  it("setSessions does not affect other directories", () => {
    useSessionStore.getState().setSessions("/a", [makeSession({ id: "a1" })]);
    useSessionStore.getState().setSessions("/b", [makeSession({ id: "b1" })]);

    expect(useSessionStore.getState().sessionsByDirectory["/a"]).toHaveLength(1);
    expect(useSessionStore.getState().sessionsByDirectory["/b"]).toHaveLength(1);
  });

  it("upsertSession prepends a new session", () => {
    useSessionStore.getState().setSessions("/project", [makeSession({ id: "s1" })]);

    useSessionStore.getState().upsertSession("/project", makeSession({ id: "s2" }));

    const list = useSessionStore.getState().sessionsByDirectory["/project"];
    expect(list).toHaveLength(2);
    expect(list[0]?.id).toBe("s2");
    expect(list[1]?.id).toBe("s1");
  });

  it("upsertSession updates existing session by id", () => {
    const session = makeSession({ id: "s1", title: "Old" });
    useSessionStore.getState().setSessions("/project", [session]);

    useSessionStore.getState().upsertSession("/project", { ...session, title: "New" });

    const list = useSessionStore.getState().sessionsByDirectory["/project"];
    expect(list).toHaveLength(1);
    expect(list[0]?.title).toBe("New");
  });

  it("upsertSession creates list for missing directory", () => {
    useSessionStore.getState().upsertSession("/project", makeSession({ id: "s1" }));

    expect(useSessionStore.getState().sessionsByDirectory["/project"]).toHaveLength(1);
  });

  it("removeSession removes matching id", () => {
    useSessionStore
      .getState()
      .setSessions("/project", [makeSession({ id: "s1" }), makeSession({ id: "s2" })]);

    useSessionStore.getState().removeSession("/project", "s1");

    expect(useSessionStore.getState().sessionsByDirectory["/project"]?.map((s) => s.id)).toEqual([
      "s2",
    ]);
  });

  it("removeSession is safe for unknown id", () => {
    useSessionStore.getState().setSessions("/project", [makeSession({ id: "s1" })]);

    useSessionStore.getState().removeSession("/project", "nope");

    expect(useSessionStore.getState().sessionsByDirectory["/project"]).toHaveLength(1);
  });

  it("removeSession clears active session when removed session is active", () => {
    useSessionStore.getState().setActiveSession("s1");
    useSessionStore.getState().setSessions("/project", [makeSession({ id: "s1" })]);

    useSessionStore.getState().removeSession("/project", "s1");

    expect(useSessionStore.getState().activeSessionId).toBeNull();
  });

  it("removeSession keeps active session when removing a different id", () => {
    useSessionStore.getState().setActiveSession("s1");
    useSessionStore
      .getState()
      .setSessions("/project", [makeSession({ id: "s1" }), makeSession({ id: "s2" })]);

    useSessionStore.getState().removeSession("/project", "s2");

    expect(useSessionStore.getState().activeSessionId).toBe("s1");
  });

  it("setLoading stores true for directory", () => {
    useSessionStore.getState().setLoading("/project", true);

    expect(useSessionStore.getState().loadingByDirectory["/project"]).toBe(true);
  });

  it("setLoading only updates requested directory", () => {
    useSessionStore.getState().setLoading("/a", true);
    useSessionStore.getState().setLoading("/b", false);

    expect(useSessionStore.getState().loadingByDirectory["/a"]).toBe(true);
    expect(useSessionStore.getState().loadingByDirectory["/b"]).toBe(false);
  });

  it("setActiveSession sets active id", () => {
    useSessionStore.getState().setActiveSession("s1");
    expect(useSessionStore.getState().activeSessionId).toBe("s1");
  });

  it("setActiveSession clears active id with null", () => {
    useSessionStore.getState().setActiveSession("s1");
    useSessionStore.getState().setActiveSession(null);

    expect(useSessionStore.getState().activeSessionId).toBeNull();
  });
});
