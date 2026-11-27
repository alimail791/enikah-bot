// Search engine support for the public pages: English at /…, Tamil at /ta/…
// Canonical + hreflang, Open Graph, JSON-LD, robots.txt, sitemap.xml, a share image,
// and the content pages (landing pages for what families actually search for).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CFG, esc, rs } from './config.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OG = fs.readFileSync(path.join(DIR, 'og.png'));
const UPDATED = '2026-11-24';

// Public URL for a page in a language. p is the English path ("/", "/terms").
export const urlFor = (lang, p) => lang === 'ta' ? (p === '/' ? '/ta' : '/ta' + p) : p;
// English path for any public URL ("/ta/terms" -> "/terms").
export const enPath = p => p === '/ta' || p === '/ta/' ? '/' : p.startsWith('/ta/') ? p.slice(3) : p;

const n = () => ({ person: rs(CFG.person), broker: rs(CFG.broker), monthly: CFG.monthly, cap: CFG.cap });
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => k in v ? v[k] : m);

// <head> extras for an indexable public page.
export function headTags(req, { path: p, title, desc, jsonld = [] }) {
  const base = CFG.base, lang = req.lang;
  const self = base + urlFor(lang, p);
  const alts = ['en', 'ta'].map(l => `<link rel="alternate" hreflang="${l}" href="${base}${urlFor(l, p)}">`).join('')
    + `<link rel="alternate" hreflang="x-default" href="${base}${p}">`;
  const gsv = process.env.GOOGLE_SITE_VERIFICATION ? `<meta name="google-site-verification" content="${esc(process.env.GOOGLE_SITE_VERIFICATION)}">` : '';
  return `${gsv}<meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${self}">${alts}
<meta property="og:type" content="website"><meta property="og:site_name" content="ENikah"><meta property="og:locale" content="${lang === 'ta' ? 'ta_IN' : 'en_IN'}">
<meta property="og:url" content="${self}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${base}/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#0b4d3c">
${jsonld.length ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}`;
}

const faqLd = (lang, qa) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: lang,
  mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const faqHtml = (title, qa) => `<h2>${esc(title)}</h2>${qa.map(([q, a]) => `<details class="box faq"><summary><h3>${esc(q)}</h3></summary><p>${esc(a)}</p></details>`).join('')}`;

