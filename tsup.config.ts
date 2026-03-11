// tsup.config.ts
export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    minify: false,   // ← czytelny build dla bundlerów
    splitting: false,
    treeshake: true,
    target: 'es2020',
  },
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'Entropy',
    outExtension: () => ({ js: '.global.min.js' }),
    sourcemap: true,
    minify: true,    // ← minified IIFE dla <script src>
    splitting: false,
    treeshake: true,
    target: 'es2020',
  },
]);