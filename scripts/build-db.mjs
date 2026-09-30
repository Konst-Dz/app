import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, renameSync, rmSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { loadSources } from './sources/index.mjs';
import { validateDatasets } from './validate.mjs';
import { DEFAULT_OUTPUT_PATH, SCHEMA_PATH } from './paths.mjs';

const SCHEMA_VERSION = '1';
const LOG_LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

function createLogger() {
  const threshold = LOG_LEVELS[String(process.env.LOG_LEVEL).toLowerCase()] ?? LOG_LEVELS.info;
  const write = (level, message, payload) => {
    if (LOG_LEVELS[level] < threshold) return;
    const line = `[${level}] ${message}`;
    if (payload === undefined) {
      console.log(line);
      return;
    }
    console.log(`${line} ${JSON.stringify(payload)}`);
  };
  return {
    debug: (message, payload) => write('debug', message, payload),
    info: (message, payload) => write('info', message, payload),
    warn: (message, payload) => write('warn', message, payload),
    error: (message, payload) => write('error', message, payload),
  };
}

export function applySchema(db) {
  db.exec(readFileSync(SCHEMA_PATH, 'utf8'));
}

function insertTranslation(db, dataset, logger) {
  if (!dataset || typeof dataset !== 'object') {
    throw new Error('Translation dataset must be an object');
  }
  const requiredFields = ['code', 'language', 'title', 'license', 'books'];
  for (const field of requiredFields) {
    if (dataset[field] === undefined) {
      throw new Error(`Translation "${dataset.code ?? 'unknown'}" is missing field "${field}"`);
    }
  }

  const insertTranslationStmt = db.prepare(
    'INSERT INTO translations (code, language, title, license) VALUES (?, ?, ?, ?)',
  );
  const insertBookStmt = db.prepare(
    'INSERT INTO books (translation_id, universal_id, order_num, title, short_title, chapter_count, canonical) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  const insertVerseStmt = db.prepare(
    'INSERT INTO verses (book_id, chapter, number, text) VALUES (?, ?, ?, ?)',
  );

  db.exec('BEGIN');
  try {
    const translationResult = insertTranslationStmt.run(
      dataset.code,
      dataset.language,
      dataset.title,
      dataset.license,
    );
    const translationId = Number(translationResult.lastInsertRowid);
    let verseCount = 0;

    dataset.books.forEach((book, bookIndex) => {
      if (!Array.isArray(book.chapters)) {
        throw new Error(`Book "${book.title}" of "${dataset.code}" has no chapters array`);
      }
      const bookResult = insertBookStmt.run(
        translationId,
        book.universalId,
        bookIndex + 1,
        book.title,
        book.shortTitle ?? book.title,
        book.chapters.length,
        book.canonical === false ? 0 : 1,
      );
      const bookId = Number(bookResult.lastInsertRowid);
      let bookVerseCount = 0;

      book.chapters.forEach((chapter) => {
        chapter.verses.forEach((verse) => {
          insertVerseStmt.run(bookId, chapter.number, verse.number, verse.text);
          bookVerseCount += 1;
        });
      });

      verseCount += bookVerseCount;
      logger.debug('Book inserted', {
        translation: dataset.code,
        book: book.title,
        chapters: book.chapters.length,
        verses: bookVerseCount,
      });
    });

    db.exec('COMMIT');
    logger.info('Translation inserted', { translation: dataset.code, verseCount });
    return { translationId, code: dataset.code, books: dataset.books.length, verses: verseCount };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function writeMeta(db, stats) {
  const insertMetaStmt = db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)');
  const totalVerses = stats.reduce((sum, stat) => sum + stat.verses, 0);
  insertMetaStmt.run('schema_version', SCHEMA_VERSION);
  insertMetaStmt.run('built_at', new Date().toISOString());
  insertMetaStmt.run('translations', String(stats.length));
  insertMetaStmt.run('verses', String(totalVerses));
}

function finalizeDatabase(db, logger) {
  db.exec("INSERT INTO verses_fts(verses_fts) VALUES('rebuild')");
  logger.debug('FTS index rebuilt');

  const quickCheck = db.prepare('PRAGMA quick_check').get();
  if (!quickCheck || quickCheck.quick_check !== 'ok') {
    throw new Error(`Database integrity check failed: ${JSON.stringify(quickCheck)}`);
  }
  logger.debug('quick_check passed');

  db.exec('VACUUM');
  logger.debug('VACUUM done');
}

export function buildDatabase(datasets, { outputPath = DEFAULT_OUTPUT_PATH, logger = createLogger() } = {}) {
  const tempPath = `${outputPath}.tmp`;
  mkdirSync(dirname(outputPath), { recursive: true });
  rmSync(tempPath, { force: true });

  const db = new DatabaseSync(tempPath);
  try {
    applySchema(db);
    logger.debug('Schema applied', { schemaPath: SCHEMA_PATH });

    const stats = datasets.map((dataset) => insertTranslation(db, dataset, logger));
    writeMeta(db, stats);
    finalizeDatabase(db, logger);
    db.close();

    renameSync(tempPath, outputPath);
    const fileSize = statSync(outputPath).size;
    logger.info('Database built', {
      outputPath,
      fileSize,
      translations: stats.length,
      verses: stats.reduce((sum, stat) => sum + stat.verses, 0),
    });
    return { stats, outputPath, fileSize };
  } catch (error) {
    try {
      db.close();
    } catch {
      logger.warn('Failed to close database after error');
    }
    rmSync(tempPath, { force: true });
    throw error;
  }
}

function parseOutputPath(argv) {
  const outIndex = argv.indexOf('--out');
  if (outIndex !== -1 && argv[outIndex + 1]) {
    return resolve(argv[outIndex + 1]);
  }
  return DEFAULT_OUTPUT_PATH;
}

async function main() {
  const logger = createLogger();
  const outputPath = parseOutputPath(process.argv.slice(2));
  logger.info('Building database', { outputPath });
  try {
    const datasets = await loadSources(logger);
    validateDatasets(datasets, logger);
    buildDatabase(datasets, { outputPath, logger });
  } catch (error) {
    logger.error('Database build failed', { error: error.message });
    process.exitCode = 1;
  }
}

if (process.argv[1] && process.argv[1].endsWith('build-db.mjs')) {
  main().catch((error) => {
    console.error(`[error] Unhandled build failure: ${error.message}`);
    process.exitCode = 1;
  });
}
