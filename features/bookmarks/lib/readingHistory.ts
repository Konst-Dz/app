import { getUserDatabase } from '@/db/userData';

import { recordReadingPosition } from '../api/historyRepository';

export async function saveReadingPosition(
  bookUniversalId: number,
  chapter: number,
): Promise<void> {
  const database = await getUserDatabase();
  await recordReadingPosition(database, bookUniversalId, chapter);
}
