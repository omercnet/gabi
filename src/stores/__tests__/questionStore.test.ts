import { resetAllStores } from "@/test/setup";
import { makeQuestionRequest } from "@/test/factories";
import { useQuestionStore } from "../questionStore";

describe("questionStore", () => {
  beforeEach(resetAllStores);
  it("upsert adds new question", () => {
    useQuestionStore.getState().upsert(makeQuestionRequest({ id: "q1" }));
    expect(useQuestionStore.getState().pending).toHaveLength(1);
  });

  it("upsert updates existing by id", () => {
    const req = makeQuestionRequest({ id: "q1" });
    useQuestionStore.getState().upsert(req);
    useQuestionStore.getState().upsert({ ...req, sessionID: "new-ses" });
    expect(useQuestionStore.getState().pending).toHaveLength(1);
    expect(useQuestionStore.getState().pending[0].sessionID).toBe("new-ses");
  });

  it("remove deletes by id", () => {
    useQuestionStore.getState().upsert(makeQuestionRequest({ id: "q1" }));
    useQuestionStore.getState().remove("q1");
    expect(useQuestionStore.getState().pending).toHaveLength(0);
  });

  it("clear empties pending", () => {
    useQuestionStore.getState().upsert(makeQuestionRequest());
    useQuestionStore.getState().upsert(makeQuestionRequest());
    useQuestionStore.getState().clear();
    expect(useQuestionStore.getState().pending).toHaveLength(0);
  });
});
