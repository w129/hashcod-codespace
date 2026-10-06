const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require('../../center-empty-state-build/node_modules/esbuild');
const root = path.resolve(__dirname, '../../supabase/functions/hashcod-shared-cloud');
function moduleFor(name, core) {
  const module = { exports: {} };
  const source = esbuild.transformSync(fs.readFileSync(path.join(root, name), 'utf8'), { loader: 'ts', format: 'cjs' }).code;
  vm.runInNewContext(source, { module, exports: module.exports, require: p => p === './core.ts' ? core : moduleFor('file-value.ts', core), Request, Response, URL, Date, console });
  return module.exports;
}
(async () => {
  const rows = new Map(); let writes = 0;
  const core = {
    fail: (status, message) => { throw Object.assign(new Error(message), { status }); },
    json: data => Response.json(data), fileId: v => v, code: v => v,
    mac: async v => 'hash:' + v, equal: (a, b) => a === b, rate: async () => {}, bucket: async () => {},
    URL: 'https://cloud.invalid', MAX_FILE_BYTES: 52428800, objectPath: v => 'bucket/' + v,
    ticket: async v => JSON.stringify(v), openTicket: async v => JSON.parse(v),
    storage: async p => Response.json(p.includes('upload/sign') ? { signedURL: '/storage/v1/object/upload/sign/bucket/file' } : { size: 4 }),
    sql: async (parts, ...v) => {
      const query = parts.join('?');
      if (query.startsWith('insert')) {
        if (rows.has(v[0])) return [];
        writes++;
        rows.set(v[0], { id: v[0], name: v[1], mime: v[2], size: v[3], object_path: v[4], code_hash: v[5], price_usd_cents: v[6], status: 'pending', created_at: '2026-10-06T20:00:00Z' });
        return [{ id: v[0] }];
      }
      if (query.startsWith('update')) { const row = rows.get(v[0]); row.status = 'ready'; return [row]; }
      if (query.includes("status = 'deleted'")) return [];
      if (query.includes('where id =')) { const row = rows.get(v[0]); return row ? [row] : []; }
      return [...rows.values()].filter(r => r.status === 'ready');
    },
  };
  const { files } = moduleFor('files.ts', core);
  const request = new Request('https://app.invalid', { method: 'POST' });
  const body = { id: 'fv_value_edge123', name: 'file.any', type: 'application/octet-stream', size: 4, access_code: 'chosen-code', priceUsdCents: 1250 };
  for (const invalid of [-1, 0.5, '1250', 1000000000, Infinity]) {
    await assert.rejects(files('prepare', request, { ...body, priceUsdCents: invalid }), e => e.status === 400);
  }
  assert.equal(writes, 0, 'invalid values must never reserve or upload files');
  const prepared = await (await files('prepare', request, body)).json();
  assert.equal(rows.get(body.id).price_usd_cents, 1250);
  await assert.rejects(files('prepare', request, { ...body, priceUsdCents: 9900 }), e => e.status === 409);
  const complete = await (await files('complete', request, { ticket: prepared.ticket })).json();
  assert.equal(complete.file.priceUsdCents, 1250);
  const list = await (await files('list', new Request('https://app.invalid'), {})).json();
  assert.equal(list.files[0].priceUsdCents, 1250, 'another device must receive persisted value');
  assert(!JSON.stringify(list).includes('chosen-code'), 'list must never expose uploader code/hash');
  for (const action of ['download', 'delete']) await assert.rejects(files(action, request, { id: body.id, code: 'wrong' }), e => e.status === 401);
  for (const price of [0, null, undefined]) {
    const id = 'fv_optional_' + String(price);
    const result = await (await files('prepare', request, { ...body, id, priceUsdCents: price })).json();
    const saved = await (await files('complete', request, { ticket: result.ticket })).json();
    assert.equal(saved.file.priceUsdCents, price ?? null);
  }
  console.log('Shared cloud value: validate before Storage, immutable upload metadata, complete/list persistence, optional/zero and code guards OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
