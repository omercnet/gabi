# Gabi Test Suite Completion Plan

## Status: 93/354 tests passing (Waves 0-2 complete)

## Global Rules
- Use pnpm, jest-expo/web preset
- Import { resetAllStores } from "@/test/setup" in beforeEach for store-dependent tests
- Mock SDK via jest.mock("@opencode-ai/sdk/v2/client")
- Mock expo-router via __mocks__/expo-router.ts (auto-loaded)
- Mock AsyncStorage via __mocks__/@react-native-async-storage/async-storage.ts (auto-loaded)
- No new production dependencies
- Each wave independently committable
- Run: npx jest --no-coverage --forceExit

## TODOs

### Wave 3 — SSE Manager + useSSE Hook

- [x] T3-A: SSE Manager unit tests
  - File: src/client/__tests__/sse.test.ts
  - Covers: src/client/sse.ts (SSEManager class)
  - Category: deep
  - Deps: none (Wave 0-2 complete)
  - Tests (~18):
    - Lifecycle: start() sets running, start() idempotent, stop() aborts, stop() safe when not running, stop() sets disconnected
    - Status: disconnected->connected on subscribe, connected->reconnecting->connected on reconnect, onStatusChange deduplication
    - Events: onEvent called per yielded event, onEvent receives event.data not wrapper, null data not forwarded, stop mid-stream blocks delivery
    - Backoff: scheduleReconnect fires subscribe again, attempt increments, MAX_FAILURES (5) stops reconnecting and sets disconnected, backoff delay increases, successful reconnect resets attempt, non-AsyncIterable result triggers reconnect
  - Pattern: jest.useFakeTimers() for backoff, mock client.event.subscribe returning async generator
  - Commit: test: add SSE manager unit tests with backoff and lifecycle coverage

- [x] T3-B: useSSE hook integration tests
  - File: src/hooks/__tests__/useSSE.test.ts
  - Covers: src/hooks/useSSE.ts (event routing dispatch table)
  - Category: deep
  - Deps: T3-A (uses same mock patterns)
  - Tests (~20):
    - Guards: client=null no SSEManager, directory=null no SSEManager, both provided creates SSEManager
    - Message routing: message.part.updated -> upsertPart with correct sessionID+messageID, message.part.removed -> removePart, message.updated -> upsertMessage, message.removed -> removeMessage
    - Session routing: session.created -> upsertSession, session.updated -> upsertSession, session.deleted -> removeSession, session.status busy -> setStreaming(sessionID), session.status idle -> setStreaming(null), session.idle -> setStreaming(null)
    - Permission: permission.asked -> upsertPermission, permission.replied -> removePermission
    - Question: question.asked -> upsertQuestion
    - Status: onStatusChange wired to setSseStatus
    - Cleanup: unmount calls stop(), new client ref stops old and starts new, new directory stops old and starts new, unknown event type no throw
  - Pattern: jest.mock("@/client/sse"), capture onEvent callback from SSEManager constructor, call it with test events, assert store state
  - Commit: test: add useSSE hook integration tests for event routing

### Wave 4 — Remaining Hooks

- [x] T4-A: useClient hook tests
  - File: src/hooks/__tests__/useClient.test.ts
  - Covers: src/hooks/useClient.ts
  - Category: quick
  - Deps: none
  - Tests (~6):
    - Returns null when isConfigured=false
    - Returns null when baseUrl empty
    - Returns client when configured
    - buildClient called with correct args
    - Memoized: same ref on re-render without change
    - New ref when store changes
  - Commit: test: add useClient hook tests

- [x] T4-B: useSendMessage hook tests
  - File: src/hooks/__tests__/useSendMessage.test.ts
  - Covers: src/hooks/useSendMessage.ts
  - Category: quick
  - Deps: none
  - Tests (~12):
    - send("hello") calls client.session.prompt with parts:[{type:"text",text:"hello"}]
    - send trims whitespace
    - send("") does not call prompt
    - send whitespace-only does not call
    - send with null client no throw
    - send with null sessionId no throw
    - abort() calls client.session.abort
    - abort with null client no throw
    - abort with null sessionId no throw
    - isStreaming true when streamingSessionId matches
    - isStreaming false when different
    - isStreaming false when null
  - Commit: test: add useSendMessage hook tests

- [x] T4-C: useMessages hook tests
  - File: src/hooks/__tests__/useMessages.test.ts
  - Covers: src/hooks/useMessages.ts
  - Category: quick
  - Deps: none
  - Tests (~8):
    - null sessionId returns []
    - No messages returns []
    - Messages sorted and hydrated with parts
    - Parts grouped (calls through groupParts)
    - Memoized on re-render without change
    - Adding message updates result
    - Adding part updates result
    - sessionId change returns new messages
  - Commit: test: add useMessages hook tests

- [x] T4-D: useSessions hook tests
  - File: src/hooks/__tests__/useSessions.test.ts
  - Covers: src/hooks/useSessions.ts
  - Category: deep
  - Deps: none
  - Tests (~14):
    - Fetches on mount with client+directory
    - No fetch when client null
    - No fetch when directory null
    - Sets loading true before, false after
    - setSessions called with data on success
    - Handles non-array data gracefully
    - Cancels stale fetch on unmount
    - createSession calls client.session.create
    - createSession returns session
    - createSession returns null when client null
    - deleteSession calls client.session.delete + store.removeSession
    - selectSession calls setActiveSession
    - Re-mount with new directory re-fetches
    - Error handling: network failure sets loading false
  - Commit: test: add useSessions hook tests

