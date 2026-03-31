# Gabi MVP — Implementation Plan

## Stack
- **Platform**: Expo 55 + expo-router v4 (universal: web + iOS/Android)
- **Styling**: NativeWind v4 (Tailwind in RN) + design tokens via CSS custom properties
- **State**: Zustand v5 (named `create` import — no default export)
- **SDK**: `@opencode-ai/sdk` v2 — always use `@opencode-ai/sdk/v2/client`
- **Package manager**: pnpm
- **Linting**: Biome
- **Testing**: Jest + React Native Testing Library

## Architecture
Pure client — no backend. Connects directly to one `opencode serve` instance.
All requests include `?directory=/abs/path` to scope to a project.
SSE: one persistent `GET /event?directory=X` stream per active project.

## Global Rules (every agent must follow)
1. Never use `styled()` HOC — NativeWind v4 uses `className` prop directly
2. Never `import create from 'zustand'` — use `import { create } from 'zustand'`
3. Always use `@opencode-ai/sdk/v2/client` not v1
4. SSE: one persistent connection per project, all events flow through it
5. Markdown: `MarkdownRenderer.web.tsx` (react-markdown) + `MarkdownRenderer.native.tsx` (react-native-markdown-display)
6. Dark mode: every className needs both base and `dark:` variant
7. Path alias: `@/*` → `src/*`, never relative paths crossing directories
8. TDD: tests are part of the deliverable, not optional
9. One atomic commit per task

## Project Structure
```
gabi/
├── app/                        ← expo-router routes
│   ├── _layout.tsx             ← Root layout
│   ├── index.tsx               ← Redirect logic
│   ├── setup.tsx               ← Connection setup
│   ├── settings.tsx            ← Visibility prefs
│   └── (app)/
│       ├── _layout.tsx         ← Responsive sidebar/drawer shell
│       ├── index.tsx           ← No session selected state
│       └── [sessionId]/
│           └── index.tsx       ← Chat view
├── src/
│   ├── client/                 ← SDK wrapper + SSE manager
│   │   ├── client.ts
│   │   ├── sse.ts
│   │   └── types.ts
│   ├── stores/                 ← Zustand stores
│   │   ├── connectionStore.ts  ← baseUrl, auth, SSE status (persisted)
│   │   ├── projectStore.ts     ← project list (persisted)
│   │   ├── sessionStore.ts     ← sessions per directory
│   │   ├── messageStore.ts     ← messages + parts, streaming state
│   │   ├── preferencesStore.ts ← visibility toggles (persisted)
│   │   ├── permissionStore.ts  ← pending permissions
│   │   └── questionStore.ts    ← pending questions
│   ├── hooks/
│   │   ├── useClient.ts
│   │   ├── useSSE.ts
│   │   ├── useMessages.ts
│   │   ├── useSendMessage.ts
│   │   ├── usePermissions.ts
│   │   ├── useQuestions.ts
│   │   └── useSessions.ts
│   ├── transcript/
│   │   ├── types.ts
│   │   ├── processMessages.ts
│   │   ├── groupMessages.ts
│   │   └── toolNormalize.ts
│   └── components/
│       ├── chat/
│       │   ├── MessageList.tsx
│       │   ├── MessageBubble.tsx
│       │   ├── PartRenderer.tsx
│       │   ├── TextPart.tsx
│       │   ├── ReasoningPart.tsx
│       │   ├── ToolGroup.tsx
│       │   ├── ToolPart.tsx
│       │   ├── FilePart.tsx
│       │   ├── StepBoundary.tsx
│       │   ├── SubtaskPart.tsx
│       │   └── ChatInput.tsx
│       ├── session/
│       │   ├── SessionList.tsx
│       │   └── SessionItem.tsx
│       ├── project/
│       │   ├── ProjectSidebar.tsx
│       │   └── AddProjectSheet.tsx
│       ├── file-tree/
│       │   ├── FileTree.tsx
│       │   └── FileTreeNode.tsx
│       └── shared/
│           ├── MarkdownRenderer.web.tsx
│           ├── MarkdownRenderer.native.tsx
│           ├── CodeBlock.tsx
│           ├── ConnectionStatus.tsx
│           ├── PermissionPrompt.tsx
│           ├── QuestionPrompt.tsx
│           ├── ErrorBoundary.tsx
│           ├── EmptyState.tsx
│           ├── Skeleton.tsx
│           └── Toast.tsx
├── global.css
├── tailwind.config.js
├── babel.config.js
├── metro.config.js
└── package.json
```

