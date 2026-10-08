import { textSchema } from "./safety.js";
export type ParsedInput = { name: string; args: string; raw: string };
export function parse(input: string): ParsedInput {
  const raw = textSchema.parse(input).trim();
  if (!raw) throw new Error("Escribe un comando o texto");
  if (!raw.startsWith("/")) return { name: "text", args: raw, raw };
  const m = raw.match(/^\/([a-zA-Z][a-zA-Z0-9-]{0,31})(?:\s+([\s\S]*))?$/);
  if (!m) throw new Error("Comando inválido");
  return { name: m[1].toLowerCase(), args: (m[2] ?? "").trim(), raw };
}
