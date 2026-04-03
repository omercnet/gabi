# Library Reference: Reanimated, NativeWind v4, Expo Fonts, Vector Icons

> Generated: 2026-04-03
> Sources: official docs (swmansion, nativewind.dev, docs.expo.dev, github.com/expo/google-fonts)

---

## 1. react-native-reanimated (v3 / v4) + Expo

### v3 vs v4 note
Reanimated **4.x** requires **New Architecture (Fabric)**. Pin to **v3** for old arch projects.
v4 splits the Babel plugin into a separate `react-native-worklets` package.

### babel.config.js — plugin MUST be last

v3 (old arch / pre-SDK 50):
```js
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    // other plugins...
    'react-native-reanimated/plugin', // MUST be last
  ],
};
```

v4 / worklets (SDK 50+):
```js
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    '@babel/plugin-proposal-export-namespace-from', // web only — before worklets
    'react-native-worklets/plugin', // MUST be last
  ],
};
```
Source: https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started

### app.json plugins

```json
{
  "expo": {
    "plugins": [
      "react-native-gesture-handler"
    ]
  }
}
```

### FadeInUp entering animation on Animated.View

```tsx
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';

export function AnimatedCard() {
  return (
    <Animated.View
      entering={FadeInUp.duration(400)}
      exiting={FadeOut.duration(200)}
    >
      {/* content */}
    </Animated.View>
  );
}

// With spring physics modifier:
<Animated.View entering={FadeInUp.springify().damping(14).mass(0.8)}>
```

Available variants: FadeIn, FadeInUp, FadeInDown, FadeInLeft, FadeInRight

Source: https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/entering-exiting-animations

### withSpring / withTiming — dots / pagination animation

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

function PaginationDot({ index, activeIndex }: { index: number; activeIndex: number }) {
  const isActive = index === activeIndex;
  const scale = useSharedValue(isActive ? 1.4 : 1);
  const opacity = useSharedValue(isActive ? 1 : 0.4);

  useEffect(() => {
    // withSpring: physics-based bounce
    scale.value = withSpring(isActive ? 1.4 : 1, { damping: 10, stiffness: 100 });
    // withTiming: linear/eased over fixed duration
    opacity.value = withTiming(isActive ? 1 : 0.4, { duration: 200 });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}
```

Source: https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring

### GestureHandlerRootView wrapping

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* entire app tree */}
    </GestureHandlerRootView>
  );
}
```

Must wrap the **entire app root**, not just screens that use gestures.
Source: https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/handling-gestures

---

## 2. NativeWind v4

### cssInterop — @expo/vector-icons and other third-party components

```tsx
// lib/icons.ts — register ONCE at module level, import from here throughout app
import { cssInterop } from 'nativewind';
import FeatherBase from '@expo/vector-icons/Feather';

cssInterop(FeatherBase, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      color: true, // text-* className sets the icon color prop
    },
  },
});

export const Feather = FeatherBase;
```

Usage:
```tsx
import { Feather } from '@/lib/icons';
<Feather name="menu" size={24} className="text-foreground" />
```

Simple variant (just passes style object, no prop remapping):
```tsx
cssInterop(SomeComponent, { className: 'style' });
```

Source: https://www.nativewind.dev/docs/guides/third-party-components
Source: https://www.nativewind.dev/docs/api/css-interop

### tailwind.config.js — fontFamily for custom fonts

```js
const { platformSelect } = require('nativewind/theme');

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Key = Tailwind class suffix: font-sans, font-mono, font-sans-bold
        sans: ['DMSans_400Regular'],
        'sans-medium': ['DMSans_500Medium'],
        'sans-bold': ['DMSans_700Bold'],
        mono: ['DMMono_400Regular'],
        'mono-medium': ['DMMono_500Medium'],
        // Platform-specific fallback example
        system: platformSelect({
          ios: 'San Francisco',
          android: 'Roboto',
          default: 'ui-sans-serif',
        }),
      },
    },
  },
  plugins: [],
};
```

Source: https://www.nativewind.dev/docs/tailwind/typography/font-family

### dark: redundancy with CSS variable tokens

When colors are defined as CSS variables, `dark:` prefix is NOT needed — the variable
values switch automatically when dark mode is active:

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // NativeWind maps this to native Appearance API
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        primary:    'rgb(var(--color-primary) / <alpha-value>)',
      },
    },
  },
  plugins: [
    ({ addBase }) =>
      addBase({
        ':root': {
          '--color-background': '255 255 255',
          '--color-foreground': '10 10 10',
          '--color-primary': '59 130 246',
        },
        '.dark': {
          '--color-background': '10 10 10',
          '--color-foreground': '245 245 245',
          '--color-primary': '96 165 250',
        },
      }),
  ],
};
```

```tsx
// Token-based: no dark: needed — variable switches automatically
<View className="bg-background">
  <Text className="text-foreground">Auto-adapts to dark/light</Text>
