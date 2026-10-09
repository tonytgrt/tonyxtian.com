import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 5173 is taken: nginx proxies /webgpu_renderer to a dev server there.
  server: {port: 5174, strictPort: true},
  preview: {port: 5175},
  build: {
    // scripts/prerender.ts reads it to find the hashed images for share cards.
    manifest: true,
  },
});
