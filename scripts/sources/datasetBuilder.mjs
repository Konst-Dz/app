function normalizeChapters(rawChapters, { code, nr, title }, logger) {
  const chapters = rawChapters.map((chapter, chapterIndex) => {
    const verses = (chapter.verses ?? []).map((verse) => {
      const text = String(verse.text ?? '').trim();
      if (!text) {
        throw new Error(`Empty verse text in "${code}" book ${nr} "${title}" chapter ${chapterIndex + 1}`);
      }
      return { number: Number(verse.verse), text };
    });
    if (verses.length === 0) {
      throw new Error(`No verses in "${code}" book ${nr} "${title}" chapter ${chapterIndex + 1}`);
    }
    return { number: chapterIndex + 1, verses };
  });
  logger.debug('Chapters normalized', { translation: code, book: nr, chapters: chapters.length });
  return chapters;
}

export function buildDataset(adapter, rawBooksByNr, logger) {
  const books = adapter.taxonomyBooks().map((entry) => {
    const rawChapters = adapter.resolveChapters(entry, rawBooksByNr);
    if (!rawChapters || rawChapters.length === 0) {
      throw new Error(`Source "${adapter.sourceName}" returned no chapters for book ${entry.nr}`);
    }
    return {
      universalId: entry.nr,
      title: entry[adapter.language].title,
      shortTitle: entry[adapter.language].shortTitle,
      canonical: entry.canonical,
      chapters: normalizeChapters(rawChapters, { code: adapter.code, nr: entry.nr, title: entry[adapter.language].title }, logger),
    };
  });

  logger.info('Dataset built from source', {
    translation: adapter.code,
    source: adapter.sourceName,
    books: books.length,
    verses: books.reduce((sum, book) => sum + book.chapters.reduce((acc, chapter) => acc + chapter.verses.length, 0), 0),
  });
  return {
    code: adapter.code,
    language: adapter.language,
    title: adapter.title,
    license: adapter.license,
    books,
  };
}
