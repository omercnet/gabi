# OpenCode API Research — Complete API Surface

**Source**: sst/opencode @ HEAD (cloned 2026-03-31)  
**SDK Package**: `@opencode-ai/sdk` v1.3.10  
**Evidence paths**: `/tmp/opencode/packages/sdk/js/`, `/tmp/opencode/packages/opencode/src/`

---

## 1. Architecture Overview

OpenCode has a **client/server architecture** explicitly designed for remote clients:

> "A client/server architecture. This can allow OpenCode to run on your computer while you drive it remotely from a mobile app — the TUI frontend is just one of the possible clients."

```
┌─────────────────────────────────────────────────────┐
│                  OpenCode Server                    │
│   opencode serve --hostname=0.0.0.0 --port=4096    │
│                                                     │
│   HTTP REST API  +  SSE streaming  +  Basic Auth   │
│   Framework: Hono (Bun HTTP server)                │
└─────────────────────────────────────────────────────┘
         ▲                         ▲
         │  HTTP REST              │  SSE (GET /event)
         │                         │
┌────────┴──────┐         ┌────────┴──────┐
│   TUI client  │         │  Web/Mobile   │
│  (built-in)   │         │  client (YOU) │
└───────────────┘         └───────────────┘
```

---

## 2. Connection Protocol

### Transport
- **HTTP/1.1 REST** for all CRUD operations
- **Server-Sent Events (SSE)** for streaming (AI responses, session events)
- **No WebSockets** (Hono SSE, not WS)

### Default Server
```
opencode serve --hostname=127.0.0.1 --port=4096
```

Spawning programmatically:
```typescript
// From packages/sdk/js/src/server.ts
const proc = spawn('opencode', ['serve', `--hostname=${hostname}`, `--port=${port}`])
// Watches stdout for: "opencode server listening on http://..."
```

### Authentication
**HTTP Basic Auth** — optional but recommended:
```
OPENCODE_SERVER_PASSWORD=secret OPENCODE_SERVER_USERNAME=opencode opencode serve
```

The server middleware:
```typescript
// packages/opencode/src/server/server.ts
.use((c, next) => {
  if (c.req.method === "OPTIONS") return next()          // CORS preflight passes
  const password = Flag.OPENCODE_SERVER_PASSWORD
  if (!password) return next()                           // no auth = open
  const username = Flag.OPENCODE_SERVER_USERNAME ?? "opencode"
  return basicAuth({ username, password })(c, next)      // Basic Auth header
})
```

**Header**: `Authorization: Basic base64(username:password)`

### CORS Policy
Whitelisted origins:
- `http://localhost:*`
- `http://127.0.0.1:*`
- `tauri://localhost`, `http://tauri.localhost`, `https://tauri.localhost`
- `https://*.opencode.ai`
- Custom origins via `opts.cors` array

---

## 3. Official JavaScript SDK

### Package
```
@opencode-ai/sdk   (npm, v1.3.10)
```

### Imports
```typescript
import { createOpencodeClient, createOpencodeServer } from "@opencode-ai/sdk/v2/client"
import type { Session, Message, Part, Event } from "@opencode-ai/sdk/v2"
```

### Client Instantiation
```typescript
import { createOpencodeClient } from "@opencode-ai/sdk/v2/client"

const client = createOpencodeClient({
  baseUrl: "http://localhost:4096",
  // Optional Basic Auth:
  auth: { username: "opencode", password: "secret" },
  // Optional: pin to a project directory
  directory: "/path/to/project",
  // Optional: workspace ID (experimental)
  experimental_workspaceID: "ws_xxx",
})
```

The `directory` header is sent as `x-opencode-workspace` / `x-opencode-directory` and automatically injected into query params for GET/HEAD requests.

---

## 4. Complete API Endpoint Reference

All routes are relative to the server base URL (default: `http://127.0.0.1:4096`).

### Global

