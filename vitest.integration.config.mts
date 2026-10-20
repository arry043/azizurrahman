import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

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
