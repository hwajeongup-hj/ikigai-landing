import React from 'react';
import ReactDOM from 'react-dom/client';
import IkigaiLanding from './IkigaiLanding.jsx';

// 페이지 기본 여백 제거 — 섹션이 화면 끝까지 채워지도록
const globalStyle = document.createElement('style');
globalStyle.textContent = `* { box-sizing: border-box; } html, body { margin: 0; padding: 0; }`;
document.head.appendChild(globalStyle);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <IkigaiLanding />
  </React.StrictMode>
);
