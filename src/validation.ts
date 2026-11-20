import { badRequest } from "./errors";

// Положительное целое из параметра пути/запроса (например, :id)
export function parseId(value: unknown, name = "id"): number {
  const n = Number(value);
  if (typeof value !== "string" || !/^\d+$/.test(value) || !Number.isSafeInteger(n) || n < 1) {
    throw badRequest(`Параметр «${name}» должен быть положительным целым числом`);
  }
  return n;
}

// Необязательное целое с границами (для limit/offset)
export function parseIntInRange(value: unknown, name: string, min: number, max: number, def: number): number {
  if (value === undefined) return def;
  const n = Number(value);
  if (typeof value !== "string" || !/^\d+$/.test(value) || n < min || n > max) {
    throw badRequest(`Параметр «${name}» должен быть целым числом от ${min} до ${max}`);
  }
  return n;
}

export type Body = Record<string, unknown>;

export function requireObject(body: unknown): Body {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw badRequest("Тело запроса должно быть JSON-объектом");
  }
  return body as Body;
}

export interface AuthorInput {
  name: string;
  country: string | null;
}

export function validateAuthor(body: unknown): AuthorInput {
  const b = requireObject(body);
  const errors: string[] = [];

  if (typeof b.name !== "string" || b.name.trim().length < 1 || b.name.trim().length > 100) {
    errors.push("name: обязательная строка длиной 1–100 символов");
  }
  if (b.country !== undefined && b.country !== null &&
      (typeof b.country !== "string" || b.country.length > 60)) {
    errors.push("country: строка не длиннее 60 символов");
  }
  if (errors.length) throw badRequest("Некорректные данные автора", errors);

  return {
    name: (b.name as string).trim(),
    country: typeof b.country === "string" ? b.country.trim() || null : null,
  };
}

export interface BookInput {
  title: string;
  author_id: number;
  year: number | null;
  isbn: string | null;
}

export function validateBook(body: unknown): BookInput {
  const b = requireObject(body);
  const errors: string[] = [];

  if (typeof b.title !== "string" || b.title.trim().length < 1 || b.title.trim().length > 200) {
    errors.push("title: обязательная строка длиной 1–200 символов");
  }
  if (typeof b.author_id !== "number" || !Number.isInteger(b.author_id) || b.author_id < 1) {
    errors.push("author_id: обязательное положительное целое число");
  }
  if (b.year !== undefined && b.year !== null &&
      (typeof b.year !== "number" || !Number.isInteger(b.year) || b.year < 0 || b.year > 2100)) {
    errors.push("year: целое число от 0 до 2100");
  }
  if (b.isbn !== undefined && b.isbn !== null &&
      (typeof b.isbn !== "string" || !/^[0-9Xx-]{10,17}$/.test(b.isbn))) {
    errors.push("isbn: строка из 10–17 символов (цифры, X, дефис)");
  }
  if (errors.length) throw badRequest("Некорректные данные книги", errors);

  return {
    title: (b.title as string).trim(),
    author_id: b.author_id as number,
    year: typeof b.year === "number" ? b.year : null,
    isbn: typeof b.isbn === "string" ? b.isbn : null,
  };
}
