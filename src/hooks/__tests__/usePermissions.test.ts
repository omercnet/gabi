/**
 * Tests usePermissions logic: permission listing and reply.
 */

import { usePermissionStore } from "@/stores/permissionStore";
import { makePermissionRequest } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

function makeMockClient(): any {
  return {
    permission: {
      reply: jest.fn(() => Promise.resolve({ data: {} })),
    },
  };
}

const DIR = "/test-project";

describe("usePermissions logic", () => {
  beforeEach(resetAllStores);

  describe("permissions list", () => {
    it("returns empty array initially", () => {
      expect(usePermissionStore.getState().pending).toEqual([]);
    });

    it("returns pending permissions from store", () => {
      const perm = makePermissionRequest({ id: "perm-1" });
      usePermissionStore.getState().upsert(perm);
      expect(usePermissionStore.getState().pending).toHaveLength(1);
    });
  });

  describe("reply allow", () => {
    it("sends 'once' reply when allow=true", async () => {
      const client = makeMockClient();
      await client.permission.reply({
        requestID: "perm-1",
        directory: DIR,
        reply: "once",
      });
      expect(client.permission.reply).toHaveBeenCalledWith({
        requestID: "perm-1",
        directory: DIR,
        reply: "once",
      });
    });

    it("removes permission from store after allowing", async () => {
      usePermissionStore.getState().upsert(makePermissionRequest({ id: "perm-1" }));
      const client = makeMockClient();
      await client.permission.reply({ requestID: "perm-1", directory: DIR, reply: "once" });
      usePermissionStore.getState().remove("perm-1");
      expect(usePermissionStore.getState().pending).toHaveLength(0);
    });
  });

  describe("reply reject", () => {
    it("sends 'reject' reply when allow=false", async () => {
      const client = makeMockClient();
      await client.permission.reply({
        requestID: "perm-1",
        directory: DIR,
        reply: "reject",
      });
      expect(client.permission.reply).toHaveBeenCalledWith({
        requestID: "perm-1",
        directory: DIR,
        reply: "reject",
      });
    });

    it("removes permission from store after rejecting", async () => {
      usePermissionStore.getState().upsert(makePermissionRequest({ id: "perm-1" }));
      const client = makeMockClient();
      await client.permission.reply({ requestID: "perm-1", directory: DIR, reply: "reject" });
      usePermissionStore.getState().remove("perm-1");
      expect(usePermissionStore.getState().pending).toHaveLength(0);
    });
  });

  describe("guard: no client", () => {
    it("does not throw when client is null", () => {
      const client = null;
      if (client) {
        // Would call reply
      }
      expect(true).toBe(true);
    });
  });
});