| Method | Path | SDK | Description |
|--------|------|-----|-------------|
| GET | `/global/health` | `client.global.health()` | Health check |
| GET | `/global/config` | `client.config.get()` | Get global config |
| PATCH | `/global/config` | `client.config.update()` | Update global config |
| GET | `/global/event` | `client.global.event()` | Global event stream |
| SSE GET | `/global/sync-event` | `client.syncEvent.subscribe()` | Global sync events (session CRUD) |
| SSE GET | `/global/dispose` | `client.global.dispose()` | Fires when server shuts down |
| POST | `/global/upgrade` | `client.global.upgrade()` | Upgrade opencode |

### Sessions ← Core API

| Method | Path | SDK | Description |
|--------|------|-----|-------------|
| GET | `/session` | `client.session.list()` | List all sessions |
| POST | `/session` | `client.session.create()` | Create new session |
| GET | `/session/status` | `client.session.status()` | Global session status |
| GET | `/session/{sessionID}` | `client.session.get(...)` | Get session by ID |
| PATCH | `/session/{sessionID}` | `client.session.update(...)` | Update session (rename etc.) |
| DELETE | `/session/{sessionID}` | `client.session.delete(...)` | Delete session |
| GET | `/session/{sessionID}/children` | `client.session.children(...)` | Get child sessions |
| GET | `/session/{sessionID}/todo` | `client.session.todo(...)` | Get todos for session |
| POST | `/session/{sessionID}/init` | `client.session.init(...)` | Initialize session |
| POST | `/session/{sessionID}/fork` | `client.session.fork(...)` | Fork session |
| POST | `/session/{sessionID}/abort` | `client.session.abort(...)` | Abort running generation |
| GET | `/session/{sessionID}/diff` | `client.session.diff(...)` | Get session diffs |
| POST | `/session/{sessionID}/summarize` | `client.session.summarize(...)` | Summarize session |
| POST | `/session/{sessionID}/share` | `client.session.share(...)` | Share session |
| DELETE | `/session/{sessionID}/share` | `client.session.unshare(...)` | Unshare session |
| POST | `/session/{sessionID}/revert` | `client.session.revert(...)` | Revert session changes |
| POST | `/session/{sessionID}/unrevert` | `client.session.unrevert(...)` | Undo revert |

### Messages ← Core API

| Method | Path | SDK | Description |
|--------|------|-----|-------------|
| GET | `/session/{sessionID}/message` | `client.session.messages(...)` | List all messages |
| **POST** | **`/session/{sessionID}/message`** | **`client.session.prompt(...)`** | **Send message + stream response (SSE)** |
| POST | `/session/{sessionID}/prompt_async` | `client.session.promptAsync(...)` | Send message async (no streaming) |
| DELETE | `/session/{sessionID}/message/{messageID}` | `client.session.deleteMessage(...)` | Delete message |
| GET | `/session/{sessionID}/message/{messageID}` | `client.session.message(...)` | Get single message + parts |
| POST | `/session/{sessionID}/command` | `client.session.command(...)` | Execute slash command in session |
| POST | `/session/{sessionID}/shell` | `client.session.shell(...)` | Execute shell in session |

### Message Parts

| Method | Path | SDK | Description |
|--------|------|-----|-------------|
| DELETE | `/session/{sessionID}/message/{messageID}/part/{partID}` | `client.part.delete(...)` | Delete part |
| PATCH | `/session/{sessionID}/message/{messageID}/part/{partID}` | `client.part.update(...)` | Update part |

### Events (SSE) ← Streaming

| Method | Path | SDK | Description |
|--------|------|-----|-------------|
| **SSE GET** | **`/event`** | **`client.event.subscribe()`** | **Per-workspace event stream** |
| SSE GET | `/global/sync-event` | `client.syncEvent.subscribe()` | Global sync (session CRUD) |
| SSE GET | `/global/dispose` | `client.global.dispose()` | Server shutdown signal |

### Permissions & Questions

