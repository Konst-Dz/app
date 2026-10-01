import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DATA_DIR } from '../paths.mjs';
import { referenceChapterCount, taxonomyBooksForLanguage } from './bookTaxonomy.mjs';

const BASE_URL = 'https://bible.helloao.org/api';
const TRANSLATION_ID = 'eng_kja';
const FOOTNOTE_TRANSLATION = 'kjva';
const REQUEST_DELAY_MS = 250;
const RETRY_DELAY_MS = 1000;
const MAX_ATTEMPTS = 3;

const CACHE_DIR = resolve(DATA_DIR, 'helloao', TRANSLATION_ID);

const sleep = (ms) => new Promise((resolveTimeout) => setTimeout(resolveTimeout, ms));

const CANONICAL_BOOK_IDS = {
  GEN: 1, EXO: 2, LEV: 3, NUM: 4, DEU: 5, JOS: 6, JDG: 7, RUT: 8,
  '1SA': 9, '2SA': 10, '1KI': 11, '2KI': 12, '1CH': 13, '2CH': 14,
  EZR: 15, NEH: 16, EST: 17, JOB: 18, PSA: 19, PRO: 20, ECC: 21, SNG: 22,
  ISA: 23, JER: 24, LAM: 25, EZK: 26, DAN: 27,
  HOS: 28, JOL: 29, AMO: 30, OBA: 31, JON: 32, MIC: 33, NAM: 34, HAB: 35,
  ZEP: 36, HAG: 37, ZEC: 38, MAL: 39,
  MAT: 40, MRK: 41, LUK: 42, JHN: 43, ACT: 44,
  ROM: 45, '1CO': 46, '2CO': 47, GAL: 48, EPH: 49, PHP: 50, COL: 51,
  '1TH': 52, '2TH': 53, '1TI': 54, '2TI': 55, TIT: 56, PHM: 57, HEB: 58,
  JAS: 59, '1PE': 60, '2PE': 61, '1JN': 62, '2JN': 63, '3JN': 64, JUD: 65, REV: 66,
};

const APOCRYPHA_BOOK_IDS = {
  '1ES': 67, '2ES': 68, TOB: 69, JDT: 70, WIS: 73, SIR: 74, '1MA': 80, '2MA': 81, MAN: 79,
};

const DANIEL_COMPOSITION = {
  universalId: 27,
  mainBook: 'DAN',
  mainChapterCount: 12,
  mergedBooks: [
    { usfmBookId: 'SUS', targetChapter: 13, expectedChapterCount: 1 },
    { usfmBookId: 'BEL', targetChapter: 14, expectedChapterCount: 1 },
  ],
};

const BARUCH_COMPOSITION = {
  universalId: 75,
  epistle: { universalId: 84, fromChapter: 6, targetChapter: 1 },
};

const SKIPPED_BOOK_IDS = {
  ESG: 'Additions to Esther are excluded from the kjva composition (nr 71)',
  S3Y: 'Prayer of Azariah is excluded from the kjva composition (nr 76)',
};

function taxonomyChapterCount(universalId) {
  const entry = taxonomyBooksForLanguage('en').find((book) => book.nr === universalId);
  if (!entry) return null;
  return referenceChapterCount(entry, 'en');
}

export function resolveFootnoteTarget(usfmBookId, chapterNumber) {
  if (!Number.isInteger(chapterNumber) || chapterNumber < 1) {
    return null;
  }
  if (usfmBookId === 'BAR') {
    if (chapterNumber === BARUCH_COMPOSITION.epistle.fromChapter) {
      return { universalId: BARUCH_COMPOSITION.epistle.universalId, chapter: BARUCH_COMPOSITION.epistle.targetChapter };
    }
    return { universalId: BARUCH_COMPOSITION.universalId, chapter: chapterNumber };
  }
  const merged = DANIEL_COMPOSITION.mergedBooks.find((book) => book.usfmBookId === usfmBookId);
  if (merged) {
    return { universalId: DANIEL_COMPOSITION.universalId, chapter: merged.targetChapter };
  }
  const universalId = CANONICAL_BOOK_IDS[usfmBookId] ?? APOCRYPHA_BOOK_IDS[usfmBookId];
  if (universalId === undefined) {
    return null;
  }
  return { universalId, chapter: chapterNumber };
}

export function mapBookFootnotes(usfmBookId, chapters) {
  const entries = [];
  const skipped = [];

  for (const chapter of chapters) {
    for (const note of chapter.footnotes ?? []) {
      const reference = note.reference ?? {};
      const verse = reference.verse;
      if (!Number.isInteger(verse) || verse < 1) {
        skipped.push({ usfmBookId, chapter: chapter.number, verse: reference.verse ?? null, reason: 'footnote without verse reference' });
        continue;
      }
      const target = resolveFootnoteTarget(usfmBookId, reference.chapter);
      if (!target) {
        skipped.push({ usfmBookId, chapter: chapter.number, verse, reason: `chapter ${reference.chapter} has no kjva target` });
        continue;
      }
      const text = String(note.text ?? '').trim();
      if (!text) {
        skipped.push({ usfmBookId, chapter: chapter.number, verse, reason: 'empty footnote text' });
        continue;
      }
      entries.push({
        key: `${FOOTNOTE_TRANSLATION}|${target.universalId}|${target.chapter}|${verse}`,
        marker: note.caller ?? null,
        text,
      });
    }
  }

  return { entries, skipped };
}

