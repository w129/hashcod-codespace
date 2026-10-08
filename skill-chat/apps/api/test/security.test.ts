import { describe, it, expect, vi } from "vitest";
import { generateKeyPairSync, randomBytes, verify } from "node:crypto";
import {
  allowedOrigin,
  canonical,
  identityProof,
  seal,
  unseal,
  signAccess,
  verifyAccess,
  workerSignature,
  cleanOutput,
  jsonFetch,
} from "../src/security.js";
const origins = ["https://hashcodcodespace.dev"];
describe("trust boundaries", () => {
  it("rejects arbitrary origins and permits exact loopback ports", () => {
    for (const o of [
      "https://evil.test",
      "https://hashcodcodespace.dev.evil.test",
      "https://hashcodcodespace.dev/",
      "http://127.0.0.1:80",
      "http://127.0.0.1.evil:8080",
      "http://user@localhost:8080",
    ])
      expect(allowedOrigin(o, origins)).toBe(false);
    for (const o of [
      "https://hashcodcodespace.dev",
      "http://localhost:8080",
      "http://127.0.0.1:18080",
      "http://[::1]:8080",
    ])
      expect(allowedOrigin(o, origins)).toBe(true);
  });
  it("canonically signs domain-separated platform proofs", () => {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    const p = identityProof(
      "private-period-token",
      privateKey.export({ format: "der", type: "pkcs8" }).toString("base64"),
    );
    const { signature, ...data } = p;
    expect(
      verify(
        null,
        Buffer.concat([
          Buffer.from("hashcod.skill-chat.identity.v1\0"),
          Buffer.from(canonical(data)),
        ]),
        publicKey,
        Buffer.from(signature, "base64"),
      ),
    ).toBe(true);
    expect(
      verify(
        null,
        Buffer.from(canonical(data)),
        publicKey,
        Buffer.from(signature, "base64"),
      ),
    ).toBe(false);
  });
  it("encrypts provider keys tied to owner/session and rejects tampering", () => {
    const key = randomBytes(32),
      cipher = seal("sk-ant-test-credential-private", key, "owner:session");
    expect(cipher).not.toContain("credential");
    expect(unseal(cipher, key, "owner:session")).toBe(
      "sk-ant-test-credential-private",
    );
    expect(() => unseal(cipher, key, "other:session")).toThrow();
    expect(() =>
      unseal(cipher.slice(0, -8) + "AAAAAAAA", key, "owner:session"),
    ).toThrow();
  });
  it("binds short JWTs to owner, auth session and exact origin", async () => {
    const key = randomBytes(32),
      token = await signAccess(
        "owner",
        "session",
        "http://localhost:8080",
        key,
        Math.floor(Date.now() / 1000) + 5000,
      );
    expect(await verifyAccess(token, key)).toEqual({
      owner: "owner",
      sid: "session",
      origin: "http://localhost:8080",
    });
    await expect(verifyAccess(token, randomBytes(32))).rejects.toThrow();
    await expect(
      verifyAccess(await signAccess("owner", "session", "x", key, 1), key),
    ).rejects.toThrow();
  });
  it("worker signature includes every job field", () => {
    const s = "a".repeat(32),
      body = {
        files: [{ content: "hello", path: "file.coffee" }],
        timestamp: 1,
      };
    expect(workerSignature(body, s)).toBe(
      workerSignature({ timestamp: 1, files: body.files }, s),
    );
    expect(workerSignature(body, s)).not.toBe(
      workerSignature({ ...body, timestamp: 2 }, s),
    );
  });
  it("bounds and redacts output secrets and terminal control codes", () => {
    expect(cleanOutput("\x1b[31mhi sk-ant-secret123 KEY\0", "KEY")).toBe(
      "hi [credencial omitida] [credencial omitida]",
    );
    expect(cleanOutput("a".repeat(70000))).toHaveLength(65536);
  });
  it("does not follow provider redirects or consume huge/invalid responses", async () => {
    const mock = vi.fn(
      async () => new Response("x".repeat(100), { status: 200 }),
    );
    vi.stubGlobal("fetch", mock);
    await expect(jsonFetch("https://fixed.test", {}, 10)).rejects.toThrow();
    expect(mock.mock.calls[0][1].redirect).toBe("error");
    mock.mockResolvedValueOnce(new Response("{bad", { status: 200 }));
    await expect(jsonFetch("https://fixed.test")).rejects.toThrow();
    vi.unstubAllGlobals();
  });
});
