import { openDatabaseSync } from 'expo-sqlite';

export const DATABASE_NAME = 'bible.db';

export function getDatabase() {
  return openDatabaseSync(DATABASE_NAME);
}
