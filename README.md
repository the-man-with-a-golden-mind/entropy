# entropy

A small reactive DOM library. No virtual DOM, no compiler, no JSX. You write plain HTML with a few extra attributes and plain JavaScript — entropy keeps them in sync.

The core idea is simple: wrap your data in `en.init()`, put `en-mark` on the elements that should display it, and that's most of what you need to know.

```html
<span en-mark="count">0</span>
<button onclick="data.count++">+</button>

<script src="dist/index.global.js"></script>
<script>
  window.data = Entropy.default.init();
  data.count = 0;
</script>
```

---

## Installation

```bash
npm install entropy-js
```

Or drop the IIFE build straight into your HTML — no bundler, no `node_modules`, no build step for consumers:

```html
<script src="https://cdn.jsdelivr.net/npm/entropy-js/dist/index.global.js"></script>
<script>
  const en = Entropy.default;
  window.data = en.init();
</script>
```

ESM import for bundled projects:

```js
import en from 'entropy-js';
const data = en.init();
```

---

## How it works

`en.init()` returns a `Proxy`. Setting a property on it triggers a DOM scan for elements whose directive attribute matches that key, then updates them. No diffing, no scheduling, no magic — just a `set` trap and `querySelectorAll`.

This makes entropy very fast for small-to-medium DOMs and straightforward to reason about. It also means the performance profile is different from virtual DOM frameworks: reads are free, writes are proportional to the size of the relevant DOM subtree.

---

## Directives

Directives are HTML attributes that tell entropy what to do with a value.

### `en-mark`

Sets `textContent` to the value. For objects, serialises to JSON.

```html
<span en-mark="user.name"></span>
<pre  en-mark="config"></pre>
```

### `en-if` / `en-ifnot`

Must be on a `<template>` element. Entropy moves the template's content into the DOM when the condition is met, and puts it back when it isn't.

```html
<template en-if="isLoggedIn">
  <nav>…</nav>
</template>

<template en-ifnot="isLoggedIn">
  <a href="/login">Sign in</a>
</template>
```

### Lists

Use `#` as a wildcard key to mark the item template:

```html
<ul>
  <li en-mark="items.#"></li>
</ul>
```

```js
data.items = ['one', 'two', 'three'];
data.items.push('four');
data.items.splice(1, 1);
```

Object arrays work the same way — nest keys inside the template:

```html
<ul>
  <li en-mark="users.#">
    <strong en-mark="users.#.name"></strong>
    <span   en-mark="users.#.email"></span>
  </li>
</ul>
```

### Custom directives

Register your own with `en.directive(name, callback, isParametric?)`.

```js
en.directive('attr', ({ el, value, param }) => {
  if (param) el.setAttribute(param, String(value));
}, true /* parametric */);
```

```html
<!-- en-attr="key:attribute-name" -->
<status-pill en-attr="card.status:status"></status-pill>
```

The callback receives:
- `el` — the DOM element
- `value` — current reactive value
- `param` — the part after the colon (parametric directives only)
- `key` — full key string
- `isDelete` — `true` when the key was deleted

---

## API

### `en.init()`

Returns the reactive data proxy. Idempotent — multiple calls return the same proxy.

### `en.computed(fn)`

Wraps a function so it re-runs automatically when its dependencies change. Assign the result to a reactive key.

```js
data.fullName = en.computed(() => `${data.first} ${data.last}`);
```

Async functions work too. Stale results from rapid successive changes are automatically discarded — only the most recent resolved value is applied.

```js
data.results = en.computed(async () => {
  const res = await fetch(`/api/search?q=${data.query}`);
  return res.json();
});
```

### `en.watch(key, fn)`

Calls `fn(newValue)` whenever the value at `key` or any of its children changes.

```js
en.watch('cart', () => recalculateTotal());
```

### `en.unwatch(key?, fn?)`

Removes watchers. Accepts any combination:

```js
en.unwatch();                    // remove everything
en.unwatch('cart');              // remove all watchers for this key
en.unwatch(undefined, handler); // remove this handler from all keys
en.unwatch('cart', handler);    // remove this handler from this key
```

### `en.batch(fn)`

Queues all reactive writes inside `fn` and flushes the DOM exactly once when it returns. Essential for bulk updates.

```js
en.batch(() => {
  data.loading = false;
  data.results = response.items;
  data.total   = response.total;
});
```

### `en.prefix(value?)`

Changes the directive prefix. Call before `en.init()`. Useful when entropy shares a page with other attribute-based tools.

```js
en.prefix('data-x');
// Use data-x-mark, data-x-if, data-x-ifnot, etc.
```

### `en.directive(name, callback, isParametric?)`

Registers a custom directive. Has no effect if the name is already registered.

### `en.register(...)`

Registers `<template name="…">` elements as Web Components backed by Shadow DOM. Accepts no arguments (scans the document), an element, a string of HTML, or a tagged-template literal.

```js
en.register`
  <template name="user-card">
    <style>:host { border: 1px solid #ddd; }</style>
    <slot name="name"></slot>
  </template>
`;
```

### `en.load(files)`

Fetches external HTML files and registers any templates inside them.

```js
await en.load(['components/card.html', 'components/modal.html']);
```

### `en.destroy()`

Removes all event listeners, clears watchers, marks the instance as destroyed. Updates stop. Use for teardown in SPAs or when destroying a widget.

---

## Multiple instances

The default export is a singleton — fine for most pages. For isolated widgets or micro-frontends that need separate reactive scopes:

```js
import { createInstance } from 'entropy-js';

const enA = createInstance();
const enB = createInstance();
enB.prefix('widget-b');

const dataA = enA.init();
const dataB = enB.init();
```

---

## Limits

These are not bugs — they are deliberate trade-offs given the no-build, no-VDOM approach.

**Scale.** `querySelectorAll` runs on every reactive write. With a small-to-medium DOM this is faster than virtual DOM diffing. Beyond ~2000–3000 active reactive elements the cost starts to compound, especially on replace-all operations. Use `en.batch()` for bulk writes.

**No key-based reconciliation.** When you reassign an array (`data.rows = newRows`), entropy removes all existing item elements and recreates them from the template. Preact and Vue can reuse DOM nodes by key — entropy cannot. For lists that update partially and frequently, mutate in place (`splice`, index assignment) rather than replacing the whole array.

**Reactive arrays are shallow.** `data.items.push(x)` works because entropy wraps the array in a Proxy. But methods that return a new array (`map`, `filter`, `reduce`) are not tracked — assign the result back to a reactive key to trigger updates.

```js
// won't update the DOM
data.items.filter(x => x.done);

// will
data.items = data.items.filter(x => x.done);
```

**No SSR.** Entropy reads and writes the live DOM. It has no concept of rendering to a string.

**Computed dependency tracking is key-based, not value-based.** A computed function re-runs when any key it accessed during its last execution is set — regardless of whether the new value actually differs. Avoid heavy work inside computed functions that depend on frequently-changing keys.

**`en-mark` on objects serialises to JSON.** There is no template syntax inside a mark value. If you need conditional rendering or structured output, use custom directives or nested elements with their own marks.

**One-way binding.** Directives update the DOM when data changes. They do not listen to DOM events and push changes back. Wire inputs yourself:

```html
<input oninput="data.name = this.value" en-mark="name" />
```

**Web Components require Shadow DOM support.** Named `<template>` registration uses `attachShadow`. This works in all modern browsers but has no fallback for older environments.

---

## License

MIT
