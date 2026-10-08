import type { RequestHandler } from "express";
import type { Repos, UserRecord } from "../../db/types";
import { unauthorized } from "../../lib/errors";
import { hashToken, SESSION_COOKIE } from "./session-token";

declare module "express-serve-static-core" {
  interface Request {
    auth?: { user: UserRecord; tokenHash: string };
  }
}

export function requireAuth(repos: Repos): RequestHandler {
  return async (req, _res, next) => {
    const token = req.cookies?.[SESSION_COOKIE];
    if (typeof token !== "string" || token.length === 0) throw unauthorized();
    const tokenHash = hashToken(token);
    const found = await repos.sessions.findValidByTokenHash(tokenHash, new Date());
    if (!found) throw unauthorized("Sesi berakhir. Silakan masuk kembali.");
    req.auth = { user: found.user, tokenHash };
    next();
  };
}

/** Dipakai di route yang sudah melewati requireAuth. */
export function currentAuth(req: Express.Request & { auth?: { user: UserRecord; tokenHash: string } }) {
  if (!req.auth) throw unauthorized();
  return req.auth;
}
