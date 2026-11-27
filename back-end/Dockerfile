FROM oven/bun:1.2-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# Copy application source
COPY . .

# Emit Prisma 8 contract artifacts (contract.json & contract.d.ts)
RUN bunx prisma contract emit

ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

# Auto push DB schema (first run) / apply new migrations before starting Fastify
CMD ["sh", "-c", "bun run db:sync && exec bun src/index.ts"]
