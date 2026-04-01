# Gabi Test Coverage Map

## Overview
Comprehensive test strategy for Gabi codebase organized by functional area, test type (unit/integration/e2e), critical behaviors, and edge cases.

---

## 1. CLIENT WRAPPER & SDK INTEGRATION

### 1.1 Client Builder (`/home/omer/dev/gabi/src/client/client.ts`)

**Type**: Unit

**Critical Behaviors**:
- Builds OpencodeClient with correct baseUrl
- Encodes Basic Auth credentials when username/password provided
- Passes headers correctly to SDK
- Handles optional auth (username/password)
- Passes directory config to SDK

**Edge Cases**:
- Empty username/password (should not add auth header)
- Only username provided (should not add auth header)
- Only password provided (should not add auth header)
- Special characters in username/password (encoding)
- Invalid baseUrl format
- Missing baseUrl

**Test File**: `/home/omer/dev/gabi/src/client/__tests__/client.test.ts`

**Test Cases**:
```
✓ buildClient creates client with baseUrl
✓ buildClient adds Basic Auth header when credentials provided
✓ buildClient skips auth header when credentials missing
✓ buildClient encodes credentials correctly
✓ buildClient passes directory to SDK
✓ buildClient handles special characters in credentials
```

---

## 2. SSE MANAGER & STREAMING

### 2.1 SSE Manager (`/home/omer/dev/gabi/src/client/sse.ts`)

**Type**: Unit + Integration

**Critical Behaviors**:
- Starts connection and sets status to "connected"
- Stops connection and sets status to "disconnected"
- Handles async iteration over SSE events
- Calls onEvent callback for each event
- Calls onStatusChange callback on status changes
- Implements exponential backoff with jitter
- Stops reconnecting after MAX_FAILURES (5)
- Respects running flag to prevent race conditions
- Cleans up AbortController on stop

**Edge Cases**:
- Start called when already running (should be idempotent)
- Stop called when not running (should be safe)
- Connection fails immediately (should retry)
- Connection fails after MAX_FAILURES (should stop retrying)
- Event stream ends unexpectedly (should reconnect)
- Running flag set to false during connect (should abort)
- Backoff calculation with jitter (should be within bounds)
- Multiple rapid start/stop calls
- Event with null/undefined data
- Non-async-iterable result from client

**Test File**: `/home/omer/dev/gabi/src/client/__tests__/sse.test.ts`

**Test Cases**:
```
✓ SSEManager.start() sets running=true and calls connect()
✓ SSEManager.stop() sets running=false and aborts connection
✓ SSEManager.stop() is idempotent
✓ SSEManager.start() is idempotent
✓ SSEManager calls onStatusChange on status transitions
✓ SSEManager calls onEvent for each event
✓ SSEManager implements exponential backoff
✓ SSEManager stops retrying after MAX_FAILURES
✓ SSEManager respects running flag during connect
✓ SSEManager cleans up AbortController
✓ SSEManager handles connection errors gracefully
✓ SSEManager handles non-iterable results
✓ SSEManager backoff jitter is within bounds
✓ SSEManager reconnects on stream end
```

---

## 3. STATE MANAGEMENT (ZUSTAND STORES)

### 3.1 Message Store (`/home/omer/dev/gabi/src/stores/messageStore.ts`)

**Type**: Unit

**Critical Behaviors**:
- setMessages replaces all messages for a session
- upsertMessage adds new message or updates existing
- removeMessage deletes message by ID
- upsertPart adds/updates part in message
- removePart deletes part from message
- setStreaming tracks which session is streaming
- setLoading tracks loading state per session
- clearSession removes all messages for session
- Maintains immutability (no mutations)

**Edge Cases**:
- upsertMessage with duplicate ID (should update, not duplicate)
- removeMessage with non-existent ID (should be safe)
- upsertPart with non-existent message (should create entry)
- removePart with non-existent part (should be safe)
- setStreaming(null) when already null
- clearSession with non-existent session
- Multiple rapid updates to same message
- Large number of messages/parts

**Test File**: `/home/omer/dev/gabi/src/stores/__tests__/messageStore.test.ts`

**Test Cases**:
```
✓ setMessages replaces messages for session
✓ upsertMessage adds new message
✓ upsertMessage updates existing message
✓ removeMessage deletes message
✓ removeMessage is safe with non-existent ID
✓ upsertPart adds part to message
✓ upsertPart updates existing part
✓ removePart deletes part
✓ removePart is safe with non-existent part
✓ setStreaming tracks streaming session
✓ setLoading tracks loading state
✓ clearSession removes all messages
✓ Store maintains immutability
✓ Multiple updates don't cause duplicates
```

