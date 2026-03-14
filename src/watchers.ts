import type { EntropyContext } from './context';
import type { Watcher } from './types';

/**
 * Registers a watcher for `key`. The watcher is called with the new value
 * whenever `key` or any child key changes.
 */
export function watch(
  ctx: EntropyContext,
  key: string,
  watcher: Watcher,
): void {
  const list = ctx.watchers.get(key) ?? [];
  list.push(watcher);
  // Always set to handle the case where the list was freshly created
  ctx.watchers.set(key, list);
}

/**
 * Removes watchers. All combinations are supported:
 * - `unwatch()` – clears everything
 * - `unwatch(key)` – clears all watchers for a key
 * - `unwatch(undefined, fn)` – removes one fn from all keys
 * - `unwatch(key, fn)` – removes one fn from a specific key
 */
export function unwatch(
  ctx: EntropyContext,
  key?: string,
  watcher?: Watcher,
): void {
  if (!key && !watcher) {
    ctx.watchers.clear();
    return;
  }

  if (key && !watcher) {
    ctx.watchers.delete(key);
    return;
  }

  const targets: [string, Watcher[]][] = key
    ? [[key, ctx.watchers.get(key) ?? []]]
    : [...ctx.watchers.entries()];

  for (const [k, list] of targets) {
    const filtered = list.filter(w => w !== watcher);
    if (filtered.length === 0) {
      ctx.watchers.delete(k);
    } else {
      ctx.watchers.set(k, filtered);
    }
  }
}

/**
 * Invokes all watchers whose key matches or is an ancestor of `changedKey`.
 */
export function callWatchers(
  ctx: EntropyContext,
  changedKey: string,
  changedValue: unknown,
  getValue: (k: string) => unknown,
): void {
  // Fast path: exact key match via O(1) Map lookup
  const exact = ctx.watchers.get(changedKey);
  if (exact) exact.forEach(cb => cb(changedValue));

  // Ancestor watchers: a parent key watching a child change
  for (const [watchedKey, watchers] of ctx.watchers) {
    if (watchedKey !== changedKey && changedKey.startsWith(watchedKey + '.')) {
      watchers.forEach(cb => cb(getValue(watchedKey)));
    }
  }
}
