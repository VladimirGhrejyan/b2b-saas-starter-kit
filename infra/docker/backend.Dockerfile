ARG NODE_VERSION=24.19.0

FROM node:${NODE_VERSION}-bookworm-slim AS build
ENV NX_DAEMON=false
ENV HUSKY=0
ENV CI=true
RUN corepack enable
WORKDIR /repo
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
ARG APP=api
RUN pnpm nx build "${APP}"

FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ARG APP=api
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable
COPY --from=build --chown=node:node /repo/apps/${APP}/dist ./
RUN printf '%s\n' '{"name":"runtime","private":true}' > package.json \
    && pnpm add @node-rs/argon2@2.2.1 \
    && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "main.js"]