### 3.2 Session Store (`/home/omer/dev/gabi/src/stores/sessionStore.ts`)

**Type**: Unit

**Critical Behaviors**:
- setSessions replaces sessions for directory
- upsertSession adds new or updates existing
- removeSession deletes session and clears activeSessionId if needed
- setLoading tracks loading state per directory
- setActiveSession sets active session ID
- New sessions prepended to list (most recent first)

**Edge Cases**:
- upsertSession with duplicate ID (should update)
- removeSession when it's the active session (should clear activeSessionId)
- removeSession when it's not active (should keep activeSessionId)
- setActiveSession to non-existent session
- setSessions with empty array
- Multiple rapid updates

**Test File**: `/home/omer/dev/gabi/src/stores/__tests__/sessionStore.test.ts`

**Test Cases**:
```
✓ setSessions replaces sessions for directory
✓ upsertSession adds new session
✓ upsertSession updates existing session
✓ upsertSession prepends new sessions
✓ removeSession deletes session
✓ removeSession clears activeSessionId if removed
✓ removeSession preserves activeSessionId if different
✓ setLoading tracks loading state
✓ setActiveSession sets active session
✓ Store maintains immutability
```

### 3.3 Connection Store (`/home/omer/dev/gabi/src/stores/connectionStore.ts`)

**Type**: Unit + Integration (AsyncStorage)

**Critical Behaviors**:
- configure() sets baseUrl, username, password, isConfigured=true
- setHealth() updates health status
- setSseStatus() updates SSE connection status
- reset() clears all to initial state
- Persists to AsyncStorage (baseUrl, username, password, isConfigured)
- Does NOT persist health or sseStatus
- Initializes from AsyncStorage on app load

**Edge Cases**:
- configure() with empty username/password (should accept)
- configure() with special characters
- reset() when already reset
- AsyncStorage unavailable (should fail gracefully)
- Corrupted AsyncStorage data
- Multiple configure() calls in sequence

**Test File**: `/home/omer/dev/gabi/src/stores/__tests__/connectionStore.test.ts`

**Test Cases**:
```
✓ configure() sets connection details
✓ configure() sets isConfigured=true
✓ setHealth() updates health status
✓ setSseStatus() updates SSE status
✓ reset() clears all to initial state
✓ Persists configured state to AsyncStorage
✓ Does not persist health/sseStatus
✓ Loads from AsyncStorage on init
✓ Handles AsyncStorage errors gracefully
✓ configure() with empty credentials
```

### 3.4 Permission Store (`/home/omer/dev/gabi/src/stores/permissionStore.ts`)

**Type**: Unit

**Critical Behaviors**:
- upsert() adds new permission or updates existing
- remove() deletes permission by ID
- clear() removes all permissions
- Maintains pending array

**Edge Cases**:
- upsert() with duplicate ID (should update)
- remove() with non-existent ID (should be safe)
- clear() when already empty
- Multiple rapid updates

**Test File**: `/home/omer/dev/gabi/src/stores/__tests__/permissionStore.test.ts`

**Test Cases**:
```
✓ upsert() adds new permission
✓ upsert() updates existing permission
✓ remove() deletes permission
✓ remove() is safe with non-existent ID
✓ clear() removes all permissions
✓ Store maintains immutability
```

### 3.5 Question Store (`/home/omer/dev/gabi/src/stores/questionStore.ts`)

**Type**: Unit

**Critical Behaviors**:
- upsert() adds new question or updates existing
- remove() deletes question by ID
- clear() removes all questions
- Maintains pending array

**Edge Cases**:
- upsert() with duplicate ID (should update)
- remove() with non-existent ID (should be safe)
- clear() when already empty

**Test File**: `/home/omer/dev/gabi/src/stores/__tests__/questionStore.test.ts`

**Test Cases**:
```
✓ upsert() adds new question
✓ upsert() updates existing question
✓ remove() deletes question
✓ remove() is safe with non-existent ID
✓ clear() removes all questions
```

### 3.6 Project Store (`/home/omer/dev/gabi/src/stores/projectStore.ts`)

**Type**: Unit + Integration (AsyncStorage)

**Critical Behaviors**:
- addProject() creates new project with unique ID and timestamp
- removeProject() deletes project and clears activeProjectId if needed
- setActiveProject() sets active project ID
- getProjectById() retrieves project by ID
- Persists to AsyncStorage
- Generates unique IDs (crypto.randomUUID or fallback)

**Edge Cases**:
- addProject() with empty name/directory
- addProject() with special characters
- removeProject() when it's the active project
- removeProject() when it's not active
- getProjectById() with non-existent ID
- ID generation without crypto.randomUUID
- AsyncStorage unavailable

**Test File**: `/home/omer/dev/gabi/src/stores/__tests__/projectStore.test.ts`

**Test Cases**:
```
✓ addProject() creates project with unique ID
✓ addProject() sets addedAt timestamp
✓ addProject() returns created project
✓ removeProject() deletes project
✓ removeProject() clears activeProjectId if removed
✓ removeProject() preserves activeProjectId if different
✓ setActiveProject() sets active project
✓ getProjectById() retrieves project
✓ getProjectById() returns undefined for non-existent
✓ Persists to AsyncStorage
✓ ID generation works without crypto.randomUUID
```

### 3.7 Preferences Store (`/home/omer/dev/gabi/src/stores/preferencesStore.ts`)

**Type**: Unit + Integration (AsyncStorage)

**Critical Behaviors**:
- All setters update their respective boolean/enum values
- Persists to AsyncStorage
- Initializes with sensible defaults
- colorScheme can be "system", "light", or "dark"

**Edge Cases**:
- setColorScheme() with invalid value
- AsyncStorage unavailable
- Corrupted AsyncStorage data

**Test File**: `/home/omer/dev/gabi/src/stores/__tests__/preferencesStore.test.ts`

**Test Cases**:
```
✓ setShowReasoning() toggles reasoning display
✓ setShowToolCalls() toggles tool calls display
✓ setShowStepMarkers() toggles step markers
✓ setShowFileParts() toggles file parts
✓ setCollapseToolGroups() toggles collapse
✓ setColorScheme() sets color scheme
✓ Persists to AsyncStorage
✓ Initializes with defaults
```

---

## 4. TRANSCRIPT PROCESSING PIPELINE

### 4.1 Process Messages (`/home/omer/dev/gabi/src/transcript/processMessages.ts`)

**Type**: Unit

**Critical Behaviors**:
- Hydrates messages with their parts
- Sorts messages by creation time (ascending)
- Handles missing parts gracefully
- Returns HydratedMessage array

**Edge Cases**:
- Empty messages array
- Message with no parts
- Message with multiple parts
- Messages out of order (should sort)
- Duplicate message IDs
- Parts for non-existent message (should be ignored)
- Null/undefined timestamps

**Test File**: `/home/omer/dev/gabi/src/transcript/__tests__/processMessages.test.ts`

**Test Cases**:
```
✓ processMessages hydrates messages with parts
✓ processMessages sorts by creation time
✓ processMessages handles missing parts
✓ processMessages handles empty array
✓ processMessages handles message with no parts
✓ processMessages handles out-of-order messages
✓ processMessages ignores parts for non-existent messages
```

### 4.2 Group Messages (`/home/omer/dev/gabi/src/transcript/groupMessages.ts`)

**Type**: Unit

**Critical Behaviors**:
- Groups consecutive tool parts together
- Creates tool-group when 2+ consecutive tools
- Single tools rendered as individual parts
- Non-tool parts flush tool buffer
- Maintains part order

**Edge Cases**:
- Empty parts array
- Single tool part (should not group)
- Two consecutive tool parts (should group)
- Tool parts separated by non-tool (should not group)
- All tool parts (should group)
- All non-tool parts (should not group)
- Mixed order

**Test File**: `/home/omer/dev/gabi/src/transcript/__tests__/groupMessages.test.ts`

**Test Cases**:
```
✓ groupParts groups 2+ consecutive tools
✓ groupParts renders single tool as part
✓ groupParts flushes buffer on non-tool
✓ groupParts handles empty array
✓ groupParts maintains order
✓ groupParts handles all tools
✓ groupParts handles all non-tools
```

### 4.3 Tool Normalize (`/home/omer/dev/gabi/src/transcript/toolNormalize.ts`)

**Type**: Unit

**Critical Behaviors**:
- normalizeToolName() maps tool names to standard kinds
- Handles exact matches (read, write, bash, grep, etc.)
- Handles partial matches (read_file → read)
- Returns "other" for unknown tools
- Case-insensitive matching
- summarizeToolGroup() counts tools by kind
- Generates human-readable summary

