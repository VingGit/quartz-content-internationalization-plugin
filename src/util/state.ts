/**
 * Plugin-internal singleton holding the merged options received via either
 * the transformer/emitter factory call OR `init()` (for the component-only
 * load path). The first value to be set wins, but later writes that supply
 * a non-empty `locales` array override prior empty defaults so option flow
 * works regardless of which entry-point Quartz exercises first.
 */

import type { ContentI18nOptions } from "../types";

const DEFAULTS: ContentI18nOptions = {
  locales: [],
  rtlLocales: [],
  hideUnavailableLocales: false,
};

let current: ContentI18nOptions = { ...DEFAULTS };
let initialized = false;

export function setOptions(opts?: Partial<ContentI18nOptions>): ContentI18nOptions {
  if (!opts) {
    initialized = true;
    return current;
  }
  current = {
    ...DEFAULTS,
    ...current,
    ...opts,
    locales: opts.locales ?? current.locales,
    rtlLocales: opts.rtlLocales ?? current.rtlLocales,
  };
  initialized = true;
  return current;
}

export function getOptions(): ContentI18nOptions {
  return current;
}

export function isInitialized(): boolean {
  return initialized;
}

export function resetOptionsForTesting(): void {
  current = { ...DEFAULTS };
  initialized = false;
}
