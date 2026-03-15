import { mkdir } from "fs/promises";
import { join } from "path";
import { readSpec } from "./spec";
import type { SpecFile } from "./types";

export function compilePromptFile(specFile: SpecFile, directiveName: string, _ide: "vscode" = "vscode"): string {
  const directive = specFile.meta.directives[directiveName];
  if (!directive) {
    throw new Error(`Directive "${directiveName}" not found in spec "${specFile.name}"`);
  }

  const lines: string[] = [];

  // ─── YAML frontmatter ──────────────────────────────────────────────────────
  lines.push("---");
  lines.push(`name: "${specFile.name}"`);
  lines.push(`description: "${directive.description}"`);

  // Collect all promptString / pickString inputs for VS Code args
  const inputs = directive.steps.filter((s) => s.type === "promptString" || s.type === "pickString");
  if (inputs.length > 0) {
    lines.push("mode: agent");
    lines.push("tools:");
    lines.push("  - terminal");
    lines.push("  - file_system");
  }

  lines.push("---");
  lines.push("");

  // ─── Header ────────────────────────────────────────────────────────────────
  lines.push(`# ${specFile.name} — ${directiveName}`);
  lines.push("");
  lines.push(`> ${specFile.description}`);
  lines.push("");
  lines.push(`**Directive:** ${directive.description}`);
  lines.push("");

  // ─── Design context ────────────────────────────────────────────────────────
  if (specFile.meta.design.length > 0) {
    lines.push("## Design Decisions");
    lines.push("");
    for (const d of specFile.meta.design) {
      lines.push(`- **${d.decision}** — ${d.rationale}`);
    }
    lines.push("");
  }

  // ─── Recent changelog ──────────────────────────────────────────────────────
  if (specFile.meta.changeLog.length > 0) {
    lines.push("## Recent Changes");
    lines.push("");
    const recent = specFile.meta.changeLog.slice(-5);
    for (const c of recent) {
      lines.push(`- \`${c.directive}\` — ${c.change} (${c.timestamp})`);
    }
    lines.push("");
  }

  // ─── Steps ─────────────────────────────────────────────────────────────────
  lines.push("## Steps");
  lines.push("");
  let stepNum = 1;
  for (const step of directive.steps) {
    switch (step.type) {
      case "text":
        lines.push(`${stepNum}. ${step.description}`);
        lines.push("");
        break;

      case "promptString":
        lines.push(`${stepNum}. **Input — ${step.description}** (\`{{${step.id}}}\`)`);
        if (step.default) {
          lines.push(`   - Default: \`${step.default}\``);
        }
        lines.push("");
        break;

      case "pickString":
        lines.push(`${stepNum}. **Select — ${step.description}** (\`{{${step.id}}}\`)`);
        lines.push(`   - Options: ${step.options.map((o) => `\`${o}\``).join(", ")}`);
        if (step.default) {
          lines.push(`   - Default: \`${step.default}\``);
        }
        lines.push("");
        break;

      case "snippet":
        lines.push(`${stepNum}. ${step.description}`);
        lines.push("");
        lines.push(`\`\`\`${step.fence}`);
        lines.push(step.snippet);
        lines.push("```");
        lines.push("");
        break;
    }
    stepNum++;
  }

  return lines.join("\n");
}

export async function compilePromptFiles(
  specPath: string,
  outputDir: string,
  ide: "vscode" = "vscode",
): Promise<string[]> {
  const specFile = await readSpec(specPath);
  const specId = specFile.name.toLowerCase().replace(/\s+/g, "-");
  const written: string[] = [];

  await mkdir(outputDir, { recursive: true });

  for (const directiveName of Object.keys(specFile.meta.directives)) {
    const content = compilePromptFile(specFile, directiveName, ide);
    const fileName = `${specId}.${directiveName}.prompt.md`;
    const outPath = join(outputDir, fileName);
    await Bun.write(outPath, content);
    written.push(outPath);
  }

  return written;
}
