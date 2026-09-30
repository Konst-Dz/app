type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const isDevBuild = process.env.NODE_ENV !== 'production';

function parseLevel(value: string | undefined): LogLevel | null {
  if (value === 'debug' || value === 'info' || value === 'warn' || value === 'error') {
    return value;
  }
  return null;
}

function isEnabled(level: LogLevel): boolean {
  if (!isDevBuild) {
    return false;
  }
  const activeLevel = parseLevel(process.env.LOG_LEVEL) ?? 'debug';
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[activeLevel];
}

function emit(level: LogLevel, scope: string, message: string, data?: Record<string, unknown>): void {
  if (!isEnabled(level)) {
    return;
  }
  const prefix = `[${scope}] ${message}`;
  if (level === 'error') {
    console.error(prefix, data ?? '');
    return;
  }
  if (level === 'warn') {
    console.warn(prefix, data ?? '');
    return;
  }
  if (level === 'info') {
    console.info(prefix, data ?? '');
    return;
  }
  console.debug(prefix, data ?? '');
}

export const logger = {
  debug(scope: string, message: string, data?: Record<string, unknown>): void {
    emit('debug', scope, message, data);
  },
  info(scope: string, message: string, data?: Record<string, unknown>): void {
    emit('info', scope, message, data);
  },
  warn(scope: string, message: string, data?: Record<string, unknown>): void {
    emit('warn', scope, message, data);
  },
  error(scope: string, message: string, data?: Record<string, unknown>): void {
    emit('error', scope, message, data);
  },
};
