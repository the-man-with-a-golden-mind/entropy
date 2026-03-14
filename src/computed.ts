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

// ─── Dep graph helpers ────────────────────────────────────────────────────────

/**
 * Removes all dep-graph entries whose output key matches `key`.
 * Called before re-registering deps so the graph never accumulates stale edges.
 */
export function clearDepsForKey(ctx: EntropyContext, key: string): void {
  for (const [depKey, list] of ctx.deps.map) {
    const filtered = list.filter(d => d.key !== key);
    if (filtered.length === 0) {
      ctx.deps.map.delete(depKey);
    } else {
      ctx.deps.map.set(depKey, filtered);
    }
  }
}

/**
 * Reads `ctx.deps.set` (populated during a tracked evaluation) and writes
 * edges into `ctx.deps.map` for each accessed key.
 */
export function registerTrackedDeps(
  ctx: EntropyContext,
  key: string,
  computedFn: Prefixed<Function>,
  parent: Prefixed<object>,
  prop: string,
): void {
  const dependent: ComputedDep = { key, computed: computedFn, parent, prop };
  for (const dep of ctx.deps.set) {
    const list = ctx.deps.map.get(dep) ?? [];
    list.push(dependent);
    ctx.deps.map.set(dep, list);
  }
}

// ─── Dependency tracking ──────────────────────────────────────────────────────

/**
 * Evaluates `value` to discover which reactive keys it reads, then stores
 * those dependencies in `ctx.deps.map` so the computed can be re-evaluated
 * when any dependency changes.
 *
 * Used on *initial assignment* only. Re-evaluations go through `runComputed`
 * in core.ts which tracks deps inline during the actual execution.
 */
export function setDependents(
  ctx: EntropyContext,
  value: Prefixed<Function>,
  key: string,
  parent: Prefixed<object>,
  prop: string,
): void {
  clearDepsForKey(ctx, key);

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

  registerTrackedDeps(ctx, key, value, parent, prop);
  ctx.deps.set.clear();
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
  const result: ComputedDep[] = [];
  const seen = new Set<Function>();
  const changedKeyDot = changedKey + '.';

  for (const [k, list] of ctx.deps.map) {
    if (k !== changedKey && !k.startsWith(changedKeyDot) && !changedKey.startsWith(k + '.')) continue;
    for (const dep of list) {
      if (!seen.has(dep.computed)) {
        seen.add(dep.computed);
        result.push(dep);
      }
    }
  }
  return result;
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
