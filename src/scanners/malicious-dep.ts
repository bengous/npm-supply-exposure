import type { ScanContext, ScanResult, Finding } from "../lib/types.ts";
import { findManifests, findNodeModulesPackage } from "../lib/discovery.ts";

export async function scanMaliciousDep(ctx: ScanContext): Promise<ScanResult> {
  if (!ctx.maliciousDep) {
    return {
      scanner: "malicious-dep",
      status: "CLEAN",
      summary: "skipped (no --malicious-dep specified)",
      findings: [],
    };
  }

  const findings: Finding[] = [];
  const dep = ctx.maliciousDep;

  // Check manifests (dependencies, devDependencies, optionalDependencies)
  const manifests = await findManifests(ctx.rootPath);
  for (const filepath of manifests) {
    try {
      const content = JSON.parse(await Bun.file(filepath).text()) as Record<string, unknown>;
      for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
        const deps = content[field] as Record<string, string> | undefined;
        if (deps && dep in deps) {
          findings.push({
            scanner: "malicious-dep",
            path: filepath,
            detail: `${dep} listed in ${field}`,
          });
        }
      }
    } catch {
      // skip unreadable
    }
  }

  // Check node_modules
  const installed = await findNodeModulesPackage(ctx.rootPath, dep);
  for (const filepath of installed) {
    findings.push({
      scanner: "malicious-dep",
      path: filepath.replace(/\/package\.json$/, ""),
      detail: `${dep} installed in node_modules`,
    });
  }

  return {
    scanner: "malicious-dep",
    status: findings.length > 0 ? "FOUND" : "CLEAN",
    summary: findings.length > 0
      ? `${dep} found in ${findings.length} location${findings.length > 1 ? "s" : ""}`
      : `${dep} not found`,
    findings,
  };
}
