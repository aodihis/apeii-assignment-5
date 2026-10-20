const LEVELS = ["debug", "info", "warn", "error"] as const;
type LogLevel = (typeof LEVELS)[number];

function resolveLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  return (LEVELS as readonly string[]).includes(raw) ? (raw as LogLevel) : "info";
}

const thresholdIndex = LEVELS.indexOf(resolveLevel());

function write(level: LogLevel, message: string, fields?: Record<string, unknown>) {
  if (LEVELS.indexOf(level) < thresholdIndex) return;
  const line = { time: new Date().toISOString(), level, message, ...fields };
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  sink(JSON.stringify(line));
}

// Set LOG_LEVEL in .env to debug/info/warn/error (default "info"); anything below the
// configured level is dropped, so "error" silences everything but failures.
export const logger = {
  debug: (message: string, fields?: Record<string, unknown>) => write("debug", message, fields),
  info: (message: string, fields?: Record<string, unknown>) => write("info", message, fields),
  warn: (message: string, fields?: Record<string, unknown>) => write("warn", message, fields),
  error: (message: string, fields?: Record<string, unknown>) => write("error", message, fields),
};
