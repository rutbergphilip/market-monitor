FROM node:20-slim

# Install supervisor
RUN apt-get update && apt-get install -y supervisor && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /var/log/supervisor

# Volume for config, SQLite database
VOLUME ["/data"]

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

# Set environment variable for SQLite DB path
ENV DB_PATH=/data/db.sqlite

# Start supervisor to run both processes
CMD ["/usr/bin/supervisord", "-n"]
