import type { DirectiveEntry, DirectiveParams } from '../types';

// ─── mark ─────────────────────────────────────────────────────────────────────

function markDirective({ el, value, isDelete }: DirectiveParams): void {
  if (isDelete) {
    removeElement(el);
    return;
  }

  if (!(el instanceof HTMLElement)) return;

  if (typeof value === 'object' && value !== null) {
    value = JSON.stringify(value);
  }

  el.textContent = typeof value === 'string' ? value : String(value);
}

// ─── if / ifnot ──────────────────────────────────────────────────────────────

/**
 * Factory: returns directive entries for `if` and `ifnot` that delegate to
 * `ifOrIfNotFn`. The function is injected to avoid a circular import between
 * this module and core.ts.
 */
export function createConditionalDirectives(
  ifOrIfNotFn: (
    el: Element,
    value: unknown,
    key: string,
    type: 'if' | 'ifnot',
  ) => void,
): { if: DirectiveEntry; ifnot: DirectiveEntry } {
  return {
    if: {
      cb: ({ el, value, key }: DirectiveParams) =>
        ifOrIfNotFn(el, value, key, 'if'),
    },
    ifnot: {
      cb: ({ el, value, key }: DirectiveParams) =>
        ifOrIfNotFn(el, value, key, 'ifnot'),
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function removeElement(el: Element): void {
  const parent = el.parentElement;

  if (!(el instanceof HTMLElement) || !parent) {
    return el.remove();
  }

  // If the element is a list-item wrapper whose en-mark matches the parent's,
  // remove the entire parent row instead.
  const elMark = el.getAttribute('data-en-mark') ?? el.getAttribute('en-mark');
  const parentMark =
    parent.getAttribute('data-en-mark') ?? parent.getAttribute('en-mark');

  if (elMark && elMark === parentMark) {
    return parent.remove();
  }

  el.remove();
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const markEntry: DirectiveEntry = { cb: markDirective };
