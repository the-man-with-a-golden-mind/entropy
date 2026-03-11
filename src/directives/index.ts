import type { EntropyContext } from '../context';
import type { Directive, DirectiveEntry } from '../types';
import { markEntry } from './builtins';

/**
 * Seeds the directive map with built-in directives.
 * Conditional directives (if / ifnot) are registered later from core.ts
 * once the `ifOrIfNot` implementation is available.
 */
export function registerBuiltins(ctx: EntropyContext): void {
  ctx.directives.set('mark', markEntry);
}

/**
 * Registers a custom directive. No-ops if the name is already taken to
 * prevent accidental overrides during hot-reload scenarios.
 */
export function registerDirective(
  ctx: EntropyContext,
  name: string,
  cb: Directive,
  isParametric = false,
): void {
  if (ctx.directives.has(name)) return;
  ctx.directives.set(name, { cb, isParametric });
}

export function getDirective(
  ctx: EntropyContext,
  name: string,
): DirectiveEntry | undefined {
  return ctx.directives.get(name);
}

export function allDirectives(
  ctx: EntropyContext,
): IterableIterator<[string, DirectiveEntry]> {
  return ctx.directives.entries();
}
