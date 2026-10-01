import { BOOK_TAXONOMY, taxonomyBooksForLanguage, referenceChapterCount } from './sources/bookTaxonomy.mjs';

function findTaxonomyEntry(nr) {
  return BOOK_TAXONOMY.find((entry) => entry.nr === nr);
}

function validateCoverage(dataset, errors, warnings) {
  const expected = taxonomyBooksForLanguage(dataset.language);
  const actualByNr = new Map();
  for (const book of dataset.books) {
    if (actualByNr.has(book.universalId)) {
      errors.push(`"${dataset.code}" has duplicate universal book nr ${book.universalId}`);
    }
    actualByNr.set(book.universalId, book);
  }

  for (const entry of expected) {
    if (actualByNr.has(entry.nr)) continue;
    if (entry.canonical) {
      errors.push(`"${dataset.code}" is missing canonical book ${entry.nr}`);
    } else {
      warnings.push(`"${dataset.code}" is missing non-canonical book ${entry.nr} (${entry[dataset.language].title})`);
    }
  }

  for (const nr of actualByNr.keys()) {
    if (!findTaxonomyEntry(nr)) {
      errors.push(`"${dataset.code}" has book ${nr} that is not in the taxonomy`);
    }
  }
}

function validateBook(book, dataset, entry, errors, warnings, gapExamples) {
  if (book.canonical !== entry.canonical) {
    errors.push(`"${dataset.code}" book ${entry.nr} has canonical=${book.canonical}, expected ${entry.canonical}`);
  }
  const referenceCount = referenceChapterCount(entry, dataset.language);
  if (book.chapters.length !== referenceCount) {
    errors.push(`"${dataset.code}" book ${entry.nr} "${book.title}" has ${book.chapters.length} chapters, expected ${referenceCount}`);
  }

  book.chapters.forEach((chapter, chapterIndex) => {
    if (chapter.number !== chapterIndex + 1) {
      errors.push(`"${dataset.code}" book ${entry.nr} has broken chapter numbering at position ${chapterIndex + 1}`);
    }
    const seenVerseNumbers = new Set();
    let expectedVerseNumber = 1;
    for (const verse of chapter.verses) {
      if (seenVerseNumbers.has(verse.number)) {
        errors.push(`"${dataset.code}" book ${entry.nr} chapter ${chapter.number} has duplicate verse ${verse.number}`);
      }
      seenVerseNumbers.add(verse.number);
      if (verse.number !== expectedVerseNumber && gapExamples.length < 3) {
        gapExamples.push(`${book.title} ${chapter.number}:${verse.number} (expected ${expectedVerseNumber})`);
      }
      expectedVerseNumber = verse.number + 1;
      if (!verse.text || !verse.text.trim()) {
        errors.push(`"${dataset.code}" book ${entry.nr} chapter ${chapter.number} verse ${verse.number} has empty text`);
      }
    }
  });
}

export function validateDatasets(datasets, logger) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(datasets) || datasets.length === 0) {
    errors.push('No translation datasets provided');
  }

  const seenCodes = new Set();
  for (const dataset of datasets ?? []) {
    if (seenCodes.has(dataset.code)) {
      errors.push(`Duplicate translation code: ${dataset.code}`);
    }
    seenCodes.add(dataset.code);

    const gapExamples = [];
    validateCoverage(dataset, errors, warnings);
    for (const book of dataset.books) {
      const entry = findTaxonomyEntry(book.universalId);
      if (!entry) continue;
      validateBook(book, dataset, entry, errors, warnings, gapExamples);
    }
    if (gapExamples.length > 0) {
      warnings.push(`"${dataset.code}" has verse numbering gaps, examples: ${gapExamples.join('; ')}`);
    }
  }

  for (const message of warnings) {
    logger.warn(message);
  }
  if (errors.length > 0) {
    for (const message of errors) {
      logger.error(`Validation failed: ${message}`);
    }
    throw new Error(`Dataset validation failed:\n- ${errors.join('\n- ')}`);
  }
  logger.info('Dataset validation passed', { translations: datasets.length, warnings: warnings.length });
}

export function validateFootnoteCounts(stats, footnotes, logger) {
  if (!footnotes || footnotes.stats.footnotes === 0) {
    logger.info('No footnote source provided, skipping footnote count validation');
    return;
  }

  const sourceTotal = footnotes.stats.footnotes;
  const insertedTotal = stats.reduce((sum, stat) => sum + (stat.footnotes ?? 0), 0);

  if (insertedTotal === 0) {
    throw new Error(`Footnote source provided ${sourceTotal} notes, but none were inserted into the database`);
  }
  if (insertedTotal > sourceTotal) {
    throw new Error(`Inserted ${insertedTotal} footnotes, but the source provided only ${sourceTotal}`);
  }
  if (insertedTotal < sourceTotal) {
    logger.warn('Some source footnotes did not match dataset verses', {
      sourceTotal,
      insertedTotal,
      difference: sourceTotal - insertedTotal,
    });
  }

  for (const stat of stats) {
    if ((stat.footnotes ?? 0) === 0) {
      logger.info('Translation has no footnotes', { translation: stat.code });
    }
  }
}
