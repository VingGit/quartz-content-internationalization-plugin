import { createRequire } from 'module';
import path2 from 'path';
import fs2 from 'fs/promises';

createRequire(import.meta.url);

// src/util/state.ts
var DEFAULTS = {
  locales: [],
  rtlLocales: [],
  hideUnavailableLocales: false,
  position: "left",
  priority: 5,
  group: "toolbar"
};
var current = { ...DEFAULTS };
function setOptions(opts) {
  if (!opts) {
    return current;
  }
  current = {
    ...DEFAULTS,
    ...current,
    ...opts,
    locales: opts.locales ?? current.locales,
    rtlLocales: opts.rtlLocales ?? current.rtlLocales
  };
  return current;
}
function getOptions() {
  return current;
}

// src/util/locales.ts
var TAG_REGEX = /^[A-Za-z]{2,3}([-_][A-Za-z]{2,4}([-_][A-Za-z0-9]{2,8})*)?$/;
function normalizeLocale(input) {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Locale code cannot be empty");
  }
  if (!TAG_REGEX.test(trimmed)) {
    throw new Error(`Invalid locale code: ${input}`);
  }
  const parts = trimmed.replace(/_/g, "-").split("-");
  return parts.map((part, idx) => {
    if (idx === 0) return part.toLowerCase();
    if (part.length === 4) {
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }
    return part.toUpperCase();
  }).join("-");
}
function tryNormalizeLocale(input) {
  try {
    return normalizeLocale(input);
  } catch {
    return null;
  }
}
function buildLocaleList(defaultLocale, configured) {
  const normalizedDefault = normalizeLocale(defaultLocale);
  const seen = /* @__PURE__ */ new Set([normalizedDefault]);
  const result = [normalizedDefault];
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
function isLocaleSegment(segment, locales2) {
  const norm = tryNormalizeLocale(segment);
  return norm !== null && locales2.includes(norm);
}
function stripLocalePrefix(value, locales2) {
  const idx = value.indexOf("/");
  if (idx === -1) {
    return isLocaleSegment(value, locales2) ? "" : value;
  }
  const head = value.slice(0, idx);
  return isLocaleSegment(head, locales2) ? value.slice(idx + 1) : value;
}
function extractLocalePrefix(value, locales2) {
  const idx = value.indexOf("/");
  const head = idx === -1 ? value : value.slice(0, idx);
  const norm = tryNormalizeLocale(head);
  if (norm && locales2.includes(norm)) return norm;
  return null;
}
var l;
l = { __e: function(n2, l2, u3, t2) {
  for (var i2, o2, r2; l2 = l2.__; ) if ((i2 = l2.__c) && !i2.__) try {
    if ((o2 = i2.constructor) && null != o2.getDerivedStateFromError && (i2.setState(o2.getDerivedStateFromError(n2)), r2 = i2.__d), null != i2.componentDidCatch && (i2.componentDidCatch(n2, t2 || {}), r2 = i2.__d), r2) return i2.__E = i2;
  } catch (l3) {
    n2 = l3;
  }
  throw n2;
} }, "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout;

// node_modules/preact/jsx-runtime/dist/jsxRuntime.mjs
var f2 = 0;
function u2(e2, t2, n2, o2, i2, u3) {
  t2 || (t2 = {});
  var a2, c2, p2 = t2;
  if ("ref" in p2) for (c2 in p2 = {}, t2) "ref" == c2 ? a2 = t2[c2] : p2[c2] = t2[c2];
  var l2 = { type: e2, props: p2, key: n2, ref: a2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f2, __i: -1, __u: 0, __source: i2, __self: u3 };
  if ("function" == typeof e2 && (a2 = e2.defaultProps)) for (c2 in a2) void 0 === p2[c2] && (p2[c2] = a2[c2]);
  return l.vnode && l.vnode(l2), l2;
}

// src/transformer.tsx
var remarkTagLocale = (locales2, defaultLocale) => {
  return () => (_tree, file) => {
    const slug = file.data?.slug ?? "";
    const detected = extractLocalePrefix(slug, locales2);
    const locale = detected ?? defaultLocale;
    file.data.locale = locale;
    file.data.baseSlug = stripLocalePrefix(slug, locales2);
    const existing = file.data.frontmatter ?? {};
    if (!existing.lang) {
      existing.lang = locale;
    }
    file.data.frontmatter = existing;
  };
};
var ContentI18n = (userOptions) => {
  const options = setOptions(userOptions);
  return {
    name: "ContentI18n",
    markdownPlugins(ctx) {
      const defaultLocale = ctx.cfg?.configuration?.locale ?? "en-US";
      const locales2 = buildLocaleList(defaultLocale, options.locales);
      return [remarkTagLocale(locales2, defaultLocale)];
    },
    externalResources(ctx) {
      const defaultLocale = ctx.cfg?.configuration?.locale ?? "en-US";
      const locales2 = buildLocaleList(defaultLocale, options.locales);
      const rtlLocales = (options.rtlLocales ?? []).map((l2) => {
        try {
          return buildLocaleList(defaultLocale, [l2]).at(-1) ?? null;
        } catch {
          return null;
        }
      }).filter((l2) => l2 !== null);
      const rtlList = JSON.stringify(rtlLocales);
      const localeList = JSON.stringify(locales2);
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
            script: rtlBootstrap
          }
        ],
        additionalHead: [
          (data) => {
            const fileData = data ?? {};
            const locale = fileData.locale ?? defaultLocale;
            return /* @__PURE__ */ u2(
              "meta",
              {
                "http-equiv": "content-language",
                content: locale
              },
              `content-language-${locale}`
            );
          }
        ]
      };
    }
  };
};
var writeFile = async (outputDir, relative, content) => {
  const outputPath = path2.join(outputDir, relative);
  await fs2.mkdir(path2.dirname(outputPath), { recursive: true });
  await fs2.writeFile(outputPath, content);
  return outputPath.replace(/\\/g, "/");
};
var ContentI18nManifest = (userOptions) => {
  const options = setOptions(userOptions);
  const buildManifest = (ctx, content) => {
    const defaultLocale = ctx.cfg?.configuration?.locale ?? "en-US";
    const locales2 = buildLocaleList(defaultLocale, options.locales);
    const rtlLocales = options.rtlLocales.map((l2) => {
      try {
        return buildLocaleList(defaultLocale, [l2]).at(-1) ?? null;
      } catch {
        return null;
      }
    }).filter((l2) => l2 !== null);
    const pages = {};
    for (const [, vfile] of content) {
      const slug = vfile.data?.slug ?? "";
      if (!slug) continue;
      const locale = extractLocalePrefix(slug, locales2);
      if (!locale) continue;
      const baseSlug = stripLocalePrefix(slug, locales2);
      if (!pages[baseSlug]) pages[baseSlug] = /* @__PURE__ */ new Set();
      pages[baseSlug].add(locale);
      vfile.data.availableLocales = Array.from(pages[baseSlug]);
    }
    for (const [, vfile] of content) {
      const slug = vfile.data?.slug ?? "";
      const baseSlug = stripLocalePrefix(slug, locales2);
      const avail = pages[baseSlug];
      if (avail) vfile.data.availableLocales = Array.from(avail).sort();
    }
    const serializedPages = {};
    for (const [k2, v2] of Object.entries(pages)) {
      serializedPages[k2] = Array.from(v2).sort();
    }
    return {
      defaultLocale,
      locales: locales2,
      rtlLocales,
      hideUnavailableLocales: options.hideUnavailableLocales,
      pages: serializedPages
    };
  };
  const emitManifest = async (ctx, content) => {
    const manifest = buildManifest(ctx, content);
    const json = `${JSON.stringify(manifest, null, 2)}
`;
    const out = await writeFile(ctx.argv.output, "static/locales.json", json);
    const redirect = await emitRootRedirect(ctx, manifest, content);
    const outputs = [out];
    if (redirect) outputs.push(redirect);
    return outputs;
  };
  const emitRootRedirect = async (ctx, manifest, content) => {
    const hasRootIndex = content.some(
      ([, vfile]) => (vfile.data?.slug ?? "") === "index"
    );
    if (hasRootIndex) return null;
    if (manifest.locales.length === 0) return null;
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
    }
  };
};
function buildRedirectHtml(manifest) {
  const locales2 = JSON.stringify(manifest.locales);
  const def = JSON.stringify(manifest.defaultLocale);
  const fallback = `${manifest.defaultLocale}/`;
  return `<!doctype html>
<html lang="${manifest.defaultLocale}">
<head>
<meta charset="utf-8">
<title>Redirecting\u2026</title>
<meta name="robots" content="noindex">
<meta name="generator" content="quartz-content-internationalization">
<script>
(function () {
  var locales = ${locales2};
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
<p>Redirecting to <a href="${fallback}">${fallback}</a>\u2026</p>
</body>
</html>
`;
}

