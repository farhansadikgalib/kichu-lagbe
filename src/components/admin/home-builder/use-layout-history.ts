"use client";

import { useCallback, useReducer, useRef } from "react";
import type { HomeLayout } from "@/lib/home/schema";

/** Consecutive edits with the same key inside this window collapse into one undo step. */
const COALESCE_MS = 800;

interface History {
  /** `null` while the draft mirrors the published layout. */
  present: HomeLayout | null;
  past: HomeLayout[];
  future: HomeLayout[];
}

type Action =
  | { type: "set"; layout: HomeLayout; base: HomeLayout; coalesce: boolean }
  | { type: "undo"; base: HomeLayout }
  | { type: "redo"; base: HomeLayout }
  | { type: "reset" };

const EMPTY: History = { present: null, past: [], future: [] };

function reducer(state: History, action: Action): History {
  switch (action.type) {
    case "set": {
      const current = state.present ?? action.base;
      return {
        present: action.layout,
        past: action.coalesce ? state.past : [...state.past, current],
        future: [],
      };
    }
    case "undo": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const current = state.present ?? action.base;
      return {
        present: previous === action.base ? null : previous,
        past: state.past.slice(0, -1),
        future: [current, ...state.future],
      };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      const current = state.present ?? action.base;
      return { present: next, past: [...state.past, current], future: rest };
    }
    case "reset":
      return EMPTY;
  }
}

/**
 * Undo/redo history for the builder draft. The published layout is the
 * baseline: undoing back to it clears the "unsaved" state.
 */
export function useLayoutHistory(published: HomeLayout | undefined) {
  const [state, dispatch] = useReducer(reducer, EMPTY);
  const lastEdit = useRef<{ key: string; at: number } | null>(null);

  const set = useCallback(
    (layout: HomeLayout, coalesceKey?: string) => {
      if (!published) return;
      const now = Date.now();
      const coalesce =
        coalesceKey !== undefined &&
        lastEdit.current?.key === coalesceKey &&
        now - lastEdit.current.at < COALESCE_MS;
      lastEdit.current = coalesceKey ? { key: coalesceKey, at: now } : null;
      dispatch({ type: "set", layout, base: published, coalesce });
    },
    [published],
  );

  const undo = useCallback(() => {
    if (!published) return;
    lastEdit.current = null;
    dispatch({ type: "undo", base: published });
  }, [published]);

  const redo = useCallback(() => {
    if (!published) return;
    lastEdit.current = null;
    dispatch({ type: "redo", base: published });
  }, [published]);

  const reset = useCallback(() => {
    lastEdit.current = null;
    dispatch({ type: "reset" });
  }, []);

  return {
    draft: state.present,
    dirty: state.present !== null,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    set,
    undo,
    redo,
    reset,
  };
}
