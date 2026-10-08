import { Router } from "express";
import { z } from "zod";
import type { Repos } from "../../db/types";
import { isYearMonth } from "../../lib/dates";
import { parse } from "../../lib/validate";
import { currentAuth, requireAuth } from "../auth/auth.middleware";
import type { DashboardService } from "./dashboard.service";

const querySchema = z.object({
  month: z.preprocess((v) => (v === "" ? undefined : v), z.string().refine(isYearMonth, "Format bulan harus yyyy-mm.").optional()),
});

export function createDashboardRouter(deps: { repos: Repos; service: DashboardService }) {
  const { repos, service } = deps;
  const router = Router();
  router.use(requireAuth(repos));

  router.get("/", async (req, res) => {
    const { month } = parse(querySchema, req.query);
    res.json(await service.summary(currentAuth(req).user.id, month));
  });

  return router;
}