// node_modules/@quartz-community/utils/dist/lang.js
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// src/i18n/locales/en-US.ts
var en_US_default = {
  localeSwitcher: {
    label: "Language",
    title: "Change language",
    unavailable: "(not yet translated)",
    localeNames: {
      "en-US": "English (US)",
      "en-CA": "English (Canada)",
      "en-GB": "English (UK)",
      "fi-FI": "Suomi",
      "sv-SE": "Svenska",
      "de-DE": "Deutsch",
      "de-CH": "Deutsch (Schweiz)",
      "de-AT": "Deutsch (\xD6sterreich)",
      "fr-FR": "Fran\xE7ais",
      "fr-CA": "Fran\xE7ais (Canada)",
      "es-ES": "Espa\xF1ol",
      "ga-IE": "Gaeilge",
      "ar-SA": "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
      "he-IL": "\u05E2\u05D1\u05E8\u05D9\u05EA",
      "ja-JP": "\u65E5\u672C\u8A9E",
      "zh-CN": "\u4E2D\u6587 (\u7B80\u4F53)",
      "zh-TW": "\u4E2D\u6587 (\u7E41\u9AD4)"
    }
  }
};

// src/i18n/index.ts
var locales = {
  "en-US": en_US_default
};
function i18n(locale) {
  if (!locale) return en_US_default;
  return locales[locale] ?? en_US_default;
}
function localeDisplayName(tag, uiLocale) {
  const names = i18n(uiLocale).localeSwitcher.localeNames;
  if (names[tag]) return names[tag];
  try {
    const intl = new Intl.DisplayNames([uiLocale ?? "en"], { type: "language" });
    return intl.of(tag) ?? tag;
  } catch {
    return tag;
  }
}

