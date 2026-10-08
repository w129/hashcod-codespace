import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { inflateRawSync } from "node:zlib";
import {
  generateKeyPairSync,
  randomBytes,
  randomUUID,
  verify,
} from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Redis } from "ioredis";
import { createApp } from "../src/app.js";
import { Store } from "../src/storage.js";
import { Auth } from "../src/auth.js";
import { AI, Sandbox } from "../src/ai.js";
import { Jobs } from "../src/jobs.js";
import { canonical } from "../src/security.js";
import { createContext, executeCommand } from "@hashcod/skill-core";
import type { Config } from "../src/config.js";
function unzip(zip: Buffer) {
  let e = zip.length - 22;
  while (e >= 0 && zip.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < 0) throw Error("missing central directory");
  const count = zip.readUInt16LE(e + 10),
    files: Record<string, string> = {};
  let c = zip.readUInt32LE(e + 16);
  for (let i = 0; i < count; i++) {
    if (zip.readUInt32LE(c) !== 0x02014b50)
      throw Error("invalid central directory");
    const method = zip.readUInt16LE(c + 10),
      size = zip.readUInt32LE(c + 20),
      nameLen = zip.readUInt16LE(c + 28),
      extra = zip.readUInt16LE(c + 30),
      comment = zip.readUInt16LE(c + 32),
      offset = zip.readUInt32LE(c + 42),
      name = zip.subarray(c + 46, c + 46 + nameLen).toString();
    const start =
        offset +
        30 +
        zip.readUInt16LE(offset + 26) +
        zip.readUInt16LE(offset + 28),
      content = zip.subarray(start, start + size);
    files[name] = (method === 8 ? inflateRawSync(content) : content).toString();
    c += 46 + nameLen + extra + comment;
  }
  return files;
}
const enabled = process.env.SKILL_CHAT_INTEGRATION === "1";
describe.skipIf(!enabled)("real PostgreSQL and Redis API boundaries", () => {
  const a = randomUUID(),
    b = randomUUID(),
    origin = "https://hashcodcodespace.dev",
    keys = generateKeyPairSync("ed25519");
  let app: any,
    store: Store,
    redis: Redis,
    db: PrismaClient,
    ai: AI,
    auth: Auth;
  let tokenA = "",
    tokenB = "",
    sid = "",
    revision = 0,
    project = "";
  let paid = 0;
  const cfg: Config = {
    databaseUrl: process.env.DATABASE_URL!,
    redisUrl: process.env.REDIS_URL!,
    jwtKey: randomBytes(32),
    encryptionKey: randomBytes(32),
    bridgeKey: keys.privateKey
      .export({ format: "der", type: "pkcs8" })
      .toString("base64"),
    workerSecret: "test-worker-secret-" + "x".repeat(32),
    workerUrl: "http://127.0.0.1:18888/v1/jobs",
    edgeUrl: "https://fixed-edge.test/identity",
    publicUrl: "https://fixed-api.test",
    origins: [origin],
    port: 8080,
  };
  beforeAll(async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: any, options: any) => {
        const u = String(url);
        if (u === cfg.edgeUrl) {
          const p = JSON.parse(options.body),
            { signature, ...data } = p;
          if (
            !verify(
              null,
              Buffer.concat([
                Buffer.from("hashcod.skill-chat.identity.v1\0"),
                Buffer.from(canonical(data)),
              ]),
              keys.publicKey,
              Buffer.from(signature, "base64"),
            )
          )
            return new Response("{}", { status: 403 });
          const owner =
            p.data.token === "period-a"
              ? a
              : p.data.token === "period-b"
                ? b
                : null;
          return new Response(
            JSON.stringify({
              ok: !!owner,
              owner,
              expiresAt: Math.floor(Date.now() / 1000) + 3600,
            }),
            { status: owner ? 200 : 403 },
          );
        }
        if (u.includes("/v1/models/"))
          return new Response('{"id":"claude-sonnet-5-5"}');
        if (u.includes("/v1/messages")) {
          paid++;
          return new Response(
            JSON.stringify({
              content: [
                { type: "text", text: "Respuesta de prueba sin herramientas." },
              ],
            }),
          );
        }
        if (u.includes("/healthz")) return new Response('{"ok":true}');
        return new Response(
          JSON.stringify({
            ok: true,
            stdout: "ok",
            stderr: "",
            exitCode: 0,
            durationMs: 10,
          }),
        );
      }),
    );
    db = new PrismaClient({
      adapter: new PrismaPg({ connectionString: cfg.databaseUrl }),
    });
    redis = new Redis(cfg.redisUrl, { maxRetriesPerRequest: null });
    store = new Store(db, redis);
    auth = new Auth(redis, cfg);
    const sandbox = new Sandbox(cfg);
    ai = new AI(redis, cfg, sandbox);
    app = await createApp({
      cfg,
      store,
      auth,
      ai,
      sandbox,
      jobs: new Jobs(store, ai, sandbox),
    });
    tokenA = (await auth.platform("period-a", origin)).accessToken;
    tokenB = (await auth.platform("period-b", origin)).accessToken;
  }, 30000);
  afterAll(async () => {
    await app?.close();
    await db?.project.deleteMany({ where: { owner: { in: [a, b] } } });
    await db?.execLog.deleteMany({ where: { owner: { in: [a, b] } } });
    await db?.$disconnect();
    redis?.disconnect();
    vi.unstubAllGlobals();
  });
  const request = (
    method: string,
    url: string,
    payload?: any,
    token = tokenA,
  ) =>
    app.inject({
      method,
      url,
      payload,
      headers: { authorization: "Bearer " + token, "x-hashcod-origin": origin },
    });
  it("anonymous and direct cross-origin writes fail", async () => {
    expect(
      (await app.inject({ method: "POST", url: "/sessions", payload: {} }))
        .statusCode,
    ).toBe(401);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/sessions",
          payload: {},
          headers: {
            authorization: "Bearer " + tokenA,
            "x-hashcod-origin": origin,
            origin: "https://evil.test",
          },
        })
      ).statusCode,
    ).toBe(403);
  });
  it("creates privately owned persistent project/session", async () => {
    const r = await request("POST", "/sessions", {});
    expect(r.statusCode).toBe(200);
    const state = r.json().state;
    sid = state.sessionId;
    project = state.projectId;
    expect(state.files).toEqual([]);
    expect(
      (await request("GET", `/sessions/${sid}/state`, undefined, tokenB))
        .statusCode,
    ).toBe(404);
    expect(
      (
        await request(
          "GET",
          `/projects/${project}/export?format=zip`,
          undefined,
          tokenB,
        )
      ).statusCode,
    ).toBe(404);
  });
  it("runs complete skill command flow, freezes versions and exports actual ZIP", async () => {
    for (const input of [
      "/skill facturacion-dgii",
      "/desc Valida facturas cuando el usuario pide generar una factura con RNC",
      "/tool validar_rnc",
      "/param rnc:string!",
      "/build",
      "/save",
    ]) {
      const r = await request("POST", `/sessions/${sid}/exec`, {
        input,
        revision,
      });
      expect(r.statusCode).toBe(200);
      revision = r.json().state.revision;
    }
    const r = await request("GET", `/projects/${project}/export?format=zip`);
    expect(r.statusCode).toBe(200);
    expect(r.rawPayload.subarray(0, 2).toString()).toBe("PK");
    const files = unzip(r.rawPayload);
    expect(files["SKILL.md"]).toContain("name: facturacion-dgii");
    expect(files["scripts/validar_rnc.coffee"]).toContain("module.exports");
    expect(files["scripts/validar_rnc.dart"]).toContain("class ValidarRnc");
    expect(r.headers["content-disposition"]).toContain("facturacion-dgii.zip");
    const versions = (
      await request("GET", `/projects/${project}/versions`)
    ).json().versions;
    expect(versions).toHaveLength(1);
  });
  it("atomic revision rejects lost updates and rejects traversal", async () => {
    const results = await Promise.all(
      ["/h2 A", "/h2 B"].map((input) =>
        request("POST", `/sessions/${sid}/exec`, { input, revision }),
      ),
    );
    expect(results.map((x) => x.statusCode).sort()).toEqual([200, 409]);
    revision = results.find((x) => x.statusCode === 200).json().state.revision;
    expect(
      (
        await request("POST", `/sessions/${sid}/file`, {
          path: "../../secrets",
          content: "x",
          revision,
        })
      ).statusCode,
    ).toBe(400);
    const state = (await request("GET", `/sessions/${sid}/state`)).json().state;
    expect(state.undo).toBeUndefined();
    expect(state.history).toBeUndefined();
  });
  it("AI consent and budget enforced before provider call, encrypted per owner, expiration and deletion", async () => {
    expect(
      (
        await request("POST", `/sessions/${sid}/ai`, {
          apiKey: "sk-ant-" + "x".repeat(30),
          model: "claude-sonnet-5-5",
          budgetMicros: 100000,
          consent: false,
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await request(
          "POST",
          `/sessions/${sid}/ai`,
          {
            apiKey: "sk-ant-" + "x".repeat(30),
            model: "claude-sonnet-5-5",
            budgetMicros: 100000,
            consent: true,
          },
          tokenB,
        )
      ).statusCode,
    ).toBe(404);
    await ai.configure(
      a,
      sid,
      "sk-ant-" + "x".repeat(30),
      "claude-sonnet-5-5",
      100000,
    );
    const raw = await redis.get(ai.id(a, sid));
    expect(raw).not.toContain("sk-ant-");
    await redis.set(ai.id(a, sid) + ":remaining", "0", "EX", 60);
    const p = await store.project(a, project);
    await expect(ai.test(a, sid, p.context as any, "hello")).rejects.toThrow(
      "límite",
    );
    expect(paid).toBe(0);
    await redis.set(ai.id(a, sid) + ":remaining", "100000", "EX", 60);
    const result = await ai.test(a, sid, p.context as any, "hello");
    expect(result.output).toContain("Respuesta");
    expect(paid).toBe(1);
    await ai.remove(a, sid);
    await expect(ai.test(a, sid, p.context as any, "hello")).rejects.toThrow(
      "Configura",
    );
  });
  it("publish requires confirmation and produces immutable public snapshot then unpublish", async () => {
    let r = await request("POST", `/sessions/${sid}/exec`, {
      input: "/publish",
      revision,
    });
    expect(r.statusCode).toBe(200);
    revision = r.json().state.revision;
    expect(await db.publication.count({ where: { projectId: project } })).toBe(
      0,
    );
    r = await request("POST", `/sessions/${sid}/exec`, {
      input: "/yes",
      revision,
    });
    expect(r.statusCode).toBe(200);
    revision = r.json().state.revision;
    const pub = await db.publication.findFirst({
      where: { projectId: project },
    });
    expect(pub).not.toBeNull();
    const frozen = JSON.stringify(pub?.snapshot);
    r = await request("POST", `/sessions/${sid}/exec`, {
      input: "/text private later text",
      revision,
    });
    expect(r.statusCode).toBe(200);
    revision = r.json().state.revision;
    expect(
      JSON.stringify(
        (await db.publication.findUnique({ where: { id: pub!.id } }))?.snapshot,
      ),
    ).toBe(frozen);
    r = await request("POST", `/sessions/${sid}/exec`, {
      input: "/unpublish",
      revision,
    });
    expect(r.statusCode).toBe(200);
    revision = r.json().state.revision;
    r = await request("POST", `/sessions/${sid}/exec`, {
      input: "/yes",
      revision,
    });
    expect(r.statusCode).toBe(200);
    revision = r.json().state.revision;
    expect(await db.publication.count({ where: { projectId: project } })).toBe(
      0,
    );
  });
  it("WS ticket is one-use and origin/session bound", async () => {
    const r = await request("GET", `/sessions/${sid}/events-token`);
    expect(r.statusCode).toBe(200);
    const ticket = new URL(r.json().url).searchParams.get("ticket")!;
    const raw = await redis.getdel("ws:" + ticket);
    expect(JSON.parse(raw!).origin).toBe(origin);
    expect(await redis.getdel("ws:" + ticket)).toBeNull();
  });
  it("refresh rotation and incorrect origin/period rejected", async () => {
    const x = await auth.platform("period-a", origin);
    await expect(
      auth.refresh(x.refreshToken, "period-a", "https://evil.test"),
    ).rejects.toThrow();
    const rotated = await auth.refresh(x.refreshToken, "period-a", origin);
    expect(rotated.refreshToken).not.toBe(x.refreshToken);
    await expect(
      auth.refresh(x.refreshToken, "period-a", origin),
    ).rejects.toThrow();
    await expect(
      auth.validate(rotated.accessToken, "http://localhost:8080"),
    ).rejects.toThrow();
  });
});
