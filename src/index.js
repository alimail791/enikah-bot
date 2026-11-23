import express from 'express';
import crypto from 'crypto';
import { migrate } from './db.js';
import { onMessage, onPaid, runReminders } from './bot.js';
import { mount } from './web.js';
import { markPaid, webhookOk } from './pay.js';
import { outbox } from './wa.js';

const E = process.env;
const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '1mb', verify: (req, res, buf) => { req.raw = buf; } }));
app.use(express.urlencoded({ extended: false }));

// One message at a time per phone, so sessions never race.
const chains = new Map();
const enqueue = (ph, fn) => {
  const p = (chains.get(ph) || Promise.resolve()).then(fn).catch(e => console.error('[bot]', e));
  chains.set(ph, p); p.finally(() => { if (chains.get(ph) === p) chains.delete(ph); });
  return p;
};
const seenIds = new Set();

function parse(m) {
  if (m.type === 'text') return { text: m.text.body };
  if (m.type === 'interactive') { const r = m.interactive.button_reply || m.interactive.list_reply; return { id: r.id, text: r.title }; }
  if (m.type === 'button') return { text: m.button.text };
  return { other: m.type };
}

// ---- WhatsApp webhook ----
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === E.WA_VERIFY_TOKEN) return res.send(req.query['hub.challenge']);
  res.sendStatus(403);
});
app.post('/webhook', (req, res) => {
  if (E.WA_APP_SECRET) {
    const sig = req.get('x-hub-signature-256') || '';
    const h = 'sha256=' + crypto.createHmac('sha256', E.WA_APP_SECRET).update(req.raw || '').digest('hex');
    if (sig.length !== h.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(h))) return res.sendStatus(401);
  }
  res.sendStatus(200);
  for (const en of req.body.entry || []) for (const ch of en.changes || []) for (const m of ch.value?.messages || []) {
    // several numbers can share one Meta app: only answer messages sent to ENikah's own number
    if (E.WA_PHONE_ID && ch.value.metadata?.phone_number_id !== E.WA_PHONE_ID) continue;
    if (seenIds.has(m.id)) continue;
    seenIds.add(m.id); if (seenIds.size > 5000) seenIds.clear();
    enqueue(m.from, () => onMessage(m.from, parse(m)));
  }
});

// ---- Razorpay webhook (event: payment_link.paid) ----
app.post('/rzp/webhook', async (req, res) => {
  if (!webhookOk(req.raw, req.get('x-razorpay-signature'))) return res.sendStatus(400);
  res.sendStatus(200);
  if (req.body.event === 'payment_link.paid') {
    const p = await markPaid(req.body.payload.payment_link.entity.id);
    if (p) await onPaid(p).catch(e => console.error('[pay]', e));
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

// ---- dev/testing helpers (only with DEV_MODE=1) ----
if (E.DEV_MODE === '1') {
  app.post('/dev/msg', async (req, res) => {
    const { from, text, id } = req.body;
    await enqueue(from, () => onMessage(from, { text, id }));
    res.json(outbox.splice(0));
  });
  app.get('/dev/pay/:id', async (req, res) => {
    const p = await markPaid(req.params.id); if (p) await onPaid(p);
    res.send(p ? 'Paid (dev). Go back to WhatsApp.' : 'Already paid or unknown link.');
  });
  app.post('/dev/reminders', async (req, res) => { await runReminders(); res.json(outbox.splice(0)); });
  app.get('/dev/outbox', (req, res) => res.json(outbox.splice(0)));
}

mount(app);

await migrate();
const port = Number(E.PORT || 3000);
app.listen(port, () => console.log(`ENikah bot on :${port}`));
setInterval(() => runReminders().catch(e => console.error('[cron]', e)), 60 * 60 * 1000);
setTimeout(() => runReminders().catch(e => console.error('[cron]', e)), 60 * 1000);
