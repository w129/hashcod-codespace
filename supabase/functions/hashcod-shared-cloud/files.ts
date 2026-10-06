import { sql, json, fail, fileId, code, mac, equal, rate, bucket, storage, objectPath, ticket, openTicket, URL, MAX_FILE_BYTES } from './core.ts';
function projection(row: any) {
  return { id: row.id, name: row.name, type: row.mime, size: Number(row.size), uploadedAt: new Date(row.created_at).toISOString(), cloud: true, totpProtected: true, accessProtection: 'access-code' };
}
export async function files(action: string, request: Request, body: any) {
  if (action === 'list') {
    const rows = await sql`select id, name, mime, size, created_at from hashcod_shared.files where status = 'ready' order by created_at desc limit 500`;
    const deleted = await sql`select id from hashcod_shared.files where status = 'deleted' order by created_at desc limit 500`;
    return json({ ok: true, files: rows.map(projection), deleted: deleted.map(r => r.id), scope: 'cross-device' });
  }
  if (request.method !== 'POST') fail(405, 'File actions require POST.');
  if (action === 'prepare') {
    const id = fileId(body.id), accessCode = code(body.access_code);
    const name = String(body.name || 'file').replace(/[\0\r\n]/g, '').split(/[\\/]/).pop()!.slice(0, 220) || 'file';
    const mime = String(body.type || 'application/octet-stream').replace(/[\r\n]/g, '').slice(0, 160);
    const size = Number(body.size); if (!Number.isSafeInteger(size) || size < 0 || size > MAX_FILE_BYTES) fail(413, 'Shared cloud files must be 50 MB or smaller.');
    await bucket();
    const hash = await mac('code|' + id + '|' + accessCode), object = 'files/' + id;
    // Reserve immutable identity/code before issuing a one-use upload URL.
    const inserted = await sql`insert into hashcod_shared.files (id, name, mime, size, object_path, code_hash, status)
      values (${id}, ${name}, ${mime}, ${size}, ${object}, ${hash}, 'pending') on conflict (id) do nothing returning id`;
    if (!inserted.length) {
      const rows = await sql`select * from hashcod_shared.files where id = ${id}`;
      const row = rows[0];
      if (row.status !== 'pending' || !equal(row.code_hash, hash) || Number(row.size) !== size || row.name !== name || row.mime !== mime) fail(409, 'This file id is already in use.');
    }
    const signed = await storage('object/upload/sign/' + objectPath(object), 'POST', {}, { 'x-upsert': 'false' });
    if (!signed.ok) fail(503, 'Could not prepare shared upload.');
    const data = await signed.json(), relative = String(data.signedURL || data.url || '');
    const uploadUrl = new globalThis.URL(relative.startsWith('/object/') ? '/storage/v1' + relative : relative, URL).href;
    if (!uploadUrl.startsWith(URL + '/storage/v1/object/upload/sign/')) fail(503, 'Could not prepare shared upload.');
    return json({ ok: true, uploadUrl, ticket: await ticket({ id, hash, size, expires: Date.now() + 1800000 }) });
  }
  if (action === 'complete') {
    const t = await openTicket(body.ticket), id = fileId(t.id);
    const rows = await sql`select * from hashcod_shared.files where id = ${id}`;
    const row = rows[0]; if (!row || !equal(row.code_hash, t.hash) || Number(row.size) !== t.size || row.status === 'deleted') fail(403, 'Invalid upload ticket.');
    if (row.status === 'ready') return json({ ok: true, file: projection(row) });
    const info = await storage('object/info/' + objectPath(row.object_path));
    if (!info.ok) fail(409, 'The file transfer has not completed.');
    const object = await info.json(), actualSize = Number(object.size ?? object.metadata?.size);
    if (!Number.isFinite(actualSize) || actualSize !== Number(row.size)) fail(409, 'The stored file size does not match.');
    const saved = await sql`update hashcod_shared.files set status = 'ready' where id = ${id} and status = 'pending' returning *`;
    return json({ ok: true, file: projection(saved[0] || row), cloud: true });
  }
  if (action !== 'download' && action !== 'delete') fail(400, 'Unsupported file action.');
  const id = fileId(body.id), supplied = code(body.code);
  await rate('file-code|' + id, 8);
  const rows = await sql`select * from hashcod_shared.files where id = ${id} and status = 'ready'`;
  const row = rows[0]; if (!row) fail(404, 'File not found.');
  if (!equal(row.code_hash, await mac('code|' + id + '|' + supplied))) fail(401, 'Use the exact code chosen by the person who uploaded this file.');
  if (action === 'delete') {
    const removed = await storage('object/' + objectPath(row.object_path), 'DELETE');
    if (!removed.ok && removed.status !== 404) fail(503, 'Could not remove the stored file.');
    await sql`update hashcod_shared.files set status = 'deleted' where id = ${id}`;
    return json({ ok: true, id });
  }
  const object = await storage('object/' + objectPath(row.object_path));
  if (!object.ok) fail(503, 'Could not restore the stored file.');
  return new Response(object.body, { headers: { 'Content-Type': row.mime, 'Content-Length': String(row.size),
    'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(row.name), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
