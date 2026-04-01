import type { ScanContext, ScanResult, Finding } from "../lib/types.ts";
import { findNodeModulesPackage } from "../lib/discovery.ts";

export async function scanNodeModules(ctx: ScanContext): Promise<ScanResult> {
  const manifests = await findNodeModulesPackage(ctx.rootPath, ctx.pkg);
  const findings: Finding[] = [];

  for (const filepath of manifests) {
    try {
      const content = JSON.parse(await Bun.file(filepath).text()) as { version?: string };
      if (content.version === ctx.version) {
        findings.push({
          scanner: "node_modules",
          path: filepath.replace(/\/package\.json$/, ""),
          detail: `version ${ctx.version} installed`,
        });
      }
    } catch {
      // skip unreadable manifests
    }
  }

  return {
    scanner: "node_modules",
    status: findings.length > 0 ? "FOUND" : "CLEAN",
    summary: findings.length > 0
      ? `${ctx.pkg}@${ctx.version} installed in ${findings.length} location${findings.length > 1 ? "s" : ""}`
      : `no ${ctx.pkg}@${ctx.version} installed`,
    findings,
  };
}
