import { Pool } from "pg";
import { config } from "./config";
import { logger } from "./logger";

export const pool = new Pool({ ...config.db, max: 10 });

// Ошибка пула не должна ронять процесс
pool.on("error", (err) => logger.error("Ошибка соединения с БД", { error: err.message }));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// При старте контейнеров БД может быть ещё не готова — пробуем подключиться несколько раз
export async function waitForDb(attempts = 30, delayMs = 2000): Promise<void> {
  for (let i = 1; i <= attempts; i++) {
    try {
      await pool.query("SELECT 1");
      logger.info("Подключение к БД установлено");
      return;
    } catch (err) {
      logger.warn(`БД недоступна (попытка ${i}/${attempts})`, { error: (err as Error).message });
      await sleep(delayMs);
    }
  }
  throw new Error("Не удалось подключиться к БД");
}
