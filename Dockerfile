# Stage 1: Base image with build dependencies
FROM node:20-slim AS base
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Install server dependencies
FROM base AS server-deps
WORKDIR /app/server
COPY server/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit 2>/dev/null || npm install

# Stage 3: Build server
FROM server-deps AS server-build
COPY server ./
RUN npm run build

# Stage 4: Install UI dependencies (parallel with server)
FROM base AS ui-deps
WORKDIR /app/ui
COPY ui/package.json ./
# Don't use package-lock for UI - native Tailwind modules need platform-specific install
RUN --mount=type=cache,target=/root/.npm \
    npm install --no-audit --prefer-offline

# Stage 5: Build UI
FROM ui-deps AS ui-build
WORKDIR /app/ui
# Copy config files first (change less frequently than source)
COPY ui/nuxt.config.ts ui/tsconfig.json ui/tailwind.config.* ui/app.config.* ./
# Copy remaining source
COPY ui ./
ENV NODE_ENV=production
RUN npx nuxt prepare && npm run build

# Stage 6: Production runtime image
FROM node:20-slim AS runtime

# Install only runtime dependencies (supervisor)
RUN apt-get update && \
    apt-get install -y --no-install-recommends supervisor && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir -p /var/log/supervisor

WORKDIR /app

# Copy server production dependencies and built code
COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/package*.json ./server/

# Copy UI production dependencies and built code
COPY --from=ui-deps /app/ui/node_modules ./ui/node_modules
COPY --from=ui-build /app/ui/.output ./ui/.output
COPY --from=ui-build /app/ui/package*.json ./ui/

# Copy supervisord configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create data directory for database persistence
RUN mkdir -p /app/data && chown -R node:node /app/data

# Expose ports
EXPOSE 3000 8080

# Set environment variables
ENV DB_PATH=/app/data
ENV SERVER_PORT=8080
ENV UI_PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

# Define volume for database persistence
VOLUME ["/app/data"]

# Start supervisor
CMD ["/usr/bin/supervisord", "-n"]
