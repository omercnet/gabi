import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import { ActivityIndicator, Alert, Pressable, Text } from "react-native";
import type { OpencodeClient } from "@/client/types";
import { SessionList } from "@/components/session/SessionList";
import { useSessions } from "@/hooks/useSessions";
import { makeSession } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

jest.mock("expo-router");
jest.mock("@/hooks/useSessions", () => ({ useSessions: jest.fn() }));

type UseSessionsResult = ReturnType<typeof useSessions>;

const makeUseSessionsResult = (overrides: Partial<UseSessionsResult> = {}): UseSessionsResult => ({
  sessions: [],
  isLoading: false,
  createSession: jest.fn(async () => null),
  deleteSession: jest.fn(async () => undefined),
  selectSession: jest.fn(),
  ...overrides,
});

describe("SessionList", () => {
  const mockClient = {} as OpencodeClient;
  const mockedUseSessions = jest.mocked(useSessions);

  beforeEach(() => {
    resetAllStores();
    jest.clearAllMocks();
  });

  const textValues = (view: ReturnType<typeof render>) =>
    view.UNSAFE_getAllByType(Text).map((node) => String(node.props.children));

  it("shows loading indicator while fetching", () => {
    mockedUseSessions.mockReturnValue(makeUseSessionsResult({ isLoading: true }));
    const view = render(<SessionList client={mockClient} directory="/repo" />);
    expect(view.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("renders session items after load", () => {
    mockedUseSessions.mockReturnValue(
      makeUseSessionsResult({ sessions: [makeSession({ title: "Session One" })] }),
    );
    const view = render(<SessionList client={mockClient} directory="/repo" />);
    expect(textValues(view)).toContain("Session One");
  });

  it('shows "+ New Session" button', () => {
    mockedUseSessions.mockReturnValue(makeUseSessionsResult());
    const view = render(<SessionList client={mockClient} directory="/repo" />);
    expect(textValues(view)).toContain("+ New Session");
  });

  it("create button calls createSession", async () => {
    const created = makeSession({ id: "created-1" });
    const createSession = jest.fn(async () => created);
    const selectSession = jest.fn();
    mockedUseSessions.mockReturnValue(makeUseSessionsResult({ createSession, selectSession }));
    const view = render(<SessionList client={mockClient} directory="/repo" />);

    const createButton = view.UNSAFE_getAllByType(Pressable).at(-1);
    expect(createButton).toBeDefined();
    fireEvent.press(createButton);

    await waitFor(() => expect(createSession).toHaveBeenCalledTimes(1));
    expect(selectSession).toHaveBeenCalledWith("created-1");
    expect(router.push).toHaveBeenCalledWith("/(app)/created-1");
  });

  it("session item press navigates via router.push", () => {
    const selectSession = jest.fn();
    mockedUseSessions.mockReturnValue(
      makeUseSessionsResult({
        sessions: [makeSession({ id: "s-1", title: "Press Session" })],
        selectSession,
      }),
    );
    const view = render(<SessionList client={mockClient} directory="/repo" />);

    fireEvent.press(view.UNSAFE_getAllByType(Pressable)[0]);
    expect(selectSession).toHaveBeenCalledWith("s-1");
    expect(router.push).toHaveBeenCalledWith("/(app)/s-1");
  });

  it("delete session removes from list", () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    let sessions = [
      makeSession({ id: "s-1", title: "Delete This" }),
      makeSession({ id: "s-2", title: "Keep This" }),
    ];
    const deleteSession = jest.fn(async (id: string) => {
      sessions = sessions.filter((session) => session.id !== id);
    });

    mockedUseSessions.mockImplementation(() => makeUseSessionsResult({ sessions, deleteSession }));
    const view = render(<SessionList client={mockClient} directory="/repo" />);

    fireEvent(view.UNSAFE_getAllByType(Pressable)[0], "longPress");
    const buttons = alertSpy.mock.calls[0]?.[2] ?? [];
    buttons.find((button) => button.text === "Delete")?.onPress?.();

    view.rerender(<SessionList client={mockClient} directory="/repo" />);
    expect(textValues(view)).not.toContain("Delete This");
    expect(textValues(view)).toContain("Keep This");
  });

  it("empty sessions shows just create button", () => {
    mockedUseSessions.mockReturnValue(makeUseSessionsResult({ sessions: [] }));
    const view = render(<SessionList client={mockClient} directory="/repo" />);
    expect(textValues(view)).toEqual(["+ New Session"]);
  });

  it("renders multiple sessions in order", () => {
    mockedUseSessions.mockReturnValue(
      makeUseSessionsResult({
        sessions: [
          makeSession({ title: "First" }),
          makeSession({ title: "Second" }),
          makeSession({ title: "Third" }),
        ],
      }),
    );
    const view = render(<SessionList client={mockClient} directory="/repo" />);
    const joined = textValues(view).join("|");
    expect(joined.indexOf("First")).toBeLessThan(joined.indexOf("Second"));
    expect(joined.indexOf("Second")).toBeLessThan(joined.indexOf("Third"));
  });

  it("loading state transitions correctly", async () => {
    let isLoading = true;
    mockedUseSessions.mockImplementation(() =>
      makeUseSessionsResult({
        isLoading,
        sessions: isLoading ? [] : [makeSession({ title: "Loaded Session" })],
      }),
    );

    const view = render(<SessionList client={mockClient} directory="/repo" />);
    expect(view.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();

    isLoading = false;
    view.rerender(<SessionList client={mockClient} directory="/repo" />);

    await waitFor(() => {
      expect(view.UNSAFE_queryByType(ActivityIndicator)).toBeNull();
      expect(textValues(view)).toContain("Loaded Session");
    });
  });

  it("passes client and directory to useSessions", () => {
    mockedUseSessions.mockReturnValue(makeUseSessionsResult());
    render(<SessionList client={mockClient} directory="/my/repo" />);
    expect(mockedUseSessions).toHaveBeenCalledWith(mockClient, "/my/repo");
  });
});
