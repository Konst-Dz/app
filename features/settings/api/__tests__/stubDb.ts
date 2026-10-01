import type { SQLiteDatabase } from 'expo-sqlite';

export type DbMethod = 'getAllAsync' | 'getFirstAsync' | 'runAsync';

export interface CapturedCall {
  method: DbMethod;
  sql: string;
  params: unknown[];
}

export interface RunResult {
  lastInsertRowId: number;
  changes: number;
}

export interface StubDbOptions {
  allRows?: unknown[];
  firstRow?: unknown;
  runResult?: RunResult;
  failure?: Error | null;
}

export interface StubDb {
  calls: CapturedCall[];
  options: Required<StubDbOptions>;
  getAllAsync(sql: string, params: unknown[]): Promise<unknown[]>;
  getFirstAsync(sql: string, params: unknown[]): Promise<unknown>;
  runAsync(sql: string, params: unknown[]): Promise<RunResult>;
}

function throwIfFailed(db: StubDb): void {
  const failure = db.options.failure;
  if (failure !== null) {
    throw failure;
  }
}

export function createStubDb(options: StubDbOptions = {}): StubDb {
  const resolved: Required<StubDbOptions> = {
    allRows: [],
    firstRow: null,
    runResult: { lastInsertRowId: 1, changes: 1 },
    failure: null,
    ...options,
  };

  const db: StubDb = {
    calls: [],
    options: resolved,
    async getAllAsync(sql: string, params: unknown[]) {
      db.calls.push({ method: 'getAllAsync', sql, params });
      throwIfFailed(db);
      return db.options.allRows;
    },
    async getFirstAsync(sql: string, params: unknown[]) {
      db.calls.push({ method: 'getFirstAsync', sql, params });
      throwIfFailed(db);
      return db.options.firstRow;
    },
    async runAsync(sql: string, params: unknown[]) {
      db.calls.push({ method: 'runAsync', sql, params });
      throwIfFailed(db);
      return db.options.runResult;
    },
  };

  return db;
}

export function callsOf(db: StubDb, method: DbMethod): CapturedCall[] {
  return db.calls.filter((call) => call.method === method);
}

export function asDb(db: StubDb): SQLiteDatabase {
  return db as unknown as SQLiteDatabase;
}
