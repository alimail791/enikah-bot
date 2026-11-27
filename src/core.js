// ENikah business rules: accounts, profiles, verification, matching, interests, plans, reminders.
import crypto from 'crypto';
import { q, one, all, getP, P_SQL, visible } from './db.js';
import { CFG, ADMINS, isAdmin, rs, D, card } from './config.js';
import { sendMail } from './mail.js';
import { makeT } from './i18n.js';
import * as wa from './wa.js';
const ta = makeT('ta');

const E = process.env;
export const EXP = days => `date_trunc('second', greatest(now(), coalesce(exp, now())) + make_interval(days => ${Number(days)}))`;
export const user = ph => one('select * from users where phone=$1', [ph]);
export const plus = ph => '+' + ph;

// Indian mobile numbers only: 10 digits, optional 91 / +91 / 0 prefix.
export function normPhone(s) {
  let d = String(s || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) d = '91' + d;
  return /^91[6-9]\d{9}$/.test(d) ? d : null;
}

export function hashPw(pw) {
  const salt = crypto.randomBytes(16);
  return salt.toString('hex') + ':' + crypto.scryptSync(pw, salt, 32).toString('hex');
}
export function checkPw(pw, stored) {
  if (!stored) return false;
  const [s, h] = stored.split(':');
  const x = crypto.scryptSync(String(pw), Buffer.from(s, 'hex'), 32), y = Buffer.from(h, 'hex');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export async function newToken(kind, phone, ref, data, hours) {
  const t = crypto.randomBytes(18).toString('base64url');
  await q(`insert into tokens(token,kind,phone,ref,data,expires) values($1,$2,$3,$4,$5,now() + $6::float8 * interval '1 hour')`, [t, kind, phone, String(ref ?? ''), data || {}, hours]);
  return t;
}
export const getToken = (t, kind) => one('select * from tokens where token=$1 and kind=$2 and expires>now()', [String(t || ''), kind]);

// In-site notification + email if the person gave one.
// wa = [template name, params] sends the same news on WhatsApp too (when WhatsApp sending is on).
export async function notify(phone, text, link, waMsg) {
  await q('insert into notes(phone,text,link) values($1,$2,$3)', [phone, text, link || null]);
  const u = await user(phone);
  if (waMsg) await wa.sendTemplate(phone, waMsg[0], typeof waMsg[1] === 'function' ? waMsg[1](u?.lang) : waMsg[1], u?.lang).catch(e => console.error('[wa]', e));
  if (u?.email && u.email_ok !== false) await sendMail(u.email, 'ENikah: ' + text.split('\n')[0].slice(0, 90), bilingual(text, link)).catch(e => console.error('[mail]', e));
}
export async function notifyAdmins(text, link) {
  for (const a of ADMINS) await q('insert into notes(phone,text,link) values($1,$2,$3)', [a, text, link || '/admin']);
  if (E.ADMIN_EMAIL) await sendMail(E.ADMIN_EMAIL, 'ENikah admin: ' + text.split('\n')[0].slice(0, 90), text + `\n\nOpen: ${CFG.base}${link || '/admin'}`).catch(e => console.error('[mail]', e));
}

// Member emails carry English and Tamil.
export const bilingual = (text, link) => `${text}${link ? `\n\nOpen: ${CFG.base}${link}` : ''}\n\n— தமிழில் —\n${ta(text)}${link ? `\n\nதிறக்க: ${CFG.base}${link}` : ''}\n\nENikah · ${CFG.base}`;

// ---------- accounts ----------
const istNow = () => new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export async function register({ phone, password, email, kind }, { source, lang } = {}) {
  const ph = normPhone(phone);
  if (!ph) return { err: 'Please enter a valid 10-digit Indian mobile number.' };
  if (String(password || '').length < 6) return { err: 'Password must be at least 6 characters.' };
  email = String(email || '').trim().toLowerCase();
  const ex = await user(ph);
  if (ex?.pw) return { err: 'This number is already registered. Please log in.' };
  if (!validEmail(email)) return { err: 'Please enter a valid email.' };
  if (await one('select 1 from users where lower(email)=$1 and email_ok and phone<>$2', [email, ph])) return { err: 'This email is already registered. Please log in.' };
  const type = isAdmin(ph) ? 'admin' : null;
  await q(`insert into users(phone,pw,email,type,source,lang,created) values($1,$2,$3,$4,$5,$6,now())
    on conflict(phone) do update set pw=$2, email=$3, type=coalesce(users.type,$4), source=coalesce(users.source,$5), lang=$6, email_ok=false`,
    [ph, hashPw(password), email, type, String(source || 'unknown').slice(0, 160), lang === 'ta' ? 'ta' : 'en']);
  if (type !== 'admin') await sendEmailCode(ph).catch(e => console.error('[mail]', e));
  if (type !== 'admin') await notifyAdmins(`New registration: ${plus(ph)} as ${kind === 'broker' ? 'marriage broker' : 'bride / groom'} · ${email} · from ${source || 'unknown'} · ${istNow()}`, '/admin').catch(e => console.error('[alert]', e));
  const next = type === 'admin' ? '/admin' : kind === 'broker' ? '/broker/setup' : '/profile/new';
  return { phone: ph, next: type === 'admin' ? next : '/verify-email?next=' + encodeURIComponent(next) };
}

// Log in with a mobile number or an email.
export async function findUser(id) {
  id = String(id || '').trim();
  if (id.includes('@')) return one(`select * from users where lower(email)=$1 and pw is not null order by email_ok desc, created desc limit 1`, [id.toLowerCase()]);
  const ph = normPhone(id); return ph ? user(ph) : null;
}
export async function login(id, password) {
  const u = await findUser(id);
  return u && checkPw(password, u.pw) ? u.phone : null;
}

// ---------- email & phone codes ----------
const code6 = () => String(crypto.randomInt(100000, 1000000));
export async function sendEmailCode(phone) {
  const u = await user(phone);
  if (!u?.email) return 'Please enter a valid email.';
  const recent = await one(`select count(*) n from tokens where phone=$1 and kind='emailcode' and expires > now() + interval '28 minutes'`, [phone]);
  if (+recent.n > 0) return 'Please wait a minute before asking for a new code.';
  const code = code6();
  await q(`delete from tokens where phone=$1 and kind='emailcode'`, [phone]);
  await newToken('emailcode', phone, u.email, { code, tries: 0 }, 0.5);
  await sendMail(u.email, `ENikah code: ${code}`, `Your ENikah email code is ${code}. It is valid for 30 minutes.\n\nஉங்கள் ENikah மின்னஞ்சல் குறியீடு: ${code}. 30 நிமிடங்களுக்கு மட்டும் செல்லும்.\n\nIf you did not register on ENikah, ignore this email.`);
}
export async function checkEmailCode(phone, code) {
  const tk = await one(`select * from tokens where phone=$1 and kind='emailcode' and expires>now() order by expires desc limit 1`, [phone]);
  if (!tk) return 'This code has expired. Please ask for a new code.';
  if ((tk.data.tries || 0) >= 5) return 'Too many wrong codes. Please ask for a new code.';
  if (String(code || '').replace(/\D/g, '') !== tk.data.code) {
    await q(`update tokens set data=jsonb_set(data,'{tries}',to_jsonb(coalesce((data->>'tries')::int,0)+1)) where token=$1`, [tk.token]);
    return 'Wrong code. Please check the email and try again.';
  }
  await q(`update users set email_ok=true where phone=$1 and lower(email)=lower($2)`, [phone, tk.ref]);
  await q(`delete from tokens where phone=$1 and kind='emailcode'`, [phone]);
}

// Phone codes go by WhatsApp (an approved "authentication" template), only when PHONE_OTP_TEMPLATE is set.
export const phoneOtpOn = () => !!(E.PHONE_OTP_TEMPLATE && E.WA_SEND === '1' && E.WA_TOKEN && E.WA_PHONE_ID && E.WA_NUMBER);
export async function sendPhoneCode(phone) {
  const code = code6();
  await q(`delete from tokens where phone=$1 and kind='phonecode'`, [phone]);
  await newToken('phonecode', phone, phone, { code, tries: 0 }, 0.25);
  if (!(await wa.sendCode(phone, code))) return 'Could not send the WhatsApp code. Please try again later.';
}
export async function checkPhoneCode(phone, code) {
  const tk = await one(`select * from tokens where phone=$1 and kind='phonecode' and expires>now() order by expires desc limit 1`, [phone]);
  if (!tk) return 'This code has expired. Please ask for a new code.';
  if ((tk.data.tries || 0) >= 5) return 'Too many wrong codes. Please ask for a new code.';
  if (String(code || '').replace(/\D/g, '') !== tk.data.code) {
    await q(`update tokens set data=jsonb_set(data,'{tries}',to_jsonb(coalesce((data->>'tries')::int,0)+1)) where token=$1`, [tk.token]);
    return 'Wrong code. Please try again.';
  }
  await q(`update users set phone_ok=true where phone=$1`, [phone]);
  await q(`delete from tokens where phone=$1 and kind='phonecode'`, [phone]);
}

// ---------- profiles ----------
export const MARITAL = ['Never married', 'Divorced', 'Widowed'];
const clean = (v, n = 40) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n);

