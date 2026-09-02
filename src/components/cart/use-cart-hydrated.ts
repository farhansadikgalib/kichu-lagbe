"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * False during SSR/hydration, true on the client afterwards. Used to defer
 * rendering of the localStorage-persisted cart until it is safe (no mismatch).
 */
export function useCartHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
