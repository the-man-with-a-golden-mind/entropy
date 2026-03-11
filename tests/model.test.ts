import { describe, it, expect } from 'vitest';
import { setup, tick } from './helpers';

describe('en-model — text inputs', () => {
  it('sets input value when data changes', () => {
    const { data, q, cleanup } = setup(`<input en-model="name" />`);
    data.name = 'Alice';
    expect(q<HTMLInputElement>('input').value).toBe('Alice');
    cleanup();
  });

  it('updates data when user types', () => {
    const { data, q, cleanup } = setup(`<input en-model="name" />`);
    data.name = '';

    const input = q<HTMLInputElement>('input');
    input.value = 'Bob';
    input.dispatchEvent(new Event('input'));

    expect(data.name).toBe('Bob');
    cleanup();
  });

  it('reflects subsequent data changes to DOM', () => {
    const { data, q, cleanup } = setup(`<input en-model="city" />`);
    data.city = 'Warsaw';
    data.city = 'Krakow';
    expect(q<HTMLInputElement>('input').value).toBe('Krakow');
    cleanup();
  });

  it('does not set value when it already matches (avoids cursor jump)', () => {
    const { data, q, cleanup } = setup(`<input en-model="text" />`);
    data.text = 'hello';
    const input = q<HTMLInputElement>('input');
    // Simulate user having typed something that matches current data
    input.value = 'hello';
    const before = input.value;
    data.text = 'hello'; // same value — should not reassign
    expect(input.value).toBe(before);
    cleanup();
  });
});

describe('en-model — number input', () => {
  it('writes a number to data (not a string)', () => {
    const { data, q, cleanup } = setup(`<input type="number" en-model="qty" />`);
    data.qty = 5;

    const input = q<HTMLInputElement>('input');
    input.value = '10';
    input.dispatchEvent(new Event('input'));

    expect(typeof data.qty).toBe('number');
    expect(data.qty).toBe(10);
    cleanup();
  });
});

describe('en-model — checkbox', () => {
  it('reflects data boolean to checked state', () => {
    const { data, q, cleanup } = setup(`<input type="checkbox" en-model="active" />`);
    data.active = true;
    expect(q<HTMLInputElement>('input').checked).toBe(true);
    data.active = false;
    expect(q<HTMLInputElement>('input').checked).toBe(false);
    cleanup();
  });

  it('writes boolean to data on change', () => {
    const { data, q, cleanup } = setup(`<input type="checkbox" en-model="active" />`);
    data.active = false;

    const cb = q<HTMLInputElement>('input');
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));

    expect(data.active).toBe(true);
    cleanup();
  });
});

describe('en-model — select', () => {
  it('sets select value from data', () => {
    const { data, q, cleanup } = setup(`
      <select en-model="color">
        <option value="red">Red</option>
        <option value="green">Green</option>
        <option value="blue">Blue</option>
      </select>
    `);
    data.color = 'green';
    expect(q<HTMLSelectElement>('select').value).toBe('green');
    cleanup();
  });

  it('writes selected value to data on change', () => {
    const { data, q, cleanup } = setup(`
      <select en-model="color">
        <option value="red">Red</option>
        <option value="green">Green</option>
      </select>
    `);
    data.color = 'red';

    const sel = q<HTMLSelectElement>('select');
    sel.value = 'green';
    sel.dispatchEvent(new Event('change'));

    expect(data.color).toBe('green');
    cleanup();
  });
});

describe('en-model — textarea', () => {
  it('syncs textarea value bidirectionally', () => {
    const { data, q, cleanup } = setup(`<textarea en-model="bio"></textarea>`);
    data.bio = 'Hello world';
    expect(q<HTMLTextAreaElement>('textarea').value).toBe('Hello world');

    const ta = q<HTMLTextAreaElement>('textarea');
    ta.value = 'Updated';
    ta.dispatchEvent(new Event('input'));

    expect(data.bio).toBe('Updated');
    cleanup();
  });
});

describe('en-model — computed interaction', () => {
  it('computed that depends on model key updates when user types', () => {
    const { en, data, q, cleanup } = setup(`
      <input en-model="first" />
      <span en-mark="full"></span>
    `);
    data.first = 'Jane';
    data.full  = en.computed(() => `${data.first} Doe`);

    const input = q<HTMLInputElement>('input');
    input.value = 'John';
    input.dispatchEvent(new Event('input'));

    expect(q('span').textContent).toBe('John Doe');
    cleanup();
  });
});
