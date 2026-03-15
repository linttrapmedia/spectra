// Public API — re-export all library functions and types

export type {
  ChangeLogEntry,
  CreateSpecOptions,
  DesignEntry,
  DiagnosticIssue,
  DiagnosticResult,
  Directive,
  DirectiveStep,
  PickStringStep,
  PrimitiveTypeName,
  PromptStringStep,
  SchemaData,
  SchemaRef,
  SchemaTypes,
  SchemaTypeValue,
  SnippetStep,
  SpecFile,
  SpecInfo,
  SpecMeta,
  SpecSchema,
  TextStep,
  ValidationError,
  ValidationResult,
} from "./lib/types";

export type { SpectraConfig, ValidateResult } from "./lib/config";

export { configPath, defaultConfig, initConfig, readConfig, updateConfigResults, writeConfig } from "./lib/config";

export {
  addChangeLogEntry,
  addDesignEntry,
  addDirective,
  createSpec,
  getDirective,
  listDirectives,
  readSpec,
  removeDirective,
  updateSpecData,
  writeSpec,
} from "./lib/spec";

export { compilePromptFile, compilePromptFiles } from "./lib/prompt";

export { validateSpec } from "./lib/validator";

export { getSpecInfo } from "./lib/info";

export { diagnoseSpec } from "./lib/doctor";
