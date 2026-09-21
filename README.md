# GlobalNews Today v2.0

Premium English international news website with a Bengali-only admin panel.

## v1.5 highlights
- Light mode is the default; Dark/Light preference is persisted.
- Responsive editorial layout for phone, tablet and desktop.
- `/admin` route with secure server/Worker credential validation.
- Admin CRUD: create, edit, delete, publish/unpublish, featured, breaking, category, country, image, author, tags and publication time.
- Public website remains English; admin interface is Bengali.
- Collector Telemetry UI removed.
- Public article metadata does not expose feed/source names or external source URLs.
- Cloudflare Worker scheduled collector remains on a 30-minute cron.
- Duplicate prevention by normalized title and source URL/fingerprint.
- Premium share actions with article URL, headline and image metadata.
- Display-only article view labels are stable per article (12K–99.9K style) and do not change on each render.
- Adsterra Banner 728×90 and Native Banner are integrated. New article pages automatically inherit the ad slots from the shared article template.

## Cloudflare Worker setup
Create a KV namespace and replace the placeholder namespace ID in `wrangler.toml`.
Configure these Worker secrets/variables in Cloudflare:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SECRET`

The collector schedule is:
`*/30 * * * *`

The admin password is intentionally not committed to this repository.

## Adsterra
The project includes the two supplied ad placements:
- 728×90 Banner
- Native Banner

No Popunder or Social Bar code is included.

## Build
Run:
```bash
npm install
npm run build
```

For Cloudflare production admin authentication, configure only `ADMIN_PASSWORD` and `ADMIN_SECRET` as Worker secrets. The production frontend never contains either value.

## v1.8 Admin API and Cloudflare deployment fix

Admin authentication is handled by the Cloudflare Worker.

Required Cloudflare secrets (never commit these values):
- `ADMIN_PASSWORD`
- `ADMIN_SECRET`

Admin login uses `POST /api/admin/login` with `{ "password": "..." }` and returns a signed, expiring bearer token. Protected article CRUD endpoints require `Authorization: Bearer <token>`.

Worker configuration uses:
- Worker: `globalnews-news-collector`
- KV binding: `NEWS_KV`
- Cron: `*/30 * * * *`
- KV namespace ID: `5cd9bc731aad4577ac3b58b5f9419ffc`

Set secrets with Cloudflare Wrangler or the Cloudflare Dashboard Variables and Secrets UI. Never place real secret values in source control.

## v2.0 deployment notes

- The production frontend defaults to `https://globalnews-news-collector.hafejnayem1743.workers.dev` for API requests when `VITE_NEWS_API_URL` is not provided.
- `ADMIN_PASSWORD` and `ADMIN_SECRET` are read only from the Cloudflare Worker environment.
- `/api/admin/login` returns JSON for success, authentication failure, invalid JSON, missing secrets, unsupported methods, and CORS preflight.
- Admin bearer tokens are HMAC-SHA-256 signed and expire after 12 hours.
- The Worker keeps the existing RSS feeds, KV namespace, public APIs, manual collector authentication, and 30-minute scheduled collector.
- `bun.lock` is intentionally absent; use npm/package-lock for the Pages build.


## v2.0 Paid Advertisement System

- Public `/advertise` submission flow with preview and server-side validation.
- Server-side verification sessions; the supplied advertising Smartlink is treated only as an external advertising step, not as proof of human verification or payment.
- Optional Cloudflare Turnstile support via `TURNSTILE_SECRET` and `VITE_TURNSTILE_SITE_KEY`.
- Payment request flow for USDT BEP20/TRC20 with payment proof kept private to admins.
- Advertisement requests are stored in the existing `NEWS_KV` namespace.
- Admin advertisement review, edit, approve/publish, reject, unpublish and cancel controls.
- Approved paid posts are labelled `Sponsored` and use the normal GlobalNews Today article layout.
- No payment is auto-approved from a Smartlink visit, countdown, screenshot upload or client-side flag.

## v2.1 Advertisement System Audit & Fixes

- Separated verification-start, verification-confirm, advertisement-create, payment-submit, and admin-sensitive rate-limit buckets.
- Fixed KV rate-limit TTL handling so expiration is never written as zero/negative.
- Added verification-session replay/idempotency handling and request recovery after duplicate submissions.
- Added server-side advertisement request GET using the matching verification session.
- Added server-side advertisement state-transition checks.
- Added real advertisement dashboard statistics, search, filtering, sorting, pagination, and request detail review.
- Added private admin-only payment proof viewing; payment proof is never exposed by public APIs.
- Added explicit reject reason requirement, safe unpublish behavior, and article removal on delete.
- Approved advertisements continue to use the normal article system with `Sponsored` and `Advertisement` tags.
- Preserved the existing Worker name, KV namespace, cron collector, admin authentication, public news APIs, routing, SEO, and Adsterra integration.

### Validation

- Worker TypeScript compile check: passed.
- Frontend TS/TSX syntax/transpile check: passed for all source files.
- Full `npm install --legacy-peer-deps` / `npm run build` could not be completed in the build environment because npm dependency installation timed out twice; this is an environment/network limitation, not a claimed successful frontend build.
