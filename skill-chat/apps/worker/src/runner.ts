import { spawn } from "node:child_process";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { StringDecoder } from "node:string_decoder";
import type { Job, JobResult } from "./schema.js";

const OUTPUT_LIMIT = 65536,
  MEMORY_LIMIT = 256 * 1024 * 1024,
  TIME_LIMIT = 5000;
const RUNTIME = "/opt/runtime";
const NODE = RUNTIME + "/node/bin/node",
  DART = RUNTIME + "/dart/bin/dart";
const WORKER_ROOT = process.env.SKILL_CHAT_WORKER_ROOT ?? "/opt/skill-worker";
const NODE_FLAGS = [
  "--jitless",
  "--max-old-space-size=96",
  "--max-semi-space-size=8",
  "--disable-proto=throw",
];
export const privateEnvironment = (output: string): NodeJS.ProcessEnv => ({
  PATH: RUNTIME + "/node/bin:" + RUNTIME + "/dart/bin",
  HOME: output,
  TMPDIR: output,
  LANG: "C.UTF-8",
  TZ: "UTC",
  UV_THREADPOOL_SIZE: "1",
  DART_SUPPRESS_ANALYTICS: "true",
  PUB_CACHE: output + "/pub-cache",
  DART_DISABLE_ANALYTICS: "true",
});
function clean(text: string, input: string, output: string): string {
  return text
    .replaceAll(input, "/project")
    .replaceAll(output, "/output")
    .replaceAll(WORKER_ROOT, "/worker")
    .replaceAll(RUNTIME, "/runtime")
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "")
    .slice(0, OUTPUT_LIMIT);
}
export async function residentGroupBytes(group: number): Promise<number> {
  let bytes = 0;
  for (const pid of await readdir("/proc")) {
    if (!/^\d+$/.test(pid)) continue;
    try {
      // comm may contain ')', so identify the last close parenthesis.
      const stat = await readFile("/proc/" + pid + "/stat", "utf8");
      const fields = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
      if (Number(fields[2]) === group) bytes += Number(fields[21]) * 4096;
    } catch {
      /* Process exited between enumeration and reading. */
    }
  }
  return bytes;
}
async function execute(
  input: string,
  output: string,
  executable: string,
  argv: string[],
  deadline: number,
  analyzerFiles?: string[],
): Promise<JobResult> {
  const start = performance.now();
  if (performance.now() >= deadline)
    return {
      ok: false,
      stdout: "",
      stderr: "Execution time limit exceeded",
      exitCode: 124,
      durationMs: 0,
    };
  const child = spawn(
    "/usr/bin/python3",
    [
      WORKER_ROOT + "/isolation/launch.py",
      input,
      output,
      RUNTIME,
      executable,
      ...argv,
    ],
    {
      cwd: input,
      env: privateEnvironment(output),
      stdio: [analyzerFiles ? "pipe" : "ignore", "pipe", "pipe"],
      detached: true,
      shell: false,
    },
  );
  let stdout = Buffer.alloc(0),
    stderr = Buffer.alloc(0),
    reason = "",
    exited = false,
    measuring = false;
  const stop = (message: string) => {
    if (!reason) reason = message;
    if (child.pid) {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {}
    }
  };
  const collect = (kind: "stdout" | "stderr", chunk: Buffer) => {
    const current = kind === "stdout" ? stdout : stderr;
    if (current.length + chunk.length > OUTPUT_LIMIT) {
      stop("Output limit exceeded");
      return;
    }
    if (kind === "stdout") stdout = Buffer.concat([stdout, chunk]);
    else stderr = Buffer.concat([stderr, chunk]);
  };
  const protocolDecoder = new StringDecoder("utf8");
  child.stdin?.on("error", () => stop("Analyzer unavailable"));
  let protocolBuffer = "",
    protocolBytes = 0,
    protocolPending = 0,
    protocolDone = false,
    protocolFailed = false;
  const issues: { path: string; message: string }[] = [];
  const send = (id: string, method: string, params?: unknown) =>
    child.stdin?.write(
      JSON.stringify({ id, method, ...(params ? { params } : {}) }) + "\n",
    );
  child.stdout!.on("data", (chunk: Buffer) => {
    if (!analyzerFiles) {
      collect("stdout", chunk);
      return;
    }
    protocolBytes += chunk.length;
    if (protocolBytes > OUTPUT_LIMIT) {
      stop("Analyzer output limit exceeded");
      return;
    }
    protocolBuffer += protocolDecoder.write(chunk);
    let newline;
    while ((newline = protocolBuffer.indexOf("\n")) >= 0) {
      const line = protocolBuffer.slice(0, newline);
      protocolBuffer = protocolBuffer.slice(newline + 1);
      let event: Record<string, any>;
      try {
        event = JSON.parse(line);
      } catch {
        stop("Invalid analyzer result");
        return;
      }
      if (event.event === "server.connected")
        send("roots", "analysis.setAnalysisRoots", {
          included: [input],
          excluded: [],
        });
      if (event.id === "roots") {
        if (event.error) {
          protocolFailed = true;
          send("shutdown", "server.shutdown");
        } else {
          protocolPending = analyzerFiles.length;
          analyzerFiles.forEach((file, i) =>
            send("errors-" + i, "analysis.getErrors", {
              file: path.join(input, file),
            }),
          );
        }
      }
      if (typeof event.id === "string" && event.id.startsWith("errors-")) {
        if (event.error) protocolFailed = true;
        const file = analyzerFiles[Number(event.id.slice(7))];
        for (const error of event.result?.errors ?? [])
          if (error.severity === "ERROR" || error.severity === "WARNING")
            issues.push({
              path: file,
              message: clean(String(error.message), input, output).slice(
                0,
                2048,
              ),
            });
        if (--protocolPending === 0) send("shutdown", "server.shutdown");
      }
      if (event.id === "shutdown") {
        protocolDone = true;
        child.stdin?.end();
      }
    }
  });
  child.stderr!.on("data", (chunk) => collect("stderr", chunk));
  const memory = setInterval(async () => {
    if (measuring || exited || !child.pid) return;
    measuring = true;
    try {
      if ((await residentGroupBytes(child.pid)) > MEMORY_LIMIT)
        stop("Memory limit exceeded");
    } catch {
      stop("Memory enforcement unavailable");
    } finally {
      measuring = false;
    }
  }, 10);
  const timeout = setTimeout(
    () => stop("Execution time limit exceeded"),
    Math.max(1, deadline - performance.now()),
  );
  return await new Promise((resolve) => {
    const complete = (exitCode: number) => {
      if (exited) return;
      exited = true;
      clearInterval(memory);
      clearTimeout(timeout);
      // Kill descendants even if the direct process exited successfully.
      if (child.pid) {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {}
      }
      if (analyzerFiles) {
        stdout = Buffer.from(JSON.stringify({ issues }));
        if (!protocolDone || protocolFailed || issues.length) exitCode = 1;
      }
      resolve({
        ok: exitCode === 0 && !reason,
        stdout: clean(stdout.toString("utf8"), input, output),
        stderr: reason || clean(stderr.toString("utf8"), input, output),
        exitCode: reason ? 124 : exitCode,
        durationMs: Math.round(performance.now() - start),
      });
    };
    child.once("error", () => complete(125));
    child.once("close", (code) => complete(code ?? 125));
  });
}
export async function runJob(job: Job): Promise<JobResult> {
  const started = performance.now(),
    deadline = started + TIME_LIMIT;
  const directory = await mkdtemp("/tmp/skill-chat-job-"),
    input = directory + "/input",
    output = directory + "/output";
  const result = (value: JobResult): JobResult => ({
    ...value,
    durationMs: Math.round(performance.now() - started),
  });
  try {
    await mkdir(input, { mode: 0o700 });
    await mkdir(output, { mode: 0o700 });
    for (const file of job.files) {
      if (file.path.split("/").some((x) => x.startsWith(".hashcod-worker-")))
        throw new Error("Reserved path");
      const target = path.join(input, file.path);
      await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
      await mkdir(path.dirname(path.join(output, file.path)), {
        recursive: true,
        mode: 0o700,
      });
      await writeFile(target, file.content, { flag: "wx", mode: 0o400 });
    }
    const manifest = input + "/.hashcod-worker-manifest.json";
    await writeFile(
      manifest,
      JSON.stringify({
        input,
        output,
        files: job.files.map(({ path, ext }) => ({ path, ext })),
      }),
      { flag: "wx", mode: 0o400 },
    );
    const coffee = job.files.filter((x) => x.ext === "coffee");
    if (coffee.length) {
      const compiled = await execute(
        input,
        output,
        NODE,
        [...NODE_FLAGS, RUNTIME + "/hashcod/compile.cjs", manifest],
        deadline,
      );
      // Trusted wrappers are readable through the runtime-only mounted directory.
      if (!compiled.ok && compiled.exitCode !== 1) return result(compiled);
      let parsed: { issues: { path: string; message: string }[] };
      try {
        parsed = JSON.parse(compiled.stdout);
      } catch {
        return result({
          ...compiled,
          ok: false,
          exitCode: 125,
          stderr: "Invalid compiler result",
        });
      }
      if (parsed.issues?.length)
        return result({
          ...compiled,
          ok: false,
          exitCode: 1,
          issues: parsed.issues,
        });
      for (const file of coffee) {
        const generated = await readFile(path.join(output, file.path + ".cjs"));
        if (generated.length > 2 * 1024 * 1024)
          throw new Error("Compiled output exceeds limit");
        await writeFile(path.join(input, file.path + ".cjs"), generated, {
          flag: "wx",
          mode: 0o400,
        });
      }
    }
    if (job.action === "compile") {
      // Each Dart file is analyzed by the actual offline SDK; no pub get/network.
      const dart = job.files.filter((x) => x.ext === "dart");
      if (dart.length) {
        const analyzed = await execute(
          input,
          output,
          RUNTIME + "/dart/bin/dartaotruntime",
          [
            RUNTIME + "/dart/bin/snapshots/analysis_server_aot.dart.snapshot",
            "--disable-server-feature-completion",
            "--disable-server-feature-search",
          ],
          deadline,
          dart.map((f) => f.path),
        );
        try {
          const details = JSON.parse(analyzed.stdout) as {
            issues?: { path: string; message: string }[];
          };
          return result({ ...analyzed, issues: details.issues });
        } catch {
          return result(analyzed);
        }
      }
      return result({
        ok: true,
        stdout: "Compilation completed",
        stderr: "",
        exitCode: 0,
        durationMs: 0,
      });
    }
    const selected = job.files.find(
      (x) =>
        x.path === "scripts/" + job.tool + "." + job.lang ||
        x.path === job.tool + "." + job.lang,
    );
    if (!selected)
      return result({
        ok: false,
        stdout: "",
        stderr: "Selected tool file is unavailable",
        exitCode: 1,
        durationMs: 0,
      });
    if (job.lang === "coffee") {
      const runManifest = input + "/.hashcod-worker-run.json";
      await writeFile(
        runManifest,
        JSON.stringify({
          compiled: path.join(input, selected.path + ".cjs"),
          args: job.args ?? {},
        }),
        { flag: "wx", mode: 0o400 },
      );
      return result(
        await execute(
          input,
          output,
          NODE,
          [...NODE_FLAGS, RUNTIME + "/hashcod/run-coffee.cjs", runManifest],
          deadline,
        ),
      );
    }
    const className =
      job
        .tool!.split("_")
        .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
        .join("") + "Tool";
    const wrapper = input + "/.hashcod-worker-run.dart";
    const argsFile = input + "/.hashcod-worker-args.json";
    await writeFile(argsFile, JSON.stringify(job.args ?? {}), {
      flag: "wx",
      mode: 0o400,
    });
    const relative = "./" + selected.path;
    await writeFile(
      wrapper,
      `import 'dart:convert';\nimport 'dart:io';\nimport '${relative}' as tool;\nFuture<void> main(List<String> argv) async {\n  final args = Map<String,dynamic>.from(jsonDecode(File(argv.single).readAsStringSync()));\n  final result = await Future.value(tool.${className}().run(args));\n  stdout.write(jsonEncode(result));\n}\n`,
      { flag: "wx", mode: 0o400 },
    );
    return result(
      await execute(
        input,
        output,
        DART,
        ["--disable-dart-dev", wrapper, argsFile],
        deadline,
      ),
    );
  } catch {
    return result({
      ok: false,
      stdout: "",
      stderr: "Sandbox job failed safely",
      exitCode: 125,
      durationMs: 0,
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
