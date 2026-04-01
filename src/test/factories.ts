import type {
  FilePart,
  Message,
  Part,
  PermissionRequest,
  QuestionRequest,
  ReasoningPart,
  Session,
  TextPart,
  ToolPart,
} from "@/client/types";
import type { GabiProject } from "@/stores/projectStore";

let counter = 0;
function uid(): string {
  return `test-${++counter}`;
}

export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: uid(),
    title: "Test Session",
    projectID: "proj-1",
    time: { created: Date.now() / 1000, updated: Date.now() / 1000 },
    ...overrides,
  } as Session;
}

export function makeUserMessage(overrides: Partial<Record<string, unknown>> = {}): Message {
  return {
    id: uid(),
    sessionID: "ses-1",
    role: "user",
    time: { created: Date.now() / 1000 },
    agent: "",
    model: { providerID: "", modelID: "" },
    ...overrides,
  } as unknown as Message;
}

export function makeAssistantMessage(overrides: Partial<Record<string, unknown>> = {}): Message {
  return {
    id: uid(),
    sessionID: "ses-1",
    role: "assistant",
    parts: [],
    time: { created: Date.now() / 1000 },
    parentID: "",
    modelID: "",
    providerID: "",
    mode: "",
    agent: "",
    path: { cwd: "" },
    ...overrides,
  } as unknown as Message;
}

export function makeTextPart(overrides: Partial<TextPart> = {}): TextPart {
  return {
    id: uid(),
    sessionID: "ses-1",
    messageID: "msg-1",
    type: "text",
    text: "Hello world",
    ...overrides,
  } as TextPart;
}

export function makeToolPart(overrides: Partial<ToolPart> = {}): ToolPart {
  return {
    id: uid(),
    sessionID: "ses-1",
    messageID: "msg-1",
    type: "tool",
    callID: uid(),
    tool: "read_file",
    state: {
      status: "completed",
      input: {},
      output: "file content",
      title: "Read",
      metadata: {},
      time: { start: 1, end: 2 },
    },
    ...overrides,
  } as ToolPart;
}

export function makeReasoningPart(overrides: Partial<ReasoningPart> = {}): ReasoningPart {
  return {
    id: uid(),
    sessionID: "ses-1",
    messageID: "msg-1",
    type: "reasoning",
    text: "Let me think...",
    time: { start: 1 },
    ...overrides,
  } as ReasoningPart;
}

export function makeFilePart(overrides: Partial<FilePart> = {}): FilePart {
  return {
    id: uid(),
    sessionID: "ses-1",
    messageID: "msg-1",
    type: "file",
    mime: "text/plain",
    url: "file:///test.txt",
    filename: "test.txt",
    ...overrides,
  } as FilePart;
}

export function makeProject(overrides: Partial<GabiProject> = {}): GabiProject {
  return {
    id: uid(),
    name: "Test Project",
    directory: "/home/test/project",
    addedAt: Date.now(),
    ...overrides,
  };
}

export function makePermissionRequest(
  overrides: Partial<PermissionRequest> = {},
): PermissionRequest {
  return {
    id: uid(),
    sessionID: "ses-1",
    permission: "file.write",
    patterns: ["*.ts"],
    metadata: {},
    always: [],
    ...overrides,
  };
}

export function makeQuestionRequest(overrides: Partial<QuestionRequest> = {}): QuestionRequest {
  return {
    id: uid(),
    sessionID: "ses-1",
    questions: [
      {
        question: "Which option?",
        header: "Choice",
        options: [{ label: "A", description: "Option A" }],
      },
    ],
    ...overrides,
  };
}

export function resetCounter(): void {
  counter = 0;
}
