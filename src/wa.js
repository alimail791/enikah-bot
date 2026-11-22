// WhatsApp Cloud API sender. With DRY_RUN=1 (or no token) messages go to `outbox` instead.
import { CFG } from './config.js';

const E = process.env;
export const outbox = [];
const cut = (s, n) => (s = String(s)).length > n ? s.slice(0, n - 1) + '…' : s;

async function call(to, body) {
  if (E.DRY_RUN === '1' || !E.WA_TOKEN) { outbox.push({ to, ...body }); return; }
  const r = await fetch(`https://graph.facebook.com/${E.WA_API_VERSION || 'v21.0'}/${E.WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${E.WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, ...body }),
  });
  if (!r.ok) console.error('[wa] send failed', r.status, await r.text());
}

// btns: [[id, label], ...]  link: {label, url}
export async function sendMsg(to, text, btns = [], link) {
  if (link) {
    await call(to, { type: 'interactive', interactive: { type: 'cta_url', body: { text: cut(text, 1024) },
      action: { name: 'cta_url', parameters: { display_text: cut(link.label, 20), url: link.url } } } });
    if (!btns.length) return;
    text = 'Choose an option for the message above:';
  }
  if (!btns.length) return call(to, { type: 'text', text: { body: cut(text, 4096), preview_url: false } });
  if (btns.length <= 3 && btns.every(b => b[1].length <= 20))
    return call(to, { type: 'interactive', interactive: { type: 'button', body: { text: cut(text, 1024) },
      action: { buttons: btns.map(([id, t]) => ({ type: 'reply', reply: { id, title: t } })) } } });
  return call(to, { type: 'interactive', interactive: { type: 'list', body: { text: cut(text, 1024) },
    action: { button: 'Options', sections: [{ title: 'Choose', rows: btns.slice(0, 10).map(([id, t]) => ({ id, title: cut(t, 24) })) }] } } });
}

// Approved template, for messages outside the 24-hour window.
export function sendTemplate(to, name, params = []) {
  return call(to, { type: 'template', template: { name, language: { code: CFG.lang },
    components: params.length ? [{ type: 'body', parameters: params.map(p => ({ type: 'text', text: String(p).replace(/\s*\n\s*/g, ' ').slice(0, 200) })) }] : [] } });
}
