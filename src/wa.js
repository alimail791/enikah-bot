// WhatsApp messages from ENikah's number (approved templates only), through the WhatsApp Cloud API.
// Safety: messages are sent only after checking that WA_PHONE_ID really is the number in WA_NUMBER,
// so ENikah can never send from the EMart or EDeal number by mistake.
const E = process.env;
export const outbox = [];
let ready = null; // null = not checked yet

const digits = s => String(s || '').replace(/\D/g, '');
const api = path => `https://graph.facebook.com/${E.WA_API_VERSION || 'v21.0'}/${path}`;

export async function waReady() {
  if (E.WA_SEND !== '1' || !E.WA_TOKEN || !E.WA_PHONE_ID || !E.WA_NUMBER) return false;
  if (E.DRY_RUN === '1') return true;
  if (ready !== null) return ready;
  try {
    const r = await fetch(api(`${E.WA_PHONE_ID}?fields=display_phone_number`), { headers: { Authorization: `Bearer ${E.WA_TOKEN}` } });
    const j = await r.json();
    ready = digits(j.display_phone_number).endsWith(digits(E.WA_NUMBER).slice(-10));
    console.log(ready ? `[wa] sending from ${j.display_phone_number}` : `[wa] OFF: WA_PHONE_ID is ${j.display_phone_number || JSON.stringify(j.error || j)}, not ${E.WA_NUMBER}`);
  } catch (e) { console.error('[wa] check failed', e.message); return false; }
  return ready;
}

async function post(body) {
  if (E.DRY_RUN === '1') { outbox.push(body); return true; }
  const r = await fetch(api(`${E.WA_PHONE_ID}/messages`), { method: 'POST',
    headers: { Authorization: `Bearer ${E.WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', ...body }) });
  if (!r.ok) { console.error('[wa] send failed', r.status, await r.text()); return false; }
  return true;
}

// A utility template (enikah_interest, enikah_paid, …) in the member's language.
export async function sendTemplate(to, name, params = [], lang = 'en') {
  if (!(await waReady())) return false;
  return post({ to: digits(to), type: 'template', template: { name, language: { code: lang === 'ta' ? 'ta' : 'en' },
    components: params.length ? [{ type: 'body', parameters: params.map(p => ({ type: 'text', text: String(p).replace(/\s*\n\s*/g, ' ').slice(0, 200) })) }] : [] } });
}

// An authentication template carrying a one-time code (with the usual "copy code" button).
export async function sendCode(to, code) {
  if (!(await waReady()) || !E.PHONE_OTP_TEMPLATE) return false;
  return post({ to: digits(to), type: 'template', template: { name: E.PHONE_OTP_TEMPLATE, language: { code: E.PHONE_OTP_LANG || 'en' },
    components: [{ type: 'body', parameters: [{ type: 'text', text: code }] }, { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] }] } });
}
