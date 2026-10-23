import test from 'node:test';
import assert from 'node:assert/strict';
import { createApplicationHandler } from '../api/applications.js';

const valid = {
  source: 'guide', requestId: 'ac670dc8-154d-4b14-8f64-af65450db6a9', website: '',
  name: '신청자', phone: '010-1234-5678', birthdate: '960901', region: '고양시',
  occupation: '직장인', concern: '커리어 방향을 찾고 싶어요.', privacyConsent: true,
};
const headers = { host: 'ikigai-landing-three.vercel.app', origin: 'https://ikigai-landing-three.vercel.app', 'content-type': 'application/json', 'user-agent': 'Test browser' };
const now = () => new Date('2026-10-23T08:00:00Z');

async function invoke({ body = valid, method = 'POST', requestHeaders = {}, fetchImpl, env = {} } = {}) {
  let calls = [];
  const fetcher = fetchImpl || (async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    return { ok: true, json: async () => ({ ok: true, sheetId: 'Ikigai_Landing' }) };
  });
  const response = { headers: {}, statusCode: 200, body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.body = value; return this; },
  };
  await createApplicationHandler({ fetchImpl: fetcher, now, env })({ method, headers: { ...headers, ...requestHeaders }, body }, response);
  return { ...response, calls };
}

test('valid application is acknowledged only after storage response and uses fixed routing', async () => {
  const result = await invoke({ body: { ...valid, variant: 'attacker', sheetTab: 'Other', pageUrl: 'https://evil.example' } });
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, { ok: true, applicationId: valid.requestId, duplicate: false });
  assert.equal(result.calls.length, 1);
  const sent = result.calls[0].body;
  assert.equal(sent.sheetTab, 'Ikigai_Landing');
  assert.equal(sent.variant, '이키가이 가이드북 랜딩 / 가이드');
  assert.equal(sent.pageUrl, 'https://ikigai-landing-three.vercel.app/guide');
  assert.equal(sent.phone, '01012345678');
  assert.equal(sent.address, valid.region);
  assert.equal(sent.submissionId, valid.requestId);
  assert.equal(sent.requestId, valid.requestId);
  assert.equal(sent['제출 ID'], valid.requestId);
  assert.equal(sent['동의 시각'], '2026-10-23T08:00:00.000Z');
  assert.equal(sent['개인정보 동의'], '동의');
  assert.equal(sent['동의 문구 버전'], 'guide-v1-20261023');
  assert.equal(result.headers['Cache-Control'], 'no-store');
  assert.ok(result.calls[0].init.signal instanceof AbortSignal);
});

test('upstream duplicate acknowledgment is accepted without resubmitting', async () => {
  const result = await invoke({ fetchImpl: async () => ({ ok: true, json: async () => ({ ok: true, sheetId: 'Ikigai_Landing', duplicate: true }) }) });
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.duplicate, true);
});

test('storage rejection, wrong target, HTTP, HTML, and network failures never report success or expose upstream data', async (t) => {
  const sensitive = 'PRIVATE_NAME PHONE_01098765432';
  for (const [label, fetchImpl] of [
    ['rejection', async () => ({ ok: true, json: async () => ({ ok: false, error: sensitive }) })],
    ['wrong target', async () => ({ ok: true, json: async () => ({ ok: true, sheetId: 'Other' }) })],
    ['missing target', async () => ({ ok: true, json: async () => ({ ok: true }) })],
    ['string success', async () => ({ ok: true, json: async () => ({ ok: 'true', sheetId: 'Ikigai_Landing' }) })],
    ['http', async () => ({ ok: false, json: async () => ({ error: sensitive }) })],
    ['html', async () => ({ ok: true, json: async () => { throw new SyntaxError(sensitive); } })],
    ['network', async () => { throw new Error(sensitive); }],
    ['timeout', async () => { throw new DOMException(sensitive, 'TimeoutError'); }],
  ]) await t.test(label, async () => {
    const result = await invoke({ fetchImpl });
    assert.equal(result.statusCode, 502);
    assert.equal(result.body.ok, false);
    assert.ok(!JSON.stringify(result.body).includes(sensitive));
    assert.equal(result.body.applicationId, undefined);
  });
});

