// ENikah conversation logic.
import crypto from 'crypto';
import { q, one, all, getP, P_SQL, visible } from './db.js';
import { sendMsg, sendTemplate } from './wa.js';
import { CFG, ADMINS, isAdmin, rs, D, side, card } from './config.js';
import { createLink } from './pay.js';

const user = ph => one('select * from users where phone=$1', [ph]);
const setS = (ph, d) => q('insert into sessions(phone,data) values($1,$2) on conflict(phone) do update set data=$2', [ph, d]);
const getS = async ph => (await one('select data from sessions where phone=$1', [ph]))?.data || {};
const plus = ph => '+' + ph;
const MENU = [['menu', 'Menu']];
const EXP = days => `date_trunc('second', greatest(now(), coalesce(exp, now())) + make_interval(days => ${Number(days)}))`;

export async function newToken(kind, phone, ref, data, hours) {
  const t = crypto.randomBytes(12).toString('base64url');
  await q('insert into tokens(token,kind,phone,ref,data,expires) values($1,$2,$3,$4,$5,now()+make_interval(hours=>$6))',
    [t, kind, phone, String(ref), data || {}, hours]);
  return t;
}

// Free-form message inside the 24h window, otherwise an approved template (if given).
export async function notify(ph, text, btns = [], link, tpl) {
  const u = await user(ph);
  const open = u?.last_in && Date.now() - new Date(u.last_in).getTime() < 23.5 * 3600e3;
  if (open) return sendMsg(ph, text, btns, link);
  if (tpl) return sendTemplate(ph, tpl[0], tpl[1]);
}
export const notifyAdmins = (text, btns, link, tpl) => Promise.all(ADMINS.map(a => notify(a, text, btns, link, tpl || ['enikah_admin', [text.split('\n')[0].replace(/\*/g, '')]])));

// ---------- entry point ----------
export async function onMessage(ph, { id = '', text = '', other }) {
  await q(`insert into users(phone,last_in,type) values($1,now(),$2) on conflict(phone) do update set last_in=now()`, [ph, isAdmin(ph) ? 'admin' : null]);
  if (other) return sendMsg(ph, 'Please send documents only on the secure page link I give you. Type *menu* to see options.', MENU);
  text = text.trim();
  const s = await getS(ph);
  if (id === 'menu' || /^(hi|hii+|hello|hey|menu|salam|assalam\w*|start)\b/i.test(text)) { await setS(ph, {}); return menu(ph); }
  if (s.flow) return step(ph, s, id.startsWith('o:') ? id.slice(2) : text);
  if (!id) {
    const t = text.toLowerCase(), m = text.match(/enk\s*(\d+)/i);
    if (/^renew/.test(t)) id = 'renew';
    else if (/^interest/.test(t)) id = 'ints';
    else if (/^(match|find)/.test(t)) id = 'find';
    else if (/^plan/.test(t)) id = 'plan';
    else if (/^delete/.test(t)) id = 'del';
    else if (/^report/.test(t) && m) return report(ph, +m[1], text);
    else if (isAdmin(ph) && /^(un)?block/.test(t) && m) return block(ph, +m[1], !/^un/.test(t));
  }
  const [c, a1, a2] = id.split(':');
  const admin = f => isAdmin(ph) ? f() : sendMsg(ph, 'Not allowed.');
  const map = {
    rp: () => startFlow(ph, 'reg'), rb: () => startFlow(ph, 'breg'), how: () => how(ph),
    find: () => find(ph), plan: () => plan(ph), renew: () => renew(ph), ints: () => listInts(ph),
    addc: () => startFlow(ph, 'cand'), cands: () => cands(ph), fc: () => brokerMatches(ph, +a1),
    ac: () => answer(ph, +a1, true), dc: () => answer(ph, +a1, false), ver: () => verLink(ph, a1),
    del: () => sendMsg(ph, 'Delete your ENikah data? Your profile' + '(s), interests and plan will be removed permanently.', [['delyes', 'Yes, delete'], ['menu', 'No, keep it']]),
    delyes: () => deleteMe(ph),
    ap: () => admin(() => decide(ph, a1, a2, true)), rj: () => admin(() => decide(ph, a1, a2, false)),
    pend: () => admin(() => pending(ph)), stats: () => admin(() => stats(ph)), exp: () => admin(() => expiring(ph)),
  };
  if (map[c]) return map[c]();
  return sendMsg(ph, "Sorry, I didn't understand that. Type *menu* to see options.", MENU);
}

