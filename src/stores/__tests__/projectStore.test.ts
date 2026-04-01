import { resetAllStores } from "@/test/setup";
import { useProjectStore } from "../projectStore";

describe("projectStore", () => {
  beforeEach(resetAllStores);
  it("starts with empty projects", () => {
    expect(useProjectStore.getState().projects).toHaveLength(0);
  });

  it("addProject returns created project", () => {
    const p = useProjectStore.getState().addProject("Test", "/test");
    expect(p.name).toBe("Test");
    expect(p.directory).toBe("/test");
    expect(p.id).toBeDefined();
  });

  it("addProject increments projects array", () => {
    useProjectStore.getState().addProject("A", "/a");
    useProjectStore.getState().addProject("B", "/b");
    expect(useProjectStore.getState().projects).toHaveLength(2);
  });

  it("addProject sets unique ids", () => {
    const a = useProjectStore.getState().addProject("A", "/a");
    const b = useProjectStore.getState().addProject("B", "/b");
    expect(a.id).not.toBe(b.id);
  });

  it("addProject sets addedAt near Date.now()", () => {
    const before = Date.now();
    const p = useProjectStore.getState().addProject("T", "/t");
    expect(p.addedAt).toBeGreaterThanOrEqual(before);
    expect(p.addedAt).toBeLessThanOrEqual(Date.now());
  });

  it("removeProject removes by id", () => {
    const p = useProjectStore.getState().addProject("T", "/t");
    useProjectStore.getState().removeProject(p.id);
    expect(useProjectStore.getState().projects).toHaveLength(0);
  });

  it("removeProject clears activeProjectId if it was the removed project", () => {
    const p = useProjectStore.getState().addProject("T", "/t");
    useProjectStore.getState().setActiveProject(p.id);
    useProjectStore.getState().removeProject(p.id);
    expect(useProjectStore.getState().activeProjectId).toBeNull();
  });

  it("removeProject preserves activeProjectId if different project removed", () => {
    const a = useProjectStore.getState().addProject("A", "/a");
    const b = useProjectStore.getState().addProject("B", "/b");
    useProjectStore.getState().setActiveProject(a.id);
    useProjectStore.getState().removeProject(b.id);
    expect(useProjectStore.getState().activeProjectId).toBe(a.id);
  });

  it("setActiveProject sets and clears", () => {
    useProjectStore.getState().setActiveProject("x");
    expect(useProjectStore.getState().activeProjectId).toBe("x");
    useProjectStore.getState().setActiveProject(null);
    expect(useProjectStore.getState().activeProjectId).toBeNull();
  });

  it("getProjectById returns correct project", () => {
    const p = useProjectStore.getState().addProject("T", "/t");
    expect(useProjectStore.getState().getProjectById(p.id)).toEqual(p);
  });

  it("getProjectById returns undefined for unknown id", () => {
    expect(useProjectStore.getState().getProjectById("nope")).toBeUndefined();
  });
});
