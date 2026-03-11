import { describe, it, expect, vi } from 'vitest';
import { createInstance } from '../src/instance';

describe('createInstance', () => {
  it('creates isolated instances that do not share state', () => {
    const enA = createInstance();
    const enB = createInstance();

    const dataA = enA.init();
    const dataB = enB.init();

    dataA.x = 'from A';
    dataB.x = 'from B';

    expect(dataA.x).toBe('from A');
    expect(dataB.x).toBe('from B');

    enA.destroy();
    enB.destroy();
  });

  it('allows different prefixes per instance', () => {
    const enA = createInstance();
    const enB = createInstance();

    enB.prefix('data-x');

    expect((enA as any).ctx.prefix).toBe('en-');
    expect((enB as any).ctx.prefix).toBe('data-x-');

    enA.destroy();
    enB.destroy();
  });

  it('init() is idempotent – returns the same data proxy on re-call', () => {
    const en = createInstance();
    const d1 = en.init();
    const d2 = en.init();
    expect(d1).toBe(d2);
    en.destroy();
  });
});

describe('destroy', () => {
  it('clears watchers', () => {
    const en = createInstance();
    const data = en.init();
    const fn = vi.fn();

    data.v = 0;
    en.watch('v', fn);
    en.destroy();

    expect((en as any).ctx.watchers.size).toBe(0);
  });

  it('sets the destroyed flag, preventing further updates', () => {
    const en = createInstance();
    en.init();
    en.destroy();
    expect((en as any).ctx.destroyed).toBe(true);
  });

  it('removes the readystatechange listener', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const en = createInstance();
    en.init();
    en.destroy();
    expect(removeSpy).toHaveBeenCalledWith(
      'readystatechange',
      expect.any(Function)
    );
    removeSpy.mockRestore();
  });
});
