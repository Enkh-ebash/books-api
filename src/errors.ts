// Ошибка с HTTP-кодом: её превращает в ответ единый обработчик ошибок в app.ts
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: string[],
  ) {
    super(message);
  }
}

export const badRequest = (message: string, details?: string[]) =>
  new HttpError(400, "BAD_REQUEST", message, details);
export const notFound = (message: string) => new HttpError(404, "NOT_FOUND", message);
export const conflict = (message: string) => new HttpError(409, "CONFLICT", message);
