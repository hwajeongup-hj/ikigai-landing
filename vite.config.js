import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages는 https://<user>.github.io/<repo>/ 경로로 서빙되므로 base 지정 필요
export default defineConfig({
  plugins: [react()],
  base: '/ikigai-landing/',
});
