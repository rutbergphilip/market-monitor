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

# Expose ports
EXPOSE 3000
EXPOSE 8080

# Set environment variables
ENV DB_PATH=/data/db.sqlite
ENV SERVER_PORT=8080
ENV UI_PORT=3000
ENV API_BASE_URL=http://localhost:8080

# Start supervisor to run both processes
CMD ["/usr/bin/supervisord", "-n"]
