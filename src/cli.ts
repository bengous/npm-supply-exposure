#!/usr/bin/env bun

import type { ScanContext, ScanResult } from "./lib/types.ts";
import { printResult, printSummary } from "./lib/output.ts";
import { scanLockfiles } from "./scanners/lockfiles.ts";
import { scanNodeModules } from "./scanners/node-modules.ts";
import { scanCaches } from "./scanners/cache.ts";
import { scanMaliciousDep } from "./scanners/malicious-dep.ts";
import { scanIoc } from "./scanners/ioc.ts";
import { resolve } from "node:path";

function usage(): never {
  console.log(`Usage: audit-supply-chain <package> <version> [options]

Detect compromised npm packages in your environment.

Options:
  --malicious-dep <name>    Malicious transitive dependency to search for
  --ioc <domain>            C2 domain / IoC to scan for
  --path <dir>              Directory to scan (default: cwd)
  --skip-cache              Skip scanning package manager caches
  --no-color                Disable colors
  --help                    Show this help`);
  process.exit(2);
}

type CliConfig = { ctx: ScanContext; skipCache: boolean };

function parseArgs(argv: string[]): CliConfig {
  const args = argv.slice(2);

  if (args.includes("--help") || args.length < 2) {
    usage();
  }

  const positional: string[] = [];
  let maliciousDep: string | undefined;
  let ioc: string | undefined;
  let rootPath = process.cwd();
  let skipCache = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--malicious-dep" && args[i + 1]) {
      maliciousDep = args[++i]!;
    } else if (arg === "--ioc" && args[i + 1]) {
      ioc = args[++i]!;
    } else if (arg === "--path" && args[i + 1]) {
      rootPath = resolve(args[++i]!);
    } else if (arg === "--skip-cache") {
      skipCache = true;
    } else if (arg === "--no-color") {
      process.env["NO_COLOR"] = "1";
    } else if (arg.startsWith("--")) {
      console.error(`Unknown option: ${arg}`);
      usage();
    } else {
      positional.push(arg);
    }
  }

  if (positional.length < 2) {
    console.error("Error: <package> and <version> are required");
    usage();
  }

  return {
    ctx: { pkg: positional[0]!, version: positional[1]!, maliciousDep, ioc, rootPath },
    skipCache,
  };
}

async function main(): Promise<void> {
  const { ctx, skipCache } = parseArgs(process.argv);

  const scanners: Promise<ScanResult>[] = [
    scanLockfiles(ctx),
    scanNodeModules(ctx),
    ...(skipCache
      ? [Promise.resolve({ scanner: "cache", status: "CLEAN" as const, summary: "skipped (--skip-cache)", findings: [] })]
      : [scanCaches(ctx)]),
    scanMaliciousDep(ctx),
    scanIoc(ctx),
  ];

  const results = await Promise.all(scanners);

  for (const result of results) {
    printResult(result);
  }
  printSummary(results);

  const hasFindings = results.some((r) => r.status === "FOUND");
  process.exit(hasFindings ? 1 : 0);
}

main();