// ---------- home page extras ----------
const HOME = {
  en: {
    title: 'ENikah: Verified Muslim Matrimony for Tamil Nadu Families',
    desc: 'Free Muslim matrimony registration with the first 3 months free. ID-verified brides and grooms, two-way maslak and age matching, contacts shared only when both families accept. English & Tamil.',
    whyH: 'Why families choose ENikah',
    why: [
      ['Every profile is ID-verified', 'Our admin checks an ID and a photo before a profile is shown. The ID is deleted after checking.'],
      ['Privacy first', 'Names, phone numbers and photos stay hidden. They are shared only when both sides accept an interest.'],
      ['Two-way matching', 'You see a profile only if it fits your age and maslak choice and you fit theirs. No endless scrolling.'],
      ['Family and wali involved', 'ENikah is built for families. Register for a son, daughter, brother or sister, and talk with the wali present.'],
    ],
    forH: 'Find the right match', faqH: 'Questions families ask',
    faq: [
      ['Is registration free?', 'Yes. Registration is free and the first 3 months are free. After that it is {person} per 30 days for brides and grooms.'],
      ['Who can register?', 'Muslim brides aged 18 and above and grooms aged 21 and above who are seeking marriage. Parents or family members can register on their behalf with consent.'],
      ['How many matches will I get?', 'Up to {monthly} verified matching profiles every month, matched both ways on age and maslak, from your own city first.'],
      ['When are contact details shared?', 'Only when both sides accept an interest. Until then your name, number and photo stay hidden.'],
      ['Is ENikah available in Tamil?', 'Yes. The whole site, messages and notifications are available in Tamil and English.'],
      ['Can marriage brokers use ENikah?', 'Yes. Verified brokers can list up to {cap} candidates for {broker} per 30 days.'],
    ],
  },
  ta: {
    title: 'ENikah: தமிழ்நாட்டு குடும்பங்களுக்கான சரிபார்க்கப்பட்ட முஸ்லிம் திருமண சேவை',
    desc: 'இலவச முஸ்லிம் மேட்ரிமோனி பதிவு, முதல் 3 மாதங்கள் இலவசம். அடையாளம் சரிபார்க்கப்பட்ட மணமகள், மணமகன்; வயது, மஸ்லக் இரு தரப்புப் பொருத்தம்; இரு குடும்பமும் ஏற்ற பின்பே தொடர்பு விவரங்கள்.',
    whyH: 'குடும்பங்கள் ENikah-வைத் தேர்வு செய்வது ஏன்',
    why: [
      ['ஒவ்வொரு சுயவிவரமும் சரிபார்க்கப்படுகிறது', 'சுயவிவரம் காட்டப்படும் முன் எங்கள் நிர்வாகி அடையாள ஆவணத்தையும் புகைப்படத்தையும் சரிபார்க்கிறார். சரிபார்த்த பின் அடையாள ஆவணம் நீக்கப்படும்.'],
      ['தனியுரிமைக்கு முதலிடம்', 'பெயர், தொலைபேசி எண், புகைப்படம் மறைக்கப்பட்டிருக்கும். இரு தரப்பும் விருப்பத்தை ஏற்ற பின்பே பகிரப்படும்.'],
      ['இரு தரப்புப் பொருத்தம்', 'உங்கள் வயது, மஸ்லக் விருப்பத்துக்கு அவர்களும், அவர்களின் விருப்பத்துக்கு நீங்களும் பொருந்தினால் மட்டுமே வரன் காட்டப்படும்.'],
      ['குடும்பமும் வலீயும் உடன்', 'ENikah குடும்பங்களுக்காக உருவாக்கப்பட்டது. மகன், மகள், சகோதரன், சகோதரிக்காகப் பதிவு செய்யலாம்; வலீயுடன் பேசுங்கள்.'],
    ],
    forH: 'சரியான வரனைத் தேடுங்கள்', faqH: 'குடும்பங்கள் கேட்கும் கேள்விகள்',
    faq: [
      ['பதிவு இலவசமா?', 'ஆம். பதிவு இலவசம், முதல் 3 மாதங்களும் இலவசம். அதன் பின் மணமகள், மணமகனுக்கு 30 நாட்களுக்கு {person}.'],
      ['யார் பதிவு செய்யலாம்?', 'திருமணத்தை நாடும் 18 வயதுக்கு மேற்பட்ட முஸ்லிம் மணமகள்களும் 21 வயதுக்கு மேற்பட்ட மணமகன்களும். அவர்களின் சம்மதத்துடன் பெற்றோர் அல்லது குடும்பத்தினர் பதிவு செய்யலாம்.'],
      ['எத்தனை வரன்கள் கிடைக்கும்?', 'ஒவ்வொரு மாதமும் {monthly} வரை சரிபார்க்கப்பட்ட பொருத்தமான வரன்கள்; வயது, மஸ்லக் இரு தரப்புக்கும் பொருந்தும்; முதலில் உங்கள் ஊர்.'],
      ['தொடர்பு விவரங்கள் எப்போது பகிரப்படும்?', 'இரு தரப்பும் விருப்பத்தை ஏற்ற பின்பே. அதுவரை உங்கள் பெயர், எண், புகைப்படம் மறைக்கப்பட்டிருக்கும்.'],
      ['ENikah தமிழில் கிடைக்குமா?', 'ஆம். முழு இணையதளமும், செய்திகளும், அறிவிப்புகளும் தமிழிலும் ஆங்கிலத்திலும் கிடைக்கும்.'],
      ['திருமணத் தரகர்கள் பயன்படுத்தலாமா?', 'ஆம். சரிபார்க்கப்பட்ட தரகர்கள் 30 நாட்களுக்கு {broker} கட்டணத்தில் {cap} வரன்கள் வரை பதிவிடலாம்.'],
    ],
  },
};

