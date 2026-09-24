# RADAR.

An automation-first India opportunities feed.

## What is built
- Static, mobile-friendly opportunity feed
- Search and category filters
- JSON data layer separated from presentation
- GitHub Actions publishing workflow
- Seed opportunities so the site is useful immediately
- Architecture ready for automated ingestion

## Next automation layer
The repository is intentionally structured so public RSS/API sources can be added without changing the front-end. The ingestion job should normalise each source into the schema used by `data/opportunities.json`, deduplicate by URL/title/company, and commit only changed data.

## Important
This MVP does not claim that every listing is currently open. The seed links are discovery/search links. Automated source-specific ingestion should only use sources whose terms permit it.

## Deployment
Enable GitHub Pages using GitHub Actions in repository settings. The included workflow publishes the repository root.

## Monetisation path
1. Build traffic around a narrow audience.
2. Add employer paid listings.
3. Add sponsored opportunity slots.
4. Add qualified lead/referral partnerships where permitted.
5. Keep the core feed free.