</View>

// dark: IS needed for raw (non-token) colors
<Text className="text-gray-900 dark:text-gray-100">Manual dark</Text>

// NativeWind anti-pattern — always provide light + dark
// BAD:  <Text className="dark:text-white-500" />
// GOOD: <Text className="text-black dark:text-white" />
```

Reading / setting color scheme:
```tsx
import { useColorScheme } from 'nativewind';

const { colorScheme, setColorScheme } = useColorScheme();
// setColorScheme('dark' | 'light' | 'system')
```

app.json: set `"userInterfaceStyle": "automatic"` to allow system preference.

Source: https://www.nativewind.dev/docs/core-concepts/dark-mode
Source: https://www.nativewind.dev/docs/guides/themes

### active:opacity-80 and active:scale-[0.98] on Pressable

NativeWind's `active:` maps to `onPressIn`/`onPressOut`:

```tsx
import { Pressable, Text } from 'react-native';

export function Button({ onPress, children }) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-primary rounded-lg px-4 py-3 active:opacity-80 active:scale-[0.98]"
    >
      <Text className="text-white font-sans-bold text-base">{children}</Text>
    </Pressable>
  );
}
```

`active:scale-[0.98]` uses arbitrary value bracket syntax. Scale transforms are supported in NativeWind v4.

Source: https://www.nativewind.dev/docs/core-concepts/states

---

## 3. @expo-google-fonts/dm-sans + dm-mono

### Exact exported font names

DM Sans (`@expo-google-fonts/dm-sans`):
```
DMSans_100Thin            DMSans_100Thin_Italic
DMSans_200ExtraLight      DMSans_200ExtraLight_Italic
DMSans_300Light           DMSans_300Light_Italic
DMSans_400Regular         DMSans_400Regular_Italic    ← primary body
DMSans_500Medium          DMSans_500Medium_Italic
DMSans_600SemiBold        DMSans_600SemiBold_Italic
DMSans_700Bold            DMSans_700Bold_Italic       ← headings
DMSans_800ExtraBold       DMSans_800ExtraBold_Italic
DMSans_900Black           DMSans_900Black_Italic
```

DM Mono (`@expo-google-fonts/dm-mono`):
```
DMMono_300Light           DMMono_300Light_Italic
DMMono_400Regular         DMMono_400Regular_Italic    ← primary mono
DMMono_500Medium          DMMono_500Medium_Italic
```

Source: https://github.com/expo/google-fonts/blob/main/font-packages/dm-sans/README.md
Source: https://github.com/expo/google-fonts/blob/main/font-packages/dm-mono/README.md

### useFonts hook pattern (per-weight sub-path imports)

```tsx
// Sub-path imports (tree-shakeable, SDK 50+)
import { useFonts } from '@expo-google-fonts/dm-sans/useFonts';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono/400Regular';

const [fontsLoaded, fontError] = useFonts({
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  DMMono_400Regular,
});
```

Usage in StyleSheet: `fontFamily: 'DMSans_400Regular'` (string, matches the export name)

### SplashScreen.preventAutoHideAsync + font loading gate

```tsx
// src/app/_layout.tsx
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from '@expo-google-fonts/dm-sans/useFonts';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono/400Regular';

