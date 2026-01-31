# Installation & Migration Guide

## Quick Start (Docker)

### 1. Create directories for persistent data

```bash
mkdir -p /opt/market-monitor/data
mkdir -p /opt/market-monitor/logs
```

### 2. Create environment file

```bash
cd /opt/market-monitor

# Create .env file with required secrets
cat > .env << 'EOF'
JWT_SECRET=$(openssl rand -base64 48)
REFRESH_TOKEN_SECRET=$(openssl rand -base64 48)
NUXT_SESSION_PASSWORD=$(openssl rand -base64 48)
LOG_LEVEL=info
UI_ORIGIN=http://localhost:3000
EOF

# Generate actual secrets
sed -i "s|\$(openssl rand -base64 48)|$(openssl rand -base64 48)|g" .env
```

Or manually create `.env`:

```bash
# Generate secrets
openssl rand -base64 48  # Copy for JWT_SECRET
openssl rand -base64 48  # Copy for REFRESH_TOKEN_SECRET
openssl rand -base64 48  # Copy for NUXT_SESSION_PASSWORD
```

### 3. Run with Docker

**Using Docker Compose (recommended):**

```yaml
# docker-compose.yaml
services:
  market-monitor:
    image: ghcr.io/your-username/market-monitor:latest
    container_name: market-monitor
    ports:
      - '3000:3000'
      - '8080:8080'
    volumes:
      - /opt/market-monitor/data:/app/data
      - /opt/market-monitor/logs:/app/logs
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - DB_PATH=/app/data
      - SERVER_PORT=8080
      - UI_PORT=3000
      - HOST=0.0.0.0
    restart: unless-stopped
```

```bash
docker compose up -d
```

**Using Docker CLI:**

```bash
docker run -d \
  --name market-monitor \
  -p 3000:3000 \
  -p 8080:8080 \
  --volume /opt/market-monitor/data:/app/data \
  --volume /opt/market-monitor/logs:/app/logs \
  --env-file /opt/market-monitor/.env \
  -e NODE_ENV=production \
  -e DB_PATH=/app/data \
  -e SERVER_PORT=8080 \
  -e UI_PORT=3000 \
  -e HOST=0.0.0.0 \
  --restart unless-stopped \
  ghcr.io/your-username/market-monitor:latest
```

### 4. Access the application

- **Web UI**: http://localhost:3000
- **API**: http://localhost:8080

Default credentials: `admin` / `admin` (change immediately!)

---

## Volume Mounts

| Container Path | Purpose | Required |
|----------------|---------|----------|
| `/app/data` | SQLite database | Yes |
| `/app/logs` | Application logs | Optional |

### Bind Mounts vs Named Volumes

**Bind mounts** (recommended for self-hosted):
```yaml
volumes:
  - /path/on/host/data:/app/data
  - /path/on/host/logs:/app/logs
```
- Easier to backup and manage
- Data stored in known location on host
- Can be accessed directly for troubleshooting

**Named volumes**:
```yaml
volumes:
  - market-monitor-data:/app/data
  - market-monitor-logs:/app/logs

volumes:
  market-monitor-data:
  market-monitor-logs:
```
- Managed by Docker
- Portable between systems
- Requires `docker volume` commands to access

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret for access tokens (min 32 chars) |
| `REFRESH_TOKEN_SECRET` | Secret for refresh tokens (min 32 chars) |
| `NUXT_SESSION_PASSWORD` | Secret for UI sessions (min 32 chars) |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Logging level: debug, info, warn, error |
| `UI_ORIGIN` | `http://localhost:3000` | CORS origin (set to your domain) |
| `NODE_ENV` | `production` | Environment mode |

### Internal (don't change unless needed)

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PATH` | `/app/data` | Database directory inside container |
| `SERVER_PORT` | `8080` | API server port |
| `UI_PORT` | `3000` | UI server port |
| `HOST` | `0.0.0.0` | Bind address |

---

## Migration from Previous Versions

### Breaking Changes in Latest Version

1. **Required environment variables** - App will fail to start without proper secrets
2. **Container runs as non-root** - May need to fix permissions on existing data
3. **Bind mounts recommended** - Changed from named volumes

### Migrating Existing Installation

1. **Backup your data:**
   ```bash
   # If using named volumes
   docker run --rm -v market-monitor-data:/data -v $(pwd):/backup alpine \
     tar czf /backup/market-monitor-backup.tar.gz -C /data .

   # If using bind mounts
   tar czf market-monitor-backup.tar.gz /opt/market-monitor/data
   ```

2. **Create new directories:**
   ```bash
   mkdir -p /opt/market-monitor/{data,logs}
   ```

3. **Restore data:**
   ```bash
   tar xzf market-monitor-backup.tar.gz -C /opt/market-monitor/data
   ```

4. **Fix permissions:**
   ```bash
   chown -R 1000:1000 /opt/market-monitor/data
   chown -R 1000:1000 /opt/market-monitor/logs
   ```

5. **Create .env file** (see Quick Start above)

6. **Update docker-compose.yaml** to use new format

7. **Restart:**
   ```bash
   docker compose down
   docker compose up -d
   ```

### Permission Issues

If you see `SQLITE_READONLY` errors, fix permissions:

```bash
# For bind mounts
chown -R 1000:1000 /opt/market-monitor/data

# For named volumes
docker run --rm -v market-monitor-data:/data alpine chown -R 1000:1000 /data
```

---

## Health Check

The API provides a health endpoint with database status:

```bash
curl http://localhost:8080/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-31T12:00:00.000Z",
  "database": {
    "connected": true
  },
  "uptime": 3600
}
```

---

## Reverse Proxy (Production)

For production, use a reverse proxy with HTTPS:

**Nginx example:**
```nginx
server {
    listen 443 ssl http2;
    server_name monitor.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Update your `.env`:
```bash
UI_ORIGIN=https://monitor.yourdomain.com
```

---

## Troubleshooting

### View logs
```bash
docker compose logs -f
```

### Check container status
```bash
docker compose ps
```

### Access container shell
```bash
docker exec -it market-monitor sh
```

### Reset to fresh state
```bash
docker compose down
rm -rf /opt/market-monitor/data/*
docker compose up -d
```

---

## Support

- Check logs: `docker compose logs -f`
- Health check: `curl http://localhost:8080/api/health`
- Open an issue on GitHub with error messages
