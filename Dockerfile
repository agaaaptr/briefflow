# syntax=docker/dockerfile:1
# Node 24: iron-session 9 butuh >=22.13 (lihat docs/research.md §9)
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# npm install (bukan npm ci): lockfile yang digenerate di macOS memangkas
# optional dep wasm32-wasi, sehingga `npm ci` gagal di container linux (alpine).
RUN npm install --no-audit --no-fund

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npx next build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Output standalone Next + aset statis
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
