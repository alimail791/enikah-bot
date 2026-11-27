// enikah.vasulbook.com — the whole service as a website (English / Tamil).
import multer from 'multer';
import { q, one, all, getP, P_SQL, visible } from './db.js';
import crypto from 'crypto';
import { CFG, esc, D, rs, ADMINS } from './config.js';
import * as C from './core.js';
import { createLink, markPaid, callbackOk } from './pay.js';
import { sendMail } from './mail.js';
import { makeT, LANGS } from './i18n.js';
import { home as seoHome, contentPage, headTags, mountSeo, urlFor, enPath, PUBLIC_PATHS, SEO_CSS } from './seo.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, f, cb) => cb(null, /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/.test(f.mimetype)) });
const h = fn => (req, res, next) => fn(req, res, next).catch(next);
// Flash messages travel in English and are translated when shown.
const go = (res, path, msg) => res.redirect(303, path + (msg ? (path.includes('?') ? '&' : '?') + 'msg=' + encodeURIComponent(msg) : ''));
const CONTACT = () => process.env.CONTACT_EMAIL || 'alimail791@gmail.com';

// ---------- look ----------
const CSS = `:root{color-scheme:light dark;--bg:light-dark(#f6f1e7,#0f1714);--ink:light-dark(#1d2421,#e9efe9);--mut:light-dark(#5d6762,#9aa7a0);--card:light-dark(#fff,#18221e);--line:light-dark(#e3dccd,#2a3832);--em:#0b4d3c;--em2:light-dark(#0b4d3c,#6fd0ac);--gold:#c9a24a;--red:light-dark(#b3361f,#ff8a73);--ok:light-dark(#1d7a4f,#6fd0ac)}
*{box-sizing:border-box;min-width:0}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans Tamil",sans-serif}
a{color:var(--em2)}header.top{background:var(--em);color:#f6f1e7;padding:12px max(4vw,16px);display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;justify-content:space-between}
header.top .brand{font:28px/1 Georgia,serif;color:#f3dfa8;text-decoration:none}header.top nav{display:flex;flex-wrap:wrap;gap:4px 14px;align-items:center}header.top nav a,header.top nav button{color:#e8f2ec;text-decoration:none;font-size:15px;background:none;border:0;padding:6px 0;min-height:auto;cursor:pointer;font-weight:500}
header.top nav a.lang{border:1px solid #f3dfa8;color:#f3dfa8;border-radius:99px;padding:3px 12px}
main{max-width:980px;margin:0 auto;padding:22px max(4vw,16px) 48px}h1{font:400 clamp(26px,5vw,40px)/1.2 Georgia,"Noto Serif Tamil",serif;margin:4px 0 12px;color:var(--em2);text-wrap:balance}h2{font:400 23px/1.3 Georgia,"Noto Serif Tamil",serif;margin:28px 0 10px;color:var(--em2)}h3{margin:0 0 6px;font-size:17px}
.note{color:var(--mut);font-size:14px}.box{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px;margin:14px 0}
.msg{background:var(--em);color:#fff;border-radius:12px;padding:12px 16px;margin-bottom:16px}.err{background:var(--red);color:#fff;border-radius:12px;padding:12px 16px;margin-bottom:16px}
form.fl{display:flex;flex-direction:column;gap:14px;max-width:520px}label{display:flex;flex-direction:column;gap:6px;font-weight:600;font-size:15px}label small{font-weight:400;color:var(--mut)}
input,select,textarea{font:16px system-ui,"Noto Sans Tamil",sans-serif;padding:11px 12px;border-radius:10px;border:1px solid var(--line);background:light-dark(#fff,#111a17);color:var(--ink);min-height:46px}
.row{display:flex;gap:12px;flex-wrap:wrap}.row>*{flex:1 1 140px}
button,.btn{font:inherit;font-weight:600;min-height:46px;border-radius:10px;border:0;background:var(--em);color:#fff;padding:10px 18px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;text-align:center}
.btn.alt,button.alt{background:transparent;color:var(--em2);border:1px solid var(--line)}.btn.gold,button.gold{background:var(--gold);color:#1d2421}button.red{background:var(--red)}button:disabled{background:var(--line);color:var(--mut);cursor:default}
button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.acts{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}.acts form{display:inline}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px}.stat b{display:block;font:400 24px/1.2 Georgia,"Noto Serif Tamil",serif;color:var(--em2)}.stat span{font-size:14px;color:var(--mut)}.stat b{overflow-wrap:anywhere}html[lang=ta] .stat b{font-size:19px;line-height:1.35}html[lang=ta] .price .box b{font-size:30px}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}.pc{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:4px}
.ph{height:110px;border-radius:12px;background:linear-gradient(135deg,#0b4d3c,#2c7a62 60%,#c9a24a);display:grid;place-items:center;color:#f6f1e7;font-size:13px;text-align:center;padding:8px}
.pc img.photo{width:100%;height:200px;object-fit:cover;border-radius:12px}.pc span{color:var(--mut);font-size:14px}
.tag{display:inline-block;font-size:12.5px;border:1px solid var(--gold);border-radius:99px;padding:1px 9px;width:max-content}.tag.ok{border-color:var(--ok);color:var(--ok)}.tag.no{border-color:var(--red);color:var(--red)}
table{width:100%;border-collapse:collapse;font-size:15px}th,td{text-align:left;padding:9px 6px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:13px;color:var(--mut);font-weight:600}
details summary{cursor:pointer;color:var(--mut);font-size:14px;margin-top:6px}img.doc{max-width:100%;max-height:420px;border-radius:10px;border:1px solid var(--line)}
.hero{background:var(--em);color:#f6f1e7;border-radius:22px;padding:clamp(22px,5vw,48px);display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:24px;align-items:center}
.hero h1{color:#f3dfa8;font-size:clamp(30px,6vw,48px)}.hero p{color:#dcebe3;max-width:52ch}.hero .acts .btn.alt{color:#f3dfa8;border-color:#f3dfa8}
.arch{aspect-ratio:3/4;max-height:300px;justify-self:center;width:min(240px,100%);border-radius:120px 120px 18px 18px;background:radial-gradient(circle at 50% 30%,#f3dfa8 0 14%,transparent 15%),linear-gradient(180deg,#2c7a62,#0b4d3c 70%);border:3px solid #c9a24a;box-shadow:inset 0 -40px 60px #0004}
.price{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}.price .box b{font:400 34px/1.1 Georgia,serif;color:var(--em2);display:block}
ol.steps{padding-left:22px}ol.steps li{margin:8px 0}
footer{text-align:center;color:var(--mut);font-size:13.5px;padding:24px 16px 32px}
@media(max-width:700px){.hero{grid-template-columns:1fr}.arch{display:none}table.stack thead{display:none}table.stack tr{display:grid;padding:8px 0;border-bottom:1px solid var(--line)}table.stack td{border:0;padding:2px 0}}`;

