'use strict';
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root=path.resolve(__dirname,'../..'), php=process.env.PHP_BIN || 'php';
const keys=['L8_VAULT_MASTER_KEY','L8_ACCESS_GATE_COOKIE_SECRET','L8_COUPON_SIGNING_KEY'];
const guard=fs.readFileSync(path.join(root,'docker-entrypoint.sh'),'utf8').split('# Diagnóstico seguro:')[0];
const env={...process.env,RAILWAY_ENVIRONMENT_ID:'isolated-test-production'};
for(const key of keys) env[key]='synthetic-stable-test-key-at-least-32-characters';
for(const missing of keys){const candidate={...env,[missing]:''};const r=spawnSync('sh',['-s'],{env:candidate,input:guard,encoding:'utf8'});assert.equal(r.status,1);assert(r.stderr.includes(missing));assert(!r.stderr.includes(env.L8_VAULT_MASTER_KEY));}
assert.equal(spawnSync('sh',['-s'],{env,input:guard,encoding:'utf8'}).status,0);
const probe="require 'secrets.php'; try { echo hash('sha256', secretsVaultMasterKey()); } catch (RuntimeException $e) { exit(42); }";
const read=e=>spawnSync(php,['-r',probe],{cwd:root,env:e,encoding:'utf8'});
const first=read(env),second=read(env);assert.equal(first.status,0);assert.equal(first.stdout,second.stdout);assert.equal(first.stdout.length,64);
assert.equal(read({...env,L8_VAULT_MASTER_KEY:''}).status,42,'production never generates an ephemeral vault key');
console.log('PASS: production refuses missing keys, preserves master across processes and never logs values');
