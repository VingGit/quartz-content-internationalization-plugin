import { createRequire } from 'module';

createRequire(import.meta.url);

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

// src/components/styles/locale-switcher.scss
var locale_switcher_default = '.locale-switcher {\n  display: flex;\n  align-items: center;\n  gap: 0.4rem;\n  margin: 0.2rem 0;\n}\n.locale-switcher__label {\n  font-size: 0.75rem;\n  color: var(--darkgray);\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n}\n.locale-switcher__select {\n  flex: 1;\n  min-width: 0;\n  padding: 0.25rem 0.5rem;\n  border: 1px solid var(--lightgray);\n  border-radius: 4px;\n  background: var(--light);\n  color: var(--darkgray);\n  font-family: var(--bodyFont);\n  font-size: 0.85rem;\n  cursor: pointer;\n}\n.locale-switcher__select:hover {\n  border-color: var(--secondary);\n}\n.locale-switcher__select:focus {\n  outline: none;\n  border-color: var(--secondary);\n  box-shadow: 0 0 0 2px rgba(40, 75, 99, 0.15);\n}\n.locale-switcher__select option:disabled {\n  color: var(--gray);\n  font-style: italic;\n}\n.locale-switcher--loading .locale-switcher__select {\n  opacity: 0.6;\n}\n.locale-switcher--error {\n  display: none;\n}\n\n/**\n * RTL sidebar swap: when the bootstrap script marks the document as RTL,\n * swap the order of the grid columns in the default page frame so the\n * "right" sidebar becomes visually the left one and vice versa.\n */\nhtml[data-locale-rtl=true] #quartz-body {\n  direction: rtl;\n}\nhtml[data-locale-rtl=true] .page > #quartz-body > .left,\nhtml[data-locale-rtl=true] .page > #quartz-body > .right {\n  direction: rtl;\n}';

// src/components/scripts/locale-switcher.inline.ts
var locale_switcher_inline_default = 'var h="i18n-locale";async function p(){try{let t=document.body?.dataset?.slug??"",o=document.body?.dataset?.basepath??"",e=t.split("/").length-1,s=e>0?"../".repeat(e):"./",r=(o?o+"/":s)+"static/locales.json",c=await fetch(r);return c.ok?await c.json():null}catch(t){return console.warn("[locale-switcher] manifest fetch failed",t),null}}function w(t){let o=(document.documentElement.getAttribute("lang")||"").toLowerCase();for(let e of t.locales)if(e.toLowerCase()===o||e.toLowerCase().startsWith(o+"-")||e.toLowerCase().split("-")[0]===o)return e;return t.defaultLocale}function m(t,o){let e=t.indexOf("/"),s=e===-1?t:t.slice(0,e);return o.includes(s)?e===-1?"":t.slice(e+1):t}function L(t,o,e){let s=t?o+"/"+t:o+"/";return(e?e+"/":"/")+s}async function g(){let t=document.querySelector(".locale-switcher");if(!t)return;let o=t.querySelector("select");if(!o)return;let e=await p();if(!e){t.classList.remove("locale-switcher--loading"),t.classList.add("locale-switcher--error");return}let s=document.body?.dataset?.slug??"",r=document.body?.dataset?.basepath??"",c=w(e),l=m(s,e.locales).replace(/\\/index$/,""),f=e.pages[l]??e.pages[l+"/index"]??[],i=[];for(let n of Array.from(o.options)){let a=n.value;if(f.includes(a))n.disabled=!1,n.title="";else{if(e.hideUnavailableLocales){i.push(n);continue}n.disabled=!0,n.title="(not yet translated)"}a===c&&(n.selected=!0)}for(let n of i)n.remove();t.classList.remove("locale-switcher--loading");let d=n=>{let a=n.target.value;if(!a||a===c)return;try{localStorage.setItem(h,a)}catch{}let u=L(l,a,r);window.location.href=u};o.addEventListener("change",d),typeof window.addCleanup=="function"&&window.addCleanup(()=>o.removeEventListener("change",d))}document.addEventListener("nav",()=>{g()});\n';
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

export { LocaleSwitcher_default as LocaleSwitcher };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map