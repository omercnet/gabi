# Learnings — gabi-full-test-coverage

## Key Facts
- FileTree uses `client.find.files({ directory, query: "" })` and `client.file.status({ directory })`
- QuestionPrompt/PermissionPrompt Modal uses createPortal — incompatible with react-test-renderer
- Pattern: `JSON.stringify(screen.toJSON()).toContain(...)` for NativeWind component assertions
- `src/components/__tests__/*.ts` stubs have REAL logic tests — do NOT delete them
- Integration tests use `createOpencode()` from `@opencode-ai/sdk` — no shell spawning
- SSE SDK returns `{ stream: AsyncIterable }` not the iterable directly
- jest.mock calls MUST be before imports in test files
- Use `renderHook` from `@testing-library/react-native` for hook tests
- useHydration subscribes to `.persist.onFinishHydration` on connectionStore, projectStore, preferencesStore

## Test Patterns
- Component assertions: `JSON.stringify(screen.toJSON()).toContain("text")`
- Store mocking: `jest.mock("@/stores/xyz")` + stub `.persist.hasHydrated()` / `.persist.onFinishHydration()`
- NativeWind Pressable: `screen.UNSAFE_getAllByType(require("react-native").Pressable)`
- resetAllStores in beforeEach for store-dependent tests
