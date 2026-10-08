import { z } from "zod";
import type { Context, Package, Snapshot, VirtualFile } from "./model.js";
export const LIMITS = {
  fileBytes: 1048576,
  files: 200,
  projectBytes: 16777216,
  blocks: 1000,
  tools: 64,
  params: 32,
  history: 256,
  snapshots: 20,
  historyBytes: 8388608,
  contextBytes: 41943040,
} as const;
export const bytes = (s: string) => new TextEncoder().encode(s).byteLength;
const dangerous = new Set(["__proto__", "prototype", "constructor"]);
const reserved = new Set(
  "abstract as assert async await base break case catch class const continue covariant debugger default deferred delete do dynamic else enum export extends external factory false final finally for function get hide if implements import in interface is late let library mixin native new null of on operator part rethrow return set show static super switch sync this throw true try typedef typeof var void when while with yield args arguments eval module exports require process global globalThis Object Array String Number Boolean Map".split(
    " ",
  ),
);
export function rejectDangerous(value: unknown, depth = 0): void {
  if (depth > 20) throw new Error("Estructura demasiado profunda");
  if (!value || typeof value !== "object") return;
  if (
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  )
    throw new Error("Objeto no permitido");
  for (const key of Object.keys(value)) {
    if (dangerous.has(key)) throw new Error("Clave reservada");
    rejectDangerous((value as Record<string, unknown>)[key], depth + 1);
  }
}
export function normalizePath(path: string): string {
  if (
    typeof path !== "string" ||
    path.length > 240 ||
    !path ||
    /[\x00-\x20\x7f\\:]/.test(path) ||
    path.startsWith("/") ||
    path.includes("//")
  )
    throw new Error("Ruta virtual inválida");
  const parts = path.split("/");
  if (
    parts.length > 8 ||
    parts.some(
      (p) =>
        p === "." ||
        p === ".." ||
        dangerous.has(p) ||
        !/^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/.test(p),
    )
  )
    throw new Error("Ruta virtual inválida");
  return parts.join("/");
}
export const pathSchema = z
  .string()
  .max(240)
  .refine((p) => {
    try {
      normalizePath(p);
      return true;
    } catch {
      return false;
    }
  }, "Ruta virtual inválida");
export const identifier = z
  .string()
  .regex(/^[a-z][a-z0-9_]{0,63}$/, "Usa snake_case")
  .refine(
    (s) => !dangerous.has(s) && !reserved.has(s),
    "Identificador reservado",
  );
export const packageName = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{0,63}$/, "Usa minúsculas, números y guiones")
  .refine((s) => !dangerous.has(s), "Nombre reservado");
export const textSchema = z
  .string()
  .max(LIMITS.fileBytes)
  .refine((s) => bytes(s) <= LIMITS.fileBytes, "Máximo 1 MiB de texto")
  .refine((s) => !s.includes("\0"), "Texto inválido");
export const descriptionSchema = z
  .string()
  .max(1024)
  .refine(
    (s) => !/[<>\x00-\x08\x0b\x0c\x0e-\x1f]/.test(s),
    "Descripción inválida",
  );
export const blockSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("heading"),
      level: z.union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5),
        z.literal(6),
      ]),
      text: textSchema,
    })
    .strict(),
  ...(["text", "quote", "step", "rule"] as const).map((type) =>
    z.object({ type: z.literal(type), text: textSchema }).strict(),
  ),
  z
    .object({
      type: z.literal("list"),
      ordered: z.boolean(),
      items: z.array(textSchema).max(1000),
    })
    .strict(),
  z
    .object({
      type: z.literal("code"),
      lang: z.string().regex(/^[A-Za-z0-9_+-]{0,32}$/),
      content: textSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("example"),
      input: textSchema,
      output: textSchema,
    })
    .strict(),
  z.object({ type: z.literal("divider") }).strict(),
]);
export const toolSchema = z
  .object({
    name: identifier,
    description: descriptionSchema,
    params: z
      .array(
        z
          .object({
            name: identifier,
            type: z.enum(["string", "number", "boolean", "object"]),
            required: z.boolean(),
          })
          .strict(),
      )
      .max(LIMITS.params),
    body: z
      .object({ coffee: textSchema.optional(), dart: textSchema.optional() })
      .strict(),
  })
  .strict();
