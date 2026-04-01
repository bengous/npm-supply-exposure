import { describe, expect, it } from "bun:test";
import { scanIoc } from "../../src/scanners/ioc.ts";
import type { ScanContext } from "../../src/lib/types.ts";
import { resolve } from "node:path";

const fixturesDir = resolve(import.meta.dir, "../fixtures");

describe("scanIoc", () => {
  it("returns CLEAN when IoC domain is not referenced", async () => {
    const ctx: ScanContext = {
      pkg: "axios", version: "1.14.1",
      ioc: "sfrclak.com",
      rootPath: resolve(fixturesDir, "clean-project"),
    };
    const result = await scanIoc(ctx);
    expect(result.status).toBe("CLEAN");
  });

  it("returns FOUND when IoC domain is in a file", async () => {
    const ctx: ScanContext = {
      pkg: "axios", version: "1.14.1",
      ioc: "sfrclak.com",
      rootPath: resolve(fixturesDir, "compromised-project"),
    };
    const result = await scanIoc(ctx);
    expect(result.status).toBe("FOUND");
    expect(result.findings[0]!.path).toContain("setup.js");
  });

  it("returns CLEAN with skip summary when no --ioc specified", async () => {
    const ctx: ScanContext = {
      pkg: "axios", version: "1.14.1",
      rootPath: resolve(fixturesDir, "compromised-project"),
    };
    const result = await scanIoc(ctx);
    expect(result.status).toBe("CLEAN");
    expect(result.summary).toContain("skipped");
  });
});
