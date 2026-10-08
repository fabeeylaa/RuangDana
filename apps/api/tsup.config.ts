import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  outDir: "dist",
  clean: true,
  // Paket workspace berisi TypeScript mentah, jadi harus ikut di-bundle.
  noExternal: ["@ruangdana/shared"],
});
