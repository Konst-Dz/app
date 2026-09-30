import { taxonomyBooksForLanguage } from './bookTaxonomy.mjs';
import { buildDataset } from './datasetBuilder.mjs';

const CANONICAL_BOOK_NRS = Array.from({ length: 66 }, (_, index) => index + 1);

const NON_CANONICAL_BOOK_NRS = [67, 68, 69, 70, 73, 74, 75, 77, 78, 79, 80, 81];

const EXCLUDED_BOOK_NRS = [71, 76];

export const kjvEn = {
  code: 'kjva',
  language: 'en',
  title: 'King James Version with Apocrypha',
  license: 'Public Domain',
  sourceName: 'kjva',
  rawBookNrs: [...CANONICAL_BOOK_NRS, ...NON_CANONICAL_BOOK_NRS],
  taxonomyBooks: () => taxonomyBooksForLanguage('en'),
  resolveChapters(entry, rawBooksByNr) {
    const requireRaw = (nr) => {
      const raw = rawBooksByNr[nr];
      if (!raw) {
        throw new Error(`KJVA source is missing book ${nr}`);
      }
      return raw;
    };
    if (entry.nr === 27) {
      return [
        ...requireRaw(27).chapters,
        ...requireRaw(77).chapters,
        ...requireRaw(78).chapters,
      ];
    }
    if (entry.nr === 75) {
      return requireRaw(75).chapters.slice(0, 5);
    }
    if (entry.nr === 84) {
      return requireRaw(75).chapters.slice(5);
    }
    return requireRaw(entry.nr).chapters;
  },
  parse(rawBooksByNr, logger) {
    logger.info('KJVA composition adjustments', {
      mergedIntoDaniel: [77, 78],
      splitFromBaruchToOwnBook: [84],
      excludedWithoutSynodalCounterpart: EXCLUDED_BOOK_NRS,
    });
    logger.warn('Non-canonical book absent in English source', {
      nr: 82,
      title: '3-я Маккавейская',
      reason: 'No public-domain English counterpart in KJVA',
    });
    return buildDataset(kjvEn, rawBooksByNr, logger);
  },
};
