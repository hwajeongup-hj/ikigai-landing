import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const originalCode = readFileSync(process.env.IKIGAI_WEBHOOK_SOURCE || new URL('../../preview-deploy/sheets-webhook/sheet_code.gs', import.meta.url), 'utf8');
const moduleCode = readFileSync(new URL('./ikigai_ham_code.gs', import.meta.url), 'utf8');

// Same three integration edits documented in README; the source file remains untouched.
function withIntegration(code) {
  const edits = [
    ["    if (typeof registerCareer10CCampaign === 'function') registerCareer10CCampaign();",
      "    if (typeof registerCareer10CCampaign === 'function') registerCareer10CCampaign();\n    if (typeof registerIkigaiHamCampaign === 'function') registerIkigaiHamCampaign();"],
    ['    assertAllowedSheetName(sheetName);',
      "    assertAllowedSheetName(sheetName);\n    if (sheetName === 'Ikigai_Ham' && data.action === 'ikigai_ham_readiness') return jsonResponse(checkIkigaiHamReadiness());"],
    ["  var isIkigaiLanding =\n    sheetName === 'Ikigai_Landing' ||",
      "  var isIkigaiLanding =\n    sheetName === 'Ikigai_Ham' ||\n    data.sheetTab === '10월 이키 재능' ||\n    sheetName === 'Ikigai_Landing' ||"],
  ];
  for (const [before, after] of edits) {
    if (code.includes(after)) continue;
    assert.equal(code.split(before).length - 1, 1, `Expected one integration anchor: ${before}`);
    code = code.replace(before, after);
  }
  return code;
}

function fixture() {
  const sheets = new Map();
  const calls = { lookup: [], reads: [], writes: [], notified: [], overview: [], locks: 0 };
  function addSheet(name, rows = []) {
    const sheet = {
      rows: rows.map(row => [...row]),
      getName: () => name,
      getLastRow: () => sheet.rows.length,
      getLastColumn: () => Math.max(0, ...sheet.rows.map(row => row.length)),
      appendRow(row) { calls.writes.push({ name, kind: 'append', row: [...row] }); sheet.rows.push([...row]); },
      setFrozenRows() {}, setFrozenColumns() {}, setColumnWidth() {},
      setName(next) { calls.writes.push({ name, kind: 'rename', next }); sheets.delete(name); name = next; sheets.set(name, sheet); },
      insertColumnBefore(column) { sheet.rows.forEach(row => row.splice(column - 1, 0, '')); },
      getRange(row, column, rowCount = 1, columnCount = 1) {
        const range = {
          getValues() {
            calls.reads.push({ name, row, rowCount });
            return Array.from({ length: rowCount }, (_, r) => Array.from({ length: columnCount }, (_, c) => sheet.rows[row - 1 + r]?.[column - 1 + c] ?? ''));
          },
          setValue(value) {
            calls.writes.push({ name, kind: 'cell', row, column });
            sheet.rows[row - 1] ??= [];
            sheet.rows[row - 1][column - 1] = value;
            return range;
          },
          setFontWeight() { return range; }, setBackground() { return range; }, setFontColor() { return range; },
        };
        return range;
      },
    };
    sheets.set(name, sheet);
    return sheet;
  }
  const spreadsheet = {
    getSheetByName(name) { calls.lookup.push(name); return sheets.get(name) ?? null; },
    insertSheet(name) { calls.writes.push({ name, kind: 'create' }); return addSheet(name); },
  };
  const sandbox = {
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet },
    Logger: { log() {} },
    UrlFetchApp: { fetch() { throw new Error('Unexpected network access'); } },
    Utilities: { formatDate: () => '2026-09-17 12:00:00' },
    LockService: { getScriptLock() {
      calls.locks++;
      let held = false;
      return { tryLock() { held = true; return true; }, hasLock: () => held, releaseLock() { held = false; } };
    } },
  };
  vm.createContext(sandbox);
  vm.runInContext(withIntegration(originalCode) + '\n' + moduleCode, sandbox);
  // Unrelated integration points are isolated; the routing, schema and sheet helpers are real.
  sandbox.jsonResponse = value => JSON.parse(JSON.stringify(value));
  sandbox.claimSubmissionDeduplication = () => null;
  sandbox.resolveCampaignMonth = () => '기존 운영 기간';
  sandbox.notifyTelegramOnNewSubmission = (...args) => { calls.notified.push(args); return { ok: true }; };
  sandbox.appendCampaignOverviewDashboardSubmission = (...args) => calls.overview.push(args);
  return { sandbox, sheets, calls, addSheet };
}

