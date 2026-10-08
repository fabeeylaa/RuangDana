/**
 * Server dev TANPA database: data hilang saat proses berhenti.
 * Hanya untuk verifikasi alur frontend↔API bila PostgreSQL/Prisma belum siap. Jangan dipakai produksi.
 */
import { createApp } from "../app";
import { createMemoryRepos } from "./memory-repos";

const port = Number(process.env.PORT ?? 4000);
const origin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

createApp({
  repos: createMemoryRepos(),
  config: { allowedOrigins: [origin], isProduction: false, sessionTtlMs: 7 * 24 * 3600 * 1000, rateLimit: true },
}).listen(port, () => console.log(`[MEMORY — tanpa database] API di http://localhost:${port}`));
