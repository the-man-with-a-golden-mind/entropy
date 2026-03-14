import { enPrefix } from './symbols';
import type { Prefixed } from './types';

// ─── Key helpers ──────────────────────────────────────────────────────────────

export function getKey(prop: string, prefix: string): string {
  return prefix === '' ? prop : `${prefix}.${prop}`;
}

export function getParam(
  el: Element,
  attrName: string,
  isParametric: boolean,
): string | undefined {
  if (!isParametric) return undefined;
  const value = el.getAttribute(attrName);
  if (!value) return undefined;
  return value.slice(value.indexOf(':') + 1);
}

// ─── Type guards ──────────────────────────────────────────────────────────────

export function isPrefixedObject(value: unknown): value is Prefixed<object> {
  return typeof value === 'object' && value !== null && enPrefix in value;
}

// ─── Deep clone ───────────────────────────────────────────────────────────────

/**
 * Deep clones a value.
 * Handles: primitives, Date, RegExp, Map, Set, Arrays, plain objects.
 * Unknown exotic types fall back to a plain-object shallow copy.
 */
export function clone<T>(target: T): T {
  if (target === null || typeof target !== 'object') return target;

  // Array is the most common case — check before instanceof guards
  if (Array.isArray(target)) {
    return target.map(v => clone(v)) as unknown as T;
  }
  if (target instanceof Date) {
    return new Date(target.getTime()) as unknown as T;
  }
  if (target instanceof RegExp) {
    return new RegExp(target.source, target.flags) as unknown as T;
  }
  if (target instanceof Map) {
    return new Map(
      [...target].map(([k, v]) => [clone(k), clone(v)]),
    ) as unknown as T;
  }
  if (target instanceof Set) {
    return new Set([...target].map(v => clone(v))) as unknown as T;
  }

  const result: Record<string, unknown> = Object.create(
    Object.getPrototypeOf(target),
  );
  for (const key of Object.keys(target as object)) {
    result[key] = clone((target as Record<string, unknown>)[key]);
  }
  return result as T;
}
