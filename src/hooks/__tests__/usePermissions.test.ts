import type { OpencodeClient } from "@/client/types";
import { usePermissionStore } from "@/stores/permissionStore";
import { makePermissionRequest } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

async function replyPermission(
  client: OpencodeClient | null,
  directory: string,
  id: string,
  allow: boolean,
): Promise<void> {
  if (!client) return;
  await client.permission.reply({
    requestID: id,
    directory,
    reply: allow ? "once" : "reject",
  });
  usePermissionStore.getState().remove(id);
}

describe("usePermissions store paths", () => {
  beforeEach(resetAllStores);

  it("upsert adds pending permission", () => {
    usePermissionStore.getState().upsert(makePermissionRequest({ id: "p1" }));
    expect(usePermissionStore.getState().pending).toHaveLength(1);
  });

  it("upsert updates existing permission by id", () => {
    const request = makePermissionRequest({ id: "p1", permission: "file.read" });
    usePermissionStore.getState().upsert(request);
    usePermissionStore.getState().upsert({ ...request, permission: "file.write" });

    expect(usePermissionStore.getState().pending).toHaveLength(1);
    expect(usePermissionStore.getState().pending[0]?.permission).toBe("file.write");
  });

  it("remove deletes pending permission by id", () => {
    usePermissionStore.getState().upsert(makePermissionRequest({ id: "p1" }));
    usePermissionStore.getState().remove("p1");

    expect(usePermissionStore.getState().pending).toHaveLength(0);
  });

  it("remove is safe for unknown id", () => {
    usePermissionStore.getState().upsert(makePermissionRequest({ id: "p1" }));
    usePermissionStore.getState().remove("missing");

    expect(usePermissionStore.getState().pending).toHaveLength(1);
  });

  it("reply allow sends once and removes request", async () => {
    usePermissionStore.getState().upsert(makePermissionRequest({ id: "p1" }));
    const reply = jest.fn().mockResolvedValue({});
    const client = { permission: { reply } } as unknown as OpencodeClient;

    await replyPermission(client, "/project", "p1", true);

    expect(reply).toHaveBeenCalledWith({ requestID: "p1", directory: "/project", reply: "once" });
    expect(usePermissionStore.getState().pending).toHaveLength(0);
  });

  it("reply deny sends reject and removes request", async () => {
    usePermissionStore.getState().upsert(makePermissionRequest({ id: "p1" }));
    const reply = jest.fn().mockResolvedValue({});
    const client = { permission: { reply } } as unknown as OpencodeClient;

    await replyPermission(client, "/project", "p1", false);

    expect(reply).toHaveBeenCalledWith({ requestID: "p1", directory: "/project", reply: "reject" });
    expect(usePermissionStore.getState().pending).toHaveLength(0);
  });

  it("reply is a no-op when client is null", async () => {
    usePermissionStore.getState().upsert(makePermissionRequest({ id: "p1" }));

    await replyPermission(null, "/project", "p1", true);

    expect(usePermissionStore.getState().pending).toHaveLength(1);
  });
});
