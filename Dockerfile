FROM node:20-slim

# Install supervisor
RUN apt-get update && apt-get install -y supervisor && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /var/log/supervisor

# Set working directory
WORKDIR /app

# Copy package files separately for layer caching
COPY server/package*.json ./server/
COPY ui/package*.json ./ui/

# Install dependencies
RUN cd server && npm install
RUN cd ui && npm install || (rm -rf package-lock.json node_modules && npm install)

# Copy application source code
COPY server ./server
COPY ui ./ui

# Build UI
WORKDIR /app/ui
RUN npm run build

# Copy supervisord configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create data directory for database persistence
RUN mkdir -p /app/data && chown -R node:node /app/data

# Expose ports
EXPOSE 3000 8080

# Set environment variables with K8s-friendly defaults
ENV DB_PATH=/app/data
ENV SERVER_PORT=8080
ENV UI_PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

# Define volume for database persistence
VOLUME ["/app/data"]

# Start supervisor
CMD ["/usr/bin/supervisord", "-n"]