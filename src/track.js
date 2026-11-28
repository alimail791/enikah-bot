// First-party traffic tracking (no third-party scripts), like ClassCoach:
// a visitor cookie, where they first came from (?src= / utm_source / referring site), and new visits per day.
import crypto from 'crypto';
import { q, all } from './db.js';

const BOT = /bot|crawl|spider|slurp|preview|headless|monitor|curl|wget|python|axios|httpclient|scan|lighthouse/i;
const PRIVATE = /^\/(admin|home|account|broker|dashboard|matches|interests|photo|profile|verify|verify-email|verify-phone|reset|renew|paid|lang|dev|login|logout|forgot|qr|print|rzp|health|og\.png|robots\.txt|sitemap\.xml)(\/|$|\.)/;

const ck = (req, name) => { const m = new RegExp(`(?:^|;\\s*)${name}=([^;]*)`).exec(req.headers.cookie || ''); try { return m ? decodeURIComponent(m[1]) : ''; } catch { return ''; } };

// A readable channel name from a ?src tag or the referring host.
export function channel(tag, host) {
  const t = String(tag || '').toLowerCase();
  if (t) {
    if (/^(fb|facebook)/.test(t)) return 'facebook';
    if (/^(ig|insta)/.test(t)) return 'instagram';
    if (/^(wa|whatsapp)/.test(t)) return 'whatsapp';
    if (/^(yt|youtube)/.test(t)) return 'youtube';
    return t;
  }
  const h = String(host || '').toLowerCase();
  if (!h) return 'direct';
  if (/(^|\.)google\./.test(h)) return 'google';
  if (/bing\.com$|duckduckgo|yahoo\./.test(h)) return 'other search';
  if (/facebook\.com$|fb\.com$|fb\.me$/.test(h)) return 'facebook';
  if (/instagram\.com$/.test(h)) return 'instagram';
  if (/whatsapp\.(com|net)$|wa\.me$/.test(h)) return 'whatsapp';
  if (/youtube\.com$|youtu\.be$/.test(h)) return 'youtube';
  if (/t\.co$|twitter\.com$|x\.com$/.test(h)) return 'twitter/x';
  if (/chatgpt\.com$|openai\.com$|perplexity\.ai$|claude\.ai$|gemini\.google/.test(h)) return 'ai assistant';
  if (/(^|\.)(classcoach\.in|yneet\.in|testmandi\.in|raiseacademy\.in)$/.test(h)) return h.replace(/^www\./, '').split('.')[0];
  if (/vasulbook\.com$/.test(h)) return h.replace(/^www\./, '').split('.')[0];
  return h;
}

export function middleware(req, res, next) {
  if (req.method !== 'GET') return next();
  const ua = req.get('user-agent') || '';
  if (!ua || BOT.test(ua) || /\.[a-z0-9]{2,5}$/i.test(req.path)) return next();
  const opts = { maxAge: 60 * 864e5, httpOnly: true, sameSite: 'lax', secure: req.secure };
  const tag = String(req.query.utm_source || req.query.src || '').replace(/[^\w.\-]/g, '').slice(0, 40);
  let vid = ck(req, 'en_vid');
  if (!vid && !PRIVATE.test(req.path) || (!vid && tag)) {
    vid = crypto.randomBytes(9).toString('base64url');
    res.cookie('en_vid', vid, { ...opts, maxAge: 365 * 864e5 });
    let host = '';
    try { host = new URL(req.get('referer') || '').hostname.replace(/^www\./, ''); if (/^enikah\./.test(host)) host = ''; } catch { host = ''; }
    const source = channel(tag, host);
    if (!ck(req, 'en_src')) res.cookie('en_src', source, opts);
    req.trackSource = source;
    const landing = req.path.slice(0, 120), device = /mobile|android|iphone/i.test(ua) ? 'mobile' : 'desktop';
    res.on('finish', () => { if (res.statusCode < 400) q('insert into visits(vid,source,landing,device) values($1,$2,$3,$4)', [vid, source, landing, device]).catch(() => {}); });
  }
  if (tag) res.cookie('en_last', channel(tag), opts);
  next();
}

// Saved on the account at sign-up: first source, plus the latest tag if different.
export function sourceLabel(req) {
  const first = req.trackSource || ck(req, 'en_src') || 'direct', last = ck(req, 'en_last');
  return [first, last && last !== first ? `last: ${last}` : ''].filter(Boolean).join(' · ').slice(0, 160);
}

// Visitors and sign-up progress by source over the last N days.
export async function report(days = 30) {
  return all(`
    with v as (select source, count(*) visitors from visits where created > now() - make_interval(days => $1) group by source),
         u as (select split_part(coalesce(nullif(source,''),'unknown'),' · ',1) source, count(*) signups,
                 count(*) filter (where type='person' or type='broker') profiles,
                 count(*) filter (where exists(select 1 from profiles p where (p.owner=users.phone or p.broker=users.phone) and p.status='verified')) verified
               from users where created > now() - make_interval(days => $1) and pw is not null and type is distinct from 'admin' group by 1)
    select coalesce(v.source,u.source) source, coalesce(visitors,0)::int visitors, coalesce(signups,0)::int signups, coalesce(profiles,0)::int profiles, coalesce(verified,0)::int verified
    from v full join u on u.source = v.source order by visitors desc, signups desc limit 40`, [days]);
}
