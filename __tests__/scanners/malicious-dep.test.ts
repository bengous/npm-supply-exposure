import { describe, expect, it } from "bun:test";
import { scanMaliciousDep } from "../../src/scanners/malicious-dep.ts";
import type { ScanContext } from "../../src/lib/types.ts";
import { resolve } from "node:path";

const fixturesDir = resolve(import.meta.dir, "../fixtures");

describe("scanMaliciousDep", () => {
  it("returns CLEAN when malicious dep is not present", async () => {
    const ctx: ScanContext = {
      pkg: "axios", version: "1.14.1",
      maliciousDep: "plain-crypto-js",
      rootPath: resolve(fixturesDir, "clean-project"),
    };
    const result = await scanMaliciousDep(ctx);
    expect(result.status).toBe("CLEAN");
  });

  it("returns FOUND when malicious dep exists in node_modules", async () => {
    const ctx: ScanContext = {
      pkg: "axios", version: "1.14.1",
      maliciousDep: "plain-crypto-js",
      rootPath: resolve(fixturesDir, "compromised-project"),
    };
    const result = await scanMaliciousDep(ctx);
    expect(result.status).toBe("FOUND");
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it("returns CLEAN with skip summary when no maliciousDep specified", async () => {
    const ctx: ScanContext = {
      pkg: "axios", version: "1.14.1",
      rootPath: resolve(fixturesDir, "compromised-project"),
    };
    const result = await scanMaliciousDep(ctx);
    expect(result.status).toBe("CLEAN");
    expect(result.summary).toContain("skipped");
  });
});
