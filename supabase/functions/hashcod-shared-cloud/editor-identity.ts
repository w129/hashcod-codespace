import { sql, json, fail, rate } from './core.ts';
import { activePeriod } from './tokenization.ts';

export function canonicalEditor(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonicalEditor).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonicalEditor((value as Record<string,unknown>)[k])).join(',') + '}';
  return JSON.stringify(value);
}
function decode(value: unknown, length: number): Uint8Array {
  if (typeof value !== 'string' || value.length > 128) fail(403, 'Autenticación del editor incorrecta.');
  try { const bytes = Uint8Array.from(atob(value), c => c.charCodeAt(0)); if (bytes.length === length) return bytes; } catch { /* fail below */ }
  fail(403, 'Autenticación del editor incorrecta.');
}
export async function editorIdentity(request: Request, body: any) {
  if (request.method !== 'POST') fail(405, 'Method not allowed.');
  if (!body || Object.keys(body).sort().join(',') !== 'data,key_id,nonce,signature,timestamp'
    || body.key_id !== 'skill-chat-backend-v1' || !Number.isSafeInteger(body.timestamp)
    || Math.abs(Date.now() / 1000 - body.timestamp) > 90 || typeof body.nonce !== 'string'
    || !/^[a-f0-9]{32}$/.test(body.nonce) || !body.data || Object.keys(body.data).join(',') !== 'token'
    || typeof body.data.token !== 'string' || body.data.token.length > 256) fail(403, 'Autenticación del editor incorrecta.');
  const keys = await sql`select public_key from hashcod_shared.review_keyring where id=${body.key_id} and not revoked`;
  if (!keys[0]) fail(403, 'Servicio del editor no disponible.');
  const key = await crypto.subtle.importKey('raw', decode(keys[0].public_key, 32), { name: 'Ed25519' }, false, ['verify']);
  const signed = { data: body.data, key_id: body.key_id, nonce: body.nonce, timestamp: body.timestamp };
  const bytes = new TextEncoder().encode('hashcod.skill-chat.identity.v1\0' + canonicalEditor(signed));
  if (!await crypto.subtle.verify('Ed25519', key, decode(body.signature, 64), bytes)) fail(403, 'Autenticación del editor incorrecta.');
  const used = await sql`insert into hashcod_shared.review_nonces(key_id,nonce) values (${body.key_id},${body.nonce}) on conflict do nothing returning nonce`;
  if (!used[0]) fail(409, 'Solicitud ya utilizada.');
  await sql`delete from hashcod_shared.review_nonces where created_at < now()-interval '5 minutes'`;
  const owner = await activePeriod(body.data.token);
  await rate('editor-identity|' + owner, 120);
  const rows = await sql`select expires_at from hashcod_shared.access_periods where id=${owner} and expires_at > floor(extract(epoch from now()))`;
  if (!rows[0]) fail(403, 'Tu plazo ha terminado. Renueva el acceso.');
  return json({ ok: true, owner, expiresAt: Number(rows[0].expires_at) });
}