// ---------- content pages ----------
const PAGES = [
  {
    path: '/tamil-muslim-matrimony',
    en: {
      short: 'Tamil Muslim matrimony',
      title: 'Tamil Muslim Matrimony: Verified Brides and Grooms in Tamil Nadu | ENikah',
      desc: 'Tamil Muslim matrimony for families in Chennai, Coimbatore, Madurai, Trichy, Tirunelveli and across Tamil Nadu. ID-verified profiles, site in Tamil, first 3 months free.',
      h1: 'Tamil Muslim matrimony for families',
      lede: 'ENikah is a matrimony service made for Tamil-speaking Muslim families. Every profile is verified, the whole site works in Tamil, and contacts are shared only when both families agree.',
      body: [
        ['Made for Tamil Nadu', 'Register from Chennai, Coimbatore, Madurai, Trichy, Tirunelveli, Vellore, Salem, Erode, Kayalpattinam, Nagore or any town. Matches from your own city are shown first, then from the rest of Tamil Nadu and beyond.'],
        ['In your language', 'Switch the whole site to Tamil with one tap. Registration, matches, interests and reminders all appear in Tamil, so elders in the family can read everything themselves.'],
        ['Verified, not just listed', 'Each bride and groom uploads an ID and a photo. Our admin checks them before the profile is shown. The ID is deleted after checking.'],
        ['Simple and fair price', 'Registration and the first 3 months are free. After that it is {person} per 30 days. Profiles that are not renewed are hidden, so you only see families who are actively searching.'],
      ],
      faq: [
        ['Can I register for my son or daughter?', 'Yes. Most profiles are registered by a parent or family member, with the consent of the bride or groom.'],
        ['Do you have profiles outside Tamil Nadu?', 'Anyone can register from anywhere. Matches from your own city appear first.'],
      ],
    },
    ta: {
      short: 'தமிழ் முஸ்லிம் மேட்ரிமோனி',
      title: 'தமிழ் முஸ்லிம் மேட்ரிமோனி: தமிழ்நாட்டில் சரிபார்க்கப்பட்ட மணமகள், மணமகன் | ENikah',
      desc: 'சென்னை, கோவை, மதுரை, திருச்சி, திருநெல்வேலி மற்றும் தமிழ்நாடு முழுவதும் உள்ள குடும்பங்களுக்கான தமிழ் முஸ்லிம் மேட்ரிமோனி. சரிபார்க்கப்பட்ட சுயவிவரங்கள், தமிழில் இணையதளம், முதல் 3 மாதங்கள் இலவசம்.',
      h1: 'குடும்பங்களுக்கான தமிழ் முஸ்லிம் மேட்ரிமோனி',
      lede: 'ENikah தமிழ் பேசும் முஸ்லிம் குடும்பங்களுக்காக உருவாக்கப்பட்ட திருமண சேவை. ஒவ்வொரு சுயவிவரமும் சரிபார்க்கப்படுகிறது, முழு இணையதளமும் தமிழில் இயங்குகிறது, இரு குடும்பமும் ஒப்புக்கொண்ட பின்பே தொடர்பு விவரங்கள் பகிரப்படும்.',
      body: [
        ['தமிழ்நாட்டுக்காக', 'சென்னை, கோவை, மதுரை, திருச்சி, திருநெல்வேலி, வேலூர், சேலம், ஈரோடு, காயல்பட்டினம், நாகூர் அல்லது எந்த ஊரிலிருந்தும் பதிவு செய்யலாம். முதலில் உங்கள் ஊர் வரன்கள், பின் தமிழ்நாட்டின் மற்ற பகுதிகள் மற்றும் வெளியூர் வரன்கள் காட்டப்படும்.'],
        ['உங்கள் மொழியில்', 'ஒரே தொடுதலில் முழு இணையதளத்தையும் தமிழுக்கு மாற்றலாம். பதிவு, வரன்கள், விருப்பங்கள், நினைவூட்டல்கள் அனைத்தும் தமிழில் வரும்; குடும்பப் பெரியவர்களே படிக்கலாம்.'],
        ['பட்டியல் மட்டுமல்ல, சரிபார்ப்பு', 'ஒவ்வொரு மணமகளும் மணமகனும் அடையாள ஆவணமும் புகைப்படமும் பதிவேற்றுகிறார்கள். சுயவிவரம் காட்டப்படும் முன் எங்கள் நிர்வாகி சரிபார்க்கிறார். சரிபார்த்த பின் அடையாள ஆவணம் நீக்கப்படும்.'],
        ['எளிய, நியாயமான கட்டணம்', 'பதிவும் முதல் 3 மாதங்களும் இலவசம். அதன் பின் 30 நாட்களுக்கு {person}. புதுப்பிக்கப்படாத சுயவிவரங்கள் மறைக்கப்படும்; எனவே தீவிரமாகத் தேடும் குடும்பங்களை மட்டுமே காண்பீர்கள்.'],
      ],
      faq: [
        ['என் மகன் அல்லது மகளுக்காகப் பதிவு செய்யலாமா?', 'ஆம். பெரும்பாலான சுயவிவரங்கள் மணமகள் அல்லது மணமகனின் சம்மதத்துடன் பெற்றோர் அல்லது குடும்பத்தினரால் பதிவு செய்யப்படுகின்றன.'],
        ['தமிழ்நாட்டுக்கு வெளியே உள்ளவர்கள் பதிவு செய்யலாமா?', 'எங்கிருந்தும் யாரும் பதிவு செய்யலாம். உங்கள் ஊர் வரன்கள் முதலில் காட்டப்படும்.'],
      ],
    },
  },
  {
    path: '/muslim-second-marriage',
    en: {
      short: 'Second marriage (divorced & widowed)',
      title: 'Muslim Second Marriage Matrimony for Divorced and Widowed | ENikah',
      desc: 'A respectful, private matrimony service for divorced and widowed Muslim brides and grooms. Verified profiles, marital status shown upfront, contacts shared only on mutual acceptance.',
      h1: 'Second marriage for divorced and widowed Muslims',
      lede: 'Nikah after divorce or the loss of a spouse is a blessed new beginning. ENikah helps you find it with dignity and privacy.',
      body: [
        ['Marital status shown honestly', 'Every profile states whether the person has never married, is divorced or is widowed. Families know from the start, and there are no surprises later.'],
        ['Privacy that matters more here', 'Your name, phone number and photo stay hidden until both sides accept an interest. Only verified members can see your profile at all.'],
        ['Matches that respect your choice', 'Set the partner age range and maslak you want. You see only profiles that fit your choice and whose choice fits you.'],
        ['Same price for everyone', 'Free registration and first 3 months, then {person} per 30 days. No extra charge for second-marriage profiles.'],
      ],
      faq: [['Can a parent register for a divorced daughter?', 'Yes, with her consent. Please involve her wali in every conversation.']],
    },
    ta: {
      short: 'மறுமணம் (விவாகரத்து, துணையை இழந்தவர்)',
      title: 'முஸ்லிம் மறுமணம்: விவாகரத்து ஆனவர்கள், துணையை இழந்தவர்களுக்கான மேட்ரிமோனி | ENikah',
      desc: 'விவாகரத்து ஆன, துணையை இழந்த முஸ்லிம் மணமகள், மணமகன்களுக்கான மரியாதையான, தனியுரிமை கொண்ட திருமண சேவை. சரிபார்க்கப்பட்ட சுயவிவரங்கள், திருமண நிலை தெளிவாக.',
      h1: 'விவாகரத்து ஆன, துணையை இழந்த முஸ்லிம்களுக்கான மறுமணம்',
      lede: 'விவாகரத்துக்குப் பின்னோ துணையை இழந்த பின்னோ நடக்கும் நிக்காஹ் ஒரு பரக்கத்தான புதிய தொடக்கம். அதை மரியாதையுடனும் தனியுரிமையுடனும் கண்டறிய ENikah உதவுகிறது.',
      body: [
        ['திருமண நிலை நேர்மையாக', 'ஒவ்வொரு சுயவிவரமும் திருமணம் ஆகாதவரா, விவாகரத்து ஆனவரா, துணையை இழந்தவரா என்பதைக் காட்டுகிறது. குடும்பங்களுக்குத் தொடக்கத்திலேயே தெரியும்.'],
        ['இங்கே தனியுரிமை இன்னும் முக்கியம்', 'இரு தரப்பும் விருப்பத்தை ஏற்கும் வரை உங்கள் பெயர், எண், புகைப்படம் மறைக்கப்பட்டிருக்கும். சரிபார்க்கப்பட்ட உறுப்பினர்கள் மட்டுமே உங்கள் சுயவிவரத்தைக் காண முடியும்.'],
        ['உங்கள் விருப்பத்தை மதிக்கும் பொருத்தம்', 'துணையின் வயது வரம்பையும் மஸ்லக்கையும் தேர்வு செய்யுங்கள். உங்கள் விருப்பத்துக்கும் அவர்களின் விருப்பத்துக்கும் பொருந்தும் வரன்கள் மட்டுமே காட்டப்படும்.'],
        ['அனைவருக்கும் ஒரே கட்டணம்', 'இலவசப் பதிவு, முதல் 3 மாதங்கள் இலவசம்; பின் 30 நாட்களுக்கு {person}. மறுமணச் சுயவிவரங்களுக்குக் கூடுதல் கட்டணம் இல்லை.'],
      ],
      faq: [['விவாகரத்து ஆன மகளுக்காகப் பெற்றோர் பதிவு செய்யலாமா?', 'ஆம், அவரின் சம்மதத்துடன். ஒவ்வொரு உரையாடலிலும் அவரின் வலீயை உடன் வைத்துக்கொள்ளுங்கள்.']],
    },
  },
  {
    path: '/sunni-muslim-matrimony',
    en: {
      short: 'Sunni, Shafi & Hanafi matrimony',
      title: 'Sunni Muslim Matrimony: Shafi and Hanafi Brides and Grooms | ENikah',
      desc: 'Find Sunni Shafi or Sunni Hanafi brides and grooms. ENikah matches maslak both ways, so you only see families whose choice fits yours. Verified profiles, first 3 months free.',
      h1: 'Sunni Muslim matrimony with maslak matching',
      lede: 'For many families the maslak matters. ENikah lets you choose “same maslak only” or “any maslak”, and respects the other family’s choice too.',
      body: [
        ['Maslak on every profile', 'Profiles show Sunni Hanafi, Sunni Shafi, Sunni (other), Shia or other, so families can see it upfront.'],
        ['Two-way maslak matching', 'If you choose “same as mine”, you only see profiles with your maslak. If the other family chose the same, they only see you when you match them. Nobody is shown a profile that does not fit.'],
        ['Verified and private', 'Every profile is checked with an ID and photo. Contact details are shared only when both sides accept.'],
      ],
      faq: [['Can I see all maslaks?', 'Yes. Choose “any maslak” in your partner preference.']],
    },
    ta: {
      short: 'சுன்னி, ஷாஃபிஈ, ஹனஃபி மேட்ரிமோனி',
      title: 'சுன்னி முஸ்லிம் மேட்ரிமோனி: ஷாஃபிஈ, ஹனஃபி மணமகள், மணமகன் | ENikah',
      desc: 'சுன்னி ஷாஃபிஈ அல்லது சுன்னி ஹனஃபி மணமகள், மணமகன்களைக் கண்டறியுங்கள். ENikah மஸ்லக்கை இரு தரப்புக்கும் பொருத்துகிறது. சரிபார்க்கப்பட்ட சுயவிவரங்கள், முதல் 3 மாதங்கள் இலவசம்.',
      h1: 'மஸ்லக் பொருத்தத்துடன் சுன்னி முஸ்லிம் மேட்ரிமோனி',
      lede: 'பல குடும்பங்களுக்கு மஸ்லக் முக்கியம். “என் மஸ்லக் மட்டும்” அல்லது “எந்த மஸ்லக்கும்” என்று தேர்வு செய்யலாம்; மற்ற குடும்பத்தின் விருப்பத்தையும் ENikah மதிக்கிறது.',
      body: [
        ['ஒவ்வொரு சுயவிவரத்திலும் மஸ்லக்', 'சுன்னி ஹனஃபி, சுன்னி ஷாஃபிஈ, சுன்னி (மற்றவை), ஷியா அல்லது மற்றவை என்று சுயவிவரங்களில் தெளிவாகக் காட்டப்படும்.'],
        ['இரு தரப்பு மஸ்லக் பொருத்தம்', '“என் மஸ்லக் மட்டும்” என்று தேர்வு செய்தால் உங்கள் மஸ்லக் வரன்கள் மட்டுமே காட்டப்படும். மற்ற குடும்பமும் அப்படித் தேர்வு செய்திருந்தால், நீங்கள் பொருந்தினால் மட்டுமே உங்களைக் காண்பார்கள்.'],
        ['சரிபார்ப்பும் தனியுரிமையும்', 'ஒவ்வொரு சுயவிவரமும் அடையாள ஆவணம், புகைப்படத்துடன் சரிபார்க்கப்படுகிறது. இரு தரப்பும் ஏற்ற பின்பே தொடர்பு விவரங்கள் பகிரப்படும்.'],
      ],
      faq: [['எல்லா மஸ்லக் வரன்களையும் பார்க்கலாமா?', 'ஆம். துணை விருப்பத்தில் “எந்த மஸ்லக்கும்” என்பதைத் தேர்வு செய்யுங்கள்.']],
    },
  },
  {
    path: '/marriage-broker',
    en: {
      short: 'For marriage brokers',
      title: 'Online Platform for Muslim Marriage Brokers | ENikah',
      desc: 'Muslim marriage brokers (thirumana thaargar): list up to {cap} verified candidates for {broker} per 30 days and receive two-way matches. First 3 months free.',
      h1: 'For Muslim marriage brokers',
      lede: 'Brokers bring families together. ENikah gives you verified matches for your candidates, without sharing their contacts until both sides agree.',
      body: [
        ['List your candidates', 'Add up to {cap} brides and grooms on one broker plan. Each candidate is verified with an ID and photo like any other member.'],
        ['Matches for every candidate', 'Each candidate gets two-way matched profiles by age and maslak, same city first. Send interests on their behalf.'],
        ['Clear marking', 'Your candidates are shown as “Via verified broker”, so families know who they are dealing with.'],
        ['Price', 'First 3 months free, then {broker} per 30 days for up to {cap} candidates.'],
      ],
      faq: [['Do brokers need to be verified?', 'Yes. Our admin approves each broker before their candidates are shown.']],
    },
    ta: {
      short: 'திருமணத் தரகர்களுக்கு',
      title: 'முஸ்லிம் திருமணத் தரகர்களுக்கான ஆன்லைன் தளம் | ENikah',
      desc: 'முஸ்லிம் திருமணத் தரகர்கள் 30 நாட்களுக்கு {broker} கட்டணத்தில் {cap} சரிபார்க்கப்பட்ட வரன்கள் வரை பதிவிட்டு, இரு தரப்புப் பொருத்தங்களைப் பெறலாம். முதல் 3 மாதங்கள் இலவசம்.',
      h1: 'முஸ்லிம் திருமணத் தரகர்களுக்கு',
      lede: 'தரகர்கள் குடும்பங்களை இணைக்கிறார்கள். இரு தரப்பும் ஒப்புக்கொள்ளும் வரை தொடர்பு விவரங்களைப் பகிராமல், உங்கள் வரன்களுக்குச் சரிபார்க்கப்பட்ட பொருத்தங்களை ENikah தருகிறது.',
      body: [
        ['உங்கள் வரன்களைப் பதிவிடுங்கள்', 'ஒரு தரகர் திட்டத்தில் {cap} மணமகள், மணமகன்கள் வரை சேர்க்கலாம். ஒவ்வொருவரும் மற்ற உறுப்பினர்களைப் போலவே அடையாள ஆவணம், புகைப்படத்துடன் சரிபார்க்கப்படுவார்கள்.'],
        ['ஒவ்வொரு வரனுக்கும் பொருத்தங்கள்', 'ஒவ்வொரு வரனுக்கும் வயது, மஸ்லக் அடிப்படையில் இரு தரப்புப் பொருத்தங்கள்; முதலில் அதே ஊர். அவர்கள் சார்பாக விருப்பம் அனுப்பலாம்.'],
        ['தெளிவான அடையாளம்', 'உங்கள் வரன்கள் “சரிபார்க்கப்பட்ட தரகர் மூலம்” என்று காட்டப்படும்; குடும்பங்களுக்கு யாருடன் பேசுகிறோம் என்று தெரியும்.'],
        ['கட்டணம்', 'முதல் 3 மாதங்கள் இலவசம்; பின் 30 நாட்களுக்கு {broker}, {cap} வரன்கள் வரை.'],
      ],
      faq: [['தரகர்களும் சரிபார்க்கப்பட வேண்டுமா?', 'ஆம். ஒவ்வொரு தரகரையும் எங்கள் நிர்வாகி அங்கீகரித்த பின்பே அவரின் வரன்கள் காட்டப்படும்.']],
    },
  },
  {
    path: '/safe-verified-matrimony',
    en: {
      short: 'How verification & privacy work',
      title: 'Safe Muslim Matrimony: How ENikah Verifies Profiles and Protects Privacy',
      desc: 'How ENikah keeps families safe: ID and photo verification, hidden contact details, mutual acceptance, report and block, and full account deletion.',
      h1: 'How ENikah keeps families safe',
      lede: 'Fake profiles and misused photos are the biggest worry in online matrimony. Here is exactly how ENikah handles verification and privacy.',
      body: [
        ['1. ID and photo check', 'Every bride, groom and broker uploads an ID and a photo. Our admin checks them by hand. Only approved profiles are ever shown.'],
        ['2. ID deleted after checking', 'We keep only a “verified” mark and the profile photo. The ID document itself is deleted once the admin decides.'],
        ['3. Hidden until both accept', 'Other members see age, city, maslak, education, profession and marital status. Name, phone and photo are shared only when both sides accept an interest.'],
        ['4. Only active, verified members', 'Profiles that are not renewed are hidden. Unverified users cannot see anyone.'],
        ['5. Report and block', 'Report any profile that seems fake or behaves badly. Our admin can block it, hiding it from everyone.'],
        ['6. Delete anytime', 'Delete your account and all your data at any time from Account → Delete account.'],
      ],
      faq: [['Does ENikah guarantee what members say?', 'We verify identity documents, but families should still make their own enquiries before any commitment.']],
    },
    ta: {
      short: 'சரிபார்ப்பும் தனியுரிமையும் எப்படி',
      title: 'பாதுகாப்பான முஸ்லிம் மேட்ரிமோனி: ENikah சுயவிவரங்களை எப்படிச் சரிபார்க்கிறது',
      desc: 'ENikah குடும்பங்களை எப்படிப் பாதுகாக்கிறது: அடையாள ஆவணம், புகைப்படச் சரிபார்ப்பு, மறைக்கப்பட்ட தொடர்பு விவரங்கள், இரு தரப்பு ஒப்புதல், புகார், தடை, முழுக் கணக்கு நீக்கம்.',
      h1: 'ENikah குடும்பங்களை எப்படிப் பாதுகாக்கிறது',
      lede: 'போலிச் சுயவிவரங்களும் புகைப்படத் தவறான பயன்பாடும் ஆன்லைன் மேட்ரிமோனியின் பெரிய கவலைகள். ENikah சரிபார்ப்பையும் தனியுரிமையையும் எப்படிக் கையாள்கிறது என்பது இதோ.',
      body: [
        ['1. அடையாள ஆவணம், புகைப்படச் சரிபார்ப்பு', 'ஒவ்வொரு மணமகள், மணமகன், தரகரும் அடையாள ஆவணமும் புகைப்படமும் பதிவேற்றுகிறார்கள். எங்கள் நிர்வாகி நேரடியாகச் சரிபார்க்கிறார். அங்கீகரிக்கப்பட்ட சுயவிவரங்கள் மட்டுமே காட்டப்படும்.'],
        ['2. சரிபார்த்த பின் ஆவணம் நீக்கம்', '“சரிபார்க்கப்பட்டது” என்ற குறியையும் சுயவிவரப் புகைப்படத்தையும் மட்டுமே வைத்திருக்கிறோம். நிர்வாகி முடிவு செய்ததும் அடையாள ஆவணம் நீக்கப்படும்.'],
        ['3. இருவரும் ஏற்கும் வரை மறைவு', 'மற்ற உறுப்பினர்கள் வயது, ஊர், மஸ்லக், கல்வி, தொழில், திருமண நிலை ஆகியவற்றைக் காண்பார்கள். பெயர், எண், புகைப்படம் இரு தரப்பும் ஏற்ற பின்பே பகிரப்படும்.'],
        ['4. செயலில் உள்ள, சரிபார்க்கப்பட்டவர்கள் மட்டும்', 'புதுப்பிக்கப்படாத சுயவிவரங்கள் மறைக்கப்படும். சரிபார்க்கப்படாதவர்கள் யாரையும் காண முடியாது.'],
        ['5. புகார், தடை', 'போலியாகத் தோன்றும் அல்லது தவறாக நடந்துகொள்ளும் சுயவிவரம் பற்றிப் புகார் செய்யுங்கள். நிர்வாகி அதைத் தடுத்து அனைவரிடமிருந்தும் மறைக்கலாம்.'],
        ['6. எப்போது வேண்டுமானாலும் நீக்கலாம்', 'கணக்கு → கணக்கை நீக்கு என்பதில் உங்கள் கணக்கையும் எல்லாத் தரவையும் எப்போது வேண்டுமானாலும் நீக்கலாம்.'],
      ],
      faq: [['உறுப்பினர்கள் சொல்வதற்கு ENikah உத்தரவாதம் தருகிறதா?', 'அடையாள ஆவணங்களைச் சரிபார்க்கிறோம்; ஆனால் எந்த முடிவுக்கும் முன் குடும்பங்கள் தாங்களே விசாரித்துக்கொள்ள வேண்டும்.']],
    },
  },
];

