// Secure web pages linked from WhatsApp: verification upload, matches, admin document view, payment result.
import multer from 'multer';
import { q, one, all, getP, P_SQL, visible } from './db.js';
import { CFG, esc, side, D } from './config.js';
import { submitted, sendInterest, onPaid } from './bot.js';
import { markPaid, callbackOk } from './pay.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, f, cb) => cb(null, /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/.test(f.mimetype)) });

const CSS = `:root{color-scheme:light dark;--bg:light-dark(#f6f1e7,#0f1714);--ink:light-dark(#1d2421,#e9efe9);--mut:light-dark(#5d6762,#9aa7a0);--card:light-dark(#fff,#18221e);--line:light-dark(#e3dccd,#2a3832);--em:#0b4d3c}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
header{background:var(--em);color:#f3dfa8;padding:16px 20px;display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px}header b{font:28px Georgia,serif}header span{color:#cfe8dc;font-size:13px}
main{max-width:900px;margin:0 auto;padding:20px 16px 40px}h1{font:400 28px/1.15 Georgia,serif;margin:0 0 8px;color:light-dark(#0b4d3c,#6fd0ac)}
.note{color:var(--mut);font-size:14px}.box{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin:12px 0}
form.fl{display:flex;flex-direction:column;gap:14px;max-width:460px}label{display:flex;flex-direction:column;gap:6px;font-weight:600}
input[type=file]{font-size:15px}button{font:inherit;font-weight:600;min-height:46px;border-radius:10px;border:0;background:var(--em);color:#fff;padding:8px 16px;cursor:pointer}button:disabled{background:var(--line);color:var(--mut)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}.pc{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:4px}
.pc .ph{height:90px;border-radius:10px;background:linear-gradient(135deg,#0b4d3c,#2c7a62 60%,#c9a24a);display:grid;place-items:center;color:#f6f1e7;font-size:13px;text-align:center}
.pc span{color:var(--mut);font-size:14px}.tag{font-size:12px;border:1px solid #c9a24a;border-radius:99px;padding:0 8px;width:max-content}
.msg{background:var(--em);color:#fff;border-radius:10px;padding:10px 14px;margin-bottom:14px}img.doc{max-width:100%;border-radius:10px;border:1px solid var(--line)}
footer{text-align:center;color:var(--mut);font-size:13px;padding:20px}`;

