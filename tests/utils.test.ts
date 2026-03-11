import { describe, it, expect } from 'vitest';
import { getKey, getParam, isPrefixedObject, clone } from '../src/utils';
import { enPrefix } from '../src/symbols';

// ─── getKey ──────────────────────────────────────────────────────────────────

describe('getKey', () => {
  it('returns prop when prefix is empty string', () => {
    expect(getKey('name', '')).toBe('name');
  });

  it('joins prefix and prop with a dot', () => {
    expect(getKey('name', 'user')).toBe('user.name');
  });

  it('handles nested prefix', () => {
    expect(getKey('zip', 'user.address')).toBe('user.address.zip');
  });
});

// ─── getParam ────────────────────────────────────────────────────────────────

describe('getParam', () => {
  it('returns undefined when isParametric is false', () => {
    const el = document.createElement('div');
    el.setAttribute('en-class', 'active');
    expect(getParam(el, 'en-class', false)).toBeUndefined();
  });

  it('returns the portion after the colon for parametric directives', () => {
    const el = document.createElement('div');
    el.setAttribute('en-class', 'isActive:active');
    expect(getParam(el, 'en-class', true)).toBe('active');
  });

  it('returns empty string when there is nothing after the colon', () => {
    const el = document.createElement('div');
    el.setAttribute('en-class', 'key:');
    expect(getParam(el, 'en-class', true)).toBe('');
  });

  it('returns undefined when element has no attribute', () => {
    const el = document.createElement('div');
    expect(getParam(el, 'en-class', true)).toBeUndefined();
  });
});

// ─── isPrefixedObject ────────────────────────────────────────────────────────

describe('isPrefixedObject', () => {
  it('returns false for primitives', () => {
    expect(isPrefixedObject(42)).toBe(false);
    expect(isPrefixedObject('hello')).toBe(false);
    expect(isPrefixedObject(null)).toBe(false);
  });

  it('returns false for plain objects without enPrefix', () => {
    expect(isPrefixedObject({ a: 1 })).toBe(false);
  });

  it('returns true for objects with enPrefix symbol', () => {
    const obj = { [enPrefix]: 'user' } as any;
    expect(isPrefixedObject(obj)).toBe(true);
  });
});

// ─── clone ───────────────────────────────────────────────────────────────────

describe('clone', () => {
  it('returns primitives as-is', () => {
    expect(clone(42)).toBe(42);
    expect(clone('hello')).toBe('hello');
    expect(clone(null)).toBe(null);
    expect(clone(true)).toBe(true);
  });

  it('deep clones plain objects', () => {
    const src = { a: 1, b: { c: 2 } };
    const result = clone(src);
    expect(result).toEqual(src);
    expect(result).not.toBe(src);
    expect(result.b).not.toBe(src.b);
  });

  it('deep clones arrays', () => {
    const src = [1, [2, 3], { x: 4 }];
    const result = clone(src);
    expect(result).toEqual(src);
    expect(result).not.toBe(src);
    expect(result[1]).not.toBe(src[1]);
  });

  it('clones Date objects', () => {
    const src = new Date('2024-01-01');
    const result = clone(src);
    expect(result).toEqual(src);
    expect(result).not.toBe(src);
  });

  it('clones RegExp', () => {
    const src = /hello/gi;
    const result = clone(src);
    expect(result.source).toBe(src.source);
    expect(result.flags).toBe(src.flags);
    expect(result).not.toBe(src);
  });

  it('clones Map', () => {
    const src = new Map([['a', 1], ['b', 2]]);
    const result = clone(src);
    expect(result).toEqual(src);
    expect(result).not.toBe(src);
  });

  it('clones Set', () => {
    const src = new Set([1, 2, 3]);
    const result = clone(src);
    expect(result).toEqual(src);
    expect(result).not.toBe(src);
  });
});