**Edge Cases**:
- Unknown tool name
- Tool name with mixed case
- Tool name with underscores
- Empty tool name
- Tool name with special characters
- Empty tool group
- Single tool in group
- Multiple same tools in group

**Test File**: `/home/omer/dev/gabi/src/transcript/__tests__/toolNormalize.test.ts`

**Test Cases**:
```
✓ normalizeToolName maps exact matches
✓ normalizeToolName maps partial matches
✓ normalizeToolName is case-insensitive
✓ normalizeToolName returns "other" for unknown
✓ summarizeToolGroup counts by kind
✓ summarizeToolGroup generates readable summary
✓ summarizeToolGroup handles single tool
✓ summarizeToolGroup handles multiple same tools
✓ summarizeToolGroup sorts by count descending
```

---

## 5. REACT HOOKS

### 5.1 useClient (`/home/omer/dev/gabi/src/hooks/useClient.ts`)

**Type**: Unit (with mocked store)

**Critical Behaviors**:
- Returns null when not configured
- Returns null when baseUrl missing
- Returns OpencodeClient when configured
- Memoizes client (same reference on re-render)
- Updates when credentials change

**Edge Cases**:
- isConfigured=true but baseUrl empty
- isConfigured=false (should return null)
- Credentials change (should create new client)
- Multiple re-renders without changes (should memoize)

**Test File**: `/home/omer/dev/gabi/src/hooks/__tests__/useClient.test.ts`

**Test Cases**:
```
✓ useClient returns null when not configured
✓ useClient returns null when baseUrl missing
✓ useClient returns client when configured
✓ useClient memoizes client
✓ useClient updates on credential change
```

### 5.2 useSSE (`/home/omer/dev/gabi/src/hooks/useSSE.ts`)

**Type**: Integration

**Critical Behaviors**:
- Creates SSEManager on mount
- Starts SSEManager
- Stops SSEManager on unmount
- Routes events to appropriate stores
- Handles all event types (message, session, permission, question)
- Updates connection status
- Cleans up on unmount

**Event Routing**:
- message.part.updated → upsertPart
- message.part.removed → removePart
- message.updated → upsertMessage
- message.removed → removeMessage
- session.status (busy) → setStreaming
- session.status (idle) → setStreaming(null)
- session.idle → setStreaming(null)
- permission.asked → upsertPermission
- permission.replied → removePermission
- question.asked → upsertQuestion

**Edge Cases**:
- client is null (should not create manager)
- directory is null (should not create manager)
- Both client and directory provided (should create manager)
- Unmount before manager starts
- Multiple rapid mounts/unmounts
- Event with invalid structure
- Unknown event type (should be ignored)

**Test File**: `/home/omer/dev/gabi/src/hooks/__tests__/useSSE.test.ts`

**Test Cases**:
```
✓ useSSE creates SSEManager when client and directory provided
✓ useSSE starts manager on mount
✓ useSSE stops manager on unmount
✓ useSSE routes message.part.updated
✓ useSSE routes message.part.removed
✓ useSSE routes message.updated
✓ useSSE routes message.removed
✓ useSSE routes session.status busy
✓ useSSE routes session.status idle
✓ useSSE routes session.idle
✓ useSSE routes permission.asked
✓ useSSE routes permission.replied
✓ useSSE routes question.asked
✓ useSSE does not create manager when client null
✓ useSSE does not create manager when directory null
✓ useSSE cleans up on unmount
```

### 5.3 useSendMessage (`/home/omer/dev/gabi/src/hooks/useSendMessage.ts`)

**Type**: Unit (with mocked client)

**Critical Behaviors**:
- send() calls client.session.prompt with correct params
- send() trims text before sending
- send() does nothing if text empty
- send() does nothing if client null
- send() does nothing if sessionId null
- abort() calls client.session.abort
- abort() does nothing if client null
- abort() does nothing if sessionId null
- isStreaming reflects streamingSessionId match
- Returns memoized callbacks

**Edge Cases**:
- send() with whitespace-only text
- send() with very long text
- send() while already streaming
- abort() when not streaming
- Multiple rapid send() calls
- send() then abort() in sequence
- sessionId changes during send()

**Test File**: `/home/omer/dev/gabi/src/hooks/__tests__/useSendMessage.test.ts`

