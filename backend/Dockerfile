# ─────────────────────────────────────────────
# Stage 1: Builder
# Install all deps, generate Prisma client, compile TypeScript
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests and Prisma schema first to leverage Docker layer caching.
# This layer is only invalidated when package.json or schema.prisma changes.
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# Generate Prisma Client based on the schema
RUN npx prisma generate

# Copy remaining source files
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Production
# Lean image with only production dependencies
# ─────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy package manifests and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install ONLY production dependencies
RUN npm ci --only=production

# Re-generate Prisma Client in the production stage
# (required because Prisma generates platform-specific binaries)
RUN npx prisma generate

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Cloud Run injects PORT at runtime (default 8080).
# NODE_ENV=production activates CORS restriction.
ENV NODE_ENV=production
EXPOSE 8080

# Run the compiled NestJS application
CMD ["node", "dist/main"]
