import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types";
import { classNames } from "../util/lang";
import { i18n, localeDisplayName } from "../i18n";
import { getOptions, setOptions } from "../util/state";
import { buildLocaleList } from "../util/locales";
import type { ContentI18nOptions } from "../types";
import style from "./styles/locale-switcher.scss";
// @ts-expect-error - inline script import handled by Quartz bundler
import script from "./scripts/locale-switcher.inline.ts";

const LocaleSwitcher: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
  const t = i18n(cfg?.locale).localeSwitcher;
  const opts = getOptions();
  const defaultLocale = cfg?.locale ?? "en-US";
  const locales = buildLocaleList(defaultLocale, opts.locales);
  if (locales.length <= 1) return null;

  return (
    <div class={classNames(displayClass, "locale-switcher", "locale-switcher--loading")}>
      <label class="locale-switcher__label" for="locale-switcher-select">
        {t.label}
      </label>
      <select
        id="locale-switcher-select"
        class="locale-switcher__select"
        aria-label={t.title}
        title={t.title}
      >
        {locales.map((loc) => (
          <option value={loc} data-locale={loc}>
            {localeDisplayName(loc, cfg?.locale)}
          </option>
        ))}
      </select>
    </div>
  );
};

LocaleSwitcher.css = style;
LocaleSwitcher.afterDOMLoaded = script;

// The component bundle has its own copy of `util/state` (tsup doesn't share
// modules across entry points), so options set by the transformer in
// `dist/index.js` are invisible here. Seed this bundle's singleton from the
// YAML options that Quartz forwards through the constructor.
export default ((opts?: Record<string, unknown>) => {
  if (opts) {
    const seed: Partial<ContentI18nOptions> = {
      locales: Array.isArray(opts.locales) ? (opts.locales as string[]) : undefined,
      rtlLocales: Array.isArray(opts.rtlLocales) ? (opts.rtlLocales as string[]) : undefined,
      hideUnavailableLocales:
        typeof opts.hideUnavailableLocales === "boolean"
          ? opts.hideUnavailableLocales
          : undefined,
    };
    setOptions(seed);
  }
  return LocaleSwitcher;
}) satisfies QuartzComponentConstructor;
