PRAGMA foreign_keys = ON;

CREATE TABLE meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE translations (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL,
  title TEXT NOT NULL,
  license TEXT NOT NULL
);

CREATE TABLE books (
  id INTEGER PRIMARY KEY,
  translation_id INTEGER NOT NULL REFERENCES translations(id),
  universal_id INTEGER NOT NULL,
  order_num INTEGER NOT NULL,
  title TEXT NOT NULL,
  short_title TEXT NOT NULL,
  chapter_count INTEGER NOT NULL,
  canonical INTEGER NOT NULL DEFAULT 1,
  UNIQUE (translation_id, universal_id)
);

CREATE TABLE verses (
  id INTEGER PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES books(id),
  chapter INTEGER NOT NULL,
  number INTEGER NOT NULL,
  text TEXT NOT NULL,
  UNIQUE (book_id, chapter, number)
);

CREATE TABLE footnotes (
  id INTEGER PRIMARY KEY,
  verse_id INTEGER NOT NULL REFERENCES verses(id),
  marker TEXT,
  text TEXT NOT NULL
);

CREATE INDEX idx_books_translation_order ON books (translation_id, order_num);
CREATE INDEX idx_verses_book_chapter ON verses (book_id, chapter);
CREATE INDEX idx_footnotes_verse ON footnotes (verse_id);

CREATE VIRTUAL TABLE verses_fts USING fts5(
  text,
  content='verses',
  content_rowid='id',
  tokenize='unicode61 remove_diacritics 2'
);
