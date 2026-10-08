import "dotenv/config"; // muat apps/api/.env sebelum env dibaca
import { createApp } from "./app";
import { configFromEnv, loadEnv } from "./config/env";
import { createPrisma } from "./db/prisma/client";
import { createPrismaRepos } from "./db/prisma/repos";

const env = loadEnv();
const prisma = createPrisma(env.DATABASE_URL);
const app = createApp({ repos: createPrismaRepos(prisma), config: configFromEnv(env) });

const server = app.listen(env.PORT, () => {
  console.log(`RuangDana API berjalan di http://localhost:${env.PORT}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
