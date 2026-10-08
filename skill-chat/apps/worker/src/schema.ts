import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
export const MAX_FILE = 1024 * 1024,
  MAX_PROJECT = 16 * MAX_FILE;
export const toolName = z
  .string()
  .regex(/^[A-Za-z_][A-Za-z0-9_]{0,79}$/)
  .refine((x) => !["__proto__", "constructor", "prototype"].includes(x));
export function safePath(path: string): boolean {
  const parts = path.split("/");
  return (
    path.length > 0 &&
    path.length <= 240 &&
    parts.length <= 8 &&
    parts.every(
      (x) =>
        /^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/.test(x) &&
        x !== "." &&
        x !== ".." &&
        !["__proto__", "constructor", "prototype"].includes(x),
    )
  );
}
export const jobSchema = z
  .object({
    jobId: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),
    action: z.enum(["compile", "run"]),
    files: z
      .array(
        z
          .object({
            path: z.string().refine(safePath),
            ext: z.enum(["md", "yaml", "coffee", "dart"]),
            content: z.string().refine((x) => Buffer.byteLength(x) <= MAX_FILE),
          })
          .strict(),
      )
      .max(200)
      .refine(
        (files) =>
          new Set(files.map((x) => x.path)).size === files.length &&
          files.reduce((n, f) => n + Buffer.byteLength(f.content), 0) <=
            MAX_PROJECT,
      ),
    tool: toolName.optional(),
    lang: z.enum(["coffee", "dart"]).optional(),
    args: z
      .record(z.string(), z.unknown())
      .optional()
      .refine((x) => Buffer.byteLength(JSON.stringify(x ?? {})) <= 65536),
    timestamp: z.number().int(),
    nonce: z.string().regex(/^[a-f0-9]{32}$/),
  })
  .strict()
  .refine(
    (x) => x.action !== "run" || (x.tool !== undefined && x.lang !== undefined),
    "Tool and language required",
  );
export type Job = z.infer<typeof jobSchema>;
export type JobResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  issues?: { path: string; message: string }[];
};
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value !== null && typeof value === "object")
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map(
          (k) =>
            JSON.stringify(k) +
            ":" +
            canonical((value as Record<string, unknown>)[k]),
        )
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
export class ProofVerifier {
  private readonly seen = new Map<string, number>();
  constructor(private readonly secret: string) {
    if (Buffer.byteLength(secret) < 32)
      throw new Error("Worker secret must contain at least 32 bytes");
  }
  verify(
    value: unknown,
    signature: unknown,
    now = Math.floor(Date.now() / 1000),
  ): Job {
    const job = jobSchema.parse(value);
    if (
      Math.abs(now - job.timestamp) > 60 ||
      typeof signature !== "string" ||
      !/^[a-f0-9]{64}$/.test(signature)
    )
      throw new Error("Invalid job proof");
    const expected = createHmac("sha256", this.secret)
      .update(canonical(value))
      .digest();
    if (!timingSafeEqual(expected, Buffer.from(signature, "hex")))
      throw new Error("Invalid job proof");
    for (const [nonce, expiry] of this.seen)
      if (expiry < now) this.seen.delete(nonce);
    if (this.seen.has(job.nonce) || this.seen.size >= 4096)
      throw new Error("Job replay rejected");
    this.seen.set(job.nonce, now + 120);
    return job;
  }
}
