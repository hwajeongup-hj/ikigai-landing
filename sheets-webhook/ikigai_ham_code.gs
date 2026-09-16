/**
 * /ham 이키가이 랜딩 전용 탭. 기존 sheet_code.gs와 같은 Apps Script 프로젝트에 추가한다.
 * 신청 항목과 알림은 기존 이키가이 랜딩과 동일하며 저장 탭만 분리한다.
 */
function registerIkigaiHamCampaign() {
  SHEET_TAB_NAMES.Ikigai_Ham = '10월 이키 재능';
  TELEGRAM_NOTIFY_SHEETS.Ikigai_Ham = true;
  if (SHEET_SCHEMAS.Ikigai_Ham) return;
  var base = SHEET_SCHEMAS.Ikigai_Landing;
  var widths = {};
  Object.keys(base.columnWidths || {}).forEach(function (column) {
    widths[column] = base.columnWidths[column];
  });
  SHEET_SCHEMAS.Ikigai_Ham = {
    headers: base.headers.slice(),
    valueFns: base.valueFns.slice(),
    columnWidths: widths
  };
}

// 신규 탭과 헤더만 준비한다. 실제 신청 행이나 외부 알림, 트리거는 생성하지 않는다.
function setupIkigaiHamSheet() {
  registerIkigaiHamCampaign();
  var sheet = getOrCreateSheet('Ikigai_Ham', { sheetTab: 'Ikigai_Ham' });
  ensureSchemaHeaders(sheet, SHEET_SCHEMAS.Ikigai_Ham);
  return { ok: true, sheetId: 'Ikigai_Ham', sheet: sheet.getName(), columns: readHeaderRow(sheet).length };
}

// 운영 준비 여부만 확인한다. 정확한 대상 탭의 헤더만 읽으며 누락된 탭/열을 만들지 않는다.
function checkIkigaiHamReadiness() {
  registerIkigaiHamCampaign();
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet && spreadsheet.getSheetByName('10월 이키 재능');
  if (!sheet) throw new Error('10월 이키 재능 접수 준비 상태를 확인할 수 없습니다.');
  var headers = readHeaderRow(sheet);
  var complete = withCampaignMonthHeader(SHEET_SCHEMAS.Ikigai_Landing.headers).every(function (header) {
    return headers.indexOf(header) !== -1 && headers.indexOf(header) === headers.lastIndexOf(header);
  });
  if (!complete) throw new Error('10월 이키 재능 접수 준비 상태를 확인할 수 없습니다.');
  return { ok: true, ready: true, sheetId: 'Ikigai_Ham', sheet: '10월 이키 재능', schemaVersion: 'ikigai-ham-v1' };
}
