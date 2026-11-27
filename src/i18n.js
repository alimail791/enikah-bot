// English / Tamil. Text is written in English in the code; t() returns the Tamil version when the page is in Tamil.
// {name} placeholders are filled after translation. Messages built with numbers or codes are matched by PATTERNS.
export const LANGS = ['en', 'ta'];

// Labels for stored values (English keys).
const EN = {
  'status:unverified': 'Not verified', 'status:pending': 'Being checked', 'status:verified': 'Verified', 'status:blocked': 'Blocked', 'status:deleted': 'Deleted',
  'interest:sent': 'Interest sent', 'interest:accepted': 'Accepted', 'interest:declined': 'Declined',
};

const TA = {
  // values
  'status:unverified': 'சரிபார்க்கப்படவில்லை', 'status:pending': 'பரிசீலனையில்', 'status:verified': 'சரிபார்க்கப்பட்டது', 'status:blocked': 'தடுக்கப்பட்டது', 'status:deleted': 'நீக்கப்பட்டது',
  'interest:sent': 'விருப்பம் அனுப்பப்பட்டது', 'interest:accepted': 'ஏற்கப்பட்டது', 'interest:declined': 'மறுக்கப்பட்டது',
  'Sunni Hanafi': 'சுன்னி ஹனஃபி', 'Sunni Shafi': 'சுன்னி ஷாஃபிஈ', 'Sunni (other)': 'சுன்னி (மற்றவை)', 'Shia': 'ஷியா', 'Other': 'மற்றவை',
  'Never married': 'திருமணம் ஆகாதவர்', 'Divorced': 'விவாகரத்து ஆனவர்', 'Widowed': 'துணையை இழந்தவர்',
  'Bride': 'மணமகள்', 'Groom': 'மணமகன்',

  // navigation & common
  'Log in': 'உள்நுழை', 'Log out': 'வெளியேறு', 'Register free': 'இலவசமாகப் பதிவு செய்', 'Register': 'பதிவு', 'Admin': 'நிர்வாகம்', 'Account': 'கணக்கு',
  'Candidates': 'வரன்கள்', 'Interests': 'விருப்பங்கள்', 'My profile': 'என் சுயவிவரம்', 'Matches': 'வரன்கள்',
  'Privacy': 'தனியுரிமை', 'Terms': 'விதிமுறைகள்', 'Open': 'திற', 'Save': 'சேமி', 'Edit': 'திருத்து', 'Find': 'தேடு', 'Status': 'நிலை', 'From': 'இருந்து', 'To': 'க்கு',
  'ENikah · Verified profiles only · Contacts shared only when both sides accept': 'ENikah · சரிபார்க்கப்பட்ட சுயவிவரங்கள் மட்டும் · இரு தரப்பும் ஏற்ற பின்பே தொடர்பு விவரங்கள் பகிரப்படும்',
  'ENikah — verified Muslim matrimony for families. Free registration, first 3 months free.': 'ENikah — குடும்பங்களுக்கான சரிபார்க்கப்பட்ட முஸ்லிம் திருமண சேவை. இலவசப் பதிவு, முதல் 3 மாதங்கள் இலவசம்.',
  'Active': 'செயலில்', 'Expired': 'காலாவதி', 'Verified': 'சரிபார்க்கப்பட்டது', 'Via verified broker': 'சரிபார்க்கப்பட்ட தரகர் மூலம்',
  'any': 'எதுவும்', 'any maslak': 'எந்த மஸ்லக்கும்', '{maslak} only': '{maslak} மட்டும்',
  'Age {a} · {m} · {city} first · their choice fits you too': 'வயது {a} · {m} · முதலில் {city} · அவர்களின் விருப்பத்துக்கும் நீங்கள் பொருந்துகிறீர்கள்',
  'Photo shown after both sides accept': 'இரு தரப்பும் ஏற்ற பின் புகைப்படம் காட்டப்படும்',

  // home
  'Verified Muslim matrimony': 'சரிபார்க்கப்பட்ட முஸ்லிம் திருமண சேவை',
  'Verified Muslim matrimony for families': 'குடும்பங்களுக்கான சரிபார்க்கப்பட்ட முஸ்லிம் திருமண சேவை',
  'Register free with your first 3 months free. Every profile is checked with ID and photo. You see only active, verified profiles that fit your choice — and theirs. Contacts are shared only when both sides accept.':
    'இலவசமாகப் பதிவு செய்யுங்கள் — முதல் 3 மாதங்கள் இலவசம். ஒவ்வொரு சுயவிவரமும் அடையாள ஆவணம் மற்றும் புகைப்படத்துடன் சரிபார்க்கப்படுகிறது. உங்கள் விருப்பத்துக்கும் அவர்களின் விருப்பத்துக்கும் பொருந்தும், செயலில் உள்ள சரிபார்க்கப்பட்ட வரன்களை மட்டுமே காண்பீர்கள். இரு தரப்பும் ஏற்ற பின்பே தொடர்பு விவரங்கள் பகிரப்படும்.',
  'Go to my profile': 'என் சுயவிவரத்துக்குச் செல்', 'Arch with crescent': 'பிறையுடன் கூடிய வளைவு', 'How it works': 'எப்படிச் செயல்படுகிறது',
  '<b>Register</b> for yourself or a family member — free, first 3 months free.': 'உங்களுக்காகவோ குடும்ப உறுப்பினருக்காகவோ <b>பதிவு செய்யுங்கள்</b> — இலவசம், முதல் 3 மாதங்கள் இலவசம்.',
  '<b>Get verified:</b> upload an ID and a photo. Our admin checks them; the ID is deleted after checking.': '<b>சரிபார்ப்பு:</b> அடையாள ஆவணம் மற்றும் புகைப்படத்தைப் பதிவேற்றுங்கள். எங்கள் நிர்வாகி சரிபார்ப்பார்; சரிபார்த்த பின் அடையாள ஆவணம் நீக்கப்படும்.',
  '<b>Receive {n} matching profiles a month</b> — matched both ways on age and maslak, same city first.': '<b>மாதம் {n} பொருத்தமான வரன்கள்</b> — வயது மற்றும் மஸ்லக் இரு தரப்புக்கும் பொருந்தும்; முதலில் அதே ஊர்.',
  '<b>Send interest.</b> When both sides accept, contact details are shared. Please involve family / wali.': '<b>விருப்பம் அனுப்புங்கள்.</b> இரு தரப்பும் ஏற்றதும் தொடர்பு விவரங்கள் பகிரப்படும். குடும்பத்தினர் / வலீயை உடன் வைத்துப் பேசுங்கள்.',
  'Simple pricing': 'எளிய கட்டணம்', 'Free': 'இலவசம்', 'Registration + first 3 months': 'பதிவு + முதல் 3 மாதங்கள்',
  'per 30 days for brides and grooms': 'மணமகள் / மணமகனுக்கு 30 நாட்களுக்கு',
  'per 30 days for marriage brokers, up to {n} candidates': 'திருமணத் தரகர்களுக்கு 30 நாட்களுக்கு, அதிகபட்சம் {n} வரன்கள்',
  'Profiles that are not renewed are hidden immediately and come back as soon as the plan is renewed.': 'புதுப்பிக்கப்படாத சுயவிவரங்கள் உடனே மறைக்கப்படும்; திட்டம் புதுப்பிக்கப்பட்டதும் மீண்டும் தெரியும்.',

  // privacy & terms
  'We collect your mobile number, optional email, and the profile details you enter. ID proof is used only to verify you and is deleted after the admin decision; we keep only a "verified" mark and your profile photo.':
    'உங்கள் மொபைல் எண், விருப்பமான மின்னஞ்சல், நீங்கள் உள்ளிடும் சுயவிவர விவரங்களைச் சேகரிக்கிறோம். அடையாள ஆவணம் சரிபார்ப்புக்கு மட்டுமே; நிர்வாகியின் முடிவுக்குப் பின் நீக்கப்படும். "சரிபார்க்கப்பட்டது" என்ற குறியும் சுயவிவரப் புகைப்படமும் மட்டுமே வைக்கப்படும்.',
  'Other members see your profile without your name, phone or photo. These are shared only with a member whose interest you accept (or who accepts yours).':
    'மற்ற உறுப்பினர்கள் உங்கள் பெயர், தொலைபேசி எண், புகைப்படம் இல்லாமலே உங்கள் சுயவிவரத்தைப் பார்ப்பார்கள். நீங்கள் ஏற்ற (அல்லது உங்களை ஏற்ற) உறுப்பினருடன் மட்டுமே இவை பகிரப்படும்.',
  'You can delete your account and all your data at any time from Account → Delete account. Payments are processed by Razorpay; we do not store card or UPI details.':
    'கணக்கு → கணக்கை நீக்கு என்பதில் எப்போது வேண்டுமானாலும் உங்கள் கணக்கையும் எல்லா தரவையும் நீக்கலாம். கட்டணங்களை Razorpay கையாள்கிறது; கார்டு அல்லது UPI விவரங்களை நாங்கள் சேமிப்பதில்லை.',
  'Contact: {email}': 'தொடர்புக்கு: {email}',
  "ENikah is for adults seeking marriage only (brides 18+, grooms 21+). Profiles must be genuine and entered with the person's consent. Fake, misleading or abusive profiles are blocked without refund.":
    'ENikah திருமணத்தை நாடும் பெரியவர்களுக்கு மட்டுமே (மணமகள் 18+, மணமகன் 21+). சுயவிவரங்கள் உண்மையானவையாகவும் சம்பந்தப்பட்டவரின் ஒப்புதலுடனும் இருக்க வேண்டும். போலியான, தவறான அல்லது தவறாகப் பயன்படுத்தும் சுயவிவரங்கள் பணம் திருப்பித் தரப்படாமல் தடுக்கப்படும்.',
  'Plans run for 30 days and are renewed manually. Profiles without an active plan are hidden. Fees are non-refundable once matches have been shown.':
    'திட்டங்கள் 30 நாட்களுக்கு; நீங்களே புதுப்பிக்க வேண்டும். செயலில் திட்டம் இல்லாத சுயவிவரங்கள் மறைக்கப்படும். வரன்கள் காட்டப்பட்ட பின் கட்டணம் திருப்பித் தரப்படாது.',
  "ENikah verifies identity documents but does not guarantee anyone's statements. Families should make their own enquiries before any commitment.":
    'ENikah அடையாள ஆவணங்களைச் சரிபார்க்கிறது; ஆனால் யாருடைய கூற்றுகளுக்கும் உத்தரவாதம் அளிப்பதில்லை. எந்த முடிவுக்கும் முன் குடும்பத்தினர் தாங்களே விசாரித்துக்கொள்ள வேண்டும்.',

  // accounts
  "First 3 months free. Use your own number or a family member's.": 'முதல் 3 மாதங்கள் இலவசம். உங்கள் எண் அல்லது குடும்ப உறுப்பினரின் எண்ணைப் பயன்படுத்தலாம்.',
  'Mobile number': 'மொபைல் எண்', '10-digit mobile': '10 இலக்க மொபைல் எண்', 'Password': 'கடவுச்சொல்', 'At least 6 characters': 'குறைந்தது 6 எழுத்துகள்',
  'Email': 'மின்னஞ்சல்', 'Optional — for alerts and password reset': 'விருப்பம் — அறிவிப்புகள் மற்றும் கடவுச்சொல் மீட்புக்கு',
  'I am registering as': 'நான் பதிவு செய்வது', 'Bride / groom (myself or family)': 'மணமகள் / மணமகன் (நான் அல்லது குடும்பத்தினர்)', 'Marriage broker': 'திருமணத் தரகர்',
  'Create account': 'கணக்கை உருவாக்கு', 'Already registered?': 'ஏற்கனவே பதிவு செய்துள்ளீர்களா?', 'Forgot password?': 'கடவுச்சொல் மறந்துவிட்டதா?', 'New here?': 'புதியவரா?',
  'Reset password': 'கடவுச்சொல்லை மீட்டமை', 'Send reset link': 'மீட்பு இணைப்பை அனுப்பு',
  'The link goes to the email on your account. No email on your account? Contact {email}.': 'இணைப்பு உங்கள் கணக்கின் மின்னஞ்சலுக்கு அனுப்பப்படும். கணக்கில் மின்னஞ்சல் இல்லையா? {email} ஐத் தொடர்பு கொள்ளவும்.',
  'Link expired': 'இணைப்பு காலாவதியானது', 'This link has expired': 'இந்த இணைப்பு காலாவதியாகிவிட்டது', 'Request a new one': 'புதிய இணைப்பைக் கேளுங்கள்',
  'New password': 'புதிய கடவுச்சொல்', 'Choose a new password': 'புதிய கடவுச்சொல்லைத் தேர்ந்தெடுங்கள்', 'Save password': 'கடவுச்சொல்லைச் சேமி',
  'Contact': 'தொடர்பு', 'Mobile': 'மொபைல்', 'For alerts and password reset': 'அறிவிப்புகள் மற்றும் கடவுச்சொல் மீட்புக்கு', 'Leave empty to keep the current one': 'தற்போதையதை வைத்திருக்கக் காலியாக விடவும்',
  'Delete account': 'கணக்கை நீக்கு', 'Delete everything': 'அனைத்தையும் நீக்கு', 'Type DELETE to confirm': 'உறுதிப்படுத்த DELETE என்று தட்டச்சு செய்யவும்',
  'Removes your account, profile, interests and documents permanently.': 'உங்கள் கணக்கு, சுயவிவரம், விருப்பங்கள், ஆவணங்கள் நிரந்தரமாக நீக்கப்படும்.',
  'Removes your account, all your candidates, interests and documents permanently.': 'உங்கள் கணக்கு, உங்கள் வரன்கள் அனைத்தும், விருப்பங்கள், ஆவணங்கள் நிரந்தரமாக நீக்கப்படும்.',

  // profile form
  'Create profile': 'சுயவிவரத்தை உருவாக்கு', 'Create the profile': 'சுயவிவரத்தை உருவாக்குங்கள்', 'For yourself or a family member. Free, with the first 3 months free.': 'உங்களுக்காகவோ குடும்ப உறுப்பினருக்காகவோ. இலவசம், முதல் 3 மாதங்கள் இலவசம்.',
  'Are you a marriage broker?': 'நீங்கள் திருமணத் தரகரா?', 'Set up a broker account instead': 'அதற்குப் பதிலாகத் தரகர் கணக்கைத் தொடங்குங்கள்',
  'Full name': 'முழுப் பெயர்', 'Shown only after both sides accept an interest': 'இரு தரப்பும் விருப்பத்தை ஏற்ற பின்பே காட்டப்படும்', 'Registering for': 'யாருக்காக', 'Choose…': 'தேர்ந்தெடுக்கவும்…',
  'Age': 'வயது', 'City / town': 'ஊர் / நகரம்', 'Maslak': 'மஸ்லக்', 'Marital status': 'திருமண நிலை', 'Education': 'கல்வி', 'Profession': 'தொழில்',
  'e.g. B.Sc, B.E, Alima': 'உதா. B.Sc, B.E, ஆலிமா', 'e.g. Teacher, Business': 'உதா. ஆசிரியர், வியாபாரம்', 'Partner preference': 'வாழ்க்கைத் துணை விருப்பம்',
  'Partner age from': 'துணையின் வயது முதல்', 'to': 'வரை', 'Partner maslak': 'துணையின் மஸ்லக்', 'Any maslak': 'எந்த மஸ்லக்கும்', 'Same as mine': 'என்னுடையதே',
  'Matches are two-way: you see only profiles that fit your choice and whose choice fits you.': 'பொருத்தம் இரு வழி: உங்கள் விருப்பத்துக்குப் பொருந்தும், அவர்களின் விருப்பத்துக்கு நீங்கள் பொருந்தும் வரன்கள் மட்டுமே காட்டப்படும்.',
  'Save changes': 'மாற்றங்களைச் சேமி', 'Edit profile': 'சுயவிவரத்தைத் திருத்து', 'Edit {code}': '{code} திருத்தம்', "{side} — this can't be changed.": '{side} — இதை மாற்ற முடியாது.',

  // dashboard
  'Salam, {name}': 'ஸலாம், {name}', 'Plan till {date}': '{date} வரை திட்டம்', 'Hidden since {date}': '{date} முதல் மறைக்கப்பட்டுள்ளது',
  'Verification': 'சரிபார்ப்பு', 'Profiles this month': 'இந்த மாத வரன்கள்', 'Upload ID & photo': 'அடையாள ஆவணம் & புகைப்படம் பதிவேற்று', 'Renew {price}': '{price} செலுத்திப் புதுப்பி',
  'Your matches': 'உங்கள் வரன்கள்', 'See my matches': 'என் வரன்களைப் பார்', '({n} new)': '({n} புதியவை)', 'Plan': 'திட்டம்',
  '{price} per 30 days. Renewing adds 30 days to your current end date, so you lose nothing by paying early.': '30 நாட்களுக்கு {price}. புதுப்பித்தால் தற்போதைய முடிவுத் தேதியுடன் 30 நாட்கள் சேர்க்கப்படும் — முன்கூட்டியே செலுத்தினாலும் நாட்கள் வீணாகாது.',
  'Updates': 'அறிவிப்புகள்',

  // verification
  'Verify': 'சரிபார்', 'Verify your broker account': 'உங்கள் தரகர் கணக்கைச் சரிபாருங்கள்', 'Verify {code}': '{code} சரிபார்ப்பு',
  'Only verified members can see profiles and be seen. The ID image is deleted after the admin checks it; we keep only a "verified" mark.': 'சரிபார்க்கப்பட்ட உறுப்பினர்கள் மட்டுமே வரன்களைப் பார்க்கவும் பிறருக்குத் தெரியவும் முடியும். நிர்வாகி சரிபார்த்த பின் அடையாள ஆவணம் நீக்கப்படும்; "சரிபார்க்கப்பட்டது" என்ற குறி மட்டும் வைக்கப்படும்.',
  'Only verified members can see profiles and be seen. The ID image is deleted after the admin checks it; we keep only a "verified" mark and the photo (shown only to people whose interest is accepted).': 'சரிபார்க்கப்பட்ட உறுப்பினர்கள் மட்டுமே வரன்களைப் பார்க்கவும் பிறருக்குத் தெரியவும் முடியும். நிர்வாகி சரிபார்த்த பின் அடையாள ஆவணம் நீக்கப்படும்; "சரிபார்க்கப்பட்டது" என்ற குறியும் புகைப்படமும் மட்டும் வைக்கப்படும் (விருப்பம் ஏற்கப்பட்டவர்களுக்கு மட்டுமே புகைப்படம் தெரியும்).',
  'ID proof': 'அடையாள ஆவணம்', 'Aadhaar, passport, voter ID or licence — photo or PDF, max 6 MB. You may cover the ID number.': 'ஆதார், பாஸ்போர்ட், வாக்காளர் அட்டை அல்லது ஓட்டுநர் உரிமம் — புகைப்படம் அல்லது PDF, அதிகபட்சம் 6 MB. அடையாள எண்ணை மறைத்துக்கொள்ளலாம்.',
  'Recent photo of the bride / groom': 'மணமகள் / மணமகனின் சமீபத்திய புகைப்படம்', 'Submit for verification': 'சரிபார்ப்புக்கு அனுப்பு',

  // matches
  'Matches for {code}': '{code}-க்கான வரன்கள்', 'Upload documents': 'ஆவணங்களைப் பதிவேற்று', 'Renew now': 'இப்போதே புதுப்பி',
  'This month: <b>{used} of {max}</b> profiles (plan till {date}).': 'இந்த மாதம்: <b>{max}-இல் {used}</b> வரன்கள் (திட்டம் {date} வரை).',
  'Show my matches ({n} left this month)': 'என் வரன்களைக் காட்டு (இந்த மாதம் இன்னும் {n})', 'Show more matches ({n} left this month)': 'மேலும் வரன்களைக் காட்டு (இந்த மாதம் இன்னும் {n})',
  'Renew for {n} more': 'மேலும் {n} வரன்களுக்குப் புதுப்பி', "This month's profiles": 'இந்த மாத வரன்கள்', 'No profiles yet this month — tap the button above.': 'இந்த மாதம் இன்னும் வரன்கள் இல்லை — மேலே உள்ள பொத்தானைத் தட்டுங்கள்.',
  'Earlier matches': 'முந்தைய வரன்கள்', 'No longer available': 'இப்போது கிடைக்கவில்லை', 'Send interest': 'விருப்பம் அனுப்பு',
  'Report this profile': 'இந்த சுயவிவரம் பற்றிப் புகார் செய்', 'What is wrong?': 'என்ன பிரச்சனை?', 'Send report': 'புகார் அனுப்பு',

  // interests
  'Received': 'பெற்றவை', 'For {code}': '{code}-க்கு', 'Accept': 'ஏற்றுக்கொள்', 'Decline': 'மறு', 'No new interests.': 'புதிய விருப்பங்கள் இல்லை.',
  'Accepted — contact details': 'ஏற்கப்பட்டவை — தொடர்பு விவரங்கள்', 'Please involve family / wali in every conversation.': 'ஒவ்வொரு உரையாடலிலும் குடும்பத்தினர் / வலீயை உடன் வைத்துக்கொள்ளுங்கள்.',
  'With {code}': '{code} உடன்', 'Message on WhatsApp': 'WhatsApp-இல் செய்தி அனுப்பு', 'None yet.': 'இன்னும் இல்லை.', 'Sent': 'அனுப்பியவை',

  // broker
  'Broker account': 'தரகர் கணக்கு', 'Set up your broker account': 'உங்கள் தரகர் கணக்கைத் தொடங்குங்கள்',
  'Free for {days} days, then {price} per 30 days. Up to {n} candidates. Your candidates are shown only while your plan is active.': '{days} நாட்கள் இலவசம், பின் 30 நாட்களுக்கு {price}. அதிகபட்சம் {n} வரன்கள். உங்கள் திட்டம் செயலில் இருக்கும் வரை மட்டுமே உங்கள் வரன்கள் காட்டப்படும்.',
  'Your name or bureau name': 'உங்கள் பெயர் அல்லது மையத்தின் பெயர்', 'Area / town you work in': 'நீங்கள் பணிபுரியும் பகுதி / ஊர்', 'Create broker account': 'தரகர் கணக்கை உருவாக்கு',
  'Broker': 'தரகர்', 'Broker ID': 'தரகர் அடையாளம்', 'Candidates hidden since {date}': '{date} முதல் வரன்கள் மறைக்கப்பட்டுள்ளன', 'Verify my ID': 'என் அடையாளத்தைச் சரிபார்',
  'Add candidate': 'வரனைச் சேர்', 'Add a candidate': 'ஒரு வரனைச் சேருங்கள்', "Add only with the candidate's and family's consent.": 'வரன் மற்றும் குடும்பத்தின் ஒப்புதலுடன் மட்டுமே சேர்க்கவும்.',
  'Profile': 'சுயவிவரம்', 'Details': 'விவரங்கள்', 'No candidates yet.': 'இன்னும் வரன்கள் இல்லை.',

  // admin
  'Admin login': 'நிர்வாக உள்நுழைவு', 'Username': 'பயனர் பெயர்', 'Admin email or mobile number': 'நிர்வாக மின்னஞ்சல் அல்லது மொபைல் எண்', 'Wrong username or password.': 'பயனர் பெயர் அல்லது கடவுச்சொல் தவறு.',
  'Live & verified profiles': 'செயலில் உள்ள சரிபார்க்கப்பட்ட சுயவிவரங்கள்', 'Hidden (not renewed)': 'மறைக்கப்பட்டவை (புதுப்பிக்கப்படவில்லை)', 'Members · active brokers': 'உறுப்பினர்கள் · செயலில் உள்ள தரகர்கள்',
  'Interests · accepted': 'விருப்பங்கள் · ஏற்கப்பட்டவை', 'Revenue this month (total {total})': 'இந்த மாத வருவாய் (மொத்தம் {total})', 'Pending verification ({n})': 'சரிபார்ப்புக்குக் காத்திருப்பவை ({n})',
  'ID': 'அடையாள ஆவணம்', 'Photo': 'புகைப்படம்', 'No document': 'ஆவணம் இல்லை', 'Open PDF': 'PDF திற', 'Approve': 'அங்கீகரி', 'Reject': 'நிராகரி', 'Nothing pending.': 'காத்திருப்பவை எதுவும் இல்லை.',
  'Find a profile': 'சுயவிவரத்தைத் தேடு', 'Not found.': 'கிடைக்கவில்லை.', 'Block': 'தடு', 'Unblock': 'தடையை நீக்கு', 'Add 30 days (cash payment {price})': '30 நாட்கள் சேர் (ரொக்கக் கட்டணம் {price})',
  "Adding days to a candidate extends the broker's plan.": 'ஒரு வரனுக்கு நாட்கள் சேர்த்தால் தரகரின் திட்டம் நீட்டிக்கப்படும்.', 'Reports': 'புகார்கள்', 'Reason': 'காரணம்', 'No reports.': 'புகார்கள் இல்லை.',
  'Expiring in 7 days': '7 நாட்களில் முடிபவை', 'They get reminders 3 days before and on expiry.': '3 நாட்களுக்கு முன்பும் முடியும் நாளிலும் நினைவூட்டல் அனுப்பப்படும்.', 'Nothing expiring.': 'முடிபவை எதுவும் இல்லை.',

  // fixed messages (flash / errors / notifications)
  'Too many attempts. Please try again in 15 minutes.': 'அதிக முயற்சிகள். 15 நிமிடங்கள் கழித்து மீண்டும் முயலவும்.',
  'Wrong mobile number or password.': 'மொபைல் எண் அல்லது கடவுச்சொல் தவறு.',
  'If that number has an email on file, a reset link has been sent.': 'அந்த எண்ணுக்கு மின்னஞ்சல் பதிவாகியிருந்தால், மீட்பு இணைப்பு அனுப்பப்பட்டுள்ளது.',
  'This link has expired.': 'இந்த இணைப்பு காலாவதியாகிவிட்டது.', 'Password changed. Please log in.': 'கடவுச்சொல் மாற்றப்பட்டது. உள்நுழையவும்.',
  'Please enter a valid email.': 'சரியான மின்னஞ்சலை உள்ளிடவும்.', 'Saved.': 'சேமிக்கப்பட்டது.', 'Please type DELETE to confirm.': 'உறுதிப்படுத்த DELETE என்று தட்டச்சு செய்யவும்.',
  'Your account and data have been deleted.': 'உங்கள் கணக்கும் தரவும் நீக்கப்பட்டன.', 'Profile not found.': 'சுயவிவரம் கிடைக்கவில்லை.', 'Profile updated.': 'சுயவிவரம் புதுப்பிக்கப்பட்டது.',
  'Documents already submitted. The admin will check them soon.': 'ஆவணங்கள் ஏற்கனவே அனுப்பப்பட்டுள்ளன. நிர்வாகி விரைவில் சரிபார்ப்பார்.',
  'Already verified.': 'ஏற்கனவே சரிபார்க்கப்பட்டது.', 'This profile is blocked.': 'இந்த சுயவிவரம் தடுக்கப்பட்டுள்ளது.',
  'Please attach the required files (JPG, PNG or PDF under 6 MB).': 'தேவையான கோப்புகளை இணைக்கவும் (6 MB-க்குக் குறைவான JPG, PNG அல்லது PDF).',
  'Documents received. The admin will verify within 24 hours.': 'ஆவணங்கள் பெறப்பட்டன. 24 மணி நேரத்துக்குள் நிர்வாகி சரிபார்ப்பார்.',
  'Thank you. The admin will review this report.': 'நன்றி. நிர்வாகி இந்தப் புகாரைப் பரிசீலிப்பார்.',
  'Broker account created. Next: upload your ID to get verified.': 'தரகர் கணக்கு உருவாக்கப்பட்டது. அடுத்து: சரிபார்ப்புக்கு உங்கள் அடையாள ஆவணத்தைப் பதிவேற்றுங்கள்.',
  'Sorry, the payment page could not be opened. Please try again in a few minutes.': 'மன்னிக்கவும், கட்டணப் பக்கத்தைத் திறக்க முடியவில்லை. சில நிமிடங்கள் கழித்து முயலவும்.',
  'Payment received. JazakAllah khair — your plan is extended.': 'கட்டணம் பெறப்பட்டது. ஜஸாகல்லாஹு கைர் — உங்கள் திட்டம் நீட்டிக்கப்பட்டது.',
  'Payment not completed. You can try again anytime.': 'கட்டணம் முடியவில்லை. எப்போது வேண்டுமானாலும் மீண்டும் முயலலாம்.',
  'Please enter a valid 10-digit Indian mobile number.': 'சரியான 10 இலக்க இந்திய மொபைல் எண்ணை உள்ளிடவும்.',
  'Password must be at least 6 characters.': 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்.',
  'Please enter a valid email, or leave it empty.': 'சரியான மின்னஞ்சலை உள்ளிடவும், அல்லது காலியாக விடவும்.',
  'This number is already registered. Please log in.': 'இந்த எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது. உள்நுழையவும்.',
  'Please enter the full name.': 'முழுப் பெயரை உள்ளிடவும்.', 'Please choose bride or groom.': 'மணமகள் அல்லது மணமகன் என்பதைத் தேர்ந்தெடுக்கவும்.',
  'Please enter the city or town.': 'ஊர் / நகரத்தை உள்ளிடவும்.', 'Please choose the maslak.': 'மஸ்லக்கைத் தேர்ந்தெடுக்கவும்.', 'Please choose the marital status.': 'திருமண நிலையைத் தேர்ந்தெடுக்கவும்.',
  'Please enter education and profession.': 'கல்வி மற்றும் தொழிலை உள்ளிடவும்.',
  "Please enter both 'from' and 'to' for the partner's age, or leave both empty.": 'துணையின் வயதுக்கு "முதல்", "வரை" இரண்டையும் உள்ளிடவும், அல்லது இரண்டையும் காலியாக விடவும்.',
  "Partner's age range looks wrong (for example 23 to 30).": 'துணையின் வயது வரம்பு சரியில்லை (உதாரணம்: 23 முதல் 30).',
  'Please enter your name / bureau name and area.': 'உங்கள் பெயர் / மையத்தின் பெயர் மற்றும் பகுதியை உள்ளிடவும்.',
  'Only brokers can add candidates.': 'தரகர்கள் மட்டுமே வரன்களைச் சேர்க்க முடியும்.',
  'Already handled.': 'ஏற்கனவே முடிவு செய்யப்பட்டது.',
  'Your broker ID is verified. You can now add and verify candidates.': 'உங்கள் தரகர் அடையாளம் சரிபார்க்கப்பட்டது. இப்போது வரன்களைச் சேர்த்துச் சரிபார்க்கலாம்.',
  'Your broker verification was not approved. Please upload a clear ID again.': 'உங்கள் தரகர் சரிபார்ப்பு ஏற்கப்படவில்லை. தெளிவான அடையாள ஆவணத்தை மீண்டும் பதிவேற்றவும்.',
  'This profile is blocked. Please contact support.': 'இந்த சுயவிவரம் தடுக்கப்பட்டுள்ளது. உதவிக்குத் தொடர்பு கொள்ளவும்.',
  'Your broker plan has expired, so your candidates are hidden and cannot search.': 'உங்கள் தரகர் திட்டம் முடிந்துவிட்டது; அதனால் உங்கள் வரன்கள் மறைக்கப்பட்டுள்ளன, தேடவும் முடியாது.',
  'Please verify your broker ID first.': 'முதலில் உங்கள் தரகர் அடையாளத்தைச் சரிபார்க்கவும்.',
  'Your documents are being checked. You can see matches once the admin approves.': 'உங்கள் ஆவணங்கள் சரிபார்க்கப்படுகின்றன. நிர்வாகி அங்கீகரித்ததும் வரன்களைப் பார்க்கலாம்.',
  'Only verified members can see profiles. Please upload your ID and photo first.': 'சரிபார்க்கப்பட்ட உறுப்பினர்கள் மட்டுமே வரன்களைப் பார்க்க முடியும். முதலில் உங்கள் அடையாள ஆவணம் மற்றும் புகைப்படத்தைப் பதிவேற்றவும்.',
  "No new verified profiles match both sides' choices right now. Please check again in a few days as new members join.": 'இப்போது இரு தரப்பு விருப்பத்துக்கும் பொருந்தும் புதிய சரிபார்க்கப்பட்ட வரன்கள் இல்லை. புதிய உறுப்பினர்கள் சேரும்போது சில நாட்களில் மீண்டும் பாருங்கள்.',
  'Not allowed.': 'அனுமதி இல்லை.', 'Your profile is not active or not verified.': 'உங்கள் சுயவிவரம் செயலில் இல்லை அல்லது சரிபார்க்கப்படவில்லை.',
  'This profile is no longer available (not renewed).': 'இந்த வரன் இப்போது கிடைக்கவில்லை (புதுப்பிக்கப்படவில்லை).', 'Interest already sent.': 'விருப்பம் ஏற்கனவே அனுப்பப்பட்டது.',
  'Interest not found.': 'விருப்பம் கிடைக்கவில்லை.', 'This interest was already answered.': 'இந்த விருப்பத்துக்கு ஏற்கனவே பதில் அளிக்கப்பட்டது.',
  'Cannot accept now: one of the profiles is not active (plan expired or not verified).': 'இப்போது ஏற்க முடியாது: ஒரு சுயவிவரம் செயலில் இல்லை (திட்டம் முடிந்தது அல்லது சரிபார்க்கப்படவில்லை).',
  'Declined. Your details were not shared.': 'மறுக்கப்பட்டது. உங்கள் விவரங்கள் பகிரப்படவில்லை.',
  'Accepted. Contact details are now shown to both sides under Interests.': 'ஏற்கப்பட்டது. தொடர்பு விவரங்கள் இப்போது இரு தரப்புக்கும் "விருப்பங்கள்" பக்கத்தில் காட்டப்படும்.',
};

