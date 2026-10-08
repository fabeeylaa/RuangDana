import { Router } from "express";
import type { Repos } from "../../db/types";
import { parse } from "../../lib/validate";
import { currentAuth, requireAuth } from "../auth/auth.middleware";
import { changePasswordSchema, updateProfileSchema } from "../auth/auth.schemas";
import type { AuthService } from "../auth/auth.service";

export function createProfileRouter(deps: { repos: Repos; service: AuthService }) {
  const { repos, service } = deps;
  const router = Router();
  router.use(requireAuth(repos));

  router.patch("/", async (req, res) => {
    const { name } = parse(updateProfileSchema, req.body);
    res.json({ user: await service.updateName(currentAuth(req).user.id, name) });
  });

  router.post("/password", async (req, res) => {
    const { currentPassword, newPassword } = parse(changePasswordSchema, req.body);
    const auth = currentAuth(req);
    await service.changePassword(auth.user.id, auth.tokenHash, currentPassword, newPassword);
    res.status(204).end();
  });

  router.post("/onboarded", async (req, res) => {
    res.json({ user: await service.markOnboarded(currentAuth(req).user.id) });
  });

  return router;
}