export function validateProfile(b, { keepGender } = {}) {
  const d = { name: clean(b.name, 60), g: keepGender || b.g, age: parseInt(b.age, 10), city: clean(b.city), marital: b.marital,
    edu: clean(b.edu), job: clean(b.job), pa_min: b.pa_min ? parseInt(b.pa_min, 10) : null, pa_max: b.pa_max ? parseInt(b.pa_max, 10) : null };
  if (!d.name) return { err: 'Please enter the full name.' };
  if (!['F', 'M'].includes(d.g)) return { err: 'Please choose bride or groom.' };
  const min = d.g === 'M' ? 21 : 18;
  if (!(d.age >= min && d.age <= 70)) return { err: `Age must be ${min}–70. Legal marriage age in India is 18 for brides and 21 for grooms.` };
  if (!d.city) return { err: 'Please enter the city or town.' };
  if (!MARITAL.includes(d.marital)) return { err: 'Please choose the marital status.' };
  if (!d.edu || !d.job) return { err: 'Please enter education and profession.' };
  if ((d.pa_min === null) !== (d.pa_max === null)) return { err: "Please enter both 'from' and 'to' for the partner's age, or leave both empty." };
  if (d.pa_min !== null) {
    if (!(d.pa_min >= 18 && d.pa_max <= 80 && d.pa_min <= d.pa_max)) return { err: "Partner's age range looks wrong (for example 23 to 30)." };
  }
  return { d };
}