const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} · ENikah</title><style>${CSS}</style></head><body><header><b>ENikah</b><span>enikah.vasulbook.com</span></header><main>${body}</main><footer>Verified Muslim matrimony · Contacts shared only when both sides accept</footer></body></html>`;
const gone = res => res.status(410).send(page('Link expired', '<h1>This link has expired</h1><p>Go back to WhatsApp and type <b>menu</b> to get a new link.</p>'));
const token = (t, kind) => one(`select * from tokens where token=$1 and kind=$2 and expires>now()`, [t, kind]);

export function mount(app) {
  app.get('/', (req, res) => res.send(page('Muslim matrimony on WhatsApp', `<h1>ENikah — Muslim matrimony on WhatsApp</h1><p>Free registration with the first month free. Only verified, active profiles. Matched to both sides' choices. Contacts shared only when both accept.</p><p>Message us on WhatsApp and type <b>hi</b> to start.</p>${process.env.WA_DISPLAY_NUMBER ? `<p><a href="https://wa.me/${esc(process.env.WA_DISPLAY_NUMBER.replace(/\D/g, ''))}?text=hi">Open WhatsApp</a></p>` : ''}`)));

  // ---- verification upload ----
  app.get('/v/:t', async (req, res) => {
    const tk = await token(req.params.t, 'ver'); if (!tk) return gone(res);
    const st = await verStatus(tk);
    if (st !== 'unverified') return res.send(page('Verification', `<h1>Verification</h1><p>Status: <b>${esc(st)}</b>. ${st === 'pending' ? 'The admin will check your documents soon.' : ''}</p>`));
    res.send(page('Verify your profile', `<h1>Verify ${tk.ref === 'b' ? 'your broker account' : 'profile ENK' + esc(tk.ref)}</h1>
      <p class="note">Only verified members can see profiles and be seen. Your ID image is deleted after the admin checks it; we keep only a "verified" mark.</p>
      <form class="fl box" method="post" enctype="multipart/form-data">
        <label>ID proof (Aadhaar, passport, voter ID or licence) — photo or PDF<input type="file" name="id_doc" accept="image/*,application/pdf" required></label>
        ${tk.ref === 'b' ? '' : '<label>Recent photo of the bride / groom<input type="file" name="photo" accept="image/*" required></label>'}
        <button>Submit for verification</button>
        <p class="note">Max 6 MB per file. Please cover the ID number if you like; we only check name, photo and age.</p>
      </form>`));
  });
  app.post('/v/:t', upload.fields([{ name: 'id_doc', maxCount: 1 }, { name: 'photo', maxCount: 1 }]), async (req, res) => {
    const tk = await token(req.params.t, 'ver'); if (!tk) return gone(res);
    if (await verStatus(tk) !== 'unverified') return res.redirect(`/v/${req.params.t}`);
    const idf = req.files?.id_doc?.[0], ph = req.files?.photo?.[0];
    if (!idf || (tk.ref !== 'b' && !ph)) return res.status(400).send(page('Missing file', '<h1>Please attach the required files</h1><p>Use an image (JPG/PNG) or PDF under 6 MB. <a href="">Try again</a>.</p>'));
    const d = await one(`insert into docs(kind,ref,phone,id_doc,id_mime,photo,photo_mime) values($1,$2,$3,$4,$5,$6,$7) returning id`,
      [tk.ref === 'b' ? 'b' : 'p', tk.ref === 'b' ? tk.phone : tk.ref, tk.phone, idf.buffer, idf.mimetype, ph?.buffer || null, ph?.mimetype || null]);
    await submitted(tk.phone, tk.ref, d.id);
    res.send(page('Submitted', '<h1>Submitted</h1><p>Thank you. The admin will verify within 24 hours and you will get a WhatsApp message.</p>'));
  });

  // ---- admin document view ----
  app.get('/a/d/:t', async (req, res) => {
    const tk = await token(req.params.t, 'doc'); if (!tk) return gone(res);
    const d = await one('select id,kind,ref,phone,id_mime,photo_mime,created from docs where id=$1', [+tk.ref]);
    if (!d) return res.send(page('Documents', '<h1>Already handled</h1><p>Documents are deleted after approval or rejection.</p>'));
    const p = d.kind === 'p' ? await getP(+d.ref) : null;
    const show = (part, mime) => mime === 'application/pdf' ? `<p><a href="/a/d/${req.params.t}/${part}">Open PDF</a></p>` : `<img class="doc" src="/a/d/${req.params.t}/${part}" alt="${part}">`;
    res.send(page('Documents', `<h1>${d.kind === 'b' ? 'Broker +' + esc(d.ref) : esc(p?.code) + ' · ' + esc(p?.name)}</h1>
      ${p ? `<p>${side(p)}, ${p.age}, ${esc(p.city)} · ${esc(p.maslak)} · ${esc(p.edu)} · ${esc(p.job)} · ${esc(p.marital)}</p>` : ''}
      <p class="note">Check that the name, age and photo match. Then tap Approve or Reject in WhatsApp.</p>
      <div class="box"><h2>ID proof</h2>${show('id', d.id_mime)}</div>${d.photo_mime ? `<div class="box"><h2>Photo</h2>${show('photo', d.photo_mime)}</div>` : ''}`));
  });
  app.get('/a/d/:t/:part(id|photo)', async (req, res) => {
    const tk = await token(req.params.t, 'doc'); if (!tk) return gone(res);
    const d = await one('select * from docs where id=$1', [+tk.ref]);
    const buf = req.params.part === 'id' ? d?.id_doc : d?.photo, mime = req.params.part === 'id' ? d?.id_mime : d?.photo_mime;
    if (!buf) return res.sendStatus(404);
    res.set({ 'Content-Type': mime, 'Cache-Control': 'no-store' }).send(buf);
  });

  // ---- matches ----
  app.get('/m/:t', async (req, res) => {
    const tk = await token(req.params.t, 'm'); if (!tk) return gone(res);
    const me = await getP(+tk.ref);
    const list = await all(P_SQL + ' where p.id = any($1) order by array_position($1, p.id)', [tk.data.ids]);
    const sent = new Set((await all('select to_id from interests where from_id=$1', [me.id])).map(r => r.to_id));
    const msg = req.query.msg ? `<div class="msg">${esc(req.query.msg)}</div>` : '';
    res.send(page('Your matches', `${msg}<h1>Matches for ${esc(me.code)}</h1><p class="note">Verified, active profiles that fit your choice and theirs. Name and photo stay hidden until both sides accept. Link valid till ${D(tk.expires)}.</p>
      <div class="cards">${list.map(v => { const ok = visible(v), s = sent.has(v.id);
        return `<div class="pc"><div class="ph">Photo shown after both accept</div><b>${esc(v.code)} · ${side(v)}, ${v.age}</b><span>${esc(v.city)} · ${esc(v.maslak)}</span><span>${esc(v.edu)} · ${esc(v.job)}</span><span>${esc(v.marital)}</span><span class="tag">${v.broker ? 'Via verified broker' : 'Verified'}</span>
        <form method="post" action="/m/${req.params.t}/i/${v.id}"><button ${ok && !s ? '' : 'disabled'}>${!ok ? 'No longer available' : s ? 'Interest sent' : 'Send interest'}</button></form></div>`; }).join('')}</div>
      <p class="note">To report a profile, send <b>report ENK1234 reason</b> on WhatsApp.</p>`));
  });
  app.post('/m/:t/i/:sid', async (req, res) => {
    const tk = await token(req.params.t, 'm'); if (!tk) return gone(res);
    const sid = +req.params.sid;
    const msg = tk.data.ids.includes(sid) ? await sendInterest(tk.phone, +tk.ref, sid) : 'Not allowed.';
    res.redirect(303, `/m/${req.params.t}?msg=${encodeURIComponent(msg)}`);
  });

  // ---- payment result (Razorpay callback) ----
  app.get('/paid', async (req, res) => {
    if (callbackOk(req.query) && req.query.razorpay_payment_link_status === 'paid') {
      const p = await markPaid(req.query.razorpay_payment_link_id); if (p) await onPaid(p);
    }
    const ok = req.query.razorpay_payment_link_status === 'paid';
    res.send(page('Payment', ok ? '<h1>Payment received</h1><p>JazakAllah khair. Your plan is extended — check WhatsApp for the confirmation.</p>' : '<h1>Payment not completed</h1><p>Go back to WhatsApp and type <b>renew</b> to try again.</p>'));
  });
}

async function verStatus(tk) {
  if (tk.ref === 'b') return (await one('select status from users where phone=$1', [tk.phone]))?.status;
  const p = await getP(+tk.ref);
  return p && (p.owner === tk.phone || p.broker === tk.phone) ? p.status : 'not found';
}
