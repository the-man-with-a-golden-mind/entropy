import type { enPrefix } from './symbols';

// ─── Core reactive types ──────────────────────────────────────────────────────

export type Complex = object | Function;
export type Prefixed<T> = T extends Complex ? T & { [enPrefix]: string } : never;

// ─── Public API types ─────────────────────────────────────────────────────────

export type Watcher = (newValue: unknown) => unknown;

export type DirectiveParams = {
  /** The element to which the directive has been applied */
  el: Element;
  /** The updated value */
  value: unknown;
  /** Period-delimited key that points to the value in the global data object */
  key: string;
  /** Whether the value was deleted via `delete data.prop` */
  isDelete: boolean;
  /** The proxied parent object to which the value belongs */
  parent: Prefixed<object>;
  /** Property of the parent which points to the value: `parent[prop] ≈ value` */
  prop: string;
  /** For parametric directives, the portion after the colon */
  param: string | undefined;
};

export type Directive = (params: DirectiveParams) => void;

export type DirectiveEntry = {
  cb: Directive;
  isParametric?: boolean;
};

// ─── Internal types ───────────────────────────────────────────────────────────

export type ComputedDep = {
  key: string;
  computed: Prefixed<Function>;
  parent: Prefixed<object>;
  prop: string;
};

export type ComputedList = ComputedDep[];

export type SyncConfig = {
  directive: string;
  el: Element;
  skipConditionals?: boolean;
  skipMark?: boolean;
};
