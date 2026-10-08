const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const build = path.resolve(__dirname, '../../center-empty-state-build');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hco-access-'));
const source = fs.readFileSync(path.resolve(__dirname, '../../supabase/functions/hashcod-shared-cloud/period.ts'), 'utf8');
const mock = `
export let now=1000; export const rows=new Map(); export const limits=[];
export function clock(value){now=value;}
export function fail(status,message){throw Object.assign(new Error(message),{status});}
export function json(data){return data;}
export async function mac(value){return 'fixture-'+value;}
export function equal(a,b){return a===b;}
export async function rate(key,limit){limits.push([key,limit]);}
export async function sql(parts,...values){
 const query=parts.join('?');
 if(query.includes('as seconds'))return [{seconds:now}];
 if(query.includes('select days, expires_at'))return rows.has(values[0])?[rows.get(values[0])]:[];
 if(query.includes('insert into hashcod_shared.access_periods')){
  const [id,days]=values; const old=rows.get(id);
  if(old&&old.expires_at>now)return [];
  const row={days,expires_at:now+days*86400};rows.set(id,row);return [row];
 }
 if(query.includes('renewal_hash'))return [{renewal_hash:'invalid-fixture-hash'}];
 throw Error('Unexpected query');
}`;
async function main() {
 try {
  require(path.join(build, 'node_modules/esbuild')).buildSync({
    stdin: { contents: mock + source.replace(/^import [^\n]*;\r?\n/, ''), loader: 'ts', resolveDir: build },
    bundle: true, platform: 'node', format: 'cjs', outfile: path.join(temp, 'fixture.cjs'),
  });
  const { accessPeriod, rows, limits, clock } = require(path.join(temp, 'fixture.cjs'));
  if (!globalThis.crypto) globalThis.crypto = crypto.webcrypto;
  const fresh = await accessPeriod('free', { days: 60, expiresAt: 9999999999, paid: true });
  assert.equal(fresh.state, 'active'); assert.equal(fresh.days, 10); assert.equal(fresh.expiresAt, 1000 + 864000);
  assert.equal(Object.hasOwn(fresh, 'paid'), false);
  const original = { ...rows.get(fresh.token.split('.')[0]) };
  const active = await accessPeriod('free', { token: fresh.token, days: 60 });
  assert.equal(active.expiresAt, fresh.expiresAt, 'Repeated free entry must not extend active deadlines');
  clock(fresh.expiresAt + 1);
  const [a, b] = await Promise.all([accessPeriod('free', { token: fresh.token }), accessPeriod('free', { token: fresh.token })]);
  assert.equal(a.token, fresh.token); assert.equal(b.token, fresh.token, 'Renewal must preserve the owner identity');
  assert.equal(a.expiresAt, b.expiresAt); assert(a.expiresAt > original.expires_at);
  await assert.rejects(accessPeriod('free', { token: fresh.token + 'forged' }), e => e.status === 403);
  await assert.rejects(accessPeriod('free', []), e => e.status === 400);
  await assert.rejects(accessPeriod('unknown', {}), e => e.status === 400);
  await assert.rejects(accessPeriod('accept', { token: fresh.token, days: 10 }), e => e.status === 409);
  clock(a.expiresAt + 1);
  await assert.rejects(accessPeriod('accept', { token: fresh.token, days: 30, code: 'random-six-digit-code' }), e => e.status === 403);
  assert(limits.some(([key, limit]) => key.startsWith('period-free|') && limit === 6));
  console.log('Checkout access: server-controlled free duration, stable identity, expiry/concurrency, no paid grant, invalid tokens, renewal-key boundary and rate limit OK');
 } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