export const PUBLIC_PATHS = ['/', '/privacy', '/terms', ...PAGES.map(p => p.path)];

const UI = {
  en: { reg: 'Register free', more: 'More from ENikah', faq: 'Questions', home: 'Home' },
  ta: { reg: 'இலவசமாகப் பதிவு செய்', more: 'ENikah-வில் மேலும்', faq: 'கேள்விகள்', home: 'முகப்பு' },
};
const pageLinks = (lang, except) => `<ul class="glinks">${PAGES.filter(p => p.path !== except).map(p => `<li><a href="${urlFor(lang, p.path)}">${esc(p[lang].short)}</a></li>`).join('')}</ul>`;
export const SEO_CSS = `.glinks{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;padding:0;list-style:none}.glinks a{display:block;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;text-decoration:none;font-weight:600}
.why{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}.why .box{margin:0}.faq summary{list-style:none;color:var(--ink);font-size:inherit;margin:0}.faq summary h3{display:inline;margin:0}.faq summary::-webkit-details-marker{display:none}.faq summary::before{content:"+ ";color:var(--gold);font-weight:700}.faq[open] summary::before{content:"− "}.faq p{margin:8px 0 0}
.crumb{font-size:14px;color:var(--mut)}.crumb a{color:var(--mut)}`;

