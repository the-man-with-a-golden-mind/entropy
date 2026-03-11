import type { EntropyContext } from './context';
import type { Prefixed, ComputedDep } from './types';

// ─── Public computed() wrapper ────────────────────────────────────────────────

const IS_COMPUTED = Symbol('@en/computed');

/**
 * Marks a function as a computed value so entropy knows to call it
 * reactively instead of treating it as a plain function reference.
 *
 * @example
 * ```ts
 * const data = en.init();
 * data.fullName = en.computed(() => `${data.firstName} ${data.lastName}`);
 * ```
 */
export function computed<T extends (...args: unknown[]) => unknown>(fn: T): T {
  Object.defineProperty(fn, IS_COMPUTED, {
    value: true,
    enumerable: false,
    configurable: true,
    writable: false,
  });
  return fn;
}

export function isUserComputed(fn: unknown): fn is Function {
  return typeof fn === 'function' && IS_COMPUTED in fn;
}

// ─── Dependency tracking ──────────────────────────────────────────────────────

/**
 * Evaluates `value` to discover which reactive keys it reads, then stores
 * those dependencies in `ctx.deps.map` so the computed can be re-evaluated
 * when any dependency changes.
 *
 * **Idempotent**: clears prior dependency registrations for this exact
 * computed function before re-registering, preventing duplicate updates.
 */
export function setDependents(
  ctx: EntropyContext,
  value: Prefixed<Function>,
  key: string,
  parent: Prefixed<object>,
  prop: string,
): void {
  // ── 1. Remove stale dep registrations for this output key ────────────────
  // We match by `d.key === key` (the computed's output key) so that re-setting
  // the same computed (even via a freshly bound function) never duplicates entries.
  for (const [depKey, list] of ctx.deps.map) {
    const filtered = list.filter(d => d.key !== key);
    if (filtered.length === 0) {
      ctx.deps.map.delete(depKey);
    } else {
      ctx.deps.map.set(depKey, filtered);
    }
  }

  // ── 2. Re-evaluate to capture current dependencies ────────────────────────
  ctx.deps.isEvaluating = true;
  ctx.deps.set.clear();
  try {
    value();
  } catch {
    // Errors during dep-capture are intentionally swallowed; the computed
    // may reference data not yet initialised.
  } finally {
    ctx.deps.isEvaluating = false;
  }

  // ── 3. Register this computed as a dependent of each key it read ──────────
  const dependent: ComputedDep = { key, computed: value, parent, prop };

  for (const dep of ctx.deps.set) {
    const list = ctx.deps.map.get(dep) ?? [];
    list.push(dependent);
    ctx.deps.map.set(dep, list);
  }
}

// ─── Computed update propagation ──────────────────────────────────────────────

/**
 * Returns all ComputedDeps that transitively depend on `changedKey`,
 * deduplicating by the computed function reference.
 */
export function getDependentsOf(
  ctx: EntropyContext,
  changedKey: string,
): ComputedDep[] {
  const matched: ComputedDep[] = [...ctx.deps.map.entries()]
    .filter(
      ([k]) =>
        k === changedKey ||
        k.startsWith(changedKey + '.') ||
        changedKey.startsWith(k + '.'),
    )
    .flatMap(([, list]) => list);

  // Deduplicate by computed function reference
  const seen = new Set<Function>();
  return matched.filter(dep => {
    if (seen.has(dep.computed)) return false;
    seen.add(dep.computed);
    return true;
  });
}

/**
 * Removes all dependency entries for a given key (called on deleteProperty).
 */
export function removeDependentsFor(
  ctx: EntropyContext,
  deletedKey: string,
): void {
  ctx.deps.map.delete(deletedKey);
  for (const [k, list] of ctx.deps.map) {
    const filtered = list.filter(d => d.key !== deletedKey);
    if (filtered.length === 0) {
      ctx.deps.map.delete(k);
    } else {
      ctx.deps.map.set(k, filtered);
    }
  }
}

// ─── Async version tracking ───────────────────────────────────────────────────

export function bumpVersion(ctx: EntropyContext, key: string): number {
  const v = (ctx.deps.versions.get(key) ?? 0) + 1;
  ctx.deps.versions.set(key, v);
  return v;
}

export function isCurrentVersion(
  ctx: EntropyContext,
  key: string,
  version: number,
): boolean {
  return ctx.deps.versions.get(key) === version;
}
