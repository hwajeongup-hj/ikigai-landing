import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';

// 새 시안의 스타일과 자산은 해당 경로에서만 불러옵니다.
const GuideLanding = lazy(() => import('./GuideLanding.jsx'));
const IkigaiLanding = lazy(() => import('./IkigaiLanding.jsx'));
const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
const isGuide = pathname === '/guide' || pathname === '/ikigai-landing/guide';
const Landing = isGuide ? GuideLanding : IkigaiLanding;

// 페이지 기본 여백 제거 — 섹션이 화면 끝까지 채워지도록
const globalStyle = document.createElement('style');
globalStyle.textContent = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  }
  button, input, textarea, select {
    font-family: inherit;
  }
  svg text {
    font-family: Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  }
`;
document.head.appendChild(globalStyle);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<div role="status" style={{ padding: '48px 24px', color: '#245E4A' }}>페이지를 불러오고 있습니다.</div>}>
      <Landing />
    </Suspense>
  </React.StrictMode>
);