---

## Wave 0 — Foundation

### T0-A · Expo Project Initialization
**Category**: `deep` | **Deps**: none | **Commit**: `chore: initialize expo universal app with nativewind v4 and expo-router`

- Run `npx create-expo-app@latest . --template blank-typescript` in `/home/omer/dev/gabi`
- Install: `nativewind@^4`, `tailwindcss`, `react-native-reanimated`, `react-native-safe-area-context`, `expo-router`, `@opencode-ai/sdk`, `zustand@^5`, `use-sync-external-store`, `@react-native-async-storage/async-storage`, `expo-font`, `expo-constants`
- `tailwind.config.js` — content: `./app/**/*.{js,jsx,ts,tsx}`, `./src/**/*.{js,jsx,ts,tsx}`; preset: `require("nativewind/preset")`
- `babel.config.js` — add `jsxImportSource: "nativewind"` + `"nativewind/babel"` preset
- `metro.config.js` — `withNativeWind(config, { input: "./global.css" })`
- `global.css` — `@tailwind base; @tailwind components; @tailwind utilities;`
- `nativewind-env.d.ts` — `/// <reference types="nativewind/types" />`
- `app.json` — set `"bundler": "metro"` under `"web"`, set `"scheme": "gabi"`
- `app/_layout.tsx` — minimal root: import global.css, `<Stack />`
- `app/index.tsx` — placeholder
- `.gitignore` — standard + `.expo`, `dist`
- `git init && git add . && git commit`
- **Verify**: add `className="bg-red-500"` to a View, run `npx expo start --web`, confirm red background

### T0-B · Design Token System
**Category**: `visual-engineering` | **Deps**: T0-A | **Commit**: `chore: define design tokens and tailwind theme`

- Extend `global.css` with CSS custom properties (light + dark):
  - `--color-background`, `--color-foreground`, `--color-surface`, `--color-border`
  - `--color-primary` (indigo-500), `--color-muted`, `--color-muted-foreground`
  - `--color-destructive`, `--color-tool` (amber), `--color-reasoning` (purple)
  - `--color-user-bubble`, `--color-assistant-bubble`
- `tailwind.config.js` — map all tokens via `rgb(var(--color-X) / <alpha-value>)` pattern
- `src/lib/cn.ts` — `twMerge(clsx(...inputs))` utility
- Install: `clsx`, `tailwind-merge`

### T0-C · TypeScript + Biome Config
**Category**: `quick` | **Deps**: T0-A | **Commit**: `chore: configure typescript strict mode path aliases and biome`

- `tsconfig.json` — strict, `"@/*": ["./src/*"]`, `moduleResolution: "bundler"`
- `biome.json` — 2-space indent, double quotes, trailing commas, import sorting
- `package.json` scripts: `lint`, `lint:fix`, `test`, `test:watch`
- `jest.config.js` — jest-expo preset, transformIgnorePatterns including nativewind, `@/*` moduleNameMapper
- Install devDeps: `@biomejs/biome`, `jest`, `jest-expo`, `@testing-library/react-native`, `@types/jest`
- **Note**: `transformIgnorePatterns` must include `nativewind` or jest fails

---

## Wave 1 — SDK Layer + Stores (all parallel, after Wave 0)

### T1-A · OpenCode Client Factory + SSE Manager
**Category**: `deep` | **Deps**: T0-A, T0-C | **Commit**: `feat: add opencode sdk client factory and sse manager`

- `src/client/types.ts` — re-export SDK v2 types (Session, Message, Part, Event)
- `src/client/client.ts`:
  ```typescript
  export function buildClient(config: { baseUrl, username?, password?, directory? }): OpencodeClient
  export type OpencodeClient = ReturnType<typeof buildClient>
  ```
