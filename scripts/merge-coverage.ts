// Merge a reviewed research batch by concert ID, preserving every existing YAML byte.
import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type { Concert, CoveragePhoto, CoverageResearch } from '../src/types';

interface Update {
  id: string;
  date: string;
  artist: string;
  venue: string;
  coverage_photos: CoveragePhoto[];
  coverage_research: CoverageResearch;
}

const input = process.argv[2];
if (!input) throw new Error('Usage: bun scripts/merge-coverage.ts reviewed-updates.json');
const updates = new Map((JSON.parse(await readFile(input, 'utf8')) as Update[]).map((u) => [u.id, u]));
const file = path.resolve(import.meta.dir, '../data/concerts.yml');
const original = await readFile(file, 'utf8');
const applied = new Set<string>();
const pieces = original.split(/(?=^- )/m);
const merged = pieces.map((block) => {
  if (!block.startsWith('- ')) return block;
  const concert = (Bun.YAML.parse(block) as Concert[])[0]!;
  const update = updates.get(concert.id);
  if (!update) return block;
  for (const key of ['date', 'artist', 'venue'] as const) {
    if (concert[key] !== update[key]) throw new Error(`Concert ${concert.id} changed ${key} during research; review before merging`);
  }
  if (concert.coverage_research || concert.coverage_photos) throw new Error(`Concert ${concert.id} already has coverage; refusing to overwrite another batch`);
  applied.add(concert.id);
  const fields = { coverage_photos: update.coverage_photos, coverage_research: update.coverage_research };
  const yaml = Bun.YAML.stringify(fields, null, 2).trimEnd().split('\n').map((line) => '  ' + line.trimEnd()).join('\n');
  return block.replace(/\s*$/, '\n') + yaml + '\n';
}).join('');
if (applied.size !== updates.size) throw new Error('Some reviewed concert IDs are missing from the current data');
const strip = (text: string) => {
  const data = Bun.YAML.parse(text) as { concerts: Concert[] };
  for (const c of data.concerts) { delete c.coverage_photos; delete c.coverage_research; }
  return data;
};
if (!isDeepStrictEqual(strip(original), strip(merged))) throw new Error('Merge would change existing concert data');
const temporary = `${file}.coverage-${process.pid}.tmp`;
await writeFile(temporary, merged);
if (await readFile(file, 'utf8') !== original) throw new Error('concerts.yml changed during merge; retry against the new file');
await rename(temporary, file);
console.log(`Merged coverage research for ${applied.size} concerts without changing existing fields.`);
