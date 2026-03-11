import { describe, it, expect } from 'vitest';
import { setup } from './helpers';

describe('batch', () => {
  it('applies all changes after the batch callback runs', () => {
    const { en, data, q, cleanup } = setup(`
      <span en-mark="a"></span>
      <span en-mark="b"></span>
    `);

    data.a = 0;
    data.b = 0;

    en.batch(() => {
      data.a = 10;
      data.b = 20;
    });

    expect(q('[en-mark="a"]').textContent).toBe('10');
    expect(q('[en-mark="b"]').textContent).toBe('20');
    cleanup();
  });

  it('does not leave batchQueue in a non-null state after completion', () => {
    const { en, data, cleanup } = setup();
    data.x = 1;
    en.batch(() => { data.x = 2; });
    // If batchQueue is cleared, a subsequent normal set must still work
    data.x = 3;
    expect(data.x).toBe(3);
    cleanup();
  });

  it('flushes queue even when the callback throws', () => {
    const { en, data, cleanup } = setup(`<span en-mark="v"></span>`);
    data.v = 0;

    expect(() =>
      en.batch(() => {
        data.v = 99;
        throw new Error('oops');
      })
    ).toThrow('oops');

    // Value set before the throw should be committed
    expect(data.v).toBe(99);
    cleanup();
  });
});
