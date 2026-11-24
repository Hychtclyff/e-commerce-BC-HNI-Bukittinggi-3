FROM oven/bun:1.2-alpine AS base
WORKDIR /app

COPY package.json bun.lock* package-lock.json* ./
RUN bun install

COPY . .

ENV NODE_ENV=production
RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "start"]
