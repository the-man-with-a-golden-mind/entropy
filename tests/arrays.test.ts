import { describe, it, expect } from 'vitest';
import { setup } from './helpers';

// ─── Array rendering ──────────────────────────────────────────────────────────

describe('Array rendering', () => {
  it('renders initial array items into the DOM', () => {
    const { data, qAll, cleanup } = setup(`
      <ul>
        <li en-mark="items.#"></li>
      </ul>
    `);

    data.items = ['apple', 'banana', 'cherry'];
    const lis = qAll('li:not([en-mark$=".#"])');
    // 3 real items + 1 template placeholder = qAll finds items with concrete keys
    const items = qAll<HTMLElement>('li[en-mark^="items."][en-mark$="items.#"]');
    // simpler: just count li elements that are NOT the template
    const realLis = qAll<HTMLElement>('li').filter(
      el => !el.getAttribute('en-mark')?.endsWith('#')
    );
    expect(realLis.length).toBe(3);
    cleanup();
  });

  it('push adds a new element to the DOM', () => {
    const { data, container, cleanup } = setup(`
      <ul><li en-mark="list.#"></li></ul>
    `);

    data.list = ['a', 'b'];
    const before = container.querySelectorAll(
      'li:not([en-mark$="#"])'
    ).length;

    data.list.push('c');

    const after = container.querySelectorAll(
      'li:not([en-mark$="#"])'
    ).length;

    expect(after).toBe(before + 1);
    cleanup();
  });

  it('replaces all items when array is reassigned', () => {
    const { data, container, cleanup } = setup(`
      <ul><li en-mark="items.#"></li></ul>
    `);

    data.items = ['x', 'y', 'z'];
    data.items = ['only'];

    const realLis = Array.from(
      container.querySelectorAll('li')
    ).filter(el => !el.getAttribute('en-mark')?.endsWith('#'));

    expect(realLis.length).toBe(1);
    cleanup();
  });
});

// ─── en-ifnot with empty array ────────────────────────────────────────────────

describe('Empty list conditional', () => {
  it('shows empty state template when array has no items', () => {
    const { data, container, cleanup } = setup(`
      <ul><li en-mark="items.#"></li></ul>
      <template en-ifnot="items.length">
        <p id="empty">No items</p>
      </template>
    `);

    data.items = [];
    expect(container.querySelector('#empty')).not.toBeNull();
    cleanup();
  });

  it('hides empty state when items are added', () => {
    const { data, container, cleanup } = setup(`
      <ul><li en-mark="items.#"></li></ul>
      <template en-ifnot="items.length">
        <p id="empty">No items</p>
      </template>
    `);

    data.items = [];
    data.items.push('first');

    expect(container.querySelector('#empty')).toBeNull();
    cleanup();
  });
});
