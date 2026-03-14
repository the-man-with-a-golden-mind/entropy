import type { DirectiveEntry, DirectiveParams } from '../types';
import type { EntropyContext } from '../context';
import { getValue } from '../dom/queries';

// ─── mark ─────────────────────────────────────────────────────────────────────

function markDirective({ el, value, isDelete }: DirectiveParams): void {
  if (isDelete) {
    removeElement(el);
    return;
  }

  if (!(el instanceof HTMLElement)) return;

  if (typeof value === 'object' && value !== null) {
    // Element has child elements that carry their own en-mark directives.
    // Setting textContent would destroy them — let callDirectivesForObject
    // update the children individually instead.
    if (el.children.length > 0) return;
    value = JSON.stringify(value);
  }

  el.textContent = typeof value === 'string' ? value : String(value);
}

// ─── model ────────────────────────────────────────────────────────────────────

/**
 * Two-way binding directive. Syncs a reactive key with an input element:
 *
 * - DOM → data: listens to `input` (text, number, textarea), `change`
 *   (select, checkbox, radio), keeping data in sync as the user types.
 * - data → DOM: sets the element value / checked state when the reactive
 *   key changes, exactly like `en-mark` does for textContent.
 *
 * Supported elements: input[type=text|number|email|password|range|date|…],
 * input[type=checkbox], input[type=radio], textarea, select.
 *
 * Usage: `<input en-model="key" />`
 */

// WeakSet so listeners are GC-able with their elements
const modelListeners = new WeakMap<Element, () => void>();

function modelDirective(ctx: EntropyContext): (params: DirectiveParams) => void {
  return ({ el, value, key }: DirectiveParams) => {
    if (!(el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement)) return;

    // ── data → DOM ──────────────────────────────────────────────────────────
    if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      el.checked = !!value;
    } else if (el instanceof HTMLInputElement && el.type === 'radio') {
      el.checked = el.value === String(value);
    } else {
      // text, number, email, password, range, date, textarea, select
      const strVal = value === null || value === undefined ? '' : String(value);
      if (el.value !== strVal) el.value = strVal;
    }

    // ── DOM → data (attach listener once per element) ───────────────────────
    if (modelListeners.has(el)) return;

    const isCheckbox = el instanceof HTMLInputElement && el.type === 'checkbox';
    const isRadio    = el instanceof HTMLInputElement && el.type === 'radio';
    const isNumber   = el instanceof HTMLInputElement && el.type === 'number';
    const isSelect   = el instanceof HTMLSelectElement;
    const eventName  = (isCheckbox || isRadio || isSelect) ? 'change' : 'input';

    const handler = () => {
      const { parent, prop } = getValue(ctx, key);
      if (!parent) return;

      let incoming: unknown;
      if (isCheckbox)      incoming = (el as HTMLInputElement).checked;
      else if (isNumber)   incoming = (el as HTMLInputElement).valueAsNumber;
      else                 incoming = (el as HTMLElement & { value: string }).value;

      Reflect.set(parent, prop, incoming);
    };

    el.addEventListener(eventName, handler);
    modelListeners.set(el, handler);
  };
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

export function createModelEntry(ctx: EntropyContext): DirectiveEntry {
  return { cb: modelDirective(ctx) };
}
