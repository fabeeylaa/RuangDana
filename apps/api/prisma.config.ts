import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // Fallback agar `prisma generate` tidak butuh .env; nilainya sama dengan docker-compose.yml.
    url: process.env.DATABASE_URL ?? "postgresql://ruangdana:ruangdana_dev@localhost:5432/ruangdana",
  },
});
