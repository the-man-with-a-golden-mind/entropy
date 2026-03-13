# uentropy – AI reference

Reactive DOM library. No vDOM, no compiler, no JSX. Plain HTML + JS.

## Setup
```html
<script src="https://cdn.jsdelivr.net/npm/uentropy/dist/entropy.min.js"></script>
<script>
  const en = UEntropy.default;
  en.prefix('x');         // optional, BEFORE init
  en.directive(...);      // optional, BEFORE init
  window.data = en.init(); // starts reactivity
  data.count = 0;         // assign keys AFTER init
</script>
```
ESM: `import en from 'uentropy'`
Multi-instance: `const { createInstance } = UEntropy; const en = createInstance();`

## Core mechanics
`en.init()` returns a Proxy. Setting any key triggers `querySelectorAll` for matching directive attributes → updates DOM. No diffing. Results cached, invalidated by MutationObserver.

Always assign parent before children — the proxy won't track keys on an object it hasn't seen yet:
```js
data.user = {};        // parent first — required
data.user.name = '';   // then children
// WRONG: data.user.name = '' without data.user = {} first -> silent fail, not reactive
```

`window.data` needed for inline `onclick="data.x++"`. Local `const` fine with `addEventListener`.

## Directives

**`en-mark="key"`** — sets `textContent`. Objects serialise to JSON. No template syntax inside.

**`en-model="key"`** — two-way binding. Types written: number input→number, checkbox→boolean, radio/select→string, rest→string. No manual event handler needed.

**`en-if="key"` / `en-ifnot="key"`** — MUST be on `<template>`. Moves content in/out of DOM.

**Lists** — use `#` as wildcard:
```html
<ul>
  <li en-mark="items.#">
    <strong en-mark="items.#.name"></strong>
  </li>
</ul>
```
```js
data.items = [{name:'Alice'}]; // set
data.items.push({name:'Bob'}); // appends one node
data.items.splice(1, 1);       // removes one node
data.items[0] = {name:'Eve'};  // updates in place
data.items = [...];            // DESTROYS + recreates all nodes — avoid for frequent updates
```
Shallow tracking: `push/splice/index` tracked. `map/filter/reduce` are NOT — reassign result: `data.items = data.items.filter(...)`.

**`delete data.key`** — removes bound DOM element.

**Custom directive** (BEFORE init):
```js
en.directive('color', ({ el, value, param, key, isDelete }) => {
  el.style.color = String(value);
});
// parametric (en-attr="key:href"):
en.directive('attr', ({ el, value, param }) => {
  if (param) el.setAttribute(param, String(value));
}, true);
```

## API

`en.init()` — returns reactive proxy. Idempotent.

`en.computed(fn)` — auto-reruns when dependencies change. Assign to key. Async supported (stale results discarded). Key-based tracking, reevaluated each run.
```js
data.sum = en.computed(() => data.a + data.b);

// async pattern — use a loading flag
data.loading = false;
data.result = en.computed(async () => {
  data.loading = true;
  const res = await fetch(`/api/${data.id}`);
  data.loading = false;
  return res.json();
});
```
```html
<template en-if="loading"><p>Loading…</p></template>
<template en-ifnot="loading">
  <h1 en-mark="result.title"></h1>
</template>
```

`en.watch(key, fn)` — calls `fn(newValue)` on key/children change.

`en.unwatch(key?, fn?)` — removes watchers. No args = remove all.

`en.batch(fn)` — queues all writes in `fn`, single DOM flush. Always use for bulk updates.

`en.prefix(str)` — changes `en-` prefix. BEFORE `init()`.

`en.register(...)` — registers `<template name="…">` elements as Web Components backed by Shadow DOM. Accepts: no args (scans document), element, string, or tagged-template literal.
```js
en.register`
  <template name="user-card">
    <style>:host { border: 1px solid #ddd; }</style>
    <slot name="name"></slot>
  </template>
`;
```
```html
<user-card>
  <span slot="name" en-mark="user.name"></span>
</user-card>
```

`en.load(files[])` — fetches external HTML files, registers any `<template name="…">` found inside. Async.
```js
await en.load(['components/card.html', 'components/modal.html']);
```

`en.destroy()` — removes all listeners/watchers.

## Conflicts & limits
- `en-mark` + `en-model` on same element → don't
- `en-model` + `en.computed()` on same key → computed overwrites user input → don't
- Custom directives after `init()` → ignored for existing DOM elements
- ~2000–3000 reactive elements is practical ceiling; use `batch()` for bulk writes
- Array replace = full DOM destroy+recreate; mutate in place when possible
- No SSR, no key-based list reconciliation