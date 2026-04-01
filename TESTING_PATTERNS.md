# Gabi Testing Patterns Research

> Sourced from: LobeChat, LibreChat, Vercel AI SDK, Expo, real Gabi source.
> Stack: Jest + jest-expo + @testing-library/react-native (already in devDeps). No Playwright installed.

---

## 1. UNIT TESTS — Zustand Stores

### Pattern (from LobeChat `.agents/skills/testing/references/zustand-store-action-test.md`)

Each store gets its own `*.test.ts`. Reset state in `beforeEach` using `store.setState(...)` with `false` (replace, not merge).

```typescript
// src/stores/__tests__/messageStore.test.ts
import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, afterEach, describe, it, expect, jest } from '@jest/globals';
import { useMessageStore } from '../messageStore';

beforeEach(() => {
  // Reset to blank slate — prevents cross-test pollution
  useMessageStore.setState({
    messagesBySession: {},
    partsByMessage: {},
    streamingSessionId: null,
    loadingBySession: {},
  }, false); // false = replace, not merge
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('upsertMessage', () => {
  it('appends new message to empty session', () => {
    const { result } = renderHook(() => useMessageStore());
    act(() => {
      result.current.upsertMessage('ses-1', { id: 'msg-1', role: 'user', time: { created: 1 } } as any);
    });
    expect(result.current.messagesBySession['ses-1']).toHaveLength(1);
  });

  it('replaces existing message by id', () => {
    useMessageStore.setState({ messagesBySession: { 'ses-1': [{ id: 'msg-1', role: 'user' } as any] } });
    const { result } = renderHook(() => useMessageStore());
    act(() => {
      result.current.upsertMessage('ses-1', { id: 'msg-1', role: 'assistant' } as any);
    });
    expect(result.current.messagesBySession['ses-1'][0].role).toBe('assistant');
    expect(result.current.messagesBySession['ses-1']).toHaveLength(1);
  });
});

describe('setStreaming', () => {
  it('sets streamingSessionId', () => {
    const { result } = renderHook(() => useMessageStore());
    act(() => result.current.setStreaming('ses-1'));
    expect(result.current.streamingSessionId).toBe('ses-1');
  });
  it('clears streamingSessionId on null', () => {
    useMessageStore.setState({ streamingSessionId: 'ses-1' });
    const { result } = renderHook(() => useMessageStore());
    act(() => result.current.setStreaming(null));
    expect(result.current.streamingSessionId).toBeNull();
  });
});

describe('removeSession (sessionStore)', () => {
  it('clears activeSessionId when active session is removed', () => {
    // sessionStore: removeSession sets activeSessionId to null if it matches
    // Verify this invariant independently
  });
});
```

**Key rules (LobeChat):**
- `vi.mock('zustand/traditional')` if using Vitest; with Jest no mock needed — Zustand works in-process.
- Test **behavior** (`refreshMessages called`, state shape) not internal keys.
- Anti-pattern: `vi.mock('../../stores/messageStore', () => ({ useMessageStore: vi.fn(() => ...) }))` — never do this, test the real store.

---

## 2. UNIT TESTS — Pure Functions (transcript/)

These have zero side effects — test them directly, no renderHook needed.

```typescript
// src/transcript/__tests__/processMessages.test.ts
import { processMessages } from '../processMessages';

describe('processMessages', () => {
  it('sorts by time.created ascending', () => {
    const msgs = [
      { id: 'b', time: { created: 200 } },
      { id: 'a', time: { created: 100 } },
    ] as any;
    const result = processMessages(msgs, {});
    expect(result.map(r => r.message.id)).toEqual(['a', 'b']);
  });

  it('hydrates parts from partsByMessage map', () => {
    const msgs = [{ id: 'msg-1', time: { created: 1 } }] as any;
    const parts = { 'msg-1': { 'p-1': { id: 'p-1', type: 'text' } } } as any;
    const result = processMessages(msgs, parts);
    expect(result[0].parts).toHaveLength(1);
    expect(result[0].parts[0].id).toBe('p-1');
  });

  it('returns empty parts array when no parts for message', () => {
    const msgs = [{ id: 'msg-1', time: { created: 1 } }] as any;
    const result = processMessages(msgs, {});
    expect(result[0].parts).toEqual([]);
  });
});
```

