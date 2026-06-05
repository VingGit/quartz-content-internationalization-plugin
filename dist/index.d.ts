import { QuartzTransformerPlugin, QuartzEmitterPlugin } from '@quartz-community/types';
export { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps, QuartzEmitterPlugin, QuartzTransformerPlugin } from '@quartz-community/types';
import { ContentI18nOptions } from './types.js';
export { LocaleSwitcher } from './components/index.js';

declare module "vfile" {
    interface DataMap {
        /** Canonical BCP-47 locale this page belongs to. */
        locale?: string;
        /** Slug with the locale prefix removed. */
        baseSlug?: string;
        /** All locales for which a translation of this page exists (filled by emitter). */
        availableLocales?: string[];
    }
}
/**
 * Transformer that tags each page with its locale (derived from the leading
 * slug segment) and exposes it via frontmatter so Quartz's renderer can set
 * `<html lang>` per page.
 */
declare const ContentI18n: QuartzTransformerPlugin<Partial<ContentI18nOptions>>;

interface LocaleManifest {
    defaultLocale: string;
    locales: string[];
    rtlLocales: string[];
    hideUnavailableLocales: boolean;
    /** Map of base-slug (without locale prefix) → list of locales available for it. */
    pages: Record<string, string[]>;
}
/**
 * Emitter that builds `static/locales.json` describing per-page translation
 * availability. The locale-switcher client script consumes this manifest.
 */
declare const ContentI18nManifest: QuartzEmitterPlugin<Partial<ContentI18nOptions>>;

interface ScaffoldOptions {
    contentDir: string;
    defaultLocale: string;
    locales: string[];
    /** Patterns matching root-level entries to leave outside the locale tree. */
    ignorePatterns?: string[];
    dryRun?: boolean;
    forceMove?: boolean;
}
interface LocaleReport {
    locale: string;
    copied: number;
    skipped: number;
    errors: string[];
}
interface ScaffoldReport {
    moved: {
        from: string;
        to: string;
    }[];
    movedSkipped: string[];
    locales: LocaleReport[];
}
/**
 * 1. Move loose root-level content into `content/<defaultLocale>/`.
 * 2. For each non-default locale, copy `content/<defaultLocale>/` into
 *    `content/<locale>/`, never overwriting existing files.
 */
declare function scaffoldLocales(opts: ScaffoldOptions): Promise<ScaffoldReport>;

/**
 * Locale normalisation and matching helpers.
 *
 * Accepts inputs in either dashed (`de-DE`) or underscored (`de_DE`) form,
 * and language-only (`de`). Output is always BCP-47 with the script/region
 * sub-tag uppercased.
 */
declare function normalizeLocale(input: string): string;
declare function tryNormalizeLocale(input: string): string | null;
/**
 * Build the canonical list of locales (default first, then user-configured,
 * with duplicates removed). The default locale is always included.
 */
declare function buildLocaleList(defaultLocale: string, configured: readonly string[]): string[];
/** Returns true if `segment` looks like one of the known locales. */
declare function isLocaleSegment(segment: string, locales: readonly string[]): boolean;
/**
 * Strip a leading locale segment from a path or slug. Returns the original
 * value unchanged if the first segment is not a known locale.
 */
declare function stripLocalePrefix(value: string, locales: readonly string[]): string;
/** Returns the leading locale segment of a path, or `null`. */
declare function extractLocalePrefix(value: string, locales: readonly string[]): string | null;

/**
 * Public entry point for @vinggit/quartz-content-internationalization.
 *
 * This plugin combines a transformer, an emitter, and a component, each of
 * which is loaded by Quartz's config-loader based on the `category` array in
 * the package manifest. The optional `init(options)` hook receives the merged
 * YAML options when only the component side is consumed.
 */

/**
 * Quartz calls `init()` with the merged YAML options for component-only
 * plugins. Storing them here makes the LocaleSwitcher component option-aware
 * without needing a factory call.
 */
declare function init(options?: Record<string, unknown>): void;

export { ContentI18n, ContentI18nManifest, ContentI18nOptions, type LocaleManifest, type LocaleReport, type ScaffoldOptions, type ScaffoldReport, buildLocaleList, extractLocalePrefix, init, isLocaleSegment, normalizeLocale, scaffoldLocales, stripLocalePrefix, tryNormalizeLocale };
