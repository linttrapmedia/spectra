import { createCommand } from "./create";

export async function initCommand(positional: string[], flags: Record<string, string | boolean>) {
  console.warn('Warning: "spectra init" is deprecated. Use "spectra create --name <name>" instead.');
  const initFlags = { ...flags };
  if (!initFlags.name) {
    initFlags.name = "My Spec";
  }
  const initPositional = positional.length > 0 ? positional : ["spectra.spec.json"];
  await createCommand(initPositional, initFlags);
}
