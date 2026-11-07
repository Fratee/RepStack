/**
 * WCAG 2.1 Relative Luminance and Contrast Ratio Algorithm
 * Calculates the mathematically and perceptually optimal contrast text color
 * for solid backgrounds and gradients.
 */

/**
 * Converts an sRGB color component (0 to 1) to linear luminance.
 * Follows the IEC 61966-2-1 formula specified in WCAG 2.1 guidelines.
 */
export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Calculates the relative luminance of any hex color (e.g. '#10b981' or '3b82f6').
 * Returns a value between 0.0 (darkest black) and 1.0 (lightest white).
 */
export function getRelativeLuminance(hex: string): number {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6 && clean.length !== 3) return 0.5;

  const fullHex =
    clean.length === 3
      ? clean.split('').map((char) => char + char).join('')
      : clean;

  const r = srgbToLinear(parseInt(fullHex.substring(0, 2), 16) / 255);
  const g = srgbToLinear(parseInt(fullHex.substring(2, 4), 16) / 255);
  const b = srgbToLinear(parseInt(fullHex.substring(4, 6), 16) / 255);

  // ITU-R BT.709 photometric coefficients
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates the WCAG contrast ratio between two relative luminances.
 * Returns a ratio between 1:1 and 21:1.
 */
export function getContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determines the best contrast text color ('#ffffff' or '#020617') for a given background
 * or gradient (primary + optional secondary color).
 *
 * Implements WCAG 2.1 contrast ratio evaluation enhanced with perceptual chromatic
 * sensitivity (Helmholtz-Kohlrausch effect): saturated blues, purples, and reds
 * have lower perceived brightness for human photopic vision, so white text provides
 * superior readability and clarity.
 */
export function getBestContrastTextColor(
  primaryHex: string,
  secondaryHex?: string,
  darkColor = '#020617',
  lightColor = '#ffffff'
): string {
  const lum1 = getRelativeLuminance(primaryHex);
  const lum2 = secondaryHex ? getRelativeLuminance(secondaryHex) : lum1;
  const avgLum = (lum1 + lum2) / 2;

  const lumWhite = getRelativeLuminance(lightColor);
  const lumDark = getRelativeLuminance(darkColor);

  const crWhite = getContrastRatio(lumWhite, avgLum);
  const crDark = getContrastRatio(avgLum, lumDark);

  // Perceptual chromatic threshold (0.30):
  // Bright backgrounds (Emerald 0.37, Orange 0.38, Cyan 0.45, Amber 0.47) -> Dark text (> 7:1 ratio)
  // Deep/saturated backgrounds (Purple 0.20, Red 0.23, Rose 0.24, Blue 0.28) -> White text (maximum legibility)
  if (avgLum < 0.30) {
    return lightColor;
  }

  return crDark >= crWhite ? darkColor : lightColor;
}
