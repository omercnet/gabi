import { act, renderHook } from "@testing-library/react-native";
import { buildClient } from "@/client/client";
import { useClient } from "@/hooks/useClient";
import { useConnectionStore } from "@/stores/connectionStore";
import { resetAllStores } from "@/test/setup";

const mockClient = { id: "mock-client" };

jest.mock("@/client/client", () => ({ buildClient: jest.fn(() => mockClient) }));

const mockedBuildClient = jest.mocked(buildClient);

describe("useClient", () => {
  beforeEach(() => {
    resetAllStores();
    mockedBuildClient.mockClear();
  });

  it("returns null when not configured", () => {
    useConnectionStore.setState({
      baseUrl: "http://localhost:4096",
      username: "u",
      password: "p",
      isConfigured: false,
    });

    const { result } = renderHook(() => useClient());

    expect(result.current).toBeNull();
    expect(mockedBuildClient).not.toHaveBeenCalled();
  });

  it("returns null when baseUrl is empty", () => {
    useConnectionStore.setState({
      baseUrl: "",
      username: "u",
      password: "p",
      isConfigured: true,
    });

    const { result } = renderHook(() => useClient());

    expect(result.current).toBeNull();
    expect(mockedBuildClient).not.toHaveBeenCalled();
  });

  it("returns client when configured", () => {
    useConnectionStore.setState({
      baseUrl: "http://localhost:4096",
      username: "u",
      password: "p",
      isConfigured: true,
    });

    const { result } = renderHook(() => useClient());

    expect(result.current).toBe(mockClient);
  });

  it("calls buildClient with correct args", () => {
    useConnectionStore.setState({
      baseUrl: "http://localhost:4096",
      username: "alice",
      password: "secret",
      isConfigured: true,
    });

    renderHook(() => useClient());

    expect(mockedBuildClient).toHaveBeenCalledWith({
      baseUrl: "http://localhost:4096",
      username: "alice",
      password: "secret",
    });
  });

  it("memoizes client for same config", () => {
    useConnectionStore.setState({
      baseUrl: "http://localhost:4096",
      username: "u",
      password: "p",
      isConfigured: true,
    });

    const { result, rerender } = renderHook(() => useClient());
    const first = result.current;

    rerender({});

    expect(result.current).toBe(first);
    expect(mockedBuildClient).toHaveBeenCalledTimes(1);
  });

  it("updates client when config changes", () => {
    useConnectionStore.setState({
      baseUrl: "http://localhost:4096",
      username: "u1",
      password: "p1",
      isConfigured: true,
    });

    const { result, rerender } = renderHook(() => useClient());

    expect(mockedBuildClient).toHaveBeenCalledTimes(1);
    expect(mockedBuildClient).toHaveBeenCalledWith({
      baseUrl: "http://localhost:4096",
      username: "u1",
      password: "p1",
    });

    act(() => {
      useConnectionStore.setState({
        baseUrl: "http://localhost:5000",
        username: "u2",
        password: "p2",
        isConfigured: true,
      });
    });

    rerender({});

    expect(mockedBuildClient).toHaveBeenCalledTimes(2);
    expect(mockedBuildClient).toHaveBeenNthCalledWith(2, {
      baseUrl: "http://localhost:5000",
      username: "u2",
      password: "p2",
    });
  });
});
