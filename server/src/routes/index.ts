import { IncomingMessage, ServerResponse } from 'http';
import { sendDiscordNotification } from '@/services/notification';

export function healthCheckHandler(req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() })
  );
}

export function testDiscordHandler(req: IncomingMessage, res: ServerResponse) {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const ads = JSON.parse(body);
      await sendDiscordNotification(ads);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({ status: 'success', message: 'Notification sent' })
      );
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({ status: 'error', message: (error as Error).message })
      );
    }
  });

  req.on('error', (err) => {
    console.error('Error receiving request:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({ status: 'error', message: 'Internal server error' })
    );
  });
}