// ---------- menus ----------
async function menu(ph) {
  const u = await user(ph);
  if (isAdmin(ph)) {
    const n = (await pendList()).length;
    return sendMsg(ph, `*ENikah admin* · ${D(new Date())}\nCommands: *block ENK1234*, *unblock ENK1234*`, [['pend', `Pending (${n})`], ['stats', 'Stats'], ['exp', 'Expiring in 7 days']]);
  }
  if (!u?.type) return sendMsg(ph, `Assalamu alaikum! Welcome to *ENikah*, Muslim matrimony on WhatsApp.\n\n• Registration is *free*, with *1 month free*\n• Only *verified, active* profiles are shown\n• Profiles matched to both sides' choices\n• Contacts shared only when both sides accept`,
    [['rp', 'Register (self/family)'], ['rb', 'Register as broker'], ['how', 'How it works']]);
  if (u.type === 'broker') {
    const live = u.exp && new Date(u.exp) > new Date();
    return sendMsg(ph, `Salam, ${u.name}\nBroker plan: ${live ? '*Active* till ' + D(u.exp) : '*Expired* — your candidates are hidden'}\nID: ${u.status}`,
      [['addc', 'Add candidate'], ['cands', 'My candidates'], ['ints', 'Interests'], ['plan', 'My plan'], ['renew', 'Renew ' + rs(CFG.broker)]]
        .concat(u.status === 'unverified' ? [['ver:b', 'Verify my ID']] : []));
  }
  const p = await getP(u.pid);
  if (!p) { await q('update users set type=null,pid=null where phone=$1', [ph]); return menu(ph); }
  return sendMsg(ph, `Salam, ${p.name.split(' ')[0]}\n${p.code} · ${p.live ? '*Active* till ' + D(p.exp) : '*Expired* — hidden from search'}`,
    [['find', 'Find matches'], ['ints', 'Interests'], ['plan', 'My plan'], ['renew', 'Renew ' + rs(CFG.person)]]
      .concat(p.status === 'unverified' ? [['ver:' + p.id, 'Verify my profile']] : []));
}

const how = ph => sendMsg(ph, `*How ENikah works*\n1. Register free — first month free\n2. Upload ID + photo on our secure page; admin verifies\n3. Get up to *${CFG.monthly} verified profiles a month*, matched to your choice and theirs\n4. Send interest; contacts are shared only if they accept\n5. After the free month: *${rs(CFG.person)}/month* (brokers *${rs(CFG.broker)}/month*). Profiles not renewed are hidden.\n\nType *delete* anytime to remove your data.`,
  [['rp', 'Register (self/family)'], ['rb', 'Register as broker']]);

// ---------- registration flows ----------
const F = [
  ['name', 'Full *name*? (shown only after both sides accept)', ['Type the name']],
  ['g', '*Bride* or *groom*?', [['F', 'Bride'], ['M', 'Groom']]],
  ['age', '*Age*? (type a number)', []],
  ['city', '*City / town*? (type it)', []],
  ['maslak', '*Maslak*?', ['Sunni Hanafi', 'Sunni Shafi', 'Shia', 'Other']],
  ['marital', '*Marital status*?', ['Never married', 'Divorced', 'Widowed']],
  ['edu', '*Education*? (e.g. B.Sc, B.E, Alima, 12th)', []],
  ['job', '*Profession*? (e.g. Teacher, Engineer, Business, Homemaker)', []],
  ['pa', "Partner's preferred *age range*? Tap one or type like 23-28", ['18-24', '22-28', '25-32', '30-40', 'Any']],
  ['pm', "Partner's *maslak*?", [['same', 'Same as mine'], ['any', 'Any maslak']]],
];
const BF = [['name', 'Your *name* or bureau name?', []], ['city', 'Which *area / town* do you work in?', []]];
const fields = s => s.flow === 'breg' ? BF : F;

async function startFlow(ph, flow) {
  const u = await user(ph);
  if (flow !== 'cand' && u?.type) return sendMsg(ph, 'You are already registered.', MENU);
  if (flow === 'cand') {
    if (u?.type !== 'broker') return sendMsg(ph, 'Only brokers can add candidates.', MENU);
    if (!(new Date(u.exp) > new Date())) return sendMsg(ph, 'Your broker plan has expired. Renew to add candidates.', [['renew', 'Renew ' + rs(CFG.broker)]]);
    const n = +(await one('select count(*) n from profiles where broker=$1', [ph])).n;
    if (n >= CFG.cap) return sendMsg(ph, `You have reached the limit of ${CFG.cap} candidates per broker plan.`, MENU);
  }
  const s = { flow, i: 0, d: {} };
  await setS(ph, s);
  if (flow === 'cand') await sendMsg(ph, 'Adding a new candidate. Answer a few questions about them. Type *menu* to cancel.');
  return ask(ph, s);
}

