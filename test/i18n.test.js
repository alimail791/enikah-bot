// Every message the site can show must have a Tamil translation. Run from the repo root.
import fs from 'fs';
import { hasTamil, makeT } from '../src/i18n.js';
const s = fs.readFileSync('src/site.js','utf8'), c = fs.readFileSync('src/core.js','utf8');
const lits = new Set();
const grab = (re, src, g=2) => { for (const m of src.matchAll(re)) lits.add(m[g].replace(/\\'/g, "'")); };
grab(/\bt\(\s*(['"])((?:\\.|(?!\1).)*)\1/g, s);
grab(/t\([\w.!= '"]+\? (['"])((?:\\.|(?!\1).)*)\1 : /g, s);
grab(/t\([\w.!= '"]+\? (?:['"](?:\\.|[^'"])*['"]) : (['"])((?:\\.|(?!\1).)*)\1\)/g, s);
grab(/go\(res, [^,]+, (['"])((?:\\.|(?!\1).)*)\1\)/g, s);
grab(/submit: (['"])((?:\\.|(?!\1).)*)\1/g, s);
grab(/(?:err|msg): (['"])((?:\\.|(?!\1).)*)\1/g, c);
grab(/return (['"])((?:\\.|(?!\1).)*)\1;/g, c);
grab(/: (['"])([A-Z][^'"]{8,}\.)\1/g, s);
// template strings with ${} in core/site go messages: build samples
const samples = ["Registered! Profile ENK1001 is free for 30 days. Next: upload your ID and photo to get verified.","Candidate ENK1007 added. Upload their ID and photo to verify.","Age must be 21–70. Legal marriage age in India is 18 for brides and 21 for grooms.","Your plan ended on 24 Dec 2026. Your profile is hidden from search. Renew ₹2,000 for 30 days to see matches again.","You have received all 5 profiles for this month (plan till 24 Dec 2026). Renew to get 5 more.","2 new verified matches added. This month: 2 of 5.","1 new verified match added. This month: 1 of 5.","Interest sent to ENK1002. You will be notified when they reply.","New interest for ENK1002 from ENK1001 (ENK1001 · Bride, 22, Chennai · Sunni Hanafi · B.Sc · Teacher · Never married). Accept to share contact details.","New interest for ENK1008 (Sana) from ENK1001 (ENK1001 · Bride, 22, Chennai · x). Accept to share contact details.","ENK1002 has declined the interest from ENK1001. Keep making du'a — more matches will come.","ENK1002 accepted the interest from ENK1001! Contact: Imran, +919222222221. Please involve family / wali.","ENK1002 is verified! You can now see verified matching profiles.","Verification of ENK1002 was not approved. Please upload a clear ID and photo again.","Payment received: ₹2,000. Your plan is active till 24 Dec 2026. You get 5 new matching profiles this month.","Payment received: ₹1,000. Your plan is active till 24 Dec 2026. All your candidates are visible again.","Reminder: your ENikah plan ends on 24 Dec 2026. Renew ₹2,000 to stay visible.","Your plan has ended. Profile ENK1002 is now hidden from search. Renew ₹2,000 to show it again.","Reminder: your broker plan ends on 24 Dec 2026. Renew ₹1,000 to keep your candidates visible.","Your broker plan has ended. All your candidates are hidden. Renew ₹1,000 to show them again.","New verification request: ENK1001 Ayesha — x","Report on ENK1006 from +919111111111: fake","Payment ₹2,000 received from Ayesha (person).","ENK1001 approved.","Broker +919333333333 approved.","ENK1006 blocked — hidden from everyone.","Added 30 days for ENK1001 (cash ₹2,000).","Your broker plan has expired. Renew ₹1,000 to add candidates.","You have reached the limit of 10 candidates per broker plan."];
const skip = new Set(['', '/home', 'status:', 'interest:']);
const miss = [...lits, ...samples].filter(x => !skip.has(x) && !x.startsWith('/') && !hasTamil(x));
console.log('checked', lits.size + samples.length, 'missing', miss.length); miss.forEach(m => console.log(' -', m));
if (miss.length) process.exit(1);
