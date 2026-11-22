# ENikah — Muslim matrimony WhatsApp bot

enikah.vasulbook.com · Node.js + PostgreSQL · WhatsApp Cloud API · Razorpay payment links · Railway

## Rules built in
- Registration free, first 30 days free.
- Renewal: bride/groom ₹2,000 / 30 days, broker ₹1,000 / 30 days (up to 10 candidates). Renewal extends from the current end date.
- Only verified profiles with an active plan are shown; not renewed = hidden at once. Broker candidates follow the broker's plan.
- Only verified users can see profiles. 5 profiles per plan month, matched both ways (asker's age range + maslak choice, and the other person's choice must fit the asker). Same city first.
- Profiles are viewed on a secure web page (WhatsApp policy forbids forwarding one customer's info to another inside chat). Name/photo hidden until both accept; then contacts are shared.
- ID + photo uploaded on the web page; admin approves in WhatsApp; ID image deleted after the decision.
- Reminders 3 days before and on expiry. Report (`report ENK1234 reason`), admin block (`block ENK1234`), and `delete` to erase your data.

## Setup
1. **New WhatsApp number** for ENikah only (don't reuse EMart/EDeal/Raise Academy — matrimony is close to WhatsApp's banned "dating services" category).
2. Meta app → WhatsApp → add the number. Webhook URL `BASE_URL/webhook`, verify token = `WA_VERIFY_TOKEN`, subscribe to `messages`.
3. Railway: this repo + a Postgres database. Set variables from `.env.example` (`DATABASE_URL=${{Postgres.DATABASE_URL}}`).
4. Custom domain `enikah.vasulbook.com` → CNAME to the Railway domain.
5. Razorpay → Webhooks → `BASE_URL/rzp/webhook`, event `payment_link.paid`, secret = `RAZORPAY_WEBHOOK_SECRET`.
6. Create these **Utility** message templates in WhatsApp Manager (language English). They are used only when the person hasn't messaged in 24 hours:

| Name | Body |
|---|---|
| enikah_reminder | Assalamu alaikum {{1}}, your ENikah plan ends on {{2}}. Reply RENEW to get your payment link and stay visible. |
| enikah_expired | {{1}}, your ENikah plan ended on {{2}} and {{3}} is now hidden from search. Reply RENEW to show it again. |
| enikah_interest | You have a new interest for profile {{1}} on ENikah. Reply INTERESTS to view and respond. |
| enikah_accepted | Good news: {{1}} accepted your interest on ENikah. Reply INTERESTS to see the contact details. |
| enikah_verified | ENikah verification for {{1}}: {{2}}. Reply MENU to continue. |
| enikah_paid | Payment of {{1}} received. Your ENikah plan is active till {{2}}. |
| enikah_admin | ENikah admin alert: {{1}}. Reply MENU to open the admin menu. |

Admins should message the bot at least once a day so alerts arrive as full messages with Approve/Reject buttons.

## Test
`DATABASE_URL=... npm test` runs the full flow (registration, verification, two-way matching, monthly limit, interests, renewal, expiry, reminders, templates, broker, admin, delete).