function ask(ph, s) {
  const L = fields(s), [, qn, opts] = L[s.i];
  const btns = opts.filter(o => o !== 'Type the name').map(o => Array.isArray(o) ? ['o:' + o[0], o[1]] : ['o:' + o, o]);
  return sendMsg(ph, `(${s.i + 1}/${L.length}) ${qn}`, btns);
}

async function step(ph, s, v) {
  const [key] = fields(s)[s.i];
  v = String(v || '').trim();
  if (!v) return sendMsg(ph, 'Please type an answer or tap an option. Type *menu* to cancel.');
  if (key === 'g') { v = /^(f|bride|female|girl)/i.test(v) ? 'F' : /^(m|groom|male|boy)/i.test(v) ? 'M' : ''; if (!v) return sendMsg(ph, 'Please tap *Bride* or *Groom*.', [['o:F', 'Bride'], ['o:M', 'Groom']]); }
  else if (key === 'age') { const n = parseInt(v, 10), min = s.d.g === 'M' ? 21 : 18; if (!(n >= min && n <= 70)) return sendMsg(ph, `Please enter a valid age (${min}–70). Legal marriage age in India is 18 for brides and 21 for grooms.`); v = n; }
  else if (key === 'pa') { const m = v.match(/(\d+)\D+(\d+)/); if (m) { const a = +m[1], b = +m[2]; v = [Math.min(a, b), Math.max(a, b)]; } else if (/any/i.test(v)) v = null; else return sendMsg(ph, 'Please type a range like *23-28*, or tap *Any*.', [['o:Any', 'Any']]); }
  else if (key === 'pm') v = /same/i.test(v) ? 'same' : 'any';
  else v = v.replace(/\s+/g, ' ').slice(0, key === 'name' ? 60 : 40);
  s.d[key] = v; s.i++;
  if (s.i < fields(s).length) { await setS(ph, s); return ask(ph, s); }
  await setS(ph, {});
  return finish(ph, s);
}

async function finish(ph, { flow, d }) {
  if (flow === 'breg') {
    const u = await one(`update users set type='broker',name=$2,city=$3,status='unverified',exp=${EXP(CFG.free)} where phone=$1 returning exp`, [ph, d.name, d.city]);
    return sendMsg(ph, `*Broker account created*\n${d.name}, ${d.city}\nFree till *${D(u.exp)}*, then ${rs(CFG.broker)}/month. Up to ${CFG.cap} candidates.\n\nNext: verify your ID.`, [['ver:b', 'Verify my ID'], ['menu', 'Menu']]);
  }
  const cand = flow === 'cand';
  const r = await one(`insert into profiles(owner,broker,name,g,age,city,maslak,marital,edu,job,pa_min,pa_max,pm,exp)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,${cand ? 'null' : `date_trunc('second', now()+make_interval(days=>${CFG.free}))`}) returning id, exp`,
    [cand ? null : ph, cand ? ph : null, d.name, d.g, d.age, d.city, d.maslak, d.marital, d.edu, d.job, d.pa?.[0] ?? null, d.pa?.[1] ?? null, d.pm]);
  if (cand) return sendMsg(ph, `Candidate added: *ENK${r.id}* (${d.name})\nShown while your broker plan is active. Upload the candidate's ID and photo to verify.`, [['ver:' + r.id, 'Verify candidate'], ['menu', 'Menu']]);
  await q(`update users set type='person',name=$2,pid=$3 where phone=$1`, [ph, d.name, r.id]);
  return sendMsg(ph, `*Registered — 1 month free*\nProfile ID: *ENK${r.id}*\nValid till: *${D(r.exp)}*\n\nNext: get verified. Only verified members can see profiles and be seen.`, [['ver:' + r.id, 'Verify my profile'], ['menu', 'Menu']]);
}

// ---------- verification ----------
async function ownsProfile(ph, p) { return p && (p.owner === ph || p.broker === ph); }

