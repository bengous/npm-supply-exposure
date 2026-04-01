import { describe, expect, it } from "bun:test";
import { scanLockfiles } from "../../src/scanners/lockfiles.ts";
import type { ScanContext } from "../../src/lib/types.ts";
import { resolve } from "node:path";

const fixturesDir = resolve(import.meta.dir, "../fixtures");
const baseCtx: ScanContext = { pkg: "axios", version: "1.14.1", rootPath: "" };

describe("scanLockfiles", () => {
  it("returns CLEAN for a project without the vulnerable package", async () => {
    const ctx = { ...baseCtx, rootPath: resolve(fixturesDir, "clean-project") };
    const result = await scanLockfiles(ctx);
    expect(result.status).toBe("CLEAN");
    expect(result.findings).toHaveLength(0);
  });

  it("returns FOUND for a project with the vulnerable version in lockfile", async () => {
    const ctx = { ...baseCtx, rootPath: resolve(fixturesDir, "compromised-project") };
    const result = await scanLockfiles(ctx);
    expect(result.status).toBe("FOUND");
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings[0]!.detail).toContain("1.14.1");
  });

  it("returns CLEAN when lockfile has a safe version", async () => {
    const ctx = { ...baseCtx, rootPath: resolve(fixturesDir, "partial-exposure") };
    const result = await scanLockfiles(ctx);
    expect(result.status).toBe("CLEAN");
  });
});