- `src/client/sse.ts` — `SSEManager` class:
  - `start()`, `stop()`, `connect()` (private), `scheduleReconnect()` (private)
  - Backoff: `Math.min(500 * 2^attempt, 30000)` + jitter `* (0.8 + random * 0.4)`
  - `onEvent(event)` callback for each SSE event
  - `onStatusChange("connected" | "reconnecting" | "disconnected")` — disconnected after 5 failures
  - Reset backoff on first event after reconnect
- Tests: SSEManager routes events, reconnects with correct delays, stops cleanly, status transitions

### T1-B · Connection + Project Stores
**Category**: `deep` | **Deps**: T0-A, T0-C | **Commit**: `feat: add connection and project zustand stores with persistence`

- `src/stores/connectionStore.ts` — `{ baseUrl, username, password, isConfigured, health, sseStatus }` — persisted
- `src/stores/projectStore.ts` — `{ projects: Project[], activeProjectId }` — persisted
  - `Project`: `{ id: string (uuid), name, directory, addedAt: number }`
  - Actions: `addProject`, `removeProject`, `setActiveProject`, `getProjectById`
- Persistence via `zustand/middleware` `persist` with `createJSONStorage(() => AsyncStorage)`

### T1-C · Session + Message + Preferences Stores
**Category**: `deep` | **Deps**: T0-A, T0-C | **Commit**: `feat: add session message and preferences zustand stores`

- `src/stores/sessionStore.ts` — `{ sessionsByDirectory: Record<string, Session[]>, activeSessionId }` — NOT persisted
- `src/stores/messageStore.ts`:
  - `messagesBySession: Record<string, Message[]>` (ordered)
  - `partsByMessage: Record<string, Record<string, Part>>` (O(1) upsert by partId)
  - `streamingSessionId: string | null`
  - Actions: setMessages, upsertMessage, upsertPart, removePart, removeMessage, setStreaming, clearSession
  - NOT persisted
- `src/stores/preferencesStore.ts` — `{ showReasoning, showToolCalls, showStepMarkers, showFileParts, collapseToolGroups, colorScheme }` — persisted
  - Defaults: showReasoning=true, showToolCalls=true, showStepMarkers=false, showFileParts=true, collapseToolGroups=true, colorScheme="system"

---

## Wave 2 — Transcript Pipeline + Hooks (parallel, after Wave 1)

### T2-A · Transcript Processing Pipeline
**Category**: `deep` | **Deps**: T1-C | **Commit**: `feat: add transcript processing pipeline with tool hydration and grouping`

- `src/transcript/types.ts` — `HydratedMessage`, `CollapsedToolGroup`, `RenderItem`
- `src/transcript/processMessages.ts` — messageStore state → `HydratedMessage[]` (ordered by time.created), pure function
- `src/transcript/groupMessages.ts` — `HydratedMessage[]` → per-message `RenderItem[]`:
  - ≥2 consecutive ToolParts → `CollapsedToolGroup`
  - 1 isolated ToolPart stays as `{ kind: "part" }`
  - Non-tool parts always `{ kind: "part" }`
- `src/transcript/toolNormalize.ts`:
  - `normalizeToolName(toolName)` → `{ label, kind }`
  - `summarizeToolGroup(parts)` → "3 reads, 2 edits" (sorted by count desc)
- Tests: empty session, 1 tool (no group), 2+ tools (group), tool-text-tool (two separate singles), 5 tools (one group), correct summary text

### T2-B · React Hooks — SSE + Message Operations
**Category**: `deep` | **Deps**: T1-A, T1-C | **Commit**: `feat: add sse subscription hooks and message operation hooks`

- `src/hooks/useClient.ts` — creates/caches OpencodeClient from connectionStore, returns null if not configured
- `src/hooks/useSSE.ts` — mounts SSEManager per (client, directory). Routes events:
  - `message.part.updated.1` → `messageStore.upsertPart`
  - `message.updated.1` → `messageStore.upsertMessage`
  - `session.created/updated.1` → `sessionStore.upsertSession`
  - `session.deleted.1` → `sessionStore.removeSession`
  - `session.idle` → `messageStore.setStreaming(null)`
  - `permission.updated` → `permissionStore.upsert`
  - `question.asked` → `questionStore.upsert`
  - Returns SSE status string