export async function createProfile(phone, d, asBroker) {
  const r = await one(`insert into profiles(owner,broker,name,g,age,city,marital,edu,job,pa_min,pa_max,pm,exp)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'any',${asBroker ? 'null' : `date_trunc('second', now()+make_interval(days=>${CFG.free}))`}) returning id`,
    [asBroker ? null : phone, asBroker ? phone : null, d.name, d.g, d.age, d.city, d.marital, d.edu, d.job, d.pa_min, d.pa_max]);
  if (!asBroker) await q(`update users set type='person', name=$2, pid=$3 where phone=$1`, [phone, d.name, r.id]);
  const who = asBroker ? `candidate added by broker ${plus(phone)}` : `profile by ${plus(phone)}`;
  await notifyAdmins(`New ${who}: ENK${r.id} ${d.name} — ${d.g === 'F' ? 'Bride' : 'Groom'}, ${d.age}, ${d.city} · ${d.edu} · ${d.job} · ${d.marital} · ${istNow()}`, '/admin').catch(e => console.error('[alert]', e));
  return r.id;
}

export async function updateProfile(id, d) {
  await q(`update profiles set name=$2,age=$3,city=$4,marital=$5,edu=$6,job=$7,pa_min=$8,pa_max=$9,pm='any' where id=$1`,
    [id, d.name, d.age, d.city, d.marital, d.edu, d.job, d.pa_min, d.pa_max]);
}

