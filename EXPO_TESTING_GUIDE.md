# Expo Universal App Testing Guide
> Concrete patterns for Jest + RNTL, Zustand, hooks, SSE, Expo Router, Playwright, and MSW.
> Sources: Expo SDK docs, pmndrs/zustand testing guide, mswjs.io, RNTL docs, expo-router/testing-library.

---

## 1. Jest + RNTL Setup for Expo

### 1.1 Install

```bash
npx expo install jest-expo jest @testing-library/react-native @testing-library/jest-native
```

### 1.2 jest.config.js (this project's config + best-practice additions)

```js
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  // Run tests across all platforms simultaneously:
  // preset: 'jest-expo/universal',

  // Transpile ESM packages that Jest can't handle raw
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop)',
  ],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  setupFilesAfterFramework: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/src/test/setup.ts',   // MSW + polyfills (see §7)
  ],
};
```

> **`jest-expo/universal`** runs each test file four times (ios/android/web/node).
> Use it when you need platform-specific snapshot coverage.

### 1.3 Mocking AsyncStorage

```ts
// jest.config.js moduleNameMapper OR __mocks__/@react-native-async-storage/async-storage.ts
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

Or inline in a test:
```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());
```

### 1.4 Mocking expo-secure-store

```ts
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));
```

### 1.5 Mocking arbitrary native modules

jest-expo auto-mocks most Expo SDK modules. For custom native modules:

```ts
// __mocks__/ExpoMyModule.ts  (auto-loaded by Jest moduleDirectories)
export const doSomethingAsync = jest.fn().mockResolvedValue('mock-result');
export const startOperation   = jest.fn().mockResolvedValue(undefined);
export const stopOperation    = jest.fn().mockResolvedValue(undefined);
```

```ts
// in your test
import ExpoMyModule from '../ExpoMyModule';
jest.mock('../ExpoMyModule');   // points at __mocks__ automatically

it('delegates to native', async () => {
  await MyModule.doSomething('param');
  expect(ExpoMyModule.doSomethingAsync).toHaveBeenCalledWith('param');
});
```

---

## 2. Testing Zustand Stores

### 2.1 Global auto-reset mock (recommended for all tests)

Create `__mocks__/zustand.ts` at the repo root. Jest picks it up automatically.

```ts
// __mocks__/zustand.ts
import { act } from '@testing-library/react-native';
import type * as ZustandExportedTypes from 'zustand';
export * from 'zustand';

const { create: actualCreate, createStore: actualCreateStore } =
  jest.requireActual<typeof ZustandExportedTypes>('zustand');

export const storeResetFns = new Set<() => void>();

const createUncurried = <T>(
  stateCreator: ZustandExportedTypes.StateCreator<T>,
) => {
  const store = actualCreate(stateCreator);
  const initialState = store.getInitialState();
  storeResetFns.add(() => store.setState(initialState, true));
  return store;
};

export const create = (<T>(
  stateCreator: ZustandExportedTypes.StateCreator<T>,
) =>
  typeof stateCreator === 'function'
    ? createUncurried(stateCreator)
    : createUncurried
) as typeof ZustandExportedTypes.create;

const createStoreUncurried = <T>(
  stateCreator: ZustandExportedTypes.StateCreator<T>,
) => {
  const store = actualCreateStore(stateCreator);
  const initialState = store.getInitialState();
  storeResetFns.add(() => store.setState(initialState, true));
  return store;
};

export const createStore = (<T>(
  stateCreator: ZustandExportedTypes.StateCreator<T>,
) =>
  typeof stateCreator === 'function'
    ? createStoreUncurried(stateCreator)
    : createStoreUncurried
) as typeof ZustandExportedTypes.createStore;

// Auto-reset all stores after every test
afterEach(() => {
  act(() => {
    storeResetFns.forEach((fn) => fn());
  });
});
```

Source: [pmndrs/zustand testing guide](https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/testing.md)

### 2.2 Testing actions directly (no React)

```ts
// src/stores/__tests__/counterStore.test.ts
import { useCounterStore } from '../counterStore';

