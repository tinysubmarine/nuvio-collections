# Nuvio collections

Personalized home-screen collections for the Nuvio app, built from TMDB feeds so
they need no addons.

## Files

- `spec.mjs` is the source of truth. Collections, tabs (folders), and the TMDB
  filters behind each tab live here.
- `build.mjs` turns the spec into `collections.json` and checks it against the
  same rules Nuvio's importer enforces.
- `collections.json` is the generated file you import.

## Rebuild and import

```sh
node build.mjs
```

Then on https://nuvio.tv/account?tab=collections click Import, choose
`collections.json`, and pick Replace to swap out the old collections (or Add to
keep them). Rows sync to your devices on the next app refresh.

Tabs such as New Horror and Airing Now use date windows resolved at build time,
so rerun the build every month or two to move the window forward.

## Editing

Each tab is one or more TMDB sources. Discover sources take TMDB genre, keyword,
company, and network ids; the ids in use are listed at the top of `spec.mjs`.
To find a new keyword id, search https://www.themoviedb.org/search/keyword?query=...
and read the number in the result link. In a keyword filter, `|` means any and
`,` means all.

## AI Picks

`picks.json` is a hand-curated list of titles chosen from your Nuvio watch
history, with a one-line reason for each. Nuvio shows it as the pinned
"AI Picks" collection by reading a public list on your TMDB account.

One-time setup (needs a free TMDB account):

1. On themoviedb.org open Settings > API and copy the API Read Access Token.
2. `TMDB_READ_TOKEN=... node push-picks.mjs login` and approve the link.
3. `node push-picks.mjs` creates the list and saves its id to `picks.config.json`.
4. `node build.mjs` now includes AI Picks; re-import `collections.json` once.

To refresh the picks, ask Claude Code to update `picks.json` from your latest
watch history, then run `node push-picks.mjs`. No re-import is needed because
the collection points at the list, not the titles.

`picks.config.json` holds your TMDB access token, so keep it out of git.

## Optional result check

With a free TMDB API key you can confirm every tab returns results:

```sh
TMDB_API_KEY=yourkey node check.mjs
```

It flags any tab with fewer than 12 results so you can loosen its filters.
