FROM node:24-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm install -g pnpm@11.25.0
WORKDIR /app/skill-chat
COPY skill-chat/package.json skill-chat/pnpm-lock.yaml skill-chat/pnpm-workspace.yaml skill-chat/turbo.json skill-chat/tsconfig.base.json ./
COPY skill-chat/packages/core ./packages/core
COPY skill-chat/apps/api ./apps/api
COPY skill-chat/apps/worker/package.json ./apps/worker/package.json
RUN pnpm install --frozen-lockfile && pnpm --filter @hashcod/skill-core build && pnpm --filter @hashcod/skill-api build
FROM node:24-bookworm-slim
ENV NODE_ENV=production
RUN groupadd --gid 53218 skill && useradd --uid 53218 --gid 53218 --no-create-home skill
WORKDIR /app/skill-chat
COPY --from=build --chown=skill:skill /app/skill-chat /app/skill-chat
USER skill
EXPOSE 8080
CMD ["sh","-c","cd apps/api && ./node_modules/.bin/prisma migrate deploy && node dist/server.js"]
