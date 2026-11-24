# ENikah — verified Muslim matrimony (website)

enikah.vasulbook.com · Node.js + PostgreSQL · Razorpay payment links · Resend email · Railway

## What members can do
- **Register** with mobile number + password (email optional, for alerts and password reset). Bride/groom (self or family) or marriage broker.
- **Free first 30 days**, then ₹2,000 / 30 days (brides & grooms) or ₹1,000 / 30 days (brokers, up to 10 candidates). Renewing adds 30 days to the current end date.
- **Verification:** upload ID + photo; admin approves on the admin page; ID image is deleted after the decision.
- **Matches:** 5 verified, active profiles per plan month, matched both ways (age range + maslak), same city first. Earlier matches stay listed.
- **Privacy:** cards show no name, phone or photo. When an interest is accepted, both sides see name, phone (call / WhatsApp link) and photo.
- **Expiry:** profiles not renewed are hidden at once; broker candidates follow the broker's plan. Reminders 3 days before and on expiry (on the site + email).
- Report a profile, edit profile, change password, delete account.

## Admin (log in with an ADMIN_PHONES number)
Stats, pending verifications with documents, approve/reject, reports, block/unblock, find by ENK number, and "Add 30 days" for cash payments.

## Setup
1. Railway: this repo + Postgres. Variables from `.env.example` (`DATABASE_URL=${{Postgres.DATABASE_URL}}`).
2. DNS: `enikah` CNAME to the Railway target, plus the `_railway-verify` TXT record.
3. Register on the site with the admin number first — it opens the admin panel.
4. Razorpay: add keys; webhook `BASE_URL/rzp/webhook`, event `payment_link.paid`, secret = `RAZORPAY_WEBHOOK_SECRET`.
5. Optional email: Resend API key + verified sender domain (`MAIL_FROM`).

## Test
`DATABASE_URL=... npm test` — 46 end-to-end checks (accounts, verification, two-way matching, monthly limit, interests, contacts, photos, renewal, expiry, reminders, broker, admin, delete).
