import path from "node:path";
import fs from "node:fs/promises";
import type {
  QuartzEmitterPlugin,
  ProcessedContent,
  BuildCtx,
  FilePath,
} from "@quartz-community/types";
import type { ContentI18nOptions } from "./types";
import { buildLocaleList, extractLocalePrefix, stripLocalePrefix } from "./util/locales";
import { setOptions } from "./util/state";

export interface LocaleManifest {
  defaultLocale: string;
  locales: string[];
  rtlLocales: string[];
  hideUnavailableLocales: boolean;
  /** Map of base-slug (without locale prefix) → list of locales available for it. */
  pages: Record<string, string[]>;
}

const writeFile = async (outputDir: string, relative: string, content: string): Promise<FilePath> => {
  const outputPath = path.join(outputDir, relative);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, content);
  return outputPath.replace(/\\/g, "/") as FilePath;
};

/**
 * Emitter that builds `static/locales.json` describing per-page translation
 * availability. The locale-switcher client script consumes this manifest.
 */
export const ContentI18nManifest: QuartzEmitterPlugin<Partial<ContentI18nOptions>> = (
  userOptions?: Partial<ContentI18nOptions>,
) => {
  const options = setOptions(userOptions);

  const buildManifest = (ctx: BuildCtx, content: ProcessedContent[]): LocaleManifest => {
    const defaultLocale = ctx.cfg?.configuration?.locale ?? "en-US";
    const locales = buildLocaleList(defaultLocale, options.locales);
    const rtlLocales = options.rtlLocales
      .map((l) => {
        try {
          return buildLocaleList(defaultLocale, [l]).at(-1) ?? null;
        } catch {
          return null;
        }
      })
      .filter((l): l is string => l !== null);

    const pages: Record<string, Set<string>> = {};
    for (const [, vfile] of content) {
      const slug = (vfile.data?.slug ?? "") as string;
      if (!slug) continue;
      const locale = extractLocalePrefix(slug, locales);
      if (!locale) continue;
      const baseSlug = stripLocalePrefix(slug, locales);
      if (!pages[baseSlug]) pages[baseSlug] = new Set();
      pages[baseSlug].add(locale);

      vfile.data.availableLocales = Array.from(pages[baseSlug]);
    }

    // Second pass so every page sees the complete availability list.
    for (const [, vfile] of content) {
      const slug = (vfile.data?.slug ?? "") as string;
      const baseSlug = stripLocalePrefix(slug, locales);
      const avail = pages[baseSlug];
      if (avail) vfile.data.availableLocales = Array.from(avail).sort();
    }

    const serializedPages: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(pages)) {
      serializedPages[k] = Array.from(v).sort();
    }

    return {
      defaultLocale,
      locales,
      rtlLocales,
      hideUnavailableLocales: options.hideUnavailableLocales,
      pages: serializedPages,
    };
  };

  const emitManifest = async (ctx: BuildCtx, content: ProcessedContent[]): Promise<FilePath[]> => {
    const manifest = buildManifest(ctx, content);
    const json = `${JSON.stringify(manifest, null, 2)}\n`;
    const out = await writeFile(ctx.argv.output, "static/locales.json", json);
    const redirect = await emitRootRedirect(ctx, manifest);
    const outputs = [out];
    if (redirect) outputs.push(redirect);
    return outputs;
  };

  const emitRootRedirect = async (
    ctx: BuildCtx,
    manifest: LocaleManifest,
  ): Promise<FilePath | null> => {
    // Skip if a root index.html will be emitted by another plugin (e.g. the
    // user has a `content/index.md`). We detect this by checking the manifest
    // for a base slug of "index".
    if (manifest.pages["index"] !== undefined) return null;
    const html = buildRedirectHtml(manifest);
    return writeFile(ctx.argv.output, "index.html", html);
  };

  return {
    name: "ContentI18nManifest",
    getQuartzComponents() {
      return [];
    },
    async emit(ctx, content, _resources) {
      return emitManifest(ctx, content);
    },
    async *partialEmit(ctx, content, _resources, _changes) {
      for (const fp of await emitManifest(ctx, content)) yield fp;
    },
  };
};

/**
 * Build the static HTML for the site root (`/index.html`). It picks the
 * visitor's preferred locale from `navigator.languages`, falling back to the
 * default. Includes a no-JS meta-refresh fallback. All targets are written as
 * relative URLs so the page works under subpath hosting (e.g. GitLab Pages).
 */
export function buildRedirectHtml(manifest: LocaleManifest): string {
  const locales = JSON.stringify(manifest.locales);
  const def = JSON.stringify(manifest.defaultLocale);
  // The relative path from `/index.html` to `/<defaultLocale>/` is simply
  // `<defaultLocale>/` (no leading slash).
  const fallback = `${manifest.defaultLocale}/`;
  return `<!doctype html>
<html lang="${manifest.defaultLocale}">
<head>
<meta charset="utf-8">
<title>Redirecting…</title>
<meta name="robots" content="noindex">
<meta name="generator" content="quartz-content-internationalization">
<script>
(function () {
  var locales = ${locales};
  var def = ${def};
  function pick() {
    var prefs = (navigator.languages || [navigator.language || ""]).map(function (s) { return String(s).toLowerCase(); });
    for (var i = 0; i < prefs.length; i++) {
      for (var j = 0; j < locales.length; j++) {
        if (locales[j].toLowerCase() === prefs[i]) return locales[j];
      }
    }
    for (var i = 0; i < prefs.length; i++) {
      var lang = prefs[i].split("-")[0];
      for (var j = 0; j < locales.length; j++) {
        if (locales[j].toLowerCase().split("-")[0] === lang) return locales[j];
      }
    }
    return def;
  }
  location.replace(pick() + "/");
})();
</script>
<meta http-equiv="refresh" content="0;url=${fallback}">
<link rel="canonical" href="${fallback}">
</head>
<body>
<p>Redirecting to <a href="${fallback}">${fallback}</a>…</p>
</body>
</html>
`;
}
