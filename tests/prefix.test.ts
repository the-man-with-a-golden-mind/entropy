import { describe, it, expect } from 'vitest';
import { createInstance } from '../src/instance';

describe('prefix()', () => {
  it('auto-appends hyphen if missing', () => {
    const en = createInstance();
    en.prefix('data');
    expect((en as any).ctx.prefix).toBe('data-');
    en.destroy();
  });

  it('does not double-append hyphen', () => {
    const en = createInstance();
    en.prefix('data-');
    expect((en as any).ctx.prefix).toBe('data-');
    en.destroy();
  });

  it('uses custom prefix for directive attribute matching', () => {
    const en = createInstance();
    en.prefix('x');

    const el = document.createElement('span');
    el.setAttribute('x-mark', 'msg');
    document.body.appendChild(el);

    const data = en.init();
    data.msg = 'hello';

    expect(el.textContent).toBe('hello');

    el.remove();
    en.destroy();
  });
});
