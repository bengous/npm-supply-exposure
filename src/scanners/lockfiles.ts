import type { ScanContext, ScanResult, Finding } from "../lib/types.ts";
import { findLockfiles } from "../lib/discovery.ts";

export async function scanLockfiles(ctx: ScanContext): Promise<ScanResult> {
  const lockfiles = await findLockfiles(ctx.rootPath);
  const findings: Finding[] = [];

  for (const filepath of lockfiles) {
    const content = await Bun.file(filepath).text();

    // package-lock.json: check version inside the pkg's node_modules block
    if (filepath.endsWith("package-lock.json")) {
      const pkgPattern = new RegExp(
        `"node_modules/${escapeRegex(ctx.pkg)}"\\s*:\\s*\\{[^}]*"version"\\s*:\\s*"${escapeRegex(ctx.version)}"`,
        "s",
      );
      if (pkgPattern.test(content)) {
        findings.push({
          scanner: "lockfiles",
          path: filepath,
          detail: `${ctx.pkg}@${ctx.version} resolved in lockfile`,
        });
        continue;
      }
    }

    // Generic patterns for pnpm-lock.yaml, yarn.lock, and URL references
    const patterns = [
      `${ctx.pkg}@${ctx.version}`,
      `/${ctx.pkg}/${ctx.version}`,
      `${ctx.pkg}-${ctx.version}.tgz`,
    ];

    for (const pattern of patterns) {
      if (content.includes(pattern)) {
        findings.push({
          scanner: "lockfiles",
          path: filepath,
          detail: `${ctx.pkg}@${ctx.version} found (matched: ${pattern})`,
        });
        break;
      }
    }
  }

  const total = lockfiles.length;
  return {
    scanner: "lockfiles",
    status: findings.length > 0 ? "FOUND" : "CLEAN",
    summary: findings.length > 0
      ? `${findings.length}/${total} contain ${ctx.pkg}@${ctx.version}`
      : `0/${total} contain ${ctx.pkg}@${ctx.version}`,
    findings,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
