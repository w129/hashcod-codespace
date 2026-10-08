# Private Skill Chat worker

No public domain. Private IPv6 HTTP port 8080, `/healthz` and HMAC-authenticated
`POST /v1/jobs` only. `SKILL_CHAT_WORKER_SECRET` must contain at least 32 random
bytes and is shared only with the API supervisor. No database/JWT/AI/signing key
belongs on this service. HMAC-SHA256 covers sorted-key canonical compact JSON;
proof timestamp has a ±60 second window and nonce is single-use for 120 seconds.
Only one job runs; at most 30 authorized jobs/minute. Guests inherit an explicit
minimal environment, never the supervisor environment, and cannot read other process data. Only their own `/proc/self/maps` and `/proc/self/statm` inodes are readable for glibc stack discovery and Dart RSS counters; environment, memory, file descriptors and other PIDs remain blocked.

Linux x86_64, **Landlock ABI >=3, libseccomp and dedicated UID 53219 are mandatory**.
Unsupported kernels stop the service before a health endpoint is exposed. There
is no Node VM isolation substitute and no permissive execution fallback. Railway
has no Docker daemon, so the isolated child uses inherited kernel restrictions
inside a secretless dedicated worker container instead of nested Docker. Startup
executes actual CoffeeScript and Dart tools, the Dart analyzer, and hostile file,
process, parent-signal, environment and networking probes before readiness.

Files are read-only within each private job input tree. Writable temporary output
is confined to that job. Landlock grants execution only to pinned Node and Dart
SDK binaries and their exact ELF loader. Before user code runs, the trusted CoffeeScript/Dart wrapper installs a second inherited seccomp filter denying all `execve`/`execveat`, including indirect loader execution. Shell, Python, package managers and uploaded binaries cannot be launched.
Seccomp denies network sockets, namespace changes, process-memory access, parent
signals, process-group escape, ownership/mode changes, io_uring and privileged
kernel interfaces. Process groups are always killed on completion/error/timeout;
then the supervisor removes the full job directory. Native helper threads/processes
share the dedicated UID process ceiling 32. Code cannot detach into another group.
No download, package resolution or arbitrary command is available during a job.

Jobs have **five seconds total**, output 64 KiB per stream, CPU 5 seconds per
process, one-core affinity, 256 MiB anonymous data mappings and an independent
**256 MiB aggregate process-group resident memory ceiling**, sampled every 10 ms.
Native V8/Dart reserve virtual address ranges; virtual address limit is 8 GiB,
which does not grant resident memory. V8 runs in `--jitless` mode (required for DATA256MiB; native V8 JIT CodeRange exceeds this bound), old-space is 96 MiB, semi-space 8 MiB.
Dart uses a 96 MiB old-generation heap, single-task GC and deterministic mode (one native IO worker); glibc is restricted to one allocation arena to keep native thread reservations within the DATA ceiling.
The resident monitor kills the group upon a breach (up to one sample interval);
it is not a delegated per-job cgroup. Deploy worker service with resource limits
and at most 0.5 CPU if the platform supports fractional quotas. Compiler/run cold
start is included in the five-second wall limit, so oversized projects may time
out and return an explicit error. Node/Dart compilation is offline: dependencies
must exist in uploaded sources or SDK; `pub get`/npm install are never run.

Build context repository root:

```sh
docker build -f skill-chat/apps/worker/Dockerfile -t hashcod-skill-worker .
docker run --rm --network none --cap-drop ALL --security-opt no-new-privileges \
  --memory 2g --cpus 0.5 -e SKILL_CHAT_WORKER_SECRET=ci-test-not-a-production-secret-32 \
  hashcod-skill-worker /opt/runtime/node/bin/node dist/selftest.js
```

`pnpm --filter @hashcod/skill-worker test` checks HMAC/schema/environment, while
`dist/selftest.js` is the **real** compiler/isolation hostile integration suite.
It must pass under Linux/Docker CI before deployment. Local environments with
Landlock unavailable may run boundary tests but cannot prove isolation readiness.

Pinned primary artifacts, verified before extraction by build-time code:

- Node 24.21.0 official `nodejs.org/dist/v24.21.0/SHASUMS256.txt`:
  `fd8e59d5a511510f6a298afb548f18c7d2b1be404d8b4a27d94fbe49f56cb2d6`.
- Dart stable 3.13.5 official `storage.googleapis.com/dart-archive/.../3.13.5/sdk/`
  SHA-256 `ea864bc64df30a6b8bdf30b2e32550f7717d9a890de8f40293aeabb924fe232b`.
- CoffeeScript 2.7.0 official npm package SHA-512 SRI
  `hzWp6TUE2d/jCcN67LrW1eh5b/rSDKQK6oD6VMLlggYVUUFexgTH9z3dNYihzX4RMhze5FTUsUmOXViJKFQR/A==`.

Coffeescript modules must export `run(args)`. Dart generated classes use
`CamelCaseTool().run(Map<String,dynamic>)`; outputs serialize as JSON. User-edited
files retaining incompatible interfaces fail visibly rather than running a
replacement. Source and diagnostic output are returned as text and bounded;
the browser must render them using text nodes, never HTML.
