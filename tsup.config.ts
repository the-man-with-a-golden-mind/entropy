import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  globalName: 'Entropy',  // exposes window.Entropy in the browser
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,       // consumers can minify; keeping readable dist
  splitting: false,    // single-file output per format
  treeshake: true,
  target: 'es2020',
});
