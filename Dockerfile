# Tiny image — native TypeScript execution (Node 26 strips types, no build step).
# Zero runtime dependencies, so no .npmrc / GitHub Packages auth is needed.
FROM node:26-trixie-slim

WORKDIR /app

# Only devDeps exist (typescript, @types/node); --omit=dev installs nothing at runtime,
# but npm ci needs the lockfile present.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "src/server.ts"]
