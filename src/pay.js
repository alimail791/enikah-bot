// Razorpay payment links. Without keys (dev), links point to /dev/pay/<id> which marks them paid.
import crypto from 'crypto';
import { q, one } from './db.js';
import { CFG } from './config.js';

const E = process.env;
const auth = () => 'Basic ' + Buffer.from(`${E.RAZORPAY_KEY_ID}:${E.RAZORPAY_KEY_SECRET}`).toString('base64');

export async function createLink(phone, kind, amount) {
  const row = await one('insert into payments(phone,kind,amount) values($1,$2,$3) returning id', [phone, kind, amount]);
  if (!E.RAZORPAY_KEY_ID) {
    const id = 'dev_' + row.id;
    await q('update payments set link_id=$1 where id=$2', [id, row.id]);
    return `${CFG.base}/dev/pay/${id}`;
  }
  const r = await fetch('https://api.razorpay.com/v1/payment_links', {
    method: 'POST',
    headers: { Authorization: auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amount * 100, currency: 'INR',
      description: `ENikah ${kind === 'broker' ? 'broker' : 'member'} plan - 30 days`,
      reference_id: 'ENK-PAY-' + row.id,
      customer: { contact: '+' + phone },
      notify: { sms: false, email: false }, reminder_enable: false,
      notes: { phone, kind },
      expire_by: Math.floor(Date.now() / 1000) + 3 * 86400,
      callback_url: `${CFG.base}/paid`, callback_method: 'get',
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('Razorpay: ' + JSON.stringify(j));
  await q('update payments set link_id=$1 where id=$2', [j.id, row.id]);
  return j.short_url;
}

// Idempotent: returns the payment row only the first time it is marked paid.
export const markPaid = linkId => one(`update payments set status='paid', paid_at=now() where link_id=$1 and status<>'paid' returning *`, [linkId]);

export function webhookOk(raw, sig) {
  if (!E.RAZORPAY_WEBHOOK_SECRET || !sig) return false;
  const h = crypto.createHmac('sha256', E.RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex');
  return h.length === sig.length && crypto.timingSafeEqual(Buffer.from(h), Buffer.from(sig));
}

// Signature Razorpay adds to the callback URL after payment.
export function callbackOk(qs) {
  if (!E.RAZORPAY_KEY_SECRET || !qs.razorpay_signature) return false;
  const payload = [qs.razorpay_payment_link_id, qs.razorpay_payment_link_reference_id, qs.razorpay_payment_link_status, qs.razorpay_payment_id].join('|');
  const h = crypto.createHmac('sha256', E.RAZORPAY_KEY_SECRET).update(payload).digest('hex');
  return h.length === qs.razorpay_signature.length && crypto.timingSafeEqual(Buffer.from(h), Buffer.from(qs.razorpay_signature));
}
