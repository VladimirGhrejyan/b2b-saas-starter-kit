ARG NODE_VERSION=24.19.0

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY infra/docker/nginx/gateway.conf /etc/nginx/conf.d/default.conf
