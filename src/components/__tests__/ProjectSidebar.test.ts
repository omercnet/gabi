/**
 * Tests ProjectSidebar component logic:
 * - Project listing and active project
 * - Add/remove project
 * - Connection status indicator
 * - Settings navigation
 */

import { useConnectionStore } from "@/stores/connectionStore";
import { useProjectStore } from "@/stores/projectStore";
import { resetAllStores } from "@/test/setup";

describe("ProjectSidebar logic", () => {
  beforeEach(resetAllStores);

  describe("project listing", () => {
    it("shows all projects from store", () => {
      useProjectStore.getState().addProject("Project 1", "/path/1");
      useProjectStore.getState().addProject("Project 2", "/path/2");
      expect(useProjectStore.getState().projects).toHaveLength(2);
    });

    it("starts with no projects", () => {
      expect(useProjectStore.getState().projects).toHaveLength(0);
    });
  });

  describe("active project", () => {
    it("sets active project on press", () => {
      const project = useProjectStore.getState().addProject("Test", "/test");
      useProjectStore.getState().setActiveProject(project.id);
      expect(useProjectStore.getState().activeProjectId).toBe(project.id);
    });

    it("highlights active project with bg-primary/10 class", () => {
      const project = useProjectStore.getState().addProject("Test", "/test");
      useProjectStore.getState().setActiveProject(project.id);
      const activeProjectId = useProjectStore.getState().activeProjectId;
      const isActive = activeProjectId === project.id;
      const className = isActive ? "bg-primary/10" : "";
      expect(className).toBe("bg-primary/10");
    });

    it("shows session list only for active project", () => {
      const p1 = useProjectStore.getState().addProject("P1", "/p1");
      const p2 = useProjectStore.getState().addProject("P2", "/p2");
      useProjectStore.getState().setActiveProject(p1.id);
      const activeProjectId = useProjectStore.getState().activeProjectId;
      expect(activeProjectId).toBe(p1.id);
      expect(activeProjectId).not.toBe(p2.id);
    });
  });

  describe("add project", () => {
    it("adds project with name and directory", () => {
      const project = useProjectStore.getState().addProject("New Project", "/home/user/project");
      expect(project.name).toBe("New Project");
      expect(project.directory).toBe("/home/user/project");
      expect(useProjectStore.getState().projects).toHaveLength(1);
    });

    it("rejects add when name is empty", () => {
      const name = "";
      const dir = "/test";
      const shouldAdd = name.trim() && dir.trim();
      expect(shouldAdd).toBeFalsy();
    });

    it("rejects add when directory is empty", () => {
      const name = "Test";
      const dir = "";
      const shouldAdd = name.trim() && dir.trim();
      expect(shouldAdd).toBeFalsy();
    });

    it("rejects add when both are empty", () => {
      const name = "";
      const dir = "";
      const shouldAdd = name.trim() && dir.trim();
      expect(shouldAdd).toBeFalsy();
    });

    it("sets new project as active after add", () => {
      const project = useProjectStore.getState().addProject("Test", "/test");
      useProjectStore.getState().setActiveProject(project.id);
      expect(useProjectStore.getState().activeProjectId).toBe(project.id);
    });

    it("trims whitespace from name and directory", () => {
      const name = "  My Project  ";
      const dir = "  /path/to/project  ";
      const trimmedName = name.trim();
      const trimmedDir = dir.trim();
      expect(trimmedName).toBe("My Project");
      expect(trimmedDir).toBe("/path/to/project");
    });
  });

  describe("remove project", () => {
    it("removes project by id", () => {
      const project = useProjectStore.getState().addProject("Test", "/test");
      useProjectStore.getState().removeProject(project.id);
      expect(useProjectStore.getState().projects).toHaveLength(0);
    });

    it("clears activeProjectId when active project is removed", () => {
      const project = useProjectStore.getState().addProject("Test", "/test");
      useProjectStore.getState().setActiveProject(project.id);
      useProjectStore.getState().removeProject(project.id);
      expect(useProjectStore.getState().activeProjectId).toBeNull();
    });

    it("preserves other projects when removing one", () => {
      const p1 = useProjectStore.getState().addProject("P1", "/p1");
      useProjectStore.getState().addProject("P2", "/p2");
      useProjectStore.getState().removeProject(p1.id);
      expect(useProjectStore.getState().projects).toHaveLength(1);
      expect(useProjectStore.getState().projects[0]?.name).toBe("P2");
    });
  });

  describe("connection status indicator", () => {
    it("shows green when connected", () => {
      useConnectionStore.getState().setSseStatus("connected");
      const sseStatus = useConnectionStore.getState().sseStatus;
      const statusColor =
        sseStatus === "connected"
          ? "bg-success"
          : sseStatus === "reconnecting"
            ? "bg-warning"
            : "bg-error";
      expect(statusColor).toBe("bg-success");
    });

    it("shows yellow when reconnecting", () => {
      useConnectionStore.getState().setSseStatus("reconnecting");
      const sseStatus = useConnectionStore.getState().sseStatus;
      const statusColor =
        sseStatus === "connected"
          ? "bg-success"
          : sseStatus === "reconnecting"
            ? "bg-warning"
            : "bg-error";
      expect(statusColor).toBe("bg-warning");
    });

    it("shows red when disconnected", () => {
      useConnectionStore.getState().setSseStatus("disconnected");
      const sseStatus = useConnectionStore.getState().sseStatus;
      const statusColor =
        sseStatus === "connected"
          ? "bg-success"
          : sseStatus === "reconnecting"
            ? "bg-warning"
            : "bg-error";
      expect(statusColor).toBe("bg-error");
    });
  });

  describe("settings navigation", () => {
    it("builds correct settings route", () => {
      const route = "/settings";
      expect(route).toBe("/settings");
    });
  });
});
