import { resetAllStores } from "@/test/setup";
import { useConnectionStore } from "../connectionStore";

describe("connectionStore", () => {
  beforeEach(resetAllStores);
  it("has correct initial state", () => {
    const s = useConnectionStore.getState();
    expect(s.isConfigured).toBe(false);
    expect(s.health).toBe("unknown");
    expect(s.sseStatus).toBe("disconnected");
    expect(s.baseUrl).toBe("");
  });

  it("configure sets url, user, pass and isConfigured", () => {
    useConnectionStore.getState().configure("http://localhost:4096", "u", "p");
    const s = useConnectionStore.getState();
    expect(s.baseUrl).toBe("http://localhost:4096");
    expect(s.username).toBe("u");
    expect(s.password).toBe("p");
    expect(s.isConfigured).toBe(true);
  });

  it("configure without credentials sets empty strings", () => {
    useConnectionStore.getState().configure("http://localhost:4096");
    const s = useConnectionStore.getState();
    expect(s.username).toBe("");
    expect(s.password).toBe("");
    expect(s.isConfigured).toBe(true);
  });

  it("setHealth updates health", () => {
    useConnectionStore.getState().setHealth("healthy");
    expect(useConnectionStore.getState().health).toBe("healthy");
  });

  it("setSseStatus updates sseStatus", () => {
    useConnectionStore.getState().setSseStatus("connected");
    expect(useConnectionStore.getState().sseStatus).toBe("connected");
  });

  it("reset returns to initial state", () => {
    useConnectionStore.getState().configure("http://x", "u", "p");
    useConnectionStore.getState().setHealth("healthy");
    useConnectionStore.getState().reset();
    const s = useConnectionStore.getState();
    expect(s.isConfigured).toBe(false);
    expect(s.baseUrl).toBe("");
    expect(s.health).toBe("unknown");
  });

  it("second configure overwrites first", () => {
    useConnectionStore.getState().configure("http://a");
    useConnectionStore.getState().configure("http://b");
    expect(useConnectionStore.getState().baseUrl).toBe("http://b");
  });
});
