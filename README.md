# IKIGAI Guide Book — Landing Page

이키가이 가이드북 랜딩 페이지 (React, 반응형/모바일 대응).

## 파일
- `IkigaiLanding.jsx` — 단일 React 컴포넌트 (인라인 스타일, 모바일 반응형 적용)

## 사용
```jsx
import IkigaiLanding from './IkigaiLanding';
```

## Vercel 유입 링크

화면과 신청 항목은 동일하며, 슬러그별로 Google Sheet의 `시안` 값과 Telegram 알림을 구분합니다.

- `/uni`: `이키가이 가이드북 랜딩 / 대학생`
- `/job`: `이키가이 가이드북 랜딩 / 취준생`
- `/worker`: `이키가이 가이드북 랜딩 / 직장인`
- `/`: `이키가이 가이드북 랜딩`

기존 GitHub Pages 배포는 `/ikigai-landing/` 자산 경로를 계속 사용합니다.
