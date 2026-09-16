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

`/ham` 신청 payload는 탭 이름 변경에 영향받지 않는 논리 ID `sheetTab: 'Ikigai_Ham'`을 사용합니다. 대상 탭 표시명은 `10월 이키 재능 햄찌`입니다. 기존 탭(ID `1408861281`)의 이름과 Apps Script 매핑을 함께 변경했으며, 구명칭으로 보내는 신청도 같은 탭에 연결됩니다.

`/`, `/uni`, `/job`, `/worker`는 고양이와 `sheetTab: 'Ikigai_Landing'`을 계속 사용합니다. 운영 Apps Script 원본 백업에서 이 논리 ID가 실제 표시명 `이키가이 기존`에 연결됨을 확인했습니다. 기존 `no-cors` 방식과 신청 항목은 유지합니다.

운영 Google Apps Script 버전 48에서 이름 변경을 반영하고, 논리 ID와 구명칭의 읽기 전용 준비 점검이 모두 새 탭을 가리키는 것을 확인했습니다. 실제 신청 행이나 알림을 생성하는 시험 접수는 하지 않았습니다.

변경 범위와 검증 기록은 `HAM_LANDING_SYNC.md`에 정리합니다.

기존 GitHub Pages 배포는 `/ikigai-landing/` 자산 경로를 계속 사용합니다.
