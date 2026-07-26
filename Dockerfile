# ─── deps ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ─── build ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# NEXT_PUBLIC_* values are inlined into the client bundle at build time — pass
# them as --build-arg from CI. A change here forces a rebuild.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GRAPHQL_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GRAPHQL_URL=$NEXT_PUBLIC_GRAPHQL_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ─── runtime ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Requires `output: 'standalone'` in next.config.ts — copies only what the
# server needs to run, keeping the final image ~120 MB instead of ~500 MB.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

USER node

EXPOSE 3000

# Exec form — no shell wrapping — so SIGTERM reaches Node directly.
CMD ["node", "server.js"]
