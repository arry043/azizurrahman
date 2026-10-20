import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const ROOT = join(import.meta.dirname, "..", "..");

/** Recursively list files under `dir` (relative to repo root) matching `pattern`. */
export function listFiles(dir: string, pattern: RegExp): string[] {
  const absolute = join(ROOT, dir);
  const results: string[] = [];
  for (const entry of readdirSync(absolute)) {
    const path = join(absolute, entry);
    if (statSync(path).isDirectory()) {
      results.push(...listFiles(relative(ROOT, path), pattern));
    } else if (pattern.test(entry)) {
      results.push(relative(ROOT, path));
    }
  }
  return results.sort();
}

export function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}
