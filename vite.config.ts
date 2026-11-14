import { viteSingleFile } from 'vite-plugin-singlefile';
import { defineConfig } from 'vitest/config';

// Ein einziger Build für zwei Ziele: GitHub Pages (dist/index.html samt Manifest und Icons)
// und die eingebettete Einzeldatei (dist/artifact.html, siehe scripts/artifact.mjs).
// Skript und Styles werden deshalb vollständig in die HTML-Datei eingebettet.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { target: 'es2022', cssCodeSplit: false },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