describe('counterStore', () => {
  it('increments count', () => {
    useCounterStore.getState().increment();
    expect(useCounterStore.getState().count).toBe(1);
  });

  it('resets on reset()', () => {
    useCounterStore.getState().increment();
    useCounterStore.getState().reset();
    expect(useCounterStore.getState().count).toBe(0);
  });
});
```

> **No React wrapper needed** — call `store.getState().action()` and assert `store.getState().value`.
> The `__mocks__/zustand.ts` resets between tests automatically.

### 2.3 Testing selectors with renderHook

```ts
import { renderHook, act } from '@testing-library/react-native';
import { useCounterStore } from '../counterStore';

it('selector returns derived value', () => {
  const { result } = renderHook(() =>
    useCounterStore((s) => s.count * 2)
  );
  expect(result.current).toBe(0);

  act(() => useCounterStore.getState().increment());
  expect(result.current).toBe(2);
});
```

### 2.4 Mocking a store dependency (e.g. API calls inside actions)

```ts
// Store uses an injected apiClient — mock just that
jest.mock('@/lib/api', () => ({
  fetchMessages: jest.fn().mockResolvedValue([{ id: '1', text: 'hi' }]),
}));

import { fetchMessages } from '@/lib/api';
import { useMessageStore } from '../messageStore';

it('loadMessages populates store', async () => {
  await act(async () => {
    await useMessageStore.getState().loadMessages('session-1');
  });

  expect(useMessageStore.getState().messagesBySession['session-1']).toHaveLength(1);
  expect(fetchMessages).toHaveBeenCalledWith('session-1');
});
```

### 2.5 Manual per-test reset (alternative to global mock)

When you don't want the global `__mocks__/zustand.ts`:

```ts
beforeEach(() => {
  useMyStore.setState(useMyStore.getInitialState(), true);
  // 'true' = replace entire state, not merge
});
```

---

## 3. Testing Custom React Hooks

### 3.1 Basic renderHook

```ts
import { renderHook, act } from '@testing-library/react-native';
import { useMyHook } from '../useMyHook';

it('returns initial state', () => {
  const { result } = renderHook(() => useMyHook());
  expect(result.current.value).toBe(null);
});
```

### 3.2 Hook with context provider (wrapper option)

```ts
import { renderHook } from '@testing-library/react-native';
import { ThemeProvider } from '../ThemeContext';
import { useTheme } from '../useTheme';

it('reads from context', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider value="dark">{children}</ThemeProvider>
  );

  const { result } = renderHook(() => useTheme(), { wrapper });
  expect(result.current.mode).toBe('dark');
});
```

### 3.3 Hook with Zustand store

```ts
import { renderHook, act } from '@testing-library/react-native';
import { useSessionTitle } from '../useSessionTitle';
import { useSessionStore } from '@/stores/sessionStore';

beforeEach(() => {
  useSessionStore.setState({ sessions: {}, activeId: null }, true);
});

it('returns title when session exists', () => {
  useSessionStore.setState({
    sessions: { 'ses-1': { id: 'ses-1', title: 'My Chat' } },
    activeId: 'ses-1',
  });

  const { result } = renderHook(() => useSessionTitle('ses-1'));
  expect(result.current).toBe('My Chat');
});
```

### 3.4 Async hook (renderHookAsync for Suspense / React 19)

```ts
import { renderHookAsync, act } from '@testing-library/react-native';
import { useRemoteData } from '../useRemoteData';

it('loads data asynchronously', async () => {
  const { result, rerenderAsync } = await renderHookAsync(() =>
    useRemoteData('session-1')
  );

  expect(result.current.loading).toBe(true);

  await act(async () => {
    await new Promise((r) => setTimeout(r, 0)); // flush micro-tasks
  });

  await rerenderAsync();
  expect(result.current.loading).toBe(false);
  expect(result.current.data).not.toBeNull();
});
```

### 3.5 Testing hooks that use WebSockets

```ts
let mockWs: any;

