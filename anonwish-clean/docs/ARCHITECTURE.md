# Architecture

## Layout
- `src/app`: pages and route handlers (`/api/*`, `/auth/*`, `/api/webhooks/[provider]`)
- `src/db`: Drizzle schema, client, seed
- `src/lib/payments`: `PaymentProvider` interface, router, four adapters
- `src/lib/fulfillment*.ts`: fulfillment start, webhook state machine (pure `decide()` + transactional `applyEvent()`)
- `supabase/rls_and_storage.sql`: RLS lockdown and image bucket

## How anonymity works
1. A donor never has an account. `/api/fulfill` issues an httpOnly cookie holding a random token; only an HMAC of it (`donor_token_hash`) is stored, so the donor can view their own payment status on `/thanks` and nobody can reverse it.
2. `fulfillments` holds no donor name or email. The optional receipt email lives in `donor_receipts`, AES-256-GCM encrypted, and is deleted as soon as the receipt is sent.
3. Public pages and APIs read wishes only through `publicWishColumns` (`lib/public-wish.ts`), which excludes `userId` and every fulfillment field. A unit test pins that list.
4. The wisher dashboard exposes one donor-originated field: the optional private message.
5. Row Level Security is enabled on every table with no policies, so the public Supabase REST API with the anon key returns nothing. The app reads and writes through its own server-side connection.
6. Limits: the payment provider sees payment details, administrators with database access can see fulfillment records, and a donor can de-anonymise themselves in a private message. The privacy policy says "anonymous to wishers and the public" for that reason.

## Payment flow
1. Donor clicks "Fulfil anonymously". `/api/fulfill` (same-origin check, rate limit, Zod) calls `startFulfillment`: wish must be open, `pickProvider(currency)` chooses an adapter (KES: M-Pesa, Paystack, Flutterwave, Stripe; NGN/GHS/ZAR: Paystack first; USD/EUR/GBP: Stripe first; others: Flutterwave), a `pending` fulfillment is inserted, and a hosted checkout is created. Amount = the wish's maximum estimate, so a gift always fulfils the wish completely.
2. The provider calls `/api/webhooks/<provider>`. The adapter verifies authenticity (Stripe signature, Paystack HMAC-SHA512, Flutterwave hash header, M-Pesa secret in callback URL) and returns a `NormalizedEvent`.
3. `applyEvent` locks the fulfillment and wish rows and runs `decide()`:
   - matching payment on an open wish: fulfillment `paid`, wish `funded`, wisher emailed (no donor detail), receipt sent, receipt email deleted
   - replayed event: ignored (idempotent)
   - amount or currency mismatch: not funded, logged for admin
   - payment on a wish that is no longer open (second donor, removed wish): auto-refund, or logged as manual refund for M-Pesa
4. "Escrow-like" means funds sit in the platform's provider account until an admin marks the wish `fulfilled` or refunds it. Fulfilment is admin-assisted: buy the item or issue a gift card, then mark fulfilled. Option (c), letting wishers claim funds directly, is deliberately not built: it is the main fraud and money-transmission risk.
5. Stripe Connect payouts and the `PLATFORM_FEE_BPS` fee are the extension point for automated vendor or wisher payouts.

## Moderation and abuse controls
Keyword rules block links, emails, phone numbers and off-platform payment requests at create and edit. Users can report any wish; admins dismiss or remove. Rate limits cover wish creation, uploads, fulfillment attempts and reports (in-memory today, see `lib/ratelimit.ts`). Per-currency wish caps apply. Same-origin checks protect mutating routes; images are accepted only by magic-byte type, 2 MB max, 3 per wish, from the user's own storage folder.

## Admin
`/admin` (role `admin` only, enforced server-side in every action): open reports, paid fulfillments (mark fulfilled, refund), recent open wishes (remove), audit log. Every action writes to `admin_logs`. Promote with `npm run admin:promote -- email`.

## GDPR
`DELETE /api/account` anonymises the user row, blanks the content of their wishes, deletes their images and the Supabase auth identity. It refuses while any of their wishes are funded and unfulfilled. Paid fulfillment rows are kept for financial records but hold no donor identity.

## Known gaps and next recommended features
- Distributed rate limiting (Upstash/Redis) and CAPTCHA on wish creation
- Real shipping and vendor integrations; automated Stripe Connect payouts
- KYC for gifts above the MVP caps; velocity limits per donor token
- Reputation and verification for wishers; leaderboards without identity
- AI moderation behind the existing async `moderate()` function
- Integration and end-to-end tests (Supabase local + provider sandboxes), and Sentry
- Wish expiry job (the `expired` status exists but nothing sets it yet)
- Strict Content-Security-Policy