export const owns = (ph, p) => !!p && (p.owner === ph || p.broker === ph);
export const myPids = async ph => (await all('select id from profiles where owner=$1 or broker=$1 order by id', [ph])).map(r => r.id);

export async function setupBroker(phone, name, city) {
  name = clean(name, 60); city = clean(city);
  if (!name || !city) return 'Please enter your name / bureau name and area.';
  await q(`update users set type='broker', name=$2, city=$3, status='unverified', exp=date_trunc('second', now()+make_interval(days=>${CFG.free})) where phone=$1 and type is null`, [phone, name, city]);
  await notifyAdmins(`New broker account: ${name}, ${city} (${plus(phone)}) · ${istNow()}`, '/admin').catch(e => console.error('[alert]', e));
}

export async function canAddCandidate(phone) {
  const u = await user(phone);
  if (u?.type !== 'broker') return 'Only brokers can add candidates.';
  if (!(new Date(u.exp) > new Date())) return `Your broker plan has expired. Renew ${rs(CFG.broker)} to add candidates.`;
  const n = +(await one('select count(*) n from profiles where broker=$1', [phone])).n;
  if (n >= CFG.cap) return `You have reached the limit of ${CFG.cap} candidates per broker plan.`;
}

// ---------- verification ----------
export async function verStatus(phone, target) {
  if (target === 'b') { const u = await user(phone); return u?.type === 'broker' ? u.status : null; }
  const p = await getP(+target);
  return owns(phone, p) ? p.status : null;
}

export async function submitDocs(phone, target, idf, photo) {
  const isB = target === 'b';
  await q(`delete from docs where kind=$1 and ref=$2`, [isB ? 'b' : 'p', isB ? phone : String(+target)]);
  await q(`insert into docs(kind,ref,phone,id_doc,id_mime,photo,photo_mime) values($1,$2,$3,$4,$5,$6,$7)`,
    [isB ? 'b' : 'p', isB ? phone : String(+target), phone, idf.buffer, idf.mimetype, photo?.buffer || null, photo?.mimetype || null]);
  let desc;
  if (isB) { const u = await one(`update users set status='pending' where phone=$1 returning *`, [phone]); desc = `Broker ${u.name}, ${u.city} (${plus(phone)})`; }
  else { await q(`update profiles set status='pending' where id=$1`, [+target]); const p = await getP(+target); desc = `${p.code} ${p.name} — ${card(p).replace('\n', ' · ')}`; }
  await notifyAdmins(`New verification request: ${desc}`, '/admin');
}