| Method | Path | SDK | Description |
|--------|------|-----|-------------|
| GET | `/permission` | `client.permission.list()` | List pending permissions |
| POST | `/session/{sessionID}/permissions/{permissionID}` | `client.permission.respond(...)` | Respond to permission (deprecated) |
| POST | `/permission/{requestID}/reply` | `client.permission.reply(...)` | Reply to permission request |
| GET | `/question` | `client.question.list()` | List pending questions |
| POST | `/question/{requestID}/reply` | `client.question.reply(...)` | Answer a question |
| POST | `/question/{requestID}/reject` | `client.question.reject(...)` | Reject a question |

### Providers & Auth

| Method | Path | SDK | Description |
|--------|------|-----|-------------|
| GET | `/provider` | `client.provider.list()` | List available providers |
| GET | `/provider/auth` | `client.provider.auth()` | Get provider auth status |
| PUT | `/auth/{providerID}` | `client.auth.set(...)` | Set provider credentials |
| DELETE | `/auth/{providerID}` | `client.auth.remove(...)` | Remove provider credentials |
| POST | `/provider/{providerID}/oauth/authorize` | `client.oauth.authorize(...)` | Start OAuth flow |
| POST | `/provider/{providerID}/oauth/callback` | `client.oauth.callback(...)` | OAuth callback |

### Config

| Method | Path | SDK | Description |
|--------|------|-----|-------------|
| GET | `/config` | `client.config.get()` | Get project config |
| GET | `/config/providers` | `client.config.providers()` | Get provider configs |

### Files & Search

| Method | Path | SDK | Description |
|--------|------|-----|-------------|
| GET | `/file` | `client.file.list()` | List files |
| GET | `/file/content` | `client.file.read(...)` | Read file content |
| GET | `/file/status` | `client.file.status(...)` | File status |
| GET | `/find` | `client.find.text(...)` | Text search |
| GET | `/find/file` | `client.find.files(...)` | File search |
| GET | `/find/symbol` | `client.find.symbols(...)` | Symbol search |

### PTY (Terminal)

| Method | Path | SDK | Description |
|--------|------|-----|-------------|
| GET | `/pty` | `client.pty.list()` | List PTY sessions |
| POST | `/pty` | `client.pty.create()` | Create PTY |
| DELETE | `/pty/{ptyID}` | `client.pty.remove(...)` | Remove PTY |
| GET | `/pty/{ptyID}` | `client.pty.get(...)` | Get PTY |
| PATCH | `/pty/{ptyID}` | `client.pty.update(...)` | Update PTY |
| SSE GET | `/pty/{ptyID}/connect` | `client.pty.connect(...)` | Connect to PTY (streaming) |

### Projects, Agents, Tools

| Method | Path | SDK | Description |
|--------|------|-----|-------------|
| GET | `/project` | `client.project.list()` | List projects |
| GET | `/project/current` | `client.project.current()` | Get current project |
| PATCH | `/project/{projectID}` | `client.project.update(...)` | Update project |
| POST | `/project/git/init` | `client.project.initGit()` | Init git |
| GET | `/agent` | `client.app.agents()` | List available agents |
| GET | `/skill` | `client.app.skills()` | List available skills |
| GET | `/command` | `client.command.list()` | List slash commands |
| GET | `/experimental/tool` | `client.tool.list()` | List tools |
| GET | `/experimental/tool/ids` | `client.tool.ids()` | Get tool IDs |

### MCP

| Method | Path | SDK | Description |
|--------|------|-----|-------------|
| GET | `/mcp` | `client.mcp.status()` | MCP server status |
| POST | `/mcp` | `client.mcp.add()` | Add MCP server |
| POST | `/mcp/{name}/connect` | `client.mcp.connect(...)` | Connect to MCP |
| POST | `/mcp/{name}/disconnect` | `client.mcp.disconnect(...)` | Disconnect from MCP |
| POST | `/mcp/{name}/auth` | `client.auth2.start(...)` | Start MCP auth |
| POST | `/mcp/{name}/auth/callback` | `client.auth2.callback(...)` | MCP auth callback |

### Misc

