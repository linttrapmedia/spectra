import { stat } from "fs/promises";
import { relative, resolve } from "path";
import { bold, cyan, dim, green, LOGO, red, yellow } from "../lib/color";
import { updateConfigResults } from "../lib/config";
import { diagnoseSpec } from "../lib/doctor";
import { scanForSpecs } from "../lib/scanner";
import type { DiagnosticResult } from "../lib/types";

export async function doctorCommand(positional: string[], _flags: Record<string, string | boolean>) {
  const target = resolve(process.cwd(), positional[0] ?? ".");
  const info = await stat(target);
  let specFiles: string[];

  if (info.isDirectory()) {
    specFiles = await scanForSpecs(target);
  } else {
    specFiles = [target];
  }

  if (specFiles.length === 0) {
    console.log("No .coda.json files found");
    return;
  }

  let totalErrors = 0;
  let totalWarnings = 0;
  const results: DiagnosticResult[] = [];

  console.log(`${cyan(LOGO)} ${bold("doctor")}\n`);
  for (const filePath of specFiles) {
    const result = await diagnoseSpec(filePath);
    const relPath = relative(process.cwd(), filePath);
    results.push({ ...result, filePath: relPath });
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;

    if (result.ok && result.warnings.length === 0) {
      console.log(`${green("✓")} ${relPath}`);
      continue;
    }

    console.log(`${cyan("━━━")} ${bold(relPath)} ${cyan("━━━")}`);
    for (const err of result.errors) {
      console.log(`  ${red("✗ ERROR")}   ${dim(err.path + ":")} ${err.message}`);
      if (err.suggestion) {
        console.log(`            ${dim("→")} ${err.suggestion}`);
      }
    }
    for (const warn of result.warnings) {
      console.log(`  ${yellow("⚠ WARNING")} ${dim(warn.path + ":")} ${warn.message}`);
      if (warn.suggestion) {
        console.log(`            ${dim("→")} ${warn.suggestion}`);
      }
    }
    console.log("");
  }

  await updateConfigResults("doctor", results);
  console.log(dim(`${specFiles.length} spec(s) checked, ${totalErrors} error(s), ${totalWarnings} warning(s)`));

  if (totalErrors > 0) {
    process.exit(1);
  }
}
