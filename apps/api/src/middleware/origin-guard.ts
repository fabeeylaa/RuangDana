import type { RequestHandler } from "express";
import { forbidden } from "../lib/errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Lapisan CSRF tambahan di atas cookie SameSite=Lax:
 * permintaan yang mengubah data wajib berasal dari origin frontend yang diizinkan.
 * Permintaan tanpa header Origin (mis. curl/tes server-ke-server) tidak membawa cookie browser lintas-situs.
 */
export function originGuard(allowedOrigins: string[]): RequestHandler {
  return (req, _res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) throw forbidden("Origin tidak diizinkan.");
    next();
  };
}