- `src/hooks/useMessages.ts` — selector: processMessages + groupMessages, memoized
- `src/hooks/useSendMessage.ts` — `{ send(text), isStreaming, abort }`
- `src/hooks/usePermissions.ts` — `{ permissions, reply(id, allow) }`
- `src/hooks/useQuestions.ts` — `{ questions, reply(id, response), reject(id) }`
- Also create: `src/stores/permissionStore.ts`, `src/stores/questionStore.ts`

---

## Wave 3 — Navigation Shell (parallel, after Wave 1)

### T3-A · Root Layout + Connection Setup Screen
**Category**: `visual-engineering` | **Deps**: T1-B | **Commit**: `feat: add root layout and connection setup screen`

- `app/_layout.tsx` — full root: global.css, SafeAreaProvider, NativeWind colorScheme wired to preferencesStore, Zustand hydration gate (render null until hydrated), `<Stack headerShown=false />`
- `app/index.tsx` — redirect: isConfigured → `/(app)`, else → `/setup`
- `app/setup.tsx` — connection form: Server URL + optional Username/Password, "Connect" button (calls health check), success → setConfig + navigate to `/(app)`, placeholder "http://192.168.1.x:4096"

### T3-B · App Shell — Responsive Sidebar Navigation
**Category**: `visual-engineering` | **Deps**: T1-B, T1-C | **Commit**: `feat: add app shell with responsive sidebar navigation`

- `app/(app)/_layout.tsx` — `useWindowDimensions().width >= 768`: persistent sidebar on web, Drawer on mobile
- `src/components/project/ProjectSidebar.tsx` — wordmark + ConnectionStatus + settings gear, project list, per-project session list inline, "Add Project" button
- `src/components/session/SessionList.tsx` — sessions list, "New Session" button, long-press/right-click context menu (rename, delete)
- `src/components/session/SessionItem.tsx` — single row
- `src/components/shared/ConnectionStatus.tsx` — 8px dot: green/amber/red from connectionStore.sseStatus
- `app/(app)/index.tsx` — "Select a session or create a new one" empty state
- Install: `@react-navigation/drawer`, `react-native-gesture-handler`, `@rn-primitives/dropdown-menu`

---

## Wave 4 — Core UI Components (all parallel, after Waves 2+3)

### T4-A · Markdown Renderer + Code Block
**Category**: `visual-engineering` | **Deps**: T0-B, T0-C | **Commit**: `feat: add markdown renderer and code block component`

- `src/components/shared/MarkdownRenderer.web.tsx` — react-markdown + remark-gfm, code blocks → CodeBlock
- `src/components/shared/MarkdownRenderer.native.tsx` — react-native-markdown-display, style map with design tokens
- `src/components/shared/CodeBlock.tsx` — react-syntax-highlighter (prism/oneDark), language badge, copy button (expo-clipboard), horizontal scroll on native
- Install: `react-markdown`, `remark-gfm`, `react-native-markdown-display`, `react-syntax-highlighter`, `@types/react-syntax-highlighter`, `expo-clipboard`

### T4-B · Chat Part Renderers
**Category**: `visual-engineering` | **Deps**: T4-A, T1-C | **Commit**: `feat: add chat part renderer components with visibility control`

- `PartRenderer.tsx` — dispatcher: text→TextPart, reasoning→ReasoningPart (if showReasoning), file→FilePart (if showFileParts), step-start/finish→StepBoundary (if showStepMarkers), subtask→SubtaskPart
- `TextPart.tsx` — renders via MarkdownRenderer
- `ReasoningPart.tsx` — collapsible, default collapsed "Thinking...", muted/purple styling when expanded
- `FilePart.tsx` — filename + path, no inline content
- `StepBoundary.tsx` — thin rule with "Step N" label
- `SubtaskPart.tsx` — status chip

### T4-C · Tool Call Group Component
**Category**: `visual-engineering` | **Deps**: T2-A, T1-C | **Commit**: `feat: add collapsible tool call and tool group components`

- `ToolPart.tsx` — normalized tool name, collapsible input JSON, result below, loading spinner/checkmark/error icon, amber accent
- `ToolGroup.tsx` — collapsed: summary chip + chevron; expanded: list of ToolParts; default collapse from preferencesStore.collapseToolGroups

