export const USER_DATA_SCHEMA_VERSION = 1;

export interface UserSchemaConnection {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<TRow>(sql: string): Promise<TRow | null>;
}

export const USER_DATA_MIGRATIONS: readonly string[] = [
  `
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_universal_id INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse_number INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE (book_universal_id, chapter, verse_number)
    );

    CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks (created_at DESC);

    CREATE TABLE IF NOT EXISTS reading_history (
      book_universal_id INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      opened_at INTEGER NOT NULL,
      UNIQUE (book_universal_id, chapter)
    );
  `,
];

interface SchemaVersionRow {
  user_version: number;
}

function buildMigrationSql(version: number, ddl: string): string {
  return `
    BEGIN TRANSACTION;
    ${ddl}
    PRAGMA user_version = ${version};
    COMMIT;
  `;
}

export async function applyUserMigrations(db: UserSchemaConnection): Promise<number> {
  const row = await db.getFirstAsync<SchemaVersionRow>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion > USER_DATA_SCHEMA_VERSION) {
    throw new Error(
      `User data database is newer (v${currentVersion}) than supported (v${USER_DATA_SCHEMA_VERSION})`,
    );
  }
  if (currentVersion === USER_DATA_SCHEMA_VERSION) {
    return currentVersion;
  }

  for (let version = currentVersion + 1; version <= USER_DATA_SCHEMA_VERSION; version += 1) {
    const ddl = USER_DATA_MIGRATIONS[version - 1];
    if (ddl === undefined) {
      throw new Error(`Missing migration for user data version ${version}`);
    }
    await db.execAsync(buildMigrationSql(version, ddl));
  }
  return USER_DATA_SCHEMA_VERSION;
}