```typescript
// src/transcript/__tests__/groupMessages.test.ts
import { groupParts } from '../groupMessages';

describe('groupParts', () => {
  it('groups 2+ consecutive tool parts into tool-group', () => {
    const parts = [
      { id: 'p1', type: 'tool' },
      { id: 'p2', type: 'tool' },
    ] as any;
    const result = groupParts(parts);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('tool-group');
  });

  it('emits single tool as individual part (not grouped)', () => {
    const parts = [{ id: 'p1', type: 'tool' }] as any;
    const result = groupParts(parts);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('part');
  });

  it('preserves non-tool parts in order', () => {
    const parts = [
      { id: 'p1', type: 'text' },
      { id: 'p2', type: 'tool' },
      { id: 'p3', type: 'tool' },
      { id: 'p4', type: 'text' },
    ] as any;
    const result = groupParts(parts);
    expect(result.map(r => r.kind)).toEqual(['part', 'tool-group', 'part']);
  });
});
```

---

## 3. UNIT TESTS — SSEManager (harness for class under test)

SSEManager uses `AsyncIterable` — mock the client's `event.subscribe` to return a controllable async generator.

```typescript
// src/client/__tests__/SSEManager.test.ts
import { SSEManager } from '../sse';

async function* makeStream(events: unknown[], delayMs = 0) {
  for (const e of events) {
    if (delayMs) await new Promise(r => setTimeout(r, delayMs));
    yield { data: e };
  }
}

function makeMockClient(events: unknown[]) {
  return {
    event: {
      subscribe: jest.fn().mockResolvedValue(makeStream(events)),
    },
  } as any;
}

describe('SSEManager', () => {
  it('calls onEvent for each yielded event', async () => {
    const onEvent = jest.fn();
    const onStatusChange = jest.fn();
    const events = [
      { type: 'message.updated', properties: { sessionID: 's1', info: {} } },
      { type: 'session.idle' },
    ];
    const mgr = new SSEManager({
      client: makeMockClient(events),
      directory: '/proj',
      onEvent,
      onStatusChange,
    });
    mgr.start();
    // Let the async iterator drain
    await new Promise(r => setTimeout(r, 50));
    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent).toHaveBeenCalledWith(events[0]);
    mgr.stop();
  });

  it('transitions status: disconnected → connected → disconnected on stop', async () => {
    const statuses: string[] = [];
    const mgr = new SSEManager({
      client: makeMockClient([]),
      directory: '/proj',
      onEvent: jest.fn(),
      onStatusChange: (s) => statuses.push(s),
    });
    mgr.start();
    await new Promise(r => setTimeout(r, 50));
    mgr.stop();
    expect(statuses).toContain('connected');
    expect(statuses[statuses.length - 1]).toBe('disconnected');
  });

  it('does not call onEvent when stopped mid-stream', async () => {
    const onEvent = jest.fn();
    async function* slowStream() {
      yield { data: { type: 'session.idle' } };
      await new Promise(r => setTimeout(r, 200)); // pause
      yield { data: { type: 'message.updated' } }; // should NOT arrive
    }
    const client = { event: { subscribe: jest.fn().mockResolvedValue(slowStream()) } } as any;
    const mgr = new SSEManager({ client, directory: '/proj', onEvent, onStatusChange: jest.fn() });
    mgr.start();
    await new Promise(r => setTimeout(r, 30));
    mgr.stop();
    await new Promise(r => setTimeout(r, 300));
    expect(onEvent).toHaveBeenCalledTimes(1); // only the first event
  });

  it('schedules reconnect after stream ends and increments attempt', async () => {
    jest.useFakeTimers();
    const subscribe = jest.fn()
      .mockResolvedValueOnce(makeStream([]))  // first connect, no events, ends immediately
      .mockResolvedValueOnce(makeStream([])); // second connect
    const client = { event: { subscribe } } as any;
    const mgr = new SSEManager({ client, directory: '/proj', onEvent: jest.fn(), onStatusChange: jest.fn() });
    mgr.start();
    await Promise.resolve(); // flush first connect
    jest.runAllTimers();
    await Promise.resolve(); // flush reconnect
    expect(subscribe).toHaveBeenCalledTimes(2);
    mgr.stop();
    jest.useRealTimers();
  });

  it('stops reconnecting after MAX_FAILURES attempts', async () => {
    jest.useFakeTimers();
    const subscribe = jest.fn().mockResolvedValue(makeStream([]));
    const client = { event: { subscribe } } as any;
    const mgr = new SSEManager({ client, directory: '/proj', onEvent: jest.fn(), onStatusChange: jest.fn() });
    mgr.start();
    // Drain all reconnect cycles
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
      jest.runAllTimers();
    }
    // Should not reconnect forever — capped at MAX_FAILURES (5)
    expect(subscribe.mock.calls.length).toBeLessThanOrEqual(6);
    mgr.stop();
    jest.useRealTimers();
  });
});
```

