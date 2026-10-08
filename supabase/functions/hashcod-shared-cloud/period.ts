import { sql, json, fail, mac, equal, rate } from './core.ts';

const DAYS = [10, 20, 30, 60];
export async function accessPeriod(action: string, body: any) {
  if (!['status', 'accept', 'free'].includes(action)) fail(400, 'Unsupported access action.');
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'Invalid access request.');
  let token = typeof body.token === 'string' ? body.token : '';
  let id = token.split('.')[0];
  if (!token && (action === 'status' || action === 'free')) {
    id = crypto.randomUUID();
    token = id + '.' + await mac('period|' + id);
  }
  if (!/^[a-f0-9-]{36}$/.test(id) || !equal(token, id + '.' + await mac('period|' + id))) fail(403, 'Invalid access session.');
  const clock = await sql`select floor(extract(epoch from now()))::bigint as seconds`;
  const now = Number(clock[0].seconds);
  let rows = await sql`select days, expires_at from hashcod_shared.access_periods where id = ${id}`;
  let row = rows[0];
  if (action === 'free') {
    await rate('period-free|' + id, 6);
    if (!row || Number(row.expires_at) <= now) {
      // Free access is a renewable technical session, not proof of payment.
      // Its duration is fixed server-side and the existing identity is retained.
      rows = await sql`insert into hashcod_shared.access_periods (id, days, expires_at)
        values (${id}, ${10}, floor(extract(epoch from now()))::bigint + ${10} * 86400)
        on conflict (id) do update set days = excluded.days, expires_at = excluded.expires_at
        where hashcod_shared.access_periods.expires_at <= floor(extract(epoch from now()))
        returning days, expires_at`;
      row = rows[0];
      // A concurrent free-entry request may have already restored this session.
      if (!row) row = (await sql`select days, expires_at from hashcod_shared.access_periods where id = ${id}`)[0];
      if (!row) fail(503, 'Free entry is temporarily unavailable.');
    }
  } else if (action === 'accept') {
    if (!DAYS.includes(body.days)) fail(400, 'Choose 10, 20, 30 or 60 days.');
    if (row && Number(row.expires_at) > now) fail(409, 'Your current period is still active.');
    if (row) {
      await rate('period-renew|' + id, 6);
      const supplied = typeof body.code === 'string' ? body.code.trim() : '';
      if (!supplied || supplied.length > 256) fail(403, 'Clave de renovación incorrecta.');
      const config = await sql`select renewal_hash from hashcod_shared.access_period_config where id = 1`;
      if (!config[0]) fail(503, 'La renovación no está disponible.');
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(supplied));
      const hex = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
      if (!equal(hex, config[0].renewal_hash)) fail(403, 'Clave de renovación incorrecta.');
    }
    // The conditional upsert handles concurrent tabs without restarting an
    // active period. Database time determines the deadline, never client time.
    rows = await sql`insert into hashcod_shared.access_periods (id, days, expires_at)
      values (${id}, ${body.days}, floor(extract(epoch from now()))::bigint + ${body.days} * 86400)
      on conflict (id) do update set days = excluded.days, expires_at = excluded.expires_at
      where hashcod_shared.access_periods.expires_at <= floor(extract(epoch from now()))
      returning days, expires_at`;
    if (!rows[0]) fail(409, 'Your current period is still active.');
    row = rows[0];
  }
  return json({ ok: true, token, state: !row ? 'choose' : Number(row.expires_at) <= now ? 'expired' : 'active',
    days: row ? Number(row.days) : null, expiresAt: row ? Number(row.expires_at) : null, serverNow: now });
}
