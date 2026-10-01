# Источники данных для сборки базы Библии

Сырые JSON-файлы (`getbible/`) и главы со сносками (`helloao/`) качаются скриптом `npm run build:db` и **не коммитятся** (см. `.gitignore`). Здесь фиксируются источники, лицензии и решения по составу переводов.

## Источник

- **getbible.net v2 API** — `https://api.getbible.net/v2/{translation}/{nr}.json`
  - `synodal` — Синодальный перевод (1876), 78 книг (66 канонических + 12 неканонических).
  - `kjva` — King James Version (1769) с апокрифами, 80 книг.
  - Код репозитория getbible/v2 — GPL-3.0, но сами тексты переводов public domain; приложение не распространяет их код или файлы verbatim, а собирает собственную базу из текстов public domain.

## Лицензии

| Перевод | Статус |
| ------- | ------ |
| Синодальный перевод (1876) | Public domain |
| King James Version (1769) + апокрифы | Public domain |

## Состав переводов (универсальные номера книг)

Таксономия книг — в `scripts/sources/bookTaxonomy.mjs`. Канонические книги: nr 1–66 (39 ВЗ + 27 НЗ). Неканонические: nr 67–84.

- **RU (`rst`)**: все 78 книг таксономии. Титулы: getbible называет греческую Ездру «1-я Ездры» (nr 67), в печатном синодальном это «2-я Ездры» — в таксономии печать; nr 68 соответственно «3-я Ездры» (16 глав).
- **EN (`kjva`)**: 77 книг — состав приведён к синодальному:
  - **Исключены** (нет отдельной книги в синодальном): nr 71 «Additions to Esther», nr 76 «Prayer of Azariah».
  - **Слиты в Даниила** (14 глав, как в синодальном): nr 77 «Susanna» → гл. 13, nr 78 «Bel and the Dragon» → гл. 14.
  - **Выделено из Варуха**: nr 84 «Epistle of Jeremiah» = гл. 6 KJV Варуха (в синодальном это отдельная книга).
  - **Отсутствует в EN**: nr 82 «3-я Маккавейская» — нет public-domain английского перевода в составе KJVA (валидация даёт WARN).
- Псалтирь RU содержит 151-й псалом (как в печатном синодальном); EN — 150.

## Сноски

Сноски к стихам берутся из [Free Use Bible API](https://bible.helloao.org) — перевод `eng_kja` («King James Version with Apocrypha»), public domain, API без ограничений на использование. Загрузчик `scripts/sources/footnotes.mjs` качает `books.json` и главы `/api/eng_kja/{BOOK}/{N}.json` с задержкой 250 мс, кэширует их в `scripts/data/helloao/` (не коммитится) и маппит на таксономию kjva:

- канонические книги — напрямую по USFM-кодам;
- Susanna → Даниил гл. 13, Bel → Даниил гл. 14 (как в составе kjva);
- Варух гл. 6 → «Послание Иеремии» (гл. 1);
- Additions to Esther и Prayer of Azariah пропускаются — их нет в составе kjva.

Формат сноски в API: `{ noteId, caller, text, reference: { chapter, verse } }`; `caller → footnotes.marker`, `text → footnotes.text`, привязка — по нумерации (книга/глава/стих) к стихам `kjva`. Синодальный перевод сносок не содержит ни в одном доступном public-domain источнике (getbible v2, `rus_syn` в helloao, USFM eBible.org) — в базе сноски есть только у `kjva`.

## Обновление данных

```bash
rm -rf scripts/data/getbible/
npm run build:db
```

Скрипт качает книги с задержкой 250 мс и кэширует их в `scripts/data/getbible/`, поэтому повторные сборки работают офлайн.
