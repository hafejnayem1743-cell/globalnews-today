# GlobalNews Today v1.6

Premium English international news website with a Bengali-only admin panel.

## v1.5 highlights
- Light mode is the default; Dark/Light preference is persisted.
- Responsive editorial layout for phone, tablet and desktop.
- `/admin` route with secure server/Worker credential validation.
- Admin CRUD: create, edit, delete, publish/unpublish, featured, breaking, category, country, image, author, tags and publication time.
- Public website remains English; admin interface is Bengali.
- Collector Telemetry UI removed.
- Admin login uses password-only authentication (no admin email field).
- Admin API can manage published and unpublished articles.
- Homepage uses a global deduplication pass so one story is not repeated across sections.
- Latest stories are surfaced on the homepage and article pages render the full stored content with headline, image and text.
- Public article metadata does not expose feed/source names or external source URLs.
- Cloudflare Worker scheduled collector remains on a 30-minute cron.
- Duplicate prevention by normalized title and source URL/fingerprint.
- Premium share actions with article URL, headline and image metadata.
- Display-only article view labels are stable per article (12K–99.9K style) and do not change on each render.
- Adsterra Banner 728×90 and Native Banner are integrated. New article pages automatically inherit the ad slots from the shared article template.

## Cloudflare Worker setup
Create a KV namespace and replace the placeholder namespace ID in `wrangler.toml`.
Configure these Worker secrets/variables in Cloudflare:
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

For local API mode, `ADMIN_PASSWORD` may be supplied as an environment secret. The packaged local fallback is the configured admin password, while Cloudflare production should use an `ADMIN_PASSWORD` secret and `ADMIN_SECRET`.
