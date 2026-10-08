import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import type { AppConfig } from "./config/env";
import type { Repos } from "./db/types";
import { createAccountsRouter } from "./features/accounts/accounts.routes";
import { createAccountsService } from "./features/accounts/accounts.service";
import { createCategoriesRouter } from "./features/categories/categories.routes";
import { createCategoriesService } from "./features/categories/categories.service";
import { createDashboardRouter } from "./features/dashboard/dashboard.routes";
import { createDashboardService } from "./features/dashboard/dashboard.service";
import { createTransactionsRouter } from "./features/transactions/transactions.routes";
import { createTransactionsService } from "./features/transactions/transactions.service";
import { createAuthRouter } from "./features/auth/auth.routes";
import { createAuthService } from "./features/auth/auth.service";
import { healthRouter } from "./features/health/health.routes";
import { createProfileRouter } from "./features/profile/profile.routes";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { originGuard } from "./middleware/origin-guard";

export function createApp(deps: { repos: Repos; config: AppConfig }) {
  const { repos, config } = deps;
  const app = express();
  app.disable("x-powered-by");
  // Di belakang reverse proxy produksi, atur TRUST_PROXY agar rate limit membaca IP klien yang benar.
  if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

  app.use(helmet());
  app.use(cors({ origin: config.allowedOrigins, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use("/api", originGuard(config.allowedOrigins));

  const authService = createAuthService(repos, config.sessionTtlMs);
  const accountsService = createAccountsService(repos);
  const transactionsService = createTransactionsService(repos);
  const categoriesService = createCategoriesService(repos);
  const dashboardService = createDashboardService(repos);

  app.use("/api/health", healthRouter);
  app.use("/api/auth", createAuthRouter({ repos, service: authService, config }));
  app.use("/api/profile", createProfileRouter({ repos, service: authService }));
  app.use("/api/accounts", createAccountsRouter({ repos, service: accountsService }));
  app.use("/api/transactions", createTransactionsRouter({ repos, service: transactionsService }));
  app.use("/api/categories", createCategoriesRouter({ repos, service: categoriesService }));
  app.use("/api/dashboard", createDashboardRouter({ repos, service: dashboardService }));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