// Messages that carry numbers, dates or codes.
const PATTERNS = [
  [/^Registered! Profile (ENK\d+) is free for (\d+) days\. Next: upload your ID and photo to get verified\.$/, '$1 பதிவு செய்யப்பட்டது! $2 நாட்கள் இலவசம். அடுத்து: சரிபார்ப்புக்கு உங்கள் அடையாள ஆவணம் மற்றும் புகைப்படத்தைப் பதிவேற்றுங்கள்.'],
  [/^Candidate (ENK\d+) added\. Upload their ID and photo to verify\.$/, 'வரன் $1 சேர்க்கப்பட்டது. சரிபார்க்க அவர்களின் அடையாள ஆவணம் மற்றும் புகைப்படத்தைப் பதிவேற்றுங்கள்.'],
  [/^Age must be (\d+)–70\. Legal marriage age in India is 18 for brides and 21 for grooms\.$/, 'வயது $1–70 ஆக இருக்க வேண்டும். இந்தியாவில் சட்டப்படி திருமண வயது மணமகளுக்கு 18, மணமகனுக்கு 21.'],
  [/^Your broker plan has expired\. Renew (₹[\d,]+) to add candidates\.$/, 'உங்கள் தரகர் திட்டம் முடிந்துவிட்டது. வரன்களைச் சேர்க்க $1 செலுத்திப் புதுப்பிக்கவும்.'],
  [/^You have reached the limit of (\d+) candidates per broker plan\.$/, 'ஒரு தரகர் திட்டத்தில் அதிகபட்சம் $1 வரன்களே சேர்க்க முடியும்.'],
  [/^Your plan ended on (.+?)\. Your profile is hidden from search\. Renew (₹[\d,]+) for 30 days to see matches again\.$/, 'உங்கள் திட்டம் $1 அன்று முடிந்தது. உங்கள் சுயவிவரம் தேடலில் மறைக்கப்பட்டுள்ளது. மீண்டும் வரன்களைப் பார்க்க 30 நாட்களுக்கு $2 செலுத்திப் புதுப்பிக்கவும்.'],
  [/^You have received all (\d+) profiles for this month \(plan till (.+?)\)\. Renew to get (\d+) more\.$/, 'இந்த மாதத்திற்கான $1 வரன்களையும் பெற்றுவிட்டீர்கள் (திட்டம் $2 வரை). மேலும் $3 வரன்களைப் பெறப் புதுப்பிக்கவும்.'],
  [/^(\d+) new verified match(?:es)? added\. This month: (\d+) of (\d+)\.$/, '$1 புதிய சரிபார்க்கப்பட்ட வரன்கள் சேர்க்கப்பட்டன. இந்த மாதம்: $3-இல் $2.'],
  [/^Interest sent to (ENK\d+)\. You will be notified when they reply\.$/, '$1-க்கு விருப்பம் அனுப்பப்பட்டது. அவர்கள் பதில் அளித்ததும் உங்களுக்குத் தெரிவிக்கப்படும்.'],
  [/^New interest for (ENK\d+)( \(.+?\))? from (ENK\d+) \(([\s\S]+)\)\. Accept to share contact details\.$/, (m, a, b, c, d) => `${a}${b || ''}-க்கு ${c}-இடமிருந்து புதிய விருப்பம் (${d}). தொடர்பு விவரங்களைப் பகிர ஏற்றுக்கொள்ளுங்கள்.`],
  [/^(ENK\d+) has declined the interest from (ENK\d+)\. Keep making du'a — more matches will come\.$/, '$2-இன் விருப்பத்தை $1 மறுத்துவிட்டார். துஆ செய்துகொண்டே இருங்கள் — மேலும் வரன்கள் வரும்.'],
  [/^(ENK\d+) accepted the interest from (ENK\d+)! Contact: (.+), (\+\d+)\. Please involve family \/ wali\.$/, '$2-இன் விருப்பத்தை $1 ஏற்றுக்கொண்டார்! தொடர்பு: $3, $4. குடும்பத்தினர் / வலீயை உடன் வைத்துப் பேசுங்கள்.'],
  [/^(ENK\d+) is verified! You can now see verified matching profiles\.$/, '$1 சரிபார்க்கப்பட்டது! இப்போது பொருத்தமான சரிபார்க்கப்பட்ட வரன்களைப் பார்க்கலாம்.'],
  [/^Verification of (ENK\d+) was not approved\. Please upload a clear ID and photo again\.$/, '$1 சரிபார்ப்பு ஏற்கப்படவில்லை. தெளிவான அடையாள ஆவணம் மற்றும் புகைப்படத்தை மீண்டும் பதிவேற்றவும்.'],
  [/^Payment received: (₹[\d,]+)\. Your plan is active till (.+?)\. All your candidates are visible again\.$/, 'கட்டணம் பெறப்பட்டது: $1. உங்கள் திட்டம் $2 வரை செயலில் உள்ளது. உங்கள் வரன்கள் அனைத்தும் மீண்டும் தெரியும்.'],
  [/^Payment received: (₹[\d,]+)\. Your plan is active till (.+?)\. You get (\d+) new matching profiles this month\.$/, 'கட்டணம் பெறப்பட்டது: $1. உங்கள் திட்டம் $2 வரை செயலில் உள்ளது. இந்த மாதம் $3 புதிய பொருத்தமான வரன்கள் கிடைக்கும்.'],
  [/^Reminder: your ENikah plan ends on (.+?)\. Renew (₹[\d,]+) to stay visible\.$/, 'நினைவூட்டல்: உங்கள் ENikah திட்டம் $1 அன்று முடிகிறது. தொடர்ந்து தெரிய $2 செலுத்திப் புதுப்பிக்கவும்.'],
  [/^Your plan has ended\. Profile (ENK\d+) is now hidden from search\. Renew (₹[\d,]+) to show it again\.$/, 'உங்கள் திட்டம் முடிந்தது. $1 சுயவிவரம் இப்போது தேடலில் மறைக்கப்பட்டுள்ளது. மீண்டும் காட்ட $2 செலுத்திப் புதுப்பிக்கவும்.'],
  [/^Reminder: your broker plan ends on (.+?)\. Renew (₹[\d,]+) to keep your candidates visible\.$/, 'நினைவூட்டல்: உங்கள் தரகர் திட்டம் $1 அன்று முடிகிறது. உங்கள் வரன்கள் தொடர்ந்து தெரிய $2 செலுத்திப் புதுப்பிக்கவும்.'],
  [/^Your broker plan has ended\. All your candidates are hidden\. Renew (₹[\d,]+) to show them again\.$/, 'உங்கள் தரகர் திட்டம் முடிந்தது. உங்கள் வரன்கள் அனைத்தும் மறைக்கப்பட்டுள்ளன. மீண்டும் காட்ட $1 செலுத்திப் புதுப்பிக்கவும்.'],
  [/^New verification request: ([\s\S]+)$/, 'புதிய சரிபார்ப்புக் கோரிக்கை: $1'],
  [/^Report on (ENK\d+) from (\+\d+): ([\s\S]*)$/, '$2 இடமிருந்து $1 பற்றிய புகார்: $3'],
  [/^Payment (₹[\d,]+) received from (.+) \((person|broker)\)\.$/, (m, a, b, c) => `${b} இடமிருந்து ${a} கட்டணம் பெறப்பட்டது (${c === 'broker' ? 'தரகர்' : 'உறுப்பினர்'}).`],
  [/^(ENK\d+) approved\.$/, '$1 அங்கீகரிக்கப்பட்டது.'], [/^(ENK\d+) rejected\.$/, '$1 நிராகரிக்கப்பட்டது.'],
  [/^Broker (\+\d+) approved\.$/, 'தரகர் $1 அங்கீகரிக்கப்பட்டார்.'], [/^Broker (\+\d+) rejected\.$/, 'தரகர் $1 நிராகரிக்கப்பட்டார்.'],
  [/^(ENK\d+) blocked — hidden from everyone\.$/, '$1 தடுக்கப்பட்டது — யாருக்கும் தெரியாது.'], [/^(ENK\d+) unblocked\.$/, '$1 தடை நீக்கப்பட்டது.'],
  [/^Added 30 days for (.+) \(cash (₹[\d,]+)\)\.$/, '$1-க்கு 30 நாட்கள் சேர்க்கப்பட்டன (ரொக்கம் $2).'],
];

// Stored values that appear inside notification text.
const VALS = ['Sunni Hanafi', 'Sunni Shafi', 'Sunni (other)', 'Never married', 'Divorced', 'Widowed', 'Bride', 'Groom', 'Shia'];

const fill = (s, vars) => vars ? s.replace(/\{(\w+)\}/g, (m, k) => k in vars ? String(vars[k]) : m) : s;

export function makeT(lang) {
  return (s, vars) => {
    s = String(s ?? '');
    let out = EN[s] ?? s;
    if (lang === 'ta') {
      if (TA[s] !== undefined) out = TA[s];
      else for (const [re, rep] of PATTERNS) if (re.test(s)) { out = VALS.reduce((o, v) => o.split(v).join(TA[v]), s.replace(re, rep)); break; }
    }
    return fill(out, vars);
  };
}

// For tests: every key the site uses should have a Tamil entry.
export const hasTamil = s => TA[s] !== undefined || PATTERNS.some(([re]) => re.test(s));
