// Follow-ups for people who did not finish: member emails on a schedule, a daily email to the admin with
// one-tap WhatsApp links (like ClassCoach / YNeet), and the "Follow up" list on the admin page.
import { q, one, all } from './db.js';
import { CFG, ADMINS } from './config.js';
import { sendMail } from './mail.js';

const E = process.env;
export const waLink = (phone, text) => `https://wa.me/${String(phone).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;

// Stage → message (English + Tamil). {link} is filled in.
const MSG = {
  email: ['Assalamu alaikum, this is the ENikah team. You started registering on ENikah but did not verify your email. Log in to get a new code and finish: {link} — the first 3 months are free.',
    'அஸ்ஸலாமு அலைக்கும், ENikah குழுவிலிருந்து. ENikah-இல் பதிவைத் தொடங்கினீர்கள், ஆனால் மின்னஞ்சலைச் சரிபார்க்கவில்லை. உள்நுழைந்து புதிய குறியீட்டைப் பெற்று முடியுங்கள்: {link} — முதல் 3 மாதங்கள் இலவசம்.'],
  profile: ['Assalamu alaikum, this is the ENikah team. Your registration is not complete yet — please add the profile details here: {link}. It takes 2 minutes and the first 3 months are free.',
    'அஸ்ஸலாமு அலைக்கும், ENikah குழுவிலிருந்து. உங்கள் பதிவு இன்னும் முடியவில்லை — சுயவிவர விவரங்களை இங்கே சேர்க்கவும்: {link}. 2 நிமிடம் போதும்; முதல் 3 மாதங்கள் இலவசம்.'],
  docs: ['Assalamu alaikum, this is the ENikah team. Please upload an ID proof and a recent photo to get verified: {link}. Only verified profiles are shown to families, and the ID is deleted after checking.',
    'அஸ்ஸலாமு அலைக்கும், ENikah குழுவிலிருந்து. சரிபார்ப்புக்கு அடையாள ஆவணம் மற்றும் சமீபத்திய புகைப்படத்தைப் பதிவேற்றவும்: {link}. சரிபார்க்கப்பட்ட சுயவிவரங்கள் மட்டுமே குடும்பங்களுக்குக் காட்டப்படும்; சரிபார்த்த பின் அடையாள ஆவணம் நீக்கப்படும்.'],
  verified: ['Assalamu alaikum, this is the ENikah team. Your profile {code} is now verified! You can see matching profiles here: {link}',
    'அஸ்ஸலாமு அலைக்கும், ENikah குழுவிலிருந்து. உங்கள் சுயவிவரம் {code} சரிபார்க்கப்பட்டது! பொருத்தமான வரன்களை இங்கே பார்க்கலாம்: {link}'],
};
const SUBJ = { email: 'Finish your ENikah registration', profile: 'Complete your ENikah profile', docs: 'Upload your ID and photo to get verified' };
const LINK = { email: '/login', profile: '/home', docs: '/home', verified: '/home' };
export const message = (stage, { lang = 'en', code = '' } = {}) => {
  const [en, ta] = MSG[stage], fill = s => s.replace('{link}', CFG.base + LINK[stage]).replace('{code}', code);
  return lang === 'ta' ? fill(ta) + '\n\n' + fill(en) : fill(en) + '\n\n' + fill(ta);
};

// Everyone who stopped part-way, newest first. stage: email | profile | docs
export async function incomplete() {
  const admin = ADMINS.length ? ADMINS : [''];
  return all(`
    select u.phone, u.email, u.lang, u.source, u.created, u.type, 'email' stage, null::int pid, null code
      from users u where u.pw is not null and not coalesce(u.email_ok,false) and u.phone <> all($1)
    union all
    select u.phone, u.email, u.lang, u.source, u.created, u.type, 'profile', null, null
      from users u where u.pw is not null and coalesce(u.email_ok,false) and u.type is null and u.phone <> all($1)
    union all
    select u.phone, u.email, u.lang, u.source, p.created, u.type, 'docs', p.id, 'ENK'||p.id
      from profiles p join users u on u.phone = coalesce(p.owner, p.broker) where p.status = 'unverified'
    union all
    select u.phone, u.email, u.lang, u.source, u.created, u.type, 'docs', null, 'broker'
      from users u where u.type = 'broker' and u.status = 'unverified'
    order by created desc limit 200`, [admin]);
}
export const recentlyVerified = () => all(`select p.id, 'ENK'||p.id code, p.name, coalesce(p.owner,p.broker) phone, u.lang from profiles p join users u on u.phone=coalesce(p.owner,p.broker)
  where p.status='verified' and not exists(select 1 from followups f where f.phone=coalesce(p.owner,p.broker) and f.step='wa-verified-'||p.id) order by p.id desc limit 30`);

// Member emails: after how many hours each step goes out.
const STEPS = { email: [1, 24], profile: [2, 24, 72], docs: [6, 48, 120] };
export async function runFollowups() {
  const rows = await incomplete();
  for (const r of rows) {
    if (!r.email) continue;
    const ageH = (Date.now() - new Date(r.created).getTime()) / 3600e3;
    const steps = STEPS[r.stage];
    for (let i = steps.length - 1; i >= 0; i--) {
      if (ageH < steps[i]) continue;
      const key = `${r.stage}${i + 1}${r.pid ? '-' + r.pid : ''}`;
      const ins = await one('insert into followups(phone,step) values($1,$2) on conflict do nothing returning step', [r.phone, key]);
      if (ins && ageH < steps[i] + 72) await sendMail(r.email, 'ENikah: ' + SUBJ[r.stage], message(r.stage, { lang: r.lang, code: r.code || '' }) + `\n\nENikah · ${CFG.base}`).catch(e => console.error('[followup]', e));
      // Older steps are marked done too, so a late joiner gets only one email.
      for (let j = 0; j < i; j++) await q('insert into followups(phone,step) values($1,$2) on conflict do nothing', [r.phone, `${r.stage}${j + 1}${r.pid ? '-' + r.pid : ''}`]);
      break;
    }
  }
  await dailyDigest(rows);
}

// Once a day after 9 am IST: one email to the admin listing everyone to follow up, with WhatsApp links.
async function dailyDigest(rows) {
  if (!E.ADMIN_EMAIL) return;
  const now = new Date(), ist = new Date(now.getTime() + 5.5 * 3600e3), day = ist.toISOString().slice(0, 10);
  if (ist.getUTCHours() < 9) return;
  const done = await one(`select value from settings where key='digest_day'`);
  if (done?.value === day) return;
  await q(`insert into settings(key,value) values('digest_day',$1) on conflict(key) do update set value=$1`, [day]);
  const fresh = rows.filter(r => Date.now() - new Date(r.created).getTime() > 3600e3);
  if (!fresh.length) return;
  const label = { email: 'did not verify email', profile: 'no profile yet', docs: 'no ID/photo uploaded' };
  const lines = fresh.slice(0, 60).map((r, i) => [
    `${i + 1}. +${r.phone}${r.code && r.code !== 'broker' ? ' · ' + r.code : ''}${r.type === 'broker' || r.code === 'broker' ? ' · broker' : ''}`,
    `   Status: ${label[r.stage]} · Email: ${r.email || '-'} · From: ${r.source || 'unknown'}`,
    `   WhatsApp them: ${waLink(r.phone, message(r.stage, { lang: r.lang, code: r.code || '' }))}`].join('\n'));
  await sendMail(E.ADMIN_EMAIL, `ENikah: ${fresh.length} ${fresh.length === 1 ? 'person needs' : 'people need'} a follow-up`,
    `${fresh.length} ${fresh.length === 1 ? 'person has' : 'people have'} not finished registering. Tap a WhatsApp link to send them a ready message:\n\n${lines.join('\n\n')}\n\nFull list: ${CFG.base}/admin#followup`).catch(e => console.error('[digest]', e));
}
