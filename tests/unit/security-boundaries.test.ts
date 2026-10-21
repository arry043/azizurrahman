import { describe, expect, it } from "vitest";

import { listFiles, read } from "../support/files";

const sourceFiles = listFiles("src", /\.(ts|tsx)$/);
const SERVER_ONLY_MODULES = [
  "@/lib/env/server",
  "@/lib/supabase/server",
  "@/lib/supabase/public",
  "@/lib/supabase/service-role",
  "@/lib/logger",
  "@/lib/rate-limit",
];
const SECRET_VARIABLES = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "APPOINTMENT_LOOKUP_SECRET",
];

function isClientModule(source: string): boolean {
  return /^\s*["']use client["']/m.test(source.split("\n").slice(0, 5).join("\n"));
}

describe("server/client boundaries", () => {
  it("client components never import server-only modules", () => {
    const offenders = sourceFiles.filter((file) => {
      const source = read(file);
      return (
        isClientModule(source) && SERVER_ONLY_MODULES.some((mod) => source.includes(`"${mod}"`))
      );
    });
    expect(offenders).toEqual([]);
  });

  it("secret variables are only read in src/lib/env/server.ts", () => {
    const readers = sourceFiles.filter((file) =>
      SECRET_VARIABLES.some((name) => read(file).includes(`process.env.${name}`)),
    );
    expect(readers).toEqual(["src/lib/env/server.ts"]);
  });

  it("the service-role key getter is only used by the service-role client", () => {
    const users = sourceFiles.filter(
      (file) => file !== "src/lib/env/server.ts" && read(file).includes("getServiceRoleKey"),
    );
    expect(users).toEqual(["src/lib/supabase/service-role.ts"]);
  });

  it('every server-only module declares `import "server-only"`', () => {
    const moduleFiles = SERVER_ONLY_MODULES.map((mod) => `${mod.replace("@/", "src/")}.ts`);
    for (const file of moduleFiles) {
      expect(read(file), file).toMatch(/^import "server-only";/m);
    }
  });

  it("no secret is exposed through a NEXT_PUBLIC_ variable", () => {
    const files = [...sourceFiles, ".env.example"];
    const offenders = files.filter((file) =>
      /NEXT_PUBLIC_[A-Z_]*(SERVICE_ROLE|SECRET|RESEND|PRIVATE)/.test(read(file)),
    );
    expect(offenders).toEqual([]);
  });

  it(".env.example contains placeholders only", () => {
    const assignments = read(".env.example")
      .split("\n")
      .filter((line) => /^[A-Z_]+=/.test(line));
    for (const line of assignments) {
      const [name, value = ""] = line.split("=", 2);
      if (name === "NEXT_PUBLIC_SITE_URL") {
        expect(value).toBe("http://localhost:3000");
      } else {
        expect(value, `${name} must be empty in .env.example`).toBe("");
      }
    }
  });
});
