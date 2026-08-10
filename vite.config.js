import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages는 저장소 하위 경로, Vercel은 도메인 루트에서 자산을 서빙한다.
export default defineConfig({
  plugins: [react()],
  base: process.env.VERCEL ? '/' : '/ikigai-landing/',
});
