import { describe, expect, it } from "bun:test";
import { resolve } from "node:path";
import { $ } from "bun";

const cli = resolve(import.meta.dir, "../src/cli.ts");
const fixturesDir = resolve(import.meta.dir, "fixtures");

describe("CLI integration", () => {
  it("exits 0 and prints all CLEAN for a clean project", async () => {
    const result = await $`bun ${cli} axios 1.14.1 --path ${resolve(fixturesDir, "clean-project")} --no-color --skip-cache`
      .quiet()
      .nothrow();
    const stdout = result.stdout.toString();
    expect(result.exitCode).toBe(0);
    expect(stdout).toContain("[CLEAN]  lockfiles:");
    expect(stdout).toContain("[CLEAN]  node_modules:");
    expect(stdout).toContain("RESULT: CLEAN");
  });

  it("exits 1 and prints FOUND for a compromised project", async () => {
    const result = await $`bun ${cli} axios 1.14.1 --malicious-dep plain-crypto-js --ioc sfrclak.com --path ${resolve(fixturesDir, "compromised-project")} --no-color --skip-cache`
      .quiet()
      .nothrow();
    const stdout = result.stdout.toString();
    expect(result.exitCode).toBe(1);
    expect(stdout).toContain("[FOUND]");
    expect(stdout).toContain("RESULT: EXPOSED");
  });

  it("detects partial exposure: clean lockfile but compromised node_modules", async () => {
    const result = await $`bun ${cli} axios 1.14.1 --path ${resolve(fixturesDir, "partial-exposure")} --no-color --skip-cache`
      .quiet()
      .nothrow();
    const stdout = result.stdout.toString();
    expect(result.exitCode).toBe(1);
    expect(stdout).toContain("[CLEAN]  lockfiles:");
    expect(stdout).toContain("[FOUND]  node_modules:");
  });

  it("exits 2 with no arguments", async () => {
    const result = await $`bun ${cli}`.quiet().nothrow();
    expect(result.exitCode).toBe(2);
  });

  it("exits 2 with --help", async () => {
    const result = await $`bun ${cli} --help`.quiet().nothrow();
    const stdout = result.stdout.toString();
    expect(result.exitCode).toBe(2);
    expect(stdout).toContain("Usage:");
  });
});
