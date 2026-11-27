// Email via Resend. Without RESEND_API_KEY, emails are only logged.
const E = process.env;
export const sentMail = [];

export async function sendMail(to, subject, text) {
  if (!to) return;
  if (!E.RESEND_API_KEY) { sentMail.push({ to, subject, text }); console.log('[mail]', to, subject); return; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${E.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: E.MAIL_FROM || E.EMAIL_FROM || 'ENikah <noreply@vasulbook.com>', to: [to], subject, text }),
  });
  if (!r.ok) console.error('[mail] failed', r.status, await r.text());
}