### T4-D · Permission + Question Prompt Modals
**Category**: `visual-engineering` | **Deps**: T2-B | **Commit**: `feat: add permission and question prompt modals`

- `PermissionPrompt.tsx` — modal overlay, tool name + args, Allow/Deny, non-dismissable, queue (one at a time)
- `QuestionPrompt.tsx` — question text, radio options or TextInput, Submit
- Install: `@rn-primitives/dialog`

### T4-E · Connection Status Indicator
**Category**: `quick` | **Deps**: T1-B | **Commit**: `feat: add connection status indicator component`

- `ConnectionStatus.tsx` — 8px dot, green/amber(pulsing)/red, optional label text, reads connectionStore.sseStatus

---

## Wave 5 — Chat Screen + Session Management (all parallel, after Wave 4)

### T5-A · Chat Screen — Message List + Streaming
**Category**: `visual-engineering` | **Deps**: T4-A–C, T2-B | **Commit**: `feat: add chat screen with streaming message list`

- `app/(app)/[sessionId]/index.tsx` — mounts useSSE, loads history on mount, renders MessageList + ChatInput in KeyboardAvoidingView, overlays PermissionPrompt + QuestionPrompt
- `MessageList.tsx` — FlashList (or FlatList), newest at bottom, auto-scroll on new parts, streaming dots when streamingSessionId matches
- `MessageBubble.tsx` — user (right, bg-user-bubble) vs assistant (left, bg-assistant-bubble), renders RenderItem[] via PartRenderer/ToolGroup
- Install: `@shopify/flash-list`

### T5-B · Chat Input + Send/Abort Controls
**Category**: `visual-engineering` | **Deps**: T2-B | **Commit**: `feat: add chat input with send and abort controls`

- `ChatInput.tsx` — multiline TextInput (max 6 lines), send button (disabled when empty/streaming), abort button (replaces send when streaming), Cmd+Enter on web, placeholder "Ask anything...", disabled when SSE disconnected

### T5-C · Session Management Actions
**Category**: `visual-engineering` | **Deps**: T1-C, T2-B | **Commit**: `feat: add session management with create rename and delete`

- `src/hooks/useSessions.ts` — `{ sessions, isLoading, createSession, deleteSession, renameSession, selectSession }`
- Wire into SessionList.tsx (from T3-B)
- Inline rename: tap title → TextInput → blur/Enter → save

---

## Wave 6 — Project Management + File Tree (parallel, after Wave 3)

### T6-A · Project Management UI
**Category**: `visual-engineering` | **Deps**: T3-B, T1-B | **Commit**: `feat: add project management with add and remove project ui`

- `AddProjectSheet.tsx` — bottom sheet, directory path + display name, Verify button (GET /global/health), Add button (enabled after verify), dismiss on success
- Update ProjectSidebar: swipe-to-delete on mobile, trash on hover on web, confirm dialog before remove
- Install: `@gorhom/bottom-sheet`, `@rn-primitives/alert-dialog`

### T6-B · Read-only File Tree + Git Status
**Category**: `visual-engineering` | **Deps**: T3-B, T1-A | **Commit**: `feat: add read-only file tree with git status badges`

- `src/lib/buildFileTree.ts` — pure function: `string[]` → nested `{ name, path, children?, isDir }`
- `src/hooks/useFileTree.ts` — `{ files, gitStatus: Record<string, GitStatus>, isLoading, refresh }`
- `FileTree.tsx` — FlatList with indentation, FileTreeNode per row
- `FileTreeNode.tsx` — chevron+folder or file icon+name, git badge (M=amber, A=green, D=red, ?=gray, R=blue), lazy children on expand

---

## Wave 7 — Settings + Polish (parallel, after Waves 5+6)

### T7-A · Settings Screen
**Category**: `visual-engineering` | **Deps**: T1-C | **Commit**: `feat: add settings screen with user-configurable visibility preferences`

- `app/settings.tsx`:
  - Display section: Show reasoning, Show tool calls, Collapse tool groups, Show step markers, Show file parts
  - Appearance: System/Light/Dark segmented control
  - Connection: current URL (read-only), Disconnect button → connectionStore.reset() → navigate to /setup
  - All changes save immediately (persisted store)

