import { Component, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary] caught error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 items-center justify-center gap-3 p-6">
          <Text className="text-4xl">⚠️</Text>
          <Text className="font-semibold text-foreground text-lg dark:text-foreground">
            Something went wrong
          </Text>
          {this.state.error ? (
            <Text className="text-center text-muted text-sm dark:text-muted" numberOfLines={4}>
              {this.state.error.message}
            </Text>
          ) : null}
          <Pressable
            className="mt-2 rounded-lg bg-primary px-6 py-2 dark:bg-primary"
            onPress={this.handleReset}
          >
            <Text className="font-semibold text-primary-foreground text-sm dark:text-primary-foreground">
              Try again
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
