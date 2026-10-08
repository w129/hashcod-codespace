import { randomBytes, randomUUID } from "node:crypto";
import type { Redis } from "ioredis";
import { z } from "zod";
import type { Config } from "./config.js";
import {
  ApiError,
  allowedOrigin,
  identityProof,
  jsonFetch,
  digest,
  seal,
  unseal,
  signAccess,
  verifyAccess,
} from "./security.js";
export type AuthIdentity = { owner: string; sid: string; origin: string };
type AuthRow = {
  owner: string;
  origin: string;
  platform: string;
  expiresAt: number;
  refreshHash: string;
  verifiedAt: number;
};
export class Auth {
  constructor(
    private redis: Redis,
    private cfg: Config,
  ) {}
  async identity(token: string) {
    const r = await jsonFetch(
      this.cfg.edgeUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(identityProof(token, this.cfg.bridgeKey)),
      },
      65536,
    );
    const v = z
      .object({
        ok: z.literal(true),
        owner: z.string().uuid(),
        expiresAt: z
          .number()
          .int()
          .gt(Math.floor(Date.now() / 1000)),
      })
      .safeParse(r);
    if (!v.success) throw new ApiError(401, "Periodo de acceso no válido.");
    return v.data;
  }
  async platform(token: string, origin: string) {
    if (!allowedOrigin(origin, this.cfg.origins))
      throw new ApiError(403, "Origen no autorizado.");
    const p = await this.identity(token),
      sid = randomUUID(),
      refreshToken = randomBytes(48).toString("base64url");
    const row: AuthRow = {
      owner: p.owner,
      origin,
      platform: seal(token, this.cfg.encryptionKey, sid),
      expiresAt: p.expiresAt,
      refreshHash: digest(refreshToken),
      verifiedAt: Date.now(),
    };
    await this.redis.set(
      "auth:" + sid,
      JSON.stringify(row),
      "EX",
      Math.min(604800, p.expiresAt - Math.floor(Date.now() / 1000)),
    );
    await this.redis.set("refresh:" + row.refreshHash, sid, "EX", 604800);
    return {
      ok: true,
      accessToken: await signAccess(
        p.owner,
        sid,
        origin,
        this.cfg.jwtKey,
        p.expiresAt,
      ),
      refreshToken,
    };
  }
  async refresh(refreshToken: string, token: string, origin: string) {
    const hash = digest(refreshToken),
      sid = await this.redis.get("refresh:" + hash);
    if (!sid) throw new ApiError(401, "La sesión ha caducado.");
    const row = await this.row(sid);
    if (
      row.refreshHash !== hash ||
      row.origin !== origin ||
      unseal(row.platform, this.cfg.encryptionKey, sid) !== token
    )
      throw new ApiError(401, "La sesión ha caducado.");
    const p = await this.identity(token);
    if (p.owner !== row.owner)
      throw new ApiError(401, "La sesión ha caducado.");
    const next = randomBytes(48).toString("base64url"),
      nextHash = digest(next);
    const rotated = await this.redis.eval(
      "if redis.call('GET',KEYS[1]) ~= ARGV[1] then return 0 end redis.call('DEL',KEYS[1]) return 1",
      1,
      "refresh:" + hash,
      sid,
    );
    if (Number(rotated) !== 1)
      throw new ApiError(401, "La sesión ha caducado.");
    row.refreshHash = nextHash;
    row.verifiedAt = Date.now();
    row.expiresAt = p.expiresAt;
    await this.redis.set(
      "auth:" + sid,
      JSON.stringify(row),
      "EX",
      Math.min(604800, p.expiresAt - Math.floor(Date.now() / 1000)),
    );
    await this.redis.set("refresh:" + nextHash, sid, "EX", 604800);
    return {
      ok: true,
      accessToken: await signAccess(
        row.owner,
        sid,
        origin,
        this.cfg.jwtKey,
        p.expiresAt,
      ),
      refreshToken: next,
    };
  }
  async row(sid: string): Promise<AuthRow> {
    const raw = await this.redis.get("auth:" + sid);
    if (!raw) throw new ApiError(401, "La sesión ha caducado.");
    const row = JSON.parse(raw);
    if (row.expiresAt <= Date.now() / 1000)
      throw new ApiError(401, "La sesión ha caducado.");
    return row;
  }
  async validate(token: string, origin: string): Promise<AuthIdentity> {
    const a = await verifyAccess(token, this.cfg.jwtKey);
    if (a.origin !== origin || !allowedOrigin(origin, this.cfg.origins))
      throw new ApiError(403, "Origen no autorizado.");
    const row = await this.row(a.sid);
    if (row.owner !== a.owner || row.origin !== origin)
      throw new ApiError(401, "La sesión ha caducado.");
    await this.revalidate(a.sid);

    return a;
  }
  async revalidate(sid: string) {
    const row = await this.row(sid);
    if (Date.now() - row.verifiedAt > 5000) {
      const p = await this.identity(
        unseal(row.platform, this.cfg.encryptionKey, sid),
      );
      if (p.owner !== row.owner)
        throw new ApiError(401, "La sesión ha caducado.");
      row.verifiedAt = Date.now();
      row.expiresAt = p.expiresAt;
      await this.redis.set("auth:" + sid, JSON.stringify(row), "KEEPTTL");
    }
    return row;
  }
}
