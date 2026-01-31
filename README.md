<div align="center">

# Market Monitor

**Automated marketplace listing tracker with real-time Discord notifications**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://hub.docker.com/r/rutbergphilip/market-monitor)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Features](#features) • [Quick Start](#quick-start) • [Configuration](#configuration) • [API](#api) • [Contributing](#contributing)

</div>

---

## Overview

Market Monitor is a self-hosted application that automatically tracks listings across online marketplaces and sends instant notifications when new items matching your criteria appear. Built with a modern tech stack, it features a responsive web dashboard for managing watchers and a robust backend for reliable monitoring.

**Currently supported marketplaces:**
- Blocket (Swedish marketplace)
- Tradera (coming soon)

## Features

- **Multi-Watcher System** — Create independent watchers with custom search queries, price filters, and schedules
- **Real-time Notifications** — Discord webhook integration with rich embeds, images, and listing details
- **Flexible Scheduling** — Cron-based scheduling for precise control over check intervals
- **Price Filtering** — Set min/max price ranges to filter out irrelevant listings
- **Modern Dashboard** — Intuitive web UI for managing watchers, viewing status, and configuring settings
- **Smart Deduplication** — In-memory caching prevents duplicate notifications
- **First-run Protection** — Avoids notification spam when creating new watchers
- **Secure Authentication** — JWT-based auth with refresh tokens and secure session management
- **Docker Ready** — Single container deployment with persistent storage

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Node.js 20, Express, TypeScript, SQLite |
| **Frontend** | Nuxt 4, Vue 3, Nuxt UI 4, Pinia, Tailwind CSS |
| **Authentication** | JWT, bcrypt, refresh tokens |
| **Real-time** | Server-Sent Events (SSE) |
| **Deployment** | Docker, Supervisor |

## Quick Start

### Docker Compose (Recommended)

1. **Create directories and environment file:**

```bash
mkdir -p data logs

# Generate secrets
cat > .env << 'EOF'
JWT_SECRET=your-jwt-secret-minimum-32-characters-here
REFRESH_TOKEN_SECRET=your-refresh-secret-minimum-32-characters
NUXT_SESSION_PASSWORD=your-session-password-minimum-32-chars
EOF

# Or generate random secrets:
# openssl rand -base64 48
```

2. **Create `docker-compose.yaml`:**

```yaml
services:
  market-monitor:
    image: rutbergphilip/market-monitor:latest
    ports:
      - '${UI_PORT:-3847}:${UI_PORT:-3847}'
      - '${SERVER_PORT:-5847}:${SERVER_PORT:-5847}'
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - SERVER_PORT=${SERVER_PORT:-5847}
      - UI_PORT=${UI_PORT:-3847}
    restart: unless-stopped
```

3. **Start the application:**

```bash
docker compose up -d
```

Access the dashboard at `http://localhost:3847` (default login: `admin` / `admin`)

### Docker CLI

```bash
docker run -d \
  --name market-monitor \
  -p 3847:3847 \
  -p 5847:5847 \
  -v ./data:/app/data \
  -v ./logs:/app/logs \
  -e JWT_SECRET=your-jwt-secret-minimum-32-characters-here \
  -e REFRESH_TOKEN_SECRET=your-refresh-secret-minimum-32-characters \
  -e NUXT_SESSION_PASSWORD=your-session-password-minimum-32-chars \
  rutbergphilip/market-monitor:latest
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/rutbergphilip/market-monitor.git
cd market-monitor

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../ui && npm install

# Start backend (Terminal 1)
cd server && npm run dev

# Start frontend (Terminal 2)
cd ui && npm run dev
```

## Configuration

### Environment Variables

#### Required

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for JWT signing (min 32 characters) |
| `REFRESH_TOKEN_SECRET` | Secret key for refresh tokens (min 32 characters) |
| `NUXT_SESSION_PASSWORD` | Secret for UI sessions (min 32 characters) |

> Generate secrets with: `openssl rand -base64 48`

#### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PATH` | `/app/data` | Database directory or file path |
| `SERVER_PORT` | `5847` | Backend API port |
| `UI_PORT` | `3847` | Frontend port |
| `HOST` | `0.0.0.0` | Host binding address |
| `LOG_LEVEL` | `info` | Logging verbosity (`debug`, `info`, `warn`, `error`) |
| `NODE_ENV` | `production` | Environment mode |
| `UI_ORIGIN` | `http://localhost:3847` | CORS origin (set to your domain in production) |

