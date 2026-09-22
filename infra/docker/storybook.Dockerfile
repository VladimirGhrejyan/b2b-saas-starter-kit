ARG NODE_VERSION=24.19.0

FROM node:${NODE_VERSION}-bookworm-slim AS build
ARG STORYBOOK_BASE=/storybook/
ENV NX_DAEMON=false
ENV HUSKY=0
ENV CI=true
ENV NODE_ENV=production
ENV STORYBOOK_BASE=${STORYBOOK_BASE}
RUN corepack enable
WORKDIR /repo
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
RUN pnpm nx run ui-kit:build-storybook

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY infra/docker/nginx/spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/packages/frontend/ui-kit/storybook-static /usr/share/nginx/html
