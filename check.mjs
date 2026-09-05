// Optional: confirm every Discover tab returns results on TMDB.
// Usage: TMDB_API_KEY=yourkey node check.mjs   (free key from themoviedb.org/settings/api)
import { readFileSync } from 'node:fs';

const key = process.env.TMDB_API_KEY;
if (!key) { console.error('Set TMDB_API_KEY'); process.exit(1); }

const PARAM = {
  withGenres: 'with_genres', withoutGenres: 'without_genres', voteAverageGte: 'vote_average.gte',
  voteAverageLte: 'vote_average.lte', voteCountGte: 'vote_count.gte', withOriginalLanguage: 'with_original_language',
  withOriginCountry: 'with_origin_country', withKeywords: 'with_keywords', withoutKeywords: 'without_keywords',
  withCompanies: 'with_companies', withoutCompanies: 'without_companies', withNetworks: 'with_networks',
};

const collections = JSON.parse(readFileSync(new URL('./collections.json', import.meta.url), 'utf8'));
let thin = 0;
for (const c of collections) {
  for (const f of c.folders) {
    for (const s of f.sources) {
      if (s.tmdbSourceType !== 'DISCOVER') continue;
      const tv = s.mediaType === 'TV';
      const q = new URLSearchParams({ api_key: key, sort_by: s.sortBy, page: '1' });
      for (const [k, v] of Object.entries(s.filters)) {
        if (PARAM[k]) q.set(PARAM[k], v);
        else if (k === 'releaseDateGte') q.set(tv ? 'first_air_date.gte' : 'primary_release_date.gte', v);
        else if (k === 'releaseDateLte') q.set(tv ? 'first_air_date.lte' : 'primary_release_date.lte', v);
      }
      const r = await fetch(`https://api.themoviedb.org/3/discover/${tv ? 'tv' : 'movie'}?${q}`);
      const j = await r.json();
      const n = j.total_results ?? 0;
      if (n < 12) thin++;
      console.log(`${n < 12 ? 'THIN ' : 'ok   '}${String(n).padStart(6)}  ${c.title} / ${f.title} / ${s.title}`);
      await new Promise((res) => setTimeout(res, 120));
    }
  }
}
console.log(thin ? `${thin} tab(s) have fewer than 12 results; consider loosening their filters in spec.mjs` : 'all tabs have results');
