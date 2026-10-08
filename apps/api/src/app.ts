import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { healthRouter } from "./features/health/health.routes";
import { errorHandler, notFound } from "./middleware/error";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()) }));
  app.use(express.json({ limit: "100kb" }));

  app.use("/api/health", healthRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
