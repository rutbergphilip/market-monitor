FROM node:20-slim

# Install supervisor
RUN apt-get update && apt-get install -y supervisor && rm -rf /var/lib/apt/lists/*

# Create log directory for supervisor
RUN mkdir -p /var/log/supervisor

# Copy the application code and supervisor config
COPY ui /app/ui
COPY server /app/server
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Build UI
WORKDIR /app/ui
RUN npm install && npm run build

# Build Server
WORKDIR /app/server
RUN npm install && npm run build

# Expose port
EXPOSE 3000

# Start supervisor to run both processes
CMD ["/usr/bin/supervisord", "-n"]
