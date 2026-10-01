const { mapBookFootnotes, resolveFootnoteTarget } = require('../sources/footnotes.mjs');

describe('resolveFootnoteTarget', () => {
  test('maps canonical books directly', () => {
    expect(resolveFootnoteTarget('GEN', 1)).toEqual({ universalId: 1, chapter: 1 });
    expect(resolveFootnoteTarget('PSA', 23)).toEqual({ universalId: 19, chapter: 23 });
    expect(resolveFootnoteTarget('REV', 22)).toEqual({ universalId: 66, chapter: 22 });
  });

  test('maps apocrypha books to their universal ids', () => {
    expect(resolveFootnoteTarget('TOB', 14)).toEqual({ universalId: 69, chapter: 14 });
    expect(resolveFootnoteTarget('MAN', 1)).toEqual({ universalId: 79, chapter: 1 });
  });

  test('merges Susanna and Bel into Daniel chapters 13 and 14', () => {
    expect(resolveFootnoteTarget('SUS', 1)).toEqual({ universalId: 27, chapter: 13 });
    expect(resolveFootnoteTarget('BEL', 1)).toEqual({ universalId: 27, chapter: 14 });
  });

  test('splits Baruch chapter 6 into the Epistle of Jeremiah', () => {
    expect(resolveFootnoteTarget('BAR', 3)).toEqual({ universalId: 75, chapter: 3 });
    expect(resolveFootnoteTarget('BAR', 6)).toEqual({ universalId: 84, chapter: 1 });
  });

  test('rejects books and chapters outside the composition', () => {
    expect(resolveFootnoteTarget('ESG', 1)).toBeNull();
    expect(resolveFootnoteTarget('S3Y', 1)).toBeNull();
    expect(resolveFootnoteTarget('GEN', 0)).toBeNull();
  });
});

describe('mapBookFootnotes', () => {
  const chapters = [
    {
      number: 1,
      footnotes: [
        { noteId: 0, caller: '+', text: 'Cited elsewhere', reference: { chapter: 1, verse: 3 } },
        { noteId: 1, caller: '†', text: '  Heb. literal wording  ', reference: { chapter: 1, verse: 5 } },
      ],
    },
    {
      number: 2,
      footnotes: [
        { noteId: 0, caller: '+', text: 'Chapter-level note', reference: { chapter: 2 } },
        { noteId: 1, caller: '+', text: '   ', reference: { chapter: 2, verse: 4 } },
        { noteId: 2, caller: '+', text: 'Valid note', reference: { chapter: 2, verse: 7 } },
      ],
    },
  ];

  test('maps verse notes to translation-scoped keys with trimmed text', () => {
    const { entries } = mapBookFootnotes('GEN', chapters);

    expect(entries).toEqual([
      { key: 'kjva|1|1|3', marker: '+', text: 'Cited elsewhere' },
      { key: 'kjva|1|1|5', marker: '†', text: 'Heb. literal wording' },
      { key: 'kjva|1|2|7', marker: '+', text: 'Valid note' },
    ]);
  });

  test('keeps multiple notes for the same verse key', () => {
    const { entries } = mapBookFootnotes('GEN', [
      {
        number: 1,
        footnotes: [
          { caller: '+', text: 'First', reference: { chapter: 1, verse: 1 } },
          { caller: '‡', text: 'Second', reference: { chapter: 1, verse: 1 } },
        ],
      },
    ]);
    const sameKey = entries.filter((entry) => entry.key === 'kjva|1|1|1');

    expect(sameKey).toHaveLength(2);
  });

  test('skips chapter-level and empty notes with reasons', () => {
    const { entries, skipped } = mapBookFootnotes('GEN', chapters);

    expect(entries).toHaveLength(3);
    expect(skipped).toEqual([
      { usfmBookId: 'GEN', chapter: 2, verse: null, reason: 'footnote without verse reference' },
      { usfmBookId: 'GEN', chapter: 2, verse: 4, reason: 'empty footnote text' },
    ]);
  });

  test('maps notes through composition targets', () => {
    const susChapters = [{ number: 1, footnotes: [{ caller: '+', text: 'Susanna note', reference: { chapter: 1, verse: 64 } }] }];
    const barChapters = [{ number: 6, footnotes: [{ caller: '+', text: 'Epistle note', reference: { chapter: 6, verse: 1 } }] }];

    expect(mapBookFootnotes('SUS', susChapters).entries[0].key).toBe('kjva|27|13|64');
    expect(mapBookFootnotes('BAR', barChapters).entries[0].key).toBe('kjva|84|1|1');
  });
});
