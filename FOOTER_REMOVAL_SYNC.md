# 이키가이 랜딩 하단 로고 제거 — 2026-09-08

- 요청: 제공된 스크린샷에 있는 최하단 위잇 로고 영역만 제거.
- 범위 확정: `WE-IT`, `CONNECT · LEARN · GROW`를 포함한 footer와 해당 영역의 구분선·여백을 삭제.
- 검토: 사용자 심리·MBTI별 행동 동기를 새로 가정할 필요가 없는 시각 요소 삭제이며, 신청 흐름이나 타깃별 콘텐츠 변경은 없음. 제공된 스크린샷과 실제 코드가 같은 영역임을 확인함.
- 구현: `src/IkigaiLanding.jsx`의 마지막 footer 삭제. 신청폼 내부의 WE-IT 안내 문장은 유지.
- 검증: `VERCEL=1 npm run build` 성공, 로컬 브라우저에서 참고 영상이 마지막 섹션으로 표시되고 하단 로고가 사라진 것을 확인.
- 배포 대상: 기존 GitHub `main` → Vercel 연동, <https://ikigai-landing-three.vercel.app/>.
