const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const ASSET_PATH = path.join(__dirname, '..', '..', 'assets', 'db', 'bible.db');

describe('bundled bible.db asset', () => {
  let db;

  beforeAll(() => {
    db = new DatabaseSync(ASSET_PATH, { readOnly: true });
  });

  afterAll(() => {
    db.close();
  });

  test('exposes 78 synodal books, 66 of them canonical', () => {
    const row = db
      .prepare(
        "SELECT COUNT(*) AS total, SUM(b.canonical) AS canonicalTotal FROM books b JOIN translations t ON t.id = b.translation_id WHERE t.code = 'rst'",
      )
      .get();

    expect(row.total).toBe(78);
    expect(row.canonicalTotal).toBe(66);
  });

  test('exposes 77 English books matching the synodal composition', () => {
    const row = db
      .prepare(
        "SELECT COUNT(*) AS total, SUM(b.canonical) AS canonicalTotal FROM books b JOIN translations t ON t.id = b.translation_id WHERE t.code = 'kjva'",
      )
      .get();

    expect(row.total).toBe(77);
    expect(row.canonicalTotal).toBe(66);
  });

  test('has no English book outside the synodal book list', () => {
    const rows = db
      .prepare(
        "SELECT b.universal_id FROM books b JOIN translations t ON t.id = b.translation_id WHERE t.code = 'kjva' AND b.universal_id NOT IN (SELECT b2.universal_id FROM books b2 JOIN translations t2 ON t2.id = b2.translation_id WHERE t2.code = 'rst')",
      )
      .all();

    expect(rows).toHaveLength(0);
  });

  test('finds Russian verses through FTS MATCH', () => {
    const rows = db
      .prepare(
        "SELECT v.id FROM verses_fts f JOIN verses v ON v.id = f.rowid JOIN books b ON b.id = v.book_id JOIN translations t ON t.id = b.translation_id WHERE verses_fts MATCH ? AND t.code = 'rst' LIMIT 5",
      )
      .all('Бог');

    expect(rows.length).toBeGreaterThan(0);
  });

  test('opens Genesis 1:1 in both translations', () => {
    const rows = db
      .prepare(
        'SELECT t.code, v.text FROM verses v JOIN books b ON b.id = v.book_id JOIN translations t ON t.id = b.translation_id WHERE b.universal_id = 1 AND v.chapter = 1 AND v.number = 1 ORDER BY t.code',
      )
      .all();

    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.code === 'rst').text).toContain('В начале');
    expect(rows.find((row) => row.code === 'kjva').text).toContain('In the beginning');
  });
});