**Test Cases**:
```
✓ useSendMessage.send() calls client.session.prompt
✓ useSendMessage.send() trims text
✓ useSendMessage.send() does nothing if text empty
✓ useSendMessage.send() does nothing if client null
✓ useSendMessage.send() does nothing if sessionId null
✓ useSendMessage.abort() calls client.session.abort
✓ useSendMessage.abort() does nothing if client null
✓ useSendMessage.abort() does nothing if sessionId null
✓ useSendMessage.isStreaming reflects streaming state
✓ useSendMessage returns memoized callbacks
```

### 5.4 useMessages (`/home/omer/dev/gabi/src/hooks/useMessages.ts`)

**Type**: Unit (with mocked store)

**Critical Behaviors**:
- Returns empty array when sessionId null
- Returns processed and grouped messages
- Memoizes result (same reference on re-render)
- Updates when messages change
- Updates when parts change
- Calls processMessages and groupParts

**Edge Cases**:
- sessionId null (should return [])
- sessionId changes (should update)
- Messages added (should update)
- Parts added (should update)
- Multiple re-renders without changes (should memoize)

**Test File**: `/home/omer/dev/gabi/src/hooks/__tests__/useMessages.test.ts`

**Test Cases**:
```
✓ useMessages returns empty array when sessionId null
✓ useMessages returns processed messages
✓ useMessages groups parts correctly
✓ useMessages memoizes result
✓ useMessages updates on message change
✓ useMessages updates on part change
✓ useMessages updates on sessionId change
```

### 5.5 useSessions (`/home/omer/dev/gabi/src/hooks/useSessions.ts`)

**Type**: Integration

**Critical Behaviors**:
- Fetches sessions on mount
- Sets loading state during fetch
- Returns sessions for directory
- createSession() calls client.session.create
- deleteSession() calls client.session.delete and updates store
- selectSession() sets active session
- Cancels fetch on unmount
- Returns memoized callbacks

**Edge Cases**:
- client null (should not fetch)
- directory null (should not fetch)
- Fetch fails (should handle gracefully)
- Unmount during fetch (should cancel)
- createSession() returns null
- createSession() returns object without id
- deleteSession() with non-existent ID
- Multiple rapid createSession() calls

**Test File**: `/home/omer/dev/gabi/src/hooks/__tests__/useSessions.test.ts`

**Test Cases**:
```
✓ useSessions fetches sessions on mount
✓ useSessions sets loading state
✓ useSessions returns sessions for directory
✓ useSessions.createSession() creates session
✓ useSessions.createSession() navigates on success
✓ useSessions.createSession() returns null on failure
✓ useSessions.deleteSession() deletes session
✓ useSessions.deleteSession() updates store
✓ useSessions.selectSession() sets active session
✓ useSessions cancels fetch on unmount
✓ useSessions does not fetch when client null
✓ useSessions does not fetch when directory null
```

### 5.6 useQuestions (`/home/omer/dev/gabi/src/hooks/useQuestions.ts`)

**Type**: Unit (with mocked client)

**Critical Behaviors**:
- reply() calls client.question.reply
- reply() removes question from store
- reject() calls client.question.reject
- reject() removes question from store
- Returns pending questions from store
- Returns memoized callbacks

**Edge Cases**:
- reply() with client null
- reject() with client null
- reply() with invalid answers format
- Multiple rapid reply() calls
- reply() then reject() on same question

**Test File**: `/home/omer/dev/gabi/src/hooks/__tests__/useQuestions.test.ts`

**Test Cases**:
```
✓ useQuestions.reply() calls client.question.reply
✓ useQuestions.reply() removes question
✓ useQuestions.reply() does nothing if client null
✓ useQuestions.reject() calls client.question.reject
✓ useQuestions.reject() removes question
✓ useQuestions.reject() does nothing if client null
✓ useQuestions returns pending questions
✓ useQuestions returns memoized callbacks
```

### 5.7 usePermissions (`/home/omer/dev/gabi/src/hooks/usePermissions.ts`)

**Type**: Unit (with mocked client)

**Critical Behaviors**:
- reply() calls client.permission.reply with "once" or "reject"
- reply() removes permission from store
- Returns pending permissions from store
- Returns memoized callback

**Edge Cases**:
- reply() with client null
- reply(id, true) sends "once"
- reply(id, false) sends "reject"
- Multiple rapid reply() calls

**Test File**: `/home/omer/dev/gabi/src/hooks/__tests__/usePermissions.test.ts`

