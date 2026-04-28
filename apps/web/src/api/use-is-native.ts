// Reactive wrapper around `Capacitor.isNativePlatform()` so React components
// can branch on it without importing Capacitor at the call site. The value
// is constant for the lifetime of the app — Capacitor sets it once at
// runtime based on whether the WebView is hosted by the native shell — so
// we just memoize.

import { Capacitor } from '@capacitor/core';

const cached = Capacitor.isNativePlatform();

export function useIsNative(): boolean {
  return cached;
}

export function isNative(): boolean {
  return cached;
}
