// End-to-end test of the website against a real Postgres. Usage: DATABASE_URL=... npm test
import { spawn } from 'child_process';
import assert from 'assert/strict';
import pg from 'pg';

const PORT = 3999, B = `http://localhost:${PORT}`, ADMIN = '9000000000';
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
await db.query('drop schema public cascade; create schema public;');
const srv = spawn('node', ['src/index.js'], { env: { ...process.env, PORT, BASE_URL: B, DEV_MODE: '1', ADMIN_PHONES: '91' + ADMIN, ADMIN_EMAIL: 'boss@example.com', ADMIN_PASSWORD: 'test-admin-pass-123', MONTHLY_LIMIT: '2', UPI_ID: 'test@oksbi', HELP_WHATSAPP: '919443424064', WA_SEND: '1', WA_TOKEN: 't', WA_PHONE_ID: 'p', WA_NUMBER: '9443424064', DRY_RUN: '1', RAZORPAY_KEY_ID: '', RESEND_API_KEY: '' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r, j) => { srv.stdout.on('data', d => String(d).includes('ENikah site on') && r()); srv.on('exit', () => j(new Error('server exited'))); });

class Browser {
  jar = {};
  get cookie() { return Object.entries(this.jar).map(([k, v]) => k + '=' + v).join('; '); }
  async req(path, opts = {}) {
    const r = await fetch(B + path, { redirect: 'manual', ...opts, headers: { ...(opts.headers || {}), cookie: this.cookie } });
    for (const sc of r.headers.getSetCookie()) { const [kv] = sc.split(';'); const i = kv.indexOf('='); this.jar[kv.slice(0, i)] = kv.slice(i + 1); }
    const loc = r.headers.get('location');
    const msg = loc && new URL(loc.split('#')[0], B).searchParams.get('msg');
    return { status: r.status, loc: loc && loc.split('?')[0], full: loc, msg, body: await r.text() };
  }
  get(p) { return this.req(p); }
  post(p, data) { return this.req(p, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() }); }
  upload(p, files) { const fd = new FormData(); for (const [k, type] of files) fd.append(k, new Blob([Buffer.from('x')], { type }), k); return this.req(p, { method: 'POST', body: fd }); }
}
const ok = (cond, msg) => { assert.ok(cond, msg); console.log('  ✓', msg); };
const admin = new Browser();
const P = (name, g, age, city, maslak, marital, edu, job, pa_min, pa_max, pm) => ({ name, g, age, city, maslak, marital, edu, job, pa_min, pa_max, pm });

// Register and enter the emailed code (read from the database, as the member would from their inbox).
async function signup(b, phone, kind = 'person') {
  const r = await b.post('/register', { phone, password: 'secret12', email: `u${phone}@test.in`, kind });
  const code = (await db.query(`select data->>'code' c from tokens where phone=$1 and kind='emailcode'`, ['91' + phone])).rows[0]?.c;
  const v = await b.post('/verify-email?next=' + encodeURIComponent(new URLSearchParams(r.full?.split('?')[1] || '').get('next') || '/home'), { code });
  return { r, v };
}
async function member(phone, prof) {
  const b = new Browser(); b.phone = '91' + phone;
  b.sg = await signup(b, phone);
  b.created = await b.post('/profile/new', prof);
  b.pid = +(/ENK(\d+)/.exec(b.created.msg || '') || [])[1];
  return b;
}
async function verifyAndApprove(b, target) {
  const r = await b.upload(`/verify/${target}`, target === 'b' ? [['id_doc', 'image/jpeg']] : [['id_doc', 'image/jpeg'], ['photo', 'image/png']]);
  assert.equal(r.status, 303, 'upload ' + r.body.slice(0, 200));
  return admin.post('/admin/decide', { kind: target === 'b' ? 'b' : 'p', ref: target === 'b' ? b.phone : target, ok: '1' });
}

