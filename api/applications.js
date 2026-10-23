const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwJNnO29D7hYl-AjKSpwjHsNu7uRJAOfxkL2TboG58WzZf0kUGLWMSi0IbioR2_oDh5/exec';
const MAX_BODY_BYTES = 12_000;
const SHEET_ID = 'Ikigai_Landing';
const CANONICAL_PAGE = 'https://ikigai-landing-three.vercel.app/guide';
const CONSENT_VERSION = 'guide-v1-20261023';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function textField(value, label, maximum, required = true) {
  if (typeof value !== 'string') {
    if (!required && value == null) return '';
    throw fail(`${label}을 확인해 주세요.`);
  }
  const result = value.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  if ((required && !result) || result.length > maximum) throw fail(`${label}을 확인해 주세요.`);
  return result;
}

// Sheets must receive strings, never executable spreadsheet formulas.
function sheetText(value) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function validBirthdate(value, now) {
  if (!/^\d{6}$/.test(value)) return false;
  const today = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = Number(value.slice(0, 2));
  const fullYear = year <= today.getUTCFullYear() % 100 ? 2000 + year : 1900 + year;
  const month = Number(value.slice(2, 4));
  const day = Number(value.slice(4, 6));
  const date = new Date(Date.UTC(fullYear, month - 1, day));
  const todayDate = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return date.getUTCFullYear() === fullYear && date.getUTCMonth() === month - 1 && date.getUTCDate() === day && date.getTime() <= todayDate;
}

function allowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const url = new URL(origin);
    const host = req.headers.host;
    return Boolean(host) && url.host === host && url.origin === origin && (url.protocol === 'https:' || (url.protocol === 'http:' && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)));
  } catch {
    return false;
  }
}

function parseBody(req) {
  if (Number(req.headers['content-length']) > MAX_BODY_BYTES) throw fail('입력 내용이 너무 깁니다. 내용을 줄여 다시 신청해 주세요.', 413);
  let body;
  try {
    const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
    if (typeof raw === 'string' && Buffer.byteLength(raw) > MAX_BODY_BYTES) throw fail('입력 내용이 너무 깁니다. 내용을 줄여 다시 신청해 주세요.', 413);
    body = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (body && Buffer.byteLength(JSON.stringify(body)) > MAX_BODY_BYTES) throw fail('입력 내용이 너무 깁니다. 내용을 줄여 다시 신청해 주세요.', 413);
  } catch (error) {
    if (error.status) throw error;
    throw fail('신청 내용을 읽을 수 없습니다. 새로고침 후 다시 신청해 주세요.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw fail('신청 내용을 확인해 주세요.');
  return body;
}

function applicationPayload(body, req, now) {
  if (body.source !== 'guide') throw fail('신청 페이지를 확인해 주세요.');
  if (body.privacyConsent !== true) throw fail('개인정보 수집 및 이용에 동의해 주세요.');
  if (body.website != null && (typeof body.website !== 'string' || body.website.trim())) throw fail('신청 내용을 확인해 주세요.');
  const requestId = textField(body.requestId, '신청 번호', 36);
  if (!UUID.test(requestId)) throw fail('신청 번호가 올바르지 않습니다. 새로고침 후 다시 신청해 주세요.');
  const name = textField(body.name, '이름', 60);
  const rawPhone = textField(body.phone, '연락처', 24);
  if (!/^[+\d\s()-]+$/.test(rawPhone)) throw fail('휴대전화 번호를 확인해 주세요.');
  let phone = rawPhone.replace(/[\s()-]/g, '');
  if (phone.startsWith('+82')) phone = `0${phone.slice(3)}`;
  if (!/^01[016789]\d{7,8}$/.test(phone)) throw fail('휴대전화 번호를 확인해 주세요.');
  const birthdate = textField(body.birthdate, '생년월일', 6);
  if (!validBirthdate(birthdate, now)) throw fail('생년월일 6자리를 확인해 주세요.');
  const pageUrl = new URL(CANONICAL_PAGE);
  const attribution = {};
  for (const [field, query] of [['utmSource', 'utm_source'], ['utmMedium', 'utm_medium'], ['utmCampaign', 'utm_campaign'], ['utmContent', 'utm_content'], ['utmTerm', 'utm_term']]) {
    attribution[field] = textField(body[field], '유입 정보', 200, false);
    if (attribution[field]) pageUrl.searchParams.set(query, attribution[field]);
  }
  let referrer = textField(body.referrer, '이전 페이지 정보', 1000, false);
  if (referrer) {
    try {
      const url = new URL(referrer);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
      // Referral source is sufficient; avoid collecting unrelated query-string data.
      referrer = url.origin + url.pathname;
    } catch {
      referrer = '';
    }
  }
  const payload = {
    sheetTab: SHEET_ID,
    variant: '이키가이 가이드북 랜딩 / 가이드',
    submissionId: requestId,
    // Unlike submissionId, this stable key participates in the existing deduplication hash.
    requestId,
    '제출 ID': requestId,
    consentAccepted: '동의',
    consentVersion: CONSENT_VERSION,
    consentedAt: now.toISOString(),
    '개인정보 동의': '동의',
    '동의 문구 버전': CONSENT_VERSION,
    '동의 시각': now.toISOString(),
    name,
    phone,
    birthdate,
    address: textField(body.region, '거주 지역', 160),
    occupation: textField(body.occupation, '직업 또는 학교', 160),
    concern: textField(body.concern, '현재 고민', 2000),
    pageUrl: pageUrl.href,
    ...attribution,
    // Extra existing Sheet columns use exact header names in valueForHeader's fallback.
    'UTM Content': attribution.utmContent,
    'UTM Term': attribution.utmTerm,
    userAgent: String(req.headers['user-agent'] || '').slice(0, 500),
    referrer,
  };
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, sheetText(value)]));
}

export function createApplicationHandler({ fetchImpl = globalThis.fetch, env = process.env, now = () => new Date() } = {}) {
  return async function applications(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ ok: false, error: '신청은 제출 버튼을 통해 보내 주세요.' });
    }
    if (!allowedOrigin(req)) return res.status(403).json({ ok: false, error: '신청 페이지에서 다시 시도해 주세요.' });
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) return res.status(415).json({ ok: false, error: '신청 형식을 확인해 주세요.' });
    let payload;
    try {
      payload = applicationPayload(parseBody(req), req, now());
    } catch (error) {
      return res.status(error.status || 400).json({ ok: false, error: error.status ? error.message : '신청 내용을 확인해 주세요.' });
    }
    try {
      const endpoint = new URL(env.IKIGAI_WEBHOOK_URL || DEFAULT_WEBHOOK_URL);
      if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'script.google.com' || !/^\/macros\/s\/[^/]+\/exec$/.test(endpoint.pathname)) throw new Error('Invalid webhook configuration');
      const response = await fetchImpl(endpoint.href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) throw new Error('Upstream HTTP failure');
      const result = await response.json();
      if (result?.ok !== true || result.sheetId !== SHEET_ID) throw new Error('Storage not confirmed');
      return res.status(200).json({ ok: true, applicationId: payload.submissionId, duplicate: result.duplicate === true });
    } catch {
      // The response or exception may contain private application data. Never expose or log it.
      return res.status(502).json({ ok: false, error: '접수 결과를 확인하지 못했습니다. 입력 내용은 유지되니 잠시 후 같은 내용으로 다시 제출해 주세요.' });
    }
  };
}

export default createApplicationHandler();
