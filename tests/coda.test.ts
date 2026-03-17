import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join, resolve } from "path";
import type { SpecFile } from "../src/index";
import type { CodaConfig } from "../src/lib/config";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CLI = resolve(import.meta.dir, "../src/cli.ts");

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "coda-cli-test-"));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

function specPath(name = "test.coda.json"): string {
  return join(tmpDir, name);
}

function run(args: string[], cwd?: string): { stdout: string; stderr: string; exitCode: number } {
  const result = Bun.spawnSync(["bun", CLI, ...args], {
    cwd: cwd ?? tmpDir,
    env: { ...process.env, NO_COLOR: "1" },
  });
  return {
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
    exitCode: result.exitCode,
  };
}

async function readJson(path: string): Promise<any> {
  return JSON.parse(await Bun.file(path).text());
}

function writeJson(path: string, data: any): Promise<number> {
  return Bun.write(path, JSON.stringify(data, null, 2) + "\n");
}

function makeValidSpec(overrides?: Partial<SpecFile>): SpecFile {
  return {
    ref: "git",
    id: "test-id",
    name: "Test Spec",
    description: "A test spec",
    version: "1.0.0",
    meta: {
      changeLog: [],
      design: [],
      directives: {},
      schema: { types: {}, data: {} },
    },
    data: {},
    ...overrides,
  };
}

function makeConfig(overrides?: Partial<CodaConfig>): CodaConfig {
  return {
    ide: "vscode",
    out: ".github/prompts",
    results: { info: [], doctor: [], validate: [] },
    ...overrides,
  };
}

// ─── coda new ─────────────────────────────────────────────────────────────

