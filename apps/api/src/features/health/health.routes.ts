import { Router } from "express";
import type { HealthResponse } from "@ruangdana/shared";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  const body: HealthResponse = {
    status: "ok",
    service: "ruangdana-api",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  };
  res.json(body);
});
