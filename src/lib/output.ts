import type { ScanResult } from "./types.ts";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

function colorize(text: string, color: string, useColor: boolean): string {
  return useColor ? `${color}${text}${RESET}` : text;
}

export function formatResult(result: ScanResult, useColor: boolean): string {
  const tag =
    result.status === "CLEAN"
      ? colorize("[CLEAN]", GREEN, useColor)
      : colorize("[FOUND]", RED, useColor);
  let out = `${tag}  ${result.scanner}: ${result.summary}`;
  for (const f of result.findings) {
    out += `\n         ${f.path}: ${f.detail}`;
  }
  return out;
}

export function formatSummary(results: ScanResult[], useColor: boolean): string {
  const found = results.filter((r) => r.status === "FOUND");
  const count = found.length;
  if (count === 0) {
    return `---\nRESULT: ${colorize("CLEAN", GREEN, useColor)}`;
  }
  return `---\nRESULT: ${colorize("EXPOSED", RED, useColor)} (${count} finding${count > 1 ? "s" : ""})`;
}

export function printResult(result: ScanResult): void {
  const useColor = !!process.stdout.isTTY && !process.env["NO_COLOR"];
  console.log(formatResult(result, useColor));
}

export function printSummary(results: ScanResult[]): void {
  const useColor = !!process.stdout.isTTY && !process.env["NO_COLOR"];
  console.log(formatSummary(results, useColor));
}
