import { describe, it, expect, vi } from 'vitest';
import { setup } from './helpers';

// ─── Custom directives ────────────────────────────────────────────────────────

describe('custom directive', () => {
  it('is called with correct params when value is set', () => {
    const cb = vi.fn();
    const { en, data, cleanup } = setup(`<div en-color="theme"></div>`);

    en.directive('color', cb);
    data.theme = 'red';

    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 'red',
        key: 'theme',
        isDelete: false,
      })
    );
    cleanup();
  });

  it('applies side effects to the element', () => {
    const { en, data, q, cleanup } = setup(`<div en-bg="color"></div>`);

    en.directive('bg', ({ el, value }) => {
      (el as HTMLElement).style.background = String(value);
    });

    data.color = 'blue';
    expect((q('div') as HTMLElement).style.background).toBe('blue');
    cleanup();
  });

  it('is called with isDelete=true on property deletion', () => {
    const cb = vi.fn();
    const { en, data, cleanup } = setup(`<div en-spy="prop"></div>`);

    en.directive('spy', cb);
    data.prop = 'hello';
    delete data.prop;

    const lastCall = cb.mock.calls.at(-1)![0];
    expect(lastCall.isDelete).toBe(true);
    cleanup();
  });

  it('does not register a directive twice (no-op on duplicate name)', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const { en, data, cleanup } = setup(`<div en-once="val"></div>`);

    en.directive('once', cb1);
    en.directive('once', cb2); // should be ignored

    data.val = 1;
    expect(cb1).toHaveBeenCalled();
    expect(cb2).not.toHaveBeenCalled();
    cleanup();
  });
});

// ─── Parametric directive ─────────────────────────────────────────────────────

describe('parametric directive', () => {
  it('receives param from the attribute value after the colon', () => {
    const cb = vi.fn();
    const { en, data, cleanup } = setup(
      `<div en-cls="isActive:active"></div>`
    );

    en.directive('cls', cb, true);
    data.isActive = true;

    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({ param: 'active', value: true })
    );
    cleanup();
  });

  it('toggles a CSS class based on value', () => {
    const { en, data, q, cleanup } = setup(
      `<div en-cls="isVisible:hidden"></div>`
    );

    en.directive('cls', ({ el, value, param }) => {
      if (param) el.classList.toggle(param, !!value);
    }, true);

    data.isVisible = true;
    expect(q('div').classList.contains('hidden')).toBe(true);

    data.isVisible = false;
    expect(q('div').classList.contains('hidden')).toBe(false);
    cleanup();
  });
});
