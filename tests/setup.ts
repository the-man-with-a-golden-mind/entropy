/**
 * tests/setup.ts
 *
 * Bootstraps a full DOM environment for bun test (and vitest when used as
 * a setupFile). happy-dom's GlobalRegistrator injects window, document,
 * navigator, etc. into the global scope so DOM APIs work in Node/Bun.
 */
import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();

// Make sure each test starts with a clean body
beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  document.body.innerHTML = '';
});
