# AnonWish

Post a wish, or fulfil someone else's anonymously. Next.js 15 (App Router) + TypeScript + Tailwind, Supabase (Postgres, Auth, Storage), Drizzle, and a provider-agnostic payment layer (Stripe, Flutterwave, Paystack, M-Pesa).

**Polished MVP scaffold** — clean responsive UI, strong anonymity guarantees, multi-provider payments, admin tools, tests, and deployment docs. Architecture, anonymity model and payment flow: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Run locally

Prereqs: Node 20+, Docker, `psql`, [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
npm install
npx supabase init && npx supabase start   # prints API URL, anon key, service-role key, DB URL
cp .env.example .env                      # fill in values from `supabase start`
openssl rand -hex 32                      # → DONOR_HASH_SECRET
openssl rand -base64 32                   # → RECEIPT_ENCRYPTION_KEY (exactly 32 bytes when decoded)
npm run db:migrate && npm run db:harden && npm run db:seed
npm run dev                               # http://localhost:3000
```

Local magic-link emails appear in Supabase's Inbucket (URL printed by `supabase start`). Set only the payment provider keys you have; a provider with blank keys is disabled automatically.

## Checks

```bash
npm run lint && npm run typecheck && npm test   # same as CI (.github/workflows/ci.yml)
```

## Deploy (Vercel + Supabase)

1. Create a Supabase project. Use its connection string for `DATABASE_URL` (session pooler preferred).
2. Copy `.env.example` → `.env.production`, fill it in, set `NEXT_PUBLIC_SITE_URL` to your final HTTPS URL.
3. `vercel login`, then `./scripts/deploy.sh` (migrates, applies RLS + storage bucket, syncs env vars, deploys).
4. Register webhooks (table below), then add Supabase Auth redirect URL `https://YOUR_DOMAIN/auth/callback`.
5. Sign in once on the site, then `npm run admin:promote -- you@example.com`.

Admin is a role on a normal account (no pre-seeded admin credentials).

## Payment webhooks

| Provider     | URL                          | Setup |
|--------------|------------------------------|-------|
| Stripe       | `/api/webhooks/stripe`       | Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`. Put the signing secret in `STRIPE_WEBHOOK_SECRET`. |
| Paystack     | `/api/webhooks/paystack`     | Dashboard → Settings → API & Webhooks. Signed with your secret key. |
| Flutterwave  | `/api/webhooks/flutterwave`  | Set a secret hash in the dashboard; same value in `FLUTTERWAVE_WEBHOOK_HASH`. |
| M-Pesa       | automatic                    | STK callback URL is built from `NEXT_PUBLIC_SITE_URL` + `MPESA_CALLBACK_SECRET`. Must be public HTTPS. |

Test cards: Stripe `4242 4242 4242 4242`; Paystack / Flutterwave test keys from their docs; M-Pesa sandbox shortcode + passkey from Daraja.

## Demo script (≈ 5 minutes)

1. Browse `/wishes` signed out — filter by category, search, sort.
2. Sign in with magic link, post a wish (optionally with image) at `/wishes/new`.
3. In a private window (no login), open the wish → “Fulfil anonymously” → pay in test mode.
4. Return to the wish page: status is **Funded**, nothing identifies the donor. On the wisher’s `/dashboard` only the optional private message appears.
5. As admin open `/admin`: mark fulfilled or refund. Report a wish from its page and dismiss/remove it in admin.

## Environment checklist

- [ ] `DATABASE_URL`, three Supabase keys, `NEXT_PUBLIC_SITE_URL` (HTTPS in production)
- [ ] `DONOR_HASH_SECRET`, `RECEIPT_ENCRYPTION_KEY` (32 bytes base64). Losing the latter makes unsent receipt emails unreadable.
- [ ] At least one payment provider fully configured, webhook registered, and listed in `PAYMENTS_ENABLED`
- [ ] `RESEND_API_KEY` + verified `EMAIL_FROM` domain
- [ ] `npm run db:harden` run (RLS on, `wish-images` bucket exists)
- [ ] Supabase Auth: redirect URL added; Google provider + `NEXT_PUBLIC_GOOGLE_AUTH=true` if wanted
- [ ] Terms and Privacy pages reviewed (placeholders filled)
- [ ] First admin promoted

## Verified status (this polished build)

- Type-safe (`tsc --noEmit` clean)
- Lint clean
- Unit tests covering: webhook signatures (all 4 providers), fulfillment state machine (idempotency, duplicate-payment refunds), anonymity invariants, crypto, moderation, validation, payment router
- UI polish: responsive layout, dark/light mode with mounted-safe toggle, skeleton loading, sticky header with backdrop, improved empty states & result counts, status-colored badges, better forms and CTAs
- Anonymity design documented and unit-tested (`publicWishColumns` pin)

**Not verified in this environment:** live deployment, real provider calls, browser/E2E tests. Always run a full test-mode payment through every provider you enable before launch and confirm against current provider docs.

## Next recommended features

- Distributed rate limiting (Upstash) + CAPTCHA on wish creation
- Real shipping / vendor integrations + automated Stripe Connect payouts
- KYC / velocity limits for larger gifts
- Reputation for wishers + anonymous leaderboards
- AI moderation hook (behind existing `moderate()`)
- Wish expiry job, stricter CSP, Sentry, Playwright E2E
