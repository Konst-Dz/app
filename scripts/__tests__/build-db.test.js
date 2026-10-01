const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const { buildDatabase } = require('../build-db.mjs');
const { validateFootnoteCounts } = require('../validate.mjs');
const { miniDataset } = require('./fixtures/miniDataset.js');

const SILENT_LOGGER = { debug() {}, info() {}, warn() {}, error() {} };

function createSpyLogger() {
  const calls = { debug: [], info: [], warn: [], error: [] };
  const record = (level) => (message, payload) => calls[level].push({ message, payload });
  return {
    calls,
    debug: record('debug'),
    info: record('info'),
    warn: record('warn'),
    error: record('error'),
  };
}

function countDatasetVerses(dataset) {
  return dataset.books.reduce(
    (sum, book) => sum + book.chapters.reduce((acc, chapter) => acc + chapter.verses.length, 0),
    0,
  );
}

describe('buildDatabase', () => {
  let dbPath;
  let db;

  beforeAll(() => {
    dbPath = path.join(os.tmpdir(), `bible-build-test-${process.pid}-${Date.now()}.db`);
    buildDatabase([miniDataset], { outputPath: dbPath, logger: SILENT_LOGGER });
    db = new DatabaseSync(dbPath);
  });

  afterAll(() => {
    db.close();
    fs.rmSync(dbPath, { force: true });
  });

  test('creates all content tables and the FTS index', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => row.name);

    expect(tables).toEqual(
      expect.arrayContaining(['meta', 'translations', 'books', 'verses', 'footnotes', 'verses_fts']),
    );
  });

  test('indexes footnotes by verse for chapter lookups', () => {
    const index = db
      .prepare("SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'index' AND name = 'idx_footnotes_verse'")
      .get();

    expect(index).toMatchObject({ tbl_name: 'footnotes' });
    expect(index.sql).toContain('verse_id');
  });

  test('stores verses with explicit chapter and verse numbers', () => {
    const verse = db
      .prepare(
        'SELECT v.text FROM verses v JOIN books b ON b.id = v.book_id WHERE b.universal_id = 1 AND v.chapter = 1 AND v.number = 2',
      )
      .get();

    expect(verse.text).toBe('Земля же была безвидна и пуста.');
  });

  test('keeps the canonical flag from the dataset', () => {
    const canonicalFlags = db
      .prepare('SELECT universal_id, canonical FROM books ORDER BY universal_id')
      .all();

    expect(canonicalFlags).toEqual([
      { universal_id: 1, canonical: 1 },
      { universal_id: 67, canonical: 0 },
    ]);
  });

  test('finds verses through FTS MATCH', () => {
    const rows = db
      .prepare(
        'SELECT v.text FROM verses_fts f JOIN verses v ON v.id = f.rowid WHERE verses_fts MATCH ?',
      )
      .all('светильник');

    expect(rows).toHaveLength(1);
    expect(rows[0].text).toContain('Светильник');
  });

  test('writes build metadata', () => {
    const meta = Object.fromEntries(
      db.prepare('SELECT key, value FROM meta').all().map((row) => [row.key, row.value]),
    );

    expect(meta.schema_version).toBe('2');
    expect(meta.translations).toBe('1');
    expect(meta.verses).toBe(String(countDatasetVerses(miniDataset)));
    expect(meta.built_at).toBeTruthy();
  });
});

