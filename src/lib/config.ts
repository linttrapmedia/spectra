import { resolve } from "path";
import type { DiagnosticResult, SpecInfo } from "./types";

// ─── Config Types ────────────────────────────────────────────────────────────

export interface ValidateResult {
  filePath: string;
  valid: boolean;
  errors: { path: string; message: string }[];
}

export interface SpectraConfig {
  ide: string;
  out: string;
  results: {
    info: SpecInfo[];
    doctor: DiagnosticResult[];
    validate: ValidateResult[];
  };
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const CONFIG_FILE = "spectra.json";

export function configPath(cwd?: string): string {
  return resolve(cwd ?? process.cwd(), CONFIG_FILE);
}

export function defaultConfig(): SpectraConfig {
  return {
    ide: "vscode",
    out: ".github/prompts",
    results: {
      info: [],
      doctor: [],
      validate: [],
    },
  };
}

// ─── Read / Write ────────────────────────────────────────────────────────────

export async function readConfig(cwd?: string): Promise<SpectraConfig> {
  const path = configPath(cwd);
  const file = Bun.file(path);
  if (!(await file.exists())) {
    return defaultConfig();
  }
  const text = await file.text();
  return JSON.parse(text) as SpectraConfig;
}

export async function writeConfig(config: SpectraConfig, cwd?: string): Promise<void> {
  const path = configPath(cwd);
  await Bun.write(path, JSON.stringify(config, null, 2) + "\n");
}

export async function initConfig(overrides?: Partial<SpectraConfig>, cwd?: string): Promise<SpectraConfig> {
  const config: SpectraConfig = { ...defaultConfig(), ...overrides };
  await writeConfig(config, cwd);
  return config;
}

export async function updateConfigResults(
  key: keyof SpectraConfig["results"],
  data: unknown[],
  cwd?: string,
): Promise<void> {
  const path = configPath(cwd);
  const file = Bun.file(path);
  const config = (await file.exists()) ? (JSON.parse(await file.text()) as SpectraConfig) : defaultConfig();
  (config.results as Record<string, unknown>)[key] = data;
  await writeConfig(config, cwd);
}
