'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const esbuild=require('../../center-empty-state-build/node_modules/esbuild');
(async()=>{
 const pair=crypto.generateKeyPairSync('ed25519'),publicKey=pair.publicKey.export({format:'der',type:'spki'}).subarray(-32).toString('base64');
 const nonces=new Set(),owner='11111111-1111-4111-8111-111111111111';let expired=false,revoked=false;
 const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
 const sql=async(parts,...values)=>{
  const q=parts.join('?');
  if(q.includes('review_keyring'))return revoked?[]:[{public_key:publicKey}];
  if(q.includes('insert into hashcod_shared.review_nonces')){if(nonces.has(values[1]))return [];nonces.add(values[1]);return[{nonce:values[1]}];}
  if(q.includes('delete from hashcod_shared.review_nonces'))return[];
  if(q.includes('access_periods'))return expired?[]:[{expires_at:Math.floor(Date.now()/1000)+600}];
  throw Error('Unexpected SQL');
 };
 const core={sql,json:v=>Response.json(v),fail,rate:async()=>{}};
 const module={exports:{}};
 vm.runInNewContext(esbuild.transformSync(fs.readFileSync('supabase/functions/hashcod-shared-cloud/editor-identity.ts','utf8'),{loader:'ts',format:'cjs'}).code,{module,exports:module.exports,require:p=>p==='./core.ts'?core:p==='./subscription.ts'?{requirePro:async()=>{},subscriptionStatus:async()=>({tier:'pro',expiresAt:9999999999})}:{activePeriod:async token=>{if(token!=='owned'||expired)fail(403,'Invalid period');return owner;}},crypto:crypto.webcrypto,TextEncoder,Uint8Array,Response,Date,atob,Number});
 const {editorIdentity,canonicalEditor}=module.exports,request=new Request('https://example.test',{method:'POST'});
 const sign=(data={token:'owned'},extra={},domain='hashcod.skill-chat.identity.v1\0')=>{const payload={data,key_id:'skill-chat-backend-v1',nonce:crypto.randomBytes(16).toString('hex'),timestamp:Math.floor(Date.now()/1000),...extra};return{...payload,signature:crypto.sign(null,Buffer.from(domain+canonicalEditor(payload)),pair.privateKey).toString('base64')};};
 const good=sign();assert.equal((await (await editorIdentity(request,good)).json()).owner,owner);
 await assert.rejects(editorIdentity(request,good),e=>e.status===409);
 for(const value of [{},sign({token:'owned',owner}),sign({token:'owned'},{timestamp:0}),sign({token:'owned'},{nonce:'bad'}),sign({token:'owned'},{key_id:'review-backend-v1'}),sign({token:'owned'}, {},'hashcod.review.bridge.v1\n')])await assert.rejects(editorIdentity(request,value),e=>e.status===403);
 const tampered=sign();tampered.data.token='other';await assert.rejects(editorIdentity(request,tampered),e=>e.status===403);
 await assert.rejects(editorIdentity(request,sign({token:'other'})),e=>e.status===403);
 expired=true;await assert.rejects(editorIdentity(request,sign()),e=>e.status===403);expired=false;
 revoked=true;await assert.rejects(editorIdentity(request,sign()),e=>e.status===403);
 await assert.rejects(editorIdentity(new Request('https://example.test'),sign()),e=>e.status===405);
 console.log('Skill editor Edge: Ed25519, domain separation, replay, tampering, expiry, revoked key and trusted ownership OK');
})().catch(e=>{console.error(e);process.exitCode=1;});
