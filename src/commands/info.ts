import { stat } from "fs/promises";
import { relative, resolve } from "path";
import { bold, cyan, dim, LOGO } from "../lib/color";
import { updateConfigResults } from "../lib/config";
import { getSpecInfo } from "../lib/info";
import { scanForSpecs } from "../lib/scanner";
import type { SpecInfo } from "../lib/types";

export async function infoCommand(positional: string[], _flags: Record<string, string | boolean>) {
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

  console.log(`${cyan(LOGO)} ${bold("info")}\n`);
  const results: SpecInfo[] = [];

  for (const filePath of specFiles) {
    const specInfo = await getSpecInfo(filePath);
    const relPath = relative(process.cwd(), specInfo.filePath);
    results.push({ ...specInfo, filePath: relPath });

    console.log(`${cyan("━━━")} ${bold(specInfo.name)} ${cyan("━━━")}`);
    console.log(`  ${dim("File:")}        ${relPath}`);
    console.log(`  ${dim("Description:")} ${specInfo.description}`);
    console.log(`  ${dim("Version:")}     ${specInfo.version}`);
    console.log(`  ${dim("Directives:")}  ${specInfo.directives.length}`);
    for (const d of specInfo.directives) {
      console.log(`    ${cyan("•")} ${bold(d.name)} ${dim("—")} ${d.description} ${dim(`(${d.stepCount} steps)`)}`);
    }
    console.log(`  ${dim("Schema types:")}      ${specInfo.schemaTypeCount}`);
    console.log(`  ${dim("Data keys:")}         ${specInfo.dataKeys.join(", ") || dim("(none)")}`);
    console.log(`  ${dim("Changelog entries:")} ${specInfo.changeLogCount}`);
    console.log(`  ${dim("Design decisions:")}  ${specInfo.designDecisionCount}`);
    console.log("");
  }

  await updateConfigResults("info", results);
}
