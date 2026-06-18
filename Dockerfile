# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=/api-backend
ARG NEXT_PUBLIC_HERE_API_KEY=
ARG NEXT_PUBLIC_APP_NAME=
ARG NEXT_PUBLIC_ENV=production
ARG BACKEND_URL=http://host.docker.internal:3000

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_HERE_API_KEY=$NEXT_PUBLIC_HERE_API_KEY
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_ENV=$NEXT_PUBLIC_ENV
ENV BACKEND_URL=$BACKEND_URL

RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3001

CMD ["node", "server.js"]
