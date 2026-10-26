import React, { useEffect, useRef, useState } from 'react';
import discoveryCover from './assets/type-discovery.jpg';
import designCover from './assets/type-design.jpg';
import executionCover from './assets/type-execution.jpg';
import page02 from './assets/ikigai-workbook-page-02.jpg';
import page03 from './assets/ikigai-workbook-page-03.jpg';
import page04 from './assets/ikigai-workbook-page-04.jpg';
import page05 from './assets/ikigai-workbook-page-05.jpg';
import page06 from './assets/ikigai-workbook-page-06.jpg';
import page07 from './assets/ikigai-workbook-page-07.jpg';
import './guide.css';

const TYPES = [
  { id: '01', en: 'DISCOVER', title: '발견형', intro: '무엇을 좋아하는지부터', description: '아직 방향이 막막하다면, 좋아하고 끌리는 것부터 차근차근 발견합니다.', cover: discoveryCover, className: 'discover' },
  { id: '02', en: 'DESIGN', title: '설계형', intro: '흩어진 경험을 하나의 방향으로', description: '강점과 경험을 나만의 경쟁력으로 정리하고, 앞으로 나아갈 방향을 설계합니다.', cover: designCover, className: 'design' },
  { id: '03', en: 'PRACTICE', title: '실행형', intro: '생각에서 작은 행동으로', description: '찾은 방향을 구체적인 행동과 루틴으로 옮기며, 나에게 맞는 실행에 집중합니다.', cover: executionCover, className: 'practice' },
];

const ELEMENTS = [
  { title: '좋아하는 것', en: 'What you love', question: '시간 가는 줄 모르고 몰입하는 일은?', text: '순수한 기쁨과 설렘을 주는 순간에서 나의 관심을 발견해요.', color: '#E6B8A6' },
  { title: '잘하는 것', en: 'What you are good at', question: '남들보다 조금 더 수월하게 해내는 일은?', text: '인정받거나 성취감을 느꼈던 경험을 돌아보며 강점을 찾아요.', color: '#D1CDA6' },
  { title: '세상이 필요로 하는 것', en: 'What the world needs', question: '나의 경험이 누구에게 도움이 될까?', text: '다른 사람의 삶에 기여할 수 있는 나만의 가치를 생각해요.', color: '#A9C5B4' },
  { title: '보상받을 수 있는 것', en: 'What you can be paid for', question: '어떤 일을 지속 가능한 직업으로 만들까?', text: '나의 시간과 능력을 현실의 기회와 연결하는 방법을 살펴봐요.', color: '#ABC2CD' },
];
const PREVIEWS = [page02, page03, page04, page05, page06, page07];
const EMPTY_FORM = { name: '', phone: '', birthdate: '', region: '', occupation: '', concern: '', website: '' };