---

## 4. INTEGRATION TESTS — useSSE hook → stores

Test that SSE events correctly land in Zustand stores via the hook.

```typescript
// src/hooks/__tests__/useSSE.test.ts
import { act, renderHook } from '@testing-library/react-native';
import { useSSE } from '../useSSE';
import { useMessageStore } from '@/stores/messageStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useConnectionStore } from '@/stores/connectionStore';

async function* makeStream(events: unknown[]) {
  for (const e of events) yield { data: e };
}

beforeEach(() => {
  useMessageStore.setState({ messagesBySession: {}, partsByMessage: {}, streamingSessionId: null, loadingBySession: {} }, false);
  useSessionStore.setState({ sessionsByDirectory: {}, activeSessionId: null, loadingByDirectory: {} }, false);
});

describe('useSSE — event routing', () => {
  it('message.updated lands in messageStore', async () => {
    const msg = { id: 'msg-1', role: 'assistant' };
    const client = {
      event: { subscribe: jest.fn().mockResolvedValue(makeStream([
        { type: 'message.updated', properties: { sessionID: 'ses-1', info: msg } },
      ])) },
    } as any;

    renderHook(() => useSSE(client, '/proj'));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    const msgs = useMessageStore.getState().messagesBySession['ses-1'];
    expect(msgs).toBeDefined();
    expect(msgs[0].id).toBe('msg-1');
  });

  it('session.status busy → sets streamingSessionId', async () => {
    const client = {
      event: { subscribe: jest.fn().mockResolvedValue(makeStream([
        { type: 'session.status', properties: { sessionID: 'ses-1', status: { type: 'busy' } } },
      ])) },
    } as any;

    renderHook(() => useSSE(client, '/proj'));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    expect(useMessageStore.getState().streamingSessionId).toBe('ses-1');
  });

  it('session.idle clears streamingSessionId', async () => {
    useMessageStore.setState({ streamingSessionId: 'ses-1' });
    const client = {
      event: { subscribe: jest.fn().mockResolvedValue(makeStream([
        { type: 'session.idle' },
      ])) },
    } as any;

    renderHook(() => useSSE(client, '/proj'));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    expect(useMessageStore.getState().streamingSessionId).toBeNull();
  });

  it('cleanup: stop() called on unmount', async () => {
    const client = { event: { subscribe: jest.fn().mockResolvedValue(makeStream([])) } } as any;
    const { unmount } = renderHook(() => useSSE(client, '/proj'));
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    // After unmount, new events should not update store
    unmount();
    // (verify no unhandled promise rejections / warnings)
  });

  it('skips initialization when client is null', () => {
    // Should not throw, subscribe never called
    const { result } = renderHook(() => useSSE(null, '/proj'));
    expect(result.error).toBeUndefined();
  });
});
```

---

## 5. COMPONENT TESTS — ChatInput

