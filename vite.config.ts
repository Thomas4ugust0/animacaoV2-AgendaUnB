import { defineConfig } from 'vite';
// Local Node middleware; excluded from the browser bundle.
// @ts-ignore JavaScript plugin keeps the export tools independently executable.
import { exportApiPlugin } from './scripts/export-api.mjs';

export default defineConfig({
  plugins: [exportApiPlugin()],
  server: { host: '127.0.0.1', port: 5180, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173 },
});
