# 🚀 Blocket Bot 2.0

Monitor Blocket listings effortlessly with a beautiful UI and get instant notifications for new ads—right in Discord!

## 🌟 Features

- **Modern Web Dashboard**: Manage your watchers with an intuitive web interface.
- **User Authentication**: Secure login system with JWT tokens and refresh token functionality.
- **Multi-User Support**: Create accounts for multiple users with their own watchers and settings.
- **Customizable Watchers**: Create multiple independent watchers with different queries.
- **Real-time Notifications**:
  - Discord webhook notifications with rich embeds ✅
  - Detailed listing information with prices and images
  - Search query information included in notifications
- **Flexible Scheduling**: Set custom cron schedules for each watcher.
- **Price Range Filtering**: Filter listings by minimum and maximum price.
- **Manual Trigger**: Run watchers on-demand without waiting for scheduled times.
- **Configurable Settings**: Customize notification appearance and behavior.
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
  -v blocket-bot-data:/app/server/src/db \
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
- Session management with the ability to revoke tokens

### Watchers

- Create multiple watchers with different search queries
- Set custom cron schedules for each watcher
- Filter by price range (min & max)
- Configure multiple notification targets per watcher
- Pause, start, or manually trigger watchers as needed

### Notifications

- **Discord Integration**:
  - Customizable bot username and avatar
  - Configurable retry settings
  - Detailed listing information with thumbnail images
  - Includes information about which query matched
- **Email Notifications** (Coming soon)

### Settings Management

- Configure global notification settings
- Manage batching preferences
- Set appearance options for notifications
- User profile and security settings
- Account-specific preferences

## 🔜 Upcoming Features

- **Email Notifications**: Send email alerts for new listings.
- **Telegram Integration**: Get notified via Telegram.
- **Enhanced Filters**: More advanced search filtering options.
- **Two-Factor Authentication**: Additional security layer for user accounts.

## 📝 Configuration Details

The application now uses a database to store settings, which can be configured through the UI. Some settings that might be useful for advanced users:

### Environment Variables

For convenience, a `.env.example` file is included in the repository with default values and documentation. You can copy this file to create your own `.env` file:

```sh
cp .env.example .env
```

Key environment variables:

- `SERVER_PORT` (default: 8080): Backend API server port
- `UI_PORT` (default: 3000): Frontend web UI port
- `DB_PATH` (default: db.sqlite): Path to SQLite database file
- `JWT_SECRET`: Secret key for JWT token generation (important to set in production)
- `REFRESH_TOKEN_SECRET`: Secret key for refresh tokens (important to set in production)

### Discord Notification Settings

Discord notification settings, such as the bot username, avatar URL, and retry behavior, are managed through the UI. Default values are used during initial setup, and users can customize these settings via the web interface.

## 🔒 Security Considerations

- JWT tokens expire after 24 hours for enhanced security
- Refresh tokens provide convenient persistent login for up to 30 days
- All sensitive routes are protected by authentication middleware
- Production deployments should use custom JWT secrets via environment variables

## 🐳 Docker Deployment

Run with persistent storage:

```sh
docker run -d \
  -p 3000:3000 -p 8080:8080 \
  -v blocket-bot-data:/app/server/src/db \
  --name blocket-bot \
  rutbergphilip/blocket-bot:2.0.0
```

For custom UI port:

```sh
docker run -d \
  -p 4000:3000 -p 8080:8080 \
  -v blocket-bot-data:/app/server/src/db \
  -e UI_PORT=3000 \
  --name blocket-bot \
  rutbergphilip/blocket-bot:2.0.0
```

## 📜 License

This project is licensed under the MIT License.

## ⭐ Star me!

If you like Blocket Bot, give it a ⭐!
