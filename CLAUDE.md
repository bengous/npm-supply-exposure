# npm-supply-exposure

CLI that scans for traces of compromised npm packages locally. Exit 0 = no findings, exit 1 = potential exposure detected.

## Commands

```bash
bun test                                  # all tests
bun test __tests__/scanners/ioc.test.ts   # single test file
bun run typecheck                         # type-check without emitting
bun src/cli.ts <pkg> <ver> [options]      # run CLI
```

## How it works

`cli.ts` parses args into a `ScanContext`, runs 5 scanners in parallel via `Promise.all`, prints each `ScanResult`, then exits based on findings.

Every scanner is a function `(ScanContext) => Promise<ScanResult>`. To add a scanner: create a file in `src/scanners/`, export a function matching that signature, wire it into `cli.ts`.

## Key types (`src/lib/types.ts`)

- `ScanContext`: input (package name, version, optional malicious dep/IoC, root path)
- `ScanResult`: output per scanner (scanner name, CLEAN/FOUND status, summary, findings list)
- `Finding`: single hit (scanner name, file path, detail string)

## Conventions

- Scanners are independent and stateless. They receive a `ScanContext`, return a `ScanResult`, touch nothing else.
- File discovery goes through `src/lib/discovery.ts` (glob helpers), not raw fs calls in scanners.
- Output formatting lives in `src/lib/output.ts`. Scanners never print directly.
- Tests mirror src structure: `src/scanners/foo.ts` -> `__tests__/scanners/foo.test.ts`
- Test fixtures under `__tests__/fixtures/` contain synthetic node_modules tracked in git (test data, not real deps).
- CLI integration tests shell out to `bun src/cli.ts` and assert on exit codes + stdout.
