import { resolve } from 'node:path';

const PROJECT_ROOT = process.cwd();

export const SCHEMA_PATH = resolve(PROJECT_ROOT, 'scripts', 'schema.sql');
export const DEFAULT_OUTPUT_PATH = resolve(PROJECT_ROOT, 'assets', 'db', 'bible.db');
export const DATA_DIR = resolve(PROJECT_ROOT, 'scripts', 'data');
