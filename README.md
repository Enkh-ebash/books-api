# Books API — учебный REST-микросервис «Библиотека»

Микросервис на **Node.js (Express, TypeScript)** с реляционной БД **PostgreSQL**. Сервис и БД запускаются вместе одной командой в Docker-контейнерах (docker-compose, multi-stage сборка).

## Запуск

```bash
git clone <адрес-репозитория>
cd books-api
cp .env.example .env        # необязательно: значения по умолчанию уже заданы
docker compose up -d --build
```

Проверка: `curl http://localhost:3000/health` → `{"status":"ok"}`.
Документация Swagger UI: http://localhost:3000/docs

Остановка: `docker compose down` (данные сохраняются в томе `db_data`; `docker compose down -v` удалит и данные).
Логи: `docker compose logs -f api`.

## Эндпоинты

| Метод | Путь | Описание | Успех |
|---|---|---|---|
| GET | `/health` | проверка сервиса и БД | 200 |
| GET | `/api/authors` | список авторов | 200 |
| POST | `/api/authors` | создать автора | 201 |
| GET | `/api/books?q=&author_id=&limit=&offset=` | список книг (поиск, фильтр, пагинация) | 200 |
| GET | `/api/books/{id}` | книга по id | 200 |
| POST | `/api/books` | создать книгу | 201 |
| PUT | `/api/books/{id}` | обновить книгу | 200 |
| DELETE | `/api/books/{id}` | удалить книгу | 204 |

Пример:

```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Мёртвые души","author_id":1,"year":1842}'
```

## Обработка ошибок

Сервис не падает на некорректных данных, а возвращает HTTP-код и сообщение в едином формате:

```json
{ "error": { "code": "BAD_REQUEST", "message": "Некорректные данные книги", "details": ["year: целое число от 0 до 2100"] } }
```

| Ситуация | Код |
|---|---|
| неверные поля, `id` не число, неверные `limit`/`offset` | 400 `BAD_REQUEST` |
| некорректный JSON в теле | 400 `INVALID_JSON` |
| `author_id` не существует | 400 `BAD_REFERENCE` |
| книга не найдена, неизвестный маршрут | 404 `NOT_FOUND` |
| дубликат (имя автора, ISBN) | 409 `CONFLICT` |
| слишком большое тело | 413 |
| внутренняя ошибка | 500 `INTERNAL_ERROR` (подробности только в логе) |

## Логирование

Каждый запрос и каждая ошибка пишутся в stdout в формате JSON (`docker compose logs api`).

## Проверка в Postman

Импортируйте `postman/books-api.postman_collection.json` (File → Import). Переменная `baseUrl` по умолчанию `http://localhost:3000` (для ВМ укажите её IP). Запустите коллекцию через **Collection Runner**: 15 запросов, 24 проверки (успешные сценарии и ошибки 400/404).

## Структура проекта

```
├── Dockerfile              # multi-stage: build → prod-deps → runtime
├── docker-compose.yml      # сервисы api + db, healthcheck, том для данных
├── db/init.sql             # схема (authors, books) и тестовые данные
├── openapi.yaml            # описание API для Swagger UI
├── postman/                # коллекция Postman
└── src/                    # исходный код (TypeScript)
    ├── index.ts            # запуск, ожидание БД, корректная остановка
    ├── app.ts              # маршруты, логирование, обработчик ошибок
    ├── routes/             # authors.ts, books.ts
    ├── validation.ts       # проверка входных данных
    ├── db.ts, config.ts, logger.ts, errors.ts
```

## Схема БД

`authors (id, name UNIQUE, country, created_at)` ← `books (id, title, author_id FK, year, isbn UNIQUE, created_at)`
