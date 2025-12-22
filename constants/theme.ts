/**
 * AusflugFinder App Theme Configuration
 * Colors based on the original webapp design
 */

import { Platform } from "react-native";

// Brand Colors
export const BrandColors = {
  primary: "#22C55E",      // Green - Nature/Outdoor
  secondary: "#F59E0B",    // Orange/Yellow - Sun/Energy
  accent: "#3B82F6",       // Blue - Compass/Navigation
};

// Cost Badge Colors
export const CostColors: { [key: string]: string;[key: number]: string } = {
  0: "#22C55E",
  1: "#84CC16",
  2: "#F59E0B",
  3: "#F97316",
  4: "#EF4444",
  free: "#22C55E",
  low: "#84CC16",
  medium: "#F59E0B",
  high: "#F97316",
  very_high: "#EF4444",
};

// Semantic Colors
export const SemanticColors = {
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
};

export const Colors = {
  light: {
    text: "#0F172A",
    textSecondary: "#64748B",
    textDisabled: "#94A3B8",
    background: "#FFFFFF",
    surface: "#F8FAFC",
    card: "#FFFFFF",
    border: "#E2E8F0",
    tint: BrandColors.primary,
    icon: "#64748B",
    tabIconDefault: "#94A3B8",
    tabIconSelected: BrandColors.primary,
    primary: BrandColors.primary,
    secondary: BrandColors.secondary,
    accent: BrandColors.accent,
  },
  dark: {
    text: "#F8FAFC",
    textSecondary: "#94A3B8",
    textDisabled: "#64748B",
    background: "#0F172A",
    surface: "#1E293B",
    card: "#1E293B",
    border: "#334155",
    tint: BrandColors.primary,
    icon: "#94A3B8",
    tabIconDefault: "#64748B",
    tabIconSelected: BrandColors.primary,
    primary: BrandColors.primary,
    secondary: BrandColors.secondary,
    accent: BrandColors.accent,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  hero: 32,
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
