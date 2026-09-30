const { referenceChapterCount, taxonomyBooksForLanguage } = require('../../sources/bookTaxonomy.mjs');

function fullValidDataset(code = 'valid') {
  const books = taxonomyBooksForLanguage('ru').map((entry) => ({
    universalId: entry.nr,
    title: entry.ru.title,
    shortTitle: entry.ru.shortTitle,
    canonical: entry.canonical,
    chapters: Array.from({ length: referenceChapterCount(entry, 'ru') }, (_, chapterIndex) => ({
      number: chapterIndex + 1,
      verses: [{ number: 1, text: `Стих книги ${entry.nr}, глава ${chapterIndex + 1}.` }],
    })),
  }));

  return {
    code,
    language: 'ru',
    title: 'Полный фикстурный перевод',
    license: 'Public Domain',
    books,
  };
}

module.exports = { fullValidDataset };
