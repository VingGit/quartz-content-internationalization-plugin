import { describe, expect, it } from "vitest";
import { buildRedirectHtml, type LocaleManifest } from "../src/emitter";

const baseManifest: LocaleManifest = {
  defaultLocale: "fi-FI",
  locales: ["fi-FI", "en-CA", "de-DE"],
  rtlLocales: [],
  hideUnavailableLocales: false,
  pages: {},
};

describe("buildRedirectHtml", () => {
  it("emits relative fallback URL for subpath hosting", () => {
    const html = buildRedirectHtml(baseManifest);
    expect(html).toContain('content="0;url=fi-FI/"');
    expect(html).not.toContain('url=/fi-FI/');
  });

  it("inlines the locale list and default for client-side picking", () => {
    const html = buildRedirectHtml(baseManifest);
    expect(html).toContain('"fi-FI"');
    expect(html).toContain('"en-CA"');
    expect(html).toContain('"de-DE"');
  });

  it("sets robots noindex on the redirect shim", () => {
    const html = buildRedirectHtml(baseManifest);
    expect(html).toContain('name="robots" content="noindex"');
  });

  it("uses default locale for <html lang>", () => {
    const html = buildRedirectHtml(baseManifest);
    expect(html).toContain('<html lang="fi-FI">');
  });
});
