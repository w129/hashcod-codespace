import Fastify from 'fastify';
import { readiness } from './selftest.js';
import { runJob } from './runner.js';
import { ProofVerifier } from './schema.js';
const proof = new ProofVerifier(process.env.SKILL_CHAT_WORKER_SECRET ?? '');
const server = Fastify({logger:false,bodyLimit:20*1024*1024,requestTimeout:10000,connectionTimeout:10000,keepAliveTimeout:5000});
let busy = false;
const requests: number[] = [];
server.get('/healthz',async ()=>({ok:true,scope:'isolated-coffee-dart'}));
server.post('/v1/jobs',async (request,reply)=>{
  let job;
  try { job = proof.verify(request.body,request.headers['x-hashcod-worker-signature']); }
  catch { return reply.code(403).send({ok:false,error:'Job authorization rejected'}); }
  const now = Date.now(); while(requests.length && requests[0]!<now-60000) requests.shift();
  if (busy || requests.length >= 30) return reply.code(429).send({ok:false,error:'Worker is busy'});
  busy = true; requests.push(now);
  try { return await runJob(job); }
  finally { busy = false; }
});
server.setErrorHandler((_error,_request,reply)=>reply.code(400).send({ok:false,error:'Invalid worker request'}));
try {
  await readiness();
  await server.listen({host:'::',port:Number(process.env.PORT ?? 8080)});
  console.log('Skill worker ready: real CoffeeScript, Dart and mandatory Linux isolation passed');
} catch(error) {
  // Launch readiness reasons are fixed strings; do not log a job, environment, or provider key.
  console.error('Skill worker readiness failed: '+(error instanceof Error ? error.message : 'unavailable'));
  process.exit(1);
}
