import type { ScanContext, ScanResult, Finding } from "../lib/types.ts";
import { Glob } from "bun";
import { expandHome } from "../lib/discovery.ts";
import { existsSync } from "node:fs";

const DEFAULT_CACHE_DIRS = [
  "~/.npm/_cacache",
  "~/.bun/install/cache",
  "~/.local/share/pnpm/store",
];

export async function scanCaches(
  ctx: ScanContext,
  cacheDirs: string[] = DEFAULT_CACHE_DIRS.map(expandHome),
): Promise<ScanResult> {
  const findings: Finding[] = [];
  const patterns = [
    `${ctx.pkg}-${ctx.version}.tgz`,
    `${ctx.pkg}@${ctx.version}`,
    `${ctx.pkg}/-/${ctx.pkg}-${ctx.version}`,
  ];

  for (const dir of cacheDirs) {
    if (!existsSync(dir)) continue;

    const glob = new Glob("**/*");
    for await (const match of glob.scan({ cwd: dir, absolute: true, onlyFiles: true })) {
      const file = Bun.file(match);
      if (file.size > 1_000_000) continue;

      try {
        const content = await file.text();
        for (const pattern of patterns) {
          if (content.includes(pattern)) {
            findings.push({
              scanner: "cache",
              path: match,
              detail: `${ctx.pkg}@${ctx.version} cached (matched: ${pattern})`,
            });
            break;
          }
        }
      } catch {
        // skip unreadable files
      }
    }
  }

  return {
    scanner: "cache",
    status: findings.length > 0 ? "FOUND" : "CLEAN",
    summary: findings.length > 0
      ? `${ctx.pkg}@${ctx.version} found in ${findings.length} cache entr${findings.length > 1 ? "ies" : "y"}`
      : `${ctx.pkg}@${ctx.version} not in caches`,
    findings,
  };
}
