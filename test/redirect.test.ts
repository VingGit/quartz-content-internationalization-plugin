import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { VFile } from "vfile";
import type { BuildCtx, ProcessedContent, QuartzConfig } from "@quartz-community/types";
import { buildRedirectHtml, ContentI18nManifest, type LocaleManifest } from "../src/emitter";

const baseManifest: LocaleManifest = {
  defaultLocale: "fi-FI",
  locales: ["fi-FI", "en-CA", "de-DE"],
  rtlLocales: [],
  hideUnavailableLocales: false,
  pages: {},
};

function makeContent(slugs: string[]): ProcessedContent[] {
  return slugs.map((slug) => {
    const vfile = new VFile("");
    vfile.data = { slug } as unknown as VFile["data"];
    return [{ type: "root", children: [] }, vfile] as ProcessedContent;
  });
}

async function makeCtx(): Promise<BuildCtx> {
  const output = await fs.mkdtemp(path.join(os.tmpdir(), "i18n-emit-"));
  return {
    buildId: "test",
    argv: {
      directory: "content",
      verbose: false,
      output,
      serve: false,
      watch: false,
      port: 0,
      wsPort: 0,
    },
    cfg: { configuration: { locale: "fi-FI" } } as QuartzConfig,
    allSlugs: [],
    allFiles: [],
    incremental: false,
  };
}

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

describe("ContentI18nManifest emit", () => {
  it("writes public/index.html when only localized index files exist", async () => {
    const ctx = await makeCtx();
    const plugin = ContentI18nManifest({ locales: ["en-CA"] });
    const content = makeContent(["fi-FI/index", "en-CA/index"]);
    const outputs = await plugin.emit(ctx, content, {
      css: [],
      js: [],
      additionalHead: [],
    });
    const files = Array.isArray(outputs) ? outputs : [];
    const redirect = files.find((f) => f.endsWith("/index.html"));
    expect(redirect).toBeDefined();
    const text = await fs.readFile(redirect as string, "utf-8");
    expect(text).toContain("content=\"0;url=fi-FI/\"");
  });

  it("does NOT write public/index.html when a real root index slug exists", async () => {
    const ctx = await makeCtx();
    const plugin = ContentI18nManifest({ locales: ["en-CA"] });
    const content = makeContent(["index", "fi-FI/about"]);
    const outputs = await plugin.emit(ctx, content, {
      css: [],
      js: [],
      additionalHead: [],
    });
    const files = Array.isArray(outputs) ? outputs : [];
    expect(files.find((f) => f.endsWith("/index.html"))).toBeUndefined();
  });
});

