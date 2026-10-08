import archiver from "archiver";
import { PassThrough } from "node:stream";
import type { Context } from "@hashcod/skill-core";
import { assertContext, buildPackage } from "@hashcod/skill-core";
import { ApiError } from "./security.js";
export function exportFiles(ctx: Context, format: string) {
  assertContext(ctx);
  const files = ctx.files.length
    ? ctx.files
    : ctx.pkg
      ? buildPackage(ctx.pkg)
      : [];
  if (!files.length) throw new ApiError(400, "No hay archivos para exportar.");
  if (format === "zip") return files;
  const filtered = files.filter((f) => f.ext === format);
  if (!filtered.length)
    throw new ApiError(400, "No hay archivos de ese formato.");
  return filtered;
}
export async function archive(ctx: Context) {
  const files = exportFiles(ctx, "zip"),
    zip = archiver("zip", { zlib: { level: 6 } }),
    stream = new PassThrough();
  const chunks: Buffer[] = [];
  let bytes = 0;
  const finished = new Promise<Buffer>((resolve, reject) => {
    stream.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > 20 * 1024 * 1024) {
        zip.abort();
        reject(new ApiError(400, "Exportación demasiado grande."));
      } else chunks.push(chunk);
    });
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
    zip.on("error", reject);
  });
  zip.pipe(stream);
  for (const f of files)
    zip.append(f.content, {
      name: f.path,
      date: new Date("2000-01-01T00:00:00Z"),
      mode: 0o644,
    });
  await zip.finalize();
  return finished;
}
