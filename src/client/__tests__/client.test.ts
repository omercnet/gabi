import { buildClient } from "../client";

jest.mock("@opencode-ai/sdk/v2/client", () => ({
  createOpencodeClient: jest.fn((config: Record<string, unknown>) => ({
    _config: config,
    global: { health: jest.fn() },
    session: { list: jest.fn() },
    event: { subscribe: jest.fn() },
  })),
}));

import { createOpencodeClient } from "@opencode-ai/sdk/v2/client";

const mockCreate = createOpencodeClient as jest.Mock;

describe("buildClient", () => {
  beforeEach(() => mockCreate.mockClear());

  it("returns a client object", () => {
    const client = buildClient({ baseUrl: "http://localhost:4096" });
    expect(client).toBeDefined();
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("passes baseUrl to SDK", () => {
    buildClient({ baseUrl: "http://localhost:4096" });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: "http://localhost:4096" }),
    );
  });

  it("adds Basic auth header when username and password provided", () => {
    buildClient({ baseUrl: "http://localhost:4096", username: "user", password: "pass" });
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.headers.Authorization).toBe(`Basic ${btoa("user:pass")}`);
  });

  it("does not add auth header when username is empty", () => {
    buildClient({ baseUrl: "http://localhost:4096", username: "", password: "pass" });
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.headers.Authorization).toBeUndefined();
  });

  it("does not add auth header when password is empty", () => {
    buildClient({ baseUrl: "http://localhost:4096", username: "user", password: "" });
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.headers.Authorization).toBeUndefined();
  });

  it("does not add auth header when both absent", () => {
    buildClient({ baseUrl: "http://localhost:4096" });
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.headers?.Authorization).toBeUndefined();
  });

  it("passes directory when provided", () => {
    buildClient({ baseUrl: "http://localhost:4096", directory: "/test" });
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ directory: "/test" }));
  });

  it("handles special characters in credentials", () => {
    buildClient({ baseUrl: "http://localhost:4096", username: "user", password: "p@$$w0rd!" });
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.headers.Authorization).toBe(`Basic ${btoa("user:p@$$w0rd!")}`);
  });
});
