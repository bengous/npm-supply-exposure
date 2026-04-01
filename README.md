# npm-supply-exposure

When an npm package gets compromised, the advisory tells you the package name and the affected version. What it doesn't tell you is whether that version is sitting in your lockfiles, your `node_modules`, or your package manager cache right now.

Point it at a directory with a package name and version. It looks for signs of exposure.

## What it checks

- **Lockfiles**: `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` for resolved references to the compromised version
- **node_modules**: installed copies matching the exact version
- **Package manager caches**: npm, bun, and pnpm local caches for cached tarballs
- **Malicious transitive dependencies**: if the advisory names a rogue dependency injected by the compromised package, checks manifests and installs for it
- **Indicators of compromise**: full text search for C2 domains or other IoC strings across your project files

## Install

Requires [Bun](https://bun.sh).

```
git clone https://github.com/bengous/npm-supply-exposure.git
cd npm-supply-exposure
bun install
```

## Usage

```
bun src/cli.ts <package> <version> [options]
```

### Example: check if you have a compromised version of axios

```
bun src/cli.ts axios 1.7.1 --path ~/my-project
```

### Full scan with known malicious dependency and C2 domain

```
bun src/cli.ts axios 1.7.1 \
  --malicious-dep plain-crypto-js \
  --ioc sfrclak.com \
  --path ~/my-project
```

### Options

| Flag | Description |
|------|-------------|
| `--malicious-dep <name>` | A transitive dependency introduced by the compromise |
| `--ioc <domain>` | A C2 domain or indicator of compromise to grep for |
| `--path <dir>` | Directory to scan (defaults to current directory) |
| `--skip-cache` | Skip scanning package manager caches |
| `--no-color` | Disable colored output |

## Output

Exit code `0` means no findings. Exit code `1` means potential exposure was detected.

```
[CLEAN]  lockfiles: 0/2 contain axios@1.7.1
[FOUND]  node_modules: axios@1.7.1 installed in 1 location
[CLEAN]  cache: axios@1.7.1 not in caches
[FOUND]  malicious-dep: plain-crypto-js found in 2 locations
[FOUND]  ioc: sfrclak.com found in 3 files
---
RESULT: EXPOSED (3 findings)
```

## Why not just `npm audit`?

`npm audit` checks known vulnerabilities in your dependency tree against the npm advisory database. It doesn't help when:

- You need to act **now**, before the advisory database is updated
- You want to check caches and disk, not just the dependency graph
- The compromise involves a transitive dependency or IoC that `npm audit` doesn't model
- You're scanning a project that uses pnpm or bun, not just npm

It's for incident response: you already know the bad package and version, you need to know if it's on this machine.
