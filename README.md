# GlobalNews Today v1.8

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

## v1.8 deployment notes

- The production frontend defaults to `https://globalnews-news-collector.hafejnayem1743.workers.dev` for API requests when `VITE_NEWS_API_URL` is not provided.
- `ADMIN_PASSWORD` and `ADMIN_SECRET` are read only from the Cloudflare Worker environment.
- `/api/admin/login` returns JSON for success, authentication failure, invalid JSON, missing secrets, unsupported methods, and CORS preflight.
- Admin bearer tokens are HMAC-SHA-256 signed and expire after 12 hours.
- The Worker keeps the existing RSS feeds, KV namespace, public APIs, manual collector authentication, and 30-minute scheduled collector.
- `bun.lock` is intentionally absent; use npm/package-lock for the Pages build.
