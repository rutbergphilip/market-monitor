# Base image
FROM node:23-bullseye-slim AS base
WORKDIR /app

# Copy all files
COPY . .

# Build stage: install dependencies and build all projects
FROM base AS build
RUN npm ci
RUN npm run --workspaces build

# ---------

# Production image
FROM node:23-alpine AS production
WORKDIR /app

# Copy built server files
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/package.json ./server/package.json

# Copy hoisted node_modules from the root
COPY --from=build /app/node_modules ./node_modules

# Copy built UI files
COPY --from=build /app/ui/.output/public ./ui/public

# Expose server port
EXPOSE 3000

# Start the server
CMD ["node", "server/dist/index.js"]

