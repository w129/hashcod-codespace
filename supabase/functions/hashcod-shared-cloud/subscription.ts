import { sql, json, fail, mac, rate, openTicket } from './core.ts';

export async function subscriptionStatus(owner: string) {
  const rows = await sql`select plan, floor(extract(epoch from expires_at))::bigint as expires_at
    from hashcod_shared.subscriptions where period_id=${owner} and expires_at>now()`;
  return rows[0] ? { tier: 'pro', plan: rows[0].plan, expiresAt: Number(rows[0].expires_at), monthlyRequests: 25 }
    : { tier: 'free', plan: null, expiresAt: null, monthlyRequests: 0 };
}
export async function requirePro(owner: string) {
  if ((await subscriptionStatus(owner)).tier !== 'pro') fail(403, 'Esta función requiere Hashcod Pro. Valida el código de tu pago.');
}
async function redeemRate(key: string, limit: number) {
  const rows = await sql`insert into hashcod_shared.rate_limits(key,started,attempts) values (${key},now(),1)
    on conflict(key) do update set attempts=case when hashcod_shared.rate_limits.started<now()-interval '15 minutes' then 1 else hashcod_shared.rate_limits.attempts+1 end,
      started=case when hashcod_shared.rate_limits.started<now()-interval '15 minutes' then now() else hashcod_shared.rate_limits.started end returning attempts`;
  if (Number(rows[0].attempts)>limit) fail(429, 'Demasiados intentos. Espera 15 minutos.');
}
export async function subscription(action: string, owner: string, body: any, request: Request) {
  if (request.method !== 'POST') fail(405, 'Method not allowed.');
  if (action === 'issue') {
    const auth = await openTicket(body.adminTicket);
    const config = (await sql`select revision from hashcod_shared.tokenization_config where id=1`)[0];
    if (auth.kind !== 'tokenization-admin' || auth.period !== owner || auth.revision !== config?.revision)
      fail(403, 'Se requiere acceso administrativo para confirmar el pago.');
    await rate('subscription-issue|' + owner, 10);
    const target = body.reference;
    if (typeof target !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(target)
      || !['monthly', 'yearly'].includes(body.plan)) fail(400, 'Referencia o plan incorrecto.');
    const issued = await sql.begin(async tx => {
      // Serialise issuance and redemption for this order, including first use.
      await tx`select pg_advisory_xact_lock(hashtextextended(${target}, 0))`;
      let code = '', digest = '';
      for (let tries = 0; tries < 10; tries++) {
        let random: number;
        do { random = crypto.getRandomValues(new Uint32Array(1))[0]; } while (random >= 4294000000);
        code = String(random % 1000000).padStart(6, '0');
        digest = await mac('subscription|' + target + '|' + code);
        const prior = await tx`select id from hashcod_shared.subscription_codes where period_id=${target} and code_hash=${digest}`;
        if (!prior[0]) break;
        digest = '';
      }
      if (!digest) fail(503, 'No se pudo emitir un código. Intenta de nuevo.');
      await tx`update hashcod_shared.subscription_codes set consumed_at=now() where period_id=${target} and consumed_at is null`;
      const rows = await tx`insert into hashcod_shared.subscription_codes(period_id,code_hash,plan,issued_by,expires_at)
        values (${target},${digest},${body.plan},${owner},now()+interval '15 minutes')
        returning floor(extract(epoch from expires_at))::bigint as expires_at`;
      return { ...rows[0], code };
    });
    return json({ ok: true, code: issued.code, reference: target, plan: body.plan, expiresAt: Number(issued.expires_at) });
  }
  if (action !== 'redeem') fail(400, 'Unsupported subscription action.');
  // Persistent rolling-window limit survives reloads and code reissues.
  await redeemRate('subscription-redeem|' + owner, 6);
  await redeemRate('subscription-redeem-ip|' + await mac(request.headers.get('x-forwarded-for') || 'unknown'), 30);
  if (typeof body.code !== 'string' || !/^[0-9]{6}$/.test(body.code)) fail(400, 'Introduce el código de 6 dígitos.');
  const digest = await mac('subscription|' + owner + '|' + body.code);
  const result = await sql.begin(async tx => {
    await tx`select pg_advisory_xact_lock(hashtextextended(${owner}, 0))`;
    const codes = await tx`update hashcod_shared.subscription_codes set consumed_at=now()
      where period_id=${owner} and code_hash=${digest} and consumed_at is null and expires_at>now() returning plan`;
    if (!codes[0]) fail(403, 'Código incorrecto, caducado o ya utilizado.');
    const plan = codes[0].plan;
    // Database time and the advisor-confirmed plan determine the paid term.
    await tx`insert into hashcod_shared.subscriptions(period_id,plan,expires_at)
      values (${owner},${plan},now()+make_interval(months => ${plan === 'yearly' ? 12 : 1}))
      on conflict(period_id) do update set plan=excluded.plan,
        expires_at=greatest(hashcod_shared.subscriptions.expires_at,now())+make_interval(months => ${plan === 'yearly' ? 12 : 1})`;
    await tx`insert into hashcod_shared.access_periods(id,days,expires_at)
      values (${owner},10,floor(extract(epoch from now()))::bigint+864000)
      on conflict(id) do update set days=10,expires_at=excluded.expires_at
      where hashcod_shared.access_periods.expires_at<=floor(extract(epoch from now()))`;
    return true;
  });
  return json({ ok: result, subscription: await subscriptionStatus(owner) });
}
