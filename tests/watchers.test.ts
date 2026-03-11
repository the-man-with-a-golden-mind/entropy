import { describe, it, expect, vi } from 'vitest';
import { setup } from './helpers';

describe('watch', () => {
  it('calls watcher when a key changes', () => {
    const { en, data, cleanup } = setup();
    const fn = vi.fn();

    data.count = 0;
    en.watch('count', fn);
    data.count = 1;

    expect(fn).toHaveBeenCalledWith(1);
    cleanup();
  });

  it('calls watcher with the parent value when a child key changes', () => {
    const { en, data, cleanup } = setup();
    const fn = vi.fn();

    data.user = { name: 'Alice', age: 30 };
    en.watch('user', fn);
    data.user.name = 'Bob';

    // The watcher receives the full user object
    expect(fn).toHaveBeenCalled();
    cleanup();
  });

  it('does not call watcher after unwatch(key)', () => {
    const { en, data, cleanup } = setup();
    const fn = vi.fn();

    data.x = 0;
    en.watch('x', fn);
    en.unwatch('x');
    data.x = 1;

    expect(fn).not.toHaveBeenCalled();
    cleanup();
  });

  it('removes only the specified watcher function', () => {
    const { en, data, cleanup } = setup();
    const fnA = vi.fn();
    const fnB = vi.fn();

    data.x = 0;
    en.watch('x', fnA);
    en.watch('x', fnB);
    en.unwatch('x', fnA);
    data.x = 1;

    expect(fnA).not.toHaveBeenCalled();
    expect(fnB).toHaveBeenCalledWith(1);
    cleanup();
  });

  it('clears all watchers with unwatch()', () => {
    const { en, data, cleanup } = setup();
    const fn = vi.fn();

    data.a = 0;
    data.b = 0;
    en.watch('a', fn);
    en.watch('b', fn);
    en.unwatch();
    data.a = 1;
    data.b = 1;

    expect(fn).not.toHaveBeenCalled();
    cleanup();
  });

  it('supports multiple watchers for the same key', () => {
    const { en, data, cleanup } = setup();
    const fn1 = vi.fn();
    const fn2 = vi.fn();

    data.v = 0;
    en.watch('v', fn1);
    en.watch('v', fn2);
    data.v = 99;

    expect(fn1).toHaveBeenCalledWith(99);
    expect(fn2).toHaveBeenCalledWith(99);
    cleanup();
  });
});
