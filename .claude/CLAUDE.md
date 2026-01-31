# Market Monitor - Claude Code Guide

This document provides essential context for working with the Market Monitor codebase.

## Project Overview

Market Monitor is a self-hosted marketplace listing tracker with Discord notifications. It monitors online marketplaces (currently Blocket) and sends alerts when new listings matching configured criteria appear.

### Architecture

```
┌─────────────────────────────────────────┐
│           UI (Nuxt 4 / Vue 3)           │
│              Port: 3847                 │
└───────────────────┬─────────────────────┘
                    │ REST API + SSE
┌───────────────────▼─────────────────────┐
│         Server (Express / Node.js)      │
│              Port: 5847                 │
├─────────────────────────────────────────┤
│  Cron Scheduler │ SSE Stream │ Auth     │
└────────┬────────┴────────────┴──────────┘
         │
┌────────▼────────┐    ┌──────────────────┐
│  Marketplace    │───▶│  Notifications   │
│  Adapters       │    │  (Discord)       │
└────────┬────────┘    └──────────────────┘
         │
┌────────▼────────┐
│ SQLite Database │
└─────────────────┘
```

### Directory Structure

```
.
├── server/                 # Backend Express API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic (cron, marketplace adapters)
│   │   ├── db/             # SQLite database & repositories
│   │   ├── integrations/   # External services (Discord, logging)
│   │   └── types/          # TypeScript types
│   └── package.json
├── ui/                     # Frontend Nuxt application
│   ├── app/
│   │   ├── components/     # Vue components
│   │   ├── pages/          # Route pages
│   │   ├── stores/         # Pinia stores
│   │   └── composables/    # Vue composables
│   └── package.json
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yaml     # Docker Compose configuration
├── supervisord.conf        # Process manager for container
└── .github/workflows/      # GitHub Actions
    └── deploy.yaml         # Manual deployment workflow
```

## Development

### Local Development

```bash
# Terminal 1 - Backend
cd server && npm install && npm run dev

# Terminal 2 - Frontend
cd ui && npm install && npm run dev
```

- Server runs on `http://localhost:5847`
- UI runs on `http://localhost:3847`

### Docker Development

```bash
# Build and run locally
docker compose build
docker compose up -d

# View logs
docker logs -f market-monitor

# Stop
docker compose down
```

### Environment Variables

**Required:**
- `JWT_SECRET` - JWT signing key (min 32 chars)
- `REFRESH_TOKEN_SECRET` - Refresh token key (min 32 chars)
- `NUXT_SESSION_PASSWORD` - UI session encryption (min 32 chars)

**Optional:**
- `SERVER_PORT` - Backend port (default: 5847)
- `UI_PORT` - Frontend port (default: 3847)
- `LOG_LEVEL` - Logging verbosity (default: info)
- `UI_ORIGIN` - CORS origin (default: http://localhost:3847)
- `DB_PATH` - Database location (default: /app/data)

## Deployment

### GitHub Repository

- **Repo**: https://github.com/rutbergphilip/market-monitor
- **Docker Hub**: https://hub.docker.com/r/rutbergphilip/market-monitor

### Deployment Workflow

The project uses a manual GitHub Actions workflow (`deploy.yaml`) that builds and pushes Docker images to Docker Hub.

#### Trigger Deployment

```bash
# Deploy a new version
gh workflow run deploy.yaml -f release-tag=vX.Y.Z

# Watch the deployment
gh run list --limit 1
gh run watch <run-id> --exit-status
```

#### Full Release Process

1. **Make and test changes locally**
   ```bash
   docker compose build
   docker compose up -d
   curl http://localhost:5847/api/health
   curl -I http://localhost:3847/
   docker compose down
   ```

2. **Commit and push**
   ```bash
   git add <files>
   git commit -m "feat/fix: description"
   git push origin main
   ```

3. **Trigger deployment**
   ```bash
   gh workflow run deploy.yaml -f release-tag=vX.Y.Z
   gh run watch <run-id> --exit-status
   ```

4. **Verify image on Docker Hub**
   ```bash
   docker manifest inspect rutbergphilip/market-monitor:vX.Y.Z
   ```

5. **Create git tag and release**
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   gh release create vX.Y.Z --title "vX.Y.Z" --notes "Release notes..."
   ```

### Versioning

Follow semantic versioning:
- **MAJOR** (vX.0.0): Breaking changes
- **MINOR** (v0.X.0): New features, backward compatible
- **PATCH** (v0.0.X): Bug fixes

### Docker Image Details

- **Registry**: Docker Hub (`rutbergphilip/market-monitor`)
- **Platforms**: linux/amd64, linux/arm64
- **Base**: node:20-slim
- **Process Manager**: supervisord (runs both UI and server)

### Port Configuration

Default ports were chosen to avoid conflicts with common services:
- **UI**: 3847 (not 3000 which conflicts with Node dev servers)
- **Server**: 5847 (not 8080 which is a common HTTP alternative)

Users can customize via environment variables:
```yaml
environment:
  - SERVER_PORT=8080  # Use old port if needed
  - UI_PORT=3000
```

## Testing

### Health Check

```bash
# API health endpoint
curl http://localhost:5847/api/health
# Returns: {"status":"healthy","database":{"connected":true},"uptime":...}

# UI availability
curl -I http://localhost:3847/
# Returns: HTTP 200
```

### Manual Testing in Docker

```bash
# Pull and run specific version
docker pull rutbergphilip/market-monitor:v3.0.1
docker run -d --name test \
  -p 3847:3847 -p 5847:5847 \
  -e JWT_SECRET=test-secret-minimum-32-characters-here \
  -e REFRESH_TOKEN_SECRET=test-refresh-minimum-32-characters \
  -e NUXT_SESSION_PASSWORD=test-session-minimum-32-characters \
  rutbergphilip/market-monitor:v3.0.1

# Test endpoints
curl http://localhost:5847/api/health
curl -I http://localhost:3847/

# Cleanup
docker stop test && docker rm test
```

## Troubleshooting

### Container Won't Start

1. Check required env vars are set:
   ```bash
   docker logs market-monitor 2>&1 | head -20
   ```

2. Common issues:
   - Missing `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, or `NUXT_SESSION_PASSWORD`
   - Port already in use (change `SERVER_PORT`/`UI_PORT`)

### Supervisord Errors

If you see "cannot be expanded" errors, ensure all referenced env vars have values. The Dockerfile should provide defaults, but older images may require explicit values.

### UI Not Responding

Check the Nitro server is running on the correct port:
```bash
docker logs market-monitor 2>&1 | grep "Listening"
# Should show: Listening on http://0.0.0.0:3847
```

## Key Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build, ENV defaults |
| `docker-compose.yaml` | Container orchestration |
| `supervisord.conf` | Process management (PORT forwarding) |
| `server/src/index.ts` | Server entry point, port config |
| `ui/nuxt.config.ts` | Nuxt config, dev server port |
| `.github/workflows/deploy.yaml` | CI/CD deployment |