### Database Path

The `DB_PATH` variable supports both directory and file paths:

```bash
# Directory (database created as db.sqlite inside)
DB_PATH=/app/data

# Direct file path
DB_PATH=/app/data/my-database.sqlite
```

## Usage

### Creating a Watcher

1. Log in to the dashboard at `http://localhost:3847`
2. Click **"New Watcher"** to open the creation modal
3. Configure your watcher:
   - **Name**: A descriptive name for the watcher
   - **Schedule**: Cron expression (e.g., `*/15 * * * *` for every 15 minutes)
   - **Queries**: Add one or more search queries with marketplace selection
   - **Price Range**: Optional min/max price filters
   - **Notifications**: Add Discord webhook URLs

### Discord Webhook Setup

1. In Discord, go to **Server Settings > Integrations > Webhooks**
2. Click **"New Webhook"** and copy the URL
3. Add the webhook URL to your watcher's notification targets

### Notification Settings

Global notification settings can be configured in **Settings > Notifications**:

- **Bot Username**: Custom name for Discord messages
- **Avatar URL**: Custom avatar for the Discord bot
- **Batch Size**: Number of listings per message
- **Retry Settings**: Max retries and delay for failed deliveries

## API

The backend exposes a REST API on port 5847 (configurable via `SERVER_PORT`).

### Authentication

```bash
# Login
POST /api/auth/login
Content-Type: application/json
{"username": "user", "password": "pass"}

# Response includes JWT token and refresh token
```

### Watchers

```bash
# List all watchers
GET /api/watchers
Authorization: Bearer <token>

# Create watcher
POST /api/watchers
Authorization: Bearer <token>

# Start/stop watcher
POST /api/watchers/:id/start
POST /api/watchers/:id/stop

# Manually trigger watcher
POST /api/watchers/:id/trigger
```

### Settings

```bash
# Get all settings
GET /api/settings
Authorization: Bearer <token>

# Update setting
PATCH /api/settings/:key
Authorization: Bearer <token>
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Web Dashboard                         │
│                   (Nuxt 4 / Vue 3)                       │
└─────────────────────────┬───────────────────────────────┘
                          │ REST API + SSE
┌─────────────────────────▼───────────────────────────────┐
│                   Express API Server                     │
├─────────────────────────────────────────────────────────┤
│  Cron Scheduler  │  SSE Stream  │  Auth Middleware      │
└────────┬─────────┴──────────────┴───────────────────────┘
         │
┌────────▼─────────┐     ┌──────────────────┐
│ Marketplace      │────▶│ Notification     │
│ Adapters         │     │ Service          │
│ (Blocket, etc.)  │     │ (Discord, Email) │
└────────┬─────────┘     └──────────────────┘
         │
┌────────▼─────────┐
│ SQLite Database  │
└──────────────────┘
```

## Deployment

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: market-monitor
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: market-monitor
          image: rutbergphilip/market-monitor:latest
          ports:
            - containerPort: 3847
            - containerPort: 5847
          env:
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: market-monitor-secrets
                  key: jwt-secret
            - name: REFRESH_TOKEN_SECRET
              valueFrom:
                secretKeyRef:
                  name: market-monitor-secrets
                  key: refresh-token-secret
          volumeMounts:
            - name: data
              mountPath: /app/data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: market-monitor-pvc
```

### Health Check

The API exposes a health endpoint with database connectivity status:

```bash
curl http://localhost:5847/api/health
# {"status":"healthy","timestamp":"...","database":{"connected":true},"uptime":123}
```

## Security

- **Mandatory secrets** — App will not start without properly configured secrets
- **Non-root container** — Runs as unprivileged user (UID 1000)
- JWT tokens expire after 24 hours
- Refresh tokens are valid for 30 days with automatic rotation
- Passwords are hashed using bcrypt
- Secure cookie settings (httpOnly, sameSite)
- All API routes (except auth) require authentication
- Health endpoint with database connectivity check

> **Important:** Change the default `admin`/`admin` credentials after first login!

## Roadmap

- [ ] Tradera marketplace integration
- [ ] Telegram notifications
- [ ] Email notifications
- [ ] Advanced filters (location, category, regex)
- [ ] Multi-user support with separate watchers
- [ ] Mobile-responsive dashboard improvements

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**If you find Market Monitor useful, consider giving it a star!**

</div>
