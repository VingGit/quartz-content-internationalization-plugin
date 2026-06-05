// @ts-nocheck
// Client-side script for the LocaleSwitcher component.
// Fetches /static/locales.json, syncs the dropdown to the current page's
// locale, marks unavailable translations, and navigates on change.

const STORAGE_KEY = "i18n-locale";

async function getLocaleManifest() {
  try {
    const slug = document.body?.dataset?.slug ?? "";
    const basePath = document.body?.dataset?.basepath ?? "";
    const depth = slug.split("/").length - 1;
    const prefix = depth > 0 ? "../".repeat(depth) : "./";
    const url = (basePath ? basePath + "/" : prefix) + "static/locales.json";
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn("[locale-switcher] manifest fetch failed", e);
    return null;
  }
}

function currentLocaleFromLang(manifest) {
  const lang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
  for (const loc of manifest.locales) {
    if (loc.toLowerCase() === lang || loc.toLowerCase().startsWith(lang + "-")) return loc;
    if (loc.toLowerCase().split("-")[0] === lang) return loc;
  }
  return manifest.defaultLocale;
}

function stripLocalePrefix(slug, locales) {
  const idx = slug.indexOf("/");
  const head = idx === -1 ? slug : slug.slice(0, idx);
  if (locales.includes(head)) return idx === -1 ? "" : slug.slice(idx + 1);
  return slug;
}

function buildHref(baseSlug, targetLocale, basePath) {
  const path = baseSlug ? targetLocale + "/" + baseSlug : targetLocale + "/";
  return (basePath ? basePath + "/" : "/") + path;
}

async function setup() {
  const switcher = document.querySelector(".locale-switcher");
  if (!switcher) return;
  const select = switcher.querySelector("select");
  if (!select) return;

  const manifest = await getLocaleManifest();
  if (!manifest) {
    switcher.classList.remove("locale-switcher--loading");
    switcher.classList.add("locale-switcher--error");
    return;
  }

  const slug = document.body?.dataset?.slug ?? "";
  const basePath = document.body?.dataset?.basepath ?? "";
  const currentLocale = currentLocaleFromLang(manifest);
  const baseSlug = stripLocalePrefix(slug, manifest.locales).replace(/\/index$/, "");
  const available = manifest.pages[baseSlug] ?? manifest.pages[baseSlug + "/index"] ?? [];

  // Sync options: mark availability, optionally hide unavailable.
  const optionsToRemove = [];
  for (const opt of Array.from(select.options)) {
    const loc = opt.value;
    const has = available.includes(loc);
    if (!has) {
      if (manifest.hideUnavailableLocales) {
        optionsToRemove.push(opt);
        continue;
      }
      opt.disabled = true;
      opt.title = "(not yet translated)";
    } else {
      opt.disabled = false;
      opt.title = "";
    }
    if (loc === currentLocale) opt.selected = true;
  }
  for (const opt of optionsToRemove) opt.remove();

  switcher.classList.remove("locale-switcher--loading");

  const onChange = (ev) => {
    const target = ev.target.value;
    if (!target || target === currentLocale) return;
    try {
      localStorage.setItem(STORAGE_KEY, target);
    } catch {
      /* ignore */
    }
    const href = buildHref(baseSlug, target, basePath);
    window.location.href = href;
  };
  select.addEventListener("change", onChange);
  if (typeof window.addCleanup === "function") {
    window.addCleanup(() => select.removeEventListener("change", onChange));
  }
}

document.addEventListener("nav", () => {
  setup();
});
