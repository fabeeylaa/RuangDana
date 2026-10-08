import { Router } from "express";
import type { Repos } from "../../db/types";
import { parse } from "../../lib/validate";
import { currentAuth, requireAuth } from "../auth/auth.middleware";
import {
  createTransactionSchema, idParamSchema, listTransactionsQuerySchema, updateTransactionSchema,
} from "./transactions.schemas";
import type { TransactionsService } from "./transactions.service";

export function createTransactionsRouter(deps: { repos: Repos; service: TransactionsService }) {
  const { repos, service } = deps;
  const router = Router();
  router.use(requireAuth(repos));
  const userId = (req: Parameters<typeof currentAuth>[0]) => currentAuth(req).user.id;

  router.get("/", async (req, res) => {
    res.json(await service.list(userId(req), parse(listTransactionsQuerySchema, req.query)));
  });

  router.post("/", async (req, res) => {
    res.status(201).json({ transaction: await service.create(userId(req), parse(createTransactionSchema, req.body)) });
  });

  router.patch("/:id", async (req, res) => {
    const id = parse(idParamSchema, req.params.id);
    res.json({ transaction: await service.update(userId(req), id, parse(updateTransactionSchema, req.body)) });
  });

  router.delete("/:id", async (req, res) => {
    await service.remove(userId(req), parse(idParamSchema, req.params.id));
    res.status(204).end();
  });

  return router;
}
