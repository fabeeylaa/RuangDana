import type { ErrorRequestHandler, RequestHandler } from "express";
import type { ApiErrorBody } from "@ruangdana/shared";
import { AppError } from "../lib/errors";

export const notFoundHandler: RequestHandler = (_req, res) => {
  const body: ApiErrorBody = { error: "Endpoint tidak ditemukan.", code: "NOT_FOUND" };
  res.status(404).json(body);
};

// Jangan bocorkan detail internal ke klien.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    const body: ApiErrorBody = { error: err.message, code: err.code, fields: err.fields };
    res.status(err.status).json(body);
    return;
  }
  // body JSON rusak dari express.json()
  if (err && typeof err === "object" && "type" in err && (err as { type: string }).type === "entity.parse.failed") {
    res.status(400).json({ error: "Format JSON tidak valid.", code: "BAD_JSON" } satisfies ApiErrorBody);
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Terjadi kesalahan pada server.", code: "INTERNAL" } satisfies ApiErrorBody);
};
