const { validateDatasets } = require('../validate.mjs');
const { fullValidDataset } = require('./fixtures/fullValidDataset.js');

function captureLogger() {
  const calls = { debug: [], info: [], warn: [], error: [] };
  const logger = {
    debug: (message, payload) => calls.debug.push([message, payload]),
    info: (message, payload) => calls.info.push([message, payload]),
    warn: (message, payload) => calls.warn.push([message, payload]),
    error: (message, payload) => calls.error.push([message, payload]),
  };
  return { logger, calls };
}

function findBook(dataset, universalId) {
  return dataset.books.find((book) => book.universalId === universalId);
}

describe('validateDatasets', () => {
  test('accepts a fully valid dataset without warnings', () => {
    const { logger, calls } = captureLogger();

    expect(() => validateDatasets([fullValidDataset()], logger)).not.toThrow();
    expect(calls.error).toHaveLength(0);
    expect(calls.warn).toHaveLength(0);
  });

  test('errors on a missing canonical book', () => {
    const dataset = fullValidDataset();
    dataset.books = dataset.books.filter((book) => book.universalId !== 1);
    const { logger } = captureLogger();

    expect(() => validateDatasets([dataset], logger)).toThrow(/missing canonical book 1/);
  });

  test('only warns on a missing non-canonical book', () => {
    const dataset = fullValidDataset();
    dataset.books = dataset.books.filter((book) => book.universalId !== 67);
    const { logger, calls } = captureLogger();

    expect(() => validateDatasets([dataset], logger)).not.toThrow();
    expect(calls.warn.some(([message]) => message.includes('non-canonical book 67'))).toBe(true);
  });

  test('errors on duplicate verse numbers', () => {
    const dataset = fullValidDataset();
    findBook(dataset, 1).chapters[0].verses = [
      { number: 1, text: 'Первый стих.' },
      { number: 1, text: 'Второй стих с тем же номером.' },
    ];
    const { logger } = captureLogger();

    expect(() => validateDatasets([dataset], logger)).toThrow(/duplicate verse 1/);
  });

  test('errors on empty verse text', () => {
    const dataset = fullValidDataset();
    findBook(dataset, 1).chapters[0].verses = [{ number: 1, text: '   ' }];
    const { logger } = captureLogger();

    expect(() => validateDatasets([dataset], logger)).toThrow(/empty text/);
  });

  test('errors on a chapter count mismatch', () => {
    const dataset = fullValidDataset();
    findBook(dataset, 1).chapters.pop();
    const { logger } = captureLogger();

    expect(() => validateDatasets([dataset], logger)).toThrow(/chapters, expected 50/);
  });

  test('errors on broken chapter numbering', () => {
    const dataset = fullValidDataset();
    findBook(dataset, 1).chapters[0].number = 2;
    const { logger } = captureLogger();

    expect(() => validateDatasets([dataset], logger)).toThrow(/broken chapter numbering/);
  });

  test('only warns on verse numbering gaps', () => {
    const dataset = fullValidDataset();
    findBook(dataset, 1).chapters[0].verses = [
      { number: 1, text: 'Первый стих.' },
      { number: 3, text: 'Третий стих вместо второго.' },
    ];
    const { logger, calls } = captureLogger();

    expect(() => validateDatasets([dataset], logger)).not.toThrow();
    expect(calls.warn.some(([message]) => message.includes('verse numbering gaps'))).toBe(true);
  });

  test('errors on duplicate translation codes', () => {
    const { logger } = captureLogger();

    expect(() => validateDatasets([fullValidDataset('dup'), fullValidDataset('dup')], logger)).toThrow(
      /Duplicate translation code/,
    );
  });

  test('errors on an empty dataset list', () => {
    const { logger } = captureLogger();

    expect(() => validateDatasets([], logger)).toThrow(/No translation datasets/);
  });
});
