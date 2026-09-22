ARG NODE_VERSION=24.19.0

FROM node:${NODE_VERSION}-bookworm-slim
ENV NX_DAEMON=false
ENV HUSKY=0
ENV CI=true
ENV NODE_ENV=production
RUN corepack enable
WORKDIR /repo
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
CMD ["pnpm", "nx", "run", "postgres:migration:run"]
