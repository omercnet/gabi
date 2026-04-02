import { useEffect, useRef } from "react";
import { Animated, type DimensionValue, View } from "react-native";

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  rounded?: boolean;
  className?: string;
}

export function Skeleton({ width, height = 16, rounded = false, className = "" }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const borderRadiusStyle = rounded ? { borderRadius: height / 2 } : { borderRadius: 4 };
  const sizeStyle = {
    ...(width === undefined ? {} : { width }),
    height,
  };

  return (
    <Animated.View
      style={[sizeStyle, borderRadiusStyle, { opacity }]}
      className={`bg-surface-hover dark:bg-surface-hover ${className}`}
    />
  );
}

export function SessionSkeleton() {
  return (
    <View className="gap-3 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <View key={i} className="flex-row items-center gap-3">
          <Skeleton width={36} height={36} rounded={true} className="flex-shrink-0" />
          <View className="flex-1 gap-1.5">
            <Skeleton height={14} className="w-3/4" />
            <Skeleton height={12} className="w-1/2" />
          </View>
        </View>
      ))}
    </View>
  );
}

export function MessageSkeleton() {
  return (
    <View className="gap-3 px-4 py-3">
      <View className="items-end">
        <Skeleton width={180} height={40} rounded={false} className="rounded-2xl" />
      </View>
      <View className="items-start">
        <Skeleton width={260} height={60} rounded={false} className="rounded-2xl" />
      </View>
    </View>
  );
}
