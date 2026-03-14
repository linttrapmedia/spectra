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
bunx spectra compile my-app.spec.json --out ./prompts
```

This creates one `.prompt.md` file per directive in `./prompts/`:

- `my-app.addEntity.prompt.md`
- `my-app.generateTypes.prompt.md`
- `my-app.seedData.prompt.md`

Each file is a complete VS Code Copilot prompt with context, design decisions, changelog, and step-by-step instructions.

### 5. Scan for spec files

```bash
bunx spectra scan .
```

Output:

```
  /path/to/examples/my-app.spec.json
    name: My App
    description: User and team management data for My App...

1 spec file(s) found
```

### 6. Create a new spec

```bash
bunx spectra init test.spec.json
```

Creates a minimal `test.spec.json` template ready for editing.
