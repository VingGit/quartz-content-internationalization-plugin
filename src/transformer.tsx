import type { Plugin } from "unified";
import type { Root as MdastRoot } from "mdast";
import type { VFile } from "vfile";
import type { QuartzTransformerPlugin, BuildCtx } from "@quartz-community/types";
import type { ContentI18nOptions } from "./types";
import { buildLocaleList, extractLocalePrefix, stripLocalePrefix } from "./util/locales";
import { setOptions } from "./util/state";

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

const remarkTagLocale = (
  locales: readonly string[],
  defaultLocale: string,
): Plugin<[], MdastRoot> => {
  return () => (_tree: MdastRoot, file: VFile) => {
    const slug = (file.data?.slug ?? "") as string;
    const detected = extractLocalePrefix(slug, locales);
    const locale = detected ?? defaultLocale;
    file.data.locale = locale;
    file.data.baseSlug = stripLocalePrefix(slug, locales);

    const existing = (file.data.frontmatter ?? {}) as Record<string, unknown>;
    if (!existing.lang) {
      existing.lang = locale;
    }
    (file.data as Record<string, unknown>).frontmatter = existing;
  };
};

/**
 * Transformer that tags each page with its locale (derived from the leading
 * slug segment) and exposes it via frontmatter so Quartz's renderer can set
 * `<html lang>` per page.
 */
export const ContentI18n: QuartzTransformerPlugin<Partial<ContentI18nOptions>> = (
  userOptions?: Partial<ContentI18nOptions>,
) => {
  const options = setOptions(userOptions);
  return {
    name: "ContentI18n",
    markdownPlugins(ctx: BuildCtx) {
      const defaultLocale = ctx.cfg?.configuration?.locale ?? "en-US";
      const locales = buildLocaleList(defaultLocale, options.locales);
      return [remarkTagLocale(locales, defaultLocale)];
    },
    externalResources(ctx: BuildCtx) {
      const defaultLocale = ctx.cfg?.configuration?.locale ?? "en-US";
      const locales = buildLocaleList(defaultLocale, options.locales);
      const rtlLocales = (options.rtlLocales ?? [])
        .map((l) => {
          try {
            return buildLocaleList(defaultLocale, [l]).at(-1) ?? null;
          } catch {
            return null;
          }
        })
        .filter((l): l is string => l !== null);

      const rtlList = JSON.stringify(rtlLocales);
      const localeList = JSON.stringify(locales);
      const rtlBootstrap = `
        (function () {
          var rtl = ${rtlList};
          var locales = ${localeList};
          window.__contentI18n = { rtlLocales: rtl, locales: locales };
          var lang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
          var primary = '';
          for (var i = 0; i < locales.length; i++) {
            var lc = locales[i].toLowerCase();
            if (lc === lang || lc.split('-')[0] === lang) { primary = locales[i]; break; }
          }
          var isRtl = primary && rtl.indexOf(primary) !== -1;
          if (isRtl) {
            document.documentElement.setAttribute('dir', 'rtl');
            document.documentElement.setAttribute('data-locale-rtl', 'true');
          } else {
            document.documentElement.setAttribute('data-locale-rtl', 'false');
          }
        })();
      `;

      return {
        css: [],
        js: [
          {
            loadTime: "beforeDOMReady",
            contentType: "inline",
            spaPreserve: true,
            script: rtlBootstrap,
          },
        ],
        additionalHead: [
          (data: unknown) => {
            const fileData = (data ?? {}) as { locale?: string };
            const locale = fileData.locale ?? defaultLocale;
            return (
              <meta
                key={`content-language-${locale}`}
                http-equiv="content-language"
                content={locale}
              />
            );
          },
        ],
      };
    },
  };
};
