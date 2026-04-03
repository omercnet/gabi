import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { useConnectionStore } from "@/stores/connectionStore";

interface ConnectionStatusProps {
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function ConnectionStatus({ showLabel = false, size = "md" }: ConnectionStatusProps) {
  const sseStatus = useConnectionStore((s) => s.sseStatus);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (sseStatus === "reconnecting") {
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      animationRef.current.start();
    } else {
      animationRef.current?.stop();
      pulseAnim.setValue(1);
    }

    return () => {
      animationRef.current?.stop();
    };
  }, [sseStatus, pulseAnim]);

  const dotSize = size === "sm" ? 8 : 12;

  const dotColorClass =
    sseStatus === "connected"
      ? "bg-success"
      : sseStatus === "reconnecting"
        ? "bg-warning"
        : "bg-error";

  const labelText =
    sseStatus === "connected"
      ? "Connected"
      : sseStatus === "reconnecting"
        ? "Reconnecting..."
        : "Disconnected";

  const labelColorClass =
    sseStatus === "connected"
      ? "text-success"
      : sseStatus === "reconnecting"
        ? "text-warning"
        : "text-error";

  return (
    <View className="flex-row items-center gap-1.5">
      <Animated.View
        style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, opacity: pulseAnim }}
        className={dotColorClass}
      />
      {showLabel ? <Text className={`text-xs ${labelColorClass}`}>{labelText}</Text> : null}
    </View>
  );
}