async function verLink(ph, t) {
  let st;
  if (t === 'b') st = (await user(ph))?.type === 'broker' ? (await user(ph)).status : null;
  else { const p = await getP(+t); if (!(await ownsProfile(ph, p))) return sendMsg(ph, 'Profile not found.', MENU); st = p.status; }
  if (!st) return sendMsg(ph, 'Not found.', MENU);
  if (st === 'verified') return sendMsg(ph, 'Already verified.', MENU);
  if (st === 'pending') return sendMsg(ph, 'Documents already submitted. Admin will verify soon.', MENU);
  if (st === 'blocked') return sendMsg(ph, 'This profile is blocked. Please contact support.');
  const tk = await newToken('ver', ph, t, null, 72);
  return sendMsg(ph, 'Upload an ID proof and a recent photo on our secure page (link valid 3 days). We never ask for ID numbers on WhatsApp.', [], { label: 'Upload documents', url: `${CFG.base}/v/${tk}` });
}

// called by the web page after upload
export async function submitted(ph, t, docId) {
  let desc;
  if (t === 'b') { const u = await one(`update users set status='pending' where phone=$1 returning *`, [ph]); desc = `Broker ${u.name}, ${u.city}\nPhone ${plus(ph)}`; }
  else { await q(`update profiles set status='pending' where id=$1`, [+t]); const p = await getP(+t); desc = `${card(p)}\nName: ${p.name}\n${p.broker ? 'Added by broker ' + plus(p.broker) : 'Phone ' + plus(p.owner)}`; }
  const tk = await newToken('doc', null, docId, null, 24 * 7);
  const kind = t === 'b' ? 'b' : 'p', ref = t === 'b' ? ph : t;
  await notifyAdmins(`*New verification request*\n${desc}`, [[`ap:${kind}:${ref}`, 'Approve'], [`rj:${kind}:${ref}`, 'Reject']], { label: 'View documents', url: `${CFG.base}/a/d/${tk}` });
  return notify(ph, 'Documents received. Admin will verify within 24 hours.\nYour ID image is deleted after checking.', MENU);
}

async function decide(ph, t, x, ok) {
  if (t === 'b') {
    const u = await one(`update users set status=$2 where phone=$1 and status='pending' returning *`, [x, ok ? 'verified' : 'unverified']);
    if (!u) return sendMsg(ph, 'Already handled.', [['pend', 'Next pending']]);
    await q(`delete from docs where kind='b' and ref=$1`, [x]);
    await notify(x, ok ? 'Your broker ID is *verified*. Add candidates to start.' : 'Broker verification failed. Please upload a clear ID.',
      ok ? [['addc', 'Add candidate']] : [['ver:b', 'Upload again']], null, ['enikah_verified', ['your broker account', ok ? 'approved' : 'not approved, please upload again']]);
  } else {
    const p = await one(`update profiles set status=$2 where id=$1 and status='pending' returning *, 'ENK'||id as code`, [+x, ok ? 'verified' : 'unverified']);
    if (!p) return sendMsg(ph, 'Already handled.', [['pend', 'Next pending']]);
    if (ok) await q(`update profiles set (photo,photo_mime)=(select photo,photo_mime from docs where kind='p' and ref=$1 order by id desc limit 1) where id=$2`, [x, +x]);
    await q(`delete from docs where kind='p' and ref=$1`, [x]);
    const o = p.broker || p.owner;
    await notify(o, ok ? `*${p.code} is verified!*\nNow ${p.broker ? 'this candidate' : 'you'} can see verified matching profiles.` : `Verification of ${p.code} failed. Please upload a clear ID and photo.`,
      ok ? [[p.broker ? 'fc:' + p.id : 'find', 'Find matches']] : [['ver:' + p.id, 'Upload again']], null, ['enikah_verified', [p.code, ok ? 'approved' : 'not approved, please upload again']]);
  }
  return sendMsg(ph, `${t === 'b' ? 'Broker +' + x : 'ENK' + x}: ${ok ? 'approved' : 'rejected'}.`, [['pend', 'Next pending'], ['menu', 'Menu']]);
}