| Method | Path | SDK | Description |
|--------|------|-----|-------------|
| GET | `/vcs` | `client.vcs.get()` | VCS info (branch etc.) |
| GET | `/lsp` | `client.lsp.status()` | LSP status |
| GET | `/formatter` | `client.formatter.status()` | Formatter status |
| GET | `/path` | `client.path.get()` | Get resolved paths |
| POST | `/instance/dispose` | `client.instance.dispose()` | Dispose server instance |
| POST | `/log` | `client.app.log(...)` | Log message |
| GET | `/experimental/workspace` | `client.workspace.list()` | List workspaces |
| POST | `/experimental/workspace` | `client.workspace.create()` | Create workspace |
| DELETE | `/experimental/workspace/{id}` | `client.workspace.remove(...)` | Remove workspace |

---

## 5. Data Models

### Session
```typescript
type Session = {
  id: string
  slug: string
  projectID: string
  workspaceID?: string
  directory: string
  parentID?: string
  title: string
  version: string
  time: {
    created: number    // unix ms
    updated: number
    compacting?: number
    archived?: number
  }
  summary?: {
    additions: number
    deletions: number
    files: number
    diffs?: FileDiff[]
  }
  share?: { url: string }
  permission?: PermissionRuleset
  revert?: {
    messageID: string
    partID?: string
    snapshot?: string
    diff?: string
  }
}
```

### Message (union type)
```typescript
type Message = UserMessage | AssistantMessage

type UserMessage = {
  id: string
  sessionID: string
  role: "user"
  time: { created: number; completed?: number }
  parts: Part[]
}

type AssistantMessage = {
  id: string
  sessionID: string
  role: "assistant"
  time: { created: number; completed?: number }
  parentID: string
  modelID: string
  providerID: string
  mode: string
  error?: ProviderAuthError | UnknownError | MessageOutputLengthError | MessageAbortedError | ...
  parts: Part[]
}
```

### Part Types (message content blocks)
```typescript
type Part =
  | TextPart          // type: "text"           — plain text
  | ReasoningPart     // type: "reasoning"      — model reasoning/thinking
  | ToolPart          // type: "tool"            — tool call + result
  | FilePart          // type: "file"            — file reference
  | SubtaskPart       // type: "subtask"         — sub-task
  | StepStartPart     // type: "step-start"      — step boundary
  | StepFinishPart    // type: "step-finish"     — step boundary
  | SnapshotPart      // type: "snapshot"        — code snapshot
  | PatchPart         // type: "patch"           — file patch
  | AgentPart         // type: "agent"           — agent call
  | RetryPart         // type: "retry"           — retry marker
  | CompactionPart    // type: "compaction"      — context compaction
```

---

## 6. SSE Event System

### How to Subscribe
```typescript
// Subscribe to all workspace events (the main stream)
const stream = client.event.subscribe({ directory: "/path/to/project" })

for await (const event of stream) {
  switch (event.type) {
    case "message.part.delta":    // Streaming AI text chunk
    case "session.status":        // Session running/idle state change
    case "session.idle":          // Session became idle (done)
    case "session.created":       // New session created
    case "session.updated":       // Session metadata changed
    case "session.deleted":       // Session removed
    case "message.part.updated":  // Part content updated
    case "message.part.removed":  // Part removed
    case "permission.asked":      // AI needs tool permission
    case "permission.replied":    // Permission answered
    case "question.asked":        // AI asked a question
    case "question.replied":      // Question answered
    case "question.rejected":     // Question rejected
    case "session.compacted":     // Context compacted
    case "session.diff":          // File diffs updated
    case "session.error":         // Session error
    case "file.edited":           // File changed
    case "file.watcher.updated":  // File watcher event
    case "todo.updated":          // Todo list changed
    case "command.executed":      // Command ran
    case "lsp.client.diagnostics":// LSP diagnostics
    case "lsp.updated":           // LSP updated
    case "mcp.tools.changed":     // MCP tools changed
  }
}
```

