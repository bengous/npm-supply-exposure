import type { ScanContext, ScanResult, Finding } from "../lib/types.ts";
import { Glob } from "bun";

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp", ".svg",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".zip", ".tar", ".gz", ".br",
  ".pdf", ".exe", ".dll", ".so", ".dylib",
  ".lockb",
]);

export async function scanIoc(ctx: ScanContext): Promise<ScanResult> {
  if (!ctx.ioc) {
    return {
      scanner: "ioc",
      status: "CLEAN",
      summary: "skipped (no --ioc specified)",
      findings: [],
    };
  }

  const findings: Finding[] = [];
  const glob = new Glob("**/*");

  for await (const match of glob.scan({ cwd: ctx.rootPath, absolute: true, onlyFiles: true })) {
    if (match.includes("/.git/")) continue;

    const dotIdx = match.lastIndexOf(".");
    if (dotIdx !== -1) {
      const ext = match.slice(dotIdx).toLowerCase();
      if (BINARY_EXTENSIONS.has(ext)) continue;
    }

    try {
      const file = Bun.file(match);
      if (file.size > 5_000_000) continue;
      const content = await file.text();
      if (content.includes(ctx.ioc)) {
        findings.push({
          scanner: "ioc",
          path: match,
          detail: `references ${ctx.ioc}`,
        });
      }
    } catch {
      // skip unreadable
    }
  }

  return {
    scanner: "ioc",
    status: findings.length > 0 ? "FOUND" : "CLEAN",
    summary: findings.length > 0
      ? `${ctx.ioc} found in ${findings.length} file${findings.length > 1 ? "s" : ""}`
      : `${ctx.ioc} not referenced`,
    findings,
  };
}
