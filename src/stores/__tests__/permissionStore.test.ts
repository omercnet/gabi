import { makePermissionRequest } from "@/test/factories";
import { resetAllStores } from "@/test/setup";
import { usePermissionStore } from "../permissionStore";

describe("permissionStore", () => {
  beforeEach(resetAllStores);
  it("upsert adds new permission", () => {
    const req = makePermissionRequest({ id: "p1" });
    usePermissionStore.getState().upsert(req);
    expect(usePermissionStore.getState().pending).toHaveLength(1);
  });

  it("upsert updates existing by id", () => {
    const req = makePermissionRequest({ id: "p1", permission: "old" });
    usePermissionStore.getState().upsert(req);
    usePermissionStore.getState().upsert({ ...req, permission: "new" });
    expect(usePermissionStore.getState().pending).toHaveLength(1);
    expect(usePermissionStore.getState().pending[0]?.permission).toBe("new");
  });

  it("remove deletes by id", () => {
    usePermissionStore.getState().upsert(makePermissionRequest({ id: "p1" }));
    usePermissionStore.getState().remove("p1");
    expect(usePermissionStore.getState().pending).toHaveLength(0);
  });

  it("remove is safe on non-existent id", () => {
    usePermissionStore.getState().upsert(makePermissionRequest({ id: "p1" }));
    usePermissionStore.getState().remove("nope");
    expect(usePermissionStore.getState().pending).toHaveLength(1);
  });

  it("clear empties pending", () => {
    usePermissionStore.getState().upsert(makePermissionRequest());
    usePermissionStore.getState().upsert(makePermissionRequest());
    usePermissionStore.getState().clear();
    expect(usePermissionStore.getState().pending).toHaveLength(0);
  });
});