test('required fields, consent, honeypot, source and UUID are validated before any external request', async (t) => {
  const cases = [
    { name: '' }, { phone: 'invalid' }, { phone: '0101234' }, { phone: '01012345678<script>' },
    { birthdate: '960231' }, { birthdate: '261225' }, { birthdate: '960000' },
    { region: '' }, { occupation: '' }, { concern: '' }, { concern: 'x'.repeat(2001) },
    { privacyConsent: false }, { privacyConsent: 'true' }, { website: 'bot.example' },
    { website: {} }, { source: 'ham' }, { requestId: 'not-a-uuid' },
    { name: { toString: () => 'name' } },
  ];
  for (const override of cases) await t.test(JSON.stringify(override).slice(0, 80), async () => {
    const result = await invoke({ body: { ...valid, ...override } });
    assert.equal(result.statusCode, 400);
    assert.equal(result.body.ok, false);
    assert.equal(result.calls.length, 0);
  });
});

test('valid leap-day and +82 phone are preserved correctly', async () => {
  const result = await invoke({ body: { ...valid, birthdate: '000229', phone: '+82 10-1234-5678' } });
  assert.equal(result.statusCode, 200);
  assert.equal(result.calls[0].body.birthdate, '000229');
  assert.equal(result.calls[0].body.phone, '01012345678');
});

test('spreadsheet formula prefixes and control characters are sanitized; unneeded attributes are discarded', async () => {
  const result = await invoke({ body: { ...valid, name: '=IMPORTXML("example")', region: '+region', occupation: '-school', concern: '@\u0000concern', utmSource: '=ad', secret: 'do not forward' }, requestHeaders: { 'user-agent': '+unsafe' } });
  assert.equal(result.statusCode, 200);
  const sent = result.calls[0].body;
  for (const field of ['name', 'address', 'occupation', 'concern', 'utmSource', 'userAgent']) assert.ok(sent[field].startsWith("'"));
  assert.equal(sent.concern, "'@concern");
  assert.equal(sent.secret, undefined);
});

test('attribution is whitelisted; referrer query and fragment are excluded', async () => {
  const result = await invoke({ body: { ...valid, utmSource: 'meta', utmMedium: 'paid', utmCampaign: 'guide launch', utmContent: 'mobile_ad_1', utmTerm: 'career', referrer: 'https://example.com/article?email=private#fragment' } });
  const sent = result.calls[0].body;
  const page = new URL(sent.pageUrl);
  assert.equal(page.pathname, '/guide');
  assert.equal(page.searchParams.get('utm_source'), 'meta');
  assert.equal(page.searchParams.get('utm_campaign'), 'guide launch');
  assert.equal(page.searchParams.get('utm_content'), 'mobile_ad_1');
  assert.equal(page.searchParams.get('utm_term'), 'career');
  assert.equal(sent['UTM Content'], 'mobile_ad_1');
  assert.equal(sent['UTM Term'], 'career');
  assert.equal(sent.referrer, 'https://example.com/article');
});

test('only same-origin JSON POSTs are accepted', async () => {
  let result = await invoke({ method: 'GET' });
  assert.equal(result.statusCode, 405);
  assert.equal(result.headers.Allow, 'POST');
  result = await invoke({ requestHeaders: { origin: 'https://evil.example' } });
  assert.equal(result.statusCode, 403);
  assert.equal(result.calls.length, 0);
  result = await invoke({ requestHeaders: { 'content-type': 'text/plain' } });
  assert.equal(result.statusCode, 415);
  result = await invoke({ requestHeaders: { origin: undefined } });
  assert.equal(result.statusCode, 200);
});

test('body JSON parsing and body size limits reject malformed or oversized requests', async () => {
  for (const body of ['{bad', null, [], { ...valid, unexpected: 'x'.repeat(12001) }]) {
    const result = await invoke({ body });
    assert.ok([400, 413].includes(result.statusCode));
    assert.equal(result.calls.length, 0);
  }
  const result = await invoke({ requestHeaders: { 'content-length': '12001' } });
  assert.equal(result.statusCode, 413);
  const parsed = await invoke({ body: JSON.stringify(valid) });
  assert.equal(parsed.statusCode, 200);
});

test('webhook override must remain an HTTPS Apps Script endpoint', async () => {
  const result = await invoke({ env: { IKIGAI_WEBHOOK_URL: 'https://evil.example/collect' } });
  assert.equal(result.statusCode, 502);
  assert.equal(result.calls.length, 0);
});