function page(req, title, body, opts = {}) {
  const u = req.user, t = req.t;
  const m = req.query?.msg ? `<div class="msg">${esc(t(req.query.msg))}</div>` : '';
  const out = `<form method="post" action="/logout" style="display:inline"><button>${t('Log out')}</button></form>`;
  const ol = req.lang === 'ta' ? 'en' : 'ta', to = opts.path ? `?to=${encodeURIComponent(urlFor(ol, opts.path))}` : '';
  const other = `<a class="lang" href="/lang/${ol}${to}" lang="${ol}" hreflang="${ol}">${ol === 'ta' ? 'தமிழ்' : 'English'}</a>`;
  const nav = !u ? `<a href="/login">${t('Log in')}</a><a href="/register">${t('Register free')}</a>`
    : u.type === 'admin' ? `<a href="/admin">${t('Admin')}</a><a href="/account">${t('Account')}</a>${out}`
    : u.type === 'broker' ? `<a href="/broker">${t('Candidates')}</a><a href="/interests">${t('Interests')}</a><a href="/account">${t('Account')}</a>${out}`
    : `<a href="/home">${t('My profile')}</a>${u.pid ? `<a href="/matches/${u.pid}">${t('Matches')}</a><a href="/interests">${t('Interests')}</a>` : ''}<a href="/account">${t('Account')}</a>${out}`;
  return `<!doctype html><html lang="${req.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.fullTitle || title + ' · ENikah')}</title>
<meta name="description" content="${esc(opts.desc || t('ENikah — verified Muslim matrimony for families. Free registration, first 3 months free.'))}">
${opts.head || '<meta name="robots" content="noindex">'}<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230b4d3c'/%3E%3Ctext x='16' y='23' font-size='20' text-anchor='middle' fill='%23f3dfa8' font-family='Georgia'%3EE%3C/text%3E%3C/svg%3E">
${req.lang === 'ta' ? '<link rel="preconnect" href="https://fonts.gstatic.com"><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600&family=Noto+Serif+Tamil&display=swap" rel="stylesheet">' : ''}<style>${CSS}${SEO_CSS}</style></head>
<body><header class="top"><a class="brand" href="${urlFor(req.lang, '/')}">ENikah</a><nav>${nav}${other}</nav></header><main>${m}${body}</main>
<footer>${t('ENikah · Verified profiles only · Contacts shared only when both sides accept')}<br><a href="${urlFor(req.lang, '/privacy')}">${t('Privacy')}</a> · <a href="${urlFor(req.lang, '/terms')}">${t('Terms')}</a></footer></body></html>`;
}
const errBox = (t, e) => e ? `<div class="err">${esc(t(e))}</div>` : '';
const opt = (t, list, v) => list.map(x => `<option value="${esc(x)}" ${x === v ? 'selected' : ''}>${esc(t(x))}</option>`).join('');
const sideT = (t, p) => t(p.g === 'F' ? 'Bride' : 'Groom');
const wantText = (t, p) => t('Age {a} · {m} · {city} first · their choice fits you too', {
  a: p.pa_min ? `${p.pa_min}–${p.pa_max}` : t('any'),
  m: p.pm === 'same' ? t('{maslak} only', { maslak: t(p.maslak) }) : t('any maslak'), city: esc(p.city) });

function profileCard(t, v, extra = '', photo = false) {
  return `<div class="pc">${photo && v.photo_mime ? `<img class="photo" src="/photo/${v.id}" alt="${esc(v.code)}">` : `<div class="ph">${t('Photo shown after both sides accept')}</div>`}
  <b>${esc(v.code)} · ${sideT(t, v)}, ${v.age}</b><span>${esc(v.city)} · ${esc(t(v.maslak))}</span><span>${esc(v.edu)} · ${esc(v.job)}</span><span>${esc(t(v.marital))}</span>
  <span class="tag">${t(v.broker ? 'Via verified broker' : 'Verified')}</span>${extra}</div>`;
}

function profileForm(t, d = {}, { gender = true, submit = 'Save', action = '' } = {}) {
  return `<form class="fl box" method="post" action="${action}">
  <label>${t('Full name')} <small>${t('Shown only after both sides accept an interest')}</small><input name="name" value="${esc(d.name)}" required maxlength="60"></label>
  ${gender ? `<label>${t('Registering for')}<select name="g" required><option value="">${t('Choose…')}</option><option value="F" ${d.g === 'F' ? 'selected' : ''}>${t('Bride')}</option><option value="M" ${d.g === 'M' ? 'selected' : ''}>${t('Groom')}</option></select></label>` : ''}
  <div class="row"><label>${t('Age')}<input name="age" type="number" inputmode="numeric" min="18" max="70" value="${esc(d.age)}" required></label><label>${t('City / town')}<input name="city" value="${esc(d.city)}" required maxlength="40"></label></div>
  <div class="row"><label>${t('Maslak')}<select name="maslak" required><option value="">${t('Choose…')}</option>${opt(t, C.MASLAK, d.maslak)}</select></label><label>${t('Marital status')}<select name="marital" required><option value="">${t('Choose…')}</option>${opt(t, C.MARITAL, d.marital)}</select></label></div>
  <div class="row"><label>${t('Education')}<input name="edu" value="${esc(d.edu)}" placeholder="${esc(t('e.g. B.Sc, B.E, Alima'))}" required maxlength="40"></label><label>${t('Profession')}<input name="job" value="${esc(d.job)}" placeholder="${esc(t('e.g. Teacher, Business'))}" required maxlength="40"></label></div>
  <h3 style="margin-top:6px">${t('Partner preference')}</h3>
  <div class="row"><label>${t('Partner age from')}<input name="pa_min" type="number" inputmode="numeric" min="18" max="80" value="${esc(d.pa_min)}" placeholder="${esc(t('any'))}"></label><label>${t('to')}<input name="pa_max" type="number" inputmode="numeric" min="18" max="80" value="${esc(d.pa_max)}" placeholder="${esc(t('any'))}"></label></div>
  <label>${t('Partner maslak')}<select name="pm"><option value="any">${t('Any maslak')}</option><option value="same" ${d.pm === 'same' ? 'selected' : ''}>${t('Same as mine')}</option></select></label>
  <p class="note">${t('Matches are two-way: you see only profiles that fit your choice and whose choice fits you.')}</p>
  <button>${t(submit)}</button></form>`;
}

// ---------- sessions & language ----------
const cookies = req => Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim()).filter(Boolean).map(c => { const i = c.indexOf('='); return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))]; }));
async function startSession(res, phone) {
  const t = await C.newToken('sess', phone, '', null, 24 * 60);
  res.cookie('sid', t, { httpOnly: true, sameSite: 'lax', secure: CFG.base.startsWith('https'), maxAge: 60 * 864e5, path: '/' });
}
const need = (...types) => (req, res, next) => {
  if (!req.user) return go(res, (types.includes('admin') ? '/admin/login' : '/login') + '?next=' + encodeURIComponent(req.originalUrl));
  if (types.length && !types.includes(req.user.type)) return go(res, '/home');
  next();
};
const tries = new Map();
const limited = (key, max = 10) => { const now = Date.now(), t = (tries.get(key) || []).filter(x => now - x < 15 * 60e3); t.push(now); tries.set(key, t); return t.length > max; };

