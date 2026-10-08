import { defineConfig } from "drizzle-kit";

// Gera as migrations SQL do D1. Aplique com `wrangler d1 migrations apply ongsave-db`.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle/migrations",
});
