import postgres from 'npm:postgres@3.4.7';
export const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { max: 1, prepare: false, connect_timeout: 8, idle_timeout: 20 });
export const BUCKET = 'hashcod-shared-cloud';
// Keep this at or below the project's global Storage limit (50 MiB).
export const MAX_FILE_BYTES = 52428800;
export const URL = Deno.env.get('SUPABASE_URL')!;
export const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}').default;
const encoder = new TextEncoder();
export function fail(status: number, message: string): never { throw Object.assign(new Error(message), { status }); }
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
export function fileId(value: unknown): string {
  if (typeof value !== 'string' || !/^fv_[A-Za-z0-9_-]{8,64}$/.test(value)) fail(400, 'Invalid file id.');
  return value;
}
export function code(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || [...value].length > 128 || value.includes('\0')) fail(400, 'Choose a file code with 1 to 128 characters.');
  return value;
}
export async function mac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode('hashcod-shared-cloud-v1|' + value));
  return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
}
export function equal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0; for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}
export async function rate(key: string, limit: number) {
  const rows = await sql`insert into hashcod_shared.rate_limits (key, started, attempts)
    values (${key}, now(), 1) on conflict (key) do update set
    attempts = case when hashcod_shared.rate_limits.started < now() - interval '60 seconds' then 1 else hashcod_shared.rate_limits.attempts + 1 end,
    started = case when hashcod_shared.rate_limits.started < now() - interval '60 seconds' then now() else hashcod_shared.rate_limits.started end returning attempts`;
  if (rows[0].attempts > limit) fail(429, 'Too many requests. Try again shortly.');
}
let bucketReady = false;
export async function storage(path: string, method = 'GET', body?: unknown, extra: Record<string, string> = {}) {
  return fetch(URL + '/storage/v1/' + path, { method,
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, ...(body ? { 'Content-Type': 'application/json' } : {}), ...extra },
    body: body ? JSON.stringify(body) : undefined });
}
export async function bucket() {
  if (bucketReady) return;
  const existing = await storage('bucket/' + BUCKET);
  if (!existing.ok) {
    const created = await storage('bucket', 'POST', { id: BUCKET, name: BUCKET, public: false, file_size_limit: MAX_FILE_BYTES });
    if (!created.ok && created.status !== 409) {
      const reason = await created.json().catch(() => ({}));
      console.error('Shared storage bucket creation failed', created.status, String(reason.error || '').slice(0, 100), String(reason.message || '').slice(0, 200));
      fail(503, 'Shared storage is unavailable.');
    }
  } else if ((await existing.json()).public === true) fail(503, 'Shared storage protection is unavailable.');
  bucketReady = true;
}
export function objectPath(path: string) { return encodeURIComponent(BUCKET) + '/' + path.split('/').map(encodeURIComponent).join('/'); }
export async function ticket(payload: object) {
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return encoded + '.' + await mac('ticket|' + encoded);
}
export async function openTicket(value: unknown) {
  if (typeof value !== 'string' || value.length > 4096) fail(400, 'Invalid upload ticket.');
  const [data, signature, extra] = value.split('.');
  if (extra || !signature || !equal(signature, await mac('ticket|' + data))) fail(403, 'Invalid upload ticket.');
  let decoded; try { decoded = JSON.parse(decodeURIComponent(escape(atob(data.replace(/-/g, '+').replace(/_/g, '/'))))); } catch { fail(400, 'Invalid upload ticket.'); }
  if (!Number.isFinite(decoded.expires) || decoded.expires < Date.now()) fail(403, 'Upload ticket expired.');
  return decoded;
}