async function pendList() {
  const ps = await all(P_SQL + ` where p.status='pending' order by p.id`);
  const bs = await all(`select * from users where type='broker' and status='pending'`);
  return [...ps.map(p => ({ kind: 'p', ref: String(p.id), text: `${card(p)}\nName: ${p.name}` })), ...bs.map(b => ({ kind: 'b', ref: b.phone, text: `Broker ${b.name}, ${b.city} (${plus(b.phone)})` }))];
}
async function pending(ph) {
  const L = (await pendList()).slice(0, 5);
  if (!L.length) return sendMsg(ph, 'No pending verifications.', MENU);
  for (const x of L) {
    const d = await one(`select id from docs where kind=$1 and ref=$2 order by id desc limit 1`, [x.kind, x.ref]);
    const link = d ? { label: 'View documents', url: `${CFG.base}/a/d/${await newToken('doc', null, d.id, null, 24 * 7)}` } : null;
    await sendMsg(ph, '*Pending*\n' + x.text, [[`ap:${x.kind}:${x.ref}`, 'Approve'], [`rj:${x.kind}:${x.ref}`, 'Reject']], link);
  }
}
async function stats(ph) {
  const r = await one(`select
    (select count(*) from (${P_SQL}) v where v.live and v.status='verified') live,
    (select count(*) from (${P_SQL}) v where not v.live) hidden,
    (select count(*) from profiles where status='pending') pend,
    (select count(*) from profiles where status='unverified') unver,
    (select count(*) from users where type='person') people,
    (select count(*) from users where type='broker' and exp>now()) brokers,
    (select count(*) from interests) ints, (select count(*) from interests where st='accepted') acc,
    (select coalesce(sum(amount),0) from payments where status='paid' and paid_at>=date_trunc('month', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata') mon,
    (select coalesce(sum(amount),0) from payments where status='paid') total`);
  return sendMsg(ph, `*Stats · ${D(new Date())}*\nLive & verified profiles: ${r.live}\nHidden (not renewed): ${r.hidden}\nAwaiting verification: ${r.pend}\nNot verified yet: ${r.unver}\nMembers: ${r.people} · Active brokers: ${r.brokers}\nInterests: ${r.ints} (${r.acc} accepted)\nRevenue this month: ${rs(r.mon)} · Total: ${rs(r.total)}`, MENU);
}
async function expiring(ph) {
  const ps = await all(`select 'ENK'||id code,name,exp from profiles where owner is not null and exp>now() and exp<now()+interval '7 days' order by exp`);
  const bs = await all(`select name,exp from users where type='broker' and exp>now() and exp<now()+interval '7 days' order by exp`);
  const L = [...ps.map(p => `${p.code} ${p.name} — ${D(p.exp)}`), ...bs.map(b => `Broker ${b.name} — ${D(b.exp)}`)];
  return sendMsg(ph, L.length ? '*Expiring in 7 days*\n' + L.join('\n') + '\n\nThey get reminders 3 days before and on expiry.' : 'Nothing expires in the next 7 days.', MENU);
}
async function block(ph, id, on) {
  const p = await one(`update profiles set status=$2 where id=$1 returning id`, [id, on ? 'blocked' : 'verified']);
  return sendMsg(ph, p ? `ENK${id} ${on ? 'blocked — hidden from everyone' : 'unblocked'}.` : 'Profile not found.', MENU);
}
async function report(ph, id, text) {
  await q('insert into reports(phone,pid,reason) values($1,$2,$3)', [ph, id, text.slice(0, 300)]);
  await notifyAdmins(`*Report* on ENK${id} from ${plus(ph)}\n${text.slice(0, 300)}\nReply *block ENK${id}* to hide it.`);
  return sendMsg(ph, 'Thank you. The admin will review this report.', MENU);
}

// ---------- matching ----------
async function find(ph) {
  const u = await user(ph);
  if (u?.type === 'broker') return cands(ph);
  if (u?.type !== 'person') return menu(ph);
  return matches(ph, await getP(u.pid));
}
async function brokerMatches(ph, id) {
  const p = await getP(id);
  if (!p || p.broker !== ph) return sendMsg(ph, 'Candidate not found.', MENU);
  return matches(ph, p);
}
async function cands(ph) {
  const L = await all(P_SQL + ' where p.broker=$1 order by p.id', [ph]);
  if (!L.length) return sendMsg(ph, 'No candidates yet.', [['addc', 'Add candidate']]);
  return sendMsg(ph, '*Your candidates*\n' + L.map(p => `${p.code} ${p.name} (${side(p)}, ${p.age}) — ${p.status}`).join('\n') + `\n\n${L.length} of ${CFG.cap} used.`,
    L.filter(p => p.status === 'verified').slice(0, 9).map(p => ['fc:' + p.id, 'Matches: ' + p.name]).concat(L.length < CFG.cap ? [['addc', 'Add candidate']] : []));
}

