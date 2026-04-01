import { Redirect } from "expo-router";
import { useConnectionStore } from "@/stores/connectionStore";

export default function Index() {
  const isConfigured = useConnectionStore((s) => s.isConfigured);

  if (!isConfigured) {
    return <Redirect href="/setup" />;
  }

  return <Redirect href="/(app)" />;
}