**Test Cases**:
```
✓ usePermissions.reply() calls client.permission.reply
✓ usePermissions.reply() sends "once" when allow=true
✓ usePermissions.reply() sends "reject" when allow=false
✓ usePermissions.reply() removes permission
✓ usePermissions.reply() does nothing if client null
✓ usePermissions returns pending permissions
✓ usePermissions returns memoized callback
```

---

## 6. SETUP FLOW

### 6.1 Setup Screen (`/home/omer/dev/gabi/app/setup.tsx`)

**Type**: Integration + E2E

**Critical Behaviors**:
- Renders URL, username, password inputs
- handleConnect() validates inputs
- handleConnect() calls buildClient
- handleConnect() calls client.global.health()
- handleConnect() calls configure() on success
- handleConnect() navigates to /(app) on success
- handleConnect() shows error on failure
- Loading state during connection
- Connect button disabled when URL empty
- Connect button disabled when loading

**Edge Cases**:
- Empty URL (button disabled)
- Invalid URL format
- Server unreachable
- Server returns error
- Network timeout
- Empty username/password (should work)
- Special characters in credentials
- Very long inputs
- Rapid connect attempts

**Test File**: `/home/omer/dev/gabi/app/__tests__/setup.test.tsx`

**Test Cases**:
```
✓ Setup screen renders inputs
✓ Setup screen disables connect when URL empty
✓ Setup screen disables connect when loading
✓ handleConnect validates URL
✓ handleConnect calls client.global.health()
✓ handleConnect calls configure() on success
✓ handleConnect navigates on success
✓ handleConnect shows error on failure
✓ handleConnect handles network errors
✓ handleConnect handles server errors
✓ Setup screen accepts empty credentials
```

---

## 7. SETTINGS FLOW

### 7.1 Settings Screen (`/home/omer/dev/gabi/app/settings.tsx`)

**Type**: Integration

**Critical Behaviors**:
- Displays all preference toggles
- Displays color scheme selector
- Displays current connection URL
- handleDisconnect() calls reset()
- handleDisconnect() navigates to /setup
- Preference changes update store
- Color scheme changes update store
- Back button navigates back

**Edge Cases**:
- Disconnect while SSE connected
- Rapid preference changes
- Color scheme change during streaming
- Settings accessed without connection

**Test File**: `/home/omer/dev/gabi/app/__tests__/settings.test.tsx`

**Test Cases**:
```
✓ Settings screen renders all toggles
✓ Settings screen renders color scheme selector
✓ Settings screen displays connection URL
✓ Preference toggles update store
✓ Color scheme selector updates store
✓ handleDisconnect calls reset()
✓ handleDisconnect navigates to setup
✓ Back button navigates back
```

---

## 8. PROJECT & SESSION FLOWS

### 8.1 Project Sidebar (`/home/omer/dev/gabi/src/components/project/ProjectSidebar.tsx`)

**Type**: Integration

**Critical Behaviors**:
- Displays all projects
- Highlights active project
- handleAdd() creates project
- handleAdd() sets as active
- handleAdd() clears form
- Long press shows delete alert
- Delete removes project
- SSE status indicator shows connection state
- Settings button navigates to settings
- Add project form shows/hides

**Edge Cases**:
- Add with empty name (should not add)
- Add with empty directory (should not add)
- Delete active project (should clear active)
- Delete non-active project (should keep active)
- No projects (should show add button)
- Many projects (should scroll)
- Special characters in name/directory

**Test File**: `/home/omer/dev/gabi/src/components/project/__tests__/ProjectSidebar.test.tsx`

**Test Cases**:
```
✓ ProjectSidebar displays projects
✓ ProjectSidebar highlights active project
✓ ProjectSidebar.handleAdd() creates project
✓ ProjectSidebar.handleAdd() sets as active
✓ ProjectSidebar.handleAdd() clears form
✓ ProjectSidebar.handleAdd() validates inputs
✓ ProjectSidebar delete removes project
✓ ProjectSidebar delete clears active if needed
✓ ProjectSidebar shows SSE status
✓ ProjectSidebar settings button works
✓ ProjectSidebar add form shows/hides
```

### 8.2 Session List (`/home/omer/dev/gabi/src/components/session/SessionList.tsx`)

**Type**: Integration

**Critical Behaviors**:
- Displays sessions for directory
- handleCreate() creates new session
- handleCreate() navigates to session
- handleCreate() selects session
- Delete removes session
- Loading state during fetch
- New session button always visible
- Sessions clickable to navigate

**Edge Cases**:
- No sessions (should show new button)
- Create returns null
- Create returns object without id
- Delete during streaming
- Navigate to non-existent session
- Multiple rapid creates

