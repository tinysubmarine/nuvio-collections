// Turns picks.json into a static Stremio-style addon under addon/ so Nuvio can
// show the picks as a normal row of tiles on the home screen.
// Run by push-picks.mjs, or directly:  node build-addon.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const root = new URL('./', import.meta.url);
const config = JSON.parse(readFileSync(new URL('picks.config.json', root), 'utf8'));
const picks = JSON.parse(readFileSync(new URL('picks.json', root), 'utf8'));
const IMG = 'https://image.tmdb.org/t/p/';

async function tmdb(path) {
  const r = await fetch(`https://api.themoviedb.org/3${path}`, { headers: { Authorization: `Bearer ${config.readToken}` } });
  if (!r.ok) throw new Error(`TMDB ${path}: ${r.status}`);
  return r.json();
}

const metas = { movie: [], series: [] };
for (const p of picks.items) {
  const d = await tmdb(`/${p.type}/${p.tmdbId}?append_to_response=external_ids`);
  const imdb = d.external_ids?.imdb_id || d.imdb_id;
  if (!imdb) { console.warn(`skip ${p.title}: no IMDb id`); continue; }
  const type = p.type === 'tv' ? 'series' : 'movie';
  const date = d.release_date || d.first_air_date || '';
  metas[type].push({
    id: imdb,
    type,
    name: d.title || d.name || p.title,
    poster: d.poster_path ? `${IMG}w500${d.poster_path}` : undefined,
    background: d.backdrop_path ? `${IMG}w1280${d.backdrop_path}` : undefined,
    description: p.why ? `${p.why}. ${d.overview || ''}`.trim() : d.overview,
    releaseInfo: date.slice(0, 4),
    imdbRating: d.vote_average ? d.vote_average.toFixed(1) : undefined,
    genres: (d.genres || []).map((g) => g.name),
  });
  await new Promise((r) => setTimeout(r, 60));
}

const manifest = {
  id: 'io.github.tinysubmarine.nuvio-picks',
  version: `1.0.${Math.floor(Date.now() / 1000)}`,
  name: 'AI Picks',
  description: picks.description,
  resources: ['catalog'],
  types: ['movie', 'series'],
  idPrefixes: ['tt'],
  catalogs: [
    { type: 'movie', id: 'ai-picks', name: 'AI Picks' },
    { type: 'series', id: 'ai-picks', name: 'AI Picks' },
  ],
  behaviorHints: { configurable: false },
};

mkdirSync(new URL('addon/catalog/movie/', root), { recursive: true });
mkdirSync(new URL('addon/catalog/series/', root), { recursive: true });
writeFileSync(new URL('addon/manifest.json', root), JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(new URL('addon/catalog/movie/ai-picks.json', root), JSON.stringify({ metas: metas.movie }, null, 2) + '\n');
writeFileSync(new URL('addon/catalog/series/ai-picks.json', root), JSON.stringify({ metas: metas.series }, null, 2) + '\n');
console.log(`addon/: ${metas.movie.length} movies, ${metas.series.length} series`);
