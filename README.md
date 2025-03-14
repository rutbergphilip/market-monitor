# Blocket Bot

Monitor listings on Blocket and get notified when new items are posted.

## Features

- Automated monitoring of Blocket listings
- Customizable search queries and filters
- Notifications via Discord webhook
- Email notifications (feature-flagged, disabled by default, upcoming feature)
- Docker and Kubernetes ready deployment

## Configuration

### Required Environment Variables

- `BLOCKET_AD_QUERY`: The query to search for Blocket ads. This is required for the bot to function.

### Optional Environment Variables

#### General Settings

- `PORT`: The port on which the health check server will run (default: 8080)

#### Blocket Query Settings

- `BLOCKET_AD_LIMIT`: The maximum number of ads to fetch (default: 60)
- `BLOCKET_AD_SORT`: The sorting order of the ads (default: 'rel')
- `BLOCKET_AD_LISTING_TYPE`: The type of listing (default: 's')
- `BLOCKET_AD_STATUS`: The status of the ads to fetch (default: 'active')
- `BLOCKET_AD_GL`: The geolocation filter (default: 3)
- `BLOCKET_AD_INCLUDE`: Additional parameters to include in the query (default: 'extend_with_shipping')

#### Notification Settings

- `NOTIFICATION_DISCORD_ENABLED`: Enable Discord notifications (default: `false`)
- `NOTIFICATION_DISCORD_WEBHOOK_URL`: Discord webhook URL
- `NOTIFICATION_DISCORD_USERNAME`: Bot username in Discord (default: "Blocket Bot")
- `NOTIFICATION_DISCORD_AVATAR_URL`: Optional avatar URL for the bot
- `NOTIFICATION_DISCORD_MAX_RETRIES`: Number of retries for failed webhooks (default: 3)
- `NOTIFICATION_DISCORD_RETRY_DELAY`: Base delay between retries in ms (default: 1000)
- `NOTIFICATION_EMAIL_ENABLED`: Enable email notifications (default: `false`)
- `NOTIFICATION_EMAIL_FROM`: Sender email address
- `NOTIFICATION_EMAIL_TO`: Recipient email address
- `NOTIFICATION_EMAIL_SUBJECT`: Email subject (default: "New Blocket Listings")
- `NOTIFICATION_EMAIL_SMTP_HOST`: SMTP server hostname
- `NOTIFICATION_EMAIL_SMTP_PORT`: SMTP server port (default: 587)
- `NOTIFICATION_EMAIL_SMTP_USER`: SMTP username
- `NOTIFICATION_EMAIL_SMTP_PASS`: SMTP password
- `NOTIFICATION_EMAIL_USE_TLS`: Use TLS for SMTP connection (default: `true`)
- `NOTIFICATION_BATCH_SIZE`: Maximum number of notifications to send in one batch (default: 10)
- `NOTIFICATION_ENABLE_BATCHING`: Enable/disable notification batching (default: `true`)

#### Cron Job Settings

- `BLOCKET_CRON_TIME`: The cron schedule for running the Blocket job (default: '_/5_ \* \* \*')
- `BLOCKET_TIMEZONE`: The timezone for the cron job (default: 'Europe/Stockholm')
- `BLOCKET_RUN_ON_INIT`: Whether to run the job immediately on startup (default: `true`)

#### Monitoring Settings

- `OPT_PRICE_CHANGES`: Enable price change monitoring (default: `false`)
- `OPT_PRICE_MIN`: Minimum price for monitoring (default: `null`)
- `OPT_PRICE_MAX`: Maximum price for monitoring (default: `null`)
- `OPT_PRICE_CURRENCY`: Currency for price monitoring (default: 'SEK')

## Deployment

### Docker

To build and run the Docker container:

```bash
# Build the Docker image
docker build -t blocket-bot .

# Run the Docker container
# Make sure to set the required environment variables
# Replace <your-query> with your actual Blocket query
# Optionally, set other environment variables as needed

docker run -d \
  -e BLOCKET_AD_QUERY=<your-query> \
  -e NOTIFICATION_DISCORD_ENABLED=true \
  -e NOTIFICATION_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url \
  -p 8080:8080 \
  blocket-bot
```

## Running Locally

To run the bot locally:

### Install dependencies

```bash
npm install
```

### Create### `.env`###ile with your configuration

```env
BLCKET_AD_envQUERY=your-queenvry>
NOIFICATION_DISCORD_ENABLED=true
NOTIFICATION_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url
# Add other settings as needed
```

### Start the application

```bash
npm start
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
