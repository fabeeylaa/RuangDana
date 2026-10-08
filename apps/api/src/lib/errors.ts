export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const badRequest = (msg: string, fields?: Record<string, string>) => new AppError(400, msg, "VALIDATION", fields);
export const unauthorized = (msg = "Silakan masuk terlebih dahulu.") => new AppError(401, msg, "UNAUTHORIZED");
export const forbidden = (msg = "Permintaan ditolak.") => new AppError(403, msg, "FORBIDDEN");
export const notFound = (msg = "Data tidak ditemukan.") => new AppError(404, msg, "NOT_FOUND");
export const unprocessable = (msg: string, code: string) => new AppError(422, msg, code);
export const conflict = (msg: string, code = "CONFLICT") => new AppError(409, msg, code);

/** Dilempar repository saat melanggar unique constraint. */
export class UniqueViolation extends Error {}