// src/components/styles/locale-switcher.scss
var locale_switcher_default = '.locale-switcher {\n  display: flex;\n  align-items: center;\n  gap: 0.4rem;\n  margin: 0.2rem 0;\n}\n.locale-switcher__label {\n  font-size: 0.75rem;\n  color: var(--darkgray);\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n}\n.locale-switcher__select {\n  flex: 1;\n  min-width: 0;\n  padding: 0.25rem 0.5rem;\n  border: 1px solid var(--lightgray);\n  border-radius: 4px;\n  background: var(--light);\n  color: var(--darkgray);\n  font-family: var(--bodyFont);\n  font-size: 0.85rem;\n  cursor: pointer;\n}\n.locale-switcher__select:hover {\n  border-color: var(--secondary);\n}\n.locale-switcher__select:focus {\n  outline: none;\n  border-color: var(--secondary);\n  box-shadow: 0 0 0 2px rgba(40, 75, 99, 0.15);\n}\n.locale-switcher__select option:disabled {\n  color: var(--gray);\n  font-style: italic;\n}\n.locale-switcher--loading .locale-switcher__select {\n  opacity: 0.6;\n}\n.locale-switcher--error {\n  display: none;\n}\n\n/**\n * RTL sidebar swap: when the bootstrap script marks the document as RTL,\n * swap the order of the grid columns in the default page frame so the\n * "right" sidebar becomes visually the left one and vice versa.\n */\nhtml[data-locale-rtl=true] #quartz-body {\n  direction: rtl;\n}\nhtml[data-locale-rtl=true] .page > #quartz-body > .left,\nhtml[data-locale-rtl=true] .page > #quartz-body > .right {\n  direction: rtl;\n}';

