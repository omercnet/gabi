import { makeSession } from "@/test/factories";
import { resetAllStores } from "@/test/setup";
import { useSessionStore } from "../sessionStore";

describe("sessionStore", () => {
  beforeEach(resetAllStores);
  it("setSessions replaces sessions for directory", () => {
    const sessions = [makeSession({ id: "s1" })];
    useSessionStore.getState().setSessions("/test", sessions);
    expect(useSessionStore.getState().sessionsByDirectory["/test"]).toHaveLength(1);
  });

  it("setSessions does not affect other directories", () => {
    useSessionStore.getState().setSessions("/a", [makeSession()]);
    useSessionStore.getState().setSessions("/b", [makeSession()]);
    expect(useSessionStore.getState().sessionsByDirectory["/a"]).toHaveLength(1);
  });

  it("upsertSession prepends new session", () => {
    const existing = makeSession({ id: "s1" });
    useSessionStore.getState().setSessions("/test", [existing]);
    const newSes = makeSession({ id: "s2" });
    useSessionStore.getState().upsertSession("/test", newSes);
    const list = useSessionStore.getState().sessionsByDirectory["/test"]!;
    expect(list).toHaveLength(2);
    expect(list[0]?.id).toBe("s2");
  });

  it("upsertSession sorts by time.updated descending — newer first", () => {
    const older = makeSession({
      id: "old",
      time: { created: 0, updated: 1_000_000 },
    });
    const newer = makeSession({
      id: "new",
      time: { created: 0, updated: 2_000_000 },
    });

    useSessionStore.getState().setSessions("/test", [newer]);
    useSessionStore.getState().upsertSession("/test", older);

    const list = useSessionStore.getState().sessionsByDirectory["/test"]!;
    expect(list).toHaveLength(2);
    expect(list[0]?.id).toBe("new");
    expect(list[1]?.id).toBe("old");
  });

  it("upserting an older session does not move it ahead of newer sessions", () => {
    const newer = makeSession({
      id: "new",
      time: { created: 0, updated: 2_000_000 },
    });
    const older = makeSession({
      id: "old",
      time: { created: 0, updated: 1_000_000 },
    });

    useSessionStore.getState().setSessions("/test", [newer]);
    useSessionStore.getState().upsertSession("/test", older);

    const list = useSessionStore.getState().sessionsByDirectory["/test"]!;
    expect(list).toHaveLength(2);
    expect(list[0]?.id).toBe("new");
    expect(list[1]?.id).toBe("old");
  });

  it("upsertSession updates existing by id", () => {
    const ses = makeSession({ id: "s1", title: "old" });
    useSessionStore.getState().setSessions("/test", [ses]);
    useSessionStore.getState().upsertSession("/test", { ...ses, title: "new" });
    const list = useSessionStore.getState().sessionsByDirectory["/test"]!;
    expect(list).toHaveLength(1);
    expect(list[0]?.title).toBe("new");
  });

  it("removeSession removes by id", () => {
    useSessionStore.getState().setSessions("/test", [makeSession({ id: "s1" })]);
    useSessionStore.getState().removeSession("/test", "s1");
    expect(useSessionStore.getState().sessionsByDirectory["/test"]).toHaveLength(0);
  });

  it("removeSession clears activeSessionId when removed was active", () => {
    useSessionStore.getState().setActiveSession("s1");
    useSessionStore.getState().setSessions("/test", [makeSession({ id: "s1" })]);
    useSessionStore.getState().removeSession("/test", "s1");
    expect(useSessionStore.getState().activeSessionId).toBeNull();
  });

  it("removeSession preserves activeSessionId when different session removed", () => {
    useSessionStore.getState().setActiveSession("s1");
    useSessionStore
      .getState()
      .setSessions("/test", [makeSession({ id: "s1" }), makeSession({ id: "s2" })]);
    useSessionStore.getState().removeSession("/test", "s2");
    expect(useSessionStore.getState().activeSessionId).toBe("s1");
  });

  it("setActiveSession sets and clears", () => {
    useSessionStore.getState().setActiveSession("s1");
    expect(useSessionStore.getState().activeSessionId).toBe("s1");
    useSessionStore.getState().setActiveSession(null);
    expect(useSessionStore.getState().activeSessionId).toBeNull();
  });
});
