# 12-03 Summary: Static SEO Assets and Public Alert Share Metadata

## Completed: 2026-04-04

## Changes Made

### Static crawler assets
- Added [public/robots.txt](/home/exxeed/dev/projects/bantayogalert/public/robots.txt) with public allow rules and `/app`, `/auth`, `/admin`, `/profile` disallows
- Added [public/sitemap.xml](/home/exxeed/dev/projects/bantayogalert/public/sitemap.xml) for `/`, `/public/map`, and `/public/alerts`
- Added the shared social asset at [public/og-image.svg](/home/exxeed/dev/projects/bantayogalert/public/og-image.svg)

### Hosting rewrite
- Updated [firebase.json](/home/exxeed/dev/projects/bantayogalert/firebase.json) so `/public/alerts/**/share` routes to the metadata function

### Public alert metadata function
- Added [functions/src/public/renderPublicAlertMeta.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/public/renderPublicAlertMeta.ts) to render alert-specific `<title>`, description, canonical, and `og:*` tags for published alerts only
- Exported `renderPublicAlertMeta` from [functions/src/index.ts](/home/exxeed/dev/projects/bantayogalert/functions/src/index.ts)

## Verification
- Static crawler assets now ship from `public/`
- Published alerts have a server-rendered share path with alert-specific OG tags
- The metadata function redirects human traffic back to the SPA alert detail route after metadata resolution