// src/components/scripts/locale-switcher.inline.ts
var locale_switcher_inline_default = 'var h="i18n-locale";async function p(){try{let t=document.body?.dataset?.slug??"",o=document.body?.dataset?.basepath??"",e=t.split("/").length-1,s=e>0?"../".repeat(e):"./",r=(o?o+"/":s)+"static/locales.json",c=await fetch(r);return c.ok?await c.json():null}catch(t){return console.warn("[locale-switcher] manifest fetch failed",t),null}}function w(t){let o=(document.documentElement.getAttribute("lang")||"").toLowerCase();for(let e of t.locales)if(e.toLowerCase()===o||e.toLowerCase().startsWith(o+"-")||e.toLowerCase().split("-")[0]===o)return e;return t.defaultLocale}function m(t,o){let e=t.indexOf("/"),s=e===-1?t:t.slice(0,e);return o.includes(s)?e===-1?"":t.slice(e+1):t}function L(t,o,e){let s=t?o+"/"+t:o+"/";return(e?e+"/":"/")+s}async function g(){let t=document.querySelector(".locale-switcher");if(!t)return;let o=t.querySelector("select");if(!o)return;let e=await p();if(!e){t.classList.remove("locale-switcher--loading"),t.classList.add("locale-switcher--error");return}let s=document.body?.dataset?.slug??"",r=document.body?.dataset?.basepath??"",c=w(e),l=m(s,e.locales).replace(/\\/index$/,""),f=e.pages[l]??e.pages[l+"/index"]??[],i=[];for(let n of Array.from(o.options)){let a=n.value;if(f.includes(a))n.disabled=!1,n.title="";else{if(e.hideUnavailableLocales){i.push(n);continue}n.disabled=!0,n.title="(not yet translated)"}a===c&&(n.selected=!0)}for(let n of i)n.remove();t.classList.remove("locale-switcher--loading");let d=n=>{let a=n.target.value;if(!a||a===c)return;try{localStorage.setItem(h,a)}catch{}let u=L(l,a,r);window.location.href=u};o.addEventListener("change",d),typeof window.addCleanup=="function"&&window.addCleanup(()=>o.removeEventListener("change",d))}document.addEventListener("nav",()=>{g()});\n';

