import type { PrismaClient } from "@prisma/client";
import type { Redis } from "ioredis";
import { randomBytes, randomUUID } from "node:crypto";
import {
  createContext,
  assertContext,
  type Context,
  type VirtualFile,
} from "@hashcod/skill-core";
import { ApiError } from "./security.js";
export type Session = {
  id: string;
  owner: string;
  projectId: string;
  updatedAt: string;
};
export class Store {
  constructor(
    public db: PrismaClient,
    public redis: Redis,
  ) {}
  async session(owner: string, id: string): Promise<Session> {
    if (!/^[0-9a-f-]{36}$/.test(id))
      throw new ApiError(404, "Sesión no disponible.");
    const row = await this.redis.get("session:" + id);
    if (!row) throw new ApiError(404, "Sesión no disponible.");
    const s = JSON.parse(row);
    if (s.owner !== owner) throw new ApiError(404, "Sesión no disponible.");
    await this.redis.expire("session:" + id, 86400);
    return s;
  }
  async create(owner: string, projectId?: string) {
    if (!projectId && (await this.db.project.count({ where: { owner } })) >= 50)
      throw new ApiError(400, "Máximo 50 proyectos por periodo.");
    const sessions = await this.listSessions(owner);
    if (sessions.length >= 20)
      throw new ApiError(400, "Máximo 20 sesiones activas.");
    const p = projectId
      ? await this.project(owner, projectId)
      : await this.db.project.create({
          data: {
            owner,
            name: "Nuevo proyecto",
            kind: "skill",
            context: createContext() as any,
          },
        });
    const s = {
      id: randomUUID(),
      owner,
      projectId: p.id,
      updatedAt: new Date().toISOString(),
    };
    await this.redis.set("session:" + s.id, JSON.stringify(s), "EX", 86400);
    await this.redis.zadd("sessions:" + owner, Date.now(), s.id);
    await this.redis.expire("sessions:" + owner, 86400);
    return s;
  }
  async project(owner: string, id: string) {
    const p = await this.db.project.findFirst({ where: { id, owner } });
    if (!p) throw new ApiError(404, "Proyecto no disponible.");
    return p;
  }
  async state(owner: string, id: string) {
    const s = await this.session(owner, id),
      p = await this.project(owner, s.projectId);
    const messages = await this.db.message.findMany({
      where: { projectId: p.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const versions = await this.db.version.findMany({
      where: { projectId: p.id },
      orderBy: { number: "desc" },
      take: 100,
      select: { number: true, createdAt: true },
    });
    const c = p.context as unknown as Context;
    const ids = await this.redis.lrange("jobs:" + id, 0, 19);
    const jobs = (await Promise.all(ids.map((x) => this.redis.get("job:" + x))))
      .filter(Boolean)
      .map((x) => JSON.parse(x!));
    return {
      sessionId: s.id,
      projectId: p.id,
      revision: p.revision,
      pkg: c.pkg,
      files: c.files,
      folders: c.folders,
      activeFile: c.activeFile,
      activeTool: c.activeTool,
      pendingConfirm: c.pendingConfirm
        ? { command: c.pendingConfirm.command, args: c.pendingConfirm.args }
        : null,
      jobs,
      messages: messages
        .reverse()
        .map((m) => ({
          role: m.role,
          content: m.content.slice(0, 16384),
          createdAt: m.createdAt.toISOString(),
        })),
      versions: versions
        .reverse()
        .map((v) => ({
          number: v.number,
          createdAt: v.createdAt.toISOString(),
        })),
    };
  }
  async listSessions(owner: string) {
    const ids = await this.redis.zrevrange("sessions:" + owner, 0, 99);
    const rows = await Promise.all(
      ids.map(async (id) => {
        const raw = await this.redis.get("session:" + id);
        if (!raw) {
          await this.redis.zrem("sessions:" + owner, id);
          return null;
        }
        const s = JSON.parse(raw);
        const p = await this.db.project.findFirst({
          where: { id: s.projectId, owner },
          select: { name: true },
        });
        return p
          ? { id, projectId: s.projectId, name: p.name, updatedAt: s.updatedAt }
          : null;
      }),
    );
    return rows.filter(Boolean);
  }
  async locked<T>(id: string, fn: () => Promise<T>): Promise<T> {
    const token = randomBytes(16).toString("hex");
    if (
      (await this.redis.set("lock:" + id, token, "PX", 180000, "NX")) !== "OK"
    )
      throw new ApiError(409, "Hay otra operación en curso.");
    try {
      return await fn();
    } finally {
      await this.redis.eval(
        "if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0",
        1,
        "lock:" + id,
        token,
      );
    }
  }
  async persist(
    owner: string,
    s: Session,
    revision: number,
    ctx: Context,
    userInput: string,
    message: string,
    saveVersion = false,
    publish = false,
    unpublish = false,
  ) {
    assertContext(ctx);
    const usage = await this.db.$queryRaw<
      { bytes: bigint }[]
    >`SELECT COALESCE(SUM(octet_length("context"::text)),0)::bigint AS bytes FROM "Project" WHERE "owner"=${owner}::uuid AND "id"<>${s.projectId}::uuid`;
    if (
      Number(usage[0]?.bytes ?? 0) + Buffer.byteLength(JSON.stringify(ctx)) >
      128 * 1024 * 1024
    )
      throw new ApiError(400, "Los proyectos del periodo alcanzaron 128 MiB.");
    const frozen = {
      ...createContext(),
      nextVersion: ctx.nextVersion,
      pkg: ctx.pkg,
      files: ctx.files,
      folders: ctx.folders,
      activeFile: ctx.activeFile,
      activeTool: ctx.activeTool,
    };
    const sizeBytes = Buffer.byteLength(JSON.stringify(frozen));
    if (saveVersion || publish) {
      const v = await this.db.version.aggregate({
          where: { project: { owner } },
          _sum: { sizeBytes: true },
        }),
        pub = await this.db.publication.aggregate({
          where: { project: { owner } },
          _sum: { sizeBytes: true },
        });
      if (
        (v._sum.sizeBytes ?? 0) + (pub._sum.sizeBytes ?? 0) + sizeBytes >
        128 * 1024 * 1024
      )
        throw new ApiError(400, "El historial del periodo alcanzó 128 MiB.");
    }
    if (
      saveVersion &&
      (await this.db.version.count({ where: { projectId: s.projectId } })) >=
        100
    )
      throw new ApiError(400, "Máximo 100 versiones por proyecto.");
    if (
      publish &&
      (await this.db.publication.count({
        where: { projectId: s.projectId },
      })) >= 20
    )
      throw new ApiError(400, "Máximo 20 publicaciones por proyecto.");
    await this.db.$transaction(async (tx) => {
      const updated = await tx.project.updateMany({
        where: { id: s.projectId, owner, revision },
        data: {
          context: ctx as any,
          revision: { increment: 1 },
          name: ctx.pkg?.name ?? "Nuevo proyecto",
          kind: ctx.pkg?.kind ?? "skill",
          published: unpublish ? false : publish ? true : undefined,
        },
      });
      if (updated.count !== 1)
        throw new ApiError(
          409,
          "El proyecto cambió. Actualiza y vuelve a intentarlo.",
        );
      await tx.file.deleteMany({ where: { projectId: s.projectId } });
      if (ctx.files.length)
        await tx.file.createMany({
          data: ctx.files.map((f) => ({ projectId: s.projectId, ...f })),
        });
      if (userInput)
        await tx.message.create({
          data: {
            projectId: s.projectId,
            role: "user",
            content: userInput.slice(0, 1048576),
          },
        });
      if (message)
        await tx.message.create({
          data: {
            projectId: s.projectId,
            role: "system",
            content: message.slice(0, 65536),
          },
        });
      if (saveVersion) {
        const last = await tx.version.aggregate({
          where: { projectId: s.projectId },
          _max: { number: true },
        });
        await tx.version.create({
          data: {
            projectId: s.projectId,
            number: (last._max.number ?? 0) + 1,
            context: frozen as any,
            sizeBytes,
          },
        });
      }
      if (unpublish)
        await tx.publication.deleteMany({ where: { projectId: s.projectId } });
      if (publish && ctx.pkg)
        await tx.publication.create({
          data: {
            projectId: s.projectId,
            name: ctx.pkg.name,
            kind: ctx.pkg.kind,
            description: ctx.pkg.description,
            version: ctx.pkg.version,
            snapshot: frozen as any,
            sizeBytes,
          },
        });
    });
    const stale = await this.db.message.findMany({
      where: { projectId: s.projectId },
      orderBy: { createdAt: "desc" },
      skip: 200,
      select: { id: true },
    });
    if (stale.length)
      await this.db.message.deleteMany({
        where: { id: { in: stale.map((x) => x.id) } },
      });
    s.updatedAt = new Date().toISOString();
    await this.redis.set("session:" + s.id, JSON.stringify(s), "EX", 86400);
    await this.redis.zadd("sessions:" + owner, Date.now(), s.id);
  }
  async append(s: Session, content: string, role = "system") {
    await this.db.message.create({
      data: { projectId: s.projectId, role, content: content.slice(0, 65536) },
    });
  }
}
