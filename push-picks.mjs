// Syncs picks.json to a public list on your TMDB account so Nuvio can show it.
//
// One-time setup:
//   1. Create a free account at themoviedb.org, then open Settings > API and
//      copy the "API Read Access Token" (the long v4 token).
//   2. Run:  TMDB_READ_TOKEN=... node push-picks.mjs login
//      Approve the link it prints, then run "node push-picks.mjs login" again.
//   3. Run:  node build.mjs   and re-import collections.json once so the
//      AI Picks collection knows the list id.
//
// Every refresh afterwards:  node push-picks.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const CONFIG = new URL('./picks.config.json', import.meta.url);
const PICKS = new URL('./picks.json', import.meta.url);
const API = 'https://api.themoviedb.org/4';

const readToken = process.env.TMDB_READ_TOKEN;
const config = existsSync(CONFIG) ? JSON.parse(readFileSync(CONFIG, 'utf8')) : {};

async function call(path, { method = 'GET', body, token } = {}) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json;charset=utf-8' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json();
  if (!r.ok || j.success === false) throw new Error(`${method} ${path}: ${j.status_message || r.status}`);
  return j;
}

async function login() {
  const token = readToken || config.readToken;
  if (!token) throw new Error('Set TMDB_READ_TOKEN to your TMDB API Read Access Token');
  config.readToken = token;
  if (config.requestToken) {
    try {
      const { access_token, account_id } = await call('/auth/access_token', {
        method: 'POST', body: { request_token: config.requestToken }, token,
      });
      delete config.requestToken;
      Object.assign(config, { accessToken: access_token, accountId: account_id });
      writeFileSync(CONFIG, JSON.stringify(config, null, 2) + '\n');
      console.log('Logged in. Now run: node push-picks.mjs');
      return;
    } catch (e) {
      console.log(`Not approved yet (${e.message}).`);
    }
  } else {
    const { request_token } = await call('/auth/request_token', { method: 'POST', body: {}, token });
    config.requestToken = request_token;
    writeFileSync(CONFIG, JSON.stringify(config, null, 2) + '\n');
  }
  console.log(`Approve access here, then run "node push-picks.mjs login" again:\n  https://www.themoviedb.org/auth/access?request_token=${config.requestToken}`);
}

async function push() {
  if (!config.accessToken) throw new Error('Run "node push-picks.mjs login" first');
  const picks = JSON.parse(readFileSync(PICKS, 'utf8'));
  const token = config.accessToken;
  if (!config.listId) {
    const list = await call('/list', {
      method: 'POST', token,
      body: { name: picks.name, description: picks.description, iso_639_1: 'en', public: true },
    });
    config.listId = list.id;
    writeFileSync(CONFIG, JSON.stringify(config, null, 2) + '\n');
    console.log(`Created TMDB list ${list.id}`);
  }
  // Remove whatever is in the list now (walk every page), then add the current picks.
  const existing = [];
  for (let page = 1; ; page++) {
    const l = await call(`/list/${config.listId}?page=${page}`, { token });
    existing.push(...(l.results || []).map((r) => ({ media_type: r.media_type, media_id: r.id })));
    if (page >= (l.total_pages || 1)) break;
  }
  if (existing.length) await call(`/list/${config.listId}/items`, { method: 'DELETE', token, body: { items: existing } });
  const items = picks.items.map((p) => ({ media_type: p.type, media_id: p.tmdbId }));
  await call(`/list/${config.listId}/items`, { method: 'POST', token, body: { items } });
  await call(`/list/${config.listId}`, {
    method: 'PUT', token,
    body: { name: picks.name, description: picks.description, public: true, sort_by: 'original_order.asc' },
  });
  console.log(`Pushed ${items.length} picks to https://www.themoviedb.org/list/${config.listId}`);
  // Also refresh the static addon catalog that Nuvio shows as home-screen tiles.
  await import('./build-addon.mjs');
  console.log('Now commit and push so GitHub Pages serves the new addon files:  git add -A && git commit -m "Refresh picks" && git push');
}

const cmd = process.argv[2];
try {
  if (cmd === 'login') await login();
  else await push();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
