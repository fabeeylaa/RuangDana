import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
});

export type Env = z.infer<typeof schema>;

export interface AppConfig {
  allowedOrigins: string[];
  isProduction: boolean;
  sessionTtlMs: number;
  /** Matikan rate limit hanya untuk tes otomatis. */
  rateLimit: boolean;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return schema.parse(source);
}

export function configFromEnv(env: Env): AppConfig {
  return {
    allowedOrigins: env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean),
    isProduction: env.NODE_ENV === "production",
    sessionTtlMs: env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
    rateLimit: true,
  };
}
