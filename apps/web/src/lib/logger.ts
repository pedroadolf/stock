/**
 * Stock Structured Logger
 * Salida JSON lista para Loki / Promtail.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  ts: string;
  service: string;
  requestId?: string;
  userId?: string;
  path?: string;
  meta?: any;
  error?: string;
}

const SERVICE_NAME = 'stock-web';

function log(level: LogLevel, message: string, meta: any = {}, error?: any) {
  const entry: LogEntry = {
    level,
    message,
    ts: new Date().toISOString(),
    service: SERVICE_NAME,
    meta: meta || {},
  };

  // Extraer requestId de meta si existe
  if (meta?.requestId) {
    entry.requestId = meta.requestId;
    delete meta.requestId;
  }

  if (error) {
    entry.error = error instanceof Error ? error.stack : String(error);
  }

  // En desarrollo lo mostramos bonito, en prod JSON puro
  if (process.env.NODE_ENV === 'development') {
    const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[32m';
    console.log(`${color}[${level.toUpperCase()}]\x1b[0m ${message}`, meta ? meta : '');
    if (error) console.error(error);
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (msg: string, meta?: any) => log('info', msg, meta),
  warn: (msg: string, meta?: any) => log('warn', msg, meta),
  error: (msg: string, error?: any, meta?: any) => log('error', msg, meta, error),
  debug: (msg: string, meta?: any) => log('debug', msg, meta),
};
