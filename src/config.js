const E = process.env;

export const CFG = {
  person: Number(E.PRICE_PERSON || 2000),   // ₹ per 30 days, bride/groom
  broker: Number(E.PRICE_BROKER || 1000),   // ₹ per 30 days, broker
  monthly: Number(E.MONTHLY_LIMIT || 5),    // matching profiles per plan month
  free: Number(E.FREE_DAYS || 90),          // free days after registration
  cap: Number(E.BROKER_CAP || 10),          // candidates per broker
  base: (E.BASE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  lang: E.TEMPLATE_LANG || 'en',
};

export const ADMINS = (E.ADMIN_PHONES || '').split(',').map(s => s.replace(/\D/g, '')).filter(Boolean);
export const isAdmin = ph => ADMINS.includes(ph);

export const rs = n => '₹' + Number(n).toLocaleString('en-IN');
export const D = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '-';
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const side = p => p.g === 'F' ? 'Bride' : 'Groom';
export const card = p => `${p.code} · ${side(p)}, ${p.age}, ${p.city}\n${p.maslak} · ${p.edu} · ${p.job} · ${p.marital}`;
