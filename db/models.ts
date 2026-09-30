export interface Translation {
  id: number;
  code: string;
  language: string;
  title: string;
  license: string;
}

export interface Book {
  id: number;
  translationId: number;
  universalId: number;
  orderNum: number;
  title: string;
  shortTitle: string;
  chapterCount: number;
  canonical: boolean;
}

export interface Verse {
  id: number;
  bookId: number;
  chapter: number;
  number: number;
  text: string;
}

export interface Footnote {
  id: number;
  verseId: number;
  marker: string | null;
  text: string;
}

export interface BookRow {
  id: number;
  translation_id: number;
  universal_id: number;
  order_num: number;
  title: string;
  short_title: string;
  chapter_count: number;
  canonical: number;
}

export interface VerseRow {
  id: number;
  book_id: number;
  chapter: number;
  number: number;
  text: string;
}

export interface FootnoteRow {
  id: number;
  verse_id: number;
  marker: string | null;
  text: string;
}

export function toBook(row: BookRow): Book {
  return {
    id: row.id,
    translationId: row.translation_id,
    universalId: row.universal_id,
    orderNum: row.order_num,
    title: row.title,
    shortTitle: row.short_title,
    chapterCount: row.chapter_count,
    canonical: row.canonical === 1,
  };
}

export function toVerse(row: VerseRow): Verse {
  return {
    id: row.id,
    bookId: row.book_id,
    chapter: row.chapter,
    number: row.number,
    text: row.text,
  };
}

export function toFootnote(row: FootnoteRow): Footnote {
  return {
    id: row.id,
    verseId: row.verse_id,
    marker: row.marker,
    text: row.text,
  };
}
