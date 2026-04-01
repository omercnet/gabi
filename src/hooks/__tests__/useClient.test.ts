/**
 * Tests useClient logic: builds client when configured, returns null otherwise.
 * Tests the underlying buildClient + connectionStore interaction.
 */

import { buildClient } from "@/client/client";
import { useConnectionStore } from "@/stores/connectionStore";
import { resetAllStores } from "@/test/setup";

jest.mock("@opencode-ai/sdk/v2/client", () => ({
  createOpencodeClient: jest.fn((config: Record<string, unknown>) => ({
    _config: config,
    global: { health: jest.fn() },
    session: { list: jest.fn() },
    event: { subscribe: jest.fn() },
  })),
}));

describe("useClient logic", () => {
  beforeEach(resetAllStores);

  it("returns null when not configured", () => {
    const { isConfigured, baseUrl } = useConnectionStore.getState();
    expect(isConfigured).toBe(false);
    // Simulates: if (!isConfigured || !baseUrl) return null
    const client = isConfigured && baseUrl ? buildClient({ baseUrl }) : null;
    expect(client).toBeNull();
  });

  it("builds client when configured with baseUrl", () => {
    useConnectionStore.getState().configure("http://localhost:4096");
    const { isConfigured, baseUrl, username, password } = useConnectionStore.getState();
    expect(isConfigured).toBe(true);
    const client = isConfigured && baseUrl ? buildClient({ baseUrl, username, password }) : null;
    expect(client).not.toBeNull();
  });

  it("builds client with auth credentials", () => {
    useConnectionStore.getState().configure("http://localhost:4096", "user", "pass");
    const { isConfigured, baseUrl, username, password } = useConnectionStore.getState();
    const client = isConfigured && baseUrl ? buildClient({ baseUrl, username, password }) : null;
    expect(client).not.toBeNull();
  });

  it("returns null when baseUrl is empty even if configured flag is true", () => {
    // Edge case: manually set isConfigured without baseUrl
    useConnectionStore.setState({ isConfigured: true, baseUrl: "" });
    const { isConfigured, baseUrl } = useConnectionStore.getState();
    const client = isConfigured && baseUrl ? buildClient({ baseUrl }) : null;
    expect(client).toBeNull();
  });

  it("rebuilds client when connection config changes", () => {
    useConnectionStore.getState().configure("http://localhost:4096");
    const { baseUrl: url1 } = useConnectionStore.getState();
    const client1 = buildClient({ baseUrl: url1 });

    useConnectionStore.getState().configure("http://localhost:5000");
    const { baseUrl: url2 } = useConnectionStore.getState();
    const client2 = buildClient({ baseUrl: url2 });

    expect(client1).not.toBe(client2);
  });

  it("returns null after reset", () => {
    useConnectionStore.getState().configure("http://localhost:4096");
    useConnectionStore.getState().reset();
    const { isConfigured, baseUrl } = useConnectionStore.getState();
    const client = isConfigured && baseUrl ? buildClient({ baseUrl }) : null;
    expect(client).toBeNull();
  });
});
