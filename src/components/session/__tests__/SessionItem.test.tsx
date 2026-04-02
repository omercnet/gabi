import { fireEvent, render } from "@testing-library/react-native";
import { Alert, Pressable, Text } from "react-native";
import { SessionItem } from "@/components/session/SessionItem";
import { makeSession } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

describe("SessionItem", () => {
  beforeEach(resetAllStores);

  const textValues = (view: ReturnType<typeof render>) =>
    view.UNSAFE_getAllByType(Text).map((node) => String(node.props.children));

  it("renders session title", () => {
    const view = render(
      <SessionItem
        session={makeSession({ title: "My Session" })}
        onPress={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(textValues(view)).toContain("My Session");
  });

  it('renders "Untitled" when no title', () => {
    const view = render(
      <SessionItem session={makeSession({ title: "" })} onPress={jest.fn()} onDelete={jest.fn()} />,
    );
    expect(textValues(view)).toContain("Untitled");
  });

  it("renders formatted date", () => {
    const updatedMs = 1_700_000_000_000;
    const view = render(
      <SessionItem
        session={makeSession({ time: { created: updatedMs, updated: updatedMs } })}
        onPress={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(textValues(view)).toContain(new Date(updatedMs).toLocaleDateString());
  });

  it("renders formatted date from millisecond timestamps (anti-regression for year-58222)", () => {
    const updatedMs = 1_775_000_000_000;
    const expectedYear = new Date(updatedMs).getFullYear();

    const view = render(
      <SessionItem
        session={makeSession({ time: { created: updatedMs, updated: updatedMs } })}
        onPress={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(textValues(view).join(" ")).toContain(String(expectedYear));
    expect(textValues(view).join(" ")).not.toMatch(/5[0-9]{4}/);
    expect(textValues(view).join(" ")).toContain("2026");
  });

  it("onPress called on tap", () => {
    const onPress = jest.fn();
    const view = render(
      <SessionItem
        session={makeSession({ title: "Tap Me" })}
        onPress={onPress}
        onDelete={jest.fn()}
      />,
    );
    fireEvent.press(view.UNSAFE_getByType(Pressable));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("onLongPress triggers Alert (onDelete flow)", () => {
    const onDelete = jest.fn();
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    const view = render(
      <SessionItem
        session={makeSession({ title: "Delete Me" })}
        onPress={jest.fn()}
        onDelete={onDelete}
      />,
    );

    fireEvent(view.UNSAFE_getByType(Pressable), "longPress");
    expect(alertSpy).toHaveBeenCalledTimes(1);

    const buttons = alertSpy.mock.calls[0]?.[2] ?? [];
    const deleteButton = buttons.find((button) => button.text === "Delete");
    deleteButton?.onPress?.();
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
