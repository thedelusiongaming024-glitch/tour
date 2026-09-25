# Bug-fix report — savartour

Verification performed: `tsc --noEmit` clean, `eslint` 0 errors, `next build` compiles.
**Not** performed: runtime/end-to-end testing of booking → payment → callback flows.

## 0. Do these first (only you can)

1. **Rotate secrets.** The original `.env` was in the zip and not git-ignored. Treat the Supabase secret key, `JWT_SECRET` and `CLEARANCE_SECRET` as leaked. This package does NOT include `.env`; copy `.env.example` to `.env.local` and fill it in.
2. **Change the `admin` password** (was still `adminpassword123`): `node scripts/hash-password.mjs "<new password>"`, then run the printed `UPDATE public.staff_users ...` in Supabase.
3. **Supabase, in this order:** create a new *secret* key → set `SUPABASE_SECRET_KEY` → deploy and confirm the site works → run `supabase/secure_rls_policies.sql`. Running the SQL first breaks the site (the server was silently using the public key).
4. Set `SUPABASE_WEBHOOK_SECRET` if you use `/api/v1/supabase/webhook`.

## 1. Critical bugs fixed

| Bug | Fix |
|---|---|
| `payments/webhook` unauthenticated: anyone could mark a payment paid | Disabled unless simulator enabled (non-production or `ALLOW_PAYMENT_SIMULATOR=true`) |
| SSLCommerz success/IPN confirmed payments with no `val_id`; validation didn't check tran_id/amount | New `server/paymentVerification.ts`: requires `val_id`, matching `tran_id`, matching amount; `status` field of body ignored |
| `POST /clearance/<id>/pay {method:"host_cash"}` settled balance for free (token optional) | Cash settlement requires staff role; online pay requires valid token / owner / staff |
| `confirmPaymentSuccess` fabricated payments/bookings, not idempotent, double-credited concurrent callbacks | Rewritten: in-flight de-dup, idempotent, errors instead of inventing data, credit capped to amount owed, closed bookings flagged |
| Simulator fallback when gateway failed in production | Returns 502/503 in production |
| Public RLS (`USING (true)`) on all tables, incl. in `schema.sql` | New `secure_rls_policies.sql`; old scripts neutralized; `schema.sql` fixed |
| DB snapshot (customers, staff hashes, tickets) in a **public** bucket | Bucket made private in SQL |
| Customer tokens accepted as staff tokens; missing role checks on `alerts`, `admin/customers`, `admin/supabase/status` | Staff check verifies role; role guards added |
| `GET/PUT /customer/profile?phone=` unauthenticated | Fallback removed |
| `/tickets/<id>` leaked PII to anyone; clearance API returned the signed token to anyone | Access = staff / owner / valid token; token only returned to those |
| Hard-coded JWT/clearance secrets, default seed passwords, hard-coded Supabase keys | Env-only; fail closed in production; seed passwords from env or random |

## 2. Other bugs fixed

- Overbooking: bookings without seats never reduced availability; stored counter never restored; concurrent same-seat race (atomic re-check added); unpaid bookings held seats forever (2 h hold).
- Promo codes valid 24 h after expiry; forged `[Promo: …]` text in special requests.
- Duplicate booking references (`length + 1`); guessable booking/transaction IDs.
- Departure dates off by one (server-timezone vs UTC); now Asia/Dhaka.
- Background Supabase sync could roll back newer writes; table reads capped at 1,000 rows (now paginated).
- Hydration mismatch: `useSafeReducedMotion` had been applied to dead duplicate files; ported to live components, dead copies deleted.
- Added rate limiting (staff login, customer login, bookings, contact, payment initiation), input validation, `Secure` cookies in production.

## 3. Behaviour changes

- Old ticket QR codes without a token show a read-only status page; paying online needs the e-ticket link or a signed-in account.
- Production requires `JWT_SECRET` (≥32 chars) and `CLEARANCE_SECRET`.
- Payment gateway failure in production shows an error, not the fake payment page.

## 4. Not fixed (known)

- **Passwordless customer login** (phone only). Rate-limited only; needs SMS/WhatsApp OTP.
- **In-memory + JSON-file database** with Supabase sync: workable at current scale (see §5), but not a true multi-instance-safe architecture. Make Postgres the sole source of truth if traffic grows enough to need it.
- The rate limiter and payment-confirmation in-flight de-dup are in-memory and per-instance (see §5) — a soft, not hard, guard under real concurrent load across many serverless instances.
- 112 lint warnings (unused vars, `any`) remain.

## 5. Scaling for Vercel Hobby + Supabase Free (2026-09-21)

The single biggest problem: every public page (`/`, `/tours`, `/destinations`, `/journal`, `/about` and their detail pages) was `force-dynamic` with `revalidate: 0` — **every visitor re-ran the full page function**, which calls `loadDb()`, which polls Supabase for a full snapshot of every table. Under real traffic that burns through Supabase free tier's 5 GB/month egress and Vercel's free function-invocation allowance almost immediately.

