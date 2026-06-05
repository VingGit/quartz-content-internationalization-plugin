import fs from "node:fs/promises";
import path from "node:path";

export interface ScaffoldOptions {
  contentDir: string;
  defaultLocale: string;
  locales: string[];
  /** Patterns matching root-level entries to leave outside the locale tree. */
  ignorePatterns?: string[];
  dryRun?: boolean;
  forceMove?: boolean;
}

export interface LocaleReport {
  locale: string;
  copied: number;
  skipped: number;
  errors: string[];
}

export interface ScaffoldReport {
  moved: { from: string; to: string }[];
  movedSkipped: string[];
  locales: LocaleReport[];
}

const DOTFILE = /^\./;

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function isIgnored(name: string, ignorePatterns: string[]): boolean {
  if (DOTFILE.test(name)) return true;
  return ignorePatterns.some((pat) => {
    // Simple glob: "*" → any chars within a single segment.
    const re = new RegExp(
      "^" +
        pat
          .replace(/[.+^${}()|[\]\\]/g, "\\$&")
          .replace(/\*/g, "[^/]*") +
        "$",
    );
    return re.test(name);
  });
}

async function listChildren(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

/**
 * Recursively copy `src` into `dst`, skipping any destination path that
 * already exists. Returns the number of files copied and skipped.
 */
async function copyMissing(
  src: string,
  dst: string,
  report: { copied: number; skipped: number; errors: string[] },
  dryRun: boolean,
): Promise<void> {
  const stat = await fs.stat(src);
  if (stat.isDirectory()) {
    if (!dryRun) await fs.mkdir(dst, { recursive: true });
    for (const child of await fs.readdir(src)) {
      await copyMissing(path.join(src, child), path.join(dst, child), report, dryRun);
    }
    return;
  }
  if (await pathExists(dst)) {
    report.skipped++;
    return;
  }
  if (!dryRun) {
    await fs.mkdir(path.dirname(dst), { recursive: true });
    await fs.copyFile(src, dst);
  }
  report.copied++;
}

/** Move a path; uses rename when possible, falls back to copy + remove. */
async function movePath(src: string, dst: string, dryRun: boolean): Promise<void> {
  if (dryRun) return;
  await fs.mkdir(path.dirname(dst), { recursive: true });
  try {
    await fs.rename(src, dst);
  } catch {
    await fs.cp(src, dst, { recursive: true });
    await fs.rm(src, { recursive: true, force: true });
  }
}

/**
 * 1. Move loose root-level content into `content/<defaultLocale>/`.
 * 2. For each non-default locale, copy `content/<defaultLocale>/` into
 *    `content/<locale>/`, never overwriting existing files.
 */
export async function scaffoldLocales(opts: ScaffoldOptions): Promise<ScaffoldReport> {
  const {
    contentDir,
    defaultLocale,
    locales,
    ignorePatterns = [],
    dryRun = false,
    forceMove = false,
  } = opts;

  if (!locales.includes(defaultLocale)) {
    throw new Error(
      `Default locale "${defaultLocale}" must be included in the locales list passed to scaffoldLocales`,
    );
  }

  const knownLocaleDirs = new Set(locales);
  const defaultDir = path.join(contentDir, defaultLocale);
  const report: ScaffoldReport = { moved: [], movedSkipped: [], locales: [] };

  // ---- Phase A: move loose content into the default-locale folder.
  if (!(await pathExists(contentDir))) {
    throw new Error(`Content directory not found: ${contentDir}`);
  }

  const rootEntries = await listChildren(contentDir);
  const looseEntries = rootEntries.filter(
    (name) => !knownLocaleDirs.has(name) && !isIgnored(name, ignorePatterns),
  );

  if (looseEntries.length > 0) {
    if (!dryRun) await fs.mkdir(defaultDir, { recursive: true });
    for (const name of looseEntries) {
      const from = path.join(contentDir, name);
      const to = path.join(defaultDir, name);
      const exists = await pathExists(to);
      if (exists && !forceMove) {
        report.movedSkipped.push(name);
        continue;
      }
      if (exists && forceMove) {
        if (!dryRun) await fs.rm(to, { recursive: true, force: true });
      }
      await movePath(from, to, dryRun);
      report.moved.push({ from, to });
    }
  }

  if (report.movedSkipped.length > 0 && !forceMove) {
    throw new Error(
      `[i18n] Refusing to overwrite existing paths in ${defaultLocale}: ${report.movedSkipped.join(
        ", ",
      )}. Re-run with --force-move to discard them.`,
    );
  }

  // ---- Phase B: copy defaultLocale → each other locale, skip-existing.
  for (const locale of locales) {
    if (locale === defaultLocale) continue;
    const target = path.join(contentDir, locale);
    const localeReport: LocaleReport = { locale, copied: 0, skipped: 0, errors: [] };
    if (!(await pathExists(defaultDir))) {
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
