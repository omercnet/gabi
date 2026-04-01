import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Platform, Pressable, TextInput } from "react-native";
import { ChatInput } from "@/components/chat/ChatInput";
import { makeTextPart } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

describe("ChatInput", () => {
  beforeEach(resetAllStores);

  function renderChatInput(overrides: Partial<React.ComponentProps<typeof ChatInput>> = {}) {
    const onSend = jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined);
    const onAbort = jest.fn<Promise<void>, []>().mockResolvedValue(undefined);

    render(
      <ChatInput
        onSend={onSend}
        onAbort={onAbort}
        isStreaming={false}
        disabled={false}
        {...overrides}
      />,
    );

    return { onSend, onAbort };
  }

  it('renders text input with placeholder "Ask anything..."', () => {
    renderChatInput();
    expect(screen.UNSAFE_getByType(TextInput).props.placeholder).toBe("Ask anything...");
  });

  it("renders Send button when not streaming", () => {
    renderChatInput({ isStreaming: false });
    const out = JSON.stringify(screen.toJSON());
    expect(out).toContain("Send");
    expect(out).not.toContain("Stop");
  });

  it("renders Stop button when isStreaming=true", () => {
    renderChatInput({ isStreaming: true });
    const out = JSON.stringify(screen.toJSON());
    expect(out).toContain("Stop");
    expect(out).not.toContain("Send");
  });

  it("Send button calls onSend with text content", async () => {
    const { onSend } = renderChatInput();
    const content = makeTextPart({ text: "hello from factory" }).text;

    fireEvent.changeText(screen.UNSAFE_getByType(TextInput), content);
    fireEvent.press(screen.UNSAFE_getByType(Pressable));

    await waitFor(() => expect(onSend).toHaveBeenCalledWith(content));
  });

  it("input clears after send", async () => {
    const { onSend } = renderChatInput();
    const input = screen.UNSAFE_getByType(TextInput);

    fireEvent.changeText(input, "message to clear");
    fireEvent.press(screen.UNSAFE_getByType(Pressable));

    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.UNSAFE_getByType(TextInput).props.value).toBe(""));
  });

  it("Send button disabled when text is empty", () => {
    renderChatInput();
    expect(screen.UNSAFE_getByType(Pressable).props.disabled).toBe(true);
  });

  it("Send button disabled when disabled=true", () => {
    renderChatInput({ disabled: true });
    expect(screen.UNSAFE_getByType(Pressable).props.disabled).toBe(true);
  });

  it("Send does nothing when text is whitespace only", async () => {
    const { onSend } = renderChatInput();

    fireEvent.changeText(screen.UNSAFE_getByType(TextInput), "   \n\t   ");
    fireEvent.press(screen.UNSAFE_getByType(Pressable));

    await waitFor(() => expect(onSend).not.toHaveBeenCalled());
  });

  it("Stop button calls onAbort", async () => {
    const { onAbort } = renderChatInput({ isStreaming: true });

    fireEvent.press(screen.UNSAFE_getByType(Pressable));
    await waitFor(() => expect(onAbort).toHaveBeenCalledTimes(1));
  });

  it("Enter key triggers send on web (Platform.OS=web)", async () => {
    const originalOS = Platform.OS;
    Platform.OS = "web";
    try {
      const { onSend } = renderChatInput();
      const input = screen.UNSAFE_getByType(TextInput);

      fireEvent.changeText(input, "enter send");
      fireEvent(input, "keyPress", { nativeEvent: { key: "Enter" } });

      await waitFor(() => expect(onSend).toHaveBeenCalledWith("enter send"));
    } finally {
      Platform.OS = originalOS;
    }
  });

  it("multiline input supported", () => {
    renderChatInput();
    expect(screen.UNSAFE_getByType(TextInput).props.multiline).toBe(true);
  });

  it("does not call onSend when isStreaming is true", async () => {
    const originalOS = Platform.OS;
    Platform.OS = "web";
    try {
      const { onSend } = renderChatInput({ isStreaming: true });
      const input = screen.UNSAFE_getByType(TextInput);

      fireEvent.changeText(input, "should not send");
      fireEvent(input, "keyPress", { nativeEvent: { key: "Enter" } });

      await waitFor(() => expect(onSend).not.toHaveBeenCalled());
    } finally {
      Platform.OS = originalOS;
    }
  });
});
