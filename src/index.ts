import { app } from "./app";
import { config } from "./config";
import { pool, waitForDb } from "./db";
import { logger } from "./logger";

// Любая непойманная ошибка логируется, а не молча роняет процесс
process.on("unhandledRejection", (reason) => logger.error("unhandledRejection", { reason: String(reason) }));
process.on("uncaughtException", (err) => logger.error("uncaughtException", { error: err.message }));

async function main(): Promise<void> {
  await waitForDb();
  const server = app.listen(config.port, () => logger.info(`Сервис запущен на порту ${config.port}`));

  // Корректная остановка контейнера (docker stop отправляет SIGTERM)
  const shutdown = (signal: string) => {
    logger.info(`Получен ${signal}, останавливаемся`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.error("Не удалось запустить сервис", { error: err.message });
  process.exit(1);
});
