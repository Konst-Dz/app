const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const { buildDatabase } = require('../build-db.mjs');
const { miniDataset } = require('./fixtures/miniDataset.js');

const SILENT_LOGGER = { debug() {}, info() {}, warn() {}, error() {} };

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

    expect(meta.schema_version).toBe('1');
    expect(meta.translations).toBe('1');
    expect(meta.verses).toBe(String(countDatasetVerses(miniDataset)));
    expect(meta.built_at).toBeTruthy();
  });
});
