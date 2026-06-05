/**
 * Standalone CLI entry — invoked by `npm run i18n:sync` at the repo root.
 *
 * Usage:
 *   node dist/cli.js sync [--config path] [--content path] [--dry-run] [--force-move]
 */

import fs from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { scaffoldLocales } from "./build/scaffold";
import { buildLocaleList } from "./util/locales";

interface CliArgs {
  config: string;
  content?: string;
  dryRun: boolean;
  forceMove: boolean;
}

function parseArgs(argv: string[]): { command: string | undefined; args: CliArgs } {
  const args: CliArgs = {
    config: "./quartz.config.yaml",
    dryRun: false,
    forceMove: false,
  };
  let command: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (!tok) continue;
    if (!command && !tok.startsWith("-")) {
      command = tok;
      continue;
    }
    switch (tok) {
      case "--dry-run":
      case "-n":
        args.dryRun = true;
        break;
      case "--force-move":
      case "-f":
        args.forceMove = true;
        break;
      case "--config":
      case "-c":
        args.config = argv[++i] ?? args.config;
        break;
      case "--content":
        args.content = argv[++i];
        break;
      case "--help":
      case "-h":
        printHelpAndExit(0);
        break;
      default:
        if (tok.startsWith("-")) {
          console.error(`Unknown flag: ${tok}`);
          printHelpAndExit(1);
        }
    }
  }
  return { command, args };
}

function printHelpAndExit(code: number): never {
  console.log(
    [
      "Usage: quartz-i18n sync [options]",
      "",
      "Options:",
      "  -c, --config <path>     Path to quartz.config.yaml (default: ./quartz.config.yaml)",
      "      --content <path>    Path to the content directory (default: ./content)",
      "  -n, --dry-run           Print intended actions without writing",
      "  -f, --force-move        Allow overwriting existing default-locale files when moving",
      "  -h, --help              Show this help",
    ].join("\n"),
  );
  process.exit(code);
}

interface QuartzPluginEntry {
  source: string;
  options?: Record<string, unknown>;
}

interface ParsedConfig {
  defaultLocale: string;
  locales: string[];
  ignorePatterns: string[];
}

async function loadConfig(configPath: string): Promise<ParsedConfig> {
  const raw = await fs.readFile(configPath, "utf-8");
  const doc = parseYaml(raw) as {
    configuration?: { locale?: string; ignorePatterns?: string[] };
    plugins?: QuartzPluginEntry[];
  };
  const defaultLocale = doc.configuration?.locale ?? "en-US";
  const ignorePatterns = doc.configuration?.ignorePatterns ?? [];

  // Find our plugin block to read its locales option.
  const plugin = (doc.plugins ?? []).find((p) => {
    const src = p?.source ?? "";
    return (
      src.includes("content-internationalization") ||
      src.includes("quartz-content-internationalization")
    );
  });
  const opts = plugin?.options ?? {};
  const rawLocales = Array.isArray(opts.locales) ? (opts.locales as unknown[]) : [];
  const locales = rawLocales
    .filter((l): l is string => typeof l === "string");

  return { defaultLocale, locales, ignorePatterns };
}

async function runSync(args: CliArgs): Promise<void> {
  const configPath = path.resolve(args.config);
  let cfg: ParsedConfig;
  try {
    cfg = await loadConfig(configPath);
  } catch (err) {
    console.error(`[i18n] Failed to load config: ${configPath}`);
    console.error(err instanceof Error ? err.message : err);
    process.exit(2);
  }

  const contentDir = path.resolve(args.content ?? path.join(path.dirname(configPath), "content"));
  const fullLocales = buildLocaleList(cfg.defaultLocale, cfg.locales);
  const defaultLocale = fullLocales[0]!;

  console.log(`[i18n] Config:      ${configPath}`);
  console.log(`[i18n] Content dir: ${contentDir}`);
  console.log(`[i18n] Default:     ${defaultLocale}`);
  console.log(`[i18n] Locales:     ${fullLocales.join(", ")}`);
  if (args.dryRun) console.log(`[i18n] DRY RUN — no changes will be written.`);

  let report;
  try {
    report = await scaffoldLocales({
      contentDir,
      defaultLocale,
      locales: fullLocales,
      ignorePatterns: cfg.ignorePatterns,
      dryRun: args.dryRun,
      forceMove: args.forceMove,
    });
  } catch (err) {
    console.error(`[i18n] ${err instanceof Error ? err.message : err}`);
    process.exit(3);
  }

  if (report.moved.length > 0) {
    console.log(`[i18n] Moved ${report.moved.length} entries into ${defaultLocale}/`);
    for (const m of report.moved) {
      console.log(`         ${path.relative(contentDir, m.from)} → ${path.relative(contentDir, m.to)}`);
    }
  } else {
    console.log(`[i18n] No loose root-level entries to move.`);
  }

  for (const r of report.locales) {
    const tag = r.errors.length > 0 ? "ERROR" : "OK";
    console.log(
      `[i18n] ${r.locale}: ${r.copied} copied, ${r.skipped} skipped (${tag})`,
    );
    for (const e of r.errors) console.log(`         ! ${e}`);
  }
}

async function main(): Promise<void> {
  const { command, args } = parseArgs(process.argv.slice(2));
  switch (command) {
    case undefined:
    case "sync":
      await runSync(args);
      break;
    case "help":
      printHelpAndExit(0);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelpAndExit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
