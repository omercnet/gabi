import { useCallback, useEffect } from "react";
import type { OpencodeClient, Session } from "@/client/types";
import { useSessionStore } from "@/stores/sessionStore";

const EMPTY_SESSIONS: Session[] = [];

export function useSessions(client: OpencodeClient | null, directory: string | null) {
  const sessions = useSessionStore((s) =>
    directory ? (s.sessionsByDirectory[directory] ?? EMPTY_SESSIONS) : EMPTY_SESSIONS,
  );
  const isLoading = useSessionStore((s) =>
    directory ? (s.loadingByDirectory[directory] ?? false) : false,
  );
  const setSessions = useSessionStore((s) => s.setSessions);
  const setLoading = useSessionStore((s) => s.setLoading);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);

  useEffect(() => {
    if (!(client && directory)) return;

    let cancelled = false;
    setLoading(directory, true);

    client.session.list({ directory }).then((result) => {
      if (cancelled) return;
      if (result.data) {
        const list = Array.isArray(result.data) ? result.data : [];
        setSessions(directory, list);
      }
      setLoading(directory, false);
    });

    return () => {
      cancelled = true;
    };
  }, [client, directory, setSessions, setLoading]);

  const createSession = useCallback(
    async (title?: string) => {
      if (!(client && directory)) return null;
      const result = await client.session.create({
        directory,
        ...(title === undefined ? {} : { title }),
      });
      return result.data ?? null;
    },
    [client, directory],
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      if (!(client && directory)) return;
      await client.session.delete({ sessionID: sessionId, directory });
      useSessionStore.getState().removeSession(directory, sessionId);
    },
    [client, directory],
  );

  const selectSession = useCallback(
    (sessionId: string) => {
      setActiveSession(sessionId);
    },
    [setActiveSession],
  );

  return { sessions, isLoading, createSession, deleteSession, selectSession };
}
