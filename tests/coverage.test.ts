import { describe, expect, test } from 'bun:test';
import { validate } from '../src/build';
import type { Concert } from '../src/types';

const fixture = (): Concert => ({
  id: '2012-09-30-jack-white', date: '2012-09-30', artist: 'Jack White', support: '',
  venue: 'Radio City Music Hall', status: 'Calendar only', notes: '', sources: [], photo_match: null, photos: [],
  coverage_photos: [{ image_url: 'https://example.com/live.jpg', page_url: 'https://example.com/report', publication: 'Official gallery', credit: 'Jo McCaughey', caption: 'Jack White at Radio City', concert_date: '2012-09-30' }],
  coverage_research: { searched_on: '2026-11-08', outcome: 'found', queries: ['Jack White Radio City September 30 2012 photos'], sources: ['https://example.com/report'], notes: 'Exact night verified.' },
});

describe('coverage provenance', () => {
  test('accepts credited coverage without treating it as a personal photo or attendance proof', () => {
    const concert = fixture();
    validate(concert, new Set());
    expect(concert.status).toBe('Calendar only');
    expect(concert.photos).toEqual([]);
  });
  test('rejects the previous night at the same venue', () => {
    const concert = fixture();
    concert.coverage_photos![0]!.concert_date = '2012-09-29';
    expect(() => validate(concert, new Set())).toThrow('different concert date');
  });
  test('accepts a specific photographed festival day only when that day is allowed', () => {
    const concert = fixture();
    concert.coverage_photos![0]!.concert_date = '2012-09-29';
    expect(() => validate(concert, new Set(), ['2012-09-29', '2012-09-30'])).not.toThrow();
  });
  test('rejects missing attribution and non-web image URLs', () => {
    const concert = fixture();
    concert.coverage_photos![0]!.credit = '';
    expect(() => validate(concert, new Set())).toThrow('credit');
    concert.coverage_photos![0]!.credit = 'Jo McCaughey';
    concert.coverage_photos![0]!.image_url = 'javascript:alert(1)';
    expect(() => validate(concert, new Set())).toThrow('HTTPS');
  });
  test('rejects a found outcome without photos and a photo without a reviewed source', () => {
    const concert = fixture();
    concert.coverage_research!.sources = [];
    expect(() => validate(concert, new Set())).toThrow('missing from research sources');
    concert.coverage_photos = [];
    expect(() => validate(concert, new Set())).toThrow('disagrees');
  });
});
