import { describe, expect, it } from "bun:test";
import { scanCaches } from "../../src/scanners/cache.ts";
import type { ScanContext } from "../../src/lib/types.ts";
import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("scanCaches", () => {
  it("returns CLEAN when cache dirs do not exist", async () => {
    const ctx: ScanContext = { pkg: "axios", version: "1.14.1", rootPath: "/nonexistent" };
    const result = await scanCaches(ctx, ["/nonexistent/cache"]);
    expect(result.status).toBe("CLEAN");
  });

  it("returns FOUND when cache contains a reference to the vulnerable package", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "audit-test-"));
    const cacheDir = join(tmpDir, "npm-cache");
    await mkdir(cacheDir, { recursive: true });
    await writeFile(
      join(cacheDir, "content-index.json"),
      JSON.stringify({ "axios-1.14.1.tgz": { integrity: "sha512-fake" } }),
    );

    const ctx: ScanContext = { pkg: "axios", version: "1.14.1", rootPath: tmpDir };
    const result = await scanCaches(ctx, [cacheDir]);
    expect(result.status).toBe("FOUND");
    expect(result.findings[0]!.detail).toContain("axios");

    await rm(tmpDir, { recursive: true });
  });
});
