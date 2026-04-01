import { createOpencodeClient } from "@opencode-ai/sdk/v2/client";
import { buildClient } from "@/client/client";
import { useConnectionStore } from "@/stores/connectionStore";
import { resetAllStores } from "@/test/setup";

jest.mock("@opencode-ai/sdk/v2/client", () => ({
  createOpencodeClient: jest.fn(),
}));

describe("useClient store-driven behavior", () => {
  beforeEach(() => {
    resetAllStores();
    jest.clearAllMocks();
  });

  function resolveClientFromStore() {
    const { baseUrl, username, password, isConfigured } = useConnectionStore.getState();
    if (!isConfigured || !baseUrl) return null;
    return buildClient({ baseUrl, username, password });
  }

  it("returns null when connection is not configured", () => {
    expect(resolveClientFromStore()).toBeNull();
    expect(createOpencodeClient).not.toHaveBeenCalled();
  });

  it("returns null when configured with empty baseUrl", () => {
    useConnectionStore.getState().configure("");

    expect(resolveClientFromStore()).toBeNull();
    expect(createOpencodeClient).not.toHaveBeenCalled();
  });

  it("configure stores baseUrl, username, password", () => {
    useConnectionStore.getState().configure("https://secure.example.com", "alice", "secret");

    const state = useConnectionStore.getState();
    expect(state.baseUrl).toBe("https://secure.example.com");
    expect(state.username).toBe("alice");
    expect(state.password).toBe("secret");
    expect(state.isConfigured).toBe(true);
  });

  it("calls buildClient with configured credentials", () => {
    const buildClientSpy = jest.spyOn(require("@/client/client"), "buildClient");

    useConnectionStore.getState().configure("https://secure.example.com", "alice", "secret");
    resolveClientFromStore();

    expect(buildClientSpy).toHaveBeenCalledWith({
      baseUrl: "https://secure.example.com",
      username: "alice",
      password: "secret",
    });
  });

  it("calls buildClient with empty credentials when omitted", () => {
    const buildClientSpy = jest.spyOn(require("@/client/client"), "buildClient");

    useConnectionStore.getState().configure("https://api.example.com");
    resolveClientFromStore();

    expect(buildClientSpy).toHaveBeenCalledWith({
      baseUrl: "https://api.example.com",
      username: "",
      password: "",
    });
  });

  it("buildClient uses SDK with basic auth header", () => {
    useConnectionStore.getState().configure("https://secure.example.com", "alice", "secret");
    resolveClientFromStore();

    expect(createOpencodeClient).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: "https://secure.example.com",
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic\s+/),
        }),
      }),
    );
  });

  it("uses latest values after reconfigure", () => {
    const buildClientSpy = jest.spyOn(require("@/client/client"), "buildClient");

    useConnectionStore.getState().configure("https://one.example.com", "u1", "p1");
    resolveClientFromStore();

    useConnectionStore.getState().configure("https://two.example.com", "u2", "p2");
    resolveClientFromStore();

    expect(buildClientSpy).toHaveBeenNthCalledWith(1, {
      baseUrl: "https://one.example.com",
      username: "u1",
      password: "p1",
    });
    expect(buildClientSpy).toHaveBeenNthCalledWith(2, {
      baseUrl: "https://two.example.com",
      username: "u2",
      password: "p2",
    });
  });
});