```typescript
// src/components/chat/__tests__/ChatInput.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChatInput } from '../ChatInput';

describe('ChatInput', () => {
  it('calls onSend with trimmed text on submit', () => {
    const onSend = jest.fn();
    const { getByPlaceholderText, getByRole } = render(
      <ChatInput onSend={onSend} disabled={false} />
    );
    fireEvent.changeText(getByPlaceholderText(/message/i), '  hello  ');
    fireEvent.press(getByRole('button', { name: /send/i }));
    expect(onSend).toHaveBeenCalledWith('hello');
  });

  it('does not call onSend when input is empty', () => {
    const onSend = jest.fn();
    const { getByRole } = render(<ChatInput onSend={onSend} disabled={false} />);
    fireEvent.press(getByRole('button', { name: /send/i }));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables send button when disabled=true', () => {
    const { getByRole } = render(<ChatInput onSend={jest.fn()} disabled={true} />);
    expect(getByRole('button', { name: /send/i }).props.accessibilityState?.disabled).toBe(true);
  });

  it('clears text after send', () => {
    const { getByPlaceholderText, getByRole } = render(
      <ChatInput onSend={jest.fn()} disabled={false} />
    );
    const input = getByPlaceholderText(/message/i);
    fireEvent.changeText(input, 'hello');
    fireEvent.press(getByRole('button', { name: /send/i }));
    expect(input.props.value).toBe('');
  });
});
```

---

## 6. COMPONENT TESTS — MessageBubble / PartRenderer

```typescript
// src/components/chat/__tests__/MessageBubble.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { MessageBubble } from '../MessageBubble';

const baseMsg = { id: 'msg-1', role: 'assistant', time: { created: Date.now() } };
const textPart = { id: 'p-1', type: 'text', content: 'Hello AI' };
const toolPart = { id: 'p-2', type: 'tool', name: 'read_file', state: 'completed' };

describe('MessageBubble', () => {
  it('renders text content', () => {
    const { getByText } = render(<MessageBubble message={baseMsg as any} parts={[textPart as any]} />);
    expect(getByText('Hello AI')).toBeTruthy();
  });

  it('renders tool part with tool name', () => {
    const { getByText } = render(<MessageBubble message={baseMsg as any} parts={[toolPart as any]} />);
    expect(getByText(/read_file/i)).toBeTruthy();
  });

  it('shows streaming indicator when isStreaming=true', () => {
    const { getByTestId } = render(
      <MessageBubble message={baseMsg as any} parts={[]} isStreaming={true} />
    );
    expect(getByTestId('streaming-indicator')).toBeTruthy();
  });
});
```

---

## 7. COMPONENT TESTS — SessionList / SessionItem

```typescript
// src/components/session/__tests__/SessionList.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SessionList } from '../SessionList';

const sessions = [
  { id: 's1', title: 'Refactor hooks', createdAt: Date.now() },
  { id: 's2', title: 'Fix SSE reconnect', createdAt: Date.now() - 1000 },
];

describe('SessionList', () => {
  it('renders all sessions', () => {
    const { getByText } = render(
      <SessionList sessions={sessions as any} activeId={null} onSelect={jest.fn()} />
    );
    expect(getByText('Refactor hooks')).toBeTruthy();
    expect(getByText('Fix SSE reconnect')).toBeTruthy();
  });

  it('calls onSelect with session id on press', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <SessionList sessions={sessions as any} activeId={null} onSelect={onSelect} />
    );
    fireEvent.press(getByText('Refactor hooks'));
    expect(onSelect).toHaveBeenCalledWith('s1');
  });

  it('highlights active session', () => {
    const { getByTestId } = render(
      <SessionList sessions={sessions as any} activeId="s1" onSelect={jest.fn()} />
    );
    // Verify active session has different style or testID
    expect(getByTestId('session-item-s1-active')).toBeTruthy();
  });

  it('renders empty state when no sessions', () => {
    const { getByText } = render(
      <SessionList sessions={[]} activeId={null} onSelect={jest.fn()} />
    );
    expect(getByText(/no sessions/i)).toBeTruthy();
  });
});
```

---

## 8. COMPONENT TESTS — ProjectSidebar

