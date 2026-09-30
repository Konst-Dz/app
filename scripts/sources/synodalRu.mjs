import { taxonomyBooksForLanguage } from './bookTaxonomy.mjs';
import { buildDataset } from './datasetBuilder.mjs';

const CANONICAL_BOOK_NRS = Array.from({ length: 66 }, (_, index) => index + 1);

const NON_CANONICAL_BOOK_NRS = [67, 68, 69, 70, 73, 74, 75, 79, 80, 81, 82, 84];

export const synodalRu = {
  code: 'rst',
  language: 'ru',
  title: 'Синодальный перевод',
  license: 'Public Domain',
  sourceName: 'synodal',
  rawBookNrs: [...CANONICAL_BOOK_NRS, ...NON_CANONICAL_BOOK_NRS],
  taxonomyBooks: () => taxonomyBooksForLanguage('ru'),
  resolveChapters(entry, rawBooksByNr) {
    const raw = rawBooksByNr[entry.nr];
    if (!raw) {
      throw new Error(`Synodal source is missing book ${entry.nr}`);
    }
    return raw.chapters;
  },
  parse(rawBooksByNr, logger) {
    return buildDataset(synodalRu, rawBooksByNr, logger);
  },
};