function Arrow({ className = '' }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function IkigaiDiagram({ selected, onSelect, compact = false }) {
  const circles = [{ x: 180, y: 112 }, { x: 112, y: 180 }, { x: 248, y: 180 }, { x: 180, y: 248 }];
  return <svg className={`guide-diagram ${compact ? 'is-compact' : ''}`} viewBox="0 0 360 360" role="img" aria-label="좋아하는 것, 잘하는 것, 세상이 필요로 하는 것, 보상받을 수 있는 것이 만나는 이키가이">
    <g style={{ mixBlendMode: 'multiply' }}>{circles.map((circle, index) => <circle key={ELEMENTS[index].title} cx={circle.x} cy={circle.y} r="91" fill={ELEMENTS[index].color} fillOpacity={selected === index ? '.95' : '.72'} />)}</g>
    <g fill="#263A31" textAnchor="middle" fontWeight="600" fontSize="12"><text x="180" y="63">좋아하는 것</text><text x="59" y="185">잘하는 것</text><text x="300" y="175">세상이</text><text x="300" y="192">필요로 하는 것</text><text x="180" y="304">보상받을 수 있는 것</text></g>
    <circle cx="180" cy="180" r="31" fill="#245E4A" /><text x="180" y="184" fontSize="11" fontWeight="700" textAnchor="middle" fill="white">IKIGAI</text>
    {!compact && circles.map((circle, index) => <circle key={index} cx={circle.x} cy={circle.y} r="91" fill="transparent" onClick={() => onSelect(index)} style={{ cursor: 'pointer' }} aria-hidden="true" />)}
  </svg>;
}

export default function GuideLanding() {
  const [selected, setSelected] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [preview, setPreview] = useState(0);
  const [attribution] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get('utm_source') || '',
      utmMedium: params.get('utm_medium') || '',
      utmCampaign: params.get('utm_campaign') || '',
      utmContent: params.get('utm_content') || '',
      utmTerm: params.get('utm_term') || '',
      referrer: document.referrer || '',
    };
  });
  const formSection = useRef(null);
  const previewTrack = useRef(null);
  const request = useRef({ fingerprint: '', id: '' });
  const submitting = useRef(false);
  const statusRef = useRef(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = '이키가이 가이드북 | 위크메이트';
    if (!('IntersectionObserver' in window)) return () => { document.title = previousTitle; };
    const observer = new IntersectionObserver(([entry]) => setFormVisible(entry.isIntersecting), { threshold: 0, rootMargin: '0px 0px 40px 0px' });
    if (formSection.current) observer.observe(formSection.current);
    return () => { observer.disconnect(); document.title = previousTitle; };
  }, []);

  useEffect(() => {
    if (status === 'success') statusRef.current?.focus();
  }, [status]);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === 'birthdate' ? value.replace(/\D/g, '').slice(0, 6) : value }));
    if (error) setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current || status === 'success') return;
    if (!consent) { setError('개인정보 수집 및 이용에 동의해 주세요.'); return; }
    const payload = {
      ...Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])),
      ...attribution,
    };
    const fingerprint = JSON.stringify(payload);
    if (request.current.fingerprint !== fingerprint) {
      request.current = { fingerprint, id: crypto.randomUUID() };
    }
    submitting.current = true;
    setStatus('submitting');
    setError('');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 28000);
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, privacyConsent: true, source: 'guide', requestId: request.current.id }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok || !result?.applicationId) {
        throw new Error(result?.error || '신청을 접수하지 못했습니다. 입력한 내용은 유지되어 있으니 잠시 후 다시 시도해 주세요.');
      }
      setApplicationId(result.applicationId);
      setStatus('success');
    } catch (failure) {
      setStatus('error');
      setError(failure.name === 'AbortError'
        ? '접수 결과를 확인하는 데 시간이 걸리고 있어요. 입력한 내용은 유지되어 있으니 잠시 후 다시 눌러 확인해 주세요.'
        : failure.message || '신청 중 연결이 끊어졌습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      window.clearTimeout(timeout);
      submitting.current = false;
    }
  };

  const scrollPreview = (index) => {
    const track = previewTrack.current;
    const item = track?.children[index];
    if (!item) return;
    track.scrollTo({ left: item.offsetLeft - track.offsetLeft, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  return <div className="guide-page">
    <a className="guide-skip" href="#guide-main">본문으로 바로가기</a>
    <header className="guide-header"><div className="guide-container guide-header-inner"><a className="guide-brand" href="#guide-main" aria-label="위크메이트 이키가이 가이드북 처음으로">위크메이트<span>WEEKMATE</span></a><a className="guide-header-link" href="#guide-apply">무료 템플릿 신청<Arrow /></a></div></header>
    <main id="guide-main">
      <section className="guide-hero">
        <div className="guide-container guide-hero-grid">
          <div className="guide-hero-copy"><p className="guide-eyebrow">IKIGAI GUIDE BOOK</p><h1>네가 진짜 좋아하는 것,<br />우리 함께 찾아보자.</h1><p className="guide-hero-description">내가 좋아하는 일과<br className="guide-mobile-break" /> 세상에 도움이 되는 일이 만나는 곳.<br />네 가지 질문에서 나다운 방향을 찾아보세요.</p><a className="guide-button" href="#guide-apply">무료 템플릿 신청하기<Arrow /></a><p className="guide-hero-note">나의 고민에 맞는 템플릿 PDF와 커리어 코칭 안내</p></div>
          <div className="guide-hero-visual"><div className="guide-visual-heading"><span>A LITTLE GUIDE TO YOURSELF</span><span>01 — 04</span></div><IkigaiDiagram compact /><div className="guide-visual-caption"><span>좋아하는 것에서 시작해<br />나답게 살아가는 방향까지.</span><span className="guide-visual-mark">나를<br />알아가는<br />작은 시작</span></div></div>
        </div>
      </section>

      <section className="guide-section guide-intro"><div className="guide-container guide-intro-grid"><div><p className="guide-eyebrow">먼저, 나에게 질문하기</p><h2>막막한 마음에도<br />시작점은 있어요.</h2></div><div className="guide-intro-body"><p>“내가 좋아하는 일이 뭘까?”<br />“잘하는 것과 하고 싶은 게 다르면 어쩌지?”</p><p>정답을 서둘러 정하기보다, 나의 경험을 천천히 돌아보세요. 이키가이는 흩어진 관심과 강점을 연결해 <strong>삶의 방향을 생각하는 자기 이해의 틀</strong>입니다.</p><div className="guide-word-definition"><span>生き <small>삶</small></span><span aria-hidden="true">+</span><span>甲斐 <small>가치와 보람</small></span><span aria-hidden="true">=</span><strong>IKIGAI</strong></div></div></div></section>

      <section className="guide-section guide-elements"><div className="guide-container"><div className="guide-section-heading"><p className="guide-eyebrow">FOUR QUESTIONS</p><h2>네 가지 원을 채우며,<br />나만의 연결점을 찾아요.</h2><p>지금 떠오르는 경험부터 적어보세요.<br />완벽한 답을 찾지 않아도 괜찮아요.</p></div><div className="guide-elements-grid"><div className="guide-elements-visual"><IkigaiDiagram selected={selected} onSelect={setSelected} /><p>네 가지가 만나는 곳, 나의 이키가이</p></div><div><div className="guide-element-tabs" role="tablist" aria-label="이키가이의 네 가지 요소">{ELEMENTS.map((element, index) => <button key={element.title} id={`guide-tab-${index}`} role="tab" type="button" aria-selected={selected === index} aria-controls="guide-element-panel" className={selected === index ? 'is-active' : ''} onClick={() => setSelected(index)} onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 3 : (selected + (event.key === 'ArrowRight' ? 1 : 3)) % 4; setSelected(next); document.getElementById(`guide-tab-${next}`)?.focus(); } }} tabIndex={selected === index ? 0 : -1}><span>{String(index + 1).padStart(2, '0')}</span>{element.title}</button>)}</div><div id="guide-element-panel" role="tabpanel" aria-labelledby={`guide-tab-${selected}`} className="guide-element-panel" tabIndex={0}><span>{ELEMENTS[selected].en}</span><h3>{ELEMENTS[selected].question}</h3><p>{ELEMENTS[selected].text}</p></div><p className="guide-element-footnote">이키가이는 한 번에 완성되는 답이 아니라,<br />살아가며 질문하고 다듬어가는 과정이에요.</p></div></div></div></section>

      <section className="guide-section guide-types"><div className="guide-container"><div className="guide-section-heading"><p className="guide-eyebrow">YOUR OWN STARTING POINT</p><h2>지금 나에게 필요한,<br />세 가지 시작 방법.</h2><p>성향과 고민에 맞는 템플릿으로<br />발견부터 실행까지 한 걸음씩 나아가세요.</p></div><div className="guide-type-grid">{TYPES.map((type) => <article className={`guide-type ${type.className}`} key={type.id}><div className="guide-type-image"><span>{type.id} / {type.en}</span><div className={`guide-rebranded-cover guide-rebranded-cover--${type.id}`}><img src={type.cover} alt={`${type.title} 이키가이 템플릿 표지`} loading="lazy" decoding="async" width="400" height="560" /><span className="guide-cover-brand">위크메이트</span></div></div><div className="guide-type-copy"><h3>{type.title}</h3><p className="guide-type-intro">{type.intro}</p><p>{type.description}</p></div></article>)}</div><div className="guide-preview-heading"><div><p className="guide-eyebrow">INSIDE THE WORKBOOK</p><h3>어떤 질문을 만나게 될까요?</h3></div><span>실제 템플릿 미리보기</span></div><div className="guide-preview-track" ref={previewTrack} onScroll={() => { const track = previewTrack.current; if (track?.children.length) { const width = track.children[0].getBoundingClientRect().width + 20; setPreview(Math.min(5, Math.max(0, Math.round(track.scrollLeft / width)))); } }} tabIndex={0} aria-label="템플릿 2페이지부터 7페이지까지, 옆으로 스크롤하여 미리보기">{PREVIEWS.map((src, index) => <figure key={src}><div className="guide-rebranded-page"><img src={src} alt={`이키가이 가이드북 실제 미리보기 ${index + 2}페이지`} loading="lazy" decoding="async" width="600" height="850" /><span className="guide-page-brand">위크메이트</span><span className="guide-page-footer-brand">위크메이트 이키가이 워크북 탐색형</span></div><figcaption>{String(index + 2).padStart(2, '0')} / 이키가이 가이드북</figcaption></figure>)}</div><div className="guide-preview-controls"><p>옆으로 넘겨 페이지를 살펴보세요.</p><div aria-label="미리보기 페이지 선택">{PREVIEWS.map((_, index) => <button key={index} type="button" onClick={() => scrollPreview(index)} className={preview === index ? 'is-active' : ''} aria-label={`${index + 2}페이지 미리보기`} aria-current={preview === index ? 'true' : undefined}><span /></button>)}</div></div></div></section>

      <section className="guide-section guide-benefits"><div className="guide-container guide-benefits-grid"><div><p className="guide-eyebrow">함께 받아보세요</p><h2>나를 알아가는 일,<br />혼자 시작하지 않도록.</h2><p>무료 템플릿과 함께<br />커리어 코칭 안내를 받아보세요.</p></div><ol className="guide-benefit-list"><li><span>01</span><div><h3>맞춤형 이키가이 템플릿 PDF</h3><p>세 가지 유형 중 내 성향과 고민에 맞는 템플릿을 안내해 드려요.</p></div></li><li><span>02</span><div><h3>1:1 커리어 진단 코칭권 안내</h3><p>지금의 고민을 나누고 내 커리어를 돌아보는 코칭권을 안내해 드려요.</p></div></li><li><span>03</span><div><h3>나의 강점과 커리어 방향 이해</h3><p>1:1 컨설팅에서는 이키가이 분석지를 활용해 강점, 성향, 커리어 방향을 살펴봅니다.</p></div></li></ol></div></section>

      <section id="guide-apply" ref={formSection} className="guide-section guide-apply"><div className="guide-container guide-apply-grid"><div className="guide-apply-intro"><p className="guide-eyebrow">START WITH YOURSELF</p><h2>나를 위한 첫 페이지,<br />지금 열어보세요.</h2><p>아래 정보를 남겨주시면<br />맞춤 템플릿과 커리어 코칭권 안내를<br />입력하신 연락처로 보내드려요.</p><span className="guide-apply-signature">나를 찾는 즐거움,<br /><strong>위크메이트</strong></span></div><div className="guide-form-shell">{status === 'success' ? <div className="guide-success" tabIndex={-1} ref={statusRef}><div className="guide-success-icon"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4 10-10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></div><p className="guide-eyebrow">APPLICATION RECEIVED</p><h3>신청이 접수되었어요.</h3><p>남겨주신 고민을 확인한 뒤,<br />입력하신 연락처로 안내해 드릴게요.</p><p className="guide-confirmation">접수번호 <span>{applicationId}</span></p><a href="#guide-main">처음으로 돌아가기<Arrow /></a></div> : <form onSubmit={submit} className="guide-form" aria-busy={status === 'submitting'}><div className="guide-form-heading"><h3>무료 템플릿 신청</h3><p>모든 항목을 입력해 주세요.</p></div><div className="guide-form-two"><div className="guide-field"><label htmlFor="guide-name">성함</label><input id="guide-name" name="name" autoComplete="name" value={form.name} onChange={update} placeholder="성함을 입력해 주세요" required maxLength={50} /></div><div className="guide-field"><label htmlFor="guide-birthdate">생년월일</label><input id="guide-birthdate" name="birthdate" inputMode="numeric" autoComplete="off" value={form.birthdate} onChange={update} placeholder="예: 990407" pattern="[0-9]{6}" required maxLength={6} aria-describedby="guide-birth-help" /><span id="guide-birth-help" className="guide-field-help">생년월일 6자리</span></div></div><div className="guide-field"><label htmlFor="guide-phone">안내 받으실 연락처</label><input id="guide-phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={update} placeholder="010-1234-5678" required minLength={9} maxLength={20} aria-describedby="guide-phone-help" /><span id="guide-phone-help" className="guide-field-help">입력하신 번호로 안내드리니 한 번 더 확인해 주세요.</span></div><div className="guide-field"><label htmlFor="guide-region">거주 지역</label><input id="guide-region" name="region" autoComplete="address-level2" value={form.region} onChange={update} placeholder="예: 서울시 마포구" required maxLength={100} /></div><div className="guide-field"><label htmlFor="guide-occupation">직업 또는 학교</label><input id="guide-occupation" name="occupation" autoComplete="organization-title" value={form.occupation} onChange={update} placeholder="예: 대학생 / 취업 준비 중 / 직장인" required maxLength={100} /></div><div className="guide-field"><label htmlFor="guide-concern">현재 해결하고 싶은 고민</label><textarea id="guide-concern" name="concern" value={form.concern} onChange={update} placeholder="현재 상황이나 목표, 막막하게 느껴지는 점을 편하게 적어주세요." required maxLength={2000} rows={4} aria-describedby="guide-concern-help" /><span id="guide-concern-help" className="guide-field-help">작성해주신 내용을 바탕으로 맞춤 안내를 드려요.</span></div><div className="guide-honeypot" aria-hidden="true"><label htmlFor="guide-website">Website</label><input id="guide-website" name="website" value={form.website} onChange={update} tabIndex={-1} autoComplete="off" /></div><div className="guide-privacy"><details><summary>개인정보 수집 및 이용 안내</summary><p>위크메이트 운영팀은 신청 관리와 맞춤 템플릿·커리어 코칭 안내를 위해 성함, 연락처, 생년월일, 거주 지역, 직업 또는 학교, 작성하신 고민을 수집합니다. 안내는 입력하신 연락처로 진행됩니다. 동의를 거부할 수 있으며, 이 경우 신청 접수가 어렵습니다.</p></details><label className="guide-consent"><input name="privacyConsent" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required /><span>개인정보 수집 및 이용에 동의합니다. <small>(필수)</small></span></label></div>{error && <p className="guide-submit-error" role="alert">{error}</p>}<button className="guide-button guide-submit" type="submit" disabled={status === 'submitting'}>{status === 'submitting' ? '신청 접수 중…' : status === 'error' ? '다시 신청하기' : '무료 템플릿 신청하기'}<Arrow /></button><p className="guide-form-endnote">신청 내용을 확인한 후 연락드립니다.</p></form>}</div></div></section>

      <section className="guide-section guide-more"><div className="guide-container guide-more-grid"><div><p className="guide-eyebrow">조금 더 알아보고 싶다면</p><h2>영상으로 만나는<br />이키가이.</h2><p>나의 목적을 찾는 네 가지 질문을<br />참고 영상에서 살펴보세요.</p></div><div><div className="guide-video"><iframe src="https://www.youtube-nocookie.com/embed/qQdZTVwzXWY" title="이키가이 테스트! 오늘 당신의 목적을 찾으십시오! — 참고 영상" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div><p className="guide-video-credit">출처: YouTube ‘IKIGAI test’ 채널<br />이해를 돕기 위한 참고 자료이며, 본 서비스와는 무관합니다.</p></div></div></section>
    </main>
    <footer className="guide-footer"><div className="guide-container"><a className="guide-brand" href="#guide-main">위크메이트<span>WEEKMATE</span></a><p>나를 찾는 즐거움, 나답게 나아가는 시작.</p><span>IKIGAI GUIDE BOOK</span></div></footer>
    <div className={`guide-mobile-cta ${formVisible || status === 'success' ? 'is-hidden' : ''}`} aria-hidden={formVisible || status === 'success'}><a href="#guide-apply" className="guide-button" tabIndex={formVisible || status === 'success' ? -1 : 0}>무료 템플릿 신청하기<Arrow /></a></div>
  </div>;
}