async function matches(ph, p) {
  const rn = [['renew', 'Renew now']];
  if (!p) return sendMsg(ph, 'Profile not found.', MENU);
  if (p.status === 'blocked') return sendMsg(ph, 'This profile is blocked. Please contact support.');
  if (p.broker) {
    const b = await user(p.broker);
    if (!(new Date(b.exp) > new Date())) return sendMsg(ph, 'Your broker plan has expired, so your candidates are hidden and cannot search.', rn);
    if (b.status !== 'verified') return sendMsg(ph, 'Please verify your broker ID first.', [['ver:b', 'Verify my ID']]);
  } else if (!p.live) return sendMsg(ph, `Your plan expired on ${D(p.exp)}. Your profile is hidden.\nRenew ${rs(CFG.person)} for 30 days to see matches again.`, rn);
  if (p.status !== 'verified') return p.status === 'pending' ? sendMsg(ph, 'Verification pending. You can see matches once the admin approves.', MENU) : sendMsg(ph, 'Only *verified* members can see profiles. Please verify first.', [['ver:' + p.id, 'Verify now']]);

  const used = +(await one('select count(*) n from seen where pid=$1 and period=$2', [p.id, p.till])).n;
  if (used >= CFG.monthly) return sendMsg(ph, `You have received all ${CFG.monthly} profiles for this month (plan till ${D(p.till)}).\nRenew to get ${CFG.monthly} more matching profiles.`, [['renew', 'Renew now'], ['ints', 'My interests']]);
  const pool = await all(`select v.* from (${P_SQL}) v
    where v.live and v.status='verified' and v.g<>$1 and v.id<>$2
      and not exists(select 1 from seen s where s.pid=$2 and s.sid=v.id)
      and ($3::int is null or v.age between $3 and $4)
      and ($5<>'same' or v.maslak=$6)
      and (v.pa_min is null or $7 between v.pa_min and v.pa_max)
      and (v.pm<>'same' or v.maslak=$6)
    order by (lower(v.city)=lower($8)) desc, abs(v.age-$7), v.id limit $9`,
    [p.g, p.id, p.pa_min, p.pa_max, p.pm, p.maslak, p.age, p.city, CFG.monthly - used]);
  const want = `Age ${p.pa_min ? p.pa_min + '–' + p.pa_max : 'any'} · ${p.pm === 'same' ? p.maslak + ' only' : 'any maslak'} · ${p.city} first · their choice fits you too`;
  if (!pool.length) return sendMsg(ph, `No new verified profiles match right now.\n(${want})\nWe will show more as new members join.`, MENU);
  for (const v of pool) await q('insert into seen(pid,sid,period) values($1,$2,$3) on conflict do nothing', [p.id, v.id, p.till]);
  const tk = await newToken('m', ph, p.id, { ids: pool.map(v => v.id) }, 24);
  return sendMsg(ph, `*${pool.length} verified match${pool.length > 1 ? 'es' : ''}* for ${p.code}\nMatched to: ${want}\nThis month: ${used + pool.length} of ${CFG.monthly} profiles used.\n\nOpen your secure page (valid 24 hrs) to view them and send interest.`,
    [], { label: 'Open matches', url: `${CFG.base}/m/${tk}` });
}

// ---------- interests ----------
async function contact(p) {
  if (p.broker) { const b = await user(p.broker); return `Broker ${b.name}, ${plus(b.phone)}`; }
  return `${p.name}, ${plus(p.owner)}`;
}

// called by the matches web page
export async function sendInterest(ph, fromId, toId) {
  const f = await getP(fromId), t = await getP(toId);
  if (!(await ownsProfile(ph, f))) return 'Not allowed.';
  if (!visible(f)) return 'Your profile is not active or not verified.';
  if (!visible(t)) return 'This profile is no longer available (not renewed).';
  const x = await one('insert into interests(from_id,to_id) values($1,$2) on conflict do nothing returning id', [fromId, toId]);
  if (!x) return 'Interest already sent.';
  const o = t.broker || t.owner;
  await notify(o, `*New interest* for ${t.code}${t.broker ? ' (' + t.name + ')' : ''}\nFrom: ${card(f)}\n\nAccept to share contact details with each other.`,
    [['ac:' + x.id, 'Accept'], ['dc:' + x.id, 'Decline']], null, ['enikah_interest', [t.code]]);
  await notify(ph, `Interest sent to *${t.code}*. We'll message you when they reply.`);
  return 'Interest sent. We will message you on WhatsApp when they reply.';
}