**Test File**: `/home/omer/dev/gabi/src/components/session/__tests__/SessionList.test.tsx`

**Test Cases**:
```
✓ SessionList displays sessions
✓ SessionList shows loading state
✓ SessionList.handleCreate() creates session
✓ SessionList.handleCreate() navigates
✓ SessionList.handleCreate() selects session
✓ SessionList delete removes session
✓ SessionList shows new session button
✓ SessionList handles create failure
✓ SessionList handles empty sessions
```

---

## 9. CHAT RENDERING

### 9.1 Message List (`/home/omer/dev/gabi/src/components/chat/MessageList.tsx`)

**Type**: Unit + Integration

**Critical Behaviors**:
- Renders messages in order
- Auto-scrolls to end on new message
- Auto-scrolls on streaming state change
- Uses FlatList for performance
- Renders MessageBubble for each message
- Handles empty message list

**Edge Cases**:
- Empty messages array
- Single message
- Many messages (performance)
- Rapid message additions
- Scroll during streaming
- Scroll when list empty

**Test File**: `/home/omer/dev/gabi/src/components/chat/__tests__/MessageList.test.tsx`

**Test Cases**:
```
✓ MessageList renders messages
✓ MessageList auto-scrolls to end
✓ MessageList auto-scrolls on streaming change
✓ MessageList handles empty list
✓ MessageList renders MessageBubble for each
✓ MessageList maintains order
```

### 9.2 Chat Input (`/home/omer/dev/gabi/src/components/chat/ChatInput.tsx`)

**Type**: Unit + Integration

**Critical Behaviors**:
- Renders text input
- Renders send button when not streaming
- Renders stop button when streaming
- handleSend() trims and sends text
- handleSend() clears input
- handleSend() disabled when streaming
- handleSend() disabled when text empty
- handleKeyPress() sends on Enter (web)
- onAbort() called when stop pressed
- Input disabled when disabled prop true

**Edge Cases**:
- Send with whitespace-only text
- Send while streaming (should be disabled)
- Send with empty text (button disabled)
- Rapid send attempts
- Very long text
- Multiline text
- Enter key on mobile (should not send)
- Enter key on web (should send)

**Test File**: `/home/omer/dev/gabi/src/components/chat/__tests__/ChatInput.test.tsx`

**Test Cases**:
```
✓ ChatInput renders text input
✓ ChatInput renders send button when not streaming
✓ ChatInput renders stop button when streaming
✓ ChatInput.handleSend() sends text
✓ ChatInput.handleSend() trims text
✓ ChatInput.handleSend() clears input
✓ ChatInput.handleSend() disabled when streaming
✓ ChatInput.handleSend() disabled when text empty
✓ ChatInput.handleKeyPress() sends on Enter (web)
✓ ChatInput.handleKeyPress() ignores Enter (mobile)
✓ ChatInput.onAbort() called on stop
✓ ChatInput respects disabled prop
```

### 9.3 Part Renderer (`/home/omer/dev/gabi/src/components/chat/PartRenderer.tsx`)

**Type**: Unit

**Critical Behaviors**:
- Renders text parts as text
- Renders reasoning parts conditionally (showReasoning)
- Renders tool parts conditionally (showToolCalls)
- Renders file parts conditionally (showFileParts)
- Renders step markers conditionally (showStepMarkers)
- Renders subtask parts
- Returns null for unknown parts
- Respects all preference flags

**Edge Cases**:
- All preferences disabled (should render nothing)
- All preferences enabled (should render all)
- Part with missing data
- Unknown part type
- Null/undefined part properties

**Test File**: `/home/omer/dev/gabi/src/components/chat/__tests__/PartRenderer.test.tsx`

**Test Cases**:
```
✓ PartRenderer renders text parts
✓ PartRenderer renders reasoning when enabled
✓ PartRenderer hides reasoning when disabled
✓ PartRenderer renders tool when enabled
✓ PartRenderer hides tool when disabled
✓ PartRenderer renders file when enabled
✓ PartRenderer hides file when disabled
✓ PartRenderer renders step markers when enabled
✓ PartRenderer hides step markers when disabled
✓ PartRenderer renders subtask parts
✓ PartRenderer returns null for unknown parts
✓ PartRenderer respects all preferences
```

---

## 10. FILE TREE

### 10.1 File Tree (`/home/omer/dev/gabi/src/components/file-tree/FileTree.tsx`)

**Type**: Integration

