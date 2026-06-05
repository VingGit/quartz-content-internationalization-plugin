/**
 * Locale normalisation and matching helpers.
 *
 * Accepts inputs in either dashed (`de-DE`) or underscored (`de_DE`) form,
 * and language-only (`de`). Output is always BCP-47 with the script/region
 * sub-tag uppercased.
 */

const TAG_REGEX = /^[A-Za-z]{2,3}([-_][A-Za-z]{2,4}([-_][A-Za-z0-9]{2,8})*)?$/;

export function normalizeLocale(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Locale code cannot be empty");
  }
  if (!TAG_REGEX.test(trimmed)) {
    throw new Error(`Invalid locale code: ${input}`);
  }
  const parts = trimmed.replace(/_/g, "-").split("-");
  return parts
    .map((part, idx) => {
      if (idx === 0) return part.toLowerCase();
      if (part.length === 4) {
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }
      return part.toUpperCase();
    })
    .join("-");
}

export function tryNormalizeLocale(input: string): string | null {
  try {
    return normalizeLocale(input);
  } catch {
    return null;
  }
}

/**
 * Build the canonical list of locales (default first, then user-configured,
 * with duplicates removed). The default locale is always included.
 */
export function buildLocaleList(defaultLocale: string, configured: readonly string[]): string[] {
  const normalizedDefault = normalizeLocale(defaultLocale);
  const seen = new Set<string>([normalizedDefault]);
  const result: string[] = [normalizedDefault];
  for (const raw of configured) {
    const norm = tryNormalizeLocale(raw);
    if (!norm) {
      console.warn(`[i18n] Ignoring invalid locale code: ${raw}`);
      continue;
    }
    if (seen.has(norm)) continue;
    seen.add(norm);
    result.push(norm);
  }
  return result;
}

/** Returns true if `segment` looks like one of the known locales. */
export function isLocaleSegment(segment: string, locales: readonly string[]): boolean {
  const norm = tryNormalizeLocale(segment);
  return norm !== null && locales.includes(norm);
}

/**
 * Strip a leading locale segment from a path or slug. Returns the original
 * value unchanged if the first segment is not a known locale.
 */
export function stripLocalePrefix(value: string, locales: readonly string[]): string {
  const idx = value.indexOf("/");
  if (idx === -1) {
    return isLocaleSegment(value, locales) ? "" : value;
  }
  const head = value.slice(0, idx);
  return isLocaleSegment(head, locales) ? value.slice(idx + 1) : value;
}

/** Returns the leading locale segment of a path, or `null`. */
export function extractLocalePrefix(value: string, locales: readonly string[]): string | null {
  const idx = value.indexOf("/");
  const head = idx === -1 ? value : value.slice(0, idx);
  const norm = tryNormalizeLocale(head);
  if (norm && locales.includes(norm)) return norm;
  return null;
}
