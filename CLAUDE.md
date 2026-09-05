# Agent notes for ~/code/nuvio

Personalized Nuvio (nuvio.tv) home-screen setup for David. See README.md for
the user-facing workflow. These are the non-obvious facts learned the hard way.

## Layout of the pieces

- `spec.mjs` -> `node build.mjs` -> `collections.json`, imported by hand on
  https://nuvio.tv/account?tab=collections with the Overwrite mode.
- `picks.json` -> `node push-picks.mjs` -> TMDB list 8692488 **and** the static
  addon in `addon/` (via `build-addon.mjs`). Commit + push publishes the addon
  through GitHub Pages at
  https://tinysubmarine.github.io/nuvio-collections/addon/manifest.json.
- `picks.config.json` holds the TMDB read token and a v4 user access token.
  It is gitignored. Never commit it or print it.
- Git pushes go to github.com/tinysubmarine/nuvio-collections. The `gh` CLI
  has two accounts; use `tinysubmarine`, not `david-bergeron-honestly`.

## Nuvio gotchas (verified against NuvioTV source, Sept 2026)

- **Rating max must be set explicitly on every Discover source.** After an
  import, the TV client syncs the collections back and rewrites empty numeric
  filter fields as `0`. `voteAverageLte: 0` makes TMDB return nothing, so every
  folder opens blank (title and icon only). `build.mjs` pins
  `voteAverageLte: "10"` on all Discover sources; keep that. Empty `tmdbId`
  also becomes `0`, which is harmless for Discover.
- **Collections only ever render as folder cards on the home screen**, no matter
  the `viewMode`. Rows of clickable posters on Home come only from addon
  catalogs. That is why AI Picks is served as an addon, not a collection.
- **Pinned collections always render above every catalog row.** To put addon
  rows (like AI Picks) above the collections, collections must be unpinned and
  the order set on the TV under Settings > Addons > Reorder home catalogs.
  The website's TV Settings tab has no row-order control.
- TMDB source types in a folder: LIST, COLLECTION, COMPANY, NETWORK, DISCOVER,
  PERSON, DIRECTOR. Non-Discover types need a numeric `tmdbId`. TV sources sort
  with `first_air_date.desc`, movies with `primary_release_date.desc`.
- TMDB v4 `GET /list/{id}/clear` returned 404 for a freshly created list, so
  `push-picks.mjs` deletes items page by page instead.
- The Cloud API docs only document addon `catalogSources`; the real import
  shape (TMDB/Trakt `sources`) comes from the website bundle's importer.
  `validate.cjs` in a scratchpad ran that importer in Node; rebuild it from
  the chunk under `/_next/static/chunks/` if the format needs re-checking.

## Refreshing picks

1. Read the Watched tab on nuvio.tv (paginated; 3+ pages) and drop any pick
   that now appears there.
2. Add replacements with verified TMDB ids (`api.themoviedb.org/3/search`
   with the read token works from Node).
3. `node push-picks.mjs`, then commit and push. GitHub Pages takes about a
   minute; the manifest version bumps on every build so Nuvio sees the change.
