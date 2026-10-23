import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vercel과 동일한 접수 핸들러를 로컬에서도 실행합니다.
function applicationsApi() {
  return {
    name: 'ikigai-applications-api',
    configureServer(server) {
      server.middlewares.use('/api/applications', async (req, res) => {
        const { default: handler } = await import('./api/applications.js');
        let bytes = 0;
        const chunks = [];
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes > 12000) {
            res.writeHead(413, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
            res.end(JSON.stringify({ ok: false, error: '입력 내용이 너무 깁니다.' }));
            return;
          }
          chunks.push(chunk);
        }
        req.body = Buffer.concat(chunks).toString('utf8');
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (body) => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(body)); return res; };
        await handler(req, res);
      });
    },
  };
}

// GitHub Pages는 저장소 하위 경로, Vercel은 도메인 루트에서 자산을 서빙한다.
export default defineConfig({
  plugins: [react(), applicationsApi()],
  cacheDir: '.cache/vite',
  base: process.env.VERCEL ? '/' : '/ikigai-landing/',
});

