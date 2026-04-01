export type Finding = {
  scanner: string;
  path: string;
  detail: string;
};

export type ScanResult = {
  scanner: string;
  status: "CLEAN" | "FOUND";
  summary: string;
  findings: Finding[];
};

export type ScanContext = {
  pkg: string;
  version: string;
  maliciousDep?: string;
  ioc?: string;
  rootPath: string;
};

export type Scanner = (ctx: ScanContext) => Promise<ScanResult>;
