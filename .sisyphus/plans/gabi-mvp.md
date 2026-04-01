# Gabi MVP — Product Plan

## Architecture
Pure client for OpenCode (sst/opencode). Expo 55 universal (web + mobile).
Connects directly to `opencode serve` via REST + SSE. No backend.
All requests scoped by `?directory=/path` parameter.

## Stack
- Expo 55 + expo-router v4, NativeWind v4 + Tailwind CSS v3
- Zustand v5, @opencode-ai/sdk v2, pnpm, Biome, Jest + RNTL

## Global Rules
1. NativeWind v4: className prop directly, never styled() HOC
2. Zustand v5: import { create } from "zustand" (named, no default)
3. SDK: always @opencode-ai/sdk/v2/client (v2 API)
4. Dark mode: every className needs base + dark: variant
5. Path alias: @/* -> src/*, never relative cross-directory imports
6. Metro: unstable_enablePackageExports=true for SDK subpath imports

## Repo
https://github.com/omercnet/gabi

---

## TODOs

### Foundation (DONE)

- [x] T0-A: Expo project init with NativeWind v4 + expo-router
- [x] T0-B: Design token system (CSS custom props, tailwind theme, cn() utility)
- [x] T0-C: TypeScript strict + Biome + Jest config

### SDK Layer + Stores (DONE)

- [x] T1-A: OpenCode client factory (src/client/client.ts) with basic auth
- [x] T1-B: SSE manager (src/client/sse.ts) with exponential backoff reconnect
- [x] T1-C: SDK type re-exports (src/client/types.ts) including session lifecycle events
- [x] T1-D: Connection store (persisted) + Project store (persisted)
- [x] T1-E: Session store + Message store + Preferences store (persisted)
- [x] T1-F: Permission store + Question store

### Transcript Pipeline + Hooks (DONE)

- [x] T2-A: processMessages — hydrate messages with parts, sort by time
- [x] T2-B: groupMessages — group consecutive tool parts into CollapsedToolGroup
- [x] T2-C: toolNormalize — normalize tool names, summarize tool groups
- [x] T2-D: useClient, useSSE, useMessages, useSendMessage hooks
- [x] T2-E: useSessions, usePermissions, useQuestions hooks

### Navigation + Screens (DONE)

- [x] T3-A: Root layout + redirect logic (setup vs app)
- [x] T3-B: Connection setup screen (URL + auth + health check)
- [x] T3-C: App shell — responsive sidebar (>=768px persistent, narrow = hidden)
- [x] T3-D: Chat screen (MessageList + ChatInput + KeyboardAvoidingView)
- [x] T3-E: Settings screen (visibility toggles + theme + disconnect)

### Chat UI Components (DONE)

- [x] T4-A: MessageList (FlatList, auto-scroll, streaming)
- [x] T4-B: MessageBubble (user right/assistant left, renders parts)
- [x] T4-C: PartRenderer (dispatches by type, respects visibility prefs)
- [x] T4-D: ReasoningPart (collapsible thinking block, purple accent)
- [x] T4-E: ToolPart (collapsible tool call with input/output, amber accent)
- [x] T4-F: ToolGroup (collapsible group summary "3 reads, 2 edits")
- [x] T4-G: ChatInput (multiline, send/abort buttons, Enter on web)

### Project + Session Management (DONE)

- [x] T5-A: ProjectSidebar (project list, add/remove, SSE status dot)
- [x] T5-B: SessionList (per-project, create, long-press delete)
- [x] T5-C: SessionItem (title, date, press to navigate)

### File Tree (DONE)

- [x] T6-A: FileTree (fetch from opencode, build nested tree)
- [x] T6-B: FileTreeNode (collapsible dirs, git status badges M/A/D/?/R)

### Markdown Rendering (NOT STARTED)

- [ ] T7-A: Install react-markdown + remark-gfm + react-native-markdown-display
  - Category: quick
  - Deps: none

- [ ] T7-B: MarkdownRenderer.web.tsx — react-markdown + remark-gfm, code blocks route to CodeBlock
  - File: src/components/shared/MarkdownRenderer.web.tsx
  - Category: visual-engineering
  - Deps: T7-A

- [ ] T7-C: MarkdownRenderer.native.tsx — react-native-markdown-display with design token styles
  - File: src/components/shared/MarkdownRenderer.native.tsx
  - Category: visual-engineering
  - Deps: T7-A

- [ ] T7-D: CodeBlock component — syntax highlighting, language badge, copy button, horizontal scroll
  - File: src/components/shared/CodeBlock.tsx
  - Install: react-syntax-highlighter, @types/react-syntax-highlighter, expo-clipboard
  - Category: visual-engineering
  - Deps: T7-A

- [ ] T7-E: Wire MarkdownRenderer into TextPart (replace raw Text with MarkdownRenderer in PartRenderer.tsx)
  - Category: quick
  - Deps: T7-B, T7-C

### Permission + Question Prompts (NOT STARTED)

- [ ] T8-A: PermissionPrompt — modal overlay, tool name + args, Allow/Deny buttons, non-dismissable, queue
  - File: src/components/shared/PermissionPrompt.tsx
  - Category: visual-engineering
  - Deps: none

- [ ] T8-B: QuestionPrompt — question text, radio options or text input, Submit button
  - File: src/components/shared/QuestionPrompt.tsx
  - Category: visual-engineering
  - Deps: none

- [ ] T8-C: Wire prompts into ChatScreen — overlay PermissionPrompt + QuestionPrompt on top of chat
  - Modify: app/(app)/[sessionId]/index.tsx
  - Category: quick
  - Deps: T8-A, T8-B

### Polish + Error Handling (NOT STARTED)

- [ ] T9-A: ConnectionStatus indicator — 8px dot (green/amber-pulsing/red), optional label
  - File: src/components/shared/ConnectionStatus.tsx
  - Wire into ProjectSidebar (replace inline dot)
  - Category: quick
  - Deps: none

- [ ] T9-B: ErrorBoundary — class component, "Something went wrong" + retry button
  - File: src/components/shared/ErrorBoundary.tsx
  - Wrap MessageList and SessionList
  - Category: quick
  - Deps: none

- [ ] T9-C: EmptyState — reusable { icon, title, subtitle, action? } component
  - File: src/components/shared/EmptyState.tsx
  - Apply to: no projects, no sessions, empty chat, connection failed
  - Category: visual-engineering
  - Deps: none

- [ ] T9-D: Skeleton loaders — shimmer animation, SessionSkeleton (3 rows), MessageSkeleton (2 bubbles)
  - File: src/components/shared/Skeleton.tsx
  - Apply to: session list loading, message list loading
  - Category: visual-engineering
  - Deps: none

- [ ] T9-E: Toast component — "Reconnecting to OpenCode..." on SSE reconnecting, auto-dismiss on reconnect
  - File: src/components/shared/Toast.tsx
  - Mount in app/(app)/_layout.tsx
  - Category: visual-engineering
  - Deps: none

### Mobile Navigation (NOT STARTED)

- [ ] T10-A: Install @react-navigation/drawer + react-native-gesture-handler
  - Category: quick
  - Deps: none

- [ ] T10-B: Drawer navigation for mobile (<768px) — swipe from left to reveal ProjectSidebar
  - Modify: app/(app)/_layout.tsx to use Drawer on narrow screens
  - Category: visual-engineering
  - Deps: T10-A

- [ ] T10-C: AddProjectSheet — bottom sheet for adding projects (mobile-friendly)
  - File: src/components/project/AddProjectSheet.tsx
  - Install: @gorhom/bottom-sheet
  - Replace inline add-project form in ProjectSidebar
  - Category: visual-engineering
  - Deps: T10-A

### Testing (PARTIAL — 93/354 tests)

- [x] T11-A: Test harness — factories, mocks, resetAllStores
- [x] T11-B: Pure logic tests — toolNormalize, processMessages, groupMessages, client builder (40 tests)
- [x] T11-C: Store tests — all 7 stores (53 tests)
- [ ] T11-D: SSE manager + useSSE hook tests (~38 tests)
- [ ] T11-E: Remaining hook tests — useClient, useSendMessage, useMessages, useSessions, usePermissions, useQuestions (~55 tests)
- [ ] T11-F: Component + screen integration tests — ChatInput, PartRenderer, ToolPart, ToolGroup, MessageBubble, SessionItem, SessionList, setup screen (~111 tests)
- [ ] T11-G: E2E flow tests — chat flow, settings flow, permission flow (~16 tests)

### Build + Deploy Verification

- [ ] T12-A: Web smoke test — npx expo start --web, manually verify: setup screen, connect, add project, create session, send message, tool groups, settings, file tree, sidebar responsive
- [ ] T12-B: Mobile build verification — expo prebuild, verify iOS/Android build, document polyfills needed
- [ ] T12-C: CI setup — GitHub Actions workflow for lint + test + web export on push

---

## Task Summary

| Section | Done | Remaining |
|---------|------|-----------|
| Foundation | 3/3 | 0 |
| SDK + Stores | 6/6 | 0 |
| Transcript + Hooks | 5/5 | 0 |
| Navigation + Screens | 5/5 | 0 |
| Chat UI | 7/7 | 0 |
| Project + Session | 3/3 | 0 |
| File Tree | 2/2 | 0 |
| Markdown Rendering | 0/5 | 5 |
| Permission/Question Prompts | 0/3 | 3 |
| Polish + Error Handling | 0/5 | 5 |
| Mobile Navigation | 0/3 | 3 |
| Testing | 3/7 | 4 |
| Build + Deploy | 0/3 | 3 |
| **TOTAL** | **34/54** | **20** |

## Parallelization

- T7-A, T8-A, T8-B, T9-A–E, T10-A, T11-D–G can ALL start in parallel (no cross-deps)
- T7-B/C/D depend on T7-A (install). T7-E depends on T7-B+C
- T8-C depends on T8-A+B
- T10-B/C depend on T10-A
- Max parallelism: ~12 independent tasks in first wave

## Known Issues
- messageStore.upsertPart ignores sessionId arg (parts keyed on messageId only, cross-session pollution possible)
- messageStore.clearSession leaks partsByMessage entries
- Chat text renders as plain Text, not markdown (T7 fixes this)
- No permission/question prompt UI yet (T8 fixes this)
- No mobile drawer navigation (T10 fixes this)
- No error boundaries or loading skeletons (T9 fixes this)