// Module scope — must be called before any render
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_700Bold,
    DMMono_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync(); // hide when ready OR on error (don't block forever)
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null; // render nothing until ready

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack />
    </GestureHandlerRootView>
  );
}
```

Source: https://docs.expo.dev/develop/user-interface/fonts/

### Coordinating fonts with other async gates (auth, flags, etc.)

```tsx
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ DMSans_400Regular, DMSans_700Bold });
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    initAuth().then(() => setAuthReady(true)); // runs in parallel with font loading
  }, []);

  const appReady = (fontsLoaded || fontError) && authReady;

  useEffect(() => {
    if (appReady) SplashScreen.hideAsync();
  }, [appReady]);

  if (!appReady) return null;
  return <Stack />;
}
```

Key: `preventAutoHideAsync()` at module scope + `hideAsync()` only when ALL gates pass.

### expo-font config plugin (alternative: embed at build time)

```json
{
  "plugins": [
    [
      "expo-font",
      {
        "fonts": [
          "node_modules/@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf",
          "node_modules/@expo-google-fonts/dm-sans/700Bold/DMSans_700Bold.ttf",
          "node_modules/@expo-google-fonts/dm-mono/400Regular/DMMono_400Regular.ttf"
        ]
      }
    ]
  ]
}
```

Requires dev build (not Expo Go). Fonts available instantly, no runtime loading needed.

---

## 4. @expo/vector-icons — Feather set

### Per-set import

```tsx
import Feather from '@expo/vector-icons/Feather'; // smaller bundle than full import
```

### Confirmed icon names

| Name | Use case |
|------|----------|
| `menu` | Hamburger / sidebar toggle |
| `settings` | Settings screen |
| `x` | Close / dismiss |
| `arrow-left` | Back navigation |
| `chevron-down` | Dropdown / collapse indicator |
| `chevron-right` | List item / nav arrow |
| `folder` | Directory / folder item |
| `file-text` | File / document item |
| `zap` | Shortcuts / quick actions |
| `alert-triangle` | Warning / error state |

### Basic usage

```tsx
<Feather name="menu" size={24} color="#000" />
<Feather name="arrow-left" size={24} color="#666" />
<Feather name="alert-triangle" size={20} color="#ef4444" />
```

### cssInterop pattern for NativeWind className support

```tsx
// lib/icons.ts
import { cssInterop } from 'nativewind';
import FeatherBase from '@expo/vector-icons/Feather';

cssInterop(FeatherBase, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      color: true, // text-red-500 → color prop on the icon
    },
  },
});

export const Feather = FeatherBase;
```

```tsx
// Usage with NativeWind classes
import { Feather } from '@/lib/icons';

<Feather name="menu" size={24} className="text-foreground" />
<Feather name="zap" size={18} className="text-primary" />
<Feather name="alert-triangle" size={20} className="text-red-500" />

// In pressable
<Pressable className="p-2 active:opacity-80 active:scale-[0.98]">
  <Feather name="settings" size={22} className="text-foreground" />
</Pressable>
```

> `size` must still be a number prop — no Tailwind mapping for icon size exists.

Source: https://www.nativewind.dev/docs/api/css-interop

---

## Setup Checklist

```
1. Install packages
   npx expo install react-native-reanimated react-native-worklets
   npx expo install react-native-gesture-handler
   npx expo install expo-splash-screen expo-font
   npx expo install @expo-google-fonts/dm-sans @expo-google-fonts/dm-mono
   npx expo install nativewind tailwindcss

2. babel.config.js — add reanimated/worklets plugin LAST

3. app.json — add "react-native-gesture-handler" to plugins
              add expo-font config plugin with font paths (optional)
              add "userInterfaceStyle": "automatic" for dark mode

4. tailwind.config.js — fontFamily entries (DMSans_400Regular etc.)
                         CSS variable tokens in :root and .dark

5. global.css — @tailwind base/components/utilities

6. _layout.tsx — SplashScreen.preventAutoHideAsync() at module scope
                 useFonts() hook + hideAsync() gate

7. App root — <GestureHandlerRootView style={{ flex: 1 }}>

8. lib/icons.ts — cssInterop(Feather, ...) once at module level
```
