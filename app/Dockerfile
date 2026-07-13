FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Install dependencies (bun.lock may not exist yet)
COPY package.json ./
RUN bun install

# Copy source code and build
COPY . .
RUN bun run build

# Runner image
FROM oven/bun:1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["bun", "run", ".output/server/index.mjs"]
