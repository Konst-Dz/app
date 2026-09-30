import type { Book } from '@/db/models';

export interface BookSection {
  title: string;
  data: Book[];
}

const OLD_TESTAMENT_LAST_UNIVERSAL_ID = 39;

const SECTION_TITLES = {
  oldTestament: 'Ветхий Завет',
  newTestament: 'Новый Завет',
  nonCanonical: 'Неканонические книги',
} as const;

export function groupBooksByTestament(books: Book[]): BookSection[] {
  const oldTestament: Book[] = [];
  const newTestament: Book[] = [];
  const nonCanonical: Book[] = [];

  for (const book of books) {
    if (!book.canonical) {
      nonCanonical.push(book);
      continue;
    }
    if (book.universalId <= OLD_TESTAMENT_LAST_UNIVERSAL_ID) {
      oldTestament.push(book);
      continue;
    }
    newTestament.push(book);
  }

  const sections: BookSection[] = [];
  if (oldTestament.length > 0) {
    sections.push({ title: SECTION_TITLES.oldTestament, data: oldTestament });
  }
  if (newTestament.length > 0) {
    sections.push({ title: SECTION_TITLES.newTestament, data: newTestament });
  }
  if (nonCanonical.length > 0) {
    sections.push({ title: SECTION_TITLES.nonCanonical, data: nonCanonical });
  }
  return sections;
}
