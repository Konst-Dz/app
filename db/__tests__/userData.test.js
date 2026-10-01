const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const { USER_DATA_SCHEMA_VERSION, applyUserMigrations } = require('@/db/userDataSchema');

function createConnection(db) {
  return {
    async execAsync(sql) {
      db.exec(sql);
    },
    async getFirstAsync(sql) {
      return db.prepare(sql).get() ?? null;
    },
  };
}

function readSchemaVersion(db) {
  return db.prepare('PRAGMA user_version').get().user_version;
}

function listTableNames(db) {
  return db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all()
    .map((row) => row.name);
}

describe('applyUserMigrations', () => {
  let dbPath;
  let db;

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `user-data-test-${process.pid}-${Date.now()}.db`);
    db = new DatabaseSync(dbPath);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(dbPath, { force: true });
  });

  it('applies version 1 on a fresh database', async () => {
    const applied = await applyUserMigrations(createConnection(db));

    expect(applied).toBe(USER_DATA_SCHEMA_VERSION);
    expect(readSchemaVersion(db)).toBe(USER_DATA_SCHEMA_VERSION);
    const tables = listTableNames(db);
    expect(tables).toContain('bookmarks');
    expect(tables).toContain('reading_history');
  });

  it('is idempotent on repeated runs and keeps existing rows', async () => {
    const connection = createConnection(db);
    await applyUserMigrations(connection);
    db.prepare(
      'INSERT INTO bookmarks (book_universal_id, chapter, verse_number, created_at) VALUES (1, 2, 7, 100)',
    ).run();

    const applied = await applyUserMigrations(connection);

    expect(applied).toBe(USER_DATA_SCHEMA_VERSION);
    const bookmarks = db.prepare('SELECT book_universal_id, chapter, verse_number FROM bookmarks').all();
    expect(bookmarks).toEqual([{ book_universal_id: 1, chapter: 2, verse_number: 7 }]);
  });

  it('skips migrations when the database is already up to date', async () => {
    await applyUserMigrations(createConnection(db));
    const statements = db.prepare('SELECT COUNT(*) AS count FROM sqlite_master').get();

    await applyUserMigrations(createConnection(db));

    expect(readSchemaVersion(db)).toBe(USER_DATA_SCHEMA_VERSION);
    expect(statements.count).toBe(db.prepare('SELECT COUNT(*) AS count FROM sqlite_master').get().count);
  });

  it('rejects a database newer than the supported schema version', async () => {
    db.exec('PRAGMA user_version = 99');

    await expect(applyUserMigrations(createConnection(db))).rejects.toThrow(/newer \(v99\) than supported/);
  });

  it('enforces uniqueness of a bookmark verse key', async () => {
    await applyUserMigrations(createConnection(db));
    const insert = () =>
      db
        .prepare(
          'INSERT INTO bookmarks (book_universal_id, chapter, verse_number, created_at) VALUES (1, 2, 7, 100)',
        )
        .run();

    insert();
    expect(insert).toThrow(/UNIQUE constraint failed/);
  });

  it('enforces uniqueness of a history position key', async () => {
    await applyUserMigrations(createConnection(db));
    const insert = () =>
      db
        .prepare(
          'INSERT INTO reading_history (book_universal_id, chapter, opened_at) VALUES (1, 2, 100)',
        )
        .run();

    insert();
    expect(insert).toThrow(/UNIQUE constraint failed/);
  });

  it('creates an index over bookmark creation time', async () => {
    await applyUserMigrations(createConnection(db));

    const index = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_bookmarks_created_at'")
      .get();
    expect(index).toEqual({ name: 'idx_bookmarks_created_at' });
  });
});
