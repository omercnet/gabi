import type { OpencodeClient } from "@opencode-ai/sdk/v2/client";
import { createOpencodeClient } from "@opencode-ai/sdk/v2/client";

export interface ClientConfig {
  baseUrl: string;
  username?: string;
  password?: string;
  directory?: string;
}

export function buildClient(config: ClientConfig): OpencodeClient {
  const headers: Record<string, string> = {};

  if (config.password) {
    const user = config.username || "opencode";
    const encoded = btoa(`${user}:${config.password}`);
    headers.Authorization = `Basic ${encoded}`;
  }

  return createOpencodeClient({
    baseUrl: config.baseUrl as `${string}://${string}`,
    ...(config.directory === undefined ? {} : { directory: config.directory }),
    headers,
  });
}

export type { OpencodeClient };