async function answer(ph, iid, ok) {
  const x = await one('select * from interests where id=$1', [iid]);
  if (!x) return sendMsg(ph, 'Interest not found.', MENU);
  const f = await getP(x.from_id), t = await getP(x.to_id);
  if (!(await ownsProfile(ph, t))) return sendMsg(ph, 'Not allowed.');
  if (x.st !== 'sent') return sendMsg(ph, 'This interest was already answered.', MENU);
  if (ok && (!visible(f) || !visible(t))) return sendMsg(ph, 'Cannot accept now: one of the profiles is not active (plan expired or not verified).', [['renew', 'Renew'], ['menu', 'Menu']]);
  await q('update interests set st=$2 where id=$1', [iid, ok ? 'accepted' : 'declined']);
  const fo = f.broker || f.owner;
  if (!ok) {
    await notify(fo, `${t.code} has declined the interest from ${f.code}. Keep making du'a — more matches will come.`);
    return sendMsg(ph, 'Declined. Your details were not shared.', MENU);
  }
  await notify(fo, `*${t.code} accepted the interest from ${f.code}!*\nContact: ${await contact(t)}\n\nPlease involve family / wali in the conversation.`, MENU, null, ['enikah_accepted', [t.code]]);
  return sendMsg(ph, `Contacts shared.\n${f.code}: ${await contact(f)}\n\nPlease involve family / wali in the conversation.`, MENU);
}

async function listInts(ph) {
  const u = await user(ph);
  const ids = u?.type === 'person' ? [u.pid] : (await all('select id from profiles where broker=$1', [ph])).map(r => r.id);
  if (!ids.length) return menu(ph);
  const rec = await all(`select * from interests where to_id = any($1) and st='sent' order by id`, [ids]);
  const sent = await all(`select * from interests where from_id = any($1) order by id desc limit 15`, [ids]);
  const acc = await all(`select * from interests where (to_id = any($1) or from_id = any($1)) and st='accepted' order by id desc limit 10`, [ids]);
  if (!rec.length && !sent.length && !acc.length) return sendMsg(ph, 'No interests yet. Tap *Find matches* to start.', [['find', 'Find matches']]);
  if (acc.length) {
    const lines = [];
    for (const x of acc) { const mine = ids.includes(x.from_id); const other = await getP(mine ? x.to_id : x.from_id); if (other) lines.push(`ENK${mine ? x.from_id : x.to_id} ↔ ${other.code}: ${await contact(other)}`); }
    await sendMsg(ph, '*Accepted — contacts*\n' + lines.join('\n'));
  }
  if (sent.length) await sendMsg(ph, '*Interests sent*\n' + sent.map(x => `ENK${x.from_id} → ENK${x.to_id}: ${x.st}`).join('\n'));
  for (const x of rec.slice(0, 5)) { const f = await getP(x.from_id); await sendMsg(ph, `*Interest* for ENK${x.to_id}\nFrom: ${card(f)}`, [['ac:' + x.id, 'Accept'], ['dc:' + x.id, 'Decline']]); }
  if (!rec.length) return sendMsg(ph, 'No pending interests received.', MENU);
}

// ---------- plan & payments ----------
async function plan(ph) {
  const u = await user(ph);
  if (u?.type === 'broker') {
    const n = +(await one('select count(*) n from profiles where broker=$1', [ph])).n, live = new Date(u.exp) > new Date();
    return sendMsg(ph, `*Broker plan*\n${u.name}\nStatus: ${live ? 'Active' : 'Expired (candidates hidden)'}\nValid till: ${D(u.exp)}\nID: ${u.status}\nCandidates: ${n} of ${CFG.cap}\nRenewal: ${rs(CFG.broker)} / 30 days`, [['renew', 'Renew'], ['menu', 'Menu']]);
  }
  if (u?.type !== 'person') return menu(ph);
  const p = await getP(u.pid);
  const used = +(await one('select count(*) n from seen where pid=$1 and period=$2', [p.id, p.till])).n;
  return sendMsg(ph, `*My plan*\nProfile: ${p.code}\nStatus: ${p.live ? 'Active' : 'Expired (hidden from search)'}\nValid till: ${D(p.exp)}\nVerification: ${p.status}\nProfiles this month: ${used} of ${CFG.monthly}\nRenewal: ${rs(CFG.person)} / 30 days`, [['renew', 'Renew'], ['menu', 'Menu']]);
}

async function renew(ph) {
  const u = await user(ph);
  if (u?.type !== 'person' && u?.type !== 'broker') return menu(ph);
  const amt = u.type === 'broker' ? CFG.broker : CFG.person;
  let url;
  try { url = await createLink(ph, u.type, amt); }
  catch (e) { console.error(e); return sendMsg(ph, 'Sorry, the payment link could not be created right now. Please try again in a few minutes.', MENU); }
  return sendMsg(ph, `*Renew 30 days — ${rs(amt)}*\nPay securely with UPI / card. Your plan is extended from its current end date, so you lose no days.`, [], { label: `Pay ${rs(amt)}`, url });
}

