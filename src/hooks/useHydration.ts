import { useEffect, useState } from "react";
import { useConnectionStore } from "@/stores/connectionStore";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { useProjectStore } from "@/stores/projectStore";

/**
 * Returns true once all persisted Zustand stores have rehydrated from AsyncStorage.
 * Use this to gate rendering that depends on persisted state, preventing
 * React hydration mismatches between SSR defaults and client-side values.
 */
export function useHydration(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsubs = [
      useConnectionStore.persist.onFinishHydration(() => check()),
      useProjectStore.persist.onFinishHydration(() => check()),
      usePreferencesStore.persist.onFinishHydration(() => check()),
    ];

    // Check if already hydrated (stores may have finished before this effect runs)
    check();

    function check() {
      if (
        useConnectionStore.persist.hasHydrated() &&
        useProjectStore.persist.hasHydrated() &&
        usePreferencesStore.persist.hasHydrated()
      ) {
        setHydrated(true);
      }
    }

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, []);

  return hydrated;
}
