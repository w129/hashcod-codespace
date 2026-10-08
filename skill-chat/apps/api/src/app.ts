import Fastify, { type FastifyRequest } from "fastify";
import websocket from "@fastify/websocket";
import rateLimit from "@fastify/rate-limit";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import {
  createContext,
  executeCommand,
  parse,
  commands,
  importPackage,
  updateFile,
  addFile,
  mergeGenerated,
  buildPackage,
  assertContext,
  withSnapshot,
  changedContext,
  snapshot,
  type Context,
} from "@hashcod/skill-core";
import { ApiError, cleanOutput } from "./security.js";
import { Auth, type AuthIdentity } from "./auth.js";
import { Store } from "./storage.js";
import { AI, Sandbox } from "./ai.js";
import { Jobs } from "./jobs.js";
import { archive, exportFiles } from "./export.js";
import { models, type Config } from "./config.js";
const uuid = z.string().uuid(),
  revision = z.number().int().min(0).max(2147483647);
function body<T>(schema: z.ZodType<T>, value: unknown): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ApiError(400, "Solicitud no válida.");
  return r.data;
}
function id(req: FastifyRequest) {
  return body(z.object({ id: uuid }), req.params).id;
}
export async function createApp(deps: {
  cfg: Config;
  store: Store;
  auth: Auth;
  ai: AI;
  sandbox: Sandbox;
  jobs: Jobs;
}) {
  const { cfg, store, auth, ai, sandbox, jobs } = deps;
  const app = Fastify({
    logger: {
      level: "info",
      redact: [
        "req.headers.authorization",
        "req.headers.cookie",
        "req.headers.x-api-key",
        "body",
        "err",
      ],
      serializers: { req: () => ({}), res: () => ({}) },
    },
    disableRequestLogging: true,
    bodyLimit: 1500000,
    requestTimeout: 30000,
    connectionTimeout: 15000,
    trustProxy: false,
  });
  await app.register(websocket, { options: { maxPayload: 65536 } });
  await app.register(rateLimit, {
    max: 180,
    timeWindow: 60000,
    redis: store.redis,
    allowList: (req) => req.url === "/healthz",
  });
  const identities = new WeakMap<object, AuthIdentity>();
  app.setErrorHandler((error, req, reply) => {
    const status =
      error instanceof ApiError
        ? error.status
        : (error as any).statusCode === 429
          ? 429
          : (error as any).statusCode === 413
            ? 413
            : 500;
    app.log.warn(
      {
        event: "editor.rejected",
        status,
        route: req.routeOptions.url ?? "unknown",
      },
      "Editor operation rejected",
    );
    reply
      .code(status)
      .send({
        ok: false,
        error:
          error instanceof ApiError
            ? error.message
            : status === 429
              ? "Demasiadas solicitudes. Inténtalo más tarde."
              : status === 413
                ? "El archivo es demasiado grande."
                : "No se pudo completar la operación.",
      });
  });
  app.addHook("onRequest", async (req, reply) => {
    reply
      .header("Cache-Control", "no-store, max-age=0")
      .header("X-Content-Type-Options", "nosniff")
      .header("Referrer-Policy", "no-referrer");
    const isWs = /^\/sessions\/[0-9a-f-]+\/events\?/.test(req.url);
    if (req.headers.origin && !isWs)
      throw new ApiError(403, "Utiliza la plataforma para esta operación.");
    if (
      ["/healthz", "/auth/platform", "/auth/refresh", "/registry"].includes(
        req.url.split("?")[0],
      ) ||
      /^\/sessions\/[0-9a-f-]+\/events\?/.test(req.url)
    )
      return;
    const bearer = req.headers.authorization;
    if (typeof bearer !== "string" || !bearer.startsWith("Bearer "))
      throw new ApiError(401, "Inicia tu periodo de acceso.");
    const origin = req.headers["x-hashcod-origin"];
    if (typeof origin !== "string")
      throw new ApiError(403, "Origen no autorizado.");
    const identity = await auth.validate(bearer.slice(7), origin);
    identities.set(req, identity);
    const key =
        "rate:owner:" + identity.owner + ":" + Math.floor(Date.now() / 60000),
      n = await store.redis.incr(key);
    if (n === 1) await store.redis.expire(key, 120);
    if (n > 60)
      throw new ApiError(429, "Demasiadas operaciones. Inténtalo más tarde.");
  });
  const identity = (req: FastifyRequest) => {
    const a = identities.get(req);
    if (!a) throw new ApiError(401, "Inicia tu periodo de acceso.");
    return a;
  };
  app.get("/healthz", async () => {
    await store.db.$queryRaw`SELECT 1`;
    await store.redis.ping();
    await sandbox.ready();
    return { ok: true };
  });
  app.post("/auth/platform", async (req) => {
    const b = body(
      z
        .object({
          token: z.string().min(10).max(32768),
          origin: z.string().max(300),
        })
        .strict(),
      req.body,
    );
    return auth.platform(b.token, b.origin);
  });
  app.post("/auth/refresh", async (req) => {
    const b = body(
      z
        .object({
          refreshToken: z.string().min(32).max(256),
          token: z.string().min(10).max(32768),
          origin: z.string().max(300),
        })
        .strict(),
      req.body,
    );
    return auth.refresh(b.refreshToken, b.token, b.origin);
  });
  app.get("/commands", async () => ({ ok: true, commands }));
  const projects = async (owner: string) =>
    store.db.project.findMany({
      where: { owner },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        kind: true,
        updatedAt: true,
        published: true,
      },
    });
  app.get("/projects", async (req) => ({
    ok: true,
    projects: await projects(identity(req).owner),
  }));
  app.get("/bootstrap", async (req) => {
    const a = identity(req);
    return {
      ok: true,
      commands,
      projects: await projects(a.owner),
      sessions: await store.listSessions(a.owner),
      config: {
        models,
        eventsOrigin: cfg.publicUrl.replace(/^https:/, "wss:"),
        scope:
          "Archivos privados; ejecución aislada CoffeeScript/Dart; pruebas Anthropic con consentimiento y límite de gasto.",
      },
    };
  });
  app.get("/registry", async () => ({
    ok: true,
    items: await store.db.publication.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        kind: true,
        description: true,
        version: true,
      },
    }),
  }));
  app.post("/sessions", async (req) => {
    const a = identity(req),
      b = body(z.object({ projectId: uuid.optional() }).strict(), req.body);
    const s = await store.create(a.owner, b.projectId);
    return { ok: true, state: await store.state(a.owner, s.id) };
  });
  app.get("/sessions/:id/state", async (req) => ({
    ok: true,
    state: await store.state(identity(req).owner, id(req)),
  }));
  app.get("/projects/:id", async (req) => {
    const p = await store.project(identity(req).owner, id(req));
    return {
      ok: true,
      project: {
        id: p.id,
        name: p.name,
        kind: p.kind,
        revision: p.revision,
        published: p.published,
        updatedAt: p.updatedAt,
      },
    };
  });
  app.get("/projects/:id/files", async (req) => {
    const p = await store.project(identity(req).owner, id(req));
    return { ok: true, files: (p.context as any).files };
  });
  app.get("/projects/:id/versions", async (req) => {
    const p = await store.project(identity(req).owner, id(req));
    return {
      ok: true,
      versions: await store.db.version.findMany({
        where: { projectId: p.id },
        orderBy: { number: "desc" },
        take: 100,
        select: { number: true, createdAt: true },
      }),
    };
  });
  const mutate = async (
    req: FastifyRequest,
    fn: (
      ctx: Context,
      b: any,
      p: any,
    ) => Promise<{
      context: Context;
      message: string;
      job?: any;
      publish?: boolean;
      unpublish?: boolean;
      saveVersion?: boolean;
      download?: any;
    }>,
    schema: z.ZodType<any>,
  ) => {
    const a = identity(req),
      sessionId = id(req),
      b = body(schema, req.body);
    return store.locked(sessionId, async () => {
      const s = await store.session(a.owner, sessionId),
        p = await store.project(a.owner, s.projectId);
      if (p.revision !== b.revision)
        throw new ApiError(
          409,
          "El proyecto cambió. Actualiza y vuelve a intentarlo.",
        );
      const ctx = p.context as unknown as Context;
      assertContext(ctx);
      if (
        ctx.pendingConfirm &&
        (!b.input || !["yes", "no"].includes(parse(b.input).name))
      )
        throw new ApiError(409, "Responde /yes o /no primero.");
      const latest = await store.db.version.aggregate({
        where: { projectId: p.id },
        _max: { number: true },
      });
      ctx.nextVersion = (latest._max.number ?? 0) + 1;
      let r;
      try {
        r = await fn(ctx, b, p);
      } catch (e) {
        if (e instanceof ApiError) throw e;
        throw new ApiError(
          400,
          "El comando o contenido no es válido. Revisa /help.",
        );
      }
      const input = b.input ?? "";
      await store.db.execLog.create({
        data: {
          owner: a.owner,
          sessionId: s.id,
          command: input
            ? parse(input).name
            : (req.routeOptions.url ?? "operation"),
          ok: true,
          durationMs: 0,
        },
      });
      await store.persist(
        a.owner,
        s,
        b.revision,
        r.context,
        cleanOutput(input),
        cleanOutput(r.message),
        r.saveVersion,
        r.publish,
        r.unpublish,
      );
      let job;
      if (r.job) {
        job = await jobs.add({
          owner: a.owner,
          sessionId: s.id,
          projectId: p.id,
          revision: p.revision + 1,
          job: r.job,
          context: r.context,
        });
      }
      return {
        ok: true,
        state: await store.state(a.owner, s.id),
        message: r.message,
        ...(job ? { job } : {}),
        ...(r.download ? { download: r.download } : {}),
      };
    });
  };
  app.post("/sessions/:id/exec", async (req) =>
    mutate(
      req,
      async (ctx, b, p) => {
        if (/sk-ant-[A-Za-z0-9_-]{10}/.test(b.input))
          throw new ApiError(
            400,
            "Añade la API key en Ajustes, fuera del chat.",
          );
        const parsed = parse(b.input);
        if (parsed.name === "restore" || parsed.name === "diff") {
          const n = parsed.args
            ? Number(parsed.args)
            : parsed.name === "diff"
              ? ((
                  await store.db.version.aggregate({
                    where: { projectId: p.id },
                    _max: { number: true },
                  })
                )._max.number ?? 0)
              : 0;
          if (!Number.isSafeInteger(n) || n < 1)
            throw new ApiError(400, "Indica una versión válida.");
          const v = await store.db.version.findFirst({
            where: { projectId: p.id, number: n },
          });
          if (!v) throw new ApiError(404, "Versión no disponible.");
          const old = v.context as unknown as Context;
          assertContext(old);
          if (parsed.name === "restore")
            return {
              context: changedContext(ctx, withSnapshot(ctx, snapshot(old))),
              message: `Versión ${n} restaurada.`,
              saveVersion: true,
            };
          const paths = new Set(
            [...ctx.files, ...old.files].map((f) => f.path),
          );
          const rows = [...paths]
            .map((path) => {
              const current = ctx.files.find((f) => f.path === path),
                before = old.files.find((f) => f.path === path);
              return current?.content === before?.content
                ? ""
                : `${before ? (current ? "Modificado" : "Eliminado") : "Añadido"}: ${path}`;
            })
            .filter(Boolean);
          return {
            context: ctx,
            message: rows.join("\n") || "Sin diferencias.",
          };
        }
        const r = executeCommand(ctx, b.input);
        if (r.publish && r.context.pkg) {
          const known = await store.db.publication.findMany({
            where: { kind: "skill" },
            select: { name: true },
          });
          const errors = (await import("@hashcod/skill-core"))
            .validatePackage(
              r.context.pkg,
              known.map((x) => x.name),
            )
            .filter((i) => i.level === "error");
          if (errors.length)
            throw new ApiError(
              400,
              "Completa y valida el paquete antes de publicarlo.",
            );
          const out = await sandbox.run("compile", r.context.files);
          if (out.exitCode !== 0)
            throw new ApiError(
              422,
              "Corrige los errores de compilación antes de publicar.",
            );
        }
        return r;
      },
      z.object({ input: z.string().min(1).max(1048576), revision }).strict(),
    ),
  );
  app.post("/sessions/:id/file", async (req) =>
    mutate(
      req,
      async (ctx, b) => ({
        context: updateFile(ctx, b.path, b.content),
        message: `Guardado: ${b.path}`,
      }),
      z
        .object({
          path: z.string().min(1).max(256),
          content: z.string().max(1048576),
          revision,
        })
        .strict(),
    ),
  );
  app.post("/sessions/:id/import", async (req) =>
    mutate(
      req,
      async (ctx, b) => {
        let context;
        if (/\.(coffee|dart)$/.test(b.name)) {
          context = addFile(ctx, b.name, b.content);
        } else {
          const pkg = importPackage(b.name, b.content);
          context = mergeGenerated(
            { ...createContext(), pkg },
            buildPackage(pkg),
          );
        }
        assertContext(context);
        return { context, message: `Importado: ${b.name}`, saveVersion: true };
      },
      z
        .object({
          name: z.string().min(1).max(256),
          content: z.string().max(1048576),
          revision,
        })
        .strict(),
    ),
  );
  app.post("/sessions/:id/registry", async (req) =>
    mutate(
      req,
      async (ctx, b) => {
        const p = await store.db.publication.findUnique({
          where: { id: b.id },
        });
        if (!p) throw new ApiError(404, "Paquete no disponible.");
        const old = p.snapshot as unknown as Context;
        assertContext(old);
        return {
          context: withSnapshot(ctx, snapshot(old)),
          message: `Importado del catálogo: ${p.name}`,
          saveVersion: true,
        };
      },
      z.object({ id: uuid, revision }).strict(),
    ),
  );
  app.post("/sessions/:id/ai", async (req) => {
    const a = identity(req),
      s = await store.session(a.owner, id(req));
    const b = body(
      z
        .object({
          apiKey: z
            .string()
            .min(20)
            .max(512)
            .regex(/^sk-ant-[A-Za-z0-9_-]+$/),
          model: z.enum(["claude-sonnet-5-5", "claude-opus-5-5"]),
          budgetMicros: z.number().int().min(100000).max(20000000),
          consent: z.literal(true),
        })
        .strict(),
      req.body,
    );
    return store.locked(s.id, () =>
      ai.configure(a.owner, s.id, b.apiKey, b.model, b.budgetMicros),
    );
  });
  app.delete("/sessions/:id/ai", async (req) => {
    const a = identity(req),
      s = await store.session(a.owner, id(req));
    await ai.remove(a.owner, s.id);
    return { ok: true };
  });
  app.get("/projects/:id/export", async (req, reply) => {
    const p = await store.project(identity(req).owner, id(req)),
      q = body(
        z.object({ format: z.enum(["zip", "md", "yaml", "coffee", "dart"]) }),
        req.query,
      ),
      ctx = p.context as unknown as Context;
    const filename =
      (ctx.pkg?.name ?? "hashcod-skill")
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 64) || "hashcod-skill";
    reply.header(
      "Content-Disposition",
      `attachment; filename="${filename}.${q.format}"`,
    );
    if (q.format === "zip")
      return reply.type("application/zip").send(await archive(ctx));
    const files = exportFiles(ctx, q.format);
    return reply
      .type("text/plain; charset=utf-8")
      .send(files.map((f) => f.content).join("\n\n"));
  });
  app.get("/sessions/:id/events-token", async (req) => {
    const a = identity(req),
      s = await store.session(a.owner, id(req)),
      ticket = randomBytes(32).toString("base64url");
    await store.redis.set(
      "ws:" + ticket,
      JSON.stringify({ ...a, sessionId: s.id }),
      "EX",
      30,
    );
    const url = new URL(`/sessions/${s.id}/events`, cfg.publicUrl);
    url.protocol = "wss:";
    url.searchParams.set("ticket", ticket);
    return { ok: true, url: url.toString() };
  });
  app.get(
    "/sessions/:id/events",
    {
      websocket: true,
      preValidation: async (req) => {
        const q = body(
            z.object({ ticket: z.string().min(40).max(64) }).strict(),
            req.query,
          ),
          raw = await store.redis.getdel("ws:" + q.ticket);
        if (!raw) throw new ApiError(401, "Enlace de eventos caducado.");
        const a = JSON.parse(raw);
        if (req.headers.origin !== a.origin || a.sessionId !== id(req))
          throw new ApiError(403, "Origen no autorizado.");
        await store.session(a.owner, a.sessionId);
        await auth.row(a.sid);
        identities.set(req, a);
      },
    },
    (socket, req) => {
      const a = identity(req) as any,
        subscriber = store.redis.duplicate();
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        clearTimeout(timer);
        subscriber.disconnect();
        socket.close();
      };
      const timer = setTimeout(close, 900000);
      subscriber.subscribe("events:" + a.sessionId).catch(close);
      subscriber.on("message", (_, content) => {
        if (socket.readyState === 1) socket.send(content);
      });
      socket.on("close", close);
      socket.on("error", close);
      socket.on("message", () => close());
    },
  );
  app.addHook("onClose", async () => {
    await jobs.close();
  });
  return app;
}
