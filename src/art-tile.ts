// Generated art that needs no DOM: the seeded noise and the static background tile.

export function hashSeed(text: string): number {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bar heights (0..1) shaped like an audio envelope rather than plain noise. */
export function envelope(count: number, random: () => number): number[] {
  const p1 = random() * Math.PI * 2;
  const p2 = random() * Math.PI * 2;
  return Array.from({ length: count }, (_, i) => {
    const t = (i / count) * Math.PI * 2;
    const swell = 0.5 + 0.3 * Math.sin(t * 2 + p1) + 0.2 * Math.sin(t * 7 + p2);
    return Math.min(1, Math.max(0.05, swell * (0.35 + random() * 0.75)));
  });
}

/** The repeating page background. */
export function waveformTile(): string {
  const random = seededRandom(hashSeed('concert-history-waveform'));
  const width = 1440;
  const rowHeight = 150;
  const rows = 3;
  const step = 8;
  const bars: string[] = [];
  for (let row = 0; row < rows; row++) {
    const mid = rowHeight * row + rowHeight / 2;
    envelope(width / step, random).forEach((level, i) => {
      const h = Math.round(level * (rowHeight * 0.62));
      bars.push(`<rect x="${i * step + 2}" y="${mid - h / 2}" width="3" height="${h}" rx="1.5"/>`);
    });
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${rowHeight * rows}" ` +
    `viewBox="0 0 ${width} ${rowHeight * rows}" fill="#b9a4ff" fill-opacity=".055">${bars.join('')}</svg>\n`
  );
}
