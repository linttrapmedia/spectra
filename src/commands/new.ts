import { resolve } from "path";
import { bold, cyan, dim, green, LOGO } from "../lib/color";
import { createSpec } from "../lib/spec";

export async function newCommand(positional: string[], flags: Record<string, string | boolean>) {
  const name = typeof flags.name === "string" ? flags.name : undefined;

  if (!name) {
    console.error("Missing required flag: --name <name>");
    process.exit(1);
  }

  const id = name.toLowerCase().replace(/\s+/g, "-");
  const fileName = positional[0] ?? `${id}.coda.json`;
  const filePath = resolve(process.cwd(), fileName);

  const file = Bun.file(filePath);
  if (await file.exists()) {
    console.error(`File already exists: ${filePath}`);
    process.exit(1);
  }

  await createSpec(filePath, { name, id });
  console.log(`${cyan(LOGO)} ${bold("new")}\n`);
  console.log(`${green("✓")} Created ${dim(fileName)}`);
}
