#!/usr/bin/env bun

import { cleanCommand } from "./commands/clean";
import { compileCommand } from "./commands/compile";
import { doctorCommand } from "./commands/doctor";
import { infoCommand } from "./commands/info";
import { newCommand } from "./commands/new";
import { pkgCommand } from "./commands/pkg";
import { setupCommand } from "./commands/setup";
import { validateCommand } from "./commands/validate";
import { bold, cyan, dim, LOGO } from "./lib/color";

const COMMANDS: [string, string][] = [
  ["coda new --name <name>", "Create a named .coda.json file"],
  ["coda compile [file|dir]", "Compile .prompt.md files from spec(s)"],
  ["coda info [file|dir]", "Report detailed info about spec file(s)"],
  ["coda doctor [file|dir]", "Diagnose and report issues in spec file(s)"],
  ["coda validate [file|dir]", "Validate spec(s) against their schemas"],
  ["coda clean", "Remove agent files and clear config results"],
  ["coda pkg --list", "List available packages"],
  ["coda pkg --install <name>", "Install a package to current directory"],
  ["coda setup", "Scaffold coda.json config and agent file"],
  ["  --ide <ide>", "IDE target (default: vscode)"],
  ["  --out <dir>", "Output directory (default: .github/prompts/)"],
];

const OPTIONS: [string, string][] = [
  ["--help, -h", "Show this help message"],
  ["--version, -v", "Show version"],
];

function formatTable(rows: [string, string][], colorCmd: (s: string) => string): string {
  const maxLeft = Math.max(...rows.map(([l]) => l.length));
  return rows.map(([left, right]) => `  ${colorCmd(left)}${" ".repeat(maxLeft - left.length)}  ${right}`).join("\n");
}

const USAGE = `
${bold(cyan(`${LOGO} Coda`))} ${dim("— CLI for managing .coda.json files")}

${bold("Usage:")}
${formatTable(COMMANDS, cyan)}

${bold("Options:")}
${formatTable(OPTIONS, (s) => s)}
`.trim();

function parseArgs(argv: string[]) {
  const args = argv.slice(2); // skip "bun" and script path
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  let command: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("-")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else if (arg.startsWith("-")) {
      flags[arg.slice(1)] = true;
    } else if (!command) {
      command = arg;
    } else {
      positional.push(arg);
    }
  }

  return { command, positional, flags };
}

async function main() {
  const { command, positional, flags } = parseArgs(process.argv);

  if (!command || flags.help || flags.h) {
    console.log(USAGE);
    process.exit(0);
  }

  if (flags.version || flags.v) {
    const pkg = await Bun.file(new URL("../package.json", import.meta.url).pathname).json();
    console.log(pkg.version);
    process.exit(0);
  }

  switch (command) {
    case "new":
      await newCommand(positional, flags);
      break;
    case "compile":
      await compileCommand(positional, flags);
      break;
    case "info":
      await infoCommand(positional, flags);
      break;
    case "doctor":
      await doctorCommand(positional, flags);
      break;
    case "validate":
      await validateCommand(positional, flags);
      break;
    case "setup":
      await setupCommand(positional, flags);
      break;
    case "clean":
      await cleanCommand(positional, flags);
      break;
    case "pkg":
      await pkgCommand(positional, flags);
      break;
    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(USAGE);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