### Sync Events (Global, for session list management)
```typescript
// Subscribe to global session CRUD events
const stream = client.syncEvent.subscribe()

for await (const event of stream) {
  switch (event.type) {
    case "session.created.1":         // { sessionID, info: Session }
    case "session.updated.1":         // { sessionID, info: Session }
    case "session.deleted.1":         // { sessionID }
    case "message.updated.1":         // { sessionID, info: Message }
    case "message.removed.1":         // { sessionID, messageID }
    case "message.part.updated.1":    // { sessionID, messageID, info: Part }
    case "message.part.removed.1":    // { sessionID, messageID, partID }
  }
}
```

### Key Event: `message.part.delta`
This is the real-time AI streaming event:
```typescript
type EventMessagePartDelta = {
  type: "message.part.delta"
  // Contains incremental text delta for streaming display
}
```

---

## 7. Sending Messages (The Core Flow)

```typescript
// 1. Create a session
const session = await client.session.create()

// 2. Send a message (streams response via SSE)
const stream = client.session.prompt({
  sessionID: session.id,
  messageID: "msg_" + Date.now(),  // optional idempotency key
  model: {
    providerID: "anthropic",
    modelID: "claude-sonnet-4-5",
  },
  parts: [
    { type: "text", text: "Hello, help me with this code" }
  ],
})

// Stream is SSE — iterate for events
for await (const event of stream) {
  if (event.type === "message.part.delta") {
    // append delta to UI
  }
  if (event.type === "session.idle") {
    // response complete
    break
  }
}

// 3. OR use promptAsync (fire-and-forget, then listen on /event SSE)
await client.session.promptAsync({
  sessionID: session.id,
  parts: [{ type: "text", text: "..." }]
})
// Then listen to client.event.subscribe() for the events
```

---

## 8. Server Startup (Programmatic)

```typescript
import { createOpencodeServer, createOpencodeClient } from "@opencode-ai/sdk/v2/client"

const server = await createOpencodeServer({
  hostname: "127.0.0.1",
  port: 4096,
  timeout: 5000,          // ms to wait for startup
  config: { logLevel: "INFO" },
})

// server.url = "http://127.0.0.1:4096"
const client = createOpencodeClient({ baseUrl: server.url })

// ... do stuff ...
server.close()
```

Environment variable for config injection:
```bash
OPENCODE_CONFIG_CONTENT='{"providers":{"anthropic":{"apiKey":"sk-..."}}}' opencode serve
```

---

## 9. Client Architecture Recommendation

Based on the research:

```
┌─────────────────────────────────────────────┐
│              Web/Mobile Client              │
│                                             │
│  1. createOpencodeClient(baseUrl, auth)     │
│  2. GET /global/health  → verify connection │
│  3. SSE /global/sync-event → session list  │
│  4. SSE /event?directory=X → live events   │
│  5. POST /session → create session         │
│  6. POST /session/:id/message → prompt     │
│     (stream = SSE response)                │
│  7. Handle permission.asked events         │
│  8. POST /permission/:id/reply             │
└─────────────────────────────────────────────┘
```

**Versioning note**: There is a `v1` SDK (`/src/gen/`) and a `v2` SDK (`/src/v2/gen/`). Use **v2** — it is the current API (`export "./v2": "./src/v2/index.ts"`).

---

## 10. Key Source Permalinks

All evidence is from commit `HEAD` of `sst/opencode`:

- SDK Client: `packages/sdk/js/src/v2/client.ts`
- SDK Types: `packages/sdk/js/src/v2/gen/types.gen.ts`
- SDK Endpoints: `packages/sdk/js/src/v2/gen/sdk.gen.ts`
- Server startup: `packages/sdk/js/src/server.ts`
- HTTP Server: `packages/opencode/src/server/server.ts`
- Serve command: `packages/opencode/src/cli/cmd/serve.ts`
- Auth flags: `packages/opencode/src/flag/flag.ts`

Get current SHA:
```bash
cd /tmp/opencode && git rev-parse HEAD
```
Then construct permalinks:
```
https://github.com/sst/opencode/blob/<SHA>/packages/sdk/js/src/v2/gen/types.gen.ts
```