**Critical Behaviors**:
- Fetches files on mount
- Builds tree structure from flat paths
- Fetches git status
- Shows loading state
- Shows empty state when no files
- Renders FileTreeNode for each file
- Sorts directories before files
- Sorts alphabetically within type
- Handles fetch errors gracefully

**Edge Cases**:
- Empty file list
- Single file
- Deeply nested files
- Files with special characters
- Git status fetch fails (should continue)
- File fetch fails (should show empty)
- No client provided
- No directory provided
- Rapid re-mounts

**Test File**: `/home/omer/dev/gabi/src/components/file-tree/__tests__/FileTree.test.tsx`

**Test Cases**:
```
✓ FileTree fetches files on mount
✓ FileTree builds tree structure
✓ FileTree fetches git status
✓ FileTree shows loading state
✓ FileTree shows empty state
✓ FileTree renders FileTreeNode
✓ FileTree sorts directories first
✓ FileTree sorts alphabetically
✓ FileTree handles fetch errors
✓ FileTree handles git status errors
✓ FileTree does not fetch when client null
✓ FileTree does not fetch when directory empty
```

---

## 11. CHAT SCREEN (INTEGRATION)

### 11.1 Chat Screen (`/home/omer/dev/gabi/app/(app)/[sessionId]/index.tsx`)

**Type**: Integration + E2E

**Critical Behaviors**:
- Gets sessionId from route params
- Gets active project directory
- Initializes SSE with client and directory
- Loads messages for session
- Renders MessageList and ChatInput
- Sends messages via useSendMessage
- Aborts messages via useSendMessage
- Keyboard avoiding on iOS
- Disables input when no client

**Edge Cases**:
- No sessionId in params
- No active project
- Client not configured
- Directory empty
- Streaming state changes
- Session changes
- Project changes

**Test File**: `/home/omer/dev/gabi/app/(app)/__tests__/[sessionId].test.tsx`

**Test Cases**:
```
✓ ChatScreen gets sessionId from params
✓ ChatScreen gets active project directory
✓ ChatScreen initializes SSE
✓ ChatScreen loads messages
✓ ChatScreen renders MessageList
✓ ChatScreen renders ChatInput
✓ ChatScreen sends messages
✓ ChatScreen aborts messages
✓ ChatScreen disables input when no client
✓ ChatScreen handles missing sessionId
✓ ChatScreen handles missing project
```

---

## 12. MAIN LAYOUT (INTEGRATION)

### 12.1 App Layout (`/home/omer/dev/gabi/app/(app)/_layout.tsx`)

**Type**: Integration

**Critical Behaviors**:
- Renders ProjectSidebar
- Renders chat screen
- Manages navigation
- Handles deep linking
- Persists state across navigation

**Edge Cases**:
- Deep link to non-existent session
- Deep link to non-existent project
- Navigation while streaming
- Navigation while loading

**Test File**: `/home/omer/dev/gabi/app/(app)/__tests__/_layout.test.tsx`

**Test Cases**:
```
✓ AppLayout renders ProjectSidebar
✓ AppLayout renders chat screen
✓ AppLayout handles navigation
✓ AppLayout handles deep linking
✓ AppLayout persists state
```

---

## Summary Statistics

| Category | Count | Type |
|----------|-------|------|
| Unit Tests | 45+ | Stores, Hooks, Utils |
| Integration Tests | 25+ | Hooks, Components, Screens |
| E2E Tests | 5+ | Full flows |
| **Total Test Cases** | **75+** | |

---

## Test Execution Strategy

### Phase 1: Foundation (Week 1)
- All store tests (unit)
- Transcript processing tests (unit)
- Tool normalization tests (unit)

### Phase 2: Client & Hooks (Week 2)
- Client builder tests (unit)
- SSE Manager tests (unit + integration)
- Hook tests (unit + integration)

### Phase 3: Components (Week 3)
- Chat component tests (unit + integration)
- File tree tests (integration)
- Session/Project tests (integration)

### Phase 4: Flows & E2E (Week 4)
- Setup flow tests (integration + e2e)
- Settings flow tests (integration)
- Chat screen tests (integration + e2e)
- Full app layout tests (integration)

---

## Coverage Goals

- **Stores**: 100% (critical state management)
- **Hooks**: 90%+ (complex logic)
- **Utils**: 100% (transcript processing)
- **Components**: 80%+ (UI rendering)
- **Screens**: 70%+ (integration)
- **Overall**: 85%+