const verWord = (ok, l) => ok ? (l === 'ta' ? 'அங்கீகரிக்கப்பட்டது' : 'approved') : (l === 'ta' ? 'ஏற்கப்படவில்லை, மீண்டும் பதிவேற்றவும்' : 'not approved, please upload again');
export async function decide(kind, ref, ok) {
  if (kind === 'b') {
    const u = await one(`update users set status=$2 where phone=$1 and status='pending' returning *`, [ref, ok ? 'verified' : 'unverified']);
    if (!u) return 'Already handled.';
    await q(`delete from docs where kind='b' and ref=$1`, [ref]);
    await notify(ref, ok ? 'Your broker ID is verified. You can now add and verify candidates.' : 'Your broker verification was not approved. Please upload a clear ID again.', ok ? '/broker' : '/verify/b',
      ['enikah_newverified', l => [l === 'ta' ? 'தரகர் கணக்கு' : 'broker account', verWord(ok, l)]]);
    return `Broker ${plus(ref)} ${ok ? 'approved' : 'rejected'}.`;
  }
  const p = await one(`update profiles set status=$2 where id=$1 and status='pending' returning *, 'ENK'||id as code`, [+ref, ok ? 'verified' : 'unverified']);
  if (!p) return 'Already handled.';
  if (ok) await q(`update profiles set (photo,photo_mime)=(select photo,photo_mime from docs where kind='p' and ref=$1 order by id desc limit 1) where id=$2`, [String(+ref), +ref]);
  await q(`delete from docs where kind='p' and ref=$1`, [String(+ref)]);
  await notify(p.broker || p.owner, ok ? `${p.code} is verified! You can now see verified matching profiles.` : `Verification of ${p.code} was not approved. Please upload a clear ID and photo again.`, ok ? `/matches/${p.id}` : `/verify/${p.id}`,
    ['enikah_newverified', l => [p.code, verWord(ok, l)]]);
  return `${p.code} ${ok ? 'approved' : 'rejected'}.`;
}

// ---------- matching ----------
// Why a profile can't search right now (null = it can).
export async function searchBlock(p) {
  if (p.status === 'blocked') return { msg: 'This profile is blocked. Please contact support.' };
  if (p.broker) {
    const b = await user(p.broker);
    if (!(new Date(b.exp) > new Date())) return { msg: 'Your broker plan has expired, so your candidates are hidden and cannot search.', renew: true };
    if (b.status !== 'verified') return { msg: 'Please verify your broker ID first.', verify: 'b' };
  } else if (!p.live) return { msg: `Your plan ended on ${D(p.exp)}. Your profile is hidden from search. Renew ${rs(CFG.person)} for 30 days to see matches again.`, renew: true };
  if (p.status === 'pending') return { msg: 'Your documents are being checked. You can see matches once the admin approves.' };
  if (p.status !== 'verified') return { msg: 'Only verified members can see profiles. Please upload your ID and photo first.', verify: String(p.id) };
  return null;
}

export const usedThisMonth = async p => +(await one('select count(*) n from seen where pid=$1 and period=$2', [p.id, p.till])).n;
// Every profile ever shown to p, newest first, flagged with whether it was shown this plan month.
export const shownAll = p => all(`select v.*, s.period = $2 as this_month from seen s join (${P_SQL}) v on v.id = s.sid where s.pid = $1 order by s.at desc, v.id`, [p.id, p.till]);

// Give new matching profiles, up to the monthly limit.
export async function allocate(p) {
  const block = await searchBlock(p);
  if (block) return { msg: block.msg };
  const used = await usedThisMonth(p);
  if (used >= CFG.monthly) return { msg: `You have received all ${CFG.monthly} profiles for this month (plan till ${D(p.till)}). Renew to get ${CFG.monthly} more.` };
  const pool = await all(`select v.id from (${P_SQL}) v
    where v.live and v.status='verified' and v.g<>$1 and v.id<>$2
      and not exists(select 1 from seen s where s.pid=$2 and s.sid=v.id)
      and ($3::int is null or v.age between $3 and $4)
      and (v.pa_min is null or $5 between v.pa_min and v.pa_max)
    order by (lower(v.city)=lower($6)) desc, abs(v.age-$5), v.id limit $7`,
    [p.g, p.id, p.pa_min, p.pa_max, p.age, p.city, CFG.monthly - used]);
  if (!pool.length) return { msg: 'No new verified profiles match both sides\' choices right now. Please check again in a few days as new members join.' };
  for (const v of pool) await q('insert into seen(pid,sid,period) values($1,$2,$3) on conflict do nothing', [p.id, v.id, p.till]);
  return { msg: `${pool.length} new verified match${pool.length > 1 ? 'es' : ''} added. This month: ${used + pool.length} of ${CFG.monthly}.`, n: pool.length };
}

