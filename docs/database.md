[Back to README](../README.md)

# Database

The app ships a fully offline SQLite database bundled as a Metro asset. This page covers how `assets/db/bible.db` is built, where the text comes from, and how to refresh it.

## Overview

| Fact | Value |
| ---- | ----- |
| Asset path | `assets/db/bible.db` |
| Translations | `rst` — Синодальный перевод (RU), `kjva` — King James Version with Apocrypha (EN) |
| Composition | 78 RU books, 77 EN books (66 canonical in both), 73,732 verses total |
| Footnotes | 6,959 KJV translator notes on `kjva` verses only (see [Footnotes](#footnotes)) |
| Size | ~21 MB |
| Search | FTS5 virtual table `verses_fts` (external content on `verses`) |
| Build tool | Node.js ≥ 22 with built-in `node:sqlite` (no native addons) |

The database is rebuilt from source data by `npm run build:db`; it is committed to the repository so app builds never depend on the network.

## Commands

```bash
npm run build:db
npm test
```

- `build:db` downloads raw book JSON files into `scripts/data/getbible/` and footnote chapters into `scripts/data/helloao/` (both gitignored caches), validates the datasets, and writes `assets/db/bible.db`. Re-runs are offline — the caches are reused. Set `LOG_LEVEL=debug` for verbose stdout; the default level is `info`.
- `test` runs the Jest suite (`scripts/__tests__/`), which covers the build pipeline, the data validator, and a smoke test against the real committed asset.

## Data source

Texts come from the [getbible.net v2 API](https://api.getbible.net/v2) — translations `synodal` and `kjva`. Both translations are public domain (Синодальный перевод 1876, King James Version 1769). The getbible v2 repository itself is GPL-3.0, but it is only used as a delivery channel for public domain texts; this project ships its own database built from those texts. Footnotes come from the [Free Use Bible API](https://bible.helloao.org) (`eng_kja`, public domain). Source details and licenses: [`scripts/data/README.md`](../scripts/data/README.md).

## Footnotes

Footnotes are attached to `kjva` verses during the build (`scripts/sources/footnotes.mjs` + `insertTranslation` in `scripts/build-db.mjs`). The current asset carries 6,959 notes; the densest books are Psalms (772), Isaiah (553) and Ezekiel (423):

- **Source:** Free Use Bible API, translation `eng_kja` («King James Version with Apocrypha»), public domain. Chapters are fetched once and cached in `scripts/data/helloao/eng_kja/`.
- **Mapping:** `caller → footnotes.marker`, `text → footnotes.text`; the note binds by book/chapter/verse numbering, not by verse id. Composition follows the kjva dataset: Susanna → Daniel ch. 13, Bel → Daniel ch. 14, Baruch ch. 6 → Epistle of Jeremiah. `Additions to Esther` and `Prayer of Azariah` are skipped.
- **No Russian footnotes:** no public-domain machine-readable footnotes exist for the Synodal text (checked getbible v2, `rus_syn` on the same API, and eBible.org USFM). The `rst` dataset legitimately builds with zero footnotes — the app renders no footnote markers for it and this is not an error state.
- **Runtime:** `features/reading/api/footnotesRepository.ts` loads a chapter's footnotes with a join over `verses` (indexed by `idx_footnotes_verse`); the UI opens a bottom sheet on a verse tap when the verse has notes.
- **Orphan notes:** a footnote whose key matches no dataset verse is skipped with a build `WARN`; `PRAGMA foreign_key_check` must stay empty.

## Translation composition

A universal book taxonomy (`scripts/sources/bookTaxonomy.mjs`) maps every book to a stable id: 1–66 for canonical books, 67–84 for non-canonical ones. The English translation is aligned with the synodal composition:

| Adjustment | Books | Effect |
| ---------- | ----- | ------ |
| Merged into Daniel | Susanna, Bel and the Dragon | EN Daniel has 14 chapters, matching the synodal structure |
| Split from Baruch | Epistle of Jeremiah (KJV Baruch chapter 6) | Becomes its own book, as in the synodal edition |
| Excluded | Additions to Esther, Prayer of Azariah | No separate book in the synodal canon |
| Absent in EN | 3-я Маккавейская | No public-domain English counterpart; build logs a `WARN` |

Esdras numbering follows the printed synodal edition: universal id 67 is «2-я Ездры» (RU) / «1 Esdras» (EN), id 68 is «3-я Ездры» / «2 Esdras».

## Validation

Before the asset is written, `scripts/validate.mjs` checks every translation against the taxonomy:

- canonical book coverage (missing → error), non-canonical gaps (warning);
- reference chapter counts per book (e.g. RU Psalms 151, EN 150, Daniel 14 in both);
- sequential chapter numbering, duplicate or empty verses (errors), verse numbering gaps (warnings).

A failing validation aborts the build with a non-zero exit code.

## Schema

`scripts/schema.sql` defines:

- `translations`, `books` (with `universal_id` for cross-translation identity), `verses`, `footnotes`, `meta`;
- indexes: `idx_books_translation_order`, `idx_verses_book_chapter`, `idx_footnotes_verse`;
- `verses_fts` — FTS5 external-content index over `verses.text`, tokenizer `unicode61 remove_diacritics 2`.

The content database is immutable at runtime: no migrations. Rebuild the asset instead of migrating it.

## User data database

Bookmarks, reading history and settings live in a separate writable database, `user-data.db`, opened via `openDatabaseAsync` (see `db/userData.ts`). It is created on demand on the app filesystem and never ships as an asset, so content asset rebuilds can never overwrite or corrupt user data.

- **Schema owner:** `db/userDataSchema.ts` — idempotent migrations applied sequentially and tracked with `PRAGMA user_version` (each migration runs inside a transaction).
- **Tables (v1):** `bookmarks` (unique per `book_universal_id + chapter + verse_number`), `reading_history` (unique per `book_universal_id + chapter`, upserted on every chapter open).
- **Tables (v2):** `settings` — a key-value store (`key TEXT PRIMARY KEY, value TEXT NOT NULL`); the selected translation code is stored under `selected_translation` and read by `TranslationProvider` at startup (fallback: `rst`).
- **Stable keys:** verses are referenced by `(book_universal_id, chapter, verse_number)`, not by `verses.id` — the id is regenerated on every content asset rebuild. No foreign keys cross the two databases.
- **Repositories:** `features/bookmarks/api/` and `features/settings/api/` own all SQL against `user-data.db`; `features/reading` and `features/search` consume features only through their public APIs.
- **Tests:** `db/__tests__/userData.test.js` runs the migration sequence against a real SQLite database (via `node:sqlite`).

## Refreshing data

```bash
rm -rf scripts/data/getbible/ scripts/data/helloao/
npm run build:db
npm test
```

Then commit the rebuilt `assets/db/bible.db` together with the test run.

## See Also

- [README](../README.md) — project landing page
- [`scripts/data/README.md`](../scripts/data/README.md) — raw source notes and licenses (in Russian)
- [`AGENTS.md`](../AGENTS.md) — project map for AI agents
