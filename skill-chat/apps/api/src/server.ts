import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Redis } from "ioredis";
import { config } from "./config.js";
import { Store } from "./storage.js";
import { Auth } from "./auth.js";
import { AI, Sandbox } from "./ai.js";
import { Jobs } from "./jobs.js";
import { createApp } from "./app.js";
const cfg = config(),
  db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: cfg.databaseUrl, max: 8 }),
  }),
  redis = new Redis(cfg.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
redis.on("error", () => {});
const store = new Store(db, redis),
  auth = new Auth(redis, cfg),
  sandbox = new Sandbox(cfg),
  ai = new AI(redis, cfg, sandbox),
  jobs = new Jobs(store, ai, sandbox);
await db.$queryRaw`SELECT 1`;
await redis.ping();
await sandbox.ready();
const app = await createApp({ cfg, store, auth, ai, sandbox, jobs });
await app.listen({ port: cfg.port, host: "::" });
process.stdout.write(
  "Skill editor API ready: private database, queue and isolated worker reachable.\n",
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, async () => {
    await app.close();
    await db.$disconnect();
    redis.disconnect();
    process.exit(0);
  });
