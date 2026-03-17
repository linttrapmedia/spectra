# <♬> Coda

Coda is a library and convention for defining, maintaining, and using structured data in a way that's optimized for large language models (LLMs). At its core, Coda uses standardized `.coda.json` files that contain both data and metadata—tracking design decisions, changes, and generation instructions.

## Requirements

Coda requires [Bun](https://bun.sh) — it runs TypeScript directly with no build step.

## Installation

### Quick Start (no install)

```bash
bunx @linttrap/coda --help
```

### Add to a project

```bash
bun add -d @linttrap/coda
bunx coda --help
```

### Contributing

```bash
git clone https://github.com/linttrapmedia/coda.git
cd coda
bun install
bun link
```

## Quick Start

```bash
# Create a named spec file
bunx coda new --name "spec-name"

# Validate it
bunx coda validate [file|dir]

# Compile directives into VS Code Copilot .prompt.md files (uses ide/out from coda.json)
bunx coda compile [file|dir]

# Get detailed info about a spec
bunx coda info [file|dir]

# Diagnose issues
bunx coda doctor [file|dir]

# Scaffold coda.json config and agent file
bunx coda setup
```

## CLI Reference

```
coda new --name <name> [file]   Create a named .coda.json file
coda compile <file|dir>         Compile .prompt.md files from spec directives
coda info [file|dir]            Report detailed info about spec file(s)
coda doctor [file|dir]          Diagnose and report issues in spec file(s)
coda validate <file|dir>        Validate spec(s) against their schemas
coda setup                      Scaffold coda.json config and agent file
  --ide <ide>                      IDE target (default: vscode)
  --out <dir>                      Output directory (default: .github/prompts/)
```

## Library API

Use Coda programmatically in your own scripts:

```typescript
import {
  readSpec,
  writeSpec,
  createSpec,
  updateSpecData,
  addChangeLogEntry,
  addDesignEntry,
  addDirective,
  removeDirective,
  getDirective,
  listDirectives,
  compilePromptFile,
  compilePromptFiles,
  validateSpec,
  getSpecInfo,
  diagnoseSpec,
} from "@linttrap/coda";

// Read a spec
const spec = await readSpec("my-app.coda.json");

// Validate it
const result = validateSpec(spec);
if (!result.valid) {
  console.error(result.errors);
}

// Compile all directives to .prompt.md files
const files = await compilePromptFiles("my-app.coda.json", ".github/prompts");

// Get spec info
const info = await getSpecInfo("my-app.coda.json");

// Run diagnostics
const diagnosis = await diagnoseSpec("my-app.coda.json");
```

---

The Coda command-line utility scans your codebase for `.coda.json` files, reads their metadata, and generates LLM prompts that include **directives**: scripted instructions for automated tasks. These directives fall into two categories:

1. **Spec-focused tasks:** Scripts that modify the spec itself, using Coda's built-in utilities to ensure the file remains valid.
2. **User-defined tasks:** Scripts that operate on the data to generate other code, gather information about the app, or perform custom workflows, optionally using Coda utilities.

Coda lets you define structured specs that LLMs can interpret to run user-defined scripts and CLI commands—modifying specs, generating code, and enforcing coding standards—so your workflows remain deterministic, maintainable, and consistent across your projects.

## Schema File Structure

Here's a breakdown of the structure of a `.coda.json` file, which combines metadata for LLM context and directives with the actual data used by your application:

```bash
.coda.json
├─ ref, id, name, description, version   # Metadata for the spec itself
├─ meta
│  ├─ changeLog       # Tracks changes over time
│  ├─ design          # Design decisions and rationale
│  ├─ directives      # LLM directives and steps
│  ├─ schema          # Schema for the data object
└─ data               # Actual user/application data
```

## Full Schema File Example

Here's a complete example of a `.coda.json` file that includes all the metadata and directives for LLM-powered automation:

```json
{
  "ref": "git",
  // Unique identifier for the spec file
  "id": "spec-id",
  // Human-readable name for the spec file
  "name": "Spec Name",
  // Description of the spec file's purpose and contents
  "description": "Description of what the spec file is for",
  // Version of the spec file format, useful for compatibility and migrations
  "version": "1.0.0",

  // Metadata section used by the Coda library to track changes, design decisions, and directives for LLM prompt generation
  "meta": {
    // Tracks all changes made to the schema file for auditing and LLM context
    "changeLog": [
      {
        // what was changed
        "change": "Added a thing for this reason",
        // what directive produced this change, e.g., 'addEntity'
        "directive": "addedSomething",
        // when the change was made
        "timestamp": "2026-03-12T00:00:00Z",
        // who made the change
        "authors": ["Jane Doe"],
        // links to relevant documentation or discussions
        "references": ["https://example.com/commit/123"],
        // tags for categorizing the change
        "tags": ["addition", "entity"]
      }
    ],

    // Captures design decisions, rationale, and references for maintaining schema
    "design": [
      {
        // what design decision was made
        "decision": "Use UUIDs for all entity identities",
        // why the decision was made
        "rationale": "Allows distributed ID generation and simplifies merges",
        // when the decision was made
        "date": "2026-03-12T00:00:00Z",
        // links to relevant documentation or discussions
        "references": ["https://example.com/design-doc"],
        // tags for categorizing the decision
        "tags": ["ID strategy", "scalability"],
        // who made the decision
        "authors": ["Jane Doe"]
      }
    ],

    // Config for generating llm prompts to run scripts
    "directives": {
      // Example directive for adding a new entity to the schema, which can be used to generate prompts for LLMs to execute the necessary steps
      "addEntity": {
        // what the directive does
        "description": "Procedure for adding a new entity",
        // steps that an LLM would follow to execute this directive, which can include a mix of text instructions, user inputs, and script executions
        "steps": [
          {
            // text instructions for the LLM to understand the context and what needs to be done
            "type": "text",
            // description of the step for the LLM to understand what it needs to do
            "description": "Define the entity name and its fields in the schema file according to the established structure."
          },
          {
            // user input step for the LLM to gather necessary information from the user to execute the directive
            "type": "promptString",
            "id": "entityName",
            "description": "Name your entity.",
            // default value for the input, which can be used if the user doesn't provide one
            "default": "my-new-entity",
            // whether this input should be hidden from the user interface, which can be useful for sensitive information or to simplify the prompt
            "hidden": false
          },
          {
            // another user input step for selecting from predefined options, which can help guide the user and ensure valid input
            "type": "pickString",
            "id": "ageGroup",
            "description": "Select the age group for the entity.",
            // predefined options for the user to choose from, which can help ensure that the input is valid and consistent with the schema
            "options": ["child", "teen", "adult", "senior"],
            "default": "adult"
          },
          {
            "type": "text",
            "description": "Run the following command to generate the entity based on your inputs. This will update the schema file and add the new entity with the specified fields."
          },
          {
            // this is a code snippet step that instructs the LLM to execute a specific command, which can be used to automate the process of updating the schema file based on the user's inputs
            "type": "snippet",
            // the language of the code snippet, which can help the LLM understand how to execute it and what context it's in
            "fence": "bash",
            // the actual command to be executed, which can include placeholders for the user inputs gathered in previous steps
            "snippet": "bun scripts/generateEntity.ts --name ${input:entityName} --ageGroup ${input:ageGroup}",
            "description": "Generates a new entity based on provided name and fields"
          }
        ]
      }
    },

    // schema of the data object below
    "schema": {
      // types used in the data object for validation and LLM context
      "types": {
        // Enum type: array of allowed string values
        "AgeGroup": ["child", "teen", "adult", "senior"],

        // Nested entity: defined inline, usable by $ref from other types
        "Address": {
          "street": "string",
          "city": "string",
          "state": "string",
          "zip": "string"
        },

        // Entity with $ref for cross-linking to other types
        "User": {
          "id": "string",
          "name": "string",
          // References the AgeGroup enum type
          "ageGroup": { "$ref": "AgeGroup" },
          // Optional field (trailing ?)
          "email?": "string",
          // Nested entity reference
          "address": { "$ref": "Address" },
          // Self-referencing array: links to other User IDs
          "friends?": { "$ref": "User[]" }
        },

        // Entity that references another entity for cross-linking
        "Team": {
          "id": "string",
          "name": "string",
          // Array reference to User entities
          "members": { "$ref": "User[]" },
          // Single reference to a User entity
          "lead": { "$ref": "User" }
        }
      },
      "data": {
        "users": { "$ref": "User[]" },
        "teams": { "$ref": "Team[]" }
      }
    }
  },

  "data": {
    "users": [
      {
        "id": "u1",
        "name": "Ronald",
        "ageGroup": "adult",
        "email": "ronald@example.com",
        "address": {
          "street": "123 Main St",
          "city": "Chicago",
          "state": "IL",
          "zip": "60601"
        },
        "friends": ["u2"]
      },
      {
        "id": "u2",
        "name": "Hamburgler",
        "ageGroup": "child",
        "address": {
          "street": "456 Oak Ave",
          "city": "Chicago",
          "state": "IL",
          "zip": "60602"
        },
        "friends": ["u1"]
      }
    ],
    "teams": [
      {
        "id": "t1",
        "name": "Alpha Team",
        "members": ["u1", "u2"],
        "lead": "u1"
      }
    ]
  }
}
```

## Type System

The `meta.schema.types` section supports a rich type system for modeling complex data:

### Primitives

Field values can be any primitive type string: `"string"`, `"number"`, `"boolean"`.

### Enums

An array of allowed string values defines an enum type:

```json
"AgeGroup": ["child", "teen", "adult", "senior"]
```

### Entity Types

An object with named fields defines an entity. Each field maps to a primitive type or a `$ref`:

```json
"Address": {
  "street": "string",
  "city": "string"
}
```

### References (`$ref`)

Use `{ "$ref": "TypeName" }` to reference another defined type. This enables cross-linking between entities:

```json
"lead": { "$ref": "User" }
```

For arrays of references, append `[]`:

```json
"members": { "$ref": "User[]" }
```

When the referenced type has an `id` field, values in `data` can use the ID string instead of an inline object. This avoids duplication and enables cross-linking:

```json
"members": ["u1", "u2"],
"lead": "u1"
```

### Optional Fields

Append `?` to a field name to mark it as optional:

```json
"email?": "string",
"friends?": { "$ref": "User[]" }
```

### Schema Data Shape

The `meta.schema.data` section mirrors the shape of the top-level `data` object, using `$ref` to declare what each key holds:

```json
"data": {
  "users": { "$ref": "User[]" },
  "teams": { "$ref": "Team[]" }
}
```