jest.mock('../WebSocketClient', () => ({
  WebSocketClient: jest.fn().mockImplementation(() => {
    mockWs = {
      onMessage: null as ((data: string) => void) | null,
      send: jest.fn(),
      close: jest.fn(),
    };
    return mockWs;
  }),
}));

import { renderHook, act } from '@testing-library/react-native';
import { useChat } from '../useChat';

it('handles incoming messages', () => {
  const { result } = renderHook(() => useChat('room-1'));

  act(() => {
    mockWs.onMessage?.(JSON.stringify({ type: 'message', text: 'hello' }));
  });

  expect(result.current.messages).toContainEqual(
    expect.objectContaining({ text: 'hello' })
  );
});
```

---

## 4. Testing SSE Streams in Jest

### 4.1 Manual EventSource mock

```ts
// src/test/mockEventSource.ts
export class MockEventSource {
  static instances: MockEventSource[] = [];

  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror:   ((e: Event) => void) | null = null;
  onopen:    ((e: Event) => void) | null = null;
  readyState = 0; // CONNECTING

  constructor(public url: string, public options?: EventSourceInit) {
    MockEventSource.instances.push(this);
    this.readyState = 1; // OPEN
    setTimeout(() => this.onopen?.(new Event('open')), 0);
  }

  /** Simulate server pushing a message */
  emit(data: string, eventType = 'message') {
    const event = new MessageEvent(eventType, { data });
    this.onmessage?.(event);
  }

  close() {
    this.readyState = 2; // CLOSED
  }
}

// In jest.setup.ts:
// global.EventSource = MockEventSource as any;
```

```ts
// src/test/setup.ts
import { MockEventSource } from './mockEventSource';
global.EventSource = MockEventSource as any;
```

```ts
// src/hooks/__tests__/useSSE.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { MockEventSource } from '@/test/mockEventSource';
import { useSSE } from '../useSSE';

beforeEach(() => {
  MockEventSource.instances = [];
});

it('appends streamed chunks to state', async () => {
  const { result } = renderHook(() => useSSE('/api/stream'));

  // Wait for EventSource to open
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

  const source = MockEventSource.instances[0];
  expect(source).toBeDefined();

  act(() => source.emit('{"token":"Hello"}'));
  act(() => source.emit('{"token":" world"}'));
  act(() => source.emit('[DONE]'));

  expect(result.current.text).toBe('Hello world');
  expect(result.current.done).toBe(true);
});
```

### 4.2 Fetch-based SSE (streaming response mock)

```ts
// Mock fetch returning a ReadableStream
function createSSEStream(chunks: string[]): ReadableStream {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(`data: ${chunk}\n\n`));
      }
      controller.close();
    },
  });
}

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  body: createSSEStream(['{"token":"A"}', '{"token":"B"}']),
} as any);

it('reads streaming fetch response', async () => {
  const { result } = renderHook(() => useFetchSSE('/api/chat'));

  await act(async () => {
    await new Promise((r) => setTimeout(r, 20));
  });

  expect(result.current.tokens).toEqual(['A', 'B']);
});
```

### 4.3 MSW SSE handler (see §7 for full MSW setup)

```ts
// src/mocks/handlers.ts
import { sse, http, HttpResponse } from 'msw';

export const handlers = [
  sse('/api/stream', ({ client }) => {
    client.send({ data: '{"token":"Hello"}' });
    client.send({ data: '{"token":" world"}' });
    client.send({ data: '[DONE]' });
    // close after sending
    queueMicrotask(() => client.close());
  }),
];
```

---

## 5. Expo Router Navigation Testing

### 5.1 `renderRouter` — the right tool (not `jest.mock('expo-router')`)

Expo Router ships `expo-router/testing-library` which provides `renderRouter`.
**Prefer this over manually mocking `useRouter`** — it creates a real in-memory router.

```ts
import { renderRouter, screen } from 'expo-router/testing-library';
import { router } from 'expo-router';
import { act } from '@testing-library/react-native';
import { Text } from 'react-native';
import Stack from 'expo-router/stack';