### T7-B · Error Boundaries + Empty States + Skeletons
**Category**: `quick` | **Deps**: T3-A, T3-B | **Commit**: `feat: add error boundaries empty states and loading skeletons`

- `ErrorBoundary.tsx` — class component, "Something went wrong" + retry
- `EmptyState.tsx` — `{ icon, title, subtitle, action? }` reusable
- Empty states: no projects, no sessions, connection failed, empty chat
- `Skeleton.tsx` — shimmer, SessionSkeleton (3 rows), MessageSkeleton (2 bubbles)
- Wrap MessageList and SessionList with ErrorBoundary

### T7-C · SSE Reconnect + Offline Handling
**Category**: `deep` | **Deps**: T1-A, T2-B | **Commit**: `fix: add sse reconnect with exponential backoff and offline handling`

- Complete SSEManager reconnect: backoff 500ms→30s, jitter `*(0.8+random*0.4)`, disconnected after 5 failures
- `Toast.tsx` — "Reconnecting to OpenCode..." on reconnecting, auto-dismiss on reconnect, mounted in `app/(app)/_layout.tsx`

---

## Wave 8 — Integration Tests + Smoke

### T8-A · Integration Test Suite
**Category**: `deep` | **Deps**: Wave 7 | **Commit**: `feat(test): add integration test suite with mock opencode server`

- `src/__tests__/mocks/mockSseStream.ts` — mock async iterable for SSE
- `src/__tests__/mocks/mockClient.ts` — jest.fn() mock for all client methods
- Integration tests:
  - Full send-message flow (send → SSE events → message appears → session.idle → streaming stops)
  - Permission prompt flow (permission.asked → modal → Allow → reply called)
  - Session create flow (button → client.create → store updated → navigation)
  - SSE reconnect flow (throw → backoff → onStatusChange sequence)

### T8-B · Web Smoke Test + Mobile Verification
**Category**: `deep` | **Deps**: T8-A | **Commit**: `chore: web and mobile build verification and polyfill documentation`

- Manual checklist: app loads, setup screen, health check, add project, session list, create session, send message, tool groups, settings toggles, sidebar responsive, file tree, disconnect/reconnect
- `docs/smoke-test-results.md` — results + known issues
- `docs/polyfills.md` — document if react-native-polyfill-globals needed for SSE on Hermes

---

## Task Summary

| ID | Wave | Category | Parallel | Deps |
|----|------|----------|----------|------|
| T0-A | 0 | deep | no | — |
| T0-B | 0 | visual-engineering | yes (after T0-A) | T0-A |
| T0-C | 0 | quick | yes (after T0-A) | T0-A |
| T1-A | 1 | deep | yes | T0-A, T0-C |
| T1-B | 1 | deep | yes | T0-A, T0-C |
| T1-C | 1 | deep | yes | T0-A, T0-C |
| T2-A | 2 | deep | yes | T1-C |
| T2-B | 2 | deep | yes | T1-A, T1-C |
| T3-A | 3 | visual-engineering | yes | T1-B |
| T3-B | 3 | visual-engineering | yes | T1-B, T1-C |
| T4-A | 4 | visual-engineering | yes | T0-B, T0-C |
| T4-B | 4 | visual-engineering | yes | T4-A, T1-C |
| T4-C | 4 | visual-engineering | yes | T2-A, T1-C |
| T4-D | 4 | visual-engineering | yes | T2-B |
| T4-E | 4 | quick | yes | T1-B |
| T5-A | 5 | visual-engineering | yes | T4-A–C, T2-B |
| T5-B | 5 | visual-engineering | yes | T2-B |
| T5-C | 5 | visual-engineering | yes | T1-C, T2-B |
| T6-A | 6 | visual-engineering | yes | T3-B, T1-B |
| T6-B | 6 | visual-engineering | yes | T3-B, T1-A |
| T7-A | 7 | visual-engineering | yes | T1-C |
| T7-B | 7 | quick | yes | T3-A, T3-B |
| T7-C | 7 | deep | yes | T1-A, T2-B |
| T8-A | 8 | deep | no | Wave 7 |
| T8-B | 8 | deep | no | T8-A |
