export { BookmarksScreen } from './components/BookmarksScreen';
export {
  recordReadingPosition,
  type ReadingPosition,
} from './api/historyRepository';
export { useBookmarks } from './hooks/useBookmarks';
export { useBookmarkedVerses } from './hooks/useBookmarkedVerses';
export { useLastReadPosition } from './hooks/useLastReadPosition';
export { useRecentHistory } from './hooks/useRecentHistory';
export { useUserDataDatabase } from './hooks/useUserDataDatabase';
export { saveReadingPosition } from './lib/readingHistory';
export type { Bookmark } from './api/bookmarksRepository';
