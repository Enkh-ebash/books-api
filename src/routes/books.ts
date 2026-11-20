import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../db";
import { notFound } from "../errors";
import { parseId, parseIntInRange, validateBook } from "../validation";

export const booksRouter = Router();

const SELECT_BOOK = `
  SELECT b.id, b.title, b.year, b.isbn, b.created_at,
         a.id AS author_id, a.name AS author_name
  FROM books b JOIN authors a ON a.id = b.author_id`;

// GET /api/books?q=&author_id=&limit=&offset= — список книг с поиском и пагинацией
booksRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseIntInRange(req.query.limit as string | undefined, "limit", 1, 100, 20);
    const offset = parseIntInRange(req.query.offset as string | undefined, "offset", 0, 1_000_000, 0);

    const where: string[] = [];
    const params: unknown[] = [];
    if (typeof req.query.q === "string" && req.query.q.trim() !== "") {
      params.push(`%${req.query.q.trim()}%`);
      where.push(`b.title ILIKE $${params.length}`);
    }
    if (req.query.author_id !== undefined) {
      params.push(parseId(req.query.author_id, "author_id"));
      where.push(`b.author_id = $${params.length}`);
    }
    params.push(limit, offset);
    const sql = `${SELECT_BOOK}
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY b.id LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/books/:id — одна книга
booksRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req.params.id);
    const { rows } = await pool.query(`${SELECT_BOOK} WHERE b.id = $1`, [id]);
    if (rows.length === 0) throw notFound(`Книга с id=${id} не найдена`);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/books — создать книгу
booksRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const b = validateBook(req.body);
    const { rows } = await pool.query(
      "INSERT INTO books (title, author_id, year, isbn) VALUES ($1, $2, $3, $4) RETURNING id",
      [b.title, b.author_id, b.year, b.isbn],
    );
    const created = await pool.query(`${SELECT_BOOK} WHERE b.id = $1`, [rows[0].id]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/books/:id — полностью обновить книгу
booksRouter.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req.params.id);
    const b = validateBook(req.body);
    const { rowCount } = await pool.query(
      "UPDATE books SET title = $1, author_id = $2, year = $3, isbn = $4 WHERE id = $5",
      [b.title, b.author_id, b.year, b.isbn, id],
    );
    if (rowCount === 0) throw notFound(`Книга с id=${id} не найдена`);
    const updated = await pool.query(`${SELECT_BOOK} WHERE b.id = $1`, [id]);
    res.json(updated.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/books/:id — удалить книгу
booksRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req.params.id);
    const { rowCount } = await pool.query("DELETE FROM books WHERE id = $1", [id]);
    if (rowCount === 0) throw notFound(`Книга с id=${id} не найдена`);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
