import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { OpencodeClient } from "@/client/types";
import { usePermissions } from "@/hooks/usePermissions";
import { usePermissionStore } from "@/stores/permissionStore";
import { makePermissionRequest } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

function makeMockClient(replyMock: jest.Mock = jest.fn().mockResolvedValue({})): OpencodeClient {
  return {
    session: {
      list: jest.fn().mockResolvedValue({ data: [] }),
      create: jest.fn().mockResolvedValue({ data: null }),
      delete: jest.fn().mockResolvedValue({}),
    },
    permission: {
      reply: replyMock,
    },
    question: {
      reply: jest.fn().mockResolvedValue({}),
      reject: jest.fn().mockResolvedValue({}),
    },
  } as unknown as OpencodeClient;
}

describe("usePermissions", () => {
  const directory = "/tmp/project";

  beforeEach(resetAllStores);

  it("returns permissions and reply", () => {
    const client = makeMockClient();
    const { result } = renderHook(() => usePermissions(client, directory));

    expect(result.current).toEqual(
      expect.objectContaining({
        permissions: expect.any(Array),
        reply: expect.any(Function),
      }),
    );
  });

  it("permissions reflects permissionStore.pending", () => {
    const pending = [makePermissionRequest({ id: "perm-1" })];
    usePermissionStore.setState({ pending });
    const client = makeMockClient();

    const { result } = renderHook(() => usePermissions(client, directory));

    expect(result.current.permissions).toEqual(pending);
  });

  it("reply(id, true) calls client.permission.reply with reply:'once'", async () => {
    const replyMock = jest.fn().mockResolvedValue({});
    const client = makeMockClient(replyMock);
    usePermissionStore.setState({ pending: [makePermissionRequest({ id: "perm-1" })] });
    const { result } = renderHook(() => usePermissions(client, directory));

    await act(async () => {
      await result.current.reply("perm-1", true);
    });

    expect(replyMock).toHaveBeenCalledWith({
      requestID: "perm-1",
      directory,
      reply: "once",
    });
  });

  it("reply(id, false) calls client.permission.reply with reply:'reject'", async () => {
    const replyMock = jest.fn().mockResolvedValue({});
    const client = makeMockClient(replyMock);
    usePermissionStore.setState({ pending: [makePermissionRequest({ id: "perm-2" })] });
    const { result } = renderHook(() => usePermissions(client, directory));

    await act(async () => {
      await result.current.reply("perm-2", false);
    });

    expect(replyMock).toHaveBeenCalledWith({
      requestID: "perm-2",
      directory,
      reply: "reject",
    });
  });

  it("reply removes permission from store after API call", async () => {
    const replyMock = jest.fn().mockResolvedValue({});
    const client = makeMockClient(replyMock);
    const request = makePermissionRequest({ id: "perm-3" });
    usePermissionStore.setState({ pending: [request] });
    const { result } = renderHook(() => usePermissions(client, directory));

    await act(async () => {
      await result.current.reply(request.id, true);
    });

    await waitFor(() => {
      expect(usePermissionStore.getState().pending).toEqual([]);
    });
  });

  it("reply does nothing when client is null", async () => {
    const request = makePermissionRequest({ id: "perm-4" });
    usePermissionStore.setState({ pending: [request] });
    const { result } = renderHook(() => usePermissions(null, directory));

    await act(async () => {
      await result.current.reply(request.id, true);
    });

    expect(usePermissionStore.getState().pending).toEqual([request]);
  });

  it("multiple pending permissions are returned", () => {
    const pending = [
      makePermissionRequest({ id: "perm-10" }),
      makePermissionRequest({ id: "perm-11" }),
    ];
    usePermissionStore.setState({ pending });
    const client = makeMockClient();

    const { result } = renderHook(() => usePermissions(client, directory));

    expect(result.current.permissions).toHaveLength(2);
    expect(result.current.permissions).toEqual(pending);
  });
});
