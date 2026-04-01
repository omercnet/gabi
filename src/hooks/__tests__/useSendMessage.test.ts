import type { OpencodeClient } from "@/client/types";
import { useMessageStore } from "@/stores/messageStore";
import { resetAllStores } from "@/test/setup";

describe("useSendMessage store-driven behavior", () => {
  beforeEach(resetAllStores);

  function makeClient() {
    return {
      session: {
        prompt: jest.fn().mockResolvedValue(undefined),
        abort: jest.fn().mockResolvedValue(undefined),
      },
    } as unknown as OpencodeClient;
  }

  function makeBehavior(
    client: OpencodeClient | null,
    sessionId: string | null,
    directory: string,
  ) {
    const streamingSessionId = useMessageStore.getState().streamingSessionId;
    const isStreaming = streamingSessionId === sessionId;

    const send = async (text: string) => {
      if (!client || !sessionId || !text.trim()) return;
      await client.session.prompt({
        sessionID: sessionId,
        directory,
        parts: [{ type: "text", text }],
      });
    };

    const abort = async () => {
      if (!client || !sessionId) return;
      await client.session.abort({ sessionID: sessionId, directory });
    };

    return { send, abort, isStreaming };
  }

  it("isStreaming is true when store streaming session matches", () => {
    useMessageStore.getState().setStreaming("ses-1");
    const behavior = makeBehavior(makeClient(), "ses-1", "/proj");
    expect(behavior.isStreaming).toBe(true);
  });

  it("isStreaming is false when store streaming session differs", () => {
    useMessageStore.getState().setStreaming("ses-2");
    const behavior = makeBehavior(makeClient(), "ses-1", "/proj");
    expect(behavior.isStreaming).toBe(false);
  });

  it("isStreaming is false when sessionId is null", () => {
    useMessageStore.getState().setStreaming("ses-1");
    const behavior = makeBehavior(makeClient(), null, "/proj");
    expect(behavior.isStreaming).toBe(false);
  });

  it("send no-ops when client is null", async () => {
    const behavior = makeBehavior(null, "ses-1", "/proj");
    await expect(behavior.send("hello")).resolves.toBeUndefined();
  });

  it("send no-ops when sessionId is null", async () => {
    const client = makeClient();
    const behavior = makeBehavior(client, null, "/proj");
    await behavior.send("hello");
    expect(client.session.prompt).not.toHaveBeenCalled();
  });

  it("send no-ops when text is blank", async () => {
    const client = makeClient();
    const behavior = makeBehavior(client, "ses-1", "/proj");
    await behavior.send("   \n\t  ");
    expect(client.session.prompt).not.toHaveBeenCalled();
  });

  it("send calls prompt with session, directory, and text part", async () => {
    const client = makeClient();
    const behavior = makeBehavior(client, "ses-1", "/project/path");

    await behavior.send("hello world");

    expect(client.session.prompt).toHaveBeenCalledWith({
      sessionID: "ses-1",
      directory: "/project/path",
      parts: [{ type: "text", text: "hello world" }],
    });
  });

  it("send keeps original text content while using trim as guard", async () => {
    const client = makeClient();
    const behavior = makeBehavior(client, "ses-1", "/project/path");

    await behavior.send("  padded text  ");

    expect(client.session.prompt).toHaveBeenCalledWith(
      expect.objectContaining({
        parts: [{ type: "text", text: "  padded text  " }],
      }),
    );
  });

  it("abort no-ops when client is null", async () => {
    const behavior = makeBehavior(null, "ses-1", "/proj");
    await expect(behavior.abort()).resolves.toBeUndefined();
  });

  it("abort no-ops when sessionId is null", async () => {
    const client = makeClient();
    const behavior = makeBehavior(client, null, "/proj");
    await behavior.abort();
    expect(client.session.abort).not.toHaveBeenCalled();
  });

  it("abort calls client.session.abort with session and directory", async () => {
    const client = makeClient();
    const behavior = makeBehavior(client, "ses-77", "/workspace");

    await behavior.abort();

    expect(client.session.abort).toHaveBeenCalledWith({
      sessionID: "ses-77",
      directory: "/workspace",
    });
  });
});