describe("coda new", () => {
  test("creates a named spec file", async () => {
    const result = run(["new", "--name", "My App"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Created my-app.coda.json");

    const spec = await readJson(join(tmpDir, "my-app.coda.json"));
    expect(spec.name).toBe("My App");
    expect(spec.id).toBe("my-app");
  });

  test("creates a spec with a custom output filename", async () => {
    const result = run(["new", "--name", "Widget", "widget.coda.json"]);
    expect(result.exitCode).toBe(0);

    const spec = await readJson(join(tmpDir, "widget.coda.json"));
    expect(spec.name).toBe("Widget");
  });

  test("fails without --name flag", async () => {
    const result = run(["new"]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("--name");
  });

  test("refuses to overwrite an existing file", async () => {
    await writeJson(join(tmpDir, "my-app.coda.json"), {});
    const result = run(["new", "--name", "My App"]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("already exists");
  });
});

// ─── coda validate ────────────────────────────────────────────────────────

describe("coda validate", () => {
  test("passes for a valid spec file", async () => {
    const p = specPath();
    await writeJson(p, makeValidSpec());

    const result = run(["validate", p]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("✓");
  });

  test("fails for a spec with missing fields", async () => {
    const p = specPath();
    await writeJson(p, {
      ref: "git",
      meta: { schema: { types: {}, data: {} }, directives: {}, changeLog: [], design: [] },
      data: {},
    });

    const result = run(["validate", p]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toContain("✗");
  });

  test("validates all specs in a directory", async () => {
    await writeJson(join(tmpDir, "a.coda.json"), makeValidSpec({ id: "a", name: "A" }));
    await writeJson(join(tmpDir, "b.coda.json"), makeValidSpec({ id: "b", name: "B" }));

    const result = run(["validate", tmpDir]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("✓");
  });

  test("reports invalid spec with schema errors", async () => {
    const spec = makeValidSpec();
    spec.meta.schema.types = { User: { name: "varchar" as any } };
    const p = specPath();
    await writeJson(p, spec);

    const result = run(["validate", p]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toContain("✗");
  });

  test("defaults to current directory with no arguments", async () => {
    await writeJson(join(tmpDir, "x.coda.json"), makeValidSpec({ id: "x", name: "X" }));
    const result = run(["validate"]);
    expect(result.exitCode).toBe(0);
  });

  test("validates the example spec", async () => {
    const examplePath = resolve(import.meta.dir, "../pkg/example/my-app.coda.json");
    const result = run(["validate", examplePath]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("✓");
  });
});

// ─── coda doctor ──────────────────────────────────────────────────────────

describe("coda doctor", () => {
  test("reports ok for a well-formed spec", async () => {
    const spec = makeValidSpec();
    spec.meta.directives = {
      run: { description: "Run", steps: [{ type: "text", description: "Do it" }] },
    };
    spec.meta.schema.types = { X: ["a"] };
    spec.meta.schema.data = { items: { $ref: "X[]" } };
    spec.meta.changeLog = [
      { change: "Init", directive: "init", timestamp: "2026-01-01", authors: [], references: [], tags: [] },
    ];
    spec.meta.design = [
      { decision: "Use X", rationale: "Reason", date: "2026-01-01", references: [], tags: [], authors: [] },
    ];
    spec.data = { items: [] };
    const p = specPath();
    await writeJson(p, spec);

    const result = run(["doctor", p]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("✓");
    expect(result.stdout).toContain("0 error(s)");
  });

  test("reports errors for invalid JSON", async () => {
    const p = specPath();
    await Bun.write(p, "{ bad json }");

    const result = run(["doctor", p]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toContain("ERROR");
  });

  test("reports errors for missing required fields", async () => {
    const p = specPath();
    await writeJson(p, { meta: { schema: {}, directives: {}, changeLog: [], design: [] }, data: {} });

    const result = run(["doctor", p]);
    expect(result.exitCode).not.toBe(0);
  });

  test("warns on empty data and no directives", async () => {
    const p = specPath();
    await writeJson(p, makeValidSpec());

    const result = run(["doctor", p]);
    expect(result.stdout).toContain("WARNING");
  });

  test("reports error for invalid primitive", async () => {
    const spec = makeValidSpec();
    spec.meta.schema.types = { Bad: { field: "varchar" as any } };
    const p = specPath();
    await writeJson(p, spec);

    const result = run(["doctor", p]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toContain("varchar");
  });

  test("reports error for $ref to undefined type", async () => {
    const spec = makeValidSpec();
    spec.meta.schema.types = { User: { role: { $ref: "Role" } } };
    const p = specPath();
    await writeJson(p, spec);

    const result = run(["doctor", p]);
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toContain("undefined type");
  });

  test("diagnoses the example spec without errors", async () => {
    const examplePath = resolve(import.meta.dir, "../pkg/example/my-app.coda.json");
    const result = run(["doctor", examplePath]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("0 error(s)");
  });

  test("scans a directory for specs to diagnose", async () => {
    await writeJson(join(tmpDir, "a.coda.json"), makeValidSpec({ id: "a", name: "A" }));
    await writeJson(join(tmpDir, "b.coda.json"), makeValidSpec({ id: "b", name: "B" }));

    const result = run(["doctor", tmpDir]);
    expect(result.stdout).toContain("2 spec(s) checked");
  });
});

// ─── coda info ────────────────────────────────────────────────────────────

describe("coda info", () => {
  test("shows spec info for a file", async () => {
    const spec = makeValidSpec();
    spec.meta.schema.types = { Role: ["admin", "user"] };
    spec.meta.directives = {
      setup: { description: "Setup directive", steps: [{ type: "text", description: "Step 1" }] },
    };
    spec.meta.changeLog = [
      { change: "Init", directive: "init", timestamp: "2026-01-01", authors: [], references: [], tags: [] },
    ];
    spec.meta.design = [
      { decision: "Use UUIDs", rationale: "Reason", date: "2026-01-01", references: [], tags: [], authors: [] },
    ];
    spec.data = { items: [] };
    const p = specPath();
    await writeJson(p, spec);

    const result = run(["info", p]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Test Spec");
    expect(result.stdout).toContain("A test spec");
    expect(result.stdout).toContain("1.0.0");
    expect(result.stdout).toContain("setup");
    expect(result.stdout).toContain("Schema types:");
  });

  test("handles directory with multiple specs", async () => {
    await writeJson(join(tmpDir, "a.coda.json"), makeValidSpec({ id: "a", name: "App A" }));
    await writeJson(join(tmpDir, "b.coda.json"), makeValidSpec({ id: "b", name: "App B" }));

    const result = run(["info", tmpDir]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("App A");
    expect(result.stdout).toContain("App B");
  });
});

// ─── coda compile ─────────────────────────────────────────────────────────

describe("coda compile", () => {
  test("compiles prompt files from a spec", async () => {
    const spec = makeValidSpec({ id: "app", name: "App" });
    spec.meta.directives = {
      setup: { description: "Setup", steps: [{ type: "text", description: "Go" }] },
      build: { description: "Build", steps: [{ type: "text", description: "Build it" }] },
    };
    const p = specPath("app.coda.json");
    await writeJson(p, spec);

    const outDir = join(tmpDir, "prompts");
    await writeJson(join(tmpDir, "coda.json"), makeConfig({ out: outDir }));
    const result = run(["compile", p]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("2 prompt file(s) compiled");

    // Verify actual files exist on disk
    const files = await readdir(outDir);
    expect(files.sort()).toEqual(["app.build.prompt.md", "app.setup.prompt.md"]);

    // Verify file contents
    const setupContent = await Bun.file(join(outDir, "app.setup.prompt.md")).text();
    expect(setupContent).toContain("---");
    expect(setupContent).toContain('description: "Setup"');
    expect(setupContent).toContain("# App — setup");
    expect(setupContent).toContain("1. Go");

    const buildContent = await Bun.file(join(outDir, "app.build.prompt.md")).text();
    expect(buildContent).toContain("# App — build");
    expect(buildContent).toContain("1. Build it");
  });

  test("generates YAML frontmatter with mode/tools for interactive directives", async () => {
    const spec = makeValidSpec({ id: "tool-app", name: "Tool App" });
    spec.meta.directives = {
      setup: {
        description: "Setup",
        steps: [{ type: "promptString", id: "name", description: "Your name" }],
      },
    };
    const p = specPath("tool-app.coda.json");
    await writeJson(p, spec);

    const outDir = join(tmpDir, "prompts");
    await writeJson(join(tmpDir, "coda.json"), makeConfig({ out: outDir }));
    run(["compile", p]);

    const content = await Bun.file(join(outDir, "tool-app.setup.prompt.md")).text();
    expect(content).not.toContain("mode: agent");
    expect(content).not.toContain("tools:");
  });

  test("renders all step types correctly in compiled output", async () => {
    const spec = makeValidSpec({ id: "allsteps", name: "AllSteps" });
    spec.meta.directives = {
      all: {
        description: "All steps",
        steps: [
          { type: "text", description: "Plain text step" },
          { type: "promptString", id: "val", description: "Enter value", default: "defaultVal" },
          { type: "pickString", id: "choice", description: "Pick one", options: ["yes", "no"], default: "yes" },
          { type: "snippet", fence: "typescript", snippet: 'console.log("hi")', description: "Code snippet" },
        ],
      },
    };
    const p = specPath("allsteps.coda.json");
    await writeJson(p, spec);

    const outDir = join(tmpDir, "prompts");
    await writeJson(join(tmpDir, "coda.json"), makeConfig({ out: outDir }));
    run(["compile", p]);

    const content = await Bun.file(join(outDir, "allsteps.all.prompt.md")).text();
    expect(content).toContain("1. Plain text step");
    expect(content).toContain("**Input — Enter value** (`{{val}}`)");
    expect(content).toContain("Default: `defaultVal`");
    expect(content).toContain("**Select — Pick one** (`{{choice}}`)");
    expect(content).toContain("Options: `yes`, `no`");
    expect(content).toContain("Default: `yes`");
    expect(content).toContain("```typescript");
    expect(content).toContain('console.log("hi")');
  });

  test("includes design decisions in compiled output", async () => {
    const spec = makeValidSpec({ id: "design", name: "Design" });
    spec.meta.design = [
      { decision: "Use REST", rationale: "Simple", date: "2026-01-01", references: [], tags: [], authors: [] },
    ];
    spec.meta.directives = {
      run: { description: "Run", steps: [{ type: "text", description: "Go" }] },
    };
    const p = specPath("design.coda.json");
    await writeJson(p, spec);

    const outDir = join(tmpDir, "prompts");
    await writeJson(join(tmpDir, "coda.json"), makeConfig({ out: outDir }));
    run(["compile", p]);

    const content = await Bun.file(join(outDir, "design.run.prompt.md")).text();
    expect(content).toContain("## Design Decisions");
    expect(content).toContain("**Use REST** — Simple");
  });

  test("includes recent changelog in compiled output", async () => {
    const spec = makeValidSpec({ id: "changelog", name: "ChangeLog" });
    spec.meta.changeLog = [
      {
        change: "Added feature X",
        directive: "addFeature",
        timestamp: "2026-03-14",
        authors: [],
        references: [],
        tags: [],
      },
    ];
    spec.meta.directives = {
      run: { description: "Run", steps: [{ type: "text", description: "Go" }] },
    };
    const p = specPath("changelog.coda.json");
    await writeJson(p, spec);

    const outDir = join(tmpDir, "prompts");
    await writeJson(join(tmpDir, "coda.json"), makeConfig({ out: outDir }));
    run(["compile", p]);

    const content = await Bun.file(join(outDir, "changelog.run.prompt.md")).text();
    expect(content).toContain("## Recent Changes");
    expect(content).toContain("`addFeature` — Added feature X");
  });

  test("compiles all specs in a directory", async () => {
    await writeJson(join(tmpDir, "a.coda.json"), {
      ...makeValidSpec({ id: "a", name: "A" }),
      meta: {
        changeLog: [],
        design: [],
        directives: { run: { description: "Run A", steps: [{ type: "text", description: "A" }] } },
        schema: { types: {}, data: {} },
      },
    });
    await writeJson(join(tmpDir, "b.coda.json"), {
      ...makeValidSpec({ id: "b", name: "B" }),
      meta: {
        changeLog: [],
        design: [],
        directives: { run: { description: "Run B", steps: [{ type: "text", description: "B" }] } },
        schema: { types: {}, data: {} },
      },
    });

    const outDir = join(tmpDir, "prompts");
    await writeJson(join(tmpDir, "coda.json"), makeConfig({ out: outDir }));
    const result = run(["compile", tmpDir]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("2 prompt file(s) compiled");

    const files = await readdir(outDir);
    expect(files).toHaveLength(2);
    expect(files.some((f) => f.includes("a.run.prompt.md"))).toBe(true);
    expect(files.some((f) => f.includes("b.run.prompt.md"))).toBe(true);
  });

  test("creates output directory if it doesn't exist", async () => {
    const spec = makeValidSpec({ name: "Nested" });
    spec.meta.directives = {
      init: { description: "Init", steps: [{ type: "text", description: "Start" }] },
    };
    const p = specPath("nested.coda.json");
    await writeJson(p, spec);

    const outDir = join(tmpDir, "deep", "nested", "output");
    await writeJson(join(tmpDir, "coda.json"), makeConfig({ out: outDir }));
    const result = run(["compile", p]);
    expect(result.exitCode).toBe(0);

    const files = await readdir(outDir);
    expect(files).toHaveLength(1);
  });

  test("defaults to current directory with no arguments", async () => {
    await writeJson(join(tmpDir, "x.coda.json"), makeValidSpec({ id: "x", name: "X" }));
    const result = run(["compile"]);
    expect(result.exitCode).toBe(0);
  });

  test("compiles the example spec", async () => {
    const examplePath = resolve(import.meta.dir, "../pkg/example/my-app.coda.json");
    const outDir = join(tmpDir, "compiled");
    await writeJson(join(tmpDir, "coda.json"), makeConfig({ out: outDir }));
    const result = run(["compile", examplePath]);
    expect(result.exitCode).toBe(0);

    const files = await readdir(outDir);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const content = await Bun.file(join(outDir, file)).text();
      expect(content).toContain("---");
      expect(content).toContain("# My App —");
    }
  });
});

// ─── coda setup ───────────────────────────────────────────────────────────

describe("coda setup", () => {
  test("scaffolds agent file and config", async () => {
    const result = run(["setup"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Created");

    const agentPath = join(tmpDir, ".github", "agents", "coda.agent.md");
    const content = await Bun.file(agentPath).text();
    expect(content.length).toBeGreaterThan(0);

    const config = await readJson(join(tmpDir, "coda.json"));
    expect(config.ide).toBe("vscode");
    expect(config.out).toBe(".github/prompts");
  });

  test("does not overwrite existing agent file or config", async () => {
    run(["setup"]);
    const result = run(["setup"]);
    expect(result.stdout + result.stderr).toContain("Already exists");
    expect(result.stdout + result.stderr).toContain("Config already exists");
  });
});

// ─── coda --help / --version ──────────────────────────────────────────────

describe("coda help and version", () => {
  test("--help shows usage", () => {
    const result = run(["--help"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("coda");
    expect(result.stdout).toContain("compile");
    expect(result.stdout).toContain("validate");
  });

  test("-v shows version", () => {
    // -v needs a dummy command to avoid triggering the no-command help check
    const result = run(["version", "-v"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

// ─── Integration: end-to-end CLI workflow ────────────────────────────────────

describe("end-to-end CLI workflow", () => {
  test("new → validate → doctor → info → compile", async () => {
    // 1. Create a new spec via CLI
    let result = run(["new", "--name", "Workflow App"]);
    expect(result.exitCode).toBe(0);

    const p = join(tmpDir, "workflow-app.coda.json");
    const spec = await readJson(p);

    // 2. Manually enrich the spec with schema, data, directives, changelog, design
    spec.meta.schema.types = {
      Status: ["active", "archived"],
      Item: { id: "string", title: "string", status: { $ref: "Status" } },
    };
    spec.meta.schema.data = { items: { $ref: "Item[]" } };
    spec.data = { items: [{ id: "i1", title: "Task One", status: "active" }] };
    spec.meta.directives.addItem = {
      description: "Add a new item",
      steps: [
        { type: "promptString", id: "title", description: "Item title" },
        { type: "pickString", id: "status", description: "Status", options: ["active", "archived"] },
        { type: "text", description: "Create the item object and append to data.items" },
      ],
    };
    spec.meta.changeLog.push({
      change: "Added addItem directive",
      directive: "addItem",
      timestamp: "2026-03-14T00:00:00Z",
      authors: ["Test"],
      references: [],
      tags: ["directive"],
    });
    spec.meta.design.push({
      decision: "Use string IDs",
      rationale: "Simplicity",
      date: "2026-03-14",
      references: [],
      tags: [],
      authors: ["Test"],
    });
    await writeJson(p, spec);

    // 3. Validate
    result = run(["validate", p]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("✓");

    // 4. Doctor
    result = run(["doctor", p]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("0 error(s)");

    // 5. Info
    result = run(["info", p]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Workflow App");
    expect(result.stdout).toContain("addItem");

    // 6. Compile
    const outDir = join(tmpDir, "prompts");
    await writeJson(join(tmpDir, "coda.json"), makeConfig({ out: outDir }));
    result = run(["compile", p]);
    expect(result.exitCode).toBe(0);

    const files = await readdir(outDir);
    expect(files.length).toBeGreaterThan(0);
    expect(files.some((f) => f.includes("addItem"))).toBe(true);

    // Verify compiled prompt content
    const addItemFile = files.find((f) => f.includes("addItem"))!;
    const promptContent = await Bun.file(join(outDir, addItemFile)).text();
    expect(promptContent).toContain("# Workflow App — addItem");
    expect(promptContent).not.toContain("mode: agent");
    expect(promptContent).toContain("{{title}}");
    expect(promptContent).toContain("{{status}}");
    expect(promptContent).toContain("## Design Decisions");
    expect(promptContent).toContain("## Recent Changes");
  });
});
