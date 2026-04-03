import { EmptyState } from "@/components/shared";

export default function NoSessionScreen() {
  return (
    <EmptyState
      iconName="message-square"
      title="No session selected"
      subtitle="Choose a session from the sidebar or create a new one"
    />
  );
}
