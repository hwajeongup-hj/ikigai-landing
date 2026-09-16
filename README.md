# IKIGAI Guide Book — Landing Page

이키가이 가이드북 랜딩 페이지 (React, 반응형/모바일 대응).

## 파일
- `IkigaiLanding.jsx` — 단일 React 컴포넌트 (인라인 스타일, 모바일 반응형 적용)

## 사용
```jsx
import IkigaiLanding from './IkigaiLanding';
```

## Vercel 유입 링크

기존 경로는 화면과 신청 항목이 동일하며, 슬러그별로 Google Sheet의 `시안` 값과 Telegram 알림을 구분합니다.

- `/uni`: `이키가이 가이드북 랜딩 / 대학생`
- `/job`: `이키가이 가이드북 랜딩 / 취준생`
- `/worker`: `이키가이 가이드북 랜딩 / 직장인`
- `/`: `이키가이 가이드북 랜딩`
- `/ham`: `이키가이 가이드북 랜딩 / 햄찌`

### 햄찌 랜딩

`https://ikigai-landing-three.vercel.app/ham`은 기존 페이지를 공유하되, 첫 화면의 고양이를 사용자가 제공한 햄스터 이미지로 교체합니다. 캐릭터의 모바일 222px / PC 264px 너비, 원본 비율, 검정 섹션에 붙는 하단 배치를 유지합니다. 문구와 신청 항목은 기존 페이지와 같습니다.

`/ham` 신청 payload는 `sheetTab: '10월 이키 재능'`을 사용합니다. `/`, `/uni`, `/job`, `/worker`는 고양이와 기존 `Ikigai_Landing` 탭을 계속 사용합니다. 운영 Google Apps Script 버전 47에 신규 탭 분기를 반영했고, 읽기 전용 준비 확인 요청과 시트 헤더 확인을 완료했습니다. 기존 `no-cors` 방식은 유지하며, 실제 신청 행이나 알림을 생성하는 시험 접수는 하지 않았습니다.

변경 범위와 검증 기록은 `HAM_LANDING_SYNC.md`에 정리합니다.

기존 GitHub Pages 배포는 `/ikigai-landing/` 자산 경로를 계속 사용합니다.
