import { describe, it, expect, vi } from "vitest";
import { randomUUID, randomBytes } from "node:crypto";
import { createApp } from "../src/app.js";
import { ApiError } from "../src/security.js";
import { Sandbox } from "../src/ai.js";
const origin = "https://hashcodcodespace.dev";
const cfg: any = {
  publicUrl: "https://fixed-api.test",
  workerUrl: "http://worker.railway.internal:8080/v1/jobs",
  workerSecret: "x".repeat(32),
  jwtKey: randomBytes(32),
};
function redis() {
  return {
    rateLimit: (...args: any[]) => args.at(-1)(null, [1, 60000]),
    rateLimitRead: (...args: any[]) => args.at(-1)(null, [1, 60000]),
    incr: async () => 1,
    expire: async () => 1,
  };
}
describe("HTTP admission", () => {
  async function app() {
    return createApp({
      cfg,
      store: {
        redis: redis(),
        db: {},
        session: async () => {
          throw new ApiError(404, "Sesión no disponible.");
        },
      } as any,
      auth: {
        validate: async () => ({
          owner: randomUUID(),
          sid: randomUUID(),
          origin,
        }),
      } as any,
      ai: {} as any,
      sandbox: {} as any,
      jobs: { close: async () => {} } as any,
    });
  }
  it("constructs real routes and denies anonymous writes before database access", async () => {
    const a = await app();
    const r = await a.inject({ method: "POST", url: "/sessions", payload: {} });
    expect(r.statusCode).toBe(401);
    expect(r.json().error).not.toMatch(/stack|SQL|Prisma/i);
    await a.close();
  });
  it("denies direct browser origins and missing trusted-origin headers", async () => {
    const a = await app();
    expect(
      (
        await a.inject({
          url: "/commands",
          headers: { authorization: "Bearer fixture", origin },
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await a.inject({
          url: "/commands",
          headers: { authorization: "Bearer fixture" },
        })
      ).statusCode,
    ).toBe(403);
    await a.close();
  });
  it("serves actual command catalog only after auth", async () => {
    const a = await app(),
      r = await a.inject({
        url: "/commands",
        headers: {
          authorization: "Bearer fixture",
          "x-hashcod-origin": origin,
        },
      });
    expect(r.statusCode).toBe(200);
    expect(r.json().commands.some((c: any) => c.name === "publish")).toBe(true);
    expect(r.json().commands.some((c: any) => c.name === "unpublish")).toBe(
      true,
    );
    await a.close();
  });
  it("bounds invalid bodies before any state read", async () => {
    const a = await app(),
      r = await a.inject({
        method: "POST",
        url: `/sessions/${randomUUID()}/exec`,
        payload: { input: "hello", revision: -1 },
        headers: {
          authorization: "Bearer fixture",
          "x-hashcod-origin": origin,
        },
      });
    expect(r.statusCode).toBe(400);
    await a.close();
  });
  it("preserves safe compiler failure diagnostics and rejects malformed worker response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              ok: false,
              stdout: "",
              stderr: "Syntax error at line 2",
              exitCode: 1,
              durationMs: 5,
            }),
          ),
      ),
    );
    const out = await new Sandbox(cfg).run("compile", []);
    expect(out.exitCode).toBe(1);
    expect(out.stderr).toContain("Syntax");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              ok: true,
              stdout: "",
              stderr: "",
              exitCode: 0,
              durationMs: Infinity,
            }),
          ),
      ),
    );
    await expect(new Sandbox(cfg).run("compile", [])).rejects.toThrow();
    vi.unstubAllGlobals();
  });
});
