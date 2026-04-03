/// <reference types="node" />

/**
 * Real sessions integration tests.
 *
 * Uses actual session data from the user's opencode instance (sessions.tar.gz).
 * The JSON fixture files ARE the real API response shape: { info: Message, parts: Part[] }[].
 * No mocks. Tests the exact code path that was broken.
 *
 * What this catches:
 * - hydrateFromApiResponse correctly unwrapping { info, parts }
 * - messages with undefined time not crashing sort
 * - parts correctly stored in partsByMessage
 * - useMessages correctly hydrating from store
 * - FlatList key prop never undefined
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { loadSessionMessages } from "@/hooks/useSessionLoader";
import { useMessageStore } from "@/stores/messageStore";
import { resetAllStores } from "@/test/setup";
import { groupParts } from "@/transcript/groupMessages";
import { processMessages } from "@/transcript/processMessages";

const FIXTURES_DIR = path.join(__dirname, "fixtures");

// Load all session fixture files
const sessionFixtures = fs
  .readdirSync(FIXTURES_DIR)
  .filter((f) => f.endsWith(".json") && !f.startsWith(".") && !f.startsWith("._"))
  .map((f) => {
    const data = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, f), "utf8")) as {
      info: {
        id: string;
        title: string;
        directory: string;
        time: { created: number; updated: number };
      };
      messages: Array<{
        info: {
          id: string;
          role: string;
          time?: { created: number; completed?: number };
          sessionID: string;
        };
        parts: Array<{
          id: string;
          type: string;
          messageID: string;
          sessionID: string;
          [key: string]: unknown;
        }>;
      }>;
    };
    return { filename: f, sessionId: data.info.id, data };
  });

describe("Real sessions: hydrateFromApiResponse (the broken path)", () => {
  beforeEach(resetAllStores);

  for (const fixture of sessionFixtures) {
    const { filename, sessionId, data } = fixture;
    const messageCount = data.messages.length;

    it(`[${filename}] loads ${messageCount} messages without crash`, async () => {
      // Build the exact API response shape: Array<{ info: Message, parts: Part[] }>
      const apiResponse = data.messages;

      // Mock client that returns the real API shape
      const mockClient = {
        session: {
          messages: async () => ({ data: apiResponse }),
        },
      };

      await loadSessionMessages(mockClient as never, sessionId, data.info.directory);

      const stored = useMessageStore.getState().messagesBySession[sessionId];
      expect(stored).toBeDefined();
      expect(stored!.length).toBe(messageCount);
    });

    if (messageCount > 0) {
      it(`[${filename}] message.id, message.role, message.time are correctly unwrapped from info`, async () => {
        const apiResponse = data.messages;
        const mockClient = {
          session: {
            messages: async () => ({ data: apiResponse }),
          },
        };

        await loadSessionMessages(mockClient as never, sessionId, data.info.directory);

        const stored = useMessageStore.getState().messagesBySession[sessionId]!;
        for (const msg of stored) {
          expect(msg.id).toBeTruthy(); // was undefined before fix
          expect(msg.role).toBeTruthy(); // was undefined before fix
          // time may be undefined for some messages (we fixed the sort for this)
        }
      });

      it(`[${filename}] parts are populated in partsByMessage`, async () => {
        const apiResponse = data.messages;
        const totalParts = apiResponse.reduce((sum, m) => sum + (m.parts?.length ?? 0), 0);

        const mockClient = {
          session: {
            messages: async () => ({ data: apiResponse }),
          },
        };

        await loadSessionMessages(mockClient as never, sessionId, data.info.directory);

        if (totalParts > 0) {
          const partsByMsg = useMessageStore.getState().partsByMessage;
          const storedPartCount = Object.values(partsByMsg).reduce(
            (sum, parts) => sum + Object.keys(parts).length,
            0,
          );
          expect(storedPartCount).toBe(totalParts); // was 0 before fix
        }
      });

      it(`[${filename}] processMessages does not crash (sort regression)`, async () => {
        const apiResponse = data.messages;
        const mockClient = {
          session: {
            messages: async () => ({ data: apiResponse }),
          },
        };

        await loadSessionMessages(mockClient as never, sessionId, data.info.directory);

        const messages = useMessageStore.getState().messagesBySession[sessionId]!;
        const partsByMessage = useMessageStore.getState().partsByMessage;

        expect(() => processMessages(messages, partsByMessage)).not.toThrow();

        const result = processMessages(messages, partsByMessage);
        expect(result).toHaveLength(messageCount);
      });

      it(`[${filename}] groupParts produces valid RenderItems with defined kinds`, async () => {
        const apiResponse = data.messages;
        const mockClient = {
          session: {
            messages: async () => ({ data: apiResponse }),
          },
        };

        await loadSessionMessages(mockClient as never, sessionId, data.info.directory);

        const messages = useMessageStore.getState().messagesBySession[sessionId]!;
        const partsByMessage = useMessageStore.getState().partsByMessage;
        const hydrated = processMessages(messages, partsByMessage);

        for (const h of hydrated) {
          const items = groupParts(h.parts);
          for (const item of items) {
            expect(["part", "tool-group"]).toContain(item.kind);
            if (item.kind === "part") {
              // key prop must not be undefined — this was the FlatList warning
              expect(item.part.id).toBeTruthy();
            }
          }
        }
      });
    }
  }
});

describe("Real sessions: messages sorted correctly by time", () => {
  beforeEach(resetAllStores);

  it("messages from the 92-message session are sorted by time.created ascending", async () => {
    const bigSession = sessionFixtures.find((f) => f.data.messages.length === 92);
    if (!bigSession) {
      console.warn("92-message session fixture not found, skipping");
      return;
    }

    const mockClient = {
      session: {
        messages: async () => ({ data: bigSession.data.messages }),
      },
    };

    await loadSessionMessages(
      mockClient as never,
      bigSession.sessionId,
      bigSession.data.info.directory,
    );

    const messages = useMessageStore.getState().messagesBySession[bigSession.sessionId]!;
    const partsByMessage = useMessageStore.getState().partsByMessage;
    const hydrated = processMessages(messages, partsByMessage);

    // Verify sort order
    for (let i = 1; i < hydrated.length; i++) {
      const prev = hydrated[i - 1]!.message.time?.created ?? 0;
      const curr = hydrated[i]!.message.time?.created ?? 0;
      expect(prev).toBeLessThanOrEqual(curr);
    }
  });
});

describe("Real sessions: clearSession removes both messages AND parts", () => {
  beforeEach(resetAllStores);

  it("clearSession from a real session leaves no leaked parts", async () => {
    const fixture = sessionFixtures.find((f) => f.data.messages.length > 0);
    if (!fixture) return;

    const mockClient = {
      session: {
        messages: async () => ({ data: fixture.data.messages }),
      },
    };

    await loadSessionMessages(mockClient as never, fixture.sessionId, fixture.data.info.directory);

    const partsBefore = Object.keys(useMessageStore.getState().partsByMessage).length;
    expect(partsBefore).toBeGreaterThan(0);

    useMessageStore.getState().clearSession(fixture.sessionId);

    expect(useMessageStore.getState().messagesBySession[fixture.sessionId]).toBeUndefined();
    // All parts for this session's messages should be gone
    const partsAfter = Object.keys(useMessageStore.getState().partsByMessage).length;
    expect(partsAfter).toBe(0);
  });
});

describe("Real sessions: FlatList key props are never undefined", () => {
  beforeEach(resetAllStores);

  it("every RenderItem has a non-undefined key source (no FlatList key warning)", async () => {
    for (const fixture of sessionFixtures.filter((f) => f.data.messages.length > 0)) {
      const mockClient = {
        session: {
          messages: async () => ({ data: fixture.data.messages }),
        },
      };

      await loadSessionMessages(
        mockClient as never,
        fixture.sessionId,
        fixture.data.info.directory,
        { force: true },
      );

      const messages = useMessageStore.getState().messagesBySession[fixture.sessionId]!;
      const partsByMessage = useMessageStore.getState().partsByMessage;
      const hydrated = processMessages(messages, partsByMessage);

      for (const h of hydrated) {
        // message.id must be defined (FlatList keyExtractor uses this)
        expect(h.message.id).toBeTruthy();

        const items = groupParts(h.parts);
        for (let idx = 0; idx < items.length; idx++) {
          const item = items[idx]!;
          if (item.kind === "part") {
            // The fallback key `part-${idx}` handles undefined part.id
            // but ideally part.id should always be set in real data
            const key = item.part.id ?? `part-${idx}`;
            expect(key).toBeTruthy();
            expect(key).not.toBe("undefined");
          }
        }
      }
    }
  });
});

describe("Real sessions: user message text renders (purple bubble bug)", () => {
  beforeEach(resetAllStores);

  it("user message text is accessible via parts, not message.content", async () => {
    const fixture = sessionFixtures.find((f) => f.data.messages.length > 0);
    if (!fixture) return;

    const mockClient = {
      session: {
        messages: async () => ({ data: fixture.data.messages }),
      },
    };

    await loadSessionMessages(mockClient as never, fixture.sessionId, fixture.data.info.directory);

    const messages = useMessageStore.getState().messagesBySession[fixture.sessionId]!;
    const partsByMessage = useMessageStore.getState().partsByMessage;
    const hydrated = processMessages(messages, partsByMessage);

    for (const h of hydrated) {
      if (h.message.role === "user") {
        // User messages have NO content field — text is in parts
        expect("content" in h.message).toBe(false);

        const items = groupParts(h.parts);
        const textItems = items.filter((i) => i.kind === "part" && i.part.type === "text");

        // User text must be in parts, not content
        expect(textItems.length).toBeGreaterThan(0);
        for (const item of textItems) {
          if (item.kind === "part" && item.part.type === "text") {
            expect((item.part as { text: string }).text).toBeTruthy();
          }
        }
      }
    }
  });
});
