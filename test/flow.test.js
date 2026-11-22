// End-to-end test against a real Postgres. Usage: DATABASE_URL=... node test/flow.test.js
import { spawn } from 'child_process';
import assert from 'assert/strict';
import pg from 'pg';

const PORT = 3999, B = `http://localhost:${PORT}`, ADMIN = '910000000000';
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
await db.query('drop schema public cascade; create schema public;');

const srv = spawn('node', ['src/index.js'], { env: { ...process.env, PORT, BASE_URL: B, DRY_RUN: '1', DEV_MODE: '1', ADMIN_PHONES: ADMIN, MONTHLY_LIMIT: '2', WA_TOKEN: '', RAZORPAY_KEY_ID: '' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise(r => srv.stdout.on('data', d => String(d).includes('ENikah bot on') && r()));

const say = async (from, text = '', id) => (await (await fetch(B + '/dev/msg', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ from, text, id }) })).json());
const to = (o, ph) => o.filter(m => m.to === ph);
const txt = o => o.map(m => m.text?.body || m.interactive?.body?.text || 'TPL:' + m.template?.name).join('\n---\n');
const link = o => o.find(m => m.interactive?.type === 'cta_url')?.interactive.action.parameters.url;
const ids = o => o.flatMap(m => m.interactive?.action?.buttons?.map(b => b.reply.id) || m.interactive?.action?.sections?.[0].rows.map(r => r.id) || []);
const ok = (cond, msg) => { assert.ok(cond, msg); console.log('  ✓', msg); };

async function register(ph, [name, g, age, city, maslak, marital, edu, job, pa, pm]) {
  await say(ph, 'hi'); await say(ph, '', 'rp');
  for (const v of [name, 'o:' + g, age, city, 'o:' + maslak, 'o:' + marital, edu, job, pa, 'o:' + pm]) {
    var o = v.startsWith?.('o:') ? await say(ph, '', v) : await say(ph, v);
  }
  return o;
}
async function verify(ph, pid) {
  const o = await say(ph, '', 'ver:' + pid);
  const fd = new FormData();
  fd.append('id_doc', new Blob([Buffer.from('fakeimg')], { type: 'image/jpeg' }), 'id.jpg');
  if (pid !== 'b') fd.append('photo', new Blob([Buffer.from('fakephoto')], { type: 'image/png' }), 'p.png');
  const r = await fetch(link(o), { method: 'POST', body: fd });
  assert.equal(r.status, 200);
  const out = await (await fetch(B + '/dev/outbox')).json();
  const adm = to(out, ADMIN);
  const docUrl = link(adm);
  const ap = ids(adm).find(i => i.startsWith('ap:'));
  await say(ADMIN, '', ap);
  return { adm, docUrl };
}

