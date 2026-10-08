import { Router } from "express";
import type { Repos } from "../../db/types";
import { parse } from "../../lib/validate";
import { currentAuth, requireAuth } from "../auth/auth.middleware";
import { createAccountSchema, idParamSchema, updateAccountSchema } from "./accounts.schemas";
import type { AccountsService } from "./accounts.service";

export function createAccountsRouter(deps: { repos: Repos; service: AccountsService }) {
  const { repos, service } = deps;
  const router = Router();
  router.use(requireAuth(repos));

  const userId = (req: Parameters<typeof currentAuth>[0]) => currentAuth(req).user.id;

  router.get("/", async (req, res) => {
    const includeArchived = req.query.archived === "true";
    res.json({ accounts: await service.list(userId(req), includeArchived) });
  });

  router.post("/", async (req, res) => {
    res.status(201).json({ account: await service.create(userId(req), parse(createAccountSchema, req.body)) });
  });

  router.patch("/:id", async (req, res) => {
    const id = parse(idParamSchema, req.params.id);
    res.json({ account: await service.update(userId(req), id, parse(updateAccountSchema, req.body)) });
  });

  router.post("/:id/archive", async (req, res) => {
    res.json({ account: await service.setArchived(userId(req), parse(idParamSchema, req.params.id), true) });
  });

  router.post("/:id/unarchive", async (req, res) => {
    res.json({ account: await service.setArchived(userId(req), parse(idParamSchema, req.params.id), false) });
  });

  return router;
}
