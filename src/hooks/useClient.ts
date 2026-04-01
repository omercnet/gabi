import { useMemo } from "react";
import { buildClient } from "@/client/client";
import type { OpencodeClient } from "@/client/types";
import { useConnectionStore } from "@/stores/connectionStore";

export function useClient(): OpencodeClient | null {
  const { baseUrl, username, password, isConfigured } = useConnectionStore();

  return useMemo(() => {
    if (!(isConfigured && baseUrl)) return null;
    return buildClient({ baseUrl, username, password });
  }, [baseUrl, username, password, isConfigured]);
}
