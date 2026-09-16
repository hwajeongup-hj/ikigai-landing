# 이키가이 `/ham` 신청 탭

기존 웹훅 Apps Script 프로젝트에 `ikigai_ham_code.gs`를 추가한다. 원본 이키가이 폼의 스키마를 복사해 `Ikigai_Ham`과 한글 이름 `10월 이키 재능 햄찌`를 같은 탭으로 연결한다. 이전 이름 `10월 이키 재능`은 `SHEET_TAB_ALIASES.Ikigai_Ham`으로 호환하므로 이전 페이지에서 보낸 신청도 새 이름의 동일 탭에 저장된다.

기존 `Code.gs`에는 다음 세 곳만 추가한다.

1. `doPost`의 `registerCareer10CCampaign()` 호출 다음 줄:

   ```js
   if (typeof registerIkigaiHamCampaign === 'function') registerIkigaiHamCampaign();
   ```

2. `doPost`의 `assertAllowedSheetName(sheetName);` 다음 줄:

   ```js
   if (sheetName === 'Ikigai_Ham' && data.action === 'ikigai_ham_readiness') {
     return jsonResponse(checkIkigaiHamReadiness());
   }
   ```

3. `buildTelegramMessage`의 `isIkigaiLanding` 조건에 다음 두 항목을 추가한다:

   ```js
   sheetName === 'Ikigai_Ham' ||
   data.sheetTab === '10월 이키 재능' ||
   ```

편집기에서 `setupIkigaiHamSheet()`를 한 번 실행한 뒤 기존 웹 앱 배포를 새 버전으로 업데이트한다. 이 함수는 `10월 이키 재능 햄찌` 탭과 기존 이키가이 항목을 가진 헤더만 준비하고 신청 데이터나 메시지를 생성하지 않는다. 이전 이름의 탭만 존재하면 해당 탭을 재사용해 이름을 변경한다. 이름 변경에 따른 추가 `Code.gs` 수정은 필요하지 않다.

배포된 웹훅에 `{ "sheetTab": "10월 이키 재능 햄찌", "action": "ikigai_ham_readiness" }`을 POST하면 헤더만 읽어 준비 여부를 확인한다. 성공 응답에는 `ok: true`, `ready: true`, `sheetId: "Ikigai_Ham"`, `sheet: "10월 이키 재능 햄찌"`, `schemaVersion: "ikigai-ham-v1"`이 포함된다. 영문 ID나 이전 한글 이름으로 요청해도 동일하게 확인한다. 캠페인 월 값은 기존 운영 기간 설정으로 계산하며 탭 이름의 10월에서 추정하지 않는다.

로컬 검증: `node --test sheets-webhook/ikigai_ham.test.mjs`. 테스트는 인접한 `../preview-deploy/sheets-webhook/sheet_code.gs`를 읽어 세 변경을 메모리에서만 적용한다. 실제 시트나 외부 알림에 접근하지 않는다.

운영 코드 백업으로 검증할 때는 `IKIGAI_WEBHOOK_SOURCE=/private/tmp/ikigai-ham-20260917/Code.original.gs node --test sheets-webhook/ikigai_ham.test.mjs`처럼 환경 변수로 원본 경로를 지정한다.

## 운영 적용 결과 — 2026-09-17

- 운영 Apps Script에는 이 모듈을 `IkigaiHam.gs` 이름으로 추가하고 위 `Code.gs` 3곳을 적용했다. 저장 후 코드를 다시 읽어 의도한 내용과 일치함을 확인했다.
- 초기 버전 47 배포 후 탭 이름 변경을 반영한 운영 모듈을 로컬 파일과 정확히 일치하게 저장하고, 동일한 기존 웹 앱 배포를 버전 **48**로 업데이트했다. 최신 배포 시각은 **2026-09-17 01:21 KST**이며 기존 웹훅 URL을 유지한다.
- 기존 탭을 `10월 이키 재능 햄찌`로 변경했다. 탭 ID `1408861281`은 유지되었고 메타데이터로 확인했다. 최초 생성 후 Google Sheets 커넥터로 `A1:O2`를 확인해 15개 헤더만 있고 신청 데이터는 없음을 확인했다.
- 브라우저에서도 녹색 헤더, 헤더 행 고정, 빈 신청 데이터 영역을 시각 확인했다.
- 버전 48에서 `Ikigai_Ham` 및 구명칭 `10월 이키 재능`으로 실제 준비 점검을 실행해 모두 `{ "ok": true, "ready": true, "sheetId": "Ikigai_Ham", "sheet": "10월 이키 재능 햄찌", "schemaVersion": "ikigai-ham-v1" }` 응답을 확인했다.
- 실제 운영 `Code.gs` 원본 및 패치 백업을 사용한 Node VM 테스트 **8/8 통과**. 원본 필드 매핑, 기존 탭 격리, 신규 이름·이전 이름·영문 ID 라우팅, 준비 점검의 읽기 전용 동작, 누락·중복 헤더 거절, 알림 분류, 기존 탭 재사용과 중복 탭 거절을 검증했다.
- 운영 확인 과정에서 실제 신청이나 외부 메시지를 만들지 않았다. 준비 점검은 신청 저장의 실전 제출 테스트가 아니며, 프런트엔드의 기존 `no-cors` 응답 처리 방식은 유지된다.
