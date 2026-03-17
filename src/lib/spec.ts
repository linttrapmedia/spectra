import { resolve } from "path";
import type { ChangeLogEntry, CreateSpecOptions, DesignEntry, Directive, SpecFile } from "./types";

const TEMPLATE_PATH = resolve(import.meta.dir, "../templates/coda.template.json");

export async function readSpec(filePath: string): Promise<SpecFile> {
  const file = Bun.file(filePath);
  const text = await file.text();
  return JSON.parse(text) as SpecFile;
}

export async function writeSpec(filePath: string, spec: SpecFile): Promise<void> {
  await Bun.write(filePath, JSON.stringify(spec, null, 2) + "\n");
}

export async function createSpec(filePath: string, options?: CreateSpecOptions): Promise<SpecFile> {
  const templateFile = Bun.file(TEMPLATE_PATH);
  const template: SpecFile = JSON.parse(await templateFile.text());

  if (options?.name) template.name = options.name;
  if (options?.description) template.description = options.description;
  if (options?.id) template.id = options.id;
  if (options?.ref) template.ref = options.ref;
  if (options?.version) template.version = options.version;

  await writeSpec(filePath, template);
  return template;
}

export async function updateSpecData(filePath: string, data: Record<string, unknown>): Promise<SpecFile> {
  const spec = await readSpec(filePath);
  spec.data = { ...spec.data, ...data };
  await writeSpec(filePath, spec);
  return spec;
}

export async function addChangeLogEntry(filePath: string, entry: ChangeLogEntry): Promise<SpecFile> {
  const spec = await readSpec(filePath);
  spec.meta.changeLog.push(entry);
  await writeSpec(filePath, spec);
  return spec;
}

export async function addDesignEntry(filePath: string, entry: DesignEntry): Promise<SpecFile> {
  const spec = await readSpec(filePath);
  spec.meta.design.push(entry);
  await writeSpec(filePath, spec);
  return spec;
}

export async function addDirective(filePath: string, name: string, directive: Directive): Promise<SpecFile> {
  const spec = await readSpec(filePath);
  spec.meta.directives[name] = directive;
  await writeSpec(filePath, spec);
  return spec;
}

export async function removeDirective(filePath: string, name: string): Promise<SpecFile> {
  const spec = await readSpec(filePath);
  delete spec.meta.directives[name];
  await writeSpec(filePath, spec);
  return spec;
}

export async function getDirective(filePath: string, name: string): Promise<Directive | undefined> {
  const spec = await readSpec(filePath);
  return spec.meta.directives[name];
}

export async function listDirectives(filePath: string): Promise<string[]> {
  const spec = await readSpec(filePath);
  return Object.keys(spec.meta.directives);
}
