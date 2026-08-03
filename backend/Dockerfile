# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Multi-stage build for the gift-message-suggester backend.
#   stage "build"   → installs all deps and compiles TypeScript to dist/
#   stage "runtime" → ships only production deps + dist/, as a non-root user
# The image runs in fallback-only mode with no configuration; pass an
# OPENAI_API_KEY (via env/compose) to enable live LLM output.
# ---------------------------------------------------------------------------

FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first to leverage Docker layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Compile TypeScript.
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------------------------------------------------------------------------

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only production dependencies in the final image.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled output from the build stage.
COPY --from=build /app/dist ./dist

# Run as the built-in unprivileged user.
USER node

EXPOSE 8080

# Report container health via the API's own health endpoint.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider "http://localhost:${PORT:-8080}/api/health" || exit 1

CMD ["node", "dist/index.js"]