| Change | Why |
|---|---|
| Public pages switched from `force-dynamic` to ISR (`revalidate: 120–300s`) | Vercel now serves cached HTML for most requests without invoking the function or touching Supabase at all. This is the main fix. |
| `revalidatePublicContent()` called from every admin content route (destinations, tours, offers, testimonials, blog posts, CMS) | Admin edits invalidate the cache immediately instead of waiting out the TTL. |
| `saveDb()`'s full-database backup snapshot (uploaded to Supabase Storage on *every* write) throttled to once per 5 min (`SUPABASE_SNAPSHOT_BACKUP_INTERVAL_MS`) | It was re-uploading the entire DB as JSON on every single booking/payment/edit — write volume scaled with total DB size, not with what changed. The per-record syncs (`syncBookingToSupabase` etc.) already make the write durable; this blob is just a backup. |
| Background full-table Supabase poll interval raised 15s → 45s, now configurable (`SUPABASE_SYNC_INTERVAL_MS`) | Extra headroom now that ISR absorbs most read traffic. |
| Local JSON cache path now `/tmp` on Vercel instead of `process.cwd()` | The deployed bundle directory is read-only in production; writes there were silently failing every time. `/tmp` is writable (though still ephemeral/per-instance — Supabase remains the real source of truth). |
| Added `/api/cron/keepalive` + `vercel.json` (daily cron, the max Hobby allows) | Supabase free projects **pause entirely** after 7 days with no activity — a paused project is a full outage until someone manually restores it from the dashboard. This ping prevents that. Set `CRON_SECRET` in Vercel's env vars to lock the endpoint down. |

**Still open / worth knowing about:**
- The payment-confirmation in-flight de-dup is in-memory, so it only works within a single warm serverless instance — under real concurrent load across many instances it's a soft, not hard, guard.
- The database is still fundamentally "Postgres + JSON-file/in-memory cache", not "Postgres as the only source of truth" — workable at this scale, but if traffic grows enough to need multiple warm instances simultaneously serving heavy write traffic, that architecture (not just these tuning changes) is what to revisit.
- Free-tier ceilings that no code change can lift: Supabase 500 MB DB, 5 GB/month egress, 7-day pause on idle; Vercel Hobby's usage-based pause if function invocations/GB-hours are exceeded. These changes buy a lot more headroom under those ceilings, not unlimited scale.

## 6. Rate limiting made exact across instances (optional) (2026-09-21)

`src/server/rateLimit.ts` now supports an optional Upstash Redis backend (REST API, no SDK, just `fetch`) alongside the existing in-memory fallback. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (free tier at upstash.com) and login attempts, booking creation, payment initiation, and the contact form are rate-limited exactly across every serverless instance instead of per-instance. Without those env vars set, behaviour is unchanged from before (in-memory, per-instance). `limitOr429`/`rateLimit` are now `async` — all 6 call sites were updated to `await` them.

## 7. Follow-up security review (2026-09-22)

Re-audited every API route (`src/app/api/v1/**`), `src/server/auth.ts`, `access.ts`,
`clearance.ts`, `paymentVerification.ts`, `rateLimit.ts`, and the client auth helpers
against the fixes above. All the previously-reported issues remain fixed; `tsc --noEmit`,
`eslint`, and `next build` are clean (same 112 pre-existing lint warnings, 0 errors).

One real gap found and fixed:

| Bug | Fix |
|---|---|
| Customer session cookie (`atithi_customer_token`) was not `httpOnly` — any XSS on the site could read it straight out of `document.cookie` and impersonate the customer for up to 30 days. Client code also independently re-set the same cookie via `document.cookie = ...` right after login/booking, which (being JS-set) can never carry `HttpOnly`, and would silently strip the flag off the server-set cookie even if the server alone had been fixed. | `customerCookieOptions()` now sets `httpOnly: true`; added `clearedCustomerCookieOptions()` and a new `POST /api/v1/auth/customer/logout` route to clear it server-side (JS can no longer clear an httpOnly cookie itself). Removed the redundant/overriding `document.cookie` writes in `BookingForm.tsx` and `profile/page.tsx` — the server already sets the cookie on the same response — and wired `handleLogout` in `profile/page.tsx` to call the new logout endpoint instead. |

This does not change the token's exposure via `localStorage` (`atithi_customer_token` /
`atithi_customer`), which the app still relies on to attach an `Authorization: Bearer`
header for cross-purpose fetches — that remains readable by any XSS, same as before. A
future hardening step would be to drop the `Authorization` header path entirely and rely
solely on the httpOnly cookie (already sent automatically per `getCustomerFromRequest`),
removing the need to keep a JS-readable copy of the token at all.
