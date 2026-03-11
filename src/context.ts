import type { Watcher, DirectiveEntry, ComputedList } from './types';

// ─── Sub-state shapes ─────────────────────────────────────────────────────────

export interface DepsState {
  /** True while a computed function is being evaluated for dep-tracking */
  isEvaluating: boolean;
  /** Keys accessed during the current dep-tracking evaluation */
  set: Set<string>;
  /** Map from dependency key → list of computed values that depend on it */
  map: Map<string, ComputedList>;
  /**
   * Monotonically increasing version number per computed key.
   * Used to discard stale async computed results.
   */
  versions: Map<string, number>;
}

// ─── Main context ─────────────────────────────────────────────────────────────

export interface EntropyContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any | null;
  prefix: string;
  watchers: Map<string, Watcher[]>;
  directives: Map<string, DirectiveEntry>;
  deps: DepsState;
  /**
   * Tracks functions that are *results* of computed calls (not computed
   * definitions). These must not be invoked again by the proxy get-trap.
   */
  computedResultFns: WeakSet<Function>;
  /**
   * When non-null, DOM updates are queued here instead of applied
   * immediately. Call `flushBatch` to apply them.
   */
  batchQueue: Array<() => void> | null;
  /** Set to true after destroy() is called – ignores further updates */
  destroyed: boolean;
  /**
   * Cache of querySelectorAll results keyed by query string.
   * Populated lazily, cleared automatically by the MutationObserver
   * whenever the DOM changes.
   */
  elementCache: Map<string, Element[]>;
  /** Watches the document for DOM mutations to invalidate elementCache. */
  observer: MutationObserver | null;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createContext(): EntropyContext {
  return {
    data: null,
    prefix: 'en-',
    watchers: new Map(),
    directives: new Map(),
    deps: {
      isEvaluating: false,
      set: new Set(),
      map: new Map(),
      versions: new Map(),
    },
    computedResultFns: new WeakSet(),
    batchQueue: null,
    destroyed: false,
    elementCache: new Map(),
    observer: null,
  };
}
