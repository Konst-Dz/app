import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { synodalRu } from './synodalRu.mjs';
import { kjvEn } from './kjvEn.mjs';
import { DATA_DIR } from '../paths.mjs';

const BASE_URL = 'https://api.getbible.net/v2';
const REQUEST_DELAY_MS = 250;
const RETRY_DELAY_MS = 1000;
const MAX_ATTEMPTS = 3;

const sleep = (ms) => new Promise((resolveTimeout) => setTimeout(resolveTimeout, ms));

async function fetchBook(sourceName, nr, logger) {
  const filePath = resolve(DATA_DIR, 'getbible', sourceName, `${nr}.json`);
  if (existsSync(filePath)) {
    logger.debug('Book loaded from cache', { source: sourceName, nr });
    return JSON.parse(readFileSync(filePath, 'utf8'));
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/${sourceName}/${nr}.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${sourceName}/${nr}`);
      }
      const body = await response.json();
      if (body.nr !== nr) {
        throw new Error(`Book nr mismatch: expected ${nr}, got ${body.nr}`);
      }
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, JSON.stringify(body));
      logger.debug('Book downloaded', { source: sourceName, nr });
      await sleep(REQUEST_DELAY_MS);
      return body;
    } catch (error) {
      logger.warn('Book fetch attempt failed', { source: sourceName, nr, attempt, error: error.message });
      if (attempt === MAX_ATTEMPTS) {
        throw error;
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
}

export async function loadSources(logger) {
  const adapters = [synodalRu, kjvEn];
  const datasets = [];
  for (const adapter of adapters) {
    logger.info('Loading translation source', { translation: adapter.code, source: adapter.sourceName, books: adapter.rawBookNrs.length });
    const rawBooksByNr = {};
    for (const nr of adapter.rawBookNrs) {
      rawBooksByNr[nr] = await fetchBook(adapter.sourceName, nr, logger);
    }
    datasets.push(adapter.parse(rawBooksByNr, logger));
  }
  return datasets;
}
