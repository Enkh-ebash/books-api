import { Router, Request, Response, NextFunction } from "express";
import { pool } from "../db";
import { validateAuthor } from "../validation";

export const authorsRouter = Router();

// GET /api/authors — список авторов
authorsRouter.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, country, created_at FROM authors ORDER BY id",
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/authors — создать автора
authorsRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const a = validateAuthor(req.body);
    const { rows } = await pool.query(
      "INSERT INTO authors (name, country) VALUES ($1, $2) RETURNING id, name, country, created_at",
      [a.name, a.country],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});
