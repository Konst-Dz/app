import { describe, expect, it } from '@jest/globals';

import type { Book } from '@/db/models';

import { groupBooksByTestament } from '../books';

function makeBook(overrides: Partial<Book>): Book {
  return {
    id: 1,
    translationId: 1,
    universalId: 1,
    orderNum: 1,
    title: 'Бытие',
    shortTitle: 'Быт',
    chapterCount: 50,
    canonical: true,
    ...overrides,
  };
}

describe('groupBooksByTestament', () => {
  it('splits canonical books into old and new testament sections', () => {
    const sections = groupBooksByTestament([
      makeBook({ universalId: 1, title: 'Бытие' }),
      makeBook({ universalId: 40, title: 'От Матфея' }),
    ]);

    expect(sections).toHaveLength(2);
    expect(sections[0].title).toBe('Ветхий Завет');
    expect(sections[0].data).toHaveLength(1);
    expect(sections[1].title).toBe('Новый Завет');
    expect(sections[1].data[0].title).toBe('От Матфея');
  });

  it('places non-canonical books in a trailing section', () => {
    const sections = groupBooksByTestament([
      makeBook({ universalId: 67, canonical: false, title: '2Езд' }),
      makeBook({ universalId: 39, title: 'Мал' }),
      makeBook({ universalId: 68, canonical: false, title: '3Езд' }),
    ]);

    expect(sections).toHaveLength(2);
    expect(sections[0].title).toBe('Ветхий Завет');
    expect(sections[1].title).toBe('Неканонические книги');
    expect(sections[1].data.map((book) => book.title)).toEqual(['2Езд', '3Езд']);
  });

  it('omits empty sections', () => {
    const sections = groupBooksByTestament([
      makeBook({ universalId: 50, title: 'Деян' }),
    ]);

    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Новый Завет');
  });

  it('preserves the incoming order inside each section', () => {
    const sections = groupBooksByTestament([
      makeBook({ universalId: 45, orderNum: 3, title: 'Рим' }),
      makeBook({ universalId: 1, orderNum: 1, title: 'Бытие' }),
      makeBook({ universalId: 2, orderNum: 2, title: 'Исход' }),
    ]);

    expect(sections[0].data.map((book) => book.title)).toEqual(['Бытие', 'Исход']);
    expect(sections[1].data.map((book) => book.title)).toEqual(['Рим']);
  });

  it('treats the last old testament book boundary correctly', () => {
    const sections = groupBooksByTestament([
      makeBook({ universalId: 39, title: 'Мал' }),
      makeBook({ universalId: 40, title: 'Мф' }),
    ]);

    expect(sections[0].data).toHaveLength(1);
    expect(sections[1].data).toHaveLength(1);
  });

  it('returns an empty list for an empty input', () => {
    expect(groupBooksByTestament([])).toEqual([]);
  });
});
