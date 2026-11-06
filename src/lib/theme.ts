import type { CSSProperties } from "react";
import type { Branding, FontKey } from "@/types";

const HEX_PATTERN = /^#([0-9a-f]{6})$/i;

export const FONT_OPTIONS: { value: FontKey; label: string }[] = [
  { value: "geist", label: "Modern sans (Geist)" },
  { value: "serif", label: "Classic serif (Fraunces)" },
  { value: "rounded", label: "Friendly rounded (Nunito)" },
];

export function isHexColor(value: string) {
  return HEX_PATTERN.test(value);
}

export function hexToRgb(hex: string): [number, number, number] {
  if (!isHexColor(hex)) throw new Error(`Invalid hex colour: ${hex}`);
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function relativeLuminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

export const LIGHT_TEXT = "#ffffff";
export const DARK_TEXT = "#0a0a0a";

export function readableForeground(background: string) {
  return contrastRatio(background, LIGHT_TEXT) >= contrastRatio(background, DARK_TEXT) ? LIGHT_TEXT : DARK_TEXT;
}

export interface ContrastWarning {
  field: "primary" | "accent";
  message: string;
}

export function brandingWarnings(branding: Pick<Branding, "primary" | "accent">): ContrastWarning[] {
  const warnings: ContrastWarning[] = [];
  if (!isHexColor(branding.primary) || !isHexColor(branding.accent)) return warnings;
  if (contrastRatio(branding.primary, LIGHT_TEXT) < 3) {
    warnings.push({
      field: "primary",
      message: "Primary colour is too light against white backgrounds. Links and outlines may be hard to read.",
    });
  }
  if (contrastRatio(branding.primary, readableForeground(branding.primary)) < 4.5) {
    warnings.push({
      field: "primary",
      message: "Button text on the primary colour does not meet WCAG AA contrast (4.5:1).",
    });
  }
  if (contrastRatio(branding.accent, readableForeground(branding.accent)) < 4.5) {
    warnings.push({
      field: "accent",
      message: "Text on the accent colour does not meet WCAG AA contrast (4.5:1).",
    });
  }
  return warnings;
}

function tint(color: string, percent: number) {
  return `color-mix(in oklch, ${color} ${percent}%, white)`;
}

export function buildThemeVars(branding: Branding): Record<string, string> {
  const primary = isHexColor(branding.primary) ? branding.primary : "#171717";
  const accent = isHexColor(branding.accent) ? branding.accent : primary;
  return {
    "--primary": primary,
    "--primary-foreground": readableForeground(primary),
    "--ring": primary,
    "--brand-accent": accent,
    "--brand-accent-foreground": readableForeground(accent),
    "--accent": tint(primary, 10),
    "--accent-foreground": primary,
    "--secondary": tint(primary, 6),
    "--secondary-foreground": primary,
    "--muted": tint(primary, 4),
    "--sidebar": tint(primary, 3),
    "--sidebar-primary": primary,
    "--sidebar-primary-foreground": readableForeground(primary),
    "--sidebar-accent": tint(primary, 10),
    "--sidebar-accent-foreground": primary,
    "--chart-1": primary,
    "--chart-2": accent,
    "--chart-3": tint(primary, 55),
    "--chart-4": tint(accent, 55),
    "--chart-5": tint(primary, 30),
    "--radius": `${branding.radius}rem`,
    "--font-sans": `var(--font-${branding.font})`,
  };
}

export function themeStyle(branding: Branding) {
  return buildThemeVars(branding) as CSSProperties;
}

export function applyThemeVars(element: HTMLElement, branding: Branding) {
  const vars = buildThemeVars(branding);
  for (const [name, value] of Object.entries(vars)) element.style.setProperty(name, value);
  return () => {
    for (const name of Object.keys(vars)) element.style.removeProperty(name);
  };
}
