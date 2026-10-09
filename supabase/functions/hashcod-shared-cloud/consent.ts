import { sql, json, fail, rate } from './core.ts';

// The PHP edge supplies already-hashed client/agent identifiers; raw IP addresses never reach the database.
export async function policyConsent(body: any) {
  const version = typeof body.version === 'string' ? body.version : '';
  const client = typeof body.client === 'string' ? body.client : '';
  const agent = typeof body.agent === 'string' ? body.agent : '';
  const host = typeof body.host === 'string' ? body.host.slice(0, 255) : '';
  if (!/^[0-9][0-9.\-]{0,38}$/.test(version) || !/^[a-f0-9]{64}$/.test(client) || !/^[a-f0-9]{32,64}$/.test(agent) || !host) fail(400, 'Solicitud de aceptación no válida.');
  await rate('policy-consent|' + client, 20);
  const saved = await sql`
    insert into hashcod_shared.policy_consents (policy_version, client_hash, agent_hash, host)
    values (${version}, ${client}, ${agent}, ${host})
    returning id, floor(extract(epoch from accepted_at))::bigint as accepted_at`;
  return json({ ok: true, receipt: saved[0].id, acceptedAt: Number(saved[0].accepted_at), version });
}
