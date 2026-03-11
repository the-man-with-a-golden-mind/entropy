import type { EntropyContext } from '../context';
import type { Prefixed } from '../types';

export type GetValueResult = {
  value: unknown;
  parent: Prefixed<object> | null;
  prop: string;
};

/**
 * Resolves a period-separated key against the reactive data tree.
 * Returns the value, its immediate parent object, and the property name.
 *
 * @example
 * // data = { user: { name: 'Alice' } }
 * getValue(ctx, 'user.name') // → { value: 'Alice', parent: data.user, prop: 'name' }
 */
export function getValue(ctx: EntropyContext, key: string): GetValueResult {
  let parent = ctx.data as Prefixed<object> | null;
  let value: unknown = undefined;
  let prop = '';

  if (parent === null) {
    return { parent, value, prop };
  }

  const parts = key.split('.');
  for (let i = 0; i < parts.length; i++) {
    prop = parts[i]!;
    value = Reflect.get(parent, prop);

    if (i < parts.length - 1) {
      if (typeof value !== 'object' || value === null) {
        // Path doesn't exist – return what we have
        return { parent, value: undefined, prop };
      }
      parent = value as Prefixed<object>;
    }
  }

  return { parent, value, prop };
}
