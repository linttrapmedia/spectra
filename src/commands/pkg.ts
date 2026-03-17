import { cp, readdir, stat } from "fs/promises";
import { join, resolve } from "path";
import { bold, cyan, dim, green, LOGO, red, yellow } from "../lib/color";

/** Resolve the pkg/ directory bundled with the CLI */
function pkgDir(): string {
  return resolve(new URL("../../pkg", import.meta.url).pathname);
}

async function listPackages() {
  const dir = pkgDir();
  const entries = await readdir(dir);
  const folders: string[] = [];

  for (const entry of entries) {
    const info = await stat(join(dir, entry));
    if (info.isDirectory()) folders.push(entry);
  }

  if (folders.length === 0) {
    console.log(`  ${yellow("●")} No packages found in ${dim(dir)}`);
    return;
  }

  console.log(`${cyan(LOGO)} ${bold("pkg")} ${dim("— available packages")}\n`);
  for (const f of folders) {
    console.log(`  ${cyan("•")} ${f}`);
  }
  console.log(`\n${dim(`${folders.length} package(s) available`)}`);
}

async function installPackage(name: string) {
  const src = join(pkgDir(), name);
  const srcExists = await stat(src)
    .then((s) => s.isDirectory())
    .catch(() => false);

  if (!srcExists) {
    console.error(`  ${red("✗")} Package "${name}" not found in ${dim(pkgDir())}`);
    process.exit(1);
  }

  const dest = resolve(process.cwd(), name);
  console.log(`${cyan(LOGO)} ${bold("pkg")} ${dim("— install")}\n`);
  await cp(src, dest, { recursive: true });
  console.log(`  ${green("✓")} Copied ${bold(name)} → ${dim(dest)}`);
}

export async function pkgCommand(_positional: string[], flags: Record<string, string | boolean>) {
  if (flags.list) {
    await listPackages();
    return;
  }

  if (flags.install && typeof flags.install === "string") {
    await installPackage(flags.install);
    return;
  }

  console.log(`${cyan(LOGO)} ${bold("pkg")}\n`);
  console.log(`  ${cyan("coda pkg")} --list               List available packages`);
  console.log(`  ${cyan("coda pkg")} --install <name>      Install a package to current directory`);
}
