# Blocket Bot

Monitor listings on Blocket and get notified when new items are posted.

## Features

- Automated monitoring of Blocket listings
- Customizable search queries and filters
- Notifications via Discord webhook
- Email notifications (feature-flagged, disabled by default)
- Docker and Kubernetes ready deployment

## Notification Integrations

### Discord Integration

Discord notifications are enabled by default and can be configured by setting the following environment variables:

- `NOTIFICATION_DISCORD_ENABLED`: Enable Discord notifications (default: `false`)
- `NOTIFICATION_DISCORD_WEBHOOK_URL`: Discord webhook URL
- `NOTIFICATION_DISCORD_USERNAME`: Bot username in Discord (default: "Blocket Bot")
- `NOTIFICATION_DISCORD_AVATAR_URL`: Optional avatar URL for the bot
- `NOTIFICATION_DISCORD_MAX_RETRIES`: Number of retries for failed webhooks (default: 3)
- `NOTIFICATION_DISCORD_RETRY_DELAY`: Base delay between retries in ms (default: 1000)

### Email Integration (Feature-Flagged)

Email notifications are disabled by default and can be enabled by setting the following environment variables:

- `NOTIFICATION_EMAIL_ENABLED`: Enable email notifications (default: `false`)
- `NOTIFICATION_EMAIL_FROM`: Sender email address
- `NOTIFICATION_EMAIL_TO`: Recipient email address
- `NOTIFICATION_EMAIL_SUBJECT`: Email subject (default: "New Blocket Listings")
- `NOTIFICATION_EMAIL_SMTP_HOST`: SMTP server hostname
- `NOTIFICATION_EMAIL_SMTP_PORT`: SMTP server port (default: 587)
- `NOTIFICATION_EMAIL_SMTP_USER`: SMTP username
- `NOTIFICATION_EMAIL_SMTP_PASS`: SMTP password
- `NOTIFICATION_EMAIL_USE_TLS`: Use TLS for SMTP connection (default: `true`)

### General Notification Settings

- `NOTIFICATION_BATCH_SIZE`: Maximum number of notifications to send in one batch (default: 10)
- `NOTIFICATION_ENABLE_BATCHING`: Enable/disable notification batching (default: `true`)

## Deployment

### Docker

The simplest way to deploy the bot is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/yourusername/blocket-bot.git
cd blocket-bot

# Edit the docker-compose.yml file to set your webhook URL and other settings

# Run with Docker Compose
docker-compose up -d
```

### Kubernetes

To deploy to Kubernetes:

```bash
# Apply the Kubernetes configuration
kubectl apply -f kubernetes/deployment.yaml

# Create the secret for sensitive information
# Replace values with your actual secrets
kubectl create secret generic blocket-bot-secrets \
  --from-literal=NOTIFICATION_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url \
  --from-literal=NOTIFICATION_EMAIL_SMTP_USER=user \
  --from-literal=NOTIFICATION_EMAIL_SMTP_PASS=password
```

## Running Locally

To run the bot locally:

1. Install dependencies:

   ```
   npm install
   ```

2. Create a `.env` file with your configuration:

   ```
   NOTIFICATION_DISCORD_ENABLED=true
   NOTIFICATION_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url
   # Add other settings as needed
   ```

3. Start the application:
   ```
   npm start
   ```

## License

MIT
