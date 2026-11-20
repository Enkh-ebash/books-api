import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { pool } from "./db";
import { HttpError, notFound } from "./errors";
import { logger } from "./logger";
import { authorsRouter } from "./routes/authors";
import { booksRouter } from "./routes/books";

export const app = express();

app.use(express.json({ limit: "100kb" }));

// Логирование каждого запроса: метод, путь, статус, время
app.use((req: Request, res: Response, next: NextFunction) => {
  const started = Date.now();
  res.on("finish", () => {
    logger.info("request", {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - started,
    });
  });
  next();
});

// Проверка живости сервиса и БД (используется healthcheck в Docker)
app.get("/health", async (_req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "unavailable", error: "База данных недоступна" });
  }
});

// Swagger UI (необязательная часть задания): http://localhost:3000/docs
try {
  const spec = YAML.parse(fs.readFileSync(path.join(__dirname, "..", "openapi.yaml"), "utf8"));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));
} catch (err) {
  logger.warn("Документация OpenAPI не загружена", { error: (err as Error).message });
}

app.use("/api/authors", authorsRouter);
app.use("/api/books", booksRouter);

// Неизвестный маршрут
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(notFound(`Маршрут ${req.method} ${req.path} не существует`));
});

// Единый обработчик ошибок: сервис не падает, а возвращает код и сообщение
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Внутренняя ошибка сервера";
  let details: string[] | undefined;

  if (err instanceof HttpError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    code = "INVALID_JSON";
    message = "Тело запроса содержит некорректный JSON";
  } else if (err?.type === "entity.too.large") {
    status = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "Тело запроса слишком большое";
  } else if (err?.code === "23505") {
    status = 409;
    code = "CONFLICT";
    message = "Запись с такими данными уже существует (нарушена уникальность)";
  } else if (err?.code === "23503") {
    status = 400;
    code = "BAD_REFERENCE";
    message = "Связанная запись не найдена (проверьте author_id)";
  } else if (err?.code === "22003" || err?.code === "22P02") {
    status = 400;
    code = "BAD_REQUEST";
    message = "Некорректное значение в запросе";
  }

  if (status >= 500) {
    logger.error("Необработанная ошибка", { method: req.method, path: req.originalUrl, error: err?.message });
  } else {
    logger.warn("Ошибка запроса", { method: req.method, path: req.originalUrl, status, code, message });
  }

  res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
});
