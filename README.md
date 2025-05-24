# 🚀 Blocket Bot

Monitor Blocket listings effortlessly with a beautiful UI and get instant notifications for new ads, right in your Discord!

## 🌟 Features

- **Modern Web Dashboard**: Manage your watchers with an intuitive web interface.
- **User Authentication**: Secure login system with JWT tokens and refresh token functionality.
- **Customizable Watchers**: Create multiple independent watchers with different queries.
- **Real-time Notifications**:
  - Discord webhook notifications with rich embeds ✅
  - Detailed listing information with prices and images ✅
  - Notification batching with configurable batch sizes ✅
  - Automatic retry with exponential backoff for failed notifications ✅
- **Flexible Scheduling**: Set custom cron schedules for each watcher.
- **Price Range Filtering**: Filter listings by minimum and maximum price, ensuring you only get relevant notifications.
- **Settings Management**: Global notification preferences and appearance options.
- **Robust Error Handling**: Automatic retry mechanisms for network failures.
- **Docker Ready**: Easy deployment with containerization support.

## 📸 Screenshots

_Coming soon_

## ⚙️ Getting Started

### 🚧 Installation

#### Option 1: Using Docker (Recommended)

Pull and run the Docker image:

```sh
docker run -d \
  -p 3000:3000 -p 8080:8080 \
  -v blocket-bot-data:/app/data \
  -e JWT_SECRET=your_secure_jwt_secret \
  -e REFRESH_TOKEN_SECRET=your_secure_refresh_secret \
  --name blocket-bot \
  rutbergphilip/blocket-bot:2.0.0
```

For custom database path:

```sh
docker run -d \
  -p 3000:3000 -p 8080:8080 \
  -v /host/path/to/data:/app/data \
  -e DB_PATH=/app/data \
  -e JWT_SECRET=your_secure_jwt_secret \
  -e REFRESH_TOKEN_SECRET=your_secure_refresh_secret \
  --name blocket-bot \
  rutbergphilip/blocket-bot:2.0.0
```

Then access the web UI at `http://localhost:3000`

#### Option 2: Manual Installation

Clone the repository and install dependencies:

```sh
git clone https://github.com/rutbergphilip/blocket-bot
cd blocket-bot

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../ui
npm install
```

### 🚀 Running the Application

#### Using Docker:

The Docker container starts both the backend (port 8080) and frontend (port 3000) automatically.

#### Manual Start:

1. Start the backend (from the server directory):

```sh
npm run start
```

2. Start the frontend (from the ui directory):

```sh
npm run dev
```

3. Access the web UI at `http://localhost:3000`

## 🧩 Core Features

### Authentication

- Secure user accounts with JWT authentication
- Persistent sessions with refresh tokens
- Token rotation for enhanced security

### Watchers

- Create multiple watchers with different search queries
- Set custom cron schedules for each watcher
- Filter by price range (min & max)
- Configure multiple notification targets per watcher
- Pause, start, or manually trigger watchers as needed

### Notifications

- **Discord Integration**:
  - Customizable bot username and avatar through settings UI
  - Configurable retry settings with exponential backoff
  - Smart batching system for multiple notifications
  - Detailed listing information with thumbnail images
  - Includes information about which query matched
  - Resilient delivery with automatic retries on failures

### Settings Management

- Configure global notification settings through intuitive UI
- Manage notification batching preferences and limits
- Set appearance options for notifications (username, avatar)
- User profile and security settings with password management
- Account-specific preferences
- Persistent settings stored in database
- Default settings with ability to reset to factory defaults

## 🔜 Upcoming Features

- **Telegram Integration**: Get notified via Telegram.
- **Email Notifications**: Receive notifications via email.
- **Multi-User Support**: Create accounts for multiple users with their own watchers and settings.
- **Enhanced Filters**: More advanced search filtering options (location, category, regex, etc.).
- **Mobile Responsive Design**: Improved UI for mobile devices.

## 📝 Configuration Details

The application now uses a SQLite database to store all settings, watchers, and user accounts, which can be configured through the intuitive web UI. Here's a breakdown of available configuration options:

### Environment Variables

Key environment variables that can be configured:

- `SERVER_PORT` (default: 8080): Backend API server port
- `UI_PORT` (default: 3000): Frontend web UI port
- `DB_PATH`: Path to SQLite database file or directory
  - If directory: database file will be created as `{DB_PATH}/db.sqlite`
  - If file path: used directly (must end with `.sqlite` or `.db`)
  - Production default: `/app/data/db.sqlite`
  - Development default: `./server/src/db.sqlite`
- `JWT_SECRET`: Secret key for JWT token generation (required in production)
- `REFRESH_TOKEN_SECRET`: Secret key for refresh tokens (required in production)
- `LOG_LEVEL` (default: info): Logging verbosity (debug, info, warn, error)
- `NODE_ENV`: Set to 'production' for optimized builds
- `HOST` (default: 0.0.0.0): Host to bind the server to

### Notification Settings

#### Discord Notification Settings

Discord notification settings are fully customizable through the UI:

- **Bot Username**: Change how the bot appears in Discord
- **Avatar URL**: Customize the bot's profile picture
- **Retry Settings**: Configure max retries and delay between attempts
- **Webhook Management**: Add multiple webhooks to different watchers
- **Batch Settings**: Control how many notifications are sent in a single batch

## 🔒 Security Considerations

- JWT tokens expire after 24 hours for enhanced security
- Refresh tokens provide convenient persistent login for up to 30 days
- All sensitive routes are protected by authentication middleware
- Production deployments should use custom JWT secrets via environment variables

## 🐳 Docker Deployment

### Basic deployment with persistent storage:

```sh
docker run -d \
  -p 3000:3000 -p 8080:8080 \
  -v blocket-bot-data:/app/data \
  -e JWT_SECRET=your_secure_jwt_secret \
  -e REFRESH_TOKEN_SECRET=your_secure_refresh_secret \
  -e LOG_LEVEL=info \
  --name blocket-bot \
  rutbergphilip/blocket-bot:2.0.0
```

### Using Docker Compose:

```sh
# Production
docker-compose up -d

# Development with local bind mount
docker-compose --profile dev up -d blocket-bot-dev
```

### Kubernetes Deployment

For Kubernetes deployment, ensure you have:

1. **Persistent Volume** for database storage mounted at `/app/data`
2. **Environment variables** configured via ConfigMap/Secret:
   - `DB_PATH=/app/data` (or custom path)
   - `JWT_SECRET` and `REFRESH_TOKEN_SECRET` (via Secret)
   - `LOG_LEVEL`, `NODE_ENV`, etc. (via ConfigMap)

Example volume configuration:

```yaml
volumeMounts:
  - name: data-storage
    mountPath: /app/data
volumes:
  - name: data-storage
    persistentVolumeClaim:
      claimName: blocket-bot-pvc
```

## 📜 License

This project is licensed under the MIT License.

## ⭐ Star me

If you like Blocket Bot, give it a ⭐!
