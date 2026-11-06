import { describe, expect, it } from "vitest";
import { brandingWarnings, buildThemeVars, contrastRatio, readableForeground } from "@/lib/theme";

describe("theme engine", () => {
  it("computes WCAG contrast ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });

  it("picks a readable foreground for brand colours", () => {
    expect(readableForeground("#0b6e4f")).toBe("#ffffff");
    expect(readableForeground("#f2c14e")).toBe("#0a0a0a");
  });

  it("maps branding onto the design-token CSS variables", () => {
    const vars = buildThemeVars({ primary: "#6d28d9", accent: "#f472b6", radius: 1, font: "rounded" });
    expect(vars["--primary"]).toBe("#6d28d9");
    expect(vars["--primary-foreground"]).toBe("#ffffff");
    expect(vars["--radius"]).toBe("1rem");
    expect(vars["--font-sans"]).toBe("var(--font-rounded)");
  });

  it("warns when a primary colour is too light to be legible", () => {
    expect(brandingWarnings({ primary: "#fde68a", accent: "#000000" }).some((warning) => warning.field === "primary")).toBe(true);
    expect(brandingWarnings({ primary: "#0b6e4f", accent: "#f2c14e" })).toEqual([]);
  });
});