```typescript
// src/components/project/__tests__/ProjectSidebar.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProjectSidebar } from '../ProjectSidebar';
import { useProjectStore } from '@/stores/projectStore';

beforeEach(() => {
  useProjectStore.setState({ projects: [], activeDirectory: null }, false);
});

describe('ProjectSidebar', () => {
  it('shows setup prompt when no projects configured', () => {
    const { getByText } = render(<ProjectSidebar />);
    expect(getByText(/add project/i)).toBeTruthy();
  });

  it('renders project list', () => {
    useProjectStore.setState({
      projects: [{ directory: '/proj/a', name: 'Alpha' }, { directory: '/proj/b', name: 'Beta' }],
    });
    const { getByText } = render(<ProjectSidebar />);
    expect(getByText('Alpha')).toBeTruthy();
    expect(getByText('Beta')).toBeTruthy();
  });

  it('selecting a project updates store', () => {
    useProjectStore.setState({ projects: [{ directory: '/proj/a', name: 'Alpha' }] });
    const { getByText } = render(<ProjectSidebar />);
    fireEvent.press(getByText('Alpha'));
    expect(useProjectStore.getState().activeDirectory).toBe('/proj/a');
  });
});
```

---

## 9. E2E USER STORIES — Expo Web (Jest + jsdom harness, no Playwright required)

Since Gabi has no Playwright or Detox yet, these are "integration e2e" using RNTL against real stores.

### Story: Full chat send → SSE response → message displayed

```typescript
// src/__tests__/e2e/chatFlow.test.tsx
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ChatScreen } from '@/app/(chat)/[sessionId]';
import { useMessageStore } from '@/stores/messageStore';
import { useSessionStore } from '@/stores/sessionStore';

async function* fakeSSE() {
  yield { data: { type: 'session.status', properties: { sessionID: 'ses-1', status: { type: 'busy' } } } };
  yield { data: { type: 'message.updated', properties: { sessionID: 'ses-1', info: { id: 'msg-ai', role: 'assistant' } } } };
  yield { data: { type: 'message.part.updated', properties: { sessionID: 'ses-1', part: { id: 'p1', type: 'text', content: 'Hello from AI' } } } };
  yield { data: { type: 'session.idle' } };
}

const mockClient = {
  event: { subscribe: jest.fn().mockResolvedValue(fakeSSE()) },
  message: { create: jest.fn().mockResolvedValue({ id: 'msg-user' }) },
  session: { list: jest.fn().mockResolvedValue([]) },
};

jest.mock('@/hooks/useClient', () => ({ useClient: () => mockClient }));

beforeEach(() => {
  useMessageStore.setState({ messagesBySession: {}, partsByMessage: {}, streamingSessionId: null, loadingBySession: {} }, false);
  useSessionStore.setState({ sessionsByDirectory: {}, activeSessionId: 'ses-1', loadingByDirectory: {} }, false);
});

it('user sends message and sees AI reply', async () => {
  const { getByPlaceholderText, getByRole, getByText } = render(
    <ChatScreen />
  );

  fireEvent.changeText(getByPlaceholderText(/message/i), 'What is 2+2?');
  await act(async () => {
    fireEvent.press(getByRole('button', { name: /send/i }));
    await new Promise(r => setTimeout(r, 100));
  });

  expect(getByText('Hello from AI')).toBeTruthy();
  expect(useMessageStore.getState().streamingSessionId).toBeNull();
});
```

### Story: Permission dialog appears and can be dismissed

```typescript
// src/__tests__/e2e/permissionFlow.test.tsx
import { usePermissionStore } from '@/stores/permissionStore';

it('shows permission prompt when permission.asked SSE event fires', async () => {
  // Pre-seed the SSE stream with a permission.asked event
  // Verify PermissionDialog is rendered
  // User taps "Allow" → removePermission called
});
```

---

## 10. COVERAGE GAPS TO AVOID

