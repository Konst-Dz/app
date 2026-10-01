import { describe, expect, it } from '@jest/globals';

import type { FootnoteRow } from '@/db/models';

import {
  getFootnotesForChapter,
  groupFootnotesByVerse,
} from '../footnotesRepository';
import { asDb, callsOf, createStubDb } from './stubDb';

const SAMPLE_ROWS: FootnoteRow[] = [
  { id: 1, verse_id: 101, marker: '+', text: 'Heb. between the light' },
  { id: 2, verse_id: 101, marker: '†', text: 'Gr. the deep' },
  { id: 3, verse_id: 102, marker: null, text: 'Or a canopy' },
];

describe('getFootnotesForChapter', () => {
  it('returns mapped footnote models for the chapter', async () => {
    const db = createStubDb({ allRows: SAMPLE_ROWS });

    const footnotes = await getFootnotesForChapter(asDb(db), 7, 1);

    expect(footnotes).toEqual([
      { id: 1, verseId: 101, marker: '+', text: 'Heb. between the light' },
      { id: 2, verseId: 101, marker: '†', text: 'Gr. the deep' },
      { id: 3, verseId: 102, marker: null, text: 'Or a canopy' },
    ]);
    const calls = callsOf(db, 'getAllAsync');
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain('FROM footnotes f');
    expect(calls[0].sql).toContain('JOIN verses v ON v.id = f.verse_id');
    expect(calls[0].params).toEqual([7, 1]);
  });

  it('returns an empty array for invalid params without querying', async () => {
    const db = createStubDb();

    const footnotes = await getFootnotesForChapter(asDb(db), 0, 1);

    expect(footnotes).toEqual([]);
    expect(db.calls).toHaveLength(0);
  });

  it('returns an empty array for a chapter without footnotes', async () => {
    const db = createStubDb({ allRows: [] });

    const footnotes = await getFootnotesForChapter(asDb(db), 7, 40);

    expect(footnotes).toEqual([]);
  });

  it('rethrows database errors', async () => {
    const db = createStubDb({ failure: new Error('database is locked') });

    await expect(getFootnotesForChapter(asDb(db), 7, 1)).rejects.toThrow(
      'database is locked',
    );
  });
});

describe('groupFootnotesByVerse', () => {
  it('groups footnotes by verse id preserving order', () => {
    const grouped = groupFootnotesByVerse([
      { id: 1, verseId: 101, marker: '+', text: 'First' },
      { id: 2, verseId: 101, marker: '†', text: 'Second' },
      { id: 3, verseId: 102, marker: null, text: 'Third' },
    ]);

    expect(grouped.get(101)).toHaveLength(2);
    expect(grouped.get(101)?.[1].text).toBe('Second');
    expect(grouped.get(102)?.[0].text).toBe('Third');
    expect(grouped.get(103)).toBeUndefined();
  });

  it('returns an empty map for empty input', () => {
    expect(groupFootnotesByVerse([]).size).toBe(0);
  });
});
