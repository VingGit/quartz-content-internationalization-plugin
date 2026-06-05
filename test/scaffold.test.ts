import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { scaffoldLocales } from "../src/build/scaffold";

async function makeTempContent(layout: Record<string, string>): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "i18n-test-"));
  for (const [rel, body] of Object.entries(layout)) {
    const full = path.join(root, rel);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, body);
  }
  return root;
}

describe("scaffoldLocales", () => {
  it("moves loose content into the default-locale folder, then copies to others", async () => {
    const root = await makeTempContent({
      "index.md": "# Home",
      "notes/page.md": "# Page",
    });
    const report = await scaffoldLocales({
      contentDir: root,
      defaultLocale: "fi-FI",
      locales: ["fi-FI", "en-CA", "de-DE"],
    });

    expect(report.moved.length).toBe(2);
    expect(await fs.readFile(path.join(root, "fi-FI", "index.md"), "utf-8")).toBe("# Home");
    expect(await fs.readFile(path.join(root, "en-CA", "index.md"), "utf-8")).toBe("# Home");
    expect(await fs.readFile(path.join(root, "de-DE", "notes", "page.md"), "utf-8")).toBe(
      "# Page",
    );

    const fi = report.locales.find((r) => r.locale === "fi-FI");
    expect(fi).toBeUndefined();
    for (const r of report.locales) {
      expect(r.errors).toEqual([]);
    }
  });

  it("does not overwrite existing translated files on re-run", async () => {
    const root = await makeTempContent({
      "fi-FI/index.md": "# Etusivu",
      "en-CA/index.md": "# Home translated",
    });
    await scaffoldLocales({
      contentDir: root,
      defaultLocale: "fi-FI",
      locales: ["fi-FI", "en-CA", "de-DE"],
    });
    expect(await fs.readFile(path.join(root, "en-CA", "index.md"), "utf-8")).toBe(
      "# Home translated",
    );
    expect(await fs.readFile(path.join(root, "de-DE", "index.md"), "utf-8")).toBe("# Etusivu");
  });

  it("respects ignore patterns at the root", async () => {
    const root = await makeTempContent({
      "index.md": "# Home",
      "private/secret.md": "shh",
    });
    const report = await scaffoldLocales({
      contentDir: root,
      defaultLocale: "fi-FI",
      locales: ["fi-FI", "en-CA"],
      ignorePatterns: ["private"],
    });
    expect(report.moved.find((m) => m.from.endsWith("private"))).toBeUndefined();
    // Private dir untouched at root
    expect(await fs.readFile(path.join(root, "private", "secret.md"), "utf-8")).toBe("shh");
  });

  it("dry-run reports without writing", async () => {
    const root = await makeTempContent({
      "index.md": "# Home",
    });
    const report = await scaffoldLocales({
      contentDir: root,
      defaultLocale: "fi-FI",
      locales: ["fi-FI", "en-CA"],
      dryRun: true,
    });
    expect(report.moved.length).toBe(1);
    // Original file still at root, not moved.
    expect(await fs.readFile(path.join(root, "index.md"), "utf-8")).toBe("# Home");
    await expect(fs.access(path.join(root, "fi-FI", "index.md"))).rejects.toThrow();
    await expect(fs.access(path.join(root, "en-CA", "index.md"))).rejects.toThrow();
  });

  it("throws when the default locale is missing from the list", async () => {
    const root = await makeTempContent({ "index.md": "# Home" });
    await expect(
      scaffoldLocales({
        contentDir: root,
        defaultLocale: "fi-FI",
        locales: ["en-CA"],
      }),
    ).rejects.toThrow(/Default locale/);
  });
});
