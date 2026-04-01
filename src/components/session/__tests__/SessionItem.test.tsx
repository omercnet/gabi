import { makeSession } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

jest.mock("expo-router");

function sessionTitle(session: ReturnType<typeof makeSession>): string {
  return session.title || "Untitled";
}

function sessionDate(session: ReturnType<typeof makeSession>): string {
  return new Date(session.time.updated * 1000).toLocaleDateString();
}

function buildDeletePrompt(session: ReturnType<typeof makeSession>, onDelete: () => void) {
  return {
    title: "Delete session?",
    message: session.title || session.id,
    actions: [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ],
  };
}

describe("SessionItem logic", () => {
  beforeEach(resetAllStores);

  it("uses explicit title when present", () => {
    const session = makeSession({ title: "Roadmap" });
    expect(sessionTitle(session)).toBe("Roadmap");
  });

  it("falls back to Untitled when title is empty", () => {
    const session = makeSession({ title: "" });
    expect(sessionTitle(session)).toBe("Untitled");
  });

  it("formats updated date from unix timestamp seconds", () => {
    const session = makeSession({ time: { created: 0, updated: 1704067200 } });
    expect(sessionDate(session)).toBe(new Date(1704067200 * 1000).toLocaleDateString());
  });

  it("builds destructive delete confirmation action", () => {
    const onDelete = jest.fn();
    const session = makeSession({ title: "Demo" });
    const prompt = buildDeletePrompt(session, onDelete);
    expect(prompt.title).toBe("Delete session?");
    expect(prompt.actions[1]).toMatchObject({ text: "Delete", style: "destructive" });
  });
});
