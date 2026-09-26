FROM node:22.14-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22.14-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run typecheck && npm run lint && npm run test && npm run build

FROM node:22.14-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN useradd --create-home --uid 10001 appuser
COPY --from=build --chown=appuser:appuser /app/package.json /app/package-lock.json ./
COPY --from=build --chown=appuser:appuser /app/node_modules ./node_modules
RUN npm prune --omit=dev && npm cache clean --force
COPY --from=build --chown=appuser:appuser /app/dist ./dist
COPY --from=build --chown=appuser:appuser /app/drizzle ./drizzle
COPY --from=build --chown=appuser:appuser /app/wrangler.local.jsonc ./wrangler.local.jsonc
COPY --chown=appuser:appuser --chmod=755 docker-entrypoint.sh ./docker-entrypoint.sh
RUN mkdir -p /app/.wrangler && chown appuser:appuser /app /app/.wrangler
USER appuser
EXPOSE 8787
HEALTHCHECK --interval=20s --timeout=5s --start-period=25s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:8787/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
ENTRYPOINT ["./docker-entrypoint.sh"]
