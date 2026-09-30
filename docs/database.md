[Back to README](../README.md)

# Database

The app ships a fully offline SQLite database bundled as a Metro asset. This page covers how `assets/db/bible.db` is built, where the text comes from, and how to refresh it.

## Overview

| Fact | Value |
| ---- | ----- |
| Asset path | `assets/db/bible.db` |
| Translations | `rst` — Синодальный перевод (RU), `kjva` — King James Version with Apocrypha (EN) |
| Composition | 78 RU books, 77 EN books (66 canonical in both), 73,732 verses total |
| Size | ~21 MB |
| Search | FTS5 virtual table `verses_fts` (external content on `verses`) |
| Build tool | Node.js ≥ 22 with built-in `node:sqlite` (no native addons) |

The database is rebuilt from source data by `npm run build:db`; it is committed to the repository so app builds never depend on the network.

## Commands

```bash
npm run build:db
npm test
```

- `build:db` downloads raw book JSON files into `scripts/data/getbible/` (gitignored cache), validates the datasets, and writes `assets/db/bible.db`. Re-runs are offline — the cache is reused. Set `LOG_LEVEL=debug` for verbose stdout; the default level is `info`.
- `test` runs the Jest suite (`scripts/__tests__/`), which covers the build pipeline, the data validator, and a smoke test against the real committed asset.

## Data source

Texts come from the [getbible.net v2 API](https://api.getbible.net/v2) — translations `synodal` and `kjva`. Both translations are public domain (Синодальный перевод 1876, King James Version 1769). The getbible v2 repository itself is GPL-3.0, but it is only used as a delivery channel for public domain texts; this project ships its own database built from those texts. Source details and licenses: [`scripts/data/README.md`](../scripts/data/README.md).

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
- `verses_fts` — FTS5 external-content index over `verses.text`, tokenizer `unicode61 remove_diacritics 2`.

The content database is immutable at runtime: no migrations, user data (bookmarks, history) will live in a separate writable database. Rebuild the asset instead of migrating it.

## Refreshing data

```bash
rm -rf scripts/data/getbible/
npm run build:db
npm test
```

Then commit the rebuilt `assets/db/bible.db` together with the test run.

## See Also

- [README](../README.md) — project landing page
- [`scripts/data/README.md`](../scripts/data/README.md) — raw source notes and licenses (in Russian)
- [`AGENTS.md`](../AGENTS.md) — project map for AI agents
