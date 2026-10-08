# Build context is repository root. Compilers are pinned and hash-verified.
FROM node:24.21.0-bookworm-slim AS build
WORKDIR /source
RUN corepack enable
COPY skill-chat/package.json skill-chat/pnpm-lock.yaml skill-chat/pnpm-workspace.yaml skill-chat/tsconfig.base.json ./
COPY skill-chat/apps/worker ./apps/worker
RUN pnpm install --frozen-lockfile --filter @hashcod/skill-worker...
RUN pnpm --filter @hashcod/skill-worker build
RUN pnpm --filter @hashcod/skill-worker deploy --prod --legacy /deployed

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 libseccomp2 ca-certificates xz-utils && rm -rf /var/lib/apt/lists/*
COPY skill-chat/apps/worker/isolation/fetch-runtimes.py /tmp/fetch-runtimes.py
RUN python3 /tmp/fetch-runtimes.py && rm /tmp/fetch-runtimes.py
COPY skill-chat/apps/worker/runtime/lock-exec.c /tmp/lock-exec.c
RUN apt-get update && apt-get install -y --no-install-recommends gcc libc6-dev libseccomp-dev \
    && mkdir -p /opt/runtime/hashcod \
    && gcc -O2 -Wall -Wextra -Werror -fPIC -shared /tmp/lock-exec.c -lseccomp -o /opt/runtime/hashcod/lock-exec.so \
    && gcc -O2 -Wall -Wextra -Werror -Wno-unused-parameter -fPIC -shared -DHASHCOD_NODE -I/opt/runtime/node/include/node /tmp/lock-exec.c -lseccomp -o /opt/runtime/hashcod/lock-exec.node \
    && rm /tmp/lock-exec.c && apt-get purge -y gcc libc6-dev libseccomp-dev \
    && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*
COPY --from=build /deployed /opt/skill-worker
COPY skill-chat/apps/worker/test/fixtures /opt/skill-worker/test/fixtures
COPY skill-chat/apps/worker/isolation/launch.py /opt/skill-worker/isolation/launch.py
COPY skill-chat/apps/worker/runtime /opt/runtime/hashcod
RUN groupadd -g 53219 skillworker && useradd -u 53219 -g 53219 --no-create-home --shell /usr/sbin/nologin skillworker && chmod -R a-w /opt/runtime /opt/skill-worker
ENV PORT=8080 SKILL_CHAT_WORKER_ROOT=/opt/skill-worker
WORKDIR /opt/skill-worker
USER 53219:53219
EXPOSE 8080
CMD ["/opt/runtime/node/bin/node","dist/server.js"]
