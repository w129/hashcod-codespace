'use strict';
// Runs against the isolated CI PostgreSQL service, never production.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const postgres=require('postgres'),esbuild=require('../../center-empty-state-build/node_modules/esbuild');
if(!process.env.HASHCOD_TEST_POSTGRES_URL)throw Error('Isolated test database URL required');
const sql=postgres(process.env.HASHCOD_TEST_POSTGRES_URL,{max:8,prepare:false});
const owner=crypto.randomUUID(),admin=crypto.randomUUID(),other=crypto.randomUUID();
const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
const mac=async value=>crypto.createHmac('sha256','fixture-only-hmac-key').update(value).digest('hex');
const core={sql,fail,mac,equal:(a,b)=>a===b,json:(v,status=200)=>Response.json(v,{status}),rate:async()=>{},
 openTicket:async t=>{if(t!=='admin-fixture')fail(403,'Admin required');return {kind:'tokenization-admin',period:admin,revision:'fixture'};},fileId:v=>v,code:v=>v};
const modules={};
function load(name){if(modules[name])return modules[name];const module={exports:{}};const source=esbuild.transformSync(fs.readFileSync('supabase/functions/hashcod-shared-cloud/'+name,'utf8'),{loader:'ts',format:'cjs'}).code;
 vm.runInNewContext(source,{module,exports:module.exports,require:p=>p==='./core.ts'?core:load(p.replace('./','')),crypto:crypto.webcrypto,TextEncoder,Uint32Array,Uint8Array,Response,Request,URL,Date,console,Deno:{serve:fn=>{modules.handler=fn;}}});return modules[name]=module.exports;}
