/**
 * Tiny structured logger. We wrap console so prod can swap in pino
 * without touching call sites. Never logs secrets — if you find
 * yourself needing to log a key, redact it at the call site.
 */

type Level = "debug" | "info" | "warn" | "error";

interface LogFields {
  [k: string]: unknown;
}

function write(level: Level, msg: string, fields?: LogFields): void {
  const line = {
    t: new Date().toISOString(),
    level,
    msg,
    ...(fields ?? {}),
  };
  const fn =
    level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(JSON.stringify(line));
}

export const log = {
  debug: (msg: string, fields?: LogFields) =>
    process.env.NODE_ENV !== "production" && write("debug", msg, fields),
  info: (msg: string, fields?: LogFields) => write("info", msg, fields),
  warn: (msg: string, fields?: LogFields) => write("warn", msg, fields),
  error: (msg: string, fields?: LogFields) => write("error", msg, fields),
};
