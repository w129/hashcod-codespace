import { randomUUID } from "node:crypto";
import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";
import type { Context, Job } from "@hashcod/skill-core";
import { buildPackage, assertContext } from "@hashcod/skill-core";
import { Store } from "./storage.js";
import { AI, Sandbox } from "./ai.js";
import { ApiError, cleanOutput } from "./security.js";
export type JobInput = {
  owner: string;
  sessionId: string;
  projectId: string;
  revision: number;
  job: Job;
  context: Context;
};
export class Jobs {
  queue: Queue;
  worker: Worker;
  constructor(
    private store: Store,
    private ai: AI,
    private sandbox: Sandbox,
  ) {
    const connection = store.redis.duplicate({ maxRetriesPerRequest: null });
    this.queue = new Queue("hashcod-skill-jobs", { connection });
    this.worker = new Worker(
      "hashcod-skill-jobs",
      async (j) => this.process(j.data, String(j.id)),
      {
        connection: connection.duplicate({ maxRetriesPerRequest: null }),
        concurrency: 2,
        lockDuration: 180000,
      },
    );
    this.worker.on("error", () => {});
  }
  async event(sessionId: string, id: string, status: string, message: string) {
    const old = JSON.parse((await this.store.redis.get("job:" + id)) ?? "{}");
    const event = {
      ...old,
      type: old.type ?? "job",
      id,
      status,
      message: cleanOutput(message).slice(0, 16384),
    };
    await this.store.redis.set("job:" + id, JSON.stringify(event), "EX", 86400);
    await this.store.redis.publish(
      "events:" + sessionId,
      JSON.stringify({ ...event, type: "job" }),
    );
  }
  async add(data: JobInput) {
    const count = await this.store.redis.incr("running:" + data.owner);
    await this.store.redis.expire("running:" + data.owner, 600);
    if (count > 5) {
      await this.store.redis.decr("running:" + data.owner);
      throw new ApiError(429, "Máximo cinco trabajos pendientes.");
    }
    const id = randomUUID(),
      row = { id, type: data.job.type, status: "queued" };
    try {
      await this.store.redis.set("job:" + id, JSON.stringify(row), "EX", 86400);
      await this.store.redis.lpush("jobs:" + data.sessionId, id);
      await this.store.redis.ltrim("jobs:" + data.sessionId, 0, 19);
      await this.store.redis.expire("jobs:" + data.sessionId, 86400);
      await this.queue.add(data.job.type, data, {
        jobId: id,
        attempts: 1,
        removeOnComplete: { age: 3600, count: 100 },
        removeOnFail: { age: 3600, count: 100 },
      });
      return row;
    } catch (e) {
      await this.store.redis.decr("running:" + data.owner);
      await this.store.redis.del("job:" + id);
      throw e;
    }
  }

  async process(data: JobInput, id: string) {
    let s;
    try {
      s = await this.store.session(data.owner, data.sessionId);
      const project = await this.store.project(data.owner, data.projectId);
      if (
        project.revision !== data.revision &&
        ["run", "test"].includes(data.job.type)
      )
        throw new ApiError(
          409,
          "El proyecto cambió; vuelve a ejecutar el comando para probar la versión actual.",
        );
      await this.event(s.id, id, "running", "Ejecutando…");
      let message = "";
      if (data.job.type === "test") {
        if (
          (await this.store.db.testRun.count({
            where: { project: { owner: data.owner } },
          })) >= 500
        )
          throw new ApiError(400, "Máximo 500 pruebas guardadas por periodo.");
        let ctx = data.context;
        if (ctx.pkg?.kind === "role") {
          const dependencies = [];
          for (const name of ctx.pkg.skills) {
            const p = await this.store.db.publication.findFirst({
              where: { name, kind: "skill" },
              orderBy: { createdAt: "desc" },
            });
            if (!p)
              throw new ApiError(400, "Un skill adjunto no está publicado.");
            dependencies.push(p.snapshot);
          }
          (ctx as any).dependencies = dependencies;
        }
        const result = await this.ai.test(
          data.owner,
          s.id,
          ctx,
          data.job.payload.input ?? "",
        );
        message = result.output;
        await this.store.db.testRun.create({
          data: {
            projectId: s.projectId,
            input: (data.job.payload.input ?? "").slice(0, 16384),
            output: message.slice(0, 16384),
            status: "completed",
            costMicros: result.costMicros,
          },
        });
      } else {
        const out = await this.sandbox.run(
          data.job.type === "run" ? "run" : "compile",
          data.context.files,
          data.job.payload.tool,
          data.job.payload.lang,
          data.job.payload.args,
        );
        message = `${data.job.type === "run" ? "Ejecución" : "Compilación"} ${out.exitCode === 0 ? "completada" : "con errores"} (${out.durationMs} ms).\n${out.stdout}${out.stderr ? "\n" + out.stderr : ""}`;
        if (out.exitCode !== 0) throw new ApiError(422, message);
      }
      await this.store.append(s, message);
      await this.event(s.id, id, "completed", message);
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo completar el trabajo.";
      if (s) {
        await this.store.append(s, message);
        await this.event(s.id, id, "failed", message);
      }
      throw new Error(message);
    } finally {
      await this.store.redis.decr("running:" + data.owner);
    }
  }
  async close() {
    await this.worker.close();
    await this.queue.close();
  }
}