it('navigates from index to profile', () => {
  renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index-screen">Home</Text>,
    'profile/[id]': () => <Text testID="profile-screen">Profile</Text>,
  });

  expect(screen.getByTestId('index-screen')).toBeVisible();

  act(() => router.push('/profile/42'));

  expect(screen.getByTestId('profile-screen')).toBeVisible();
  expect(screen).toHavePathname('/profile/42');
});
```

### 5.2 Assert URL params

```ts
it('passes params to route', () => {
  renderRouter(
    { 'user/[id]': () => <Text testID="user">User</Text> },
    { initialUrl: '/user/123?tab=settings' }
  );

  expect(screen).toHavePathname('/user/123');
  expect(screen).toHavePathnameWithParams('/user/123?tab=settings');
  expect(screen).toHaveSegments(['user', '[id]']);
  // Assert local params accessible inside the route component:
  expect(screen).useLocalSearchParams({ id: '123', tab: 'settings' });
});
```

### 5.3 Deep-link simulation

```ts
renderRouter(['index', 'chat/[id]', 'settings'], {
  initialUrl: '/chat/abc123',
});

expect(screen).toHavePathname('/chat/abc123');
```

### 5.4 When you must mock useRouter (isolated component unit tests)

```ts
const mockPush    = jest.fn();
const mockReplace = jest.fn();
const mockBack    = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push:    mockPush,
    replace: mockReplace,
    back:    mockBack,
    navigate: jest.fn(),
  }),
  useLocalSearchParams: () => ({ id: 'mock-id' }),
  usePathname: () => '/mock-path',
  Link: ({ children, href }: any) => children,
}));

import { render, fireEvent } from '@testing-library/react-native';
import { MyScreen } from '../MyScreen';

it('calls router.push on button press', () => {
  const { getByTestId } = render(<MyScreen />);
  fireEvent.press(getByTestId('nav-button'));
  expect(mockPush).toHaveBeenCalledWith('/destination');
});
```

---

## 6. Playwright for Expo Web E2E

### 6.1 Install

```bash
pnpm add -D @playwright/test
npx playwright install chromium
```

### 6.2 playwright.config.ts

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
  },

  // Start Expo web server automatically
  webServer: {
    command: 'npx expo start --web --port 8081',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
```

### 6.3 Page Object Model

```ts
// e2e/pages/ChatPage.ts
import { type Page, type Locator } from '@playwright/test';

export class ChatPage {
  readonly input:      Locator;
  readonly sendButton: Locator;
  readonly messages:   Locator;

  constructor(private page: Page) {
    this.input      = page.getByTestId('chat-input');
    this.sendButton = page.getByRole('button', { name: 'Send' });
    this.messages   = page.getByTestId('message-bubble');
  }

  async sendMessage(text: string) {
    await this.input.fill(text);
    await this.sendButton.click();
  }

  async waitForReply() {
    await this.page.waitForSelector('[data-testid="message-bubble"]:last-child[data-role="assistant"]');
  }
}
```

### 6.4 Example e2e test

```ts
// e2e/chat.spec.ts
import { test, expect } from '@playwright/test';
import { ChatPage } from './pages/ChatPage';

test('user can send a message and get a reply', async ({ page }) => {
  await page.goto('/');

  const chat = new ChatPage(page);
  await chat.sendMessage('Hello!');

  // Wait for streaming to complete (spinner disappears)
  await expect(page.getByTestId('streaming-indicator')).not.toBeVisible({
    timeout: 15_000,
  });

  const bubbles = await chat.messages.all();
  expect(bubbles.length).toBeGreaterThanOrEqual(2);
});

test('navigation works', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page).toHaveURL(/\/settings/);
});
```

### 6.5 Testing SSE streams in Playwright

```ts
test('streams tokens progressively', async ({ page }) => {
  // Intercept to simulate slow SSE
  await page.route('/api/chat', async (route) => {
    const body = [
      'data: {"token":"Hello"}\n\n',
      'data: {"token":" world"}\n\n',
      'data: [DONE]\n\n',
    ].join('');
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body,
    });
  });

  const chat = new ChatPage(page);
  await chat.sendMessage('test');

  await expect(page.getByTestId('assistant-bubble')).toContainText('Hello world');
});
```