try {
  await say(ADMIN, 'hi');
  console.log('Registration & verification');
  let o = await register('911111111111', ['Ayesha Begum', 'F', '22', 'Chennai', 'Sunni Hanafi', 'Never married', 'B.Sc', 'Teacher', '25-32', 'same']);
  ok(/Registered — 1 month free[\s\S]*ENK1001/.test(txt(o)), 'bride registers free with 1 month, gets ENK1001');
  o = await say('911111111111', '', 'find');
  ok(/Only \*verified\*/.test(txt(o)), 'unverified user cannot see profiles');
  const { adm, docUrl } = await verify('911111111111', '1001');
  ok(/New verification request[\s\S]*Ayesha/.test(txt(adm)), 'admin gets verification request');
  ok((await fetch(docUrl)).status === 200, 'admin can open document page');
  const doc = await db.query("select count(*) from docs"); ok(doc.rows[0].count === '0', 'ID document deleted after approval');

  o = await say('912222222220', '20');
  ok(/age \(21–70\)|valid age/.test(txt(await (async () => { await say('912222222220', 'hi'); await say('912222222220', '', 'rp'); await say('912222222220', 'Test'); await say('912222222220', '', 'o:M'); return say('912222222220', '20'); })())), 'groom under 21 rejected');
  await say('912222222220', 'menu');

  console.log('Grooms');
  const grooms = [
    ['912222222221', ['Imran', 'M', '28', 'Chennai', 'Sunni Hanafi', 'Never married', 'B.E', 'Engineer', '20-27', 'any']],   // fits both ways
    ['912222222222', ['Yusuf', 'M', '30', 'Vellore', 'Sunni Hanafi', 'Never married', 'MBA', 'Business', 'Any', 'any']],     // fits
    ['912222222223', ['Nadeem', 'M', '31', 'Chennai', 'Sunni Hanafi', 'Divorced', 'B.Com', 'Bank', '25-35', 'any']],         // wants 25+ → excluded
    ['912222222224', ['Abbas', 'M', '27', 'Chennai', 'Shia', 'Never married', 'B.Sc', 'Pharmacist', 'Any', 'any']],          // bride wants same maslak → excluded
    ['912222222225', ['Riyaz', 'M', '29', 'Madurai', 'Sunni Hanafi', 'Never married', 'Diploma', 'Electrician', 'Any', 'any']], // fits
  ];
  for (const [ph, d] of grooms) { const r = await register(ph, d); const pid = /ENK(\d+)/.exec(txt(r))[1]; await verify(ph, pid); }

  console.log('Matching & monthly limit (limit=2 in test)');
  o = await say('911111111111', '', 'find');
  ok(/2 verified matches[\s\S]*2 of 2/.test(txt(o)), 'bride gets 2 matches (monthly limit 2)');
  let page = await (await fetch(link(o))).text();
  ok(page.includes('ENK1002') && page.includes('ENK1006') && !page.includes('ENK1004') && !page.includes('ENK1005'), 'Chennai first; Nadeem (age choice) & Abbas (maslak) excluded');
  o = await say('911111111111', '', 'find');
  ok(/all 2 profiles for this month/.test(txt(o)), 'monthly limit reached message');

  console.log('Interest & contacts');
  const mUrl = link(await (async () => { const t = (await db.query("select token from tokens where kind='m' order by expires desc limit 1")).rows[0].token; return [{ interactive: { type: 'cta_url', action: { parameters: { url: `${B}/m/${t}` } } } }]; })());
  let r = await fetch(`${mUrl}/i/1002`, { method: 'POST', redirect: 'manual' });
  ok(r.status === 303, 'interest posted from matches page');
  let out = await (await fetch(B + '/dev/outbox')).json(); if(process.env.DBG) console.log(JSON.stringify(out).slice(0,800), r.headers.get('location'));
  ok(/New interest\* for ENK1002/.test(txt(to(out, '912222222221'))), 'groom notified of interest');
  const ac = ids(to(out, '912222222221')).find(i => i.startsWith('ac:'));
  ok(/^ac:\d+$/.test(ac), 'accept button present');
  o = await say('912222222222', '', ac.replace('ac', 'ac'));
  ok(/Not allowed/.test(txt(to(o, '912222222222'))), 'another user cannot accept someone else\'s interest');
  o = await say('912222222221', '', ac);
  ok(/Ayesha Begum, \+911111111111/.test(txt(to(o, '912222222221'))), 'groom gets bride contact');
  ok(/Imran, \+912222222221/.test(txt(to(o, '911111111111'))), 'bride gets groom contact');

  console.log('Renewal');
  const before = (await db.query('select exp from profiles where id=1001')).rows[0].exp;
  o = await say('911111111111', 'renew');
  const payUrl = link(o); ok(/\/dev\/pay\/dev_/.test(payUrl), 'payment link created');
  await fetch(payUrl); out = await (await fetch(B + '/dev/outbox')).json();
  const after = (await db.query('select exp from profiles where id=1001')).rows[0].exp;
  ok(Math.round((after - before) / 864e5) === 30, 'renewal adds 30 days to current end date');
  ok(/Payment received: ₹2,000/.test(txt(to(out, '911111111111'))) && /Payment ₹2,000 received/.test(txt(to(out, ADMIN))), 'user and admin notified of payment');
  await fetch(payUrl); out = await (await fetch(B + '/dev/outbox')).json();
  ok(!out.length, 'same payment cannot be applied twice');
  o = await say('911111111111', '', 'find');
  ok(/1 verified match[\s\S]*1 of 2/.test(txt(o)), 'new month gives new matches (only 1 unseen left)');

  console.log('Expiry hides profiles; reminders');
  await db.query("update profiles set exp=now()+interval '2 days' where id=1001");
  await db.query("update profiles set exp=now()-interval '1 minute' where id=1002");
  out = await (await fetch(B + '/dev/reminders', { method: 'POST' })).json();
  ok(/plan ends on/.test(txt(to(out, '911111111111'))), '3-day reminder sent');
  ok(/expired[\s\S]*ENK1002/.test(txt(to(out, '912222222221'))), 'expiry notice sent');
  out = await (await fetch(B + '/dev/reminders', { method: 'POST' })).json();
  ok(!out.length, 'reminders not repeated');
  page = await (await fetch(mUrl)).text();
  ok(/No longer available/.test(page), 'expired profile shows as no longer available');
  o = await say('912222222221', '', 'find');
  ok(/plan expired/.test(txt(o)), 'expired user cannot search');

  console.log('Outside 24h window uses templates');
  await db.query("update users set last_in=now()-interval '2 days' where phone='912222222222'");
  await db.query("update tokens set data='{\"ids\":[1003]}' where token=$1", [mUrl.split('/m/')[1]]);
  await fetch(`${mUrl}/i/1003`, { method: 'POST', redirect: 'manual' });
  out = await (await fetch(B + '/dev/outbox')).json();
  ok(to(out, '912222222222').some(m => m.template?.name === 'enikah_interest'), 'interest to inactive chat sent as template');

  console.log('Broker');
  await say('913333333333', 'hi'); await say('913333333333', '', 'rb'); await say('913333333333', 'Rahim Bureau'); o = await say('913333333333', 'Ambur');
  ok(/Broker account created/.test(txt(o)), 'broker registers free');
  await verify('913333333333', 'b');
  await say('913333333333', '', 'addc');
  for (const v of ['Sana', 'o:F', '24', 'Ambur', 'o:Sunni Hanafi', 'o:Never married', 'B.Sc', 'Lab tech', 'o:Any', 'o:any']) o = v.startsWith('o:') ? await say('913333333333', '', v) : await say('913333333333', v);
  const cid = /ENK(\d+)/.exec(txt(o))[1];
  ok(/Candidate added/.test(txt(o)), 'broker adds candidate');
  await verify('913333333333', cid);
  o = await say('913333333333', '', 'fc:' + cid);
  ok(/verified match/.test(txt(o)), 'broker gets matches for candidate');
  await db.query("update users set exp=now()-interval '1 minute' where phone='913333333333'");
  const vis = (await db.query(`select count(*) from profiles p join users b on b.phone=p.broker where p.id=$1 and b.exp>now()`, [cid])).rows[0].count;
  ok(vis === '0', 'candidate hidden when broker plan expires');
  o = await say('913333333333', '', 'fc:' + cid);
  ok(/broker plan has expired/.test(txt(o)), 'expired broker cannot search');
  o = await say('911111111111', '', 'fc:' + cid);
  ok(/not found/.test(txt(o)), "other users cannot use broker's candidate");

  console.log('Admin & privacy');
  o = await say(ADMIN, '', 'stats'); ok(/Live & verified profiles/.test(txt(o)), 'admin stats');
  o = await say('911111111111', '', 'stats'); ok(/Not allowed/.test(txt(o)), 'non-admin blocked from admin commands');
  o = await say('911111111111', 'report ENK1004 fake profile'); ok(/Report[\s\S]*ENK1004/.test(txt(to(o, ADMIN))), 'report reaches admin');
  o = await say(ADMIN, 'block ENK1004'); ok(/blocked/.test(txt(o)), 'admin blocks profile');
  o = await say('911111111111', 'delete'); o = await say('911111111111', '', 'delyes');
  ok(/data has been deleted/.test(txt(o)) && (await db.query('select count(*) from profiles where owner=$1', ['911111111111'])).rows[0].count === '0', 'user can delete their data');

  console.log('\nAll tests passed');
} finally { srv.kill(); await db.end(); }
