import { describe, expect, it } from "vitest";

import { read } from "../support/files";

const css = read("src/app/globals.css");

function token(name: string): string {
  const match = css.match(new RegExp(`--azr-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match?.[1]) {
    throw new Error(`token --azr-${name} not found`);
  }
  return match[1];
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

describe("design tokens", () => {
  it("define the approved brand palette", () => {
    expect({
      emerald: token("emerald"),
      green: token("green"),
      forest: token("forest"),
      gold: token("gold"),
      "gold-dark": token("gold-dark"),
      ivory: token("ivory"),
      cream: token("cream"),
      white: token("white"),
      text: token("text"),
      "text-muted": token("text-muted"),
      border: token("border"),
      error: token("error"),
    }).toEqual({
      emerald: "#07553d",
      green: "#16804a",
      forest: "#032f25",
      gold: "#c6a45a",
      "gold-dark": "#9a742d",
      ivory: "#fbf5e8",
      cream: "#f2e8d2",
      white: "#ffffff",
      text: "#23302a",
      "text-muted": "#6a706b",
      border: "#d9cfb9",
      error: "#b42318",
    });
  });

  // WCAG 2.2 AA: 4.5:1 for body text, 3:1 for large text and UI components.
  it.each([
    ["text", "ivory", 4.5],
    ["text", "cream", 4.5],
    ["text-muted", "ivory", 4.5],
    ["text-muted", "white", 4.5],
    ["emerald", "ivory", 4.5],
    ["ivory", "emerald", 4.5],
    ["ivory", "forest", 4.5],
    ["gold", "forest", 4.5],
    ["error", "white", 4.5],
    ["error", "ivory", 4.5],
    ["warning", "white", 4.5],
    ["gold-dark", "ivory", 3],
    ["green", "white", 4.5],
  ])("%s on %s meets %s:1", (fg, bg, minimum) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(minimum);
  });

  it("does not hard-code Tailwind's default palette", () => {
    expect(css).toContain("--color-*: initial;");
  });
});
