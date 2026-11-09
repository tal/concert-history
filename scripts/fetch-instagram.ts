// Fills `instagram` in data/artists.yml from Wikidata (P2003), preserving every other YAML byte.
// Prints a report by default; pass --write to save. Handles already in the file are never replaced.
import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArtistsFile } from '../src/types';

type RunMode = 'dry_run' | 'write';
type Lookup = 'by_spotify' | 'by_wikipedia';

interface Hit {
  item: string;
  label: string;
  handles: Set<string>;
}

const ENDPOINT = 'https://query.wikidata.org/sparql';
const BATCH = 100;
const VALID_HANDLE = /^[a-z0-9._]{1,30}$/;

const mode: RunMode = process.argv.includes('--write') ? 'write' : 'dry_run';
const file = path.resolve(import.meta.dir, '../data/artists.yml');

const articleKey = (url: string) => decodeURI(url);
const articleIri = (url: string) => encodeURI(decodeURI(url));

async function sparql(query: string): Promise<Record<string, { value: string }>[]> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/sparql-results+json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'concert-history-instagram-lookup/1.0',
      },
      body: new URLSearchParams({ query }),
    });
    if (response.ok) return (await response.json() as { results: { bindings: Record<string, { value: string }>[] } }).results.bindings;
    if (attempt === 4) throw new Error(`Wikidata returned ${response.status}: ${await response.text()}`);
    await Bun.sleep(attempt * 5000);
  }
}

async function lookup(kind: Lookup, keys: string[]): Promise<Map<string, Hit[]>> {
  const found = new Map<string, Map<string, Hit>>();
  for (let start = 0; start < keys.length; start += BATCH) {
    const chunk = keys.slice(start, start + BATCH);
    const pattern =
      kind === 'by_spotify'
        ? `VALUES ?key { ${chunk.map((id) => JSON.stringify(id)).join(' ')} } ?item wdt:P1902 ?key .`
        : `VALUES ?key { ${chunk.map((url) => `<${articleIri(url)}>`).join(' ')} } ?key schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> .`;
    const rows = await sparql(`SELECT ?key ?item ?itemLabel ?handle WHERE {
      ${pattern}
      OPTIONAL { ?item wdt:P2003 ?handle . }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
    }`);
    for (const row of rows) {
      const key = kind === 'by_spotify' ? row.key!.value : articleKey(row.key!.value);
      const items = found.get(key) ?? new Map<string, Hit>();
      found.set(key, items);
      const item = row.item!.value.split('/').pop()!;
      const hit = items.get(item) ?? { item, label: row.itemLabel!.value, handles: new Set<string>() };
      items.set(item, hit);
      if (row.handle) hit.handles.add(row.handle.value.toLowerCase());
    }
  }
  return new Map([...found].map(([key, items]) => [key, [...items.values()]]));
}

const data = Bun.YAML.parse(await readFile(file, 'utf8')) as ArtistsFile;
const bySpotify = await lookup('by_spotify', data.artists.filter((a) => a.spotify_id && a.spotify_match !== 'none').map((a) => a.spotify_id!));
const byArticle = await lookup('by_wikipedia', data.artists.filter((a) => a.wikipedia).map((a) => a.wikipedia!));

const simplify = (text: string) => text.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');
const chosen = new Map<string, string>();
const conflicts: string[] = [];
const tiebroken: string[] = [];
const labelMismatches: string[] = [];
let skippedAmbiguous = 0;

for (const artist of data.artists) {
  const spotifyHits = artist.spotify_id && artist.spotify_match !== 'none' ? (bySpotify.get(artist.spotify_id) ?? []) : [];
  const articleHits = artist.wikipedia ? (byArticle.get(articleKey(artist.wikipedia)) ?? []) : [];
  // An ambiguous Spotify ID may be a different band, so it needs Wikipedia to land on the same item.
  const hits =
    artist.spotify_match === 'ambiguous'
      ? articleHits.filter((hit) => spotifyHits.some((other) => other.item === hit.item))
      : [...spotifyHits, ...articleHits];
  if (artist.spotify_match === 'ambiguous' && !hits.length && (spotifyHits.length || articleHits.length)) skippedAmbiguous++;
  const handles = [...new Set(hits.flatMap((hit) => [...hit.handles]))].filter((handle) => VALID_HANDLE.test(handle));
  if (!handles.length) continue;
  // Wikidata sometimes lists a member's account or a mangled value beside the real one; the artist's exact name breaks the tie.
  const named = handles.filter((handle) => handle === simplify(artist.name));
  const handle = handles.length === 1 ? handles[0]! : named.length === 1 ? named[0]! : null;
  if (!handle) {
    conflicts.push(`${artist.slug}: ${handles.join(', ')}`);
    continue;
  }
  if (handles.length > 1) tiebroken.push(`${artist.slug}: chose ${handle} over ${handles.filter((other) => other !== handle).join(', ')}`);
  chosen.set(artist.slug, handle);
  const source = hits.find((hit) => hit.handles.has(handle))!;
  if (simplify(source.label) !== simplify(artist.name)) labelMismatches.push(`${artist.slug} (${artist.name}) -> ${source.label} [${source.item}] @${handle}`);
}

const scalar = (handle: string | undefined) => {
  if (!handle) return 'null';
  return /^[a-z_][a-z0-9._]*$/.test(handle) && !/^(null|true|false|yes|no|on|off)$/.test(handle) ? handle : JSON.stringify(handle);
};

const original = await readFile(file, 'utf8');
const merged = original
  .split(/(?=^  - slug: )/m)
  .map((block) => {
    const slug = block.match(/^  - slug: (.+)$/m)?.[1]?.replace(/^['"]|['"]$/g, '');
    if (!slug) return block;
    const handle = chosen.get(slug);
    if (/^    instagram: /m.test(block)) return handle ? block.replace(/^    instagram: null$/m, `    instagram: ${scalar(handle)}`) : block;
    if (!/^    wikipedia: /m.test(block)) throw new Error(`No wikipedia line for ${slug}`);
    return block.replace(/^(    wikipedia: .*)$/m, `$1\n    instagram: ${scalar(handle)}`);
  })
  .join('');

const after = Bun.YAML.parse(merged) as ArtistsFile;
if (after.artists.length !== data.artists.length) throw new Error('Artist count changed');

console.log(`Artists: ${data.artists.length}`);
console.log(`Handles found: ${chosen.size}`);
console.log(`Ambiguous Spotify IDs skipped: ${skippedAmbiguous}`);
console.log(`\nTies broken by exact artist name (${tiebroken.length}):\n${tiebroken.join('\n')}`);
console.log(`\nConflicting handles, left null (${conflicts.length}):\n${conflicts.join('\n')}`);
console.log(`\nWikidata label differs from artist name (${labelMismatches.length}):\n${labelMismatches.join('\n')}`);

if (mode === 'write') {
  const temp = `${file}.tmp`;
  await writeFile(temp, merged);
  await rename(temp, file);
  console.log('\nWrote data/artists.yml');
} else {
  console.log('\nDry run. Pass --write to save.');
}