| Gap | Risk | Fix |
|-----|------|-----|
| SSEManager backoff jitter | Non-deterministic; test without jitter | Seed `Math.random` or spy `getBackoff` |
| `partsByMessage` key bug | `upsertPart` ignores sessionId, uses `messageId` only — test cross-session isolation | Add explicit test |
| `useSSE` unmount race | Events arriving after unmount update dead store | Test with `unmount()` + delayed stream |
| `clearSession` only clears `messagesBySession`, not `partsByMessage` | Part data leaks | Unit test both slices |
| `removeSession` clears `activeSessionId` conditionally | Missed if directory mismatch | Test with wrong directory arg |
| Streaming indicator never cleared | If `session.idle` event lost | Test explicit missing-idle scenario |
| `groupParts` flush on single tool | Emits as `part`, not `tool-group` | Edge-case test (already above) |
| Question store (`useQuestions`) | No upsert/remove tests | Mirror permissionStore tests |

---

## 11. MOCK HARNESS PATTERNS REFERENCE

### ReadableStream SSE mock (Vercel AI pattern)
From [`vercel/ai` download-blob.test.ts](https://github.com/vercel/ai/blob/main/packages/provider-utils/src/download-blob.test.ts):
```typescript
function createMockSSEResponse(events: object[]): Response {
  return {
    ok: true, status: 200,
    headers: new Headers({ 'content-type': 'text/event-stream' }),
    body: new ReadableStream({
      start(controller) {
        const enc = new TextEncoder();
        for (const e of events) {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`));
        }
        controller.enqueue(enc.encode('data: [DONE]\n\n'));
        controller.close();
      },
    }),
  } as unknown as Response;
}
// Use: globalThis.fetch = jest.fn().mockResolvedValue(createMockSSEResponse([...]));
```

### AsyncIterable mock (for SSEManager.client.event.subscribe)
```typescript
async function* makeEventStream(events: SSEEvent[]) {
  for (const e of events) yield { data: e };
}
const mockClient = { event: { subscribe: jest.fn().mockResolvedValue(makeEventStream(events)) } };
```

### Zustand store isolation (LobeChat pattern)
From [LobeChat zustand-store-action-test.md](https://github.com/lobehub/lobe-chat/blob/main/.agents/skills/testing/references/zustand-store-action-test.md):
```typescript
// Reset between tests — second arg false = replace not merge
useMessageStore.setState({ messagesBySession: {}, ... }, false);
// Read state directly without hook
const state = useMessageStore.getState();
```

### LibreChat FakeClient pattern
From [`danny-avila/LibreChat` specs/BaseClient.test.js](https://github.com/danny-avila/LibreChat/blob/main/api/app/clients/specs/BaseClient.test.js):
- Uses `FakeClient.js` that extends the real `BaseClient` with stubbed `sendMessage`
- Applies to Gabi: create a `FakeOpencodeClient` extending/wrapping the real SDK client for integration tests

---

## 12. RECOMMENDED DIRECTORY LAYOUT

```
src/
  stores/__tests__/
    messageStore.test.ts      ← unit: all actions + edge cases
    sessionStore.test.ts      ← unit: upsert/remove/activeSession
    connectionStore.test.ts
    permissionStore.test.ts
    questionStore.test.ts
    preferencesStore.test.ts
  client/__tests__/
    SSEManager.test.ts        ← unit: connect/stop/backoff/maxFailures
  transcript/__tests__/
    processMessages.test.ts   ← unit: sort, hydrate, empty
    groupMessages.test.ts     ← unit: grouping rules
    toolNormalize.test.ts
  hooks/__tests__/
    useSSE.test.ts            ← integration: SSE → stores routing
    useSendMessage.test.ts    ← integration: send → client → loading state
    useMessages.test.ts
  components/chat/__tests__/
    ChatInput.test.tsx
    MessageBubble.test.tsx
    MessageList.test.tsx
    PartRenderer.test.tsx
  components/session/__tests__/
    SessionList.test.tsx
    SessionItem.test.tsx
  components/project/__tests__/
    ProjectSidebar.test.tsx
  __tests__/e2e/
    chatFlow.test.tsx         ← full send→SSE→display story
    permissionFlow.test.tsx
    setupFlow.test.tsx        ← connection URL entry + validation
```