export function mount(app) {
  app.use(h(async (req, res, next) => {
    const ck = cookies(req);
    // Public pages have one URL per language (/… English, /ta/… Tamil) so search engines can index both.
    const pub = PUBLIC_PATHS.includes(enPath(req.path));
    if (pub && /^\/ta(\/|$)/.test(req.path)) req.lang = 'ta';
    else if (pub) {
      // Someone who chose Tamil, or whose phone is set to Tamil, is sent to the Tamil URL (crawlers keep the English one).
      if (req.method === 'GET' && (ck.lang === 'ta' || (!ck.lang && /^ta\b/i.test(req.get('accept-language') || '')))) return res.redirect(302, urlFor('ta', req.path) + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''));
      req.lang = 'en';
    } else req.lang = LANGS.includes(ck.lang) ? ck.lang : /^ta\b/i.test(req.get('accept-language') || '') ? 'ta' : 'en';
    req.t = makeT(req.lang);
    if (ck.sid) { const tk = await C.getToken(ck.sid, 'sess'); if (tk) { req.user = await C.user(tk.phone); req.sid = ck.sid; } }
    next();
  }));
  app.get('/lang/:l', (req, res) => {
    const l = LANGS.includes(req.params.l) ? req.params.l : 'en';
    res.cookie('lang', l, { sameSite: 'lax', maxAge: 365 * 864e5, path: '/' });
    const to = String(req.query.to || '');
    const back = to.startsWith('/') && !to.startsWith('//') ? to : (req.get('referer') || '/').replace(/^https?:\/\/[^/]+/, '');
    res.redirect(303, back.startsWith('/') && !back.startsWith('//') && !back.startsWith('/lang/') ? back : '/');
  });

  // ---------- public ----------
  mountSeo(app);
  const both = (p, fn) => app.get([p, urlFor('ta', p)], fn);
  for (const p of PUBLIC_PATHS) {
    const c = (req) => contentPage(req, p);
    if (!['/', '/privacy', '/terms'].includes(p)) both(p, (req, res) => { const pg = c(req); res.send(page(req, pg.title, pg.body, { path: p, fullTitle: pg.title, desc: pg.desc, head: pg.head })); });
  }
  both('/', (req, res) => { const t = req.t, S = seoHome(req); res.send(page(req, t('Verified Muslim matrimony'), `
    <section class="hero"><div><h1>${t('Verified Muslim matrimony for families')}</h1>
      <p>${t('Register free with your first 3 months free. Every profile is checked with ID and photo. You see only active, verified profiles that fit your choice — and theirs. Contacts are shared only when both sides accept.')}</p>
      <div class="acts"><a class="btn gold" href="${req.user ? '/home' : '/register'}">${t(req.user ? 'Go to my profile' : 'Register free')}</a>${req.user ? '' : `<a class="btn alt" href="/login">${t('Log in')}</a>`}</div></div>
      <div class="arch" role="img" aria-label="${esc(t('Arch with crescent'))}"></div></section>
    <h2>${t('How it works')}</h2><ol class="steps"><li>${t('<b>Register</b> for yourself or a family member — free, first 3 months free.')}</li><li>${t('<b>Get verified:</b> upload an ID and a photo. Our admin checks them; the ID is deleted after checking.')}</li><li>${t('<b>Receive {n} matching profiles a month</b> — matched both ways on age and maslak, same city first.', { n: CFG.monthly })}</li><li>${t('<b>Send interest.</b> When both sides accept, contact details are shared. Please involve family / wali.')}</li></ol>
    <h2>${t('Simple pricing')}</h2><div class="price"><div class="box"><b>${t('Free')}</b>${t('Registration + first 3 months')}</div><div class="box"><b>${rs(CFG.person)}</b>${t('per 30 days for brides and grooms')}</div><div class="box"><b>${rs(CFG.broker)}</b>${t('per 30 days for marriage brokers, up to {n} candidates', { n: CFG.cap })}</div></div>
    <p class="note">${t('Profiles that are not renewed are hidden immediately and come back as soon as the plan is renewed.')}</p>${S.extra}`, { path: '/', fullTitle: S.title, desc: S.desc, head: S.head })); });

  both('/privacy', (req, res) => { const t = req.t; res.send(page(req, t('Privacy'), `<h1>${t('Privacy')}</h1><div class="box">
    <p>${t('We collect your mobile number, optional email, and the profile details you enter. ID proof is used only to verify you and is deleted after the admin decision; we keep only a "verified" mark and your profile photo.')}</p>
    <p>${t('Other members see your profile without your name, phone or photo. These are shared only with a member whose interest you accept (or who accepts yours).')}</p>
    <p>${t('You can delete your account and all your data at any time from Account → Delete account. Payments are processed by Razorpay; we do not store card or UPI details.')}</p>
    <p>${t('Contact: {email}', { email: esc(CONTACT()) })}</p></div>`, { path: '/privacy', head: headTags(req, { path: '/privacy', title: t('Privacy') + ' · ENikah', desc: t('ENikah — verified Muslim matrimony for families. Free registration, first 3 months free.') }) })); });
  both('/terms', (req, res) => { const t = req.t; res.send(page(req, t('Terms'), `<h1>${t('Terms')}</h1><div class="box">
    <p>${t("ENikah is for adults seeking marriage only (brides 18+, grooms 21+). Profiles must be genuine and entered with the person's consent. Fake, misleading or abusive profiles are blocked without refund.")}</p>
    <p>${t('Plans run for 30 days and are renewed manually. Profiles without an active plan are hidden. Fees are non-refundable once matches have been shown.')}</p>
    <p>${t("ENikah verifies identity documents but does not guarantee anyone's statements. Families should make their own enquiries before any commitment.")}</p></div>`, { path: '/terms', head: headTags(req, { path: '/terms', title: t('Terms') + ' · ENikah', desc: t('ENikah — verified Muslim matrimony for families. Free registration, first 3 months free.') }) })); });

  // ---------- accounts ----------
  const regForm = (req, e, b = {}) => { const t = req.t; return page(req, t('Register'), `<h1>${t('Register free')}</h1><p class="note">${t("First 3 months free. Use your own number or a family member's.")}</p>${errBox(t, e)}
    <form class="fl box" method="post" action="/register">
      <label>${t('Mobile number')}<input name="phone" inputmode="tel" autocomplete="tel" value="${esc(b.phone)}" placeholder="${esc(t('10-digit mobile'))}" required></label>
      <label>${t('Password')} <small>${t('At least 6 characters')}</small><input name="password" type="password" autocomplete="new-password" required minlength="6"></label>
      <label>${t('Email')} <small>${t('Optional — for alerts and password reset')}</small><input name="email" type="email" autocomplete="email" value="${esc(b.email)}"></label>
      <label>${t('I am registering as')}<select name="kind"><option value="person">${t('Bride / groom (myself or family)')}</option><option value="broker" ${b.kind === 'broker' ? 'selected' : ''}>${t('Marriage broker')}</option></select></label>
      <button>${t('Create account')}</button><p class="note">${t('Already registered?')} <a href="/login">${t('Log in')}</a></p></form>`); };
  app.get('/register', (req, res) => req.user ? go(res, '/home') : res.send(regForm(req)));
  app.post('/register', h(async (req, res) => {
    if (limited('reg:' + req.ip, 40)) return res.status(429).send(regForm(req, 'Too many attempts. Please try again in 15 minutes.', req.body));
    const r = await C.register(req.body);
    if (r.err) return res.status(400).send(regForm(req, r.err, req.body));
    await startSession(res, r.phone);
    go(res, r.next);
  }));

  const loginForm = (req, e) => { const t = req.t; return page(req, t('Log in'), `<h1>${t('Log in')}</h1>${errBox(t, e)}<form class="fl box" method="post" action="/login${req.query.next ? '?next=' + encodeURIComponent(req.query.next) : ''}">
    <label>${t('Mobile number')}<input name="phone" inputmode="tel" autocomplete="tel" required></label><label>${t('Password')}<input name="password" type="password" autocomplete="current-password" required></label>
    <button>${t('Log in')}</button><p class="note"><a href="/forgot">${t('Forgot password?')}</a> · ${t('New here?')} <a href="/register">${t('Register free')}</a></p></form>`); };
  app.get('/login', (req, res) => req.user ? go(res, '/home') : res.send(loginForm(req)));
  app.post('/login', h(async (req, res) => {
    if (limited('login:' + req.ip) || limited('login:' + C.normPhone(req.body.phone))) return res.status(429).send(loginForm(req, 'Too many attempts. Please try again in 15 minutes.'));
    const ph = await C.login(req.body.phone, req.body.password);
    if (!ph) return res.status(401).send(loginForm(req, 'Wrong mobile number or password.'));
    await startSession(res, ph);
    const next = String(req.query.next || '');
    go(res, next.startsWith('/') && !next.startsWith('//') ? next : '/home');
  }));
  app.post('/logout', h(async (req, res) => { if (req.sid) await q('delete from tokens where token=$1', [req.sid]); res.clearCookie('sid', { path: '/' }); go(res, '/'); }));

  app.get('/forgot', (req, res) => { const t = req.t; res.send(page(req, t('Reset password'), `<h1>${t('Reset password')}</h1><form class="fl box" method="post" action="/forgot"><label>${t('Mobile number')}<input name="phone" inputmode="tel" required></label><button>${t('Send reset link')}</button>
    <p class="note">${t('The link goes to the email on your account. No email on your account? Contact {email}.', { email: esc(CONTACT()) })}</p></form>`)); });
  app.post('/forgot', h(async (req, res) => {
    const ph = C.normPhone(req.body.phone), u = ph && await C.user(ph);
    if (u?.email && !limited('forgot:' + ph)) {
      const tk = await C.newToken('reset', ph, '', null, 1);
      await sendMail(u.email, 'ENikah password reset', `Reset your ENikah password (valid 1 hour):\n${CFG.base}/reset/${tk}\n\nIf you didn't ask for this, ignore this email.`);
    }
    go(res, '/login', 'If that number has an email on file, a reset link has been sent.');
  }));
  app.get('/reset/:t', h(async (req, res) => {
    const t = req.t;
    if (!await C.getToken(req.params.t, 'reset')) return res.status(410).send(page(req, t('Link expired'), `<h1>${t('This link has expired')}</h1><p><a href="/forgot">${t('Request a new one')}</a></p>`));
    res.send(page(req, t('New password'), `<h1>${t('Choose a new password')}</h1><form class="fl box" method="post"><label>${t('New password')}<input name="password" type="password" minlength="6" required autocomplete="new-password"></label><button>${t('Save password')}</button></form>`));
  }));
  app.post('/reset/:t', h(async (req, res) => {
    const tk = await C.getToken(req.params.t, 'reset');
    if (!tk) return go(res, '/forgot', 'This link has expired.');
    if (String(req.body.password || '').length < 6) return go(res, `/reset/${req.params.t}`, 'Password must be at least 6 characters.');
    await q('update users set pw=$2 where phone=$1', [tk.phone, C.hashPw(req.body.password)]);
    await q(`delete from tokens where phone=$1 and kind in ('reset','sess')`, [tk.phone]);
    go(res, '/login', 'Password changed. Please log in.');
  }));

  app.get('/account', need(), (req, res) => { const t = req.t; res.send(page(req, t('Account'), `<h1>${t('Account')}</h1>
    <form class="fl box" method="post" action="/account"><h3>${t('Contact')}</h3><p class="note">${t('Mobile')}: +${esc(req.user.phone)}</p><label>${t('Email')} <small>${t('For alerts and password reset')}</small><input name="email" type="email" value="${esc(req.user.email)}"></label>
    <label>${t('New password')} <small>${t('Leave empty to keep the current one')}</small><input name="password" type="password" minlength="6" autocomplete="new-password"></label><button>${t('Save')}</button></form>
    ${req.user.type === 'admin' ? '' : `<form class="fl box" method="post" action="/account/delete"><h3>${t('Delete account')}</h3><p class="note">${t(req.user.type === 'broker' ? 'Removes your account, all your candidates, interests and documents permanently.' : 'Removes your account, profile, interests and documents permanently.')}</p>
    <label>${t('Type DELETE to confirm')}<input name="confirm" required autocapitalize="characters"></label><button class="red">${t('Delete everything')}</button></form>`}`)); });
  app.post('/account', need(), h(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return go(res, '/account', 'Please enter a valid email.');
    await q('update users set email=$2 where phone=$1', [req.user.phone, email || null]);
    if (req.body.password) { if (req.body.password.length < 6) return go(res, '/account', 'Password must be at least 6 characters.'); await q('update users set pw=$2 where phone=$1', [req.user.phone, C.hashPw(req.body.password)]); }
    go(res, '/account', 'Saved.');
  }));
  app.post('/account/delete', need('person', 'broker', null), h(async (req, res) => {
    if (String(req.body.confirm || '').trim().toUpperCase() !== 'DELETE') return go(res, '/account', 'Please type DELETE to confirm.');
    await C.deleteAccount(req.user.phone); res.clearCookie('sid', { path: '/' });
    go(res, '/', 'Your account and data have been deleted.');
  }));

  app.get('/home', need(), (req, res) => {
    const ty = req.user.type;
    go(res, ty === 'admin' ? '/admin' : ty === 'broker' ? '/broker' : ty === 'person' ? '/dashboard' : '/profile/new', req.query.msg);
  });

  // ---------- person ----------
  app.get('/profile/new', need(null), (req, res) => { const t = req.t; res.send(page(req, t('Create profile'), `<h1>${t('Create the profile')}</h1><p class="note">${t('For yourself or a family member. Free, with the first 3 months free.')}</p>${profileForm(t, {}, { submit: 'Create profile', action: '/profile/new' })}
    <p class="note">${t('Are you a marriage broker?')} <a href="/broker/setup">${t('Set up a broker account instead')}</a></p>`)); });
  app.post('/profile/new', need(null), h(async (req, res) => {
    const t = req.t, v = C.validateProfile(req.body);
    if (v.err) return res.status(400).send(page(req, t('Create profile'), `<h1>${t('Create the profile')}</h1>${errBox(t, v.err)}${profileForm(t, req.body, { submit: 'Create profile', action: '/profile/new' })}`));
    const id = await C.createProfile(req.user.phone, v.d, false);
    go(res, '/dashboard', `Registered! Profile ENK${id} is free for ${CFG.free} days. Next: upload your ID and photo to get verified.`);
  }));

  const renewBtn = (t, label) => `<form method="post" action="/renew"><button class="gold">${esc(label)}</button></form>`;
  const notesBox = (t, notes) => notes.length ? `<h2>${t('Updates')}</h2><div class="box">${notes.map(n => `<p${n.seen ? ' class="note"' : ''}>${esc(D(n.created))} — ${esc(t(n.text))}${n.link ? ` <a href="${esc(n.link)}">${t('Open')}</a>` : ''}</p>`).join('')}</div>` : '';

  app.get('/dashboard', need('person'), h(async (req, res) => {
    const t = req.t, p = await getP(req.user.pid);
    if (!p) { await q('update users set type=null,pid=null where phone=$1', [req.user.phone]); return go(res, '/profile/new'); }
    const used = await C.usedThisMonth(p), block = await C.searchBlock(p);
    const pend = +(await one(`select count(*) n from interests where to_id=$1 and st='sent'`, [p.id])).n;
    const notes = await all('select * from notes where phone=$1 order by id desc limit 8', [req.user.phone]);
    await q('update notes set seen=true where phone=$1 and not seen', [req.user.phone]);
    res.send(page(req, t('My profile'), `<h1>${t('Salam, {name}', { name: esc(p.name.split(' ')[0]) })}</h1>
      <div class="stats"><div class="stat"><b>${esc(p.code)}</b><span>${sideT(t, p)}, ${p.age}, ${esc(p.city)}</span></div>
      <div class="stat"><b>${t(p.live ? 'Active' : 'Expired')}</b><span>${p.live ? t('Plan till {date}', { date: D(p.exp) }) : t('Hidden since {date}', { date: D(p.exp) })}</span></div>
      <div class="stat"><b>${t('status:' + p.status)}</b><span>${t('Verification')}</span></div><div class="stat"><b>${used} / ${CFG.monthly}</b><span>${t('Profiles this month')}</span></div></div>
      ${block ? `<div class="box"><p>${esc(t(block.msg))}</p><div class="acts">${block.verify ? `<a class="btn" href="/verify/${block.verify}">${t('Upload ID & photo')}</a>` : ''}${block.renew ? renewBtn(t, t('Renew {price}', { price: rs(CFG.person) })) : ''}</div></div>`
        : `<div class="box"><h3>${t('Your matches')}</h3><p class="note">${wantText(t, p)}</p><div class="acts"><a class="btn" href="/matches/${p.id}">${t('See my matches')}</a><a class="btn alt" href="/interests">${t('Interests')}${pend ? ' ' + t('({n} new)', { n: pend }) : ''}</a></div></div>`}
      <div class="box"><h3>${t('Plan')}</h3><p class="note">${t('{price} per 30 days. Renewing adds 30 days to your current end date, so you lose nothing by paying early.', { price: rs(CFG.person) })}</p><div class="acts">${renewBtn(t, t('Renew {price}', { price: rs(CFG.person) }))}<a class="btn alt" href="/profile/${p.id}/edit">${t('Edit profile')}</a></div></div>
      ${notesBox(t, notes)}`));
  }));

  app.get('/profile/:id/edit', need('person', 'broker'), h(async (req, res) => {
    const t = req.t, p = await getP(+req.params.id);
    if (!C.owns(req.user.phone, p)) return go(res, '/home', 'Profile not found.');
    res.send(page(req, t('Edit profile'), `<h1>${t('Edit {code}', { code: esc(p.code) })}</h1><p class="note">${t("{side} — this can't be changed.", { side: sideT(t, p) })}</p>${profileForm(t, p, { gender: false, submit: 'Save changes', action: `/profile/${p.id}/edit` })}`));
  }));
  app.post('/profile/:id/edit', need('person', 'broker'), h(async (req, res) => {
    const t = req.t, p = await getP(+req.params.id);
    if (!C.owns(req.user.phone, p)) return go(res, '/home', 'Profile not found.');
    const v = C.validateProfile(req.body, { keepGender: p.g });
    if (v.err) return res.status(400).send(page(req, t('Edit profile'), `<h1>${t('Edit {code}', { code: esc(p.code) })}</h1>${errBox(t, v.err)}${profileForm(t, { ...req.body, g: p.g }, { gender: false, submit: 'Save changes', action: `/profile/${p.id}/edit` })}`));
    await C.updateProfile(p.id, v.d);
    go(res, p.broker ? '/broker' : '/dashboard', 'Profile updated.');
  }));

  // ---------- verification ----------
  app.get('/verify/:t', need('person', 'broker'), h(async (req, res) => {
    const t = req.t, target = req.params.t === 'b' ? 'b' : String(+req.params.t), st = await C.verStatus(req.user.phone, target);
    if (!st) return go(res, '/home', 'Not found.');
    if (st !== 'unverified') return go(res, '/home', st === 'pending' ? 'Documents already submitted. The admin will check them soon.' : st === 'verified' ? 'Already verified.' : 'This profile is blocked.');
    res.send(page(req, t('Verify'), `<h1>${target === 'b' ? t('Verify your broker account') : t('Verify {code}', { code: 'ENK' + esc(target) })}</h1>
      <p class="note">${t(target === 'b' ? 'Only verified members can see profiles and be seen. The ID image is deleted after the admin checks it; we keep only a "verified" mark.' : 'Only verified members can see profiles and be seen. The ID image is deleted after the admin checks it; we keep only a "verified" mark and the photo (shown only to people whose interest is accepted).')}</p>
      <form class="fl box" method="post" enctype="multipart/form-data"><label>${t('ID proof')} <small>${t('Aadhaar, passport, voter ID or licence — photo or PDF, max 6 MB. You may cover the ID number.')}</small><input type="file" name="id_doc" accept="image/*,application/pdf" required></label>
      ${target === 'b' ? '' : `<label>${t('Recent photo of the bride / groom')}<input type="file" name="photo" accept="image/*" required></label>`}<button>${t('Submit for verification')}</button></form>`));
  }));
  app.post('/verify/:t', need('person', 'broker'), upload.fields([{ name: 'id_doc', maxCount: 1 }, { name: 'photo', maxCount: 1 }]), h(async (req, res) => {
    const target = req.params.t === 'b' ? 'b' : String(+req.params.t);
    if (await C.verStatus(req.user.phone, target) !== 'unverified') return go(res, '/home');
    const idf = req.files?.id_doc?.[0], ph = req.files?.photo?.[0];
    if (!idf || (target !== 'b' && !ph)) return go(res, `/verify/${target}`, 'Please attach the required files (JPG, PNG or PDF under 6 MB).');
    await C.submitDocs(req.user.phone, target, idf, ph);
    go(res, '/home', 'Documents received. The admin will verify within 24 hours.');
  }));

  // ---------- matches ----------
  app.get('/matches/:pid', need('person', 'broker'), h(async (req, res) => {
    const t = req.t, p = await getP(+req.params.pid);
    if (!C.owns(req.user.phone, p)) return go(res, '/home', 'Profile not found.');
    const block = await C.searchBlock(p);
    const used = block ? 0 : await C.usedThisMonth(p);
    const all_ = block ? [] : await C.shownAll(p), list = all_.filter(v => v.this_month), older = all_.filter(v => !v.this_month);
    const sent = new Map((await all('select to_id, st from interests where from_id=$1', [p.id])).map(r => [r.to_id, r.st]));
    const mcard = v => { const s = sent.get(v.id), ok = visible(v);
      return profileCard(t, v, `<form method="post" action="/interest"><input type="hidden" name="from" value="${p.id}"><input type="hidden" name="to" value="${v.id}"><button ${ok && !s ? '' : 'disabled'}>${!ok ? t('No longer available') : s ? t('interest:' + s) : t('Send interest')}</button></form>
        <details><summary>${t('Report this profile')}</summary><form class="fl" method="post" action="/report"><input type="hidden" name="pid" value="${v.id}"><input name="reason" placeholder="${esc(t('What is wrong?'))}" maxlength="300" required><button class="alt">${t('Send report')}</button></form></details>`); };
    res.send(page(req, t('Matches'), `<h1>${t('Matches for {code}', { code: esc(p.code) })}${p.broker ? ' · ' + esc(p.name) : ''}</h1>
      ${block ? `<div class="box"><p>${esc(t(block.msg))}</p><div class="acts">${block.verify ? `<a class="btn" href="/verify/${block.verify}">${t('Upload documents')}</a>` : ''}${block.renew ? renewBtn(t, t('Renew now')) : ''}</div></div>` : `
      <p class="note">${wantText(t, p)}. ${t('This month: <b>{used} of {max}</b> profiles (plan till {date}).', { used, max: CFG.monthly, date: D(p.till) })}</p>
      ${used < CFG.monthly ? `<form method="post" action="/matches/${p.id}"><button>${t(list.length ? 'Show more matches ({n} left this month)' : 'Show my matches ({n} left this month)', { n: CFG.monthly - used })}</button></form>` : `<div class="acts">${p.broker ? '' : renewBtn(t, t('Renew for {n} more', { n: CFG.monthly }))}</div>`}
      <h2>${t("This month's profiles")}</h2>${list.length ? `<div class="cards">${list.map(mcard).join('')}</div>` : `<p class="note">${t('No profiles yet this month — tap the button above.')}</p>`}
      ${older.length ? `<h2>${t('Earlier matches')}</h2><div class="cards">${older.map(mcard).join('')}</div>` : ''}`}`));
  }));
  app.post('/matches/:pid', need('person', 'broker'), h(async (req, res) => {
    const p = await getP(+req.params.pid);
    if (!C.owns(req.user.phone, p)) return go(res, '/home', 'Profile not found.');
    go(res, `/matches/${p.id}`, (await C.allocate(p)).msg);
  }));
  app.post('/interest', need('person', 'broker'), h(async (req, res) => go(res, `/matches/${+req.body.from}`, await C.sendInterest(req.user.phone, +req.body.from, +req.body.to))));
  app.post('/report', need('person', 'broker'), h(async (req, res) => { await C.report(req.user.phone, +req.body.pid, req.body.reason); go(res, req.get('referer')?.replace(/^https?:\/\/[^/]+/, '').split('?')[0] || '/home', 'Thank you. The admin will review this report.'); }));

  // ---------- interests ----------
  app.get('/interests', need('person', 'broker'), h(async (req, res) => {
    const t = req.t, ids = await C.myPids(req.user.phone);
    const rec = await all(`select i.*, 'ENK'||i.to_id mine from interests i where to_id = any($1) and st='sent' order by id desc`, [ids]);
    const accd = await all(`select * from interests where (to_id = any($1) or from_id = any($1)) and st='accepted' order by id desc`, [ids]);
    const sent = await all(`select * from interests where from_id = any($1) and st<>'accepted' order by id desc limit 30`, [ids]);
    const recHtml = (await Promise.all(rec.map(async x => { const f = await getP(x.from_id); return f ? profileCard(t, f, `<span>${t('For {code}', { code: esc(x.mine) })}</span><div class="acts"><form method="post" action="/interests/${x.id}"><input type="hidden" name="ok" value="1"><button>${t('Accept')}</button></form><form method="post" action="/interests/${x.id}"><input type="hidden" name="ok" value="0"><button class="alt">${t('Decline')}</button></form></div>`) : ''; }))).join('');
    const accHtml = (await Promise.all(accd.map(async x => { const mine = ids.includes(x.from_id) ? x.from_id : x.to_id, other = await getP(mine === x.from_id ? x.to_id : x.from_id); if (!other) return ''; const c = await C.contact(other);
      return profileCard(t, other, `<span>${t('With {code}', { code: 'ENK' + mine })}</span><b>${esc(c.who)}</b><a href="tel:${esc(c.phone)}">${esc(c.phone)}</a><a href="https://wa.me/${esc(c.phone.slice(1))}">${t('Message on WhatsApp')}</a>`, true); }))).join('');
    res.send(page(req, t('Interests'), `<h1>${t('Interests')}</h1>
      <h2>${t('Received')}</h2>${rec.length ? `<div class="cards">${recHtml}</div>` : `<p class="note">${t('No new interests.')}</p>`}
      <h2>${t('Accepted — contact details')}</h2>${accd.length ? `<p class="note">${t('Please involve family / wali in every conversation.')}</p><div class="cards">${accHtml}</div>` : `<p class="note">${t('None yet.')}</p>`}
      <h2>${t('Sent')}</h2>${sent.length ? `<table class="stack"><thead><tr><th>${t('From')}</th><th>${t('To')}</th><th>${t('Status')}</th></tr></thead><tbody>${sent.map(x => `<tr><td>ENK${x.from_id}</td><td>ENK${x.to_id}</td><td>${t('interest:' + x.st)}</td></tr>`).join('')}</tbody></table>` : `<p class="note">${t('None yet.')}</p>`}`));
  }));
  app.post('/interests/:id', need('person', 'broker'), h(async (req, res) => go(res, '/interests', await C.answer(req.user.phone, +req.params.id, req.body.ok === '1'))));

  // Photo only for: the profile's own account, admin, or someone with an accepted interest.
  app.get('/photo/:pid', need(), h(async (req, res) => {
    const p = await one('select id, owner, broker, photo, photo_mime from profiles where id=$1', [+req.params.pid]);
    if (!p?.photo) return res.sendStatus(404);
    let ok = req.user.type === 'admin' || C.owns(req.user.phone, p);
    if (!ok) { const ids = await C.myPids(req.user.phone); ok = !!(await one(`select 1 from interests where st='accepted' and ((from_id=$1 and to_id = any($2)) or (to_id=$1 and from_id = any($2)))`, [p.id, ids])); }
    if (!ok) return res.sendStatus(403);
    res.set({ 'Content-Type': p.photo_mime, 'Cache-Control': 'private, no-store' }).send(p.photo);
  }));

  // ---------- broker ----------
  app.get('/broker/setup', need(null), (req, res) => { const t = req.t; res.send(page(req, t('Broker account'), `<h1>${t('Set up your broker account')}</h1><p class="note">${t('Free for {days} days, then {price} per 30 days. Up to {n} candidates. Your candidates are shown only while your plan is active.', { days: CFG.free, price: rs(CFG.broker), n: CFG.cap })}</p>
    <form class="fl box" method="post"><label>${t('Your name or bureau name')}<input name="name" required maxlength="60"></label><label>${t('Area / town you work in')}<input name="city" required maxlength="40"></label><button>${t('Create broker account')}</button></form>`)); });
  app.post('/broker/setup', need(null), h(async (req, res) => {
    const e = await C.setupBroker(req.user.phone, req.body.name, req.body.city);
    go(res, e ? '/broker/setup' : '/broker', e || 'Broker account created. Next: upload your ID to get verified.');
  }));
  app.get('/broker', need('broker'), h(async (req, res) => {
    const t = req.t, u = req.user, live = new Date(u.exp) > new Date();
    const L = await all(P_SQL + ' where p.broker=$1 order by p.id', [u.phone]);
    const notes = await all('select * from notes where phone=$1 order by id desc limit 8', [u.phone]);
    await q('update notes set seen=true where phone=$1 and not seen', [u.phone]);
    res.send(page(req, t('Broker'), `<h1>${esc(u.name)}</h1>
      <div class="stats"><div class="stat"><b>${t(live ? 'Active' : 'Expired')}</b><span>${live ? t('Plan till {date}', { date: D(u.exp) }) : t('Candidates hidden since {date}', { date: D(u.exp) })}</span></div><div class="stat"><b>${t('status:' + u.status)}</b><span>${t('Broker ID')}</span></div><div class="stat"><b>${L.length} / ${CFG.cap}</b><span>${t('Candidates')}</span></div></div>
      <div class="acts">${u.status === 'unverified' ? `<a class="btn" href="/verify/b">${t('Verify my ID')}</a>` : ''}${L.length < CFG.cap && live ? `<a class="btn" href="/broker/new">${t('Add candidate')}</a>` : ''}${renewBtn(t, t('Renew {price}', { price: rs(CFG.broker) }))}</div>
      <h2>${t('Candidates')}</h2>${L.length ? `<table class="stack"><thead><tr><th>${t('Profile')}</th><th>${t('Details')}</th><th>${t('Status')}</th><th></th></tr></thead><tbody>${L.map(p => `<tr><td><b>${esc(p.code)}</b> ${esc(p.name)}</td><td>${sideT(t, p)}, ${p.age}, ${esc(p.city)}</td><td><span class="tag ${p.status === 'verified' ? 'ok' : p.status === 'blocked' ? 'no' : ''}">${t('status:' + p.status)}</span></td>
        <td><div class="acts">${p.status === 'unverified' ? `<a class="btn alt" href="/verify/${p.id}">${t('Verify')}</a>` : ''}${p.status === 'verified' ? `<a class="btn" href="/matches/${p.id}">${t('Matches')}</a>` : ''}<a class="btn alt" href="/profile/${p.id}/edit">${t('Edit')}</a></div></td></tr>`).join('')}</tbody></table>` : `<p class="note">${t('No candidates yet.')}</p>`}
      ${notesBox(t, notes)}`));
  }));
  app.get('/broker/new', need('broker'), h(async (req, res) => {
    const t = req.t, e = await C.canAddCandidate(req.user.phone); if (e) return go(res, '/broker', e);
    res.send(page(req, t('Add candidate'), `<h1>${t('Add a candidate')}</h1><p class="note">${t("Add only with the candidate's and family's consent.")}</p>${profileForm(t, {}, { submit: 'Add candidate', action: '/broker/new' })}`));
  }));
  app.post('/broker/new', need('broker'), h(async (req, res) => {
    const t = req.t, e = await C.canAddCandidate(req.user.phone); if (e) return go(res, '/broker', e);
    const v = C.validateProfile(req.body);
    if (v.err) return res.status(400).send(page(req, t('Add candidate'), `<h1>${t('Add a candidate')}</h1>${errBox(t, v.err)}${profileForm(t, req.body, { submit: 'Add candidate', action: '/broker/new' })}`));
    const id = await C.createProfile(req.user.phone, v.d, true);
    go(res, '/broker', `Candidate ENK${id} added. Upload their ID and photo to verify.`);
  }));

  // ---------- payments ----------
  app.post('/renew', need('person', 'broker'), h(async (req, res) => {
    const amt = req.user.type === 'broker' ? CFG.broker : CFG.person;
    try { res.redirect(303, await createLink(req.user.phone, req.user.type, amt)); }
    catch (e) { console.error(e); go(res, '/home', 'Sorry, the payment page could not be opened. Please try again in a few minutes.'); }
  }));
  app.get('/paid', h(async (req, res) => {
    if (callbackOk(req.query) && req.query.razorpay_payment_link_status === 'paid') { const p = await markPaid(req.query.razorpay_payment_link_id); if (p) await C.onPaid(p); }
    go(res, req.user ? '/home' : '/login', req.query.razorpay_payment_link_status === 'paid' ? 'Payment received. JazakAllah khair — your plan is extended.' : 'Payment not completed. You can try again anytime.');
  }));

  // ---------- admin ----------
  // Separate admin login (like VasulBook): username = admin email or admin mobile, password = ADMIN_PASSWORD in Railway.
  const adminForm = (req, e) => { const t = req.t; return page(req, t('Admin login'), `<h1>${t('Admin login')}</h1>${errBox(t, e)}<form class="fl box" method="post" action="/admin/login${req.query.next ? '?next=' + encodeURIComponent(req.query.next) : ''}">
    <label>${t('Username')} <small>${t('Admin email or mobile number')}</small><input name="username" autocomplete="username" required></label><label>${t('Password')}<input name="password" type="password" autocomplete="current-password" required></label><button>${t('Log in')}</button></form>`); };
  const adminUser = u => {
    u = String(u || '').trim().toLowerCase();
    const emails = String(process.env.ADMIN_EMAIL || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
    const ph = C.normPhone(u);
    return emails.includes(u) || (ph && ADMINS.includes(ph));
  };
  const pwOk = pw => { const real = process.env.ADMIN_PASSWORD || ''; if (real.length < 8) return false;
    const a = crypto.createHash('sha256').update(String(pw)).digest(), b = crypto.createHash('sha256').update(real).digest(); return crypto.timingSafeEqual(a, b); };
  app.get('/admin/login', (req, res) => req.user?.type === 'admin' ? go(res, '/admin') : res.send(adminForm(req)));
  app.post('/admin/login', h(async (req, res) => {
    if (limited('admin:' + req.ip, 8)) return res.status(429).send(adminForm(req, 'Too many attempts. Please try again in 15 minutes.'));
    if (!ADMINS.length || !adminUser(req.body.username) || !pwOk(req.body.password)) return res.status(401).send(adminForm(req, 'Wrong username or password.'));
    const ph = ADMINS[0];
    await q(`insert into users(phone,type) values($1,'admin') on conflict(phone) do update set type='admin'`, [ph]);
    await startSession(res, ph);
    const next = String(req.query.next || '');
    go(res, next.startsWith('/admin') ? next : '/admin');
  }));

  app.get('/admin', need('admin'), h(async (req, res) => {
    const t = req.t;
    const r = await one(`select (select count(*) from (${P_SQL}) v where v.live and v.status='verified') live, (select count(*) from (${P_SQL}) v where not v.live) hidden,
      (select count(*) from users where type='person') people, (select count(*) from users where type='broker' and exp>now()) brokers,
      (select count(*) from interests) ints, (select count(*) from interests where st='accepted') acc,
      (select coalesce(sum(amount),0) from payments where status='paid' and paid_at>=date_trunc('month', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata') mon,
      (select coalesce(sum(amount),0) from payments where status='paid') total`);
    const pend = await all(P_SQL + ` where p.status='pending' order by p.id`);
    const pb = await all(`select * from users where type='broker' and status='pending'`);
    const docs = new Map((await all(`select distinct on (kind, ref) id, kind, ref, id_mime, photo_mime from docs order by kind, ref, id desc`)).map(d => [d.kind + ':' + d.ref, d]));
    const reps = await all(`select r.*, p.status from reports r left join profiles p on p.id=r.pid order by r.id desc limit 20`);
    const exp = await all(`select 'ENK'||id code, name, exp from profiles where owner is not null and exp>now() and exp<now()+interval '7 days' union all select 'Broker', name, exp from users where type='broker' and exp>now() and exp<now()+interval '7 days' order by exp`);
    const show = (d, part, mime) => !d ? `<p class="note">${t('No document')}</p>` : mime === 'application/pdf' ? `<a href="/admin/doc/${d.id}/${part}">${t('Open PDF')}</a>` : `<img class="doc" src="/admin/doc/${d.id}/${part}" alt="${part}">`;
    const decideBtns = (kind, ref) => `<div class="acts"><form method="post" action="/admin/decide"><input type="hidden" name="kind" value="${kind}"><input type="hidden" name="ref" value="${esc(ref)}"><input type="hidden" name="ok" value="1"><button>${t('Approve')}</button></form><form method="post" action="/admin/decide"><input type="hidden" name="kind" value="${kind}"><input type="hidden" name="ref" value="${esc(ref)}"><input type="hidden" name="ok" value="0"><button class="red">${t('Reject')}</button></form></div>`;
    const find = req.query.find && await getP(+String(req.query.find).replace(/\D/g, ''));
    const det = p => `${sideT(t, p)}, ${p.age}, ${esc(p.city)} · ${esc(t(p.maslak))} · ${esc(p.edu)} · ${esc(p.job)} · ${esc(t(p.marital))}`;
    res.send(page(req, t('Admin'), `<h1>${t('Admin')}</h1>
      <div class="stats"><div class="stat"><b>${r.live}</b><span>${t('Live & verified profiles')}</span></div><div class="stat"><b>${r.hidden}</b><span>${t('Hidden (not renewed)')}</span></div><div class="stat"><b>${r.people} · ${r.brokers}</b><span>${t('Members · active brokers')}</span></div><div class="stat"><b>${r.ints} · ${r.acc}</b><span>${t('Interests · accepted')}</span></div><div class="stat"><b>${rs(r.mon)}</b><span>${t('Revenue this month (total {total})', { total: rs(r.total) })}</span></div></div>
      <h2>${t('Pending verification ({n})', { n: pend.length + pb.length })}</h2>
      ${pend.map(p => { const d = docs.get('p:' + p.id); return `<div class="box"><h3>${esc(p.code)} · ${esc(p.name)}</h3><p>${det(p)}<br><span class="note">${p.broker ? t('Broker') + ' +' + esc(p.broker) : t('Mobile') + ' +' + esc(p.owner)}</span></p><div class="row"><div><h3>${t('ID')}</h3>${show(d, 'id', d?.id_mime)}</div><div><h3>${t('Photo')}</h3>${show(d, 'photo', d?.photo_mime)}</div></div>${decideBtns('p', p.id)}</div>`; }).join('')}
      ${pb.map(b => { const d = docs.get('b:' + b.phone); return `<div class="box"><h3>${t('Broker')} · ${esc(b.name)}</h3><p>${esc(b.city)} · +${esc(b.phone)}</p>${show(d, 'id', d?.id_mime)}${decideBtns('b', b.phone)}</div>`; }).join('')}
      ${pend.length + pb.length ? '' : `<p class="note">${t('Nothing pending.')}</p>`}
      <h2>${t('Find a profile')}</h2><form class="row" method="get" action="/admin"><input name="find" placeholder="ENK1234" value="${esc(req.query.find)}"><button>${t('Find')}</button></form>
      ${req.query.find ? (find ? `<div class="box"><h3>${esc(find.code)} · ${esc(find.name)}</h3><p>${det(find)}<br>${t('Status')}: <b>${t('status:' + find.status)}</b> · ${t(find.live ? 'Active' : 'Expired')} · ${t('Plan till {date}', { date: D(find.till) })} · ${find.broker ? t('Broker') + ' +' + esc(find.broker) : t('Mobile') + ' +' + esc(find.owner)}</p>
        <div class="acts"><form method="post" action="/admin/block"><input type="hidden" name="id" value="${find.id}"><input type="hidden" name="on" value="${find.status === 'blocked' ? 0 : 1}"><button class="${find.status === 'blocked' ? '' : 'red'}">${t(find.status === 'blocked' ? 'Unblock' : 'Block')}</button></form>
        <form method="post" action="/admin/extend"><input type="hidden" name="id" value="${find.id}"><button class="gold">${t('Add 30 days (cash payment {price})', { price: rs(find.broker ? CFG.broker : CFG.person) })}</button></form></div>${find.broker ? `<p class="note">${t("Adding days to a candidate extends the broker's plan.")}</p>` : ''}</div>` : `<p class="note">${t('Not found.')}</p>`) : ''}
      <h2>${t('Reports')}</h2>${reps.length ? `<table class="stack"><thead><tr><th>${t('Profile')}</th><th>${t('Reason')}</th><th>${t('From')}</th><th></th></tr></thead><tbody>${reps.map(x => `<tr><td><a href="/admin?find=ENK${x.pid}">ENK${x.pid}</a> (${t('status:' + (x.status || 'deleted'))})</td><td>${esc(x.reason)}</td><td>+${esc(x.phone)} · ${D(x.created)}</td><td>${x.status && x.status !== 'blocked' ? `<form method="post" action="/admin/block"><input type="hidden" name="id" value="${x.pid}"><input type="hidden" name="on" value="1"><button class="red">${t('Block')}</button></form>` : ''}</td></tr>`).join('')}</tbody></table>` : `<p class="note">${t('No reports.')}</p>`}
      <h2>${t('Expiring in 7 days')}</h2>${exp.length ? `<table class="stack"><tbody>${exp.map(e => `<tr><td>${esc(e.code === 'Broker' ? t('Broker') : e.code)}</td><td>${esc(e.name)}</td><td>${D(e.exp)}</td></tr>`).join('')}</tbody></table><p class="note">${t('They get reminders 3 days before and on expiry.')}</p>` : `<p class="note">${t('Nothing expiring.')}</p>`}`));
  }));
  app.get('/admin/doc/:id/:part(id|photo)', need('admin'), h(async (req, res) => {
    const d = await one('select * from docs where id=$1', [+req.params.id]);
    const buf = req.params.part === 'id' ? d?.id_doc : d?.photo, mime = req.params.part === 'id' ? d?.id_mime : d?.photo_mime;
    if (!buf) return res.sendStatus(404);
    res.set({ 'Content-Type': mime, 'Cache-Control': 'no-store' }).send(buf);
  }));
  app.post('/admin/decide', need('admin'), h(async (req, res) => go(res, '/admin', await C.decide(req.body.kind === 'b' ? 'b' : 'p', String(req.body.ref), req.body.ok === '1'))));
  app.post('/admin/block', need('admin'), h(async (req, res) => {
    const on = req.body.on === '1', p = await one(`update profiles set status=$2 where id=$1 returning id`, [+req.body.id, on ? 'blocked' : 'verified']);
    go(res, `/admin?find=ENK${+req.body.id}`, p ? `ENK${p.id} ${on ? 'blocked — hidden from everyone' : 'unblocked'}.` : 'Not found.');
  }));
  app.post('/admin/extend', need('admin'), h(async (req, res) => {
    const p = await getP(+req.body.id); if (!p) return go(res, '/admin', 'Not found.');
    const phone = p.broker || p.owner, kind = p.broker ? 'broker' : 'person', amount = p.broker ? CFG.broker : CFG.person;
    const pay = await one(`insert into payments(phone,kind,amount,link_id,status,paid_at) values($1,$2,$3,'cash_'||gen_random_uuid(),'paid',now()) returning *`, [phone, kind, amount]);
    await C.onPaid(pay);
    go(res, `/admin?find=${p.code}`, `Added 30 days for ${p.broker ? 'broker +' + phone : p.code} (cash ${rs(amount)}).`);
  }));
}
