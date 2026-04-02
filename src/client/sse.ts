import type { OpencodeClient } from "./client";
import type { SSEEvent, SSEStatus } from "./types";

export interface SSEManagerOptions {
  client: OpencodeClient;
  directory: string;
  onEvent: (event: SSEEvent) => void;
  onStatusChange: (status: SSEStatus) => void;
}

export class SSEManager {
  private client: OpencodeClient;
  private directory: string;
  private onEvent: (event: SSEEvent) => void;
  private onStatusChange: (status: SSEStatus) => void;
  private abortController: AbortController | null = null;
  private running = false;
  private attempt = 0;
  private status: SSEStatus = "disconnected";
  private static readonly MAX_BACKOFF = 30000;
  private static readonly BASE_DELAY = 500;
  private static readonly MAX_FAILURES = 5;

  constructor(options: SSEManagerOptions) {
    this.client = options.client;
    this.directory = options.directory;
    this.onEvent = options.onEvent;
    this.onStatusChange = options.onStatusChange;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.attempt = 0;
    this.connect();
  }

  stop(): void {
    this.running = false;
    this.abortController?.abort();
    this.abortController = null;
    this.setStatus("disconnected");
  }

  private setStatus(status: SSEStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.onStatusChange(status);
    }
  }

  private getBackoff(): number {
    const base = Math.min(SSEManager.BASE_DELAY * 2 ** this.attempt, SSEManager.MAX_BACKOFF);
    const jitter = base * (0.8 + Math.random() * 0.4);
    return jitter;
  }

  private async connect(): Promise<void> {
    if (!this.running) return;

    this.abortController = new AbortController();

    try {
      const result = await this.client.event.subscribe({
        directory: this.directory,
      });

      if (!this.running) return;

      this.attempt = 0;
      this.setStatus("connected");

      // The v2 SDK returns { stream: AsyncIterable } not the iterable directly
      const stream = (result as { stream?: unknown }).stream ?? result;

      if (stream && typeof stream === "object" && Symbol.asyncIterator in stream) {
        for await (const event of stream as AsyncIterable<SSEEvent>) {
          if (!this.running) break;
          this.onEvent(event);
        }
      }
    } catch (_error) {
      if (!this.running) return;
    }

    if (!this.running) return;
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    this.attempt++;

    if (this.attempt >= SSEManager.MAX_FAILURES) {
      this.setStatus("disconnected");
      return;
    }

    this.setStatus("reconnecting");
    const delay = this.getBackoff();

    setTimeout(() => {
      if (this.running) {
        this.connect();
      }
    }, delay);
  }
}
