import { sql, json, fail, mac, equal, rate, code, fileId, ticket, openTicket } from './core.ts';
import { contact, adminKey, statusUpdate } from './tokenization-validation.ts';
import { requirePro } from './subscription.ts';

export async function activePeriod(value: unknown) {
  if (typeof value !== 'string') fail(403, 'Primero confirma tu plazo en la plataforma.');
  const id = value.split('.')[0];
  if (!/^[a-f0-9-]{36}$/.test(id) || !equal(value, id + '.' + await mac('period|' + id))) fail(403, 'Sesión de acceso incorrecta.');
  const rows = await sql`select id from hashcod_shared.access_periods where id = ${id} and expires_at > floor(extract(epoch from now()))`;
  if (!rows[0]) fail(403, 'Tu plazo ha terminado. Renueva el acceso.');
  return id;
}
async function config() {
  const rows = await sql`select admin_hash, revision from hashcod_shared.tokenization_config where id = 1`;
  if (!rows[0]) fail(503, 'El área privada todavía no está disponible.');
  return rows[0];
}
export async function tokenization(action: string, request: Request, body: any) {
  if (request.method !== 'POST') fail(405, 'Method not allowed.');
  const period = await activePeriod(body.token);
  if (action === 'submit') {
    await requirePro(period);
    const id = fileId(body.id), supplied = code(body.code), details = contact(body);
    await rate('tokenization-submit|' + period, 10);
    await rate('tokenization-file|' + id, 8);
    const rows = await sql`select id, name, mime, size, price_usd_cents, code_hash from hashcod_shared.files where id = ${id} and status = 'ready'`;
    const file = rows[0];
    if (!file || !equal(file.code_hash, await mac('code|' + id + '|' + supplied))) fail(403, 'Código del archivo incorrecto o archivo no disponible.');
    // Idempotent for retries/double clicks; metadata comes only from the file ledger.
    const saved = await sql.begin(async tx => {
      // One subscriber lock serialises quota checks across tabs and files.
      const active = await tx`select period_id from hashcod_shared.subscriptions where period_id=${period} and expires_at>now() for update`;
      if (!active[0]) fail(403, 'Esta función requiere Hashcod Pro.');
      const duplicate = await tx`select id from hashcod_shared.tokenization_requests where period_id=${period} and file_id=${id}`;
      if (duplicate[0]) return [];
      const used = await tx`select count(*)::integer as total from hashcod_shared.tokenization_requests
        where period_id=${period} and created_at >= date_trunc('month',now() at time zone 'UTC') at time zone 'UTC'`;
      if (Number(used[0].total)>=25) fail(429, 'Has alcanzado las 25 solicitudes de este mes.');
      return await tx`insert into hashcod_shared.tokenization_requests
      (period_id, file_id, file_name, mime, size, price_usd_cents, phone, email)
      values (${period}, ${id}, ${file.name}, ${file.mime}, ${file.size}, ${file.price_usd_cents}, ${details.phone}, ${details.email})
      on conflict (period_id, file_id) do nothing returning id, status, created_at`;
    });
    const result = saved[0] || (await sql`select id, status, created_at from hashcod_shared.tokenization_requests where period_id = ${period} and file_id = ${id}`)[0];
    return json({ ok: true, request: { id: result.id, status: result.status, createdAt: result.created_at } });
  }
  if (action === 'mine') {
    // The caller's own requests only (scoped by the signed period); no contact data, file code or admin fields.
    await rate('tokenization-mine|' + period, 120);
    const rows = await sql`select r.id, r.file_name, r.status, r.created_at, r.updated_at,
      (select c.id from hashcod_shared.certificates c where c.request_id=r.id and c.revoked_at is null order by c.created_at desc limit 1) as certificate_id
      from hashcod_shared.tokenization_requests r where r.period_id = ${period}
      order by r.created_at desc, r.id desc limit 25`;
    const used = await sql`select count(*)::integer as total from hashcod_shared.tokenization_requests
      where period_id=${period} and created_at >= date_trunc('month',now() at time zone 'UTC') at time zone 'UTC'`;
    return json({ ok: true, quota: { used: Number(used[0].total), limit: 25 },
      requests: rows.map(row => ({ id: row.id, name: row.file_name, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, certificateId: row.certificate_id ?? null })) });
  }
  if (action === 'auth') {
    await rate('tokenization-auth|' + period, 6);
    await rate('tokenization-auth-ip|' + await mac(request.headers.get('x-forwarded-for') || 'unknown'), 30);
    const supplied = adminKey(body.key), settings = await config();
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(supplied));
    const hex = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
    if (!equal(hex, settings.admin_hash)) fail(403, 'Clave incorrecta.');
    const expires = Date.now() + 15 * 60 * 1000;
    return json({ ok: true, expiresAt: Math.floor(expires / 1000), adminTicket: await ticket({ kind: 'tokenization-admin', period, revision: settings.revision, expires }) });
  }
  if (action === 'list' || action === 'update') {
    const auth = await openTicket(body.adminTicket), settings = await config();
    if (auth.kind !== 'tokenization-admin' || auth.period !== period || auth.revision !== settings.revision) fail(403, 'Introduce la clave para ver las solicitudes.');
    if (action === 'update') {
      await rate('tokenization-update|' + period, 60);
      const change = statusUpdate(body);
      const rows = await sql`update hashcod_shared.tokenization_requests set status = ${change.status}, updated_at = now()
        where id = ${change.id} and status = ${change.expectedStatus} returning id, status, updated_at`;
      if (!rows[0]) fail(409, 'La solicitud cambió o ya no está disponible. Actualiza la lista e intenta de nuevo.');
      return json({ ok: true, request: { id: rows[0].id, status: rows[0].status, updatedAt: rows[0].updated_at } });
    }
    await rate('tokenization-list|' + period, 90);
    const offset = Number.isInteger(body.offset) && body.offset >= 0 && body.offset <= 100000 ? body.offset : 0;
    const rows = await sql`select r.id, r.file_id, r.file_name, r.mime, r.size, r.price_usd_cents, r.phone, r.email, r.status, r.created_at,
      coalesce(f.status = 'ready', false) as file_available,
      (select c.id from hashcod_shared.certificates c where c.request_id=r.id and c.revoked_at is null order by c.created_at desc limit 1) as certificate_id
      from hashcod_shared.tokenization_requests r left join hashcod_shared.files f on f.id = r.file_id
      order by r.created_at desc, r.id desc limit 51 offset ${offset}`;
    return json({ ok: true, hasMore: rows.length > 50, requests: rows.slice(0, 50).map(row => ({ id: row.id, fileId: row.file_id, name: row.file_name, mime: row.mime,
      size: Number(row.size), priceUsdCents: row.price_usd_cents == null ? null : Number(row.price_usd_cents), phone: row.phone, email: row.email, status: row.status, createdAt: row.created_at, fileAvailable: row.file_available, certificateId:row.certificate_id })) });
  }
  fail(400, 'Unsupported action.');
}