// Home: title, description, JSON-LD and the extra sections under pricing.
export function home(req) {
  const L = HOME[req.lang], v = n();
  const faq = L.faq.map(([q, a]) => [fill(q, v), fill(a, v)]);
  const base = CFG.base;
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'ENikah', url: base + '/', logo: base + '/og.png' },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'ENikah', url: base + '/', inLanguage: ['en', 'ta'] },
    { '@context': 'https://schema.org', '@type': 'Service', name: L.title, serviceType: 'Matrimonial service', provider: { '@type': 'Organization', name: 'ENikah' },
      areaServed: { '@type': 'State', name: 'Tamil Nadu' }, availableLanguage: ['English', 'Tamil'],
      offers: [{ '@type': 'Offer', name: 'Bride / groom, 30 days', price: String(CFG.person), priceCurrency: 'INR' },
               { '@type': 'Offer', name: 'Marriage broker, 30 days', price: String(CFG.broker), priceCurrency: 'INR' }] },
    faqLd(req.lang, faq),
  ];
  const extra = `<h2>${esc(L.whyH)}</h2><div class="why">${L.why.map(([h, p]) => `<div class="box"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('')}</div>
    <h2>${esc(L.forH)}</h2>${pageLinks(req.lang)}
    ${faqHtml(L.faqH, faq)}
    <div class="acts"><a class="btn gold" href="/register">${esc(UI[req.lang].reg)}</a></div>`;
  return { title: L.title, desc: L.desc, head: headTags(req, { path: '/', title: L.title, desc: L.desc, jsonld }), extra };
}

// A content page. Returns null if the path is not one.
export function contentPage(req, p) {
  const pg = PAGES.find(x => x.path === p); if (!pg) return null;
  const L = pg[req.lang], v = n(), ui = UI[req.lang], base = CFG.base;
  const title = fill(L.title, v), desc = fill(L.desc, v);
  const faq = L.faq.map(([q, a]) => [fill(q, v), fill(a, v)]);
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description: desc, url: base + urlFor(req.lang, p), inLanguage: req.lang, dateModified: UPDATED },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ENikah', item: base + urlFor(req.lang, '/') },
      { '@type': 'ListItem', position: 2, name: L.short, item: base + urlFor(req.lang, p) }] },
    faqLd(req.lang, faq),
  ];
  const body = `<p class="crumb"><a href="${urlFor(req.lang, '/')}">ENikah</a> › ${esc(L.short)}</p>
    <h1>${esc(L.h1)}</h1><p>${esc(fill(L.lede, v))}</p>
    <div class="acts"><a class="btn gold" href="/register">${esc(ui.reg)}</a></div>
    ${L.body.map(([h, t]) => `<h2>${esc(h)}</h2><p>${esc(fill(t, v))}</p>`).join('')}
    ${faqHtml(ui.faq, faq)}
    <div class="acts"><a class="btn gold" href="/register">${esc(ui.reg)}</a></div>
    <h2>${esc(ui.more)}</h2>${pageLinks(req.lang, p)}`;
  return { title, desc, body, head: headTags(req, { path: p, title, desc, jsonld }) };
}

// IndexNow: tell Bing, Yandex and others about every public page when a new version starts.
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '189d9301c8b097ea84ed1f7671b9b50a';
export async function pingIndexNow() {
  const base = CFG.base;
  if (!base.startsWith('https://') || /railway\.app/.test(base) || process.env.INDEXNOW_OFF === '1') return;
  const urlList = PUBLIC_PATHS.flatMap(p => ['en', 'ta'].map(l => base + urlFor(l, p)));
  try {
    const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(base).host, key: INDEXNOW_KEY, keyLocation: `${base}/${INDEXNOW_KEY}.txt`, urlList }) });
    console.log('[indexnow] submitted', urlList.length, 'urls:', r.status);
  } catch (e) { console.log('[indexnow] failed:', e.message); }
}

export function mountSeo(app) {
  app.get(`/${INDEXNOW_KEY}.txt`, (req, res) => res.type('text/plain').send(INDEXNOW_KEY));
  app.get('/robots.txt', (req, res) => res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /home\nDisallow: /account\nDisallow: /broker\nDisallow: /dashboard\nDisallow: /matches/\nDisallow: /interests\nDisallow: /photo/\nDisallow: /profile/\nDisallow: /reset/\nDisallow: /lang/\nDisallow: /dev/\n\nSitemap: ${CFG.base}/sitemap.xml\n`));
  app.get('/sitemap.xml', (req, res) => {
    const b = CFG.base;
    const urls = PUBLIC_PATHS.flatMap(p => ['en', 'ta'].map(l => `  <url>\n    <loc>${b}${urlFor(l, p)}</loc>\n    <lastmod>${UPDATED}</lastmod>\n    <priority>${p === '/' ? '1.0' : ['/privacy', '/terms'].includes(p) ? '0.3' : '0.8'}</priority>\n`
      + ['en', 'ta'].map(x => `    <xhtml:link rel="alternate" hreflang="${x}" href="${b}${urlFor(x, p)}"/>\n`).join('')
      + `    <xhtml:link rel="alternate" hreflang="x-default" href="${b}${p}"/>\n  </url>`)).join('\n');
    res.type('application/xml').set('Cache-Control', 'public, max-age=3600')
      .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`);
  });
  app.get('/og.png', (req, res) => res.type('image/png').set('Cache-Control', 'public, max-age=604800').send(OG));
}