const values = {
  variant: '이키가이 가이드북 랜딩 / 햄찌', name: '가상 신청자', phone: '01000000000',
  birthdate: '2000-01-01', address: '검증용 지역', occupation: '검증용 학교', concern: '검증용 고민',
  pageUrl: 'https://example.test/ham', utmSource: 'test', utmMedium: 'fixture', utmCampaign: 'ham',
  userAgent: 'local-test', referrer: 'https://example.test/',
};
const request = data => ({ postData: { contents: JSON.stringify(data) } });
const HAM_TAB = '10월 이키 재능 햄찌';
const HAM_PREVIOUS_TAB = '10월 이키 재능';

test('campaign registration copies the original schema without sharing mutable arrays or widths', () => {
  const { sandbox: s } = fixture();
  const base = s.SHEET_SCHEMAS.Ikigai_Landing;
  const before = JSON.stringify(base);
  s.registerIkigaiHamCampaign();
  s.registerIkigaiHamCampaign();
  const ham = s.SHEET_SCHEMAS.Ikigai_Ham;
  assert.equal(s.SHEET_TAB_NAMES.Ikigai_Ham, HAM_TAB);
  assert.deepEqual([...s.SHEET_TAB_ALIASES.Ikigai_Ham], [HAM_PREVIOUS_TAB]);
  assert.equal(s.TELEGRAM_NOTIFY_SHEETS.Ikigai_Ham, true);
  assert.deepEqual([...ham.headers], [...base.headers]);
  assert.deepEqual([...ham.valueFns], [...base.valueFns]);
  assert.notEqual(ham.headers, base.headers);
  assert.notEqual(ham.valueFns, base.valueFns);
  assert.notEqual(ham.columnWidths, base.columnWidths);
  ham.headers.push('test'); ham.columnWidths[1] = 999;
  assert.equal(JSON.stringify(base), before);
});

test('setup creates only target header row and is repeatable without data rows or notifications', () => {
  const { sandbox: s, calls, sheets, addSheet } = fixture();
  const original = addSheet('이키가이 기존', [['existing'], ['preserved']]);
  const result = s.setupIkigaiHamSheet();
  s.setupIkigaiHamSheet();
  assert.equal(result.sheet, HAM_TAB);
  assert.equal(result.columns, 15);
  assert.deepEqual(sheets.get(HAM_TAB).rows, [[...s.withCampaignMonthHeader(s.SHEET_SCHEMAS.Ikigai_Landing.headers)]]);
  assert.deepEqual(original.rows, [['existing'], ['preserved']]);
  assert.equal(calls.writes.filter(call => call.kind === 'append').length, 1);
  assert.equal(calls.writes.every(call => call.name === HAM_TAB), true);
  assert.deepEqual(calls.notified, []);
  assert.deepEqual(calls.overview, []);
});

test('readiness accepts new and previous routing names but only reads the exact new target header', () => {
  for (const sheetTab of ['Ikigai_Ham', HAM_TAB, HAM_PREVIOUS_TAB]) {
    const { sandbox: s, calls, addSheet } = fixture();
    addSheet(HAM_TAB, [[...s.withCampaignMonthHeader(s.SHEET_SCHEMAS.Ikigai_Landing.headers)], ['PRIVATE DATA']]);
    const response = s.doPost(request({ sheetTab, action: 'ikigai_ham_readiness' }));
    assert.deepEqual(response, { ok: true, ready: true, sheetId: 'Ikigai_Ham', sheet: HAM_TAB, schemaVersion: 'ikigai-ham-v1' });
    assert.deepEqual(calls.lookup, [HAM_TAB]);
    assert.deepEqual(calls.reads, [{ name: HAM_TAB, row: 1, rowCount: 1 }]);
    assert.deepEqual(calls.writes, []);
    assert.deepEqual(calls.notified, []);
    assert.equal(calls.locks, 0);
  }
});

test('readiness fails closed for absent target, missing headers and duplicate headers without repair', () => {
  for (const state of ['absent', 'missing', 'duplicate', 'alias-only', 'previous-tab-only']) {
    const { sandbox: s, calls, addSheet } = fixture();
    const headers = [...s.withCampaignMonthHeader(s.SHEET_SCHEMAS.Ikigai_Landing.headers)];
    if (state === 'missing') headers.splice(headers.indexOf('연락처'), 1);
    if (state === 'duplicate') headers.push('연락처');
    if (state !== 'absent') addSheet(state === 'alias-only' ? 'Ikigai_Ham' : state === 'previous-tab-only' ? HAM_PREVIOUS_TAB : HAM_TAB, [headers]);
    const response = s.doPost(request({ sheetTab: 'Ikigai_Ham', action: 'ikigai_ham_readiness' }));
    assert.equal(response.ok, false, state);
    assert.deepEqual(calls.writes, [], state);
    assert.deepEqual(calls.notified, [], state);
    assert.equal(calls.locks, 0, state);
  }
});

