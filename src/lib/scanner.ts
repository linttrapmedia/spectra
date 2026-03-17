import { resolve } from "path";
import type { ScanOptions } from "./types";

export async function scanForSpecs(rootDir: string, options?: ScanOptions): Promise<string[]> {
  const absRoot = resolve(rootDir);
  const glob = new Bun.Glob("**/*.coda.json");
  const results: string[] = [];

  const ignorePatterns = options?.ignore ?? ["node_modules/**", ".git/**"];

  for await (const path of glob.scan({ cwd: absRoot, absolute: true })) {
    // Check ignore patterns
    const relative = path.slice(absRoot.length + 1);
    let ignored = false;
    for (const pattern of ignorePatterns) {
      const simplePattern = pattern.replace("/**", "");
      if (relative.startsWith(simplePattern + "/") || relative.startsWith(simplePattern)) {
        ignored = true;
        break;
      }
    }
    if (ignored) continue;

    // Check maxDepth
    if (options?.maxDepth !== undefined) {
      const depth = relative.split("/").length;
      if (depth > options.maxDepth) continue;
    }

    results.push(path);
  }

  return results.sort();
}