describe('buildDatabase footnotes', () => {
  const miniFootnotes = () => ({
    byKey: new Map([
      ['mini|1|1|1', [{ marker: '+', text: 'First note' }, { marker: '†', text: 'Second note' }]],
      ['mini|1|2|1', [{ marker: null, text: 'Chapter two note' }]],
      ['mini|67|1|1', [{ marker: '+', text: 'Apocrypha note' }]],
      ['mini|1|3|99', [{ marker: '+', text: 'Orphan note' }]],
    ]),
    stats: { footnotes: 4 },
  });

  let dbPath;
  let db;
  let logger;

  beforeAll(() => {
    logger = createSpyLogger();
    dbPath = path.join(os.tmpdir(), `bible-footnotes-test-${process.pid}-${Date.now()}.db`);
    buildDatabase([miniDataset], { outputPath: dbPath, logger, footnotes: miniFootnotes() });
    db = new DatabaseSync(dbPath);
  });

  afterAll(() => {
    db.close();
    fs.rmSync(dbPath, { force: true });
  });

  test('attaches footnotes to the correct verse rows', () => {
    const rows = db
      .prepare(
        'SELECT b.universal_id AS bookId, v.chapter AS chapter, v.number AS verse, f.marker AS marker, f.text AS text FROM footnotes f JOIN verses v ON v.id = f.verse_id JOIN books b ON b.id = v.book_id ORDER BY f.id',
      )
      .all();

    expect(rows).toEqual([
      { bookId: 1, chapter: 1, verse: 1, marker: '+', text: 'First note' },
      { bookId: 1, chapter: 1, verse: 1, marker: '†', text: 'Second note' },
      { bookId: 1, chapter: 2, verse: 1, marker: null, text: 'Chapter two note' },
      { bookId: 67, chapter: 1, verse: 1, marker: '+', text: 'Apocrypha note' },
    ]);
  });

  test('reports footnote counts in stats and meta', () => {
    const meta = Object.fromEntries(
      db.prepare('SELECT key, value FROM meta').all().map((row) => [row.key, row.value]),
    );

    expect(meta.footnotes).toBe('4');
  });

  test('warns about orphan keys that matched no verse', () => {
    const orphanWarnings = logger.calls.warn.filter((call) => call.message.includes('did not match any dataset verse'));

    expect(orphanWarnings).toHaveLength(1);
    expect(orphanWarnings[0].payload).toEqual({ orphanCount: 1 });
  });

  test('passes foreign key check with footnotes present', () => {
    expect(db.prepare('PRAGMA foreign_key_check').all()).toHaveLength(0);
  });
});

describe('buildDatabase without footnotes', () => {
  test('builds a dataset when no footnote source is provided', () => {
    const dbPath = path.join(os.tmpdir(), `bible-nofn-test-${process.pid}-${Date.now()}.db`);
    const logger = createSpyLogger();
    try {
      const { stats } = buildDatabase([miniDataset], { outputPath: dbPath, logger });

      expect(stats[0].footnotes).toBe(0);
      const db = new DatabaseSync(dbPath);
      try {
        expect(db.prepare('SELECT COUNT(*) AS total FROM footnotes').get().total).toBe(0);
      } finally {
        db.close();
      }
    } finally {
      fs.rmSync(dbPath, { force: true });
    }
  });
});

describe('validateFootnoteCounts', () => {
  const sourceWith = (count) => ({ stats: { footnotes: count } });

  test('passes when inserted total matches the source', () => {
    const logger = createSpyLogger();
    validateFootnoteCounts([{ code: 'kjva', footnotes: 3 }], sourceWith(3), logger);

    expect(logger.calls.error).toHaveLength(0);
  });

  test('throws when the source provided notes but nothing was inserted', () => {
    const logger = createSpyLogger();

    expect(() => validateFootnoteCounts([{ code: 'kjva', footnotes: 0 }], sourceWith(19), logger)).toThrow(
      'none were inserted',
    );
  });

  test('throws when inserted total exceeds the source total', () => {
    const logger = createSpyLogger();

    expect(() => validateFootnoteCounts([{ code: 'kjva', footnotes: 25 }], sourceWith(19), logger)).toThrow(
      'source provided only 19',
    );
  });

  test('warns on the difference when fewer notes were inserted', () => {
    const logger = createSpyLogger();
    validateFootnoteCounts([{ code: 'kjva', footnotes: 15 }, { code: 'rst', footnotes: 0 }], sourceWith(19), logger);

    expect(logger.calls.warn).toHaveLength(1);
    expect(logger.calls.warn[0].payload).toEqual({ sourceTotal: 19, insertedTotal: 15, difference: 4 });
    expect(logger.calls.info[0].payload).toEqual({ translation: 'rst' });
  });

  test('skips validation without a footnote source', () => {
    const logger = createSpyLogger();
    validateFootnoteCounts([{ code: 'rst', footnotes: 0 }], null, logger);

    expect(logger.calls.warn).toHaveLength(0);
    expect(logger.calls.error).toHaveLength(0);
  });
});
