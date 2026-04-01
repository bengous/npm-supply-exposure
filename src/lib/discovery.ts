import { Glob } from "bun";
import { resolve } from "node:path";

export async function findLockfiles(rootPath: string): Promise<string[]> {
  const patterns = ["**/package-lock.json", "**/pnpm-lock.yaml", "**/yarn.lock"];
  const results: string[] = [];
  for (const pattern of patterns) {
    const glob = new Glob(pattern);
    for await (const match of glob.scan({ cwd: rootPath, absolute: true, onlyFiles: true })) {
      if (!match.includes("/node_modules/")) {
        results.push(match);
      }
    }
  }
  return results;
}

export async function findManifests(rootPath: string): Promise<string[]> {
  const glob = new Glob("**/package.json");
  const results: string[] = [];
  for await (const match of glob.scan({ cwd: rootPath, absolute: true, onlyFiles: true })) {
    if (!match.includes("/node_modules/")) {
      results.push(match);
    }
  }
  return results;
}

export async function findNodeModulesPackage(rootPath: string, pkg: string): Promise<string[]> {
  const glob = new Glob(`**/node_modules/${pkg}/package.json`);
  const results: string[] = [];
  for await (const match of glob.scan({ cwd: rootPath, absolute: true, onlyFiles: true })) {
    results.push(match);
  }
  return results;
}

export function expandHome(p: string): string {
  if (p.startsWith("~/") || p === "~") {
    return resolve(process.env["HOME"] ?? "/", p.slice(2));
  }
  return p;
}
