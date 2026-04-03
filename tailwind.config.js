/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--color-background) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          hover: "rgb(var(--color-surface-hover) / <alpha-value>)",
        },
        border: "rgb(var(--color-border) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          foreground: "rgb(var(--color-primary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--color-muted) / <alpha-value>)",
          foreground: "rgb(var(--color-muted-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--color-destructive) / <alpha-value>)",
          foreground: "rgb(var(--color-destructive-foreground) / <alpha-value>)",
        },
        tool: {
          DEFAULT: "rgb(var(--color-tool) / <alpha-value>)",
          foreground: "rgb(var(--color-tool-foreground) / <alpha-value>)",
        },
        reasoning: {
          DEFAULT: "rgb(var(--color-reasoning) / <alpha-value>)",
          foreground: "rgb(var(--color-reasoning-foreground) / <alpha-value>)",
        },
        "user-bubble": {
          DEFAULT: "rgb(var(--color-user-bubble) / <alpha-value>)",
          foreground: "rgb(var(--color-user-bubble-foreground) / <alpha-value>)",
        },
        "assistant-bubble": {
          DEFAULT: "rgb(var(--color-assistant-bubble) / <alpha-value>)",
          foreground: "rgb(var(--color-assistant-bubble-foreground) / <alpha-value>)",
        },
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        error: "rgb(var(--color-error) / <alpha-value>)",
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      fontFamily: {
        sans: ["DMSans_400Regular", "System", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        "sans-medium": ["DMSans_500Medium", "System", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        "sans-bold": ["DMSans_700Bold", "System", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["DMMono_400Regular", "ui-monospace", "SFMono-Regular", "SF Mono", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
