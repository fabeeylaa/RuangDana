import { Router } from "express";
import type { Repos } from "../../db/types";
import { parse } from "../../lib/validate";
import { currentAuth, requireAuth } from "../auth/auth.middleware";
import { createCategorySchema, type CategoriesService } from "./categories.service";

export function createCategoriesRouter(deps: { repos: Repos; service: CategoriesService }) {
  const { repos, service } = deps;
  const router = Router();
  router.use(requireAuth(repos));

  router.get("/", async (req, res) => {
    res.json({ categories: await service.list(currentAuth(req).user.id) });
  });

  router.post("/", async (req, res) => {
    res.status(201).json({ category: await service.create(currentAuth(req).user.id, parse(createCategorySchema, req.body)) });
  });

  return router;
}
