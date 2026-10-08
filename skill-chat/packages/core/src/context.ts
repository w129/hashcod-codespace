import type { Context, Snapshot, VirtualFile, Package } from "./model.js";
import {
  assertContext,
  assertSnapshot,
  pathSchema,
  textSchema,
  LIMITS,
  bytes,
} from "./safety.js";
import { importPackage } from "./importer.js";
export const clone = <T>(v: T): T => structuredClone(v);
export function createContext(): Context {
  return {
    pkg: null,
    files: [],
    folders: [],
    activeFile: null,
    activeTool: null,
    dirtyFiles: [],
    pendingConfirm: null,
    history: [],
    undo: [],
    redo: [],
    versions: [],
    nextVersion: 1,
  };
}
export function snapshot(ctx: Context): Snapshot {
  return clone({
    pkg: ctx.pkg,
    files: ctx.files,
    folders: ctx.folders,
    activeFile: ctx.activeFile,
    activeTool: ctx.activeTool,
    dirtyFiles: ctx.dirtyFiles ?? [],
  });
}
export function withSnapshot(ctx: Context, snap: Snapshot): Context {
  return {
    ...clone(ctx),
    ...assertSnapshot(clone(snap)),
    pendingConfirm: null,
  };
}
export function bounded<T>(rows: T[], max: number = LIMITS.snapshots): T[] {
  const result = rows.slice(-max);
  while (result.length && bytes(JSON.stringify(result)) > LIMITS.historyBytes)
    result.shift();
  return result;
}
export function trimContext(ctx: Context): Context {
  const result = clone(ctx);
  result.history = bounded(result.history, LIMITS.history);
  result.undo = bounded(result.undo);
  result.redo = bounded(result.redo);
  result.versions = bounded(result.versions);
  while (bytes(JSON.stringify(result)) > LIMITS.contextBytes) {
    if (result.undo.length) {
      result.undo.shift();
      continue;
    }
    if (result.redo.length) {
      result.redo.shift();
      continue;
    }
    if (result.versions.length) {
      result.versions.shift();
      continue;
    }
    if (result.history.length) {
      result.history.shift();
      continue;
    }
    throw new Error(
      "El proyecto y su confirmación exceden el límite de memoria",
    );
  }
  return result;
}
export function changedContext(before: Context, after: Context): Context {
  const result = {
    ...after,
    undo: bounded([...before.undo, snapshot(before)]),
    redo: [],
  };
  return assertContext(trimContext(result));
}
export function updateFile(
  ctx: Context,
  path: string,
  content: string,
): Context {
  assertContext(ctx);
  if (ctx.pendingConfirm) throw new Error("Responde /yes o /no primero");
  pathSchema.parse(path);
  textSchema.parse(content);
  const current = ctx.files.find((f) => f.path === path);
  if (!current) throw new Error("Archivo no disponible");
  let next = clone(ctx);
  next.files = next.files.map((f) => (f.path === path ? { ...f, content } : f));
  if (next.pkg?.kind === "skill") {
    if (path === "SKILL.md") {
      const imported = importPackage(path, content);
      if (imported.kind !== "skill") throw new Error("Formato incompatible");
      next.pkg = {
        ...imported,
        tools: next.pkg.tools,
        references: next.pkg.references,
      };
    } else {
      const tool = next.pkg.tools.find(
        (t) =>
          path === `scripts/${t.name}.coffee` ||
          path === `scripts/${t.name}.dart`,
      );
      if (tool) {
        const lang = current.ext as "coffee" | "dart";
        tool.body[lang] =
          (lang === "coffee"
            ? "# hashcod:full-file\n"
            : "// hashcod:full-file\n") + content;
      }
      if (path.startsWith("references/")) {
        const reference = next.pkg.references.find(
          (r) => r.path === path.slice(11),
        );
        if (reference) reference.content = content;
      }
    }
  } else if (next.pkg?.kind === "role" && path === "role.yaml") {
    next.pkg = importPackage(path, content);
  }
  next.activeFile = path;
  next.dirtyFiles = [...new Set([...(next.dirtyFiles ?? []), path])];
  return changedContext(ctx, next);
}
export function mergeGenerated(ctx: Context, files: VirtualFile[]): Context {
  const result = clone(ctx);
  const paths = new Set(files.map((f) => f.path));
  result.files = [...files, ...ctx.files.filter((f) => !paths.has(f.path))];
  result.dirtyFiles = (result.dirtyFiles ?? []).filter((p) => !paths.has(p));
  result.activeFile =
    result.activeFile && result.files.some((f) => f.path === result.activeFile)
      ? result.activeFile
      : (files[0]?.path ?? null);
  for (const f of files) {
    const parts = f.path.split("/");
    parts.pop();
    for (let i = 1; i <= parts.length; i++) {
      const folder = parts.slice(0, i).join("/");
      if (!result.folders.includes(folder)) result.folders.push(folder);
    }
  }
  assertSnapshot(snapshot(result));
  return result;
}
/** Add an owned upload; callers must authenticate ownership before invoking core. */
export function addFile(ctx: Context, path: string, content: string): Context {
  assertContext(ctx);
  if (ctx.pendingConfirm) throw new Error("Responde /yes o /no primero");
  pathSchema.parse(path);
  textSchema.parse(content);
  if (ctx.files.some((f) => f.path === path))
    throw new Error("El archivo ya existe");
  const ext = path.split(".").pop();
  if (ext !== "md" && ext !== "yaml" && ext !== "coffee" && ext !== "dart")
    throw new Error("Extensión no permitida");
  const next = clone(ctx);
  next.files.push({ path, ext, content });
  next.activeFile = path;
  next.dirtyFiles = [...new Set([...(next.dirtyFiles ?? []), path])];
  const parts = path.split("/");
  parts.pop();
  for (let i = 1; i <= parts.length; i++) {
    const folder = parts.slice(0, i).join("/");
    if (!next.folders.includes(folder)) next.folders.push(folder);
  }
  return changedContext(ctx, next);
}
