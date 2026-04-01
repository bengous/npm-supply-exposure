import { describe, expect, it } from "bun:test";
import { scanNodeModules } from "../../src/scanners/node-modules.ts";
import type { ScanContext } from "../../src/lib/types.ts";
import { resolve } from "node:path";

const fixturesDir = resolve(import.meta.dir, "../fixtures");
const baseCtx: ScanContext = { pkg: "axios", version: "1.14.1", rootPath: "" };

describe("scanNodeModules", () => {
  it("returns CLEAN when package is not installed", async () => {
    const ctx = { ...baseCtx, rootPath: resolve(fixturesDir, "clean-project") };
    const result = await scanNodeModules(ctx);
    expect(result.status).toBe("CLEAN");
  });

  it("returns FOUND when vulnerable version is installed", async () => {
    const ctx = { ...baseCtx, rootPath: resolve(fixturesDir, "compromised-project") };
    const result = await scanNodeModules(ctx);
    expect(result.status).toBe("FOUND");
    expect(result.findings[0]!.detail).toContain("1.14.1");
  });

  it("returns FOUND when node_modules has vulnerable version despite safe lockfile", async () => {
    const ctx = { ...baseCtx, rootPath: resolve(fixturesDir, "partial-exposure") };
    const result = await scanNodeModules(ctx);
    expect(result.status).toBe("FOUND");
  });
});
