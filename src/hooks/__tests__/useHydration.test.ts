import { renderHook } from "@testing-library/react-native";

// jest.mock factories must be self-contained (no out-of-scope variable references)
jest.mock("@/stores/connectionStore", () => ({
  useConnectionStore: {
    persist: {
      hasHydrated: jest.fn().mockReturnValue(false),
      onFinishHydration: jest.fn().mockReturnValue(jest.fn()),
    },
  },
}));
jest.mock("@/stores/projectStore", () => ({
  useProjectStore: {
    persist: {
      hasHydrated: jest.fn().mockReturnValue(false),
      onFinishHydration: jest.fn().mockReturnValue(jest.fn()),
    },
  },
}));
jest.mock("@/stores/preferencesStore", () => ({
  usePreferencesStore: {
    persist: {
      hasHydrated: jest.fn().mockReturnValue(false),
      onFinishHydration: jest.fn().mockReturnValue(jest.fn()),
    },
  },
}));

import { useHydration } from "@/hooks/useHydration";
// Import AFTER jest.mock declarations
import { useConnectionStore } from "@/stores/connectionStore";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { useProjectStore } from "@/stores/projectStore";

type PersistMock = { hasHydrated: jest.Mock; onFinishHydration: jest.Mock };
type StoreMock = { persist: PersistMock };

const conn = useConnectionStore as unknown as StoreMock;
const proj = useProjectStore as unknown as StoreMock;
const prefs = usePreferencesStore as unknown as StoreMock;

beforeEach(() => {
  jest.clearAllMocks();
  conn.persist.hasHydrated.mockReturnValue(false);
  proj.persist.hasHydrated.mockReturnValue(false);
  prefs.persist.hasHydrated.mockReturnValue(false);
  conn.persist.onFinishHydration.mockReturnValue(jest.fn());
  proj.persist.onFinishHydration.mockReturnValue(jest.fn());
  prefs.persist.onFinishHydration.mockReturnValue(jest.fn());
});

describe("useHydration", () => {
  it("returns false initially when stores are not hydrated", () => {
    const { result } = renderHook(() => useHydration());
    expect(result.current).toBe(false);
  });

  it("returns true when all three stores are already hydrated on mount", () => {
    conn.persist.hasHydrated.mockReturnValue(true);
    proj.persist.hasHydrated.mockReturnValue(true);
    prefs.persist.hasHydrated.mockReturnValue(true);
    const { result } = renderHook(() => useHydration());
    expect(result.current).toBe(true);
  });

  it("subscribes to onFinishHydration on all three stores", () => {
    renderHook(() => useHydration());
    expect(conn.persist.onFinishHydration).toHaveBeenCalledTimes(1);
    expect(proj.persist.onFinishHydration).toHaveBeenCalledTimes(1);
    expect(prefs.persist.onFinishHydration).toHaveBeenCalledTimes(1);
  });

  it("calls unsub functions on unmount to prevent memory leaks", () => {
    const connUnsub = jest.fn();
    const projUnsub = jest.fn();
    const prefsUnsub = jest.fn();
    conn.persist.onFinishHydration.mockReturnValue(connUnsub);
    proj.persist.onFinishHydration.mockReturnValue(projUnsub);
    prefs.persist.onFinishHydration.mockReturnValue(prefsUnsub);

    const { unmount } = renderHook(() => useHydration());
    unmount();

    expect(connUnsub).toHaveBeenCalledTimes(1);
    expect(projUnsub).toHaveBeenCalledTimes(1);
    expect(prefsUnsub).toHaveBeenCalledTimes(1);
  });
});
