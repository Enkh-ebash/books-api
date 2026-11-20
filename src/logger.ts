// Простое JSON-логирование в stdout (его собирает `docker compose logs`)
type Level = "info" | "warn" | "error";

function log(level: Level, message: string, extra: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ time: new Date().toISOString(), level, message, ...extra });
  (level === "error" ? console.error : console.log)(line);
}

export const logger = {
  info: (message: string, extra?: Record<string, unknown>) => log("info", message, extra),
  warn: (message: string, extra?: Record<string, unknown>) => log("warn", message, extra),
  error: (message: string, extra?: Record<string, unknown>) => log("error", message, extra),
};