// ---------- interests ----------
export async function contact(p) {
  if (p.broker) { const b = await user(p.broker); return { who: `Broker ${b.name}`, phone: plus(b.phone) }; }
  return { who: p.name, phone: plus(p.owner) };
}

export async function sendInterest(phone, fromId, toId) {
  const f = await getP(fromId), t = await getP(toId);
  if (!owns(phone, f)) return 'Not allowed.';
  const shown = await one('select 1 from seen where pid=$1 and sid=$2', [fromId, toId]);
  if (!shown) return 'Not allowed.';
  if (!visible(f)) return 'Your profile is not active or not verified.';
  if (!visible(t)) return 'This profile is no longer available (not renewed).';
  const x = await one('insert into interests(from_id,to_id) values($1,$2) on conflict do nothing returning id', [fromId, toId]);
  if (!x) return 'Interest already sent.';
  await notify(t.broker || t.owner, `New interest for ${t.code}${t.broker ? ' (' + t.name + ')' : ''} from ${f.code} (${card(f).replace('\n', ' · ')}). Accept to share contact details.`, '/interests', ['enikah_interest', [t.code]]);
  return `Interest sent to ${t.code}. You will be notified when they reply.`;
}

export async function answer(phone, iid, ok) {
  const x = await one('select * from interests where id=$1', [iid]);
  if (!x) return 'Interest not found.';
  const f = await getP(x.from_id), t = await getP(x.to_id);
  if (!owns(phone, t)) return 'Not allowed.';
  if (x.st !== 'sent') return 'This interest was already answered.';
  if (ok && (!visible(f) || !visible(t))) return 'Cannot accept now: one of the profiles is not active (plan expired or not verified).';
  await q('update interests set st=$2 where id=$1', [iid, ok ? 'accepted' : 'declined']);
  if (!ok) { await notify(f.broker || f.owner, `${t.code} has declined the interest from ${f.code}. Keep making du'a — more matches will come.`, '/interests'); return 'Declined. Your details were not shared.'; }
  const c = await contact(t);
  await notify(f.broker || f.owner, `${t.code} accepted the interest from ${f.code}! Contact: ${c.who}, ${c.phone}. Please involve family / wali.`, '/interests', ['enikah_accepted', [t.code]]);
  return 'Accepted. Contact details are now shown to both sides under Interests.';
}

export async function report(phone, pid, reason) {
  await q('insert into reports(phone,pid,reason) values($1,$2,$3)', [phone, pid, clean(reason, 300) || '(no reason)']);
  await notifyAdmins(`Report on ENK${pid} from ${plus(phone)}: ${clean(reason, 300)}`, '/admin');
}

// ---------- plans & payments ----------
export async function onPaid(pay) {
  const u = await user(pay.phone);
  if (!u) return;
  let exp;
  if (pay.kind === 'broker') exp = (await one(`update users set exp=${EXP(30)},rem3=null,rem0=null where phone=$1 returning exp`, [pay.phone])).exp;
  else exp = (await one(`update profiles set exp=${EXP(30)},rem3=null,rem0=null where id=$1 returning exp`, [u.pid])).exp;
  await notify(pay.phone, `Payment received: ${rs(pay.amount)}. Your plan is active till ${D(exp)}.${pay.kind === 'broker' ? ' All your candidates are visible again.' : ` You get ${CFG.monthly} new matching profiles this month.`}`, '/home', ['enikah_paid', [rs(pay.amount), D(exp)]]);
  await notifyAdmins(`Payment ${rs(pay.amount)} received from ${u.name || plus(pay.phone)} (${pay.kind}).`);
}

