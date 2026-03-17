import { stat } from "fs/promises";
import { relative, resolve } from "path";
import { bold, cyan, dim, green, LOGO, red } from "../lib/color";
import { updateConfigResults, type ValidateResult } from "../lib/config";
import { scanForSpecs } from "../lib/scanner";
import { readSpec } from "../lib/spec";
import { validateSpec } from "../lib/validator";

export async function validateCommand(positional: string[], _flags: Record<string, string | boolean>) {
  const target = positional[0] ?? ".";
  const targetPath = resolve(process.cwd(), target);
  const info = await stat(targetPath);
  let specFiles: string[];

  if (info.isDirectory()) {
    specFiles = await scanForSpecs(targetPath);
  } else {
    specFiles = [targetPath];
  }

  if (specFiles.length === 0) {
    console.log("No .coda.json files found");
    return;
  }

  console.log(`${cyan(LOGO)} ${bold("validate")}\n`);
  let hasErrors = false;
  const results: ValidateResult[] = [];

  for (const filePath of specFiles) {
    const spec = await readSpec(filePath);
    const result = validateSpec(spec);
    const relPath = relative(process.cwd(), filePath);
    results.push({ filePath: relPath, valid: result.valid, errors: result.errors });

    if (result.valid) {
      console.log(`${green("✓")} ${relPath}`);
    } else {
      hasErrors = true;
      console.log(`${red("✗")} ${relPath}`);
      for (const err of result.errors) {
        console.log(`  ${dim(err.path + ":")} ${err.message}`);
      }
    }
  }

  await updateConfigResults("validate", results);

  if (hasErrors) {
    process.exit(1);
  }
}
