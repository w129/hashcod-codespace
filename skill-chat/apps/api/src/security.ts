import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  createPrivateKey,
  randomBytes,
  sign,
  timingSafeEqual,
} from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
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
}
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export function allowedOrigin(origin: string, configured: string[]): boolean {
  try {
    const u = new URL(origin);
    if (u.origin !== origin || u.username || u.password) return false;
    if (configured.includes(origin)) return u.protocol === "https:";
    return (
      u.protocol === "http:" &&
      ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname) &&
      Number(u.port) >= 1024 &&
      Number(u.port) <= 65535
    );
  } catch {
    return false;
  }
}
export function seal(text: string, key: Buffer, aad: string): string {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(aad));
  return Buffer.concat([
    iv,
    cipher.update(text),
    cipher.final(),
    cipher.getAuthTag(),
  ]).toString("base64");
}
export function unseal(value: string, key: Buffer, aad: string): string {
  try {
    const data = Buffer.from(value, "base64"),
      cipher = createDecipheriv("aes-256-gcm", key, data.subarray(0, 12));
    cipher.setAAD(Buffer.from(aad));
    cipher.setAuthTag(data.subarray(-16));
    return Buffer.concat([
      cipher.update(data.subarray(12, -16)),
      cipher.final(),
    ]).toString("utf8");
  } catch {
    throw new ApiError(401, "La sesión ha caducado.");
  }
}
export async function jsonFetch(
  url: string,
  options: RequestInit = {},
  maxBytes = 2 * 1024 * 1024,
): Promise<any> {
  let r: Response;
  try {
    r = await fetch(url, {
      ...options,
      redirect: "error",
      signal: options.signal ?? AbortSignal.timeout(30000),
    });
  } catch {
    throw new ApiError(503, "Servicio temporalmente no disponible.");
  }
  if (!r.ok) {
    await r.body?.cancel();
    throw new ApiError(
      r.status === 401 || r.status === 403 ? 401 : 503,
      r.status === 401 || r.status === 403
        ? "Credencial no válida."
        : "Servicio temporalmente no disponible.",
    );
  }
  const reader = r.body?.getReader();
  if (!reader) throw new ApiError(503, "Respuesta no disponible.");
  const chunks: Uint8Array[] = [];
  let n = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    n += value.length;
    if (n > maxBytes) {
      await reader.cancel();
      throw new ApiError(503, "Respuesta demasiado grande.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(503, "Respuesta no disponible.");
  }
}
export function identityProof(token: string, keyBase64: string) {
  const payload = {
    data: { token },
    key_id: "skill-chat-backend-v1",
    nonce: randomBytes(16).toString("hex"),
    timestamp: Math.floor(Date.now() / 1000),
  };
  const key = createPrivateKey({
    key: Buffer.from(keyBase64, "base64"),
    format: "der",
    type: "pkcs8",
  });
  return {
    ...payload,
    signature: sign(
      null,
      Buffer.concat([
        Buffer.from("hashcod.skill-chat.identity.v1\0"),
        Buffer.from(canonical(payload)),
      ]),
      key,
    ).toString("base64"),
  };
}
export async function signAccess(
  owner: string,
  sid: string,
  origin: string,
  key: Uint8Array,
  expiresAt: number,
) {
  return new SignJWT({ sid, origin })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(owner)
    .setIssuer("hashcod-skill-chat")
    .setAudience("hashcod-skill-api")
    .setIssuedAt()
    .setExpirationTime(Math.min(Math.floor(Date.now() / 1000) + 900, expiresAt))
    .sign(key);
}
export async function verifyAccess(token: string, key: Uint8Array) {
  try {
    const { payload } = await jwtVerify(token, key, {
      issuer: "hashcod-skill-chat",
      audience: "hashcod-skill-api",
      algorithms: ["HS256"],
    });
    if (
      typeof payload.sub !== "string" ||
      typeof payload.sid !== "string" ||
      typeof payload.origin !== "string"
    )
      throw Error();
    return { owner: payload.sub, sid: payload.sid, origin: payload.origin };
  } catch {
    throw new ApiError(401, "La sesión ha caducado.");
  }
}
export function workerSignature(body: unknown, secret: string) {
  return createHmac("sha256", secret).update(canonical(body)).digest("hex");
}
export function equal(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function cleanOutput(value: string, key?: string) {
  let v = value
    .slice(0, 65536)
    .replace(/\u001b\[[0-9;]*[A-Za-z]/g, "")
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
  if (key) v = v.split(key).join("[credencial omitida]");
  return v.replace(/sk-ant-[A-Za-z0-9_-]+/g, "[credencial omitida]");
}
