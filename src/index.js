import express from 'express';
import { migrate } from './db.js';
import { mount } from './site.js';
import { pingIndexNow } from './seo.js';
import { onPaid, runReminders } from './core.js';
import { runFollowups } from './followup.js';
import { waReady } from './wa.js';
import { markPaid, webhookOk } from './pay.js';

const E = process.env;
const app = express();
app.set('trust proxy', true);
app.disable('x-powered-by');
app.use((req, res, next) => { res.set({ 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' }); next(); });
app.use(express.json({ limit: '1mb', verify: (req, res, buf) => { req.raw = buf; } }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

app.get('/health', (req, res) => res.json({ ok: true }));

// Razorpay webhook (event: payment_link.paid)
app.post('/rzp/webhook', async (req, res) => {
  if (!webhookOk(req.raw, req.get('x-razorpay-signature'))) return res.sendStatus(400);
  res.sendStatus(200);
  if (req.body.event === 'payment_link.paid') {
    const p = await markPaid(req.body.payload.payment_link.entity.id);
    if (p) await onPaid(p).catch(e => console.error('[pay]', e));
  }
});

// Testing helpers, only with DEV_MODE=1
if (E.DEV_MODE === '1') {
  app.get('/dev/pay/:id', async (req, res) => { const p = await markPaid(req.params.id); if (p) await onPaid(p); res.redirect(303, '/home?msg=' + encodeURIComponent(p ? 'Paid (dev).' : 'Already paid.')); });
  app.post('/dev/reminders', async (req, res) => { await runReminders(); res.json({ ok: true }); });
  app.post('/dev/followups', async (req, res) => { await runFollowups(); res.json({ ok: true }); });
  app.get('/dev/wa', async (req, res) => { const { outbox } = await import('./wa.js'); res.json(outbox.splice(0)); });
  app.get('/dev/mail', async (req, res) => { const { sentMail } = await import('./mail.js'); res.json(sentMail.splice(0)); });
}

mount(app);

app.use((req, res) => res.status(404).send('<!doctype html><meta name="viewport" content="width=device-width"><p style="font:18px system-ui;padding:24px">Page not found. <a href="/">ENikah home</a></p>'));
app.use((err, req, res, next) => {
  console.error('[web]', err);
  const tooBig = err?.code === 'LIMIT_FILE_SIZE';
  res.status(tooBig ? 413 : 500).send(`<!doctype html><meta name="viewport" content="width=device-width"><p style="font:18px system-ui;padding:24px">${tooBig ? 'That file is larger than 6 MB. Please choose a smaller one.' : 'Something went wrong. Please try again.'} <a href="/home">Back</a></p>`);
});

await migrate();
const port = Number(E.PORT || 3000);
app.listen(port, () => { console.log(`ENikah site on :${port}`); if (E.DEV_MODE !== '1') setTimeout(pingIndexNow, 15000); });
// Check WhatsApp at start so the logs show which number ENikah will send from.
waReady().then(ok => console.log(ok ? '[wa] ready' : '[wa] not sending'));
setInterval(() => runReminders().catch(e => console.error('[cron]', e)), 60 * 60 * 1000);
setTimeout(() => runReminders().catch(e => console.error('[cron]', e)), 60 * 1000);
setInterval(() => runFollowups().catch(e => console.error('[followup]', e)), 30 * 60 * 1000);
setTimeout(() => runFollowups().catch(e => console.error('[followup]', e)), 2 * 60 * 1000);