try {
  console.log('Accounts');
  let r = await admin.post('/register', { phone: ADMIN, password: 'adminpass', email: 'boss@example.com', kind: 'person' });
  ok(r.loc === '/admin', 'admin number registers straight into the admin panel');
  const bride = await member('9111111111', P('Ayesha Begum', 'F', '22', 'Chennai', 'Sunni Hanafi', 'Never married', 'B.Sc', 'Teacher', '25', '32', 'same'));
  if (process.env.DBG) console.log(bride.created, bride.sg);
  ok(bride.pid === 1001 && /free for 90 days/.test(bride.created.msg), 'bride registers free for 90 days (3 months), gets ENK1001');
  r = await new Browser().post('/login', { phone: '9111111111', password: 'wrong' });
  ok(r.status === 401, 'wrong password rejected');
  r = await new Browser().post('/login', { phone: '+91 91111 11111', password: 'secret12' });
  ok(r.status === 303 && r.loc === '/home', 'login works with +91 and spaces');
  r = await new Browser().post('/register', { phone: '9111111111', password: 'secret12' });
  ok(/already registered/.test(r.body), 'same number cannot register twice');
  r = await new Browser().post('/register', { phone: '9222222229', password: 'secret12', email: '' });
  ok(r.status === 400 && /valid email/.test(r.body), 'email is required');
  const ev = new Browser();
  r = await ev.post('/register', { phone: '9222222228', password: 'secret12', email: 'ev@test.in', kind: 'person' });
  ok(r.loc === '/verify-email', 'after registering, member must verify email');
  ok((await ev.get('/home')).loc === '/verify-email', 'site is locked until the email is verified');
  r = await ev.post('/verify-email', { code: '000000' });
  ok(r.status === 400 && /Wrong code/.test(r.body), 'wrong code rejected');
  const evCode = (await db.query(`select data->>'code' c from tokens where phone='919222222228' and kind='emailcode'`)).rows[0].c;
  r = await ev.post('/verify-email?next=/profile/new', { code: evCode });
  ok(r.loc === '/profile/new' && /Email verified/.test(r.msg), 'right code verifies the email');
  ok(!/name="maslak"|name="pm"/.test((await ev.get('/profile/new')).body), 'profile form has no maslak');
  r = await new Browser().post('/login', { phone: 'ev@test.in', password: 'secret12' });
  ok(r.loc === '/home', 'login with email works');
  await new Browser().post('/forgot', { phone: 'EV@test.in' });
  ok((await db.query(`select count(*) from tokens where phone='919222222228' and kind='reset'`)).rows[0].count === '1', 'forgot password by email sends a reset link');
  const young = new Browser(); await signup(young, '9222222220');
  r = await young.post('/profile/new', P('Test', 'M', '20', 'Chennai', 'Sunni Hanafi', 'Never married', 'B.Sc', 'X', '', '', 'any'));
  ok(r.status === 400 && /Legal marriage age/.test(r.body), 'groom under 21 rejected');

  const alerts = (await db.query(`select text from notes where phone='91${ADMIN}' order by id`)).rows.map(r => r.text).join('\n');
  ok(/New registration: \+919111111111 as bride \/ groom/.test(alerts) && /New profile by \+919111111111: ENK1001 Ayesha Begum — Bride, 22, Chennai/.test(alerts), 'admin alerted about new registration and profile');

  console.log('Verification');
  r = await bride.get('/matches/1001');
  ok(/Only verified members/.test(r.body), 'unverified member cannot see matches');
  await bride.upload('/verify/1001', [['id_doc', 'image/jpeg'], ['photo', 'image/png']]);
  r = await admin.get('/admin');
  ok(/ENK1001 · Ayesha Begum/.test(r.body) && /\/admin\/doc\/\d+\/id/.test(r.body), 'admin sees pending request with documents');
  const docUrl = /\/admin\/doc\/\d+\/id/.exec(r.body)[0];
  ok((await admin.get(docUrl)).status === 200 && (await bride.get(docUrl)).status === 303, 'only admin can open ID documents');
  r = await admin.post('/admin/decide', { kind: 'p', ref: '1001', ok: '1' });
  ok(/ENK1001 approved/.test(r.msg), 'admin approves');
  ok((await db.query('select count(*) from docs')).rows[0].count === '0', 'ID document deleted after approval');

  console.log('Two-way matching & monthly limit (limit 2 in test)');
  const grooms = {};
  for (const [ph, p] of [
    ['9222222221', P('Imran', 'M', '28', 'Chennai', 'Sunni Hanafi', 'Never married', 'B.E', 'Engineer', '20', '27', 'any')],
    ['9222222222', P('Yusuf', 'M', '30', 'Vellore', 'Sunni Hanafi', 'Never married', 'MBA', 'Business', '', '', 'any')],
    ['9222222223', P('Nadeem', 'M', '31', 'Chennai', 'Sunni Hanafi', 'Divorced', 'B.Com', 'Bank', '25', '35', 'any')],
    ['9222222224', P('Abbas', 'M', '27', 'Chennai', 'Shia', 'Never married', 'B.Sc', 'Pharmacist', '', '', 'any')],
    ['9222222225', P('Riyaz', 'M', '29', 'Madurai', 'Sunni Hanafi', 'Never married', 'Diploma', 'Electrician', '', '', 'any')]]) {
    const g = await member(ph, p); await verifyAndApprove(g, String(g.pid)); grooms[p.name] = g;
  }
  r = await bride.post('/matches/1001', {});
  ok(/2 new verified matches/.test(r.msg), 'bride gets 2 matches');
  r = await bride.get('/matches/1001');
  ok(r.body.includes('ENK1002') && r.body.includes('ENK1005') && !r.body.includes('ENK1004') && !r.body.includes('ENK1003'), 'Chennai first, closest age; Nadeem (his age choice) excluded; maslak ignored');
  ok(!r.body.includes('Imran') && !r.body.includes('9222222221'), 'names and numbers hidden on match cards');
  r = await bride.post('/matches/1001', {});
  ok(/all 2 profiles for this month/.test(r.msg), 'monthly limit reached');

  console.log('Interests, contacts, photos');
  r = await bride.post('/interest', { from: 1001, to: 1003 });
  ok(/Not allowed/.test(r.msg), 'cannot send interest to a profile not shown to you');
  r = await bride.post('/interest', { from: 1001, to: 1002 });
  ok(/Interest sent to ENK1002/.test(r.msg), 'interest sent');
  r = await grooms.Imran.get('/interests');
  ok(/For ENK1002/.test(r.body) && /\/interests\/1"/.test(r.body), 'groom sees the interest with Accept');
  r = await grooms.Yusuf.post('/interests/1', { ok: '1' });
  ok(/Not allowed/.test(r.msg), "others cannot accept someone else's interest");
  ok((await grooms.Yusuf.get('/photo/1001')).status === 403, 'photo hidden before acceptance');
  r = await grooms.Imran.post('/interests/1', { ok: '1' });
  ok(/Accepted/.test(r.msg), 'groom accepts');
  r = await bride.get('/interests');
  ok(/\+919222222221/.test(r.body) && /Imran/.test(r.body), 'bride sees groom contact');
  r = await grooms.Imran.get('/interests');
  ok(/\+919111111111/.test(r.body) && /Ayesha Begum/.test(r.body), 'groom sees bride contact');
  ok((await grooms.Imran.get('/photo/1001')).status === 200, 'photo visible after acceptance');
  ok((await db.query(`select count(*) from notes where phone='919111111111' and text like '%accepted%'`)).rows[0].count === '1', 'bride gets an accepted notification');

  console.log('Renewal');
  const before = (await db.query('select exp from profiles where id=1001')).rows[0].exp;
  r = await bride.post('/renew', {});
  ok(/\/dev\/pay\/dev_/.test(r.loc), 'renew opens the payment page');
  await bride.get(new URL(r.loc, B).pathname);
  const after = (await db.query('select exp from profiles where id=1001')).rows[0].exp;
  ok(Math.round((after - before) / 864e5) === 30, 'payment adds 30 days to the current end date');
  await bride.get(new URL(r.loc, B).pathname);
  ok(+(await db.query('select exp from profiles where id=1001')).rows[0].exp === +after, 'the same payment cannot be applied twice');
  r = await bride.post('/matches/1001', {});
  ok(/2 new verified matches/.test(r.msg), 'new month gives new matches');

  console.log('Expiry & reminders');
  await db.query(`update profiles set exp=now()+interval '2 days' where id=1001`);
  await db.query(`update profiles set exp=now()-interval '1 minute' where id=1002`);
  await fetch(B + '/dev/reminders', { method: 'POST' });
  const rem = (await db.query(`select phone from notes where text like 'Reminder%' or text like 'Your plan has ended%'`)).rows;
  ok(rem.some(x => x.phone === '919111111111') && rem.some(x => x.phone === '919222222221'), '3-day reminder and expiry notice sent');
  await fetch(B + '/dev/reminders', { method: 'POST' });
  ok((await db.query(`select count(*) from notes where text like 'Reminder%' or text like 'Your plan has ended%'`)).rows[0].count === String(rem.length), 'reminders not repeated');
  r = await bride.get('/matches/1001');
  ok(/No longer available/.test(r.body), 'expired profile shows as no longer available');
  r = await grooms.Imran.get('/matches/1002');
  ok(/Your plan ended/.test(r.body), 'expired member cannot search');

  console.log('Broker');
  const broker = new Browser(); broker.phone = '919333333333';
  const bs = await signup(broker, '9333333333', 'broker');
  ok(bs.v.loc === '/broker/setup', 'broker goes to broker setup after verifying email');
  r = await broker.post('/broker/setup', { name: 'Rahim Bureau', city: 'Ambur' });
  ok(/Broker account created/.test(r.msg), 'broker account free for first month');
  ok((await db.query(`select count(*) from notes where phone='91${ADMIN}' and text like 'New broker account: Rahim Bureau%'`)).rows[0].count === '1', 'admin alerted about new broker');
  await verifyAndApprove(broker, 'b');
  r = await broker.post('/broker/new', P('Sana', 'F', '24', 'Ambur', 'Sunni Hanafi', 'Never married', 'B.Sc', 'Lab tech', '', '', 'any'));
  const cid = +/ENK(\d+)/.exec(r.msg)[1];
  ok(cid > 1006, 'broker adds a candidate');
  await verifyAndApprove(broker, String(cid));
  r = await broker.post(`/matches/${cid}`, {});
  ok(/verified match/.test(r.msg), 'broker gets matches for the candidate');
  r = await bride.get(`/matches/${cid}`);
  ok(/Profile not found/.test(r.msg || ''), "others cannot open a broker's candidate");
  await db.query(`update users set exp=now()-interval '1 minute' where phone='919333333333'`);
  r = await broker.get(`/matches/${cid}`);
  ok(/broker plan has expired/.test(r.body), 'candidates hidden and blocked when broker plan expires');

  console.log('Admin tools, report, delete');
  r = await bride.post('/report', { pid: 1006, reason: 'fake profile' });
  ok(/admin will review/.test(r.msg), 'member reports a profile');
  r = await admin.get('/admin');
  ok(/fake profile/.test(r.body), 'admin sees the report');
  r = await admin.post('/admin/block', { id: 1006, on: '1' });
  ok(/blocked/.test(r.msg), 'admin blocks a profile');
  r = await admin.post('/admin/extend', { id: cid });
  ok(/Added 30 days/.test(r.msg) && (await db.query(`select exp>now() a from users where phone='919333333333'`)).rows[0].a, 'admin adds 30 days for a cash payment');
  ok((await bride.get('/admin')).loc === '/home', 'members cannot open the admin panel');
  r = await bride.post('/account/delete', { confirm: 'DELETE' });
  ok(/deleted/.test(r.msg) && (await db.query(`select count(*) from users where phone='919111111111'`)).rows[0].count === '0', 'member deletes account and data');
  ok((await new Browser().get('/')).status === 200 && (await new Browser().get('/privacy')).status === 200, 'public pages load');

  console.log('Admin login page');
  const a2 = new Browser();
  ok((await a2.get('/admin')).loc === '/admin/login', 'admin panel asks for the admin login');
  r = await a2.post('/admin/login', { username: 'boss@example.com', password: 'wrong-password' });
  ok(r.status === 401 && /Wrong username or password/.test(r.body), 'wrong admin password rejected');
  r = await a2.post('/admin/login', { username: 'boss@example.com', password: 'test-admin-pass-123' });
  ok(r.loc === '/admin' && (await a2.get('/admin')).status === 200, 'admin logs in with email + password');
  const a3 = new Browser();
  r = await a3.post('/admin/login', { username: '9000000000', password: 'test-admin-pass-123' });
  ok(r.loc === '/admin', 'admin can also use the mobile number as username');
  r = await new Browser().post('/admin/login', { username: '9111111112', password: 'test-admin-pass-123' });
  ok(r.status === 401, 'other numbers cannot use the admin login');

  console.log('UPI, follow-ups, QR, traffic');
  const pay = new Browser(); await pay.post('/login', { phone: '9222222222', password: 'secret12' });
  r = await pay.get('/renew');
  ok(/<svg/.test(r.body) && /test@oksbi/.test(r.body) && /upi:\/\/pay\?pa=test%40oksbi&amp;pn=ENikah&amp;am=2000\.00/.test(r.body) && /Razorpay/.test(r.body), 'pay page shows UPI QR, UPI ID and Razorpay');
  r = await pay.post('/renew/upi', { utr: '123' });
  ok(/transaction ID/.test(r.msg), 'bad UTR rejected');
  const before2 = (await db.query('select exp from profiles where id=1003')).rows[0].exp;
  r = await pay.post('/renew/upi', { utr: '412345678901' });
  ok(/confirm your UPI payment/.test(r.msg), 'member submits UPI transaction ID');
  r = await admin.get('/admin');
  ok(/412345678901/.test(r.body) && /Confirm payment/.test(r.body), 'admin sees UPI payment to confirm');
  const upiId = (await db.query(`select id from payments where utr='412345678901'`)).rows[0].id;
  r = await admin.post('/admin/upi', { id: upiId, ok: '1' });
  if (process.env.DBG) console.log(r.msg, (await db.query('select exp from profiles where id=1003')).rows[0].exp, before2, (await db.query("select pid,phone from users where phone='919222222222'")).rows);
  ok(/confirmed/.test(r.msg) && Math.round(((await db.query('select exp from profiles where id=1003')).rows[0].exp - before2) / 864e5) === 30, 'confirming UPI adds 30 days');
  ok(/confirmed|Already/.test((await admin.post('/admin/upi', { id: upiId, ok: '1' })).msg) && Math.round(((await db.query('select exp from profiles where id=1003')).rows[0].exp - before2) / 864e5) === 30, 'a UPI payment counts only once');

  const lazy = new Browser(); await signup(lazy, '9555555555');
  await db.query(`update users set created=now()-interval '3 hours' where phone='919555555555'`);
  await fetch(B + '/dev/mail'); await fetch(B + '/dev/followups', { method: 'POST' });
  const mails = await (await fetch(B + '/dev/mail')).json();
  ok(mails.some(m => m.to === 'u9555555555@test.in' && /Complete your ENikah profile/.test(m.subject) && /சுயவிவர/.test(m.text)), 'member without a profile gets a follow-up email (English + Tamil)');
  await fetch(B + '/dev/followups', { method: 'POST' });
  ok(!(await (await fetch(B + '/dev/mail')).json()).some(m => m.to === 'u9555555555@test.in'), 'follow-up email not repeated');
  r = await admin.get('/admin');
  ok(/\+919555555555/.test(r.body) && /wa\.me\/919555555555\?text=/.test(r.body) && /No profile yet/.test(r.body), 'admin follow-up list with WhatsApp link');
  ok(/wa\.me\/919222222221\?text=/.test(r.body) && /Newly verified/.test(r.body), 'admin can WhatsApp newly verified members');

  r = await new Browser().get('/qr.svg?src=poster');
  ok(r.status === 200 && /<svg/.test(r.body), 'registration QR image');
  ok(/register\?src=poster/.test((await admin.get('/admin/qr?src=poster')).body), 'printable registration QR for a source');

  const visitor = new Browser();
  await visitor.get('/?src=yneet');
  await signup(visitor, '9666666666');
  ok((await db.query(`select source from users where phone='919666666666'`)).rows[0].source === 'yneet', 'sign-up remembers it came from yneet');
  r = await admin.get('/admin');
  ok(/<td>yneet<\/td><td>1<\/td><td>1<\/td>/.test(r.body), 'traffic report shows yneet visitors and sign-ups');

  const wam = await (await fetch(B + '/dev/wa')).json();
  ok(wam.some(m => m.to === '919222222221' && m.template.name === 'enikah_interest' && m.template.components[0].parameters[0].text === 'ENK1002'), 'interest also sent as WhatsApp template');
  ok(wam.some(m => m.template.name === 'enikah_newverified' && m.template.language.code === 'en'), 'verified message sent on WhatsApp');
  ok(wam.some(m => m.template.name === 'enikah_paid'), 'payment confirmation sent on WhatsApp');
  ok(/wa\.me\/919443424064/.test((await new Browser().get('/login')).body), 'help WhatsApp number shown');

  console.log('Tamil');
  const ta = new Browser();
  r = await ta.get('/lang/ta');
  ok(r.status === 303 && ta.jar.lang === 'ta', 'language switch remembers Tamil');
  r = await ta.get('/');
  ok(r.status === 302 && r.loc === '/ta', 'Tamil choice opens the Tamil URL');
  r = await ta.get('/ta');
  ok(/குடும்பங்களுக்கான சரிபார்க்கப்பட்ட முஸ்லிம் திருமண சேவை/.test(r.body) && /lang="ta"/.test(r.body) && />English</.test(r.body), 'home page in Tamil with an English switch');
  r = await ta.post('/register', { phone: '123', password: 'secret12' });
  ok(/சரியான 10 இலக்க இந்திய மொபைல் எண்ணை/.test(r.body), 'form errors in Tamil');
  await signup(ta, '9444444444');
  r = await ta.post('/profile/new', P('Fathima', 'F', '23', 'Chennai', 'Sunni Hanafi', 'Never married', 'B.Sc', 'Teacher', '', '', 'any'));
  r = await ta.get(r.loc + '?msg=' + encodeURIComponent(r.msg));
  ok(/பதிவு செய்யப்பட்டது! 90 நாட்கள் இலவசம்/.test(r.body) && /ஸலாம், Fathima/.test(r.body) && /சரிபார்க்கப்படவில்லை/.test(r.body), 'dashboard and messages in Tamil');
  r = await new Browser().req('/', { headers: { 'accept-language': 'ta-IN,ta;q=0.9' } });
  ok(r.status === 302 && r.loc === '/ta', 'Tamil phones get Tamil by default');
  console.log('Search engines');
  const bot = new Browser();
  r = await bot.get('/');
  ok(/<link rel="canonical" href="[^"]+\/">/.test(r.body) && /hreflang="ta" href="[^"]+\/ta"/.test(r.body) && /og:image/.test(r.body) && /"FAQPage"/.test(r.body), 'home has canonical, hreflang, OG and FAQ markup');
  r = await bot.get('/ta/tamil-muslim-matrimony');
  ok(r.status === 200 && /lang="ta"/.test(r.body) && /தமிழ் முஸ்லிம் மேட்ரிமோனி/.test(r.body) && /canonical" href="[^"]+\/ta\/tamil-muslim-matrimony"/.test(r.body), 'Tamil content page has its own URL');
  for (const p of ['/muslim-second-marriage', '/marriage-broker', '/safe-verified-matrimony', '/ta/terms']) ok((await bot.get(p)).status === 200, p + ' loads');
  r = await bot.get('/sunni-muslim-matrimony');
  ok(r.status === 301 && r.loc === '/tamil-muslim-matrimony', 'old maslak page redirects');
  r = await bot.get('/sitemap.xml');
  ok((r.body.match(/<loc>/g) || []).length === 14 && /\/ta\/marriage-broker/.test(r.body), 'sitemap lists English and Tamil pages');
  ok(/Disallow: \/admin/.test((await bot.get('/robots.txt')).body), 'robots.txt blocks private pages');
  ok(/noindex/.test((await bot.get('/login')).body), 'login is noindex');
  ok((await bot.get('/og.png')).status === 200, 'share image');
  ok(/Verified Muslim matrimony for families/.test((await new Browser().get('/')).body), 'English stays the default otherwise');

  console.log('\nAll tests passed');
} finally { srv.kill(); await db.end(); }