// called when Razorpay confirms payment
export async function onPaid(pay) {
  const u = await user(pay.phone);
  if (!u) return;
  let exp;
  if (pay.kind === 'broker') exp = (await one(`update users set exp=${EXP(30)},rem3=null,rem0=null where phone=$1 returning exp`, [pay.phone])).exp;
  else exp = (await one(`update profiles set exp=${EXP(30)},rem3=null,rem0=null where id=$1 returning exp`, [u.pid])).exp;
  await notify(pay.phone, `*Payment received: ${rs(pay.amount)}*\nValid till *${D(exp)}*.\n${pay.kind === 'broker' ? 'All your candidate profiles are visible again.' : `Your profile is visible again, with ${CFG.monthly} new matching profiles this month.`}`, MENU, null, ['enikah_paid', [rs(pay.amount), D(exp)]]);
  await notifyAdmins(`Payment ${rs(pay.amount)} received from ${u.name || plus(pay.phone)} (${pay.kind}).`);
}

// ---------- delete my data ----------
async function deleteMe(ph) {
  const u = await user(ph);
  const ids = (await all('select id from profiles where owner=$1 or broker=$1', [ph])).map(r => r.id);
  if (ids.length) {
    await q('delete from interests where from_id = any($1) or to_id = any($1)', [ids]);
    await q('delete from seen where pid = any($1) or sid = any($1)', [ids]);
    await q(`delete from docs where kind='p' and ref = any($1)`, [ids.map(String)]);
    await q('delete from profiles where id = any($1)', [ids]);
  }
  await q(`delete from docs where kind='b' and ref=$1`, [ph]);
  await q(`update users set type=$2,name=null,city=null,pid=null,exp=null,status='unverified' where phone=$1`, [ph, isAdmin(ph) ? 'admin' : null]);
  await setS(ph, {});
  return sendMsg(ph, `Your ENikah data has been deleted${u?.type ? '' : ' (nothing was stored)'}. You can register again anytime by typing *hi*.`);
}

// ---------- reminders (run hourly) ----------
export async function runReminders() {
  const soon = await all(`select p.*, 'ENK'||p.id code from profiles p where owner is not null and exp>now() and exp<=now()+interval '3 days' and rem3 is distinct from exp and status<>'blocked'`);
  for (const p of soon) {
    await notify(p.owner, `Reminder: your ENikah plan ends on *${D(p.exp)}*. Renew ${rs(CFG.person)} to stay visible.`, [['renew', 'Renew now']], null, ['enikah_reminder', [p.name.split(' ')[0], D(p.exp)]]);
    await q('update profiles set rem3=exp where id=$1', [p.id]);
  }
  const gone = await all(`select p.*, 'ENK'||p.id code from profiles p where owner is not null and exp<=now() and rem0 is distinct from exp and status<>'blocked'`);
  for (const p of gone) {
    await notify(p.owner, `Your plan has expired. Profile *${p.code}* is now hidden from search.\nRenew ${rs(CFG.person)} to show it again.`, [['renew', 'Renew now']], null, ['enikah_expired', [p.name.split(' ')[0], D(p.exp), p.code]]);
    await q('update profiles set rem0=exp where id=$1', [p.id]);
  }
  const bsoon = await all(`select * from users where type='broker' and exp>now() and exp<=now()+interval '3 days' and rem3 is distinct from exp`);
  for (const b of bsoon) {
    await notify(b.phone, `Reminder: your broker plan ends on *${D(b.exp)}*. Renew ${rs(CFG.broker)} to keep your candidates visible.`, [['renew', 'Renew now']], null, ['enikah_reminder', [b.name, D(b.exp)]]);
    await q('update users set rem3=exp where phone=$1', [b.phone]);
  }
  const bgone = await all(`select * from users where type='broker' and exp<=now() and rem0 is distinct from exp`);
  for (const b of bgone) {
    await notify(b.phone, `Your broker plan has expired. All your candidate profiles are hidden.\nRenew ${rs(CFG.broker)} to show them again.`, [['renew', 'Renew now']], null, ['enikah_expired', [b.name, D(b.exp), 'your candidates']]);
    await q('update users set rem0=exp where phone=$1', [b.phone]);
  }
  await q(`delete from tokens where expires < now()`);
  await q(`delete from docs where created < now() - interval '30 days'`);
}