function buildFetchPlan() {
  const directBooks = [...Object.keys(CANONICAL_BOOK_IDS), ...Object.keys(APOCRYPHA_BOOK_IDS)].map((usfmBookId) => {
    if (usfmBookId === DANIEL_COMPOSITION.mainBook) {
      return { usfmBookId, universalId: DANIEL_COMPOSITION.universalId, expectedChapterCount: DANIEL_COMPOSITION.mainChapterCount };
    }
    return { usfmBookId, universalId: CANONICAL_BOOK_IDS[usfmBookId] ?? APOCRYPHA_BOOK_IDS[usfmBookId], expectedChapterCount: null };
  });

  const mergedBooks = DANIEL_COMPOSITION.mergedBooks.map((book) => ({
    usfmBookId: book.usfmBookId,
    universalId: DANIEL_COMPOSITION.universalId,
    expectedChapterCount: book.expectedChapterCount,
  }));

  const baruchBook = {
    usfmBookId: 'BAR',
    universalId: BARUCH_COMPOSITION.universalId,
    expectedChapterCount: taxonomyChapterCount(BARUCH_COMPOSITION.universalId) + 1,
  };

  return [...directBooks, ...mergedBooks, baruchBook];
}

async function fetchJson(cachePath, url, logger, validateBody) {
  if (existsSync(cachePath)) {
    logger.debug('Response loaded from cache', { cachePath });
    return JSON.parse(readFileSync(cachePath, 'utf8'));
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      const body = await response.json();
      const validationError = validateBody(body);
      if (validationError) {
        throw new Error(`Invalid response from ${url}: ${validationError}`);
      }
      mkdirSync(dirname(cachePath), { recursive: true });
      writeFileSync(cachePath, JSON.stringify(body));
      logger.debug('Response downloaded', { url });
      await sleep(REQUEST_DELAY_MS);
      return body;
    } catch (error) {
      logger.warn('Footnote source fetch attempt failed', { url, attempt, error: error.message });
      if (attempt === MAX_ATTEMPTS) {
        throw error;
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
}

async function fetchBookFootnotes(usfmBookId, numberOfChapters, logger) {
  const chapters = [];
  for (let chapter = 1; chapter <= numberOfChapters; chapter += 1) {
    const body = await fetchJson(
      resolve(CACHE_DIR, usfmBookId, `${chapter}.json`),
      `${BASE_URL}/${TRANSLATION_ID}/${usfmBookId}/${chapter}.json`,
      logger,
      (received) => (received.chapter?.number === chapter ? null : `chapter number mismatch, expected ${chapter}`),
    );
    chapters.push({ number: chapter, footnotes: body.chapter?.footnotes ?? [] });
  }
  return chapters;
}

export async function loadFootnotes(logger) {
  logger.info('Loading footnotes source', { translation: FOOTNOTE_TRANSLATION, source: TRANSLATION_ID });

  const booksBody = await fetchJson(
    resolve(CACHE_DIR, 'books.json'),
    `${BASE_URL}/${TRANSLATION_ID}/books.json`,
    logger,
    (received) => (Array.isArray(received.books) ? null : 'books.json must contain a books array'),
  );
  const chapterCountByBookId = new Map(booksBody.books.map((book) => [book.id, book.numberOfChapters]));

  const byKey = new Map();
  const stats = { books: 0, chapters: 0, footnotes: 0, skipped: 0 };

  for (const planned of buildFetchPlan()) {
    const sourceChapterCount = chapterCountByBookId.get(planned.usfmBookId);
    if (sourceChapterCount === undefined) {
      logger.warn('Footnote source is missing book, skipping', { book: planned.usfmBookId });
      continue;
    }
    const expected = planned.expectedChapterCount ?? taxonomyChapterCount(planned.universalId);
    if (expected !== null && sourceChapterCount !== expected) {
      logger.warn('Footnote source chapter count mismatch, skipping book', {
        book: planned.usfmBookId,
        expected,
        actual: sourceChapterCount,
      });
      continue;
    }

    const chapters = await fetchBookFootnotes(planned.usfmBookId, sourceChapterCount, logger);
    const { entries, skipped } = mapBookFootnotes(planned.usfmBookId, chapters);
    for (const entry of entries) {
      const existing = byKey.get(entry.key);
      if (existing) {
        existing.push({ marker: entry.marker, text: entry.text });
      } else {
        byKey.set(entry.key, [{ marker: entry.marker, text: entry.text }]);
      }
    }
    for (const item of skipped) {
      logger.warn('Footnote skipped', item);
    }

    stats.books += 1;
    stats.chapters += chapters.length;
    stats.footnotes += entries.length;
    stats.skipped += skipped.length;
  }

  for (const usfmBookId of Object.keys(SKIPPED_BOOK_IDS)) {
    logger.warn('Footnote source book excluded from kjva composition', { book: usfmBookId, reason: SKIPPED_BOOK_IDS[usfmBookId] });
  }

  logger.info('Footnotes source loaded', { ...stats });
  return { byKey, stats };
}