const base = {
  name: packageName,
  description: descriptionSchema,
  version: z.string().regex(/^\d{1,6}\.\d{1,6}\.\d{1,6}$/),
  instructions: z.array(blockSchema).max(LIMITS.blocks),
};
export const packageSchema = z.discriminatedUnion("kind", [
  z
    .object({
      ...base,
      kind: z.literal("skill"),
      triggers: z.array(z.string().min(1).max(1024)).max(128),
      tools: z.array(toolSchema).max(LIMITS.tools),
      references: z
        .array(z.object({ path: pathSchema, content: textSchema }).strict())
        .max(100),
    })
    .strict(),
  z
    .object({
      ...base,
      kind: z.literal("role"),
      title: z.string().max(256),
      model: z
        .string()
        .regex(/^[a-zA-Z0-9._:/-]{1,128}$/)
        .optional(),
      tools: z.array(identifier).max(128),
      skills: z.array(packageName).max(128),
      variables: z
        .record(z.string().max(4096))
        .refine((v) => Object.keys(v).length <= 128),
    })
    .strict(),
]);
export const fileSchema = z
  .object({
    path: pathSchema,
    ext: z.enum(["md", "yaml", "coffee", "dart"]),
    content: textSchema,
  })
  .strict();
export const snapshotSchema = z
  .object({
    pkg: packageSchema.nullable(),
    files: z.array(fileSchema).max(LIMITS.files),
    folders: z.array(pathSchema).max(200),
    activeFile: pathSchema.nullable(),
    activeTool: identifier.nullable(),
    dirtyFiles: z.array(pathSchema).max(200).default([]),
  })
  .strict();
export function assertPackage(value: unknown): Package {
  rejectDangerous(value);
  const pkg = packageSchema.parse(value) as Package;
  if (bytes(JSON.stringify(pkg)) > LIMITS.projectBytes)
    throw new Error("Paquete demasiado grande");
  return pkg;
}
export function assertSnapshot(value: unknown): Snapshot {
  rejectDangerous(value);
  const s = snapshotSchema.parse(value) as Snapshot;
  if (
    new Set(s.files.map((f) => f.path)).size !== s.files.length ||
    new Set(s.folders).size !== s.folders.length
  )
    throw new Error("Ruta duplicada");
  if (
    s.files.reduce((sum, f) => sum + bytes(f.content), 0) +
      bytes(JSON.stringify(s.pkg)) >
    LIMITS.projectBytes
  )
    throw new Error("Máximo 16 MiB por proyecto");
  if (s.activeFile && !s.files.some((f) => f.path === s.activeFile))
    throw new Error("Archivo activo no disponible");
  if (
    s.activeTool &&
    (s.pkg?.kind !== "skill" ||
      !s.pkg.tools.some((t) => t.name === s.activeTool))
  )
    throw new Error("Herramienta activa no disponible");
  for (const f of s.files) {
    if (!f.path.endsWith("." + f.ext))
      throw new Error("Extensión incompatible");
    if (
      s.folders.some((p) => p === f.path || p.startsWith(f.path + "/")) ||
      s.files.some((other) => other.path.startsWith(f.path + "/"))
    )
      throw new Error("Archivo y carpeta en conflicto");
  }
  return s;
}
export function assertContext(value: unknown): Context {
  rejectDangerous(value);
  const v = z
    .object({
      ...snapshotSchema.shape,
      pendingConfirm: z
        .object({
          command: z.enum(["delete", "clear", "publish", "unpublish", "build"]),
          args: z.string().max(1048576),
          snapshot: snapshotSchema,
        })
        .strict()
        .nullable(),
      history: z
        .array(z.object({ input: textSchema, message: textSchema }).strict())
        .max(LIMITS.history),
      undo: z.array(snapshotSchema).max(LIMITS.snapshots),
      redo: z.array(snapshotSchema).max(LIMITS.snapshots),
      nextVersion: z.number().int().min(1).max(1000000000).default(1),
      versions: z
        .array(
          z
            .object({
              number: z.number().int().min(1),
              createdAt: z.string().max(40),
              snapshot: snapshotSchema,
            })
            .strict(),
        )
        .max(LIMITS.snapshots),
    })
    .strict()
    .parse(value) as Context;
  assertSnapshot({
    pkg: v.pkg,
    files: v.files,
    folders: v.folders,
    activeFile: v.activeFile,
    activeTool: v.activeTool,
  });
  for (const s of [
    ...v.undo,
    ...v.redo,
    ...v.versions.map((x) => x.snapshot),
    ...(v.pendingConfirm ? [v.pendingConfirm.snapshot] : []),
  ])
    assertSnapshot(s);
  if (bytes(JSON.stringify(v)) > LIMITS.contextBytes)
    throw new Error("Historial demasiado grande");
  return v;
}
export function assertFiles(files: VirtualFile[]): VirtualFile[] {
  assertSnapshot({
    pkg: null,
    files,
    folders: [],
    activeFile: null,
    activeTool: null,
  });
  return files;
}