- [x] T4-E: usePermissions + useQuestions hook tests
  - File: src/hooks/__tests__/usePermissions.test.ts + src/hooks/__tests__/useQuestions.test.ts
  - Covers: src/hooks/usePermissions.ts, src/hooks/useQuestions.ts
  - Category: quick
  - Deps: none
  - Tests (~15):
    - Permissions: reply(id,true) calls client with reply:"once", reply(id,false) with "reject", removes from store after, null client safe, reflects store pending, callback memoized
    - Questions: reply(id,answers) calls client.question.reply, removes from store, null client safe, reject(id) calls client.question.reject, removes from store, reflects store pending
  - Commit: test: add usePermissions and useQuestions hook tests

### Wave 5 — Component + Screen Integration Tests

- [x] T5-A: ChatInput component tests
  - File: src/components/chat/__tests__/ChatInput.test.tsx
  - Covers: src/components/chat/ChatInput.tsx
  - Category: visual-engineering
  - Deps: none
  - Tests (~12):
    - Renders input with placeholder
    - Shows Send when not streaming
    - Shows Stop when streaming
    - Typing + Send fires onSend with text
    - Input cleared after send
    - Empty text: onSend not called
    - Whitespace only: onSend not called
    - disabled=true: input not editable
    - Stop press fires onAbort
    - Enter key on web fires send
    - Send disabled when disabled prop true
    - Send disabled when text empty
  - Commit: test: add ChatInput component tests

- [x] T5-B: Part renderer component tests
  - File: src/components/chat/__tests__/PartRenderer.test.tsx + ReasoningPart.test.tsx + ToolPart.test.tsx + ToolGroup.test.tsx
  - Covers: PartRenderer, ReasoningPart, ToolPart, ToolGroup
  - Category: visual-engineering
  - Deps: none
  - Tests (~28):
    - PartRenderer: text renders content, reasoning+showReasoning renders, reasoning+hide returns null, tool+show renders, tool+hide returns null, file+show renders filename, file+hide null, step-start+show renders, step-start+hide null, subtask always renders, unknown type null
    - ReasoningPart: shows "Thinking" label, collapsed by default, press expands showing text, press again collapses
    - ToolPart: renders normalized tool label, collapsed by default, press expands showing input, expanded shows output, JSON input serialized, chevron toggles
    - ToolGroup: collapseToolGroups=true starts collapsed, false starts expanded, press toggles, expanded renders ToolParts, summary shown, multiple parts all rendered
  - Commit: test: add part renderer and tool component tests

- [x] T5-C: MessageBubble + SessionItem tests
  - File: src/components/chat/__tests__/MessageBubble.test.tsx + src/components/session/__tests__/SessionItem.test.tsx
  - Covers: MessageBubble, SessionItem
  - Category: quick
  - Deps: none
  - Tests (~13):
    - MessageBubble: user message right-aligned, assistant left-aligned, user renders content, assistant renders parts via PartRenderer, tool-group renders ToolGroup, multiple items all rendered, empty content no crash
    - SessionItem: renders title, "Untitled" fallback, renders date, press fires onPress, long press fires delete
  - Commit: test: add MessageBubble and SessionItem component tests

- [x] T5-D: Setup screen tests
  - File: app/__tests__/setup.test.tsx
  - Covers: app/setup.tsx
  - Category: visual-engineering
  - Deps: none
  - Tests (~11):
    - Renders URL input with default value
    - Renders username/password inputs
    - Connect disabled when URL empty
    - Connect enabled with URL
    - Shows loading on press
    - Success: calls configure + router.replace
    - Error result: shows "Could not reach server"
    - Exception: shows "Connection failed..." error
    - Loading cleared after success
    - Loading cleared after error
    - Password input is secure
  - Commit: test: add setup screen integration tests

## Task Summary

| ID | Wave | Category | Parallel | Deps | Tests |
|----|------|----------|----------|------|-------|
| T3-A | 3 | deep | yes | — | ~18 |
| T3-B | 3 | deep | no | T3-A | ~20 |
| T4-A | 4 | quick | yes | — | ~6 |
| T4-B | 4 | quick | yes | — | ~12 |
| T4-C | 4 | quick | yes | — | ~8 |
| T4-D | 4 | deep | yes | — | ~14 |
| T4-E | 4 | quick | yes | — | ~15 |
| T5-A | 5 | visual-engineering | yes | — | ~12 |
| T5-B | 5 | visual-engineering | yes | — | ~28 |
| T5-C | 5 | quick | yes | — | ~13 |
| T5-D | 5 | visual-engineering | yes | — | ~11 |

## Parallelization
- Wave 3: T3-A first, then T3-B (depends on mock patterns)
- Wave 4: All 5 tasks in parallel (T4-A through T4-E)
- Wave 5: All 4 tasks in parallel (T5-A through T5-D)
- Wave 4 and Wave 5 can start in parallel (no deps between them)
- Max parallelism: 5 agents (Wave 4) or 4 agents (Wave 5)

## Final Verification
- [x] F1: All tests pass — 400 tests, 40 suites, 0 failures
- [x] F2: Web export still passes — expo export --platform web exits 0
- [x] F3: No TypeScript errors — tsc --noEmit exits 0
