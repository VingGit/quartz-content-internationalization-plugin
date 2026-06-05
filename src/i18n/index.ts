import enUS from "./locales/en-US";

const locales: Record<string, typeof enUS> = {
  "en-US": enUS,
};

export function i18n(locale?: string): typeof enUS {
  if (!locale) return enUS;
  return locales[locale] ?? enUS;
}

export function localeDisplayName(tag: string, uiLocale?: string): string {
  const names = i18n(uiLocale).localeSwitcher.localeNames;
  if (names[tag]) return names[tag];
  try {
    const intl = new Intl.DisplayNames([uiLocale ?? "en"], { type: "language" });
    return intl.of(tag) ?? tag;
  } catch {
    return tag;
  }
}
