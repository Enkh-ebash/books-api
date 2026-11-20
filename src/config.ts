// Вся конфигурация берётся из переменных окружения (см. .env.example и docker-compose.yml)
export const config = {
  port: Number(process.env.PORT ?? 3000),
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? "books",
    password: process.env.DB_PASSWORD ?? "books",
    database: process.env.DB_NAME ?? "books",
  },
};
