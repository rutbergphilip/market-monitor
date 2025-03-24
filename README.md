# 🚀 Blocket Bot

Monitor Blocket listings effortlessly and get instant notifications for new ads, right in Discord or your inbox!

## 🌟 Features

- **Automated Listing Monitoring**: Track new Blocket ads with custom queries.
- **Flexible Search Filters**: Customize ad searches precisely to your needs.
- **Instant Notifications**:
  - Discord webhook notifications ✅
- **Docker & Kubernetes Ready**: Easy deployment with containerization support.

## 🔜 Upcoming Features

- **Telegram Notifications**: Get notified via Telegram.
- **Email Notifications**: Send email alerts for new listings.
- **Price Monitoring**: Track price changes and get notified.
- **Batch Notifications**: Group notifications for better organization.

## ⚙️ Getting Started

### 🚧 Installation

Clone the repository and install dependencies:

```sh
git clone https://github.com/rutbergphilip/blocket-bot
cd blocket-bot
npm install
```

### 🔑 Configuration

Create a `.env` file in the project root and add your configuration:

```env
BLOCKET_AD_QUERIES=<your-query-1>,<your-query-2>
NOTIFICATION_DISCORD_ENABLED=true
NOTIFICATION_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url
```

See the full list of configuration options below.

### 🛠️ Configuration Options

#### Required

- `BLOCKET_AD_QUERIES`: Comma-separated Blocket search queries.

#### Optional

##### General

- `PORT` (default: 8080): Health check server port.

##### Blocket Query

| Variable                  | Default              | Description                 |
| ------------------------- | -------------------- | --------------------------- |
| `BLOCKET_AD_LIMIT`        | 60                   | Max ads fetched per query   |
| `BLOCKET_AD_SORT`         | rel                  | Sort order                  |
| `BLOCKET_AD_LISTING_TYPE` | s                    | Type of listing             |
| `BLOCKET_AD_STATUS`       | active               | Status filter               |
| `BLOCKET_AD_GL`           | 3                    | Geolocation filter          |
| `BLOCKET_AD_INCLUDE`      | extend_with_shipping | Additional query parameters |

##### Notifications

###### Discord

| Variable                           | Default     | Description                  |
| ---------------------------------- | ----------- | ---------------------------- |
| `NOTIFICATION_DISCORD_ENABLED`     | false       | Enable Discord notifications |
| `NOTIFICATION_DISCORD_WEBHOOK_URL` |             | Discord webhook URL          |
| `NOTIFICATION_DISCORD_USERNAME`    | Blocket Bot | Discord bot username         |
| `NOTIFICATION_DISCORD_AVATAR_URL`  |             | Optional bot avatar URL      |
| `NOTIFICATION_DISCORD_MAX_RETRIES` | 3           | Retry attempts for webhook   |
| `NOTIFICATION_DISCORD_RETRY_DELAY` | 1000ms      | Retry delay (ms)             |

<!-- ###### Email (Upcoming)

| Variable                       | Default              | Description                |
| ------------------------------ | -------------------- | -------------------------- |
| `NOTIFICATION_EMAIL_ENABLED`   | false                | Enable email notifications |
| `NOTIFICATION_EMAIL_FROM`      |                      | Sender email               |
| `NOTIFICATION_EMAIL_TO`        |                      | Recipient email            |
| `NOTIFICATION_EMAIL_SUBJECT`   | New Blocket Listings | Email subject              |
| `NOTIFICATION_EMAIL_SMTP_HOST` |                      | SMTP server                |
| `NOTIFICATION_EMAIL_SMTP_PORT` | 587                  | SMTP port                  |
| `NOTIFICATION_EMAIL_SMTP_USER` |                      | SMTP username              |
| `NOTIFICATION_EMAIL_SMTP_PASS` |                      | SMTP password              |
| `NOTIFICATION_EMAIL_USE_TLS`   | true                 | Use TLS for SMTP           | -->

##### Batching

- `NOTIFICATION_ENABLE_BATCHING`: Enable batching (default: true)
- `NOTIFICATION_BATCH_SIZE`: Max notifications per batch (default: 10)

##### Cron Job

- `BLOCKET_CRON_TIME`: Cron schedule (default: _/5 _ \* \* \*)
- `BLOCKET_TIMEZONE`: Job timezone (default: Europe/Stockholm)
- `BLOCKET_RUN_ON_INIT`: Run immediately on startup (default: true)

##### Monitoring

- `OPT_PRICE_CHANGES`: Enable price change alerts (default: false)
- `OPT_PRICE_MIN`: Min price (default: null)
- `OPT_PRICE_MAX`: Max price (default: null)
- `OPT_PRICE_CURRENCY`: Currency (default: SEK)

## 🐳 Docker Deployment

Build Docker image:

```sh
docker build -t blocket-bot .
```

Run Docker container:

```sh
docker run -d \
 -e BLOCKET_AD_QUERIES=<your-queries> \
 -e NOTIFICATION_DISCORD_ENABLED=true \
 -e NOTIFICATION_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url \
 -p 8080:8080 \
 blocket-bot
```

## 💻 Running Locally

Start the bot with:

```sh
npm start
```

## 📜 License

This project is licensed under the MIT License.

## ⭐ Star me!

If you like Blocket Bot, give it a ⭐!