(async()=>{try{
 await sql.unsafe(`create schema hashcod_shared;
 create role anon; create role authenticated;
 create table hashcod_shared.rate_limits(key text primary key,started timestamptz,attempts integer);
 create table hashcod_shared.access_periods(id uuid primary key,days integer,expires_at bigint);
 create table hashcod_shared.tokenization_config(id integer primary key,revision text);
 insert into hashcod_shared.tokenization_config values(1,'fixture');
 create table hashcod_shared.tokenization_requests(id uuid default gen_random_uuid() primary key,period_id uuid,file_id text,file_name text,mime text,size bigint,price_usd_cents integer,phone text,email text,status text default 'pending',created_at timestamptz default now(),unique(period_id,file_id));
 create table hashcod_shared.files(id text primary key,name text,mime text,size bigint,price_usd_cents integer,code_hash text,status text);`);
 await sql.unsafe(fs.readFileSync('supabase/migrations/20261009005822_pro_subscription_access.sql','utf8'));
 const {subscription,subscriptionStatus,requirePro}=load('subscription.ts');
 const req=new Request('https://fixture.invalid',{method:'POST',headers:{'x-forwarded-for':'fixture-test'}});
 const issue=async(target=owner,plan='monthly')=>(await subscription('issue',admin,{adminTicket:'admin-fixture',reference:target,plan},req)).json();
 const redeem=async(code,target=owner)=>(await subscription('redeem',target,{code},req)).json();
 await assert.rejects(requirePro(owner),e=>e.status===403);
 await assert.rejects(subscription('issue',admin,{reference:owner,plan:'monthly'},req),e=>e.status===403);
 await assert.rejects(subscription('issue',other,{adminTicket:'admin-fixture',reference:owner,plan:'monthly'},req),e=>e.status===403);
 const first=await issue();assert.match(first.code,/^\d{6}$/);assert.equal(first.reference,owner);
 assert.equal((await subscriptionStatus(owner)).tier,'free','Issuing a code must not grant Pro');
 const stored=(await sql`select code_hash from hashcod_shared.subscription_codes where period_id=${owner}`)[0];assert.notEqual(stored.code_hash,first.code);assert.equal(stored.code_hash,await mac('subscription|'+owner+'|'+first.code));
 await assert.rejects(redeem(first.code,other),e=>e.status===403);
 await assert.rejects(redeem('invalid'),e=>e.status===400);
 const valid=await redeem(first.code);assert.equal(valid.subscription.tier,'pro');assert.equal(valid.subscription.monthlyRequests,25);
 const now=Date.now()/1000;assert(valid.subscription.expiresAt>now+27*86400&&valid.subscription.expiresAt<now+32*86400);
 await assert.rejects(redeem(first.code),e=>e.status===403);
 const expired=await issue();await sql`update hashcod_shared.subscription_codes set expires_at=now()-interval '1 second' where period_id=${owner} and consumed_at is null`;
 await assert.rejects(redeem(expired.code),e=>e.status===403);
 await sql`delete from hashcod_shared.rate_limits`;
 const old=await issue(),replacement=await issue();assert.notEqual(old.code,replacement.code);
 await assert.rejects(redeem(old.code),e=>e.status===403);
 const concurrent=await Promise.allSettled([redeem(replacement.code),redeem(replacement.code)]);
 assert.equal(concurrent.filter(r=>r.status==='fulfilled').length,1,'Only one redemption may win');
 const year=await issue(other,'yearly');const yearly=await redeem(year.code,other);assert(yearly.subscription.expiresAt>now+364*86400);
 await sql`update hashcod_shared.subscriptions set expires_at=now()-interval '1 second' where period_id=${other}`;await assert.rejects(requirePro(other),e=>e.status===403);
 const locked=crypto.randomUUID(),lockCode=await issue(locked);for(let i=0;i<6;i++)await assert.rejects(redeem('bad',locked),e=>e.status===400);await assert.rejects(redeem(lockCode.code,locked),e=>e.status===429);
 await sql`delete from hashcod_shared.rate_limits`;
 const {tokenization}=load('tokenization.ts');const token=owner+'.'+await mac('period|'+owner);
 const contact={token,phone:'+1 809 555 1234',email:'fixture@example.test',code:'file-fixture'};
 for(let i=0;i<27;i++){const id='fv_fixture'+i;await sql`insert into hashcod_shared.files(id,name,mime,size,code_hash,status) values(${id},'fixture.py','text/plain',1,${await mac('code|'+id+'|file-fixture')},'ready')`;}
 for(let i=0;i<24;i++)await tokenization('submit',req,{...contact,id:'fv_fixture'+i});
 const quota=await Promise.allSettled([tokenization('submit',req,{...contact,id:'fv_fixture24'}),tokenization('submit',req,{...contact,id:'fv_fixture25'})]);
 assert.equal(quota.filter(r=>r.status==='fulfilled').length,1,'Concurrent submissions must respect 25 limit');
 assert.equal(quota.find(r=>r.status==='rejected').reason.status,429);
 await tokenization('submit',req,{...contact,id:'fv_fixture0'});assert.equal(Number((await sql`select count(*) as n from hashcod_shared.tokenization_requests`)[0].n),25);
 await sql`update hashcod_shared.tokenization_requests set created_at=date_trunc('month',now())-interval '1 day'`;
 await tokenization('submit',req,{...contact,id:'fv_fixture26'});
 await assert.rejects(tokenization('submit',req,{...contact,token:other+'.'+await mac('period|'+other),id:'fv_fixture26'}),e=>e.status===403);
 load('index.ts');
 for(const action of ['state','state.read','files.prepare','files.complete','files.download','files.delete']) {
   const denied=await modules.handler(new Request('https://fixture.invalid?action='+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:other+'.'+await mac('period|'+other),paid:true,subscription:{tier:'pro'}})}));
   assert.equal(denied.status,403,'Direct Edge '+action+' must deny expired/free entitlement');
 }
 const privateTables=await sql`select relname,relrowsecurity from pg_class where relname in ('subscriptions','subscription_codes')`;assert(privateTables.every(r=>r.relrowsecurity));
 console.log('Actual PostgreSQL: admin boundary, owner binding, HMAC-only storage, one use, expiry, replacement, concurrent redemption, paid terms, free/expired denial, persistent guessing limit, concurrent 25/month quota, retry and monthly reset OK');
 }finally{await sql.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
