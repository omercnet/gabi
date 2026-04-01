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

  if (config.username && config.password) {
    const encoded = btoa(`${config.username}:${config.password}`);
    headers["Authorization"] = `Basic ${encoded}`;
  }

  return createOpencodeClient({
    baseUrl: config.baseUrl as `${string}://${string}`,
    directory: config.directory,
    headers,
  });
}

export type { OpencodeClient };
