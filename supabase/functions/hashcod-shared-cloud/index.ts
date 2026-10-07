import { sql, json, fail, mac, rate } from './core.ts';
import { files } from './files.ts';
import { sharedState } from './state.ts';
import { accessPeriod } from './period.ts';

// The owner chose a public shared workspace. Account/admin/auth/private data
// has no route here. File reads/deletions require the uploader's stored code.
Deno.serve(async (request: Request) => {
  try {
    if (!['GET', 'POST'].includes(request.method)) fail(405, 'Method not allowed.');
    const action = new URL(request.url).searchParams.get('action') || 'health';
    if (action === 'health') { await sql`select 1`; return json({ ok: true }); }
    if (request.method === 'POST') await rate('request|' + await mac(request.headers.get('x-forwarded-for') || 'unknown'), 90);
    let body = {};
    if (request.method === 'POST') {
      if (Number(request.headers.get('content-length') || 0) > 2097152) fail(413, 'Request too large.');
      const raw = await request.text(); if (new TextEncoder().encode(raw).length > 2097152) fail(413, 'Request too large.');
      try { body = JSON.parse(raw); } catch { fail(400, 'Invalid JSON.'); }
    }
    if (['period.status', 'period.accept'].includes(action)) return await accessPeriod(action.slice(7), body);
    if (action === 'state') return await sharedState(request, body);
    if (action.startsWith('files.')) return await files(action.slice(6), request, body);
    fail(400, 'Unsupported action.');
  } catch (error: any) {
    return json({ ok: false, error: error.status ? error.message : 'Shared cloud is temporarily unavailable.' }, error.status || 503);
  }
});
