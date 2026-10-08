import request from "supertest";
import { createApp } from "../app";
import type { AppConfig } from "../config/env";
import { createMemoryRepos } from "./memory-repos";

export const ORIGIN = "http://localhost:5173";

export function makeTestApp(overrides: Partial<AppConfig> = {}) {
  const config: AppConfig = {
    allowedOrigins: [ORIGIN],
    isProduction: false,
    sessionTtlMs: 60 * 60 * 1000,
    rateLimit: false,
    ...overrides,
  };
  return createApp({ repos: createMemoryRepos(), config });
}

export function agentFor(app: ReturnType<typeof makeTestApp>) {
  return request.agent(app).set("Origin", ORIGIN);
}

export async function registerUser(app: ReturnType<typeof makeTestApp>, email: string, name = "Pengguna Uji") {
  const agent = agentFor(app);
  const res = await agent.post("/api/auth/register").send({ name, email, password: "kata-sandi-aman-1" });
  return { agent, res };
}
