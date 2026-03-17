# Coda Examples

This directory contains a sample `.coda.json` file to demonstrate Coda CLI usage.

## Prerequisites

Install Coda as a dev dependency:

```bash
bun add -d @linttrap/coda
```

## Walkthrough

### 1. Validate the example spec

```bash
cd examples
bunx coda validate my-app.coda.json
```

Expected output:

```
✓ /path/to/examples/my-app.coda.json
```

### 2. Get info about the spec

```bash
bunx coda info my-app.coda.json
```

This prints a detailed report: name, description, version, directives with step counts, schema type count, data keys, changelog entries, and design decisions.

### 3. Run the doctor

```bash
bunx coda doctor my-app.coda.json
```

Reports any errors or warnings in the spec structure.

### 4. Compile prompt files

```bash
# First, set up coda.json config (or ensure it exists)
bunx coda setup

# Then compile (uses ide/out from coda.json)
bunx coda compile my-app.coda.json
```

This creates one `.prompt.md` file per directive in the output directory configured in `coda.json` (default: `.github/prompts/`):

- `my-app.addEntity.prompt.md`
- `my-app.generateTypes.prompt.md`
- `my-app.seedData.prompt.md`

Each file is a complete VS Code Copilot prompt with context, design decisions, changelog, and step-by-step instructions.

### 5. Create a named spec

```bash
bunx coda create --name "Test App"
```

Creates `test-app.coda.json` with the name and id pre-filled.

### 6. Create a spec from template

```bash
bunx coda init test.coda.json
```

Creates a minimal `test.coda.json` template ready for editing.
