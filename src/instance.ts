import { createContext } from './context';
import type { EntropyContext } from './context';
import type { Prefixed } from './types';
import type { Directive, Watcher } from './types';
import { enPrefix } from './symbols';
import { reactive, bootstrapDirectives, update, batch } from './core';
import { watch, unwatch } from './watchers';
import { registerDirective } from './directives/index';
import { computed } from './computed';
import {
  registerTemplates,
  loadTemplateFile,
  stitchTagTemplate,
  wrapInDiv,
} from './dom/components';
import { getValue } from './dom/queries';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Meta = Record<string, unknown>; // opaque marker type for the reactive root

// ─── EntropyInstance ───────────────────────────────────────────────────────

export class EntropyInstance {
  private readonly ctx: EntropyContext;
  private readyStateHandler: (() => void) | null = null;

  constructor() {
    this.ctx = createContext();
    bootstrapDirectives(this.ctx);
  }

  // ─── init ──────────────────────────────────────────────────────────────────

  /**
   * Initialises the reactive data object and begins listening for DOM changes.
   * Returns the reactive data proxy – assign properties directly on it.
   *
   * @example
   * ```ts
   * const data = en.init();
   * data.count = 0;
   * ```
   */
  init(): Record<string, unknown> & Meta {
    if (!this.ctx.data) {
      this.ctx.data = reactive(this.ctx, {}, '') as Prefixed<{}>;
    }

    registerTemplates();

    if (!this.readyStateHandler) {
      this.readyStateHandler = () => {
        if (document.readyState === 'interactive') {
          registerTemplates();
        }
      };
      document.addEventListener('readystatechange', this.readyStateHandler);
    }

    return this.ctx.data;
  }

  // ─── computed ──────────────────────────────────────────────────────────────

  /**
   * Marks a function as a computed value so entropy calls it reactively.
   *
   * @example
   * ```ts
   * data.fullName = en.computed(() => `${data.first} ${data.last}`);
   * ```
   */
  computed = computed;

  // ─── watch ─────────────────────────────────────────────────────────────────

  /**
   * Registers a watcher for `key`. Called with the new value whenever `key`
   * or any of its children changes.
   *
   * @example
   * ```ts
   * en.watch('user.name', newName => console.log('Name changed:', newName));
   * ```
   */
  watch(key: string, watcher: Watcher): void {
    watch(this.ctx, key, watcher);
  }

  /**
   * Removes watchers. See parameter combinations in the source for details.
   */
  unwatch(key?: string, watcher?: Watcher): void {
    unwatch(this.ctx, key, watcher);
  }

  // ─── directive ─────────────────────────────────────────────────────────────

  /**
   * Registers a custom directive.
   *
   * @example
   * ```ts
   * en.directive('color', ({ el, value }) => {
   *   (el as HTMLElement).style.color = String(value);
   * });
   * ```
   */
  directive(name: string, cb: Directive, isParametric = false): void {
    registerDirective(this.ctx, name, cb, isParametric);
  }

  // ─── prefix ────────────────────────────────────────────────────────────────

  /**
   * Overrides the default attribute prefix (`en-`).
   * Must be called before `init()`.
   *
   * @example
   * ```ts
   * en.prefix('data-en');
   * const data = en.init();
   * // now use data-en-mark="..." in your HTML
   * ```
   */
  prefix(value = 'en'): void {
    this.ctx.prefix = value.endsWith('-') ? value : value + '-';
  }

  // ─── batch ─────────────────────────────────────────────────────────────────

  /**
   * Batches multiple reactive changes into a single DOM update pass.
   *
   * @example
   * ```ts
   * en.batch(() => {
   *   data.firstName = 'Jane';
   *   data.lastName  = 'Doe';
   * });
   * ```
   */
  batch(fn: () => void): void {
    batch(this.ctx, fn);
  }

  // ─── load ──────────────────────────────────────────────────────────────────

  /**
   * Fetches one or more HTML files and registers any `<template name="...">` 
   * elements found inside them as custom components.
   *
   * @example
   * ```ts
   * await en.load(['components/card.html', 'components/modal.html']);
   * ```
   */
  async load(files: string | string[]): Promise<void> {
    const list = Array.isArray(files) ? files : [files];
    await Promise.all(list.map(f => loadTemplateFile(f)));
  }

  // ─── register ──────────────────────────────────────────────────────────────

  /**
   * Registers component templates at runtime.
   *
   * Accepts:
   * - No args → scans the whole document
   * - An `HTMLElement` root
   * - A template string
   * - A tagged-template literal
   *
   * @example
   * ```ts
   * en.register`<template name="my-btn"><button><slot /></button></template>`;
   * ```
   */
  register(root: TemplateStringsArray, ...args: unknown[]): void;
  register(root: HTMLElement): void;
  register(template: string): void;
  register(): void;
  register(
    root?: TemplateStringsArray | HTMLElement | string,
    ...args: unknown[]
  ): void {
    if (Array.isArray(root)) {
      root = stitchTagTemplate(root as string[], ...args);
    }
    if (typeof root === 'string') {
      root = wrapInDiv(root);
    }
    registerTemplates(root as HTMLElement | undefined);
  }

  // ─── destroy ───────────────────────────────────────────────────────────────

  /**
   * Tears down the instance: removes event listeners, clears watchers,
   * and prevents further DOM updates.
   */
  destroy(): void {
    this.ctx.destroyed = true;

    if (this.readyStateHandler) {
      document.removeEventListener(
        'readystatechange',
        this.readyStateHandler,
      );
      this.readyStateHandler = null;
    }

    this.ctx.watchers.clear();
    this.ctx.deps.map.clear();
    this.ctx.deps.versions.clear();
    this.ctx.data = null;
  }
}

// ─── Default singleton factory ────────────────────────────────────────────────

/**
 * Creates a new isolated entropy instance.
 * Most applications only need the default export.
 */
export function createInstance(): EntropyInstance {
  return new EntropyInstance();
}