// Member says they paid by UPI; the admin confirms it against the bank statement.
export async function claimUpi(phone, kind, amount, utr) {
  utr = String(utr || '').replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z0-9]{10,22}$/.test(utr)) return 'Please enter the UPI transaction ID (UTR) shown in your UPI app after paying.';
  const r = await one(`insert into payments(phone,kind,amount,link_id,method,utr,status) values($1,$2,$3,$4,'upi',$5,'claimed') on conflict(link_id) do nothing returning id`, [phone, kind, amount, 'upi_' + utr, utr]);
  if (!r) return 'This transaction ID was already submitted.';
  const u = await user(phone);
  await notifyAdmins(`UPI payment to confirm: ${rs(amount)} from ${u?.name || plus(phone)} (${plus(phone)}), UTR ${utr}`, '/admin');
}
export async function decideUpi(id, ok) {
  const p = await one(`update payments set status=$2, paid_at=case when $2='paid' then now() else null end where id=$1 and status='claimed' and method='upi' returning *`, [id, ok ? 'paid' : 'rejected']);
  if (!p) return 'Already handled.';
  if (ok) await onPaid(p);
  else await notify(p.phone, `We could not find your UPI payment with transaction ID ${p.utr}. Please check the ID and submit again, or contact us.`, '/renew');
  return ok ? `Payment ${p.utr} confirmed.` : `Payment ${p.utr} rejected.`;
}

export async function deleteAccount(phone) {
  const ids = await myPids(phone);
  if (ids.length) {
    await q('delete from interests where from_id = any($1) or to_id = any($1)', [ids]);
    await q('delete from seen where pid = any($1) or sid = any($1)', [ids]);
    await q(`delete from docs where kind='p' and ref = any($1)`, [ids.map(String)]);
    await q('delete from profiles where id = any($1)', [ids]);
  }
  await q(`delete from docs where kind='b' and ref=$1`, [phone]);
  await q('delete from notes where phone=$1', [phone]);
  await q('delete from followups where phone=$1', [phone]);
  await q('delete from tokens where phone=$1', [phone]);
  await q('delete from users where phone=$1', [phone]);
}

// ---------- reminders (hourly) ----------
export async function runReminders() {
  for (const p of await all(`select p.*, 'ENK'||p.id code from profiles p where owner is not null and exp>now() and exp<=now()+interval '3 days' and rem3 is distinct from exp and status<>'blocked'`)) {
    await notify(p.owner, `Reminder: your ENikah plan ends on ${D(p.exp)}. Renew ${rs(CFG.person)} to stay visible.`, '/home', ['enikah_reminder', [p.name.split(' ')[0], D(p.exp)]]);
    await q('update profiles set rem3=exp where id=$1', [p.id]);
  }
  for (const p of await all(`select p.*, 'ENK'||p.id code from profiles p where owner is not null and exp<=now() and rem0 is distinct from exp and status<>'blocked'`)) {
    await notify(p.owner, `Your plan has ended. Profile ${p.code} is now hidden from search. Renew ${rs(CFG.person)} to show it again.`, '/home', ['enikah_expired', [p.name.split(' ')[0], D(p.exp), p.code]]);
    await q('update profiles set rem0=exp where id=$1', [p.id]);
  }
  for (const b of await all(`select * from users where type='broker' and exp>now() and exp<=now()+interval '3 days' and rem3 is distinct from exp`)) {
    await notify(b.phone, `Reminder: your broker plan ends on ${D(b.exp)}. Renew ${rs(CFG.broker)} to keep your candidates visible.`, '/broker', ['enikah_reminder', [b.name, D(b.exp)]]);
    await q('update users set rem3=exp where phone=$1', [b.phone]);
  }
  for (const b of await all(`select * from users where type='broker' and exp<=now() and rem0 is distinct from exp`)) {
    await notify(b.phone, `Your broker plan has ended. All your candidates are hidden. Renew ${rs(CFG.broker)} to show them again.`, '/broker', ['enikah_expired', l => [b.name, D(b.exp), l === 'ta' ? 'உங்கள் வரன்கள்' : 'your candidates']]);
    await q('update users set rem0=exp where phone=$1', [b.phone]);
  }
  await q('delete from tokens where expires < now()');
  await q(`delete from docs where created < now() - interval '30 days'`);
}
