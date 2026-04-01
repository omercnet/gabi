import { useConnectionStore } from "@/stores/connectionStore";
import { useMessageStore } from "@/stores/messageStore";
import { usePermissionStore } from "@/stores/permissionStore";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { useProjectStore } from "@/stores/projectStore";
import { useQuestionStore } from "@/stores/questionStore";
import { useSessionStore } from "@/stores/sessionStore";
import { resetCounter } from "./factories";

export function resetAllStores(): void {
  resetCounter();

  useConnectionStore.setState({
    baseUrl: "",
    username: "",
    password: "",
    isConfigured: false,
    health: "unknown",
    sseStatus: "disconnected",
  });

  useProjectStore.setState({
    projects: [],
    activeProjectId: null,
  });

  useSessionStore.setState({
    sessionsByDirectory: {},
    loadingByDirectory: {},
    activeSessionId: null,
  });

  useMessageStore.setState({
    messagesBySession: {},
    partsByMessage: {},
    streamingSessionId: null,
    loadingBySession: {},
  });

  usePreferencesStore.setState({
    showReasoning: true,
    showToolCalls: true,
    showStepMarkers: false,
    showFileParts: true,
    collapseToolGroups: true,
    colorScheme: "system",
  });

  usePermissionStore.setState({ pending: [] });
  useQuestionStore.setState({ pending: [] });
}
