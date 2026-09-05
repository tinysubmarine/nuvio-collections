// Generates collections.json for import at https://nuvio.tv/account?tab=collections
// Usage: node build.mjs
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { collections, aiPicks, WINDOWS } from './spec.mjs';

// Allowed values, copied from Nuvio's web importer.
const TMDB_SOURCE_TYPES = ['LIST', 'COLLECTION', 'COMPANY', 'NETWORK', 'DISCOVER', 'PERSON', 'DIRECTOR'];
const MEDIA_TYPES = ['MOVIE', 'TV'];
const SORTS = ['original', 'popularity.desc', 'vote_average.desc', 'primary_release_date.desc', 'first_air_date.desc'];
const FILTER_KEYS = [
  'withGenres', 'withoutGenres', 'releaseDateGte', 'releaseDateLte', 'voteAverageGte', 'voteAverageLte',
  'voteCountGte', 'withOriginalLanguage', 'withOriginCountry', 'withKeywords', 'withoutKeywords',
  'withCompanies', 'withoutCompanies', 'withNetworks', 'year', 'watchRegion', 'withWatchProviders',
  'withoutWatchProviders',
];

const isoDate = (d) => d.toISOString().slice(0, 10);
function monthsAgo(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return isoDate(d);
}

function buildFilters(input, mediaType) {
  const { sinceMonths, ...rest } = input;
  const out = {};
  for (const [k, v] of Object.entries(rest)) {
    if (!FILTER_KEYS.includes(k)) throw new Error(`Unknown filter "${k}"`);
    if (v === undefined || v === null || v === '') continue;
    out[k] = String(v);
  }
  // One of the Nuvio clients re-saves empty filters as 0. A rating max of 0 makes
  // TMDB return nothing, so always pin it to 10 so the round trip is harmless.
  if (out.voteAverageLte === undefined) out.voteAverageLte = '10';
  if (sinceMonths) {
    const months = WINDOWS[`${sinceMonths}Months`];
    if (!months) throw new Error(`Unknown window "${sinceMonths}"`);
    out.releaseDateGte = monthsAgo(months);
    // Keep unreleased titles (no streams yet) out of "new" rows.
    out.releaseDateLte = isoDate(new Date());
  }
  return out;
}

function buildSource(src, folderPath) {
  const kind = String(src.kind || 'DISCOVER').toUpperCase();
  if (!TMDB_SOURCE_TYPES.includes(kind)) throw new Error(`${folderPath}: bad source kind "${src.kind}"`);
  const mediaType = kind === 'NETWORK' ? 'TV' : (src.mediaType || 'MOVIE');
  if (!MEDIA_TYPES.includes(mediaType)) throw new Error(`${folderPath}: bad mediaType "${src.mediaType}"`);
  let sortBy = src.sortBy || (mediaType === 'TV' ? 'first_air_date.desc' : 'popularity.desc');
  if (kind === 'DISCOVER' && !src.sortBy) sortBy = 'popularity.desc';
  if (!SORTS.includes(sortBy)) throw new Error(`${folderPath}: bad sortBy "${sortBy}"`);
  if (mediaType === 'TV' && sortBy === 'primary_release_date.desc') throw new Error(`${folderPath}: use first_air_date.desc for TV`);
  if (mediaType === 'MOVIE' && sortBy === 'first_air_date.desc') throw new Error(`${folderPath}: use primary_release_date.desc for movies`);
  if (kind !== 'DISCOVER' && !(Number(src.tmdbId) >= 1)) throw new Error(`${folderPath}: ${kind} source needs tmdbId`);
  if (!src.title) throw new Error(`${folderPath}: source needs a title`);
  return {
    provider: 'tmdb',
    tmdbSourceType: kind,
    title: src.title,
    tmdbId: kind === 'DISCOVER' ? '' : Number(src.tmdbId),
    mediaType,
    sortBy,
    filters: kind === 'DISCOVER' ? buildFilters(src.filters || {}, mediaType) : {},
  };
}

function buildFolder(folder, collectionId) {
  const path = `${collectionId}/${folder.id}`;
  if (!folder.id || !folder.title) throw new Error(`${path}: folder needs id and title`);
  if (!Array.isArray(folder.sources) || folder.sources.length === 0) throw new Error(`${path}: folder needs at least one source`);
  const out = {
    id: `${collectionId}--${folder.id}`,
    title: folder.title,
    tileShape: folder.tileShape || 'LANDSCAPE',
    hideTitle: false,
    focusGifEnabled: false,
    sources: folder.sources.map((s) => buildSource(s, path)),
    catalogSources: [],
  };
  if (folder.emoji) out.coverEmoji = folder.emoji;
  if (folder.coverImageUrl) out.coverImageUrl = folder.coverImageUrl;
  return out;
}

function buildCollection(c) {
  if (!c.id || !c.title) throw new Error('collection needs id and title');
  const out = {
    id: c.id,
    title: c.title,
    focusGlowEnabled: true,
    // Unpinned so the AI Picks addon rows can be ordered above them in Nuvio's home
    // settings. Pinned collections always render above every catalog row.
    pinToTop: !!c.pinToTop,
    viewMode: c.viewMode || 'TABBED_GRID',
    showAllTab: c.showAllTab ?? false,
    folders: c.folders.map((f) => buildFolder(f, c.id)),
  };
  if (c.backdropImageUrl) out.backdropImageUrl = c.backdropImageUrl;
  return out;
}

const configUrl = new URL('./picks.config.json', import.meta.url);
const listId = existsSync(configUrl) ? JSON.parse(readFileSync(configUrl, 'utf8')).listId : null;
// AI Picks reaches the home screen through the addon in addon/, not a collection.
// Set INCLUDE_PICKS_COLLECTION=1 to also emit it as a folder-card collection.
const all = listId && process.env.INCLUDE_PICKS_COLLECTION ? [aiPicks(listId), ...collections] : collections;
const output = all.map(buildCollection);

// Uniqueness checks the importer would otherwise resolve by renaming.
const ids = new Set();
for (const c of output) {
  if (ids.has(c.id)) throw new Error(`duplicate collection id ${c.id}`);
  ids.add(c.id);
  const fids = new Set();
  for (const f of c.folders) {
    if (fids.has(f.id)) throw new Error(`duplicate folder id ${f.id}`);
    fids.add(f.id);
  }
}

writeFileSync(new URL('./collections.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
const folderCount = output.reduce((n, c) => n + c.folders.length, 0);
const sourceCount = output.reduce((n, c) => n + c.folders.reduce((m, f) => m + f.sources.length, 0), 0);
console.log(`collections.json: ${output.length} collections, ${folderCount} folders, ${sourceCount} sources`);
