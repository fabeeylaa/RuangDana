import { Router, type Response } from "express";
import rateLimit from "express-rate-limit";
import type { AppConfig } from "../../config/env";
import type { Repos } from "../../db/types";
import { parse } from "../../lib/validate";
import { currentAuth, requireAuth } from "./auth.middleware";
import { loginSchema, registerSchema } from "./auth.schemas";
import { toAuthUser, type AuthService } from "./auth.service";
import { SESSION_COOKIE } from "./session-token";

function setSessionCookie(res: Response, token: string, config: AppConfig) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    path: "/",
    maxAge: config.sessionTtlMs,
  });
}

export function createAuthRouter(deps: { repos: Repos; service: AuthService; config: AppConfig }) {
  const { repos, service, config } = deps;
  const router = Router();

  const limiter = (max: number, windowMs: number) =>
    config.rateLimit
      ? rateLimit({
          windowMs,
          limit: max,
          standardHeaders: "draft-7",
          legacyHeaders: false,
          message: { error: "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.", code: "RATE_LIMITED" },
        })
      : (_req: unknown, _res: unknown, next: () => void) => next();

  router.post("/register", limiter(10, 60 * 60 * 1000), async (req, res) => {
    const { user, token } = await service.register(parse(registerSchema, req.body));
    setSessionCookie(res, token, config);
    res.status(201).json({ user });
  });

  router.post("/login", limiter(10, 15 * 60 * 1000), async (req, res) => {
    const { user, token } = await service.login(parse(loginSchema, req.body));
    setSessionCookie(res, token, config);
    res.json({ user });
  });

  router.post("/logout", requireAuth(repos), async (req, res) => {
    await service.logout(currentAuth(req).tokenHash);
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    res.status(204).end();
  });

  router.get("/me", requireAuth(repos), (req, res) => {
    res.json({ user: toAuthUser(currentAuth(req).user) });
  });

  return router;
}