test('logical, new and previous ham routing names preserve every base field and write only to the new tab', () => {
  for (const sheetTab of ['Ikigai_Ham', HAM_TAB, HAM_PREVIOUS_TAB]) {
    const { sandbox: s, calls, sheets, addSheet } = fixture();
    const original = addSheet('이키가이 기존', [['existing'], ['preserved']]);
    const result = s.doPost(request({ sheetTab, ...values }));
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.sheetId, 'Ikigai_Ham');
    assert.equal(result.sheet, HAM_TAB);
    const [headers, row] = sheets.get(HAM_TAB).rows;
    const ctx = { campaignMonth: '기존 운영 기간', submittedAt: '2026-09-17 12:00:00', classes: [] };
    const expected = headers.map(header => s.valueForHeader(header, values, ctx, s.SHEET_SCHEMAS.Ikigai_Landing));
    assert.deepEqual(row, expected);
    assert.equal(row[headers.indexOf('직업/학교')], values.occupation);
    assert.equal(row[headers.indexOf('Page URL')], values.pageUrl);
    assert.equal(row[headers.indexOf('캠페인 월')], '기존 운영 기간');
    assert.equal(calls.writes.every(call => call.name === HAM_TAB), true);
    assert.equal(sheets.has(HAM_PREVIOUS_TAB), false);
    assert.deepEqual(original.rows, [['existing'], ['preserved']]);
    assert.equal(calls.notified.length, 1);
    assert.equal(calls.notified[0][0], 'Ikigai_Ham');
    const message = s.buildTelegramMessage('Ikigai_Ham', headers, row, { sheetTab, ...values }, ctx);
    assert.match(message, /10월 이키 재능 햄찌/);
    assert.match(message, /<b>생년월일<\/b>: 2000-01-01/);
    assert.match(message, /<b>직업\/학교<\/b>: 검증용 학교/);
    assert.doesNotMatch(message, /컨설팅 신청 정보/);
  }
});

test('original Ikigai routing stays isolated from the ham tab; unknown targets remain rejected', () => {
  const { sandbox: s, calls, sheets, addSheet } = fixture();
  const ham = addSheet(HAM_TAB, [['existing'], ['preserved']]);
  const result = s.doPost(request({ sheetTab: 'Ikigai_Landing', ...values }));
  assert.equal(result.ok, true);
  assert.equal(result.sheetId, 'Ikigai_Landing');
  assert.equal(sheets.get('이키가이 기존').rows.length, 2);
  assert.deepEqual(ham.rows, [['existing'], ['preserved']]);
  assert.equal(calls.writes.every(call => call.name === '이키가이 기존'), true);
  const writes = calls.writes.length;
  assert.equal(s.doPost(request({ sheetTab: 'unknown-tab', ...values })).ok, false);
  assert.equal(calls.writes.length, writes);
});

test('registering after the old module updates its display name and preserves existing schema and aliases', () => {
  const { sandbox: s } = fixture();
  s.registerIkigaiHamCampaign();
  const schema = s.SHEET_SCHEMAS.Ikigai_Ham;
  s.SHEET_TAB_NAMES.Ikigai_Ham = HAM_PREVIOUS_TAB;
  s.SHEET_TAB_ALIASES.Ikigai_Ham = ['earlier-name'];
  s.registerIkigaiHamCampaign();
  s.registerIkigaiHamCampaign();
  assert.equal(s.SHEET_SCHEMAS.Ikigai_Ham, schema);
  assert.equal(s.SHEET_TAB_NAMES.Ikigai_Ham, HAM_TAB);
  assert.deepEqual([...s.SHEET_TAB_ALIASES.Ikigai_Ham], ['earlier-name', HAM_PREVIOUS_TAB]);
  assert.equal(s.logicalSheetName(HAM_PREVIOUS_TAB), 'Ikigai_Ham');
  assert.equal(s.logicalSheetName(HAM_TAB), 'Ikigai_Ham');
});

test('setup reuses an old physical tab without adding data or messages, and refuses ambiguous duplicate tabs', () => {
  const { sandbox: s, calls, sheets, addSheet } = fixture();
  const headers = [...s.withCampaignMonthHeader(s.SHEET_SCHEMAS.Ikigai_Landing.headers)];
  const previous = addSheet(HAM_PREVIOUS_TAB, [headers]);
  const result = s.setupIkigaiHamSheet();
  assert.equal(result.sheet, HAM_TAB);
  assert.equal(sheets.get(HAM_TAB), previous);
  assert.equal(sheets.has(HAM_PREVIOUS_TAB), false);
  assert.deepEqual(previous.rows, [headers]);
  assert.deepEqual(calls.writes, [{ name: HAM_PREVIOUS_TAB, kind: 'rename', next: HAM_TAB }]);
  assert.deepEqual(calls.notified, []);
  assert.deepEqual(calls.overview, []);

  addSheet(HAM_PREVIOUS_TAB, [headers]);
  const writes = calls.writes.length;
  assert.throws(() => s.setupIkigaiHamSheet(), /같은 신청폼의 탭이 여러 개/);
  assert.equal(calls.writes.length, writes);
});
