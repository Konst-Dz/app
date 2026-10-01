import { describe, expect, it } from '@jest/globals';

import {
  HIGHLIGHT_END,
  HIGHLIGHT_START,
  buildMatchExpression,
  splitSnippet,
} from '../query';

describe('buildMatchExpression', () => {
  it('returns null for an empty query', () => {
    expect(buildMatchExpression('')).toBeNull();
  });

  it('returns null for a whitespace-only query', () => {
    expect(buildMatchExpression('   ')).toBeNull();
  });

  it('returns null when the query is shorter than the minimum length', () => {
    expect(buildMatchExpression('а')).toBeNull();
  });

  it('returns null when no token contains a letter or digit', () => {
    expect(buildMatchExpression('... ---')).toBeNull();
  });

  it('builds a prefix expression for a single token', () => {
    expect(buildMatchExpression('господь')).toBe('"господь"*');
  });

  it('builds an AND expression for multiple tokens', () => {
    expect(buildMatchExpression('  Господь   милость  ')).toBe(
      '"Господь"* "милость"*',
    );
  });

  it('strips FTS syntax characters from tokens', () => {
    expect(buildMatchExpression('гос*подь')).toBe('"господь"*');
    expect(buildMatchExpression('"хвалите"')).toBe('"хвалите"*');
  });

  it('ignores tokens beyond the limit', () => {
    const query = 'а б в г д е ж з и к л м';
    expect(buildMatchExpression(query)).toBe(
      '"а"* "б"* "в"* "г"* "д"* "е"* "ж"* "з"* "и"* "к"*',
    );
  });

  it('deduplicates tokens preserving the first occurrence', () => {
    expect(buildMatchExpression('мир мир мир любовь')).toBe('"мир"* "любовь"*');
  });

  it('accepts numbers as tokens', () => {
    expect(buildMatchExpression('40 лет')).toBe('"40"* "лет"*');
  });
});

describe('splitSnippet', () => {
  it('returns a single plain segment when there are no markers', () => {
    expect(splitSnippet('начало текста')).toEqual([
      { text: 'начало текста', isHighlighted: false },
    ]);
  });

  it('returns an empty array for an empty snippet', () => {
    expect(splitSnippet('')).toEqual([]);
  });

  it('splits a snippet with one highlighted range', () => {
    const snippet = `до ${HIGHLIGHT_START}слово${HIGHLIGHT_END} после`;
    expect(splitSnippet(snippet)).toEqual([
      { text: 'до ', isHighlighted: false },
      { text: 'слово', isHighlighted: true },
      { text: ' после', isHighlighted: false },
    ]);
  });

  it('splits several highlighted ranges', () => {
    const snippet = `${HIGHLIGHT_START}a${HIGHLIGHT_END} mid ${HIGHLIGHT_START}b${HIGHLIGHT_END}`;
    expect(splitSnippet(snippet)).toEqual([
      { text: 'a', isHighlighted: true },
      { text: ' mid ', isHighlighted: false },
      { text: 'b', isHighlighted: true },
    ]);
  });

  it('tolerates consecutive start markers', () => {
    const snippet = `${HIGHLIGHT_START}${HIGHLIGHT_START}слово${HIGHLIGHT_END}`;
    expect(splitSnippet(snippet)).toEqual([
      { text: 'слово', isHighlighted: true },
    ]);
  });

  it('tolerates an end marker without a start', () => {
    const snippet = `раз${HIGHLIGHT_END}два`;
    expect(splitSnippet(snippet)).toEqual([
      { text: 'раз', isHighlighted: false },
      { text: 'два', isHighlighted: false },
    ]);
  });

  it('keeps trailing text highlighted when a range is not closed', () => {
    const snippet = `до ${HIGHLIGHT_START}слово`;
    expect(splitSnippet(snippet)).toEqual([
      { text: 'до ', isHighlighted: false },
      { text: 'слово', isHighlighted: true },
    ]);
  });

  it('drops empty segments around markers', () => {
    const snippet = `${HIGHLIGHT_START}${HIGHLIGHT_END}`;
    expect(splitSnippet(snippet)).toEqual([]);
  });
});
