import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { logger } from '@/lib/logger';

import { applyUserMigrations, USER_DATA_SCHEMA_VERSION } from './userDataSchema';

const USER_DATABASE_NAME = 'user-data.db';

let userDatabasePromise: Promise<SQLiteDatabase> | null = null;

async function openUserDatabase(): Promise<SQLiteDatabase> {
  logger.debug('userData', 'Opening user data database', { name: USER_DATABASE_NAME });
  const db = await openDatabaseAsync(USER_DATABASE_NAME);
  if (!db) {
    throw new Error(`Failed to open user data database: ${USER_DATABASE_NAME}`);
  }
  const version = await applyUserMigrations(db);
  logger.info('userData', 'User data database ready', {
    schemaVersion: version,
    supportedVersion: USER_DATA_SCHEMA_VERSION,
  });
  return db;
}

export function getUserDatabase(): Promise<SQLiteDatabase> {
  if (userDatabasePromise === null) {
    userDatabasePromise = openUserDatabase().catch((cause: unknown) => {
      userDatabasePromise = null;
      logger.error('userData', 'Failed to open user data database', {
        name: USER_DATABASE_NAME,
        message: cause instanceof Error ? cause.message : String(cause),
      });
      throw cause;
    });
  }
  return userDatabasePromise;
}
