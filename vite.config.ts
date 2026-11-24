import { readFileSync } from 'node:fs';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { defineConfig } from 'vitest/config';

// Ein einziger Build für zwei Ziele: GitHub Pages (dist/index.html samt Manifest und Icons)
// und die eingebettete Einzeldatei (dist/artifact.html, siehe scripts/artifact.mjs).
// Skript und Styles werden deshalb vollständig in die HTML-Datei eingebettet.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig(({ mode }) => ({
  define: {
    __BUILD_INFO__: JSON.stringify({
      version,
      builtAt: new Date().toISOString(),
      preview: mode !== 'production' || process.env.GITHUB_EVENT_NAME === 'pull_request',
    }),
  },
  base: './',
  plugins: [viteSingleFile()],
  build: { target: 'es2022', cssCodeSplit: false },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
}));
