/**
 * Kelen — Structured Logger
 *
 * Centralised logging utility for server-side and client-side use.
 * Controlled via the KELEN_LOG_LEVEL environment variable.
 *
 * Levels (ascending severity):
 *   debug → info → warn → error
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   const log = logger("gbp:auth");
 *   log.info("Token refreshed", { proId, expiresIn: 3600 });
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default to "info" in production, "debug" in development
function getConfiguredLevel(): LogLevel {
  const env = (
    process.env.KELEN_LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug")
  ).toLowerCase() as LogLevel;
  return LEVELS[env] !== undefined ? env : "info";
}

const CONFIGURED_LEVEL = getConfiguredLevel();

const COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m",  // cyan
  info:  "\x1b[32m",  // green
  warn:  "\x1b[33m",  // yellow
  error: "\x1b[31m",  // red
};
const RESET = "\x1b[0m";
const DIM   = "\x1b[2m";
const BOLD  = "\x1b[1m";

// ──────────────────────────────────────────────
// Core emit function
// ──────────────────────────────────────────────

function emit(
  level: LogLevel,
  namespace: string,
  message: string,
  meta?: Record<string, unknown>
) {
  if (LEVELS[level] < LEVELS[CONFIGURED_LEVEL]) return;

  const isServer = typeof window === "undefined";
  const ts = new Date().toISOString();

  if (isServer) {
    const color = COLORS[level];
    const metaStr = meta ? ` ${DIM}${JSON.stringify(meta)}${RESET}` : "";
    const prefix = `${DIM}${ts}${RESET} ${color}${BOLD}[${level.toUpperCase()}]${RESET} ${BOLD}[${namespace}]${RESET}`;
    // eslint-disable-next-line no-console
    console[level === "debug" ? "log" : level](`${prefix} ${message}${metaStr}`);
  } else {
    // Browser — use grouped output
    const styles: Record<LogLevel, string> = {
      debug: "color: #06b6d4; font-weight: bold",
      info:  "color: #22c55e; font-weight: bold",
      warn:  "color: #f59e0b; font-weight: bold",
      error: "color: #ef4444; font-weight: bold",
    };
    // eslint-disable-next-line no-console
    const fn = console[level === "debug" ? "log" : level] as (...a: unknown[]) => void;
    if (meta) {
      fn(`%c[${level.toUpperCase()}] [${namespace}]`, styles[level], message, meta);
    } else {
      fn(`%c[${level.toUpperCase()}] [${namespace}]`, styles[level], message);
    }
  }
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  /** Returns a child logger with an appended namespace segment */
  child(subNamespace: string): Logger;
  /** Wraps an async fn with start/end/error logs + duration */
  time<T>(label: string, fn: () => Promise<T>, meta?: Record<string, unknown>): Promise<T>;
}

export function logger(namespace: string): Logger {
  return {
    debug: (msg, meta) => emit("debug", namespace, msg, meta),
    info:  (msg, meta) => emit("info",  namespace, msg, meta),
    warn:  (msg, meta) => emit("warn",  namespace, msg, meta),
    error: (msg, meta) => emit("error", namespace, msg, meta),
    child: (sub) => logger(`${namespace}:${sub}`),

    async time<T>(label: string, fn: () => Promise<T>, meta?: Record<string, unknown>): Promise<T> {
      const start = Date.now();
      emit("debug", namespace, `→ ${label}`, meta);
      try {
        const result = await fn();
        emit("debug", namespace, `✓ ${label}`, { ...meta, ms: Date.now() - start });
        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        emit("error", namespace, `✗ ${label}`, { ...meta, ms: Date.now() - start, error: message });
        throw err;
      }
    },
  };
}

// ──────────────────────────────────────────────
// Pre-built namespaced loggers
// ──────────────────────────────────────────────

export const gbpLog      = logger("kelen:gbp");
export const authLog     = logger("kelen:gbp:auth");
export const oauthLog    = logger("kelen:gbp:oauth");
export const reviewsLog  = logger("kelen:gbp:reviews");
export const syncLog     = logger("kelen:gbp:sync");
export const routeLog    = logger("kelen:route");
export const middlewareLog = logger("kelen:middleware");
