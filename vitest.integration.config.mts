import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

if (existsSync(".env.local")) {
  try {
    process.loadEnvFile?.(".env.local");
  } catch {
    // fallback if not available
  }
}

/** Integration tests against a running local Supabase (`npm run db:start` + `npm run db:reset`). */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/support/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 15_000,
  },
});
