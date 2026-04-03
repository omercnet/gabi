/**
 * Mock for nativewind's cssInterop in test environment.
 * The icon-interop.ts module calls cssInterop() at import time.
 */
export function cssInterop() {
  // no-op in tests
}