---

## 7. MSW (Mock Service Worker) for API Mocking

### 7.1 Install

```bash
pnpm add -D msw
# For React Native polyfills:
pnpm add react-native-url-polyfill fast-text-encoding
```

### 7.2 Handlers

```ts
// src/mocks/handlers.ts
import { http, HttpResponse, sse } from 'msw';

export const handlers = [
  // Regular JSON endpoint
  http.get('/api/sessions', () =>
    HttpResponse.json([{ id: 'ses-1', title: 'My Session' }])
  ),

  http.post('/api/sessions', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 'ses-new', ...body }, { status: 201 });
  }),

  // SSE endpoint
  sse('/api/chat/stream', ({ client }) => {
    client.send({ data: '{"token":"Hello"}' });
    client.send({ data: '{"token":" world"}' });
    client.send({ data: '[DONE]' });
    queueMicrotask(() => client.close());
  }),
];
```

### 7.3 Server setup (Jest / Node.js)

```ts
// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### 7.4 Jest setup file

```ts
// src/test/setup.ts
import 'fast-text-encoding';                    // React Native polyfill
import 'react-native-url-polyfill/auto';        // React Native polyfill
import { server } from '../mocks/server';

// IMPORTANT: jest-expo runs in jsdom/React Native env — use msw/node for Jest
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());        // Remove test-local overrides
afterAll(() => server.close());
```

Add to jest.config.js:
```js
setupFilesAfterFramework: ['<rootDir>/src/test/setup.ts'],
```

### 7.5 Overriding handlers per test

```ts
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';

it('handles API errors gracefully', async () => {
  server.use(
    http.get('/api/sessions', () =>
      HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
    )
  );

  // ... render and assert error state
});
// After this test, resetHandlers() restores the default handlers
```

### 7.6 SSE test with MSW + RNTL

```ts
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { server } from '@/mocks/server';
import { sse } from 'msw';
import { useStreamingChat } from '../useStreamingChat';

it('accumulates streamed tokens', async () => {
  server.use(
    sse('/api/chat/stream', ({ client }) => {
      client.send({ data: '{"token":"A"}' });
      client.send({ data: '{"token":"B"}' });
      queueMicrotask(() => client.close());
    })
  );

  const { result } = renderHook(() =>
    useStreamingChat({ sessionId: 'ses-1', prompt: 'hi' })
  );

  await waitFor(() => expect(result.current.done).toBe(true));
  expect(result.current.text).toBe('AB');
});
```

### 7.7 React Native (development / e2e)

For enabling MSW in the **running RN app** (not Jest):

```ts
// src/mocks/server.native.ts
import { setupServer } from 'msw/native';   // NOT msw/node
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```ts
// index.js — conditional boot
async function enableMocking() {
  if (!__DEV__) return;
  await import('./src/mocks/msw.polyfills');
  const { server } = await import('./src/mocks/server.native');
  server.listen();
}

enableMocking().then(() => {
  AppRegistry.registerComponent(appName, () => App);
});
```

---

## Quick Reference

| Scenario | Tool |
|---|---|
| Store actions (no UI) | `store.getState().action()` + assert `getState()` |
| Store + React hook | `renderHook(() => useStore(selector))` + `act()` |
| Screen with navigation | `renderRouter({ routeMap }, { initialUrl })` |
| Assert URL | `expect(screen).toHavePathname('/path')` |
| Mock router hook only | `jest.mock('expo-router', () => ({ useRouter: () => {...} }))` |
| Async hook (Suspense) | `renderHookAsync` (RNTL) |
| SSE simulation | `MockEventSource` class or MSW `sse()` handler |
| API mocking | MSW `http.get/post` handlers + `setupServer` from `msw/node` |
| E2E web | Playwright + `webServer: { command: 'expo start --web' }` |
