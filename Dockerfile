# ---- Stage 1: Build client ----
FROM node:20-alpine AS client-builder
ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}

WORKDIR /app
COPY src/client/package*.json ./
RUN npm ci
COPY src/client/ ./
RUN npm run build

# ---- Stage 2: Build server ----
FROM node:20-alpine AS server-builder
WORKDIR /app
COPY src/server/package*.json ./
RUN npm ci
COPY src/server/ ./
RUN npm run build

# ---- Stage 3: Production runtime ----
FROM node:20-alpine AS production
# openssh-client required for the tunnel feature (localhost.run)
RUN apk add --no-cache openssh-client && \
    mkdir -p /root/.ssh && \
    chmod 700 /root/.ssh && \
    ssh-keygen -t ed25519 -f /root/.ssh/id_ed25519 -N '' -q
WORKDIR /app
# Server compiled JS and runtime dependencies
COPY --from=server-builder /app/dist/ ./dist/
COPY --from=server-builder /app/node_modules/ ./node_modules/
COPY --from=server-builder /app/package.json ./
# Built React client (served as static files by the Hono server)
COPY --from=client-builder /app/dist/ ./public/

EXPOSE 4000
ENV NODE_ENV=production
ENV PORT=4000

CMD ["node", "dist/index.js"]