// src/components/LocaleSwitcher.tsx
var LocaleSwitcher = ({ displayClass, cfg }) => {
  const t2 = i18n(cfg?.locale).localeSwitcher;
  const opts = getOptions();
  const defaultLocale = cfg?.locale ?? "en-US";
  const locales2 = buildLocaleList(defaultLocale, opts.locales);
  if (locales2.length <= 1) return null;
  return /* @__PURE__ */ u2("div", { class: classNames(displayClass, "locale-switcher", "locale-switcher--loading"), children: [
    /* @__PURE__ */ u2("label", { class: "locale-switcher__label", for: "locale-switcher-select", children: t2.label }),
    /* @__PURE__ */ u2(
      "select",
      {
        id: "locale-switcher-select",
        class: "locale-switcher__select",
        "aria-label": t2.title,
        title: t2.title,
        children: locales2.map((loc) => /* @__PURE__ */ u2("option", { value: loc, "data-locale": loc, children: localeDisplayName(loc, cfg?.locale) }))
      }
    )
  ] });
};
LocaleSwitcher.css = locale_switcher_default;
LocaleSwitcher.afterDOMLoaded = locale_switcher_inline_default;
var LocaleSwitcher_default = (() => LocaleSwitcher);
var DOTFILE = /^\./;
async function pathExists(p2) {
  try {
    await fs2.access(p2);
    return true;
  } catch {
    return false;
  }
}
function isIgnored(name, ignorePatterns) {
  if (DOTFILE.test(name)) return true;
  return ignorePatterns.some((pat) => {
    const re = new RegExp(
      "^" + pat.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*") + "$"
    );
    return re.test(name);
  });
}
async function listChildren(dir) {
  try {
    return await fs2.readdir(dir);
  } catch {
    return [];
  }
}
async function copyMissing(src, dst, report, dryRun) {
  const stat = await fs2.stat(src);
  if (stat.isDirectory()) {
    if (!dryRun) await fs2.mkdir(dst, { recursive: true });
    for (const child of await fs2.readdir(src)) {
      await copyMissing(path2.join(src, child), path2.join(dst, child), report, dryRun);
    }
    return;
  }
  if (await pathExists(dst)) {
    report.skipped++;
    return;
  }
  if (!dryRun) {
    await fs2.mkdir(path2.dirname(dst), { recursive: true });
    await fs2.copyFile(src, dst);
  }
  report.copied++;
}
async function movePath(src, dst, dryRun) {
  if (dryRun) return;
  await fs2.mkdir(path2.dirname(dst), { recursive: true });
  try {
    await fs2.rename(src, dst);
  } catch {
    await fs2.cp(src, dst, { recursive: true });
    await fs2.rm(src, { recursive: true, force: true });
  }
}
async function scaffoldLocales(opts) {
  const {
    contentDir,
    defaultLocale,
    locales: locales2,
    ignorePatterns = [],
    dryRun = false,
    forceMove = false
  } = opts;
  if (!locales2.includes(defaultLocale)) {
    throw new Error(
      `Default locale "${defaultLocale}" must be included in the locales list passed to scaffoldLocales`
    );
  }
  const knownLocaleDirs = new Set(locales2);
  const defaultDir = path2.join(contentDir, defaultLocale);
  const report = { moved: [], movedSkipped: [], locales: [] };
  if (!await pathExists(contentDir)) {
    throw new Error(`Content directory not found: ${contentDir}`);
  }
  const rootEntries = await listChildren(contentDir);
  const looseEntries = rootEntries.filter(
    (name) => !knownLocaleDirs.has(name) && !isIgnored(name, ignorePatterns)
  );
  if (looseEntries.length > 0) {
    if (!dryRun) await fs2.mkdir(defaultDir, { recursive: true });
    for (const name of looseEntries) {
      const from = path2.join(contentDir, name);
      const to = path2.join(defaultDir, name);
      const exists = await pathExists(to);
      if (exists && !forceMove) {
        report.movedSkipped.push(name);
        continue;
      }
      if (exists && forceMove) {
        if (!dryRun) await fs2.rm(to, { recursive: true, force: true });
      }
      await movePath(from, to, dryRun);
      report.moved.push({ from, to });
    }
  }
  if (report.movedSkipped.length > 0 && !forceMove) {
    throw new Error(
      `[i18n] Refusing to overwrite existing paths in ${defaultLocale}: ${report.movedSkipped.join(
        ", "
      )}. Re-run with --force-move to discard them.`
    );
  }
  for (const locale of locales2) {
    if (locale === defaultLocale) continue;
    const target = path2.join(contentDir, locale);
    const localeReport = { locale, copied: 0, skipped: 0, errors: [] };
    if (!await pathExists(defaultDir)) {
      localeReport.errors.push(`source missing: ${defaultDir}`);
      report.locales.push(localeReport);
      continue;
    }
    try {
      await copyMissing(defaultDir, target, localeReport, dryRun);
    } catch (err) {
      localeReport.errors.push(err instanceof Error ? err.message : String(err));
    }
    report.locales.push(localeReport);
  }
  return report;
}

// src/index.ts
function init(options) {
  if (!options) {
    setOptions();
    return;
  }
  const opts = {
    locales: Array.isArray(options.locales) ? options.locales : void 0,
    rtlLocales: Array.isArray(options.rtlLocales) ? options.rtlLocales : void 0,
    hideUnavailableLocales: typeof options.hideUnavailableLocales === "boolean" ? options.hideUnavailableLocales : void 0,
    position: typeof options.position === "string" ? options.position : void 0,
    priority: typeof options.priority === "number" ? options.priority : void 0,
    group: typeof options.group === "string" ? options.group : void 0
  };
  setOptions(opts);
}

export { ContentI18n, ContentI18nManifest, LocaleSwitcher_default as LocaleSwitcher, buildLocaleList, extractLocalePrefix, init, isLocaleSegment, normalizeLocale, scaffoldLocales, stripLocalePrefix, tryNormalizeLocale };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map