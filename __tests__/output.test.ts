import { describe, expect, it } from "bun:test";
import { formatResult, formatSummary } from "../src/lib/output.ts";
import type { ScanResult } from "../src/lib/types.ts";

describe("formatResult", () => {
  it("formats a CLEAN result", () => {
    const result: ScanResult = {
      scanner: "lockfiles",
      status: "CLEAN",
      summary: "0/12 contain axios@1.14.1",
      findings: [],
    };
    const line = formatResult(result, false);
    expect(line).toBe("[CLEAN]  lockfiles: 0/12 contain axios@1.14.1");
  });

  it("formats a FOUND result", () => {
    const result: ScanResult = {
      scanner: "node_modules",
      status: "FOUND",
      summary: "axios@1.14.1 installed in 2 locations",
      findings: [
        { scanner: "node_modules", path: "/a/node_modules/axios", detail: "version 1.14.1" },
      ],
    };
    const line = formatResult(result, false);
    expect(line).toBe(
      "[FOUND]  node_modules: axios@1.14.1 installed in 2 locations\n         /a/node_modules/axios: version 1.14.1"
    );
  });
});

describe("formatSummary", () => {
  it("returns CLEAN with 0 findings", () => {
    const line = formatSummary([], false);
    expect(line).toBe("---\nRESULT: CLEAN");
  });

  it("returns EXPOSED with finding count", () => {
    const results: ScanResult[] = [
      { scanner: "a", status: "FOUND", summary: "", findings: [{ scanner: "a", path: "/x", detail: "y" }] },
      { scanner: "b", status: "CLEAN", summary: "", findings: [] },
      { scanner: "c", status: "FOUND", summary: "", findings: [{ scanner: "c", path: "/z", detail: "w" }] },
    ];
    const line = formatSummary(results, false);
    expect(line).toBe("---\nRESULT: EXPOSED (2 findings)");
  });
});
