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
RUN cd ui && npm install

# Copy application source code
COPY server ./server
COPY ui ./ui

# Build UI
WORKDIR /app/ui
RUN npm run build

# Copy .output explicitly to make sure it's preserved
COPY ui/.output ./ui/.output

# Copy supervisord configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create DB directory
RUN mkdir -p /data

# Expose ports
EXPOSE 3000

# Set environment variables
ENV DB_PATH=/data/db.sqlite
ENV SERVER_PORT=8080
ENV UI_PORT=3000
ENV API_BASE_URL=http://localhost:8080
ENV HOST=0.0.0.0

# Start supervisor
CMD ["/usr/bin/supervisord", "-n"]
