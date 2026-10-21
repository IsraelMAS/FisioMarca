# syntax=docker/dockerfile:1
# ─── FisioMarca · Frontend Next.js (salida standalone) ───────────────
# 3 etapas: dependencias → build → runtime mínimo (solo server.js + lo
# que Next trazó como necesario; sin pnpm ni node_modules completos).

ARG NODE_IMAGE=node:24-alpine

# ── 1. Dependencias: solo se rehace si cambia el lockfile ────────────
FROM ${NODE_IMAGE} AS deps
RUN npm install -g pnpm@12.8.1 && npm cache clean --force
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=fisiomarca-pnpm,target=/pnpm-store \
    pnpm install --frozen-lockfile --store-dir /pnpm-store

# ── 2. Build ─────────────────────────────────────────────────────────
FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN pnpm build

# ── 3. Runtime ───────────────────────────────────────────────────────
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
    CMD wget -q --spider http://127.0.0.1:3000/ || exit 1
CMD ["node", "server.js"]
