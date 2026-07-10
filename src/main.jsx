import React from 'react';
import ReactDOM from 'react-dom/client';
import IkigaiLanding from './IkigaiLanding.jsx';

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
    <IkigaiLanding />
  </React.StrictMode>
);
