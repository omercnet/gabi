import { useCallback } from "react";
import type { OpencodeClient } from "@/client/types";
import { usePermissionStore } from "@/stores/permissionStore";

export function usePermissions(client: OpencodeClient | null, directory: string) {
  const pending = usePermissionStore((s) => s.pending);
  const remove = usePermissionStore((s) => s.remove);

  const reply = useCallback(
    async (id: string, allow: boolean) => {
      if (!client) return;
      await client.permission.reply({
        requestID: id,
        directory,
        reply: allow ? "once" : "reject",
      });
      remove(id);
    },
    [client, directory, remove],
  );

  return { permissions: pending, reply };
}
