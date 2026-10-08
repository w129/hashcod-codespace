import { ApiError } from "./security.js";
function required(env: NodeJS.ProcessEnv, name: string) {
  const value = env[name];
  if (!value) throw new Error(`Missing required ${name}`);
  return value;
}
export function config(env: NodeJS.ProcessEnv = process.env) {
  const secret = required(env, "SKILL_CHAT_JWT_SECRET");
  const encryption = Buffer.from(
    required(env, "SKILL_CHAT_KEY_ENCRYPTION_KEY"),
    "base64",
  );
  if (secret.length < 32 || encryption.length !== 32)
    throw Error("Invalid server cryptographic configuration");
  const workerUrl = required(env, "SKILL_CHAT_WORKER_URL"),
    edgeUrl = required(env, "SKILL_CHAT_EDGE_URL"),
    publicUrl = required(env, "SKILL_CHAT_PUBLIC_URL");
  if (
    new URL(edgeUrl).protocol !== "https:" ||
    new URL(publicUrl).protocol !== "https:"
  )
    throw new ApiError(500, "Invalid fixed origin");
  const worker = new URL(workerUrl);
  if (
    worker.protocol !== "http:" ||
    !(
      worker.hostname.endsWith(".railway.internal") ||
      (env.NODE_ENV === "test" &&
        ["127.0.0.1", "localhost"].includes(worker.hostname))
    )
  )
    throw Error("Worker must use private DNS");
  return {
    databaseUrl: required(env, "DATABASE_URL"),
    redisUrl: required(env, "REDIS_URL"),
    jwtKey: Buffer.from(secret),
    encryptionKey: encryption,
    bridgeKey: required(env, "SKILL_CHAT_BRIDGE_PRIVATE_KEY"),
    workerSecret: required(env, "SKILL_CHAT_WORKER_SECRET"),
    workerUrl,
    edgeUrl,
    publicUrl,
    origins: (
      env.SKILL_CHAT_ALLOWED_ORIGINS ??
      "https://hashcodcodespace.dev,https://hashcod-codespace-1-production.up.railway.app"
    ).split(","),
    port: Number(env.PORT ?? 8080),
  };
}
export type Config = ReturnType<typeof config>;
export const models = [
  { id: "claude-sonnet-5-5", inputUsdPerMillion: 2, outputUsdPerMillion: 10 },
  { id: "claude-opus-5-5", inputUsdPerMillion: 4, outputUsdPerMillion: 20 },
];
