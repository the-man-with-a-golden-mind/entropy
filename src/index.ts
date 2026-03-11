/**
 * entropy – Lightweight reactive DOM library
 *
 * @example Quick start
 * ```html
 * <script type="module">
 *   import en from 'entropy-js';
 *   const data = en.init();
 *   data.count = 0;
 * </script>
 *
 * <span en-mark="count"></span>
 * <button onclick="data.count++">+1</button>
 * ```
 */

export { EntropyInstance, createInstance } from './instance';
export type { Meta } from './instance';
export { computed } from './computed';

// Public types
export type {
  Directive,
  DirectiveParams,
  DirectiveEntry,
  Watcher,
  Prefixed,
  SyncConfig,
} from './types';

// ─── Default singleton instance ───────────────────────────────────────────────

import { EntropyInstance } from './instance';

/**
 * The default entropy instance.
 *
 * For single-page applications this is all you need.
 * For micro-frontends or isolated widgets, use `createInstance()` instead.
 */
const en = new EntropyInstance();
export default en;
