# Spectra Examples

This directory contains a sample `.spec.json` file to demonstrate Spectra CLI usage.

## Prerequisites

Install Spectra as a dev dependency:

```bash
bun add -d @linttrap/spectra
```

## Walkthrough

### 1. Validate the example spec

```bash
cd examples
bunx spectra validate my-app.spec.json
```

Expected output:

```
✓ /path/to/examples/my-app.spec.json
```

### 2. Get info about the spec

```bash
bunx spectra info my-app.spec.json
```

This prints a detailed report: name, description, version, directives with step counts, schema type count, data keys, changelog entries, and design decisions.

### 3. Run the doctor

```bash
bunx spectra doctor my-app.spec.json
```

Reports any errors or warnings in the spec structure.

### 4. Compile prompt files

```bash
# First, set up spectra.json config (or ensure it exists)
bunx spectra setup

# Then compile (uses ide/out from spectra.json)
bunx spectra compile my-app.spec.json
```

This creates one `.prompt.md` file per directive in the output directory configured in `spectra.json` (default: `.github/prompts/`):

- `my-app.addEntity.prompt.md`
- `my-app.generateTypes.prompt.md`
- `my-app.seedData.prompt.md`

Each file is a complete VS Code Copilot prompt with context, design decisions, changelog, and step-by-step instructions.

### 5. Create a named spec

```bash
bunx spectra create --name "Test App"
```

Creates `test-app.spec.json` with the name and id pre-filled.

### 6. Create a spec from template

```bash
bunx spectra init test.spec.json
```

Creates a minimal `test.spec.json` template ready for editing.
