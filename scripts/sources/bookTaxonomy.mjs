export const CANONICAL_BOOK_COUNT = 66;

const books = [
  { nr: 1, ru: ['Бытие', 'Быт'], en: ['Genesis', 'Gen'], chapters: 50 },
  { nr: 2, ru: ['Исход', 'Исх'], en: ['Exodus', 'Exo'], chapters: 40 },
  { nr: 3, ru: ['Левит', 'Лев'], en: ['Leviticus', 'Lev'], chapters: 27 },
  { nr: 4, ru: ['Числа', 'Числ'], en: ['Numbers', 'Num'], chapters: 36 },
  { nr: 5, ru: ['Второзаконие', 'Втор'], en: ['Deuteronomy', 'Deu'], chapters: 34 },
  { nr: 6, ru: ['Иисуса Навина', 'Нав'], en: ['Joshua', 'Jos'], chapters: 24 },
  { nr: 7, ru: ['Судей', 'Суд'], en: ['Judges', 'Jdg'], chapters: 21 },
  { nr: 8, ru: ['Руфь', 'Руфь'], en: ['Ruth', 'Rut'], chapters: 4 },
  { nr: 9, ru: ['1-я Царств', '1Цар'], en: ['1 Samuel', '1Sa'], chapters: 31 },
  { nr: 10, ru: ['2-я Царств', '2Цар'], en: ['2 Samuel', '2Sa'], chapters: 24 },
  { nr: 11, ru: ['3-я Царств', '3Цар'], en: ['1 Kings', '1Ki'], chapters: 22 },
  { nr: 12, ru: ['4-я Царств', '4Цар'], en: ['2 Kings', '2Ki'], chapters: 25 },
  { nr: 13, ru: ['1-я Паралипоменон', '1Пар'], en: ['1 Chronicles', '1Ch'], chapters: 29 },
  { nr: 14, ru: ['2-я Паралипоменон', '2Пар'], en: ['2 Chronicles', '2Ch'], chapters: 36 },
  { nr: 15, ru: ['Ездры', 'Езд'], en: ['Ezra', 'Ezr'], chapters: 10 },
  { nr: 16, ru: ['Неемии', 'Неем'], en: ['Nehemiah', 'Neh'], chapters: 13 },
  { nr: 17, ru: ['Есфирь', 'Есф'], en: ['Esther', 'Est'], chapters: 10 },
  { nr: 18, ru: ['Иов', 'Иов'], en: ['Job', 'Job'], chapters: 42 },
  { nr: 19, ru: ['Псалтирь', 'Пс'], en: ['Psalms', 'Psa'], chapters: { ru: 151, en: 150 } },
  { nr: 20, ru: ['Притчи', 'Притч'], en: ['Proverbs', 'Pro'], chapters: 31 },
  { nr: 21, ru: ['Екклесиаст', 'Еккл'], en: ['Ecclesiastes', 'Ecc'], chapters: 12 },
  { nr: 22, ru: ['Песнь Песней', 'Песн'], en: ['Song of Solomon', 'Sng'], chapters: 8 },
  { nr: 23, ru: ['Исаия', 'Ис'], en: ['Isaiah', 'Isa'], chapters: 66 },
  { nr: 24, ru: ['Иеремия', 'Иер'], en: ['Jeremiah', 'Jer'], chapters: 52 },
  { nr: 25, ru: ['Плач Иеремии', 'Плач'], en: ['Lamentations', 'Lam'], chapters: 5 },
  { nr: 26, ru: ['Иезекииль', 'Иез'], en: ['Ezekiel', 'Ezk'], chapters: 48 },
  { nr: 27, ru: ['Даниил', 'Дан'], en: ['Daniel', 'Dan'], chapters: { ru: 14, en: 14 } },
  { nr: 28, ru: ['Осия', 'Ос'], en: ['Hosea', 'Hos'], chapters: 14 },
  { nr: 29, ru: ['Иоиль', 'Иоил'], en: ['Joel', 'Jol'], chapters: 3 },
  { nr: 30, ru: ['Амос', 'Ам'], en: ['Amos', 'Amo'], chapters: 9 },
  { nr: 31, ru: ['Авдий', 'Авд'], en: ['Obadiah', 'Oba'], chapters: 1 },
  { nr: 32, ru: ['Иона', 'Иона'], en: ['Jonah', 'Jon'], chapters: 4 },
  { nr: 33, ru: ['Михей', 'Мих'], en: ['Micah', 'Mic'], chapters: 7 },
  { nr: 34, ru: ['Наум', 'Наум'], en: ['Nahum', 'Nam'], chapters: 3 },
  { nr: 35, ru: ['Аввакум', 'Авв'], en: ['Habakkuk', 'Hab'], chapters: 3 },
  { nr: 36, ru: ['Софония', 'Соф'], en: ['Zephaniah', 'Zep'], chapters: 3 },
  { nr: 37, ru: ['Аггей', 'Агг'], en: ['Haggai', 'Hag'], chapters: 2 },
  { nr: 38, ru: ['Захария', 'Зах'], en: ['Zechariah', 'Zec'], chapters: 14 },
  { nr: 39, ru: ['Малахия', 'Мал'], en: ['Malachi', 'Mal'], chapters: 4 },
  { nr: 40, ru: ['Матфей', 'Мф'], en: ['Matthew', 'Mat'], chapters: 28 },
  { nr: 41, ru: ['Марк', 'Мк'], en: ['Mark', 'Mrk'], chapters: 16 },
  { nr: 42, ru: ['Лука', 'Лк'], en: ['Luke', 'Luk'], chapters: 24 },
  { nr: 43, ru: ['Иоанн', 'Ин'], en: ['John', 'Jhn'], chapters: 21 },
  { nr: 44, ru: ['Деяния', 'Деян'], en: ['Acts', 'Act'], chapters: 28 },
  { nr: 45, ru: ['Римлянам', 'Рим'], en: ['Romans', 'Rom'], chapters: 16 },
  { nr: 46, ru: ['1-е Коринфянам', '1Кор'], en: ['1 Corinthians', '1Co'], chapters: 16 },
  { nr: 47, ru: ['2-е Коринфянам', '2Кор'], en: ['2 Corinthians', '2Co'], chapters: 13 },
  { nr: 48, ru: ['Галатам', 'Гал'], en: ['Galatians', 'Gal'], chapters: 6 },
  { nr: 49, ru: ['Ефесянам', 'Еф'], en: ['Ephesians', 'Eph'], chapters: 6 },
  { nr: 50, ru: ['Филиппийцам', 'Флп'], en: ['Philippians', 'Php'], chapters: 4 },
  { nr: 51, ru: ['Колоссянам', 'Кол'], en: ['Colossians', 'Col'], chapters: 4 },
  { nr: 52, ru: ['1-е Фессалоникийцам', '1Фес'], en: ['1 Thessalonians', '1Th'], chapters: 5 },
  { nr: 53, ru: ['2-е Фессалоникийцам', '2Фес'], en: ['2 Thessalonians', '2Th'], chapters: 3 },
  { nr: 54, ru: ['1-е Тимофею', '1Тим'], en: ['1 Timothy', '1Ti'], chapters: 6 },
  { nr: 55, ru: ['2-е Тимофею', '2Тим'], en: ['2 Timothy', '2Ti'], chapters: 4 },
  { nr: 56, ru: ['Титу', 'Тит'], en: ['Titus', 'Tit'], chapters: 3 },
  { nr: 57, ru: ['Филимону', 'Флм'], en: ['Philemon', 'Phm'], chapters: 1 },
  { nr: 58, ru: ['Евреям', 'Евр'], en: ['Hebrews', 'Heb'], chapters: 13 },
  { nr: 59, ru: ['Иакову', 'Иак'], en: ['James', 'Jas'], chapters: 5 },
  { nr: 60, ru: ['1-е Петру', '1Пет'], en: ['1 Peter', '1Pe'], chapters: 5 },
  { nr: 61, ru: ['2-е Петру', '2Пет'], en: ['2 Peter', '2Pe'], chapters: 3 },
  { nr: 62, ru: ['1-е Иоанну', '1Ин'], en: ['1 John', '1Jn'], chapters: 5 },
  { nr: 63, ru: ['2-е Иоанну', '2Ин'], en: ['2 John', '2Jn'], chapters: 1 },
  { nr: 64, ru: ['3-е Иоанну', '3Ин'], en: ['3 John', '3Jn'], chapters: 1 },
  { nr: 65, ru: ['Иуде', 'Иуд'], en: ['Jude', 'Jud'], chapters: 1 },
  { nr: 66, ru: ['Откровение', 'Откр'], en: ['Revelation', 'Rev'], chapters: 22 },
  { nr: 67, ru: ['2-я Ездры', '2Езд'], en: ['1 Esdras', '1Es'], chapters: 9 },
  { nr: 68, ru: ['3-я Ездры', '3Езд'], en: ['2 Esdras', '2Es'], chapters: 16 },
  { nr: 69, ru: ['Товит', 'Тов'], en: ['Tobit', 'Tob'], chapters: 14 },
  { nr: 70, ru: ['Юдифь', 'Иудф'], en: ['Judith', 'Jdt'], chapters: 16 },
  { nr: 73, ru: ['Премудрость Соломона', 'Прем'], en: ['Wisdom of Solomon', 'Wis'], chapters: 19 },
  { nr: 74, ru: ['Сирах', 'Сир'], en: ['Sirach', 'Sir'], chapters: 51 },
  { nr: 75, ru: ['Варух', 'Вар'], en: ['Baruch', 'Bar'], chapters: 5 },
  { nr: 79, ru: ['Молитва Манассии', 'Ман'], en: ['Prayer of Manasses', 'Man'], chapters: 1 },
  { nr: 80, ru: ['1-я Маккавейская', '1Мак'], en: ['1 Maccabees', '1Ma'], chapters: 16 },
  { nr: 81, ru: ['2-я Маккавейская', '2Мак'], en: ['2 Maccabees', '2Ma'], chapters: 15 },
  { nr: 82, ru: ['3-я Маккавейская', '3Мак'], en: null, chapters: 7 },
  { nr: 84, ru: ['Послание Иеремии', 'ПослИер'], en: ['Epistle of Jeremiah', 'EpJer'], chapters: 1 },
];

export const BOOK_TAXONOMY = books.map((book) => ({
  nr: book.nr,
  canonical: book.nr <= CANONICAL_BOOK_COUNT,
  ru: { title: book.ru[0], shortTitle: book.ru[1] },
  en: book.en === null ? null : { title: book.en[0], shortTitle: book.en[1] },
  chapters: book.chapters,
}));

export function getTaxonomyBook(nr) {
  const book = BOOK_TAXONOMY.find((entry) => entry.nr === nr);
  if (!book) {
    throw new Error(`Unknown universal book nr: ${nr}`);
  }
  return book;
}

const SUPPORTED_LANGUAGES = ['ru', 'en'];

export function taxonomyBooksForLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new Error(`Unknown language in taxonomy: ${language}`);
  }
  return BOOK_TAXONOMY.filter((entry) => entry[language] !== null);
}

export function referenceChapterCount(entry, language) {
  if (typeof entry.chapters === 'number') {
    return entry.chapters;
  }
  return entry.chapters[language];
}
