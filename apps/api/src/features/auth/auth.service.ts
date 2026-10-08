import type { AuthUser } from "@ruangdana/shared";
import type { Repos, UserRecord } from "../../db/types";
import { conflict, notFound, unauthorized, UniqueViolation } from "../../lib/errors";
import { burnPasswordCheck, hashPassword, verifyPassword } from "./password";
import { newSessionToken } from "./session-token";

export function toAuthUser(u: UserRecord): AuthUser {
  return { id: u.id, name: u.name, email: u.email, onboarded: u.onboardedAt !== null };
}

export function createAuthService(repos: Repos, sessionTtlMs: number) {
  async function startSession(userId: string) {
    const { token, tokenHash } = newSessionToken();
    await repos.sessions.create({ userId, tokenHash, expiresAt: new Date(Date.now() + sessionTtlMs) });
    return token;
  }

  return {
    async register(input: { name: string; email: string; password: string }) {
      const passwordHash = await hashPassword(input.password);
      try {
        const user = await repos.users.create({ name: input.name, email: input.email, passwordHash });
        return { user: toAuthUser(user), token: await startSession(user.id) };
      } catch (err) {
        if (err instanceof UniqueViolation) throw conflict("Email sudah terdaftar.", "EMAIL_TAKEN");
        throw err;
      }
    },

    async login(input: { email: string; password: string }) {
      const user = await repos.users.findByEmail(input.email);
      if (!user) {
        await burnPasswordCheck(input.password);
        throw unauthorized("Email atau kata sandi salah.");
      }
      if (!(await verifyPassword(user.passwordHash, input.password))) throw unauthorized("Email atau kata sandi salah.");
      return { user: toAuthUser(user), token: await startSession(user.id) };
    },

    logout: (tokenHash: string) => repos.sessions.deleteByTokenHash(tokenHash),

    async updateName(userId: string, name: string) {
      const user = await repos.users.update(userId, { name });
      if (!user) throw notFound();
      return toAuthUser(user);
    },

    async markOnboarded(userId: string) {
      const user = await repos.users.update(userId, { onboardedAt: new Date() });
      if (!user) throw notFound();
      return toAuthUser(user);
    },

    /** Mengganti kata sandi lalu mencabut semua sesi lain agar perangkat lain harus login ulang. */
    async changePassword(userId: string, currentTokenHash: string, currentPassword: string, newPassword: string) {
      const user = await repos.users.findById(userId);
      if (!user) throw notFound();
      if (!(await verifyPassword(user.passwordHash, currentPassword))) {
        throw unauthorized("Kata sandi saat ini salah.");
      }
      await repos.users.update(userId, { passwordHash: await hashPassword(newPassword) });
      await repos.sessions.deleteAllForUser(userId, currentTokenHash);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
