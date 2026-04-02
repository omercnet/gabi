import { useEffect, useRef, useState } from "react";
import { Animated, Text } from "react-native";
import { useConnectionStore } from "@/stores/connectionStore";

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, visible, onDismiss, duration = 4000 }: ToastProps) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => onDismiss());
      }, duration);

      return () => clearTimeout(timer);
    }
    translateY.setValue(100);
    opacity.setValue(0);
    return undefined;
  }, [visible, duration, onDismiss, translateY, opacity]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{ transform: [{ translateY }], opacity }}
      className="absolute bottom-8 left-4 right-4 z-50 rounded-xl bg-surface px-4 py-3 shadow-lg dark:bg-surface"
    >
      <Text className="text-center font-medium text-foreground text-sm dark:text-foreground">
        {message}
      </Text>
    </Animated.View>
  );
}

export function SSEToast() {
  const sseStatus = useConnectionStore((s) => s.sseStatus);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastDuration, setToastDuration] = useState(4000);
  const prevStatusRef = useRef(sseStatus);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = sseStatus;

    if (sseStatus === "reconnecting" && prev !== "reconnecting") {
      setToastMessage("Reconnecting to OpenCode...");
      setToastDuration(30000);
      setToastVisible(true);
    } else if (sseStatus === "connected" && prev === "reconnecting") {
      setToastMessage("Reconnected!");
      setToastDuration(2000);
      setToastVisible(true);
    }
  }, [sseStatus]);

  return (
    <Toast
      message={toastMessage}
      visible={toastVisible}
      onDismiss={() => setToastVisible(false)}
      duration={toastDuration}
    />
  );
}
