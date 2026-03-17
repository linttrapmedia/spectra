import { stat } from "fs/promises";
import { resolve } from "path";
import { bold, cyan, dim, green, LOGO } from "../lib/color";
import { readConfig } from "../lib/config";
import { compilePromptFiles } from "../lib/prompt";

export async function compileCommand(positional: string[], flags: Record<string, string | boolean>) {
  const target = positional[0] ?? ".";

  const config = await readConfig();
  const ide = config.ide;
  if (ide !== "vscode") {
    console.error(`Unsupported IDE: ${ide}. Currently only "vscode" is supported.`);
    process.exit(1);
  }

  const outputDir = resolve(process.cwd(), config.out);
  const targetPath = resolve(process.cwd(), target);

  const info = await stat(targetPath);
  let specFiles: string[];

  if (info.isDirectory()) {
    const glob = new Bun.Glob("**/*.coda.json");
    specFiles = [];
    for await (const path of glob.scan({ cwd: targetPath, absolute: true })) {
      specFiles.push(path);
    }
    if (specFiles.length === 0) {
      console.log("No .coda.json files found in directory");
      return;
    }
  } else {
    specFiles = [targetPath];
  }

  console.log(`${cyan(LOGO)} ${bold("compile")}\n`);
  let totalCompiled = 0;
  for (const specPath of specFiles) {
    const written = await compilePromptFiles(specPath, outputDir, ide as "vscode");
    for (const f of written) {
      console.log(`  ${green("✓")} ${f}`);
    }
    totalCompiled += written.length;
  }

  console.log(`\n${dim(`${totalCompiled} prompt file(s) compiled to ${outputDir}`)}`);
}
