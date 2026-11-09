// Reads the YAML files in data/. Bun only: the browser gets a payload instead.
import path from 'node:path';
import { linkSite, type Site } from './model';
import type { ArchiveData, ArtistsFile, FestivalsFile, VenuesFile } from './types';

async function loadYaml<T>(file: string, warnings: string[]): Promise<T | null> {
  const handle = Bun.file(file);
  if (!(await handle.exists())) {
    warnings.push(`${path.basename(file)} is missing`);
    return null;
  }
  try {
    return Bun.YAML.parse(await handle.text()) as T;
  } catch (error) {
    warnings.push(`${path.basename(file)} could not be parsed: ${String(error)}`);
    return null;
  }
}

export async function loadSite(dataDir: string): Promise<Site> {
  const warnings: string[] = [];
  const data = Bun.YAML.parse(await Bun.file(path.join(dataDir, 'concerts.yml')).text()) as ArchiveData;
  if (data.schema_version !== 1) throw new Error('Unsupported YAML schema version');

  const venuesFile = await loadYaml<VenuesFile>(path.join(dataDir, 'venues.yml'), warnings);
  const artistsFile = await loadYaml<ArtistsFile>(path.join(dataDir, 'artists.yml'), warnings);
  const festivalsFile = await loadYaml<FestivalsFile>(path.join(dataDir, 'festivals.yml'), warnings);

  return linkSite({
    data,
    venues: venuesFile?.venues ?? [],
    artists: artistsFile?.artists ?? [],
    festivals: festivalsFile?.festivals ?? [],
    warnings,
  });
}
