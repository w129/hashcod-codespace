#!/usr/bin/env node
'use strict';
// Fails when tracked files contain runtime state or recognisable credentials.
// Usage: node scripts/check_secrets.js
const { execFileSync } = require('child_process');
const fs = require('fs');

const FORBIDDEN_PATHS = [/^data_storage\//, /(^|\/)\.env$/, /\.(pem|key|p12|pfx)$/i, /(^|\/)vault\.enc$/];
const PATTERNS = [
    ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
    ['GitHub fine-grained token', /\bgithub_pat_[A-Za-z0-9_]{50,}\b/],
    ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
    ['Private key block', /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/],
    ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{20,}\b/],
    ['Provider API key', /\bsk-[A-Za-z0-9_-]{32,}\b/],
    ['Supabase service JWT', /\beyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{20,}\b/],
];
// Synthetic fixtures used by redaction tests (obvious placeholder sequences).
const ALLOWED_FIXTURES = /(abcdefghijklmnopqrstuvwxyz|1234567890abcdef|0123456789|synthetic|fixture|example|0{12,}|A{6,}|b{20,})/i;
const SKIP_DIRS = /^(engines|toolkit|node_modules)\//;
const MAX_BYTES = 2 * 1024 * 1024;

const files = execFileSync('git', ['ls-files', '-z'], { maxBuffer: 64 * 1024 * 1024 })
    .toString('utf8').split('\0').filter(Boolean);

const problems = [];
for (const file of files) {
    if (FORBIDDEN_PATHS.some((re) => re.test(file))) problems.push(`${file}: forbidden tracked runtime/secret file`);
    if (SKIP_DIRS.test(file)) continue;
    let text;
    try {
        if (fs.statSync(file).size > MAX_BYTES) continue;
        text = fs.readFileSync(file, 'utf8');
    } catch (_) { continue; }
    if (text.includes('\u0000')) continue;
    text.split('\n').forEach((line, i) => {
        for (const [name, re] of PATTERNS) {
            const m = line.match(re);
            if (m && !ALLOWED_FIXTURES.test(m[0])) problems.push(`${file}:${i + 1}: possible ${name}`);
        }
    });
}

if (problems.length) {
    console.error('Secret scan failed (values are intentionally not printed):');
    problems.forEach((p) => console.error('  ' + p));
    process.exit(1);
}
console.log(`Secret scan passed (${files.length} tracked files).`);
