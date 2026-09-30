import { describe, expect, it } from '@jest/globals';

import { getAdjacentChapter } from '../navigation';

describe('getAdjacentChapter', () => {
  it('returns both neighbors for a middle chapter', () => {
    expect(getAdjacentChapter(5, 10)).toEqual({ prev: 4, next: 6 });
  });

  it('has no previous chapter at the start of the book', () => {
    expect(getAdjacentChapter(1, 10)).toEqual({ prev: null, next: 2 });
  });

  it('has no next chapter at the end of the book', () => {
    expect(getAdjacentChapter(10, 10)).toEqual({ prev: 9, next: null });
  });

  it('has no neighbors in a single-chapter book', () => {
    expect(getAdjacentChapter(1, 1)).toEqual({ prev: null, next: null });
  });

  it('returns no neighbors when the chapter is below range', () => {
    expect(getAdjacentChapter(0, 10)).toEqual({ prev: null, next: null });
  });

  it('returns no neighbors for a non-integer chapter', () => {
    expect(getAdjacentChapter(1.5, 10)).toEqual({ prev: null, next: null });
  });

  it('returns no neighbors when the book has no chapters', () => {
    expect(getAdjacentChapter(1, 0)).toEqual({ prev: null, next: null });
  });

  it('returns no neighbors for a non-integer chapter count', () => {
    expect(getAdjacentChapter(1, Number.NaN)).toEqual({ prev: null, next: null });
  });
});
