import { sql, json, fail } from './core.ts';
// The browser already removes credentials and runtime caches. Keep the server
// side filter too, but allow new user-created workspace tools without another
// deployment every time a feature adds a localStorage key.
function safeKey(key: string): boolean {
  if (!/^[A-Za-z0-9:_\-.]{1,180}$/.test(key) || key.startsWith('__hashcod_cloud_')) return false;
  return !/(^|[_:\-.])(auth|token|secret|password|passwd|private|credential|dilithium|webauthn|csrf|nonce|challenge|turnstile|session|jwt|oauth|supabase|api[_-]?key|access[_-]?code|crypto|certified|certificate|validated)(?=$|[_:\-.])/i.test(key);
}
export async function sharedState(request: Request, body: any, readOnly = false) {
  if (request.method === 'POST' && !readOnly) {
    if (!body.entries || typeof body.entries !== 'object' || Array.isArray(body.entries)) fail(400, 'Invalid entries.');
    await sql.begin(async tx => {
      for (const [key, raw] of Object.entries(body.entries).slice(0, 256)) {
        if (!safeKey(key) || !raw || typeof raw !== 'object') continue;
        const entry = raw as any, ts = Number(entry.updatedAt);
        if (!Number.isSafeInteger(ts) || ts < 1 || ts > Date.now() + 300000) continue;
        const value = entry.deleted ? '' : String(entry.value ?? '');
        if (new TextEncoder().encode(value).length > 524288) continue;
        // Merge each key atomically, rather than overwriting an entire snapshot.
        await tx`insert into hashcod_shared.entries (key, value, client_updated_at, deleted)
          values (${key}, ${value}, ${ts}, ${Boolean(entry.deleted)}) on conflict (key) do update set
          value = excluded.value, client_updated_at = excluded.client_updated_at, deleted = excluded.deleted,
          revision = nextval('hashcod_shared.entry_revision') where excluded.client_updated_at >= hashcod_shared.entries.client_updated_at`;
      }
    });
  }
  const rows = await sql`select key, value, client_updated_at, deleted, revision from hashcod_shared.entries`;
  const entries: Record<string, object> = {}; let revision = 0;
  for (const row of rows) { entries[row.key] = { value: row.value, updatedAt: Number(row.client_updated_at), deleted: row.deleted }; revision = Math.max(revision, Number(row.revision)); }
  return json({ ok: true, entries, revision, scope: 'shared' });
}
