/**
 * Public entry point for @vinggit/quartz-content-internationalization.
 *
 * This plugin combines a transformer, an emitter, and a component, each of
 * which is loaded by Quartz's config-loader based on the `category` array in
 * the package manifest. The optional `init(options)` hook receives the merged
 * YAML options when only the component side is consumed.
 */

import type { ContentI18nOptions } from "./types";
import { setOptions } from "./util/state";

export { ContentI18n } from "./transformer";
export { ContentI18nManifest } from "./emitter";
export { default as LocaleSwitcher } from "./components/LocaleSwitcher";

export type { ContentI18nOptions } from "./types";
export type { LocaleManifest } from "./emitter";
export { scaffoldLocales } from "./build/scaffold";
export type { ScaffoldOptions, ScaffoldReport, LocaleReport } from "./build/scaffold";
export {
  normalizeLocale,
  tryNormalizeLocale,
  buildLocaleList,
  isLocaleSegment,
  stripLocalePrefix,
  extractLocalePrefix,
} from "./util/locales";

/**
 * Quartz calls `init()` with the merged YAML options for component-only
 * plugins. Storing them here makes the LocaleSwitcher component option-aware
 * without needing a factory call.
 */
export function init(options?: Record<string, unknown>): void {
  if (!options) {
    setOptions();
    return;
  }
  const opts: Partial<ContentI18nOptions> = {
    locales: Array.isArray(options.locales) ? (options.locales as string[]) : undefined,
    rtlLocales: Array.isArray(options.rtlLocales) ? (options.rtlLocales as string[]) : undefined,
    hideUnavailableLocales:
      typeof options.hideUnavailableLocales === "boolean"
        ? options.hideUnavailableLocales
        : undefined,
  };
  setOptions(opts);
}

export type {
  QuartzComponent,
  QuartzComponentProps,
  QuartzComponentConstructor,
  QuartzTransformerPlugin,
  QuartzEmitterPlugin,
} from "@quartz-community/types";
