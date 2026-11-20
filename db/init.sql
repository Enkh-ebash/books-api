-- Схема БД и тестовые данные. Выполняется один раз при первом запуске контейнера PostgreSQL.
CREATE TABLE IF NOT EXISTS authors (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    country    VARCHAR(60),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books (
    id         SERIAL PRIMARY KEY,
    title      VARCHAR(200) NOT NULL,
    author_id  INTEGER NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
    year       INTEGER CHECK (year BETWEEN 0 AND 2100),
    isbn       VARCHAR(17) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_author_id ON books(author_id);

INSERT INTO authors (name, country) VALUES
    ('Фёдор Достоевский', 'Россия'),
    ('Лев Толстой', 'Россия'),
    ('Антон Чехов', 'Россия')
ON CONFLICT DO NOTHING;

INSERT INTO books (title, author_id, year, isbn) VALUES
    ('Преступление и наказание', 1, 1866, '978-5-17-090000-1'),
    ('Идиот', 1, 1869, '978-5-17-090000-2'),
    ('Война и мир', 2, 1869, '978-5-17-090000-3'),
    ('Вишнёвый сад', 3, 1904, '978-5-17-090000-4')
ON CONFLICT DO NOTHING;
