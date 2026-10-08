import { createHmac } from 'node:crypto';
import { describe,it,expect } from 'vitest';
import { canonical,jobSchema,ProofVerifier,safePath } from '../src/schema.js';
import { privateEnvironment } from '../src/runner.js';
const secret = 'a'.repeat(64), now = 1770000000;
const job = () => ({jobId:'test',action:'run',files:[{path:'scripts/probe.coffee',ext:'coffee',content:'module.exports = run: -> 1'}],tool:'probe',lang:'coffee',args:{x:2},timestamp:now,nonce:'a'.repeat(32)});
const sign = (x:unknown) => createHmac('sha256',secret).update(canonical(x)).digest('hex');
describe('private worker boundary',()=>{
  it('canonicalizes nested JSON consistently',()=>expect(canonical({z:[{b:1,a:2}],a:'é'})).toBe('{"a":"é","z":[{"a":2,"b":1}]}'));
  it('rejects replay, expired and wrong-key signed jobs',()=>{
    const proof = new ProofVerifier(secret), payload = job();
    expect(proof.verify(payload,sign(payload),now).jobId).toBe('test');
    expect(()=>proof.verify(payload,sign(payload),now)).toThrow();
    expect(()=>new ProofVerifier(secret).verify(payload,sign(payload),now+61)).toThrow();
    expect(()=>new ProofVerifier('b'.repeat(64)).verify(payload,sign(payload),now)).toThrow();
  });
  it('rejects altered payload and malformed signature',()=>{
    const payload = job();
    expect(()=>new ProofVerifier(secret).verify({...payload,args:{x:3}},sign(payload),now)).toThrow();
    expect(()=>new ProofVerifier(secret).verify(payload,'a',now)).toThrow();
  });
  it('bounds files, names, JSON and total bytes before creation',()=>{
    for (const target of ['/etc/passwd','../x','a/../x','a\\\\b','a//b','C:/secret','__proto__/x','a\0b']) expect(safePath(target)).toBe(false);
    const payload = job();
    expect(jobSchema.safeParse({...payload,tool:'x; sh'}).success).toBe(false);
    expect(jobSchema.safeParse({...payload,files:[{path:'x',ext:'coffee',content:'x'.repeat(1024*1024+1)}]}).success).toBe(false);
    expect(jobSchema.safeParse({...payload,files:Array.from({length:201},(_,i)=>({path:'f'+i,ext:'md',content:''}))}).success).toBe(false);
    expect(jobSchema.safeParse({...payload,files:Array.from({length:17},(_,i)=>({path:'f'+i,ext:'md',content:'x'.repeat(1024*1024)}))}).success).toBe(false);
    expect(jobSchema.safeParse({...payload,args:{x:'x'.repeat(65537)}}).success).toBe(false);
  });
  it('does not inherit supervisor secrets or proxy configuration',()=>{
    process.env.SKILL_CHAT_WORKER_SECRET=secret; process.env.ANTHROPIC_API_KEY='do-not-copy'; process.env.HTTP_PROXY='do-not-copy';
    const env = privateEnvironment('/tmp/output');
    expect(env.SKILL_CHAT_WORKER_SECRET).toBeUndefined(); expect(env.ANTHROPIC_API_KEY).toBeUndefined(); expect(env.HTTP_PROXY).toBeUndefined();
    expect(Object.keys(env)).toEqual(['PATH','HOME','TMPDIR','LANG','TZ','UV_THREADPOOL_SIZE','DART_SUPPRESS_ANALYTICS','PUB_CACHE','DART_DISABLE_ANALYTICS']);
  });
});
