FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install

# Copy source code and build
COPY . .
RUN bun run build

# Runner image
FROM oven/bun:1-alpine AS runner

WORKDIR /app

# Set environment variables for production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy built assets from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Start the Nitro server using bun
CMD ["bun", "run", ".output/server/index.mjs"]
