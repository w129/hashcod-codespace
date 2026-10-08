import { randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";
import { runJob } from "./runner.js";
import type { Job } from "./schema.js";
const job = (
  lang: "coffee" | "dart",
  content: string,
  action: "run" | "compile" = "run",
): Job => ({
  jobId: "readiness-" + randomBytes(8).toString("hex"),
  action,
  lang,
  tool: "probe",
  args: { value: 7 },
  files: [{ path: "scripts/probe." + lang, ext: lang, content }],
  timestamp: Math.floor(Date.now() / 1000),
  nonce: randomBytes(16).toString("hex"),
});
export async function readiness(): Promise<void> {
  if (process.getuid?.() !== 53219) throw new Error("dedicated UID required");
  const coffee = "module.exports = run: (args) ->\n  {value: args.value + 1}\n";
  const dart =
    'class ProbeTool { Map<String,dynamic> run(Map<String,dynamic> args) => {"value": args["value"] + 1}; }';
  for (const [lang, content] of [
    ["coffee", coffee],
    ["dart", dart],
  ] as const) {
    const result = await runJob(job(lang, content));
    if (!result.ok || result.stdout !== '{"value":8}')
      throw new Error(
        lang + " execution/isolation readiness failed: " + result.stderr,
      );
  }
  const hostile = `fs = require 'node:fs'\nmodule.exports =\n  run: ->\n    blocked = []\n    for target in ['/etc/passwd', '/proc/self/environ', '/proc/self/mem', '/opt/skill-worker/dist/server.js']\n      try\n        fs.readFileSync target\n        blocked.push false\n      catch\n        blocked.push true\n    try\n      fs.writeFileSync 'scripts/probe.coffee', 'changed'\n      blocked.push false\n    catch\n      blocked.push true\n    try\n      require('node:child_process').execFileSync '/bin/sh', ['-c', 'true']\n      blocked.push false\n    catch\n      blocked.push true\n    try\n      require('node:child_process').execFileSync '/lib64/ld-linux-x86-64.so.2', ['/bin/sh', '-c', 'true']\n      blocked.push false\n    catch\n      blocked.push true\n    try\n      process.kill process.ppid, 'SIGTERM'\n      blocked.push false\n    catch\n      blocked.push true\n    {blocked: blocked.every((v) -> v), secret: process.env.SKILL_CHAT_WORKER_SECRET ? null}\n`;
  const attacks = await runJob(job("coffee", hostile));
  if (!attacks.ok || attacks.stdout !== '{"blocked":true,"secret":null}')
    throw new Error("filesystem/process/secret isolation readiness failed");
  const network = `module.exports = run: ->\n  new Promise (resolve) ->\n    socket = require('node:net').connect 80, '127.0.0.1'\n    socket.on 'error', (error) -> resolve {blocked: error.code in ['EPERM', 'EACCES']}\n    socket.on 'connect', -> resolve {blocked: false}\n`;
  const net = await runJob(job("coffee", network));
  if (!net.ok || net.stdout !== '{"blocked":true}')
    throw new Error("network isolation readiness failed");
  const analyzed = await runJob(job("dart", dart, "compile"));
  if (!analyzed.ok)
    throw new Error("Dart analyzer readiness failed: " + analyzed.stderr);
}
export async function hostileTests(): Promise<void> {
  await readiness();
  for (const lang of ["coffee", "dart"] as const) {
    const content = await readFile(new URL(`../test/fixtures/check_safe.${lang}`, import.meta.url), "utf8");
    const generated = job(lang, content);
    generated.tool = "check_safe";
    generated.files[0].path = `scripts/check_safe.${lang}`;
    generated.args = {text:"Contenido español",enabled:true,count:2,data:{ok:true}};
    const compiled = await runJob({...generated, action:"compile"});
    if (!compiled.ok) throw new Error(`Generated ${lang} fixture did not compile: ${compiled.stderr} ${compiled.stdout}`);
    const executed = await runJob(generated);
    if (!executed.ok || JSON.parse(executed.stdout).ok !== true) throw new Error(`Generated ${lang} fixture did not execute`);
  }
  const badSyntax = await runJob(
    job("coffee", "module.exports = -> ???", "compile"),
  );
  if (badSyntax.ok) throw new Error("Invalid CoffeeScript compiled");
  const infinite = await runJob(
    job("coffee", "module.exports = run: ->\n  loop\n    1"),
  );
  if (infinite.ok || infinite.durationMs > 6500)
    throw new Error("Timeout not enforced");
  const flood = await runJob(
    job(
      "coffee",
      `module.exports = run: ->\n  loop\n    process.stdout.write 'x'.repeat(8192)\n`,
    ),
  );
  if (
    flood.ok ||
    flood.stdout.length > 65536 ||
    !flood.stderr.includes("limit")
  )
    throw new Error("Output cap not enforced");
  const dartHostile = `import 'dart:io';\nclass ProbeTool { Map<String,dynamic> run(Map<String,dynamic> args) { final paths = ['/etc/passwd','/proc/self/environ','/proc/self/mem']; for (final p in paths) { try { File(p).readAsStringSync(); return {'blocked':false}; } catch (_) {} } try { Process.runSync('/bin/sh',['-c','true']); return {'blocked':false}; } catch (_) {} return {'blocked':true,'secret':Platform.environment['SKILL_CHAT_WORKER_SECRET']}; } }`;
  const dart = await runJob(job("dart", dartHostile));
  if (!dart.ok || dart.stdout !== '{"blocked":true,"secret":null}')
    throw new Error("Dart isolation failed: " + dart.stderr);
  const memory = await runJob(
    job(
      "coffee",
      `module.exports = run: ->\n  xs = []\n  loop\n    xs.push Buffer.alloc 32 * 1024 * 1024, 1\n`,
    ),
  );
  if (memory.ok || memory.durationMs > 6500)
    throw new Error("Memory cap not enforced");
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await hostileTests();
  console.log("Skill worker real CoffeeScript/Dart isolation tests passed");
}
