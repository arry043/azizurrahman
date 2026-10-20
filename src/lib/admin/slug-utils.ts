/**
 * Browser-safe utility to convert human-readable names to valid database slugs.
 * Mirrors the DB check constraint: lowercase alphanumeric and hyphens.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
