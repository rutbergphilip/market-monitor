/**
 * Example usage of the SSE (Server-Sent Events) system
 * 
 * This file demonstrates how to use the SSE system to send real-time events
 * to connected clients from different parts of the application.
 */

import { sendSSEEvent, sendSSEEventToUser } from '@/controllers/sse';
import type { 
  WatcherStatusUpdateEvent, 
  WatcherNewListingEvent, 
  SystemErrorEvent,
  NotificationSentEvent 
} from '@/types/sse';
import type { BlocketAd } from 'blocket.js';

// Example: Sending a watcher status update to all connected clients
export function broadcastWatcherStatusUpdate(
  watcherId: string, 
  status: 'active' | 'stopped' | 'running' | 'error',
  message?: string
): void {
  const event: WatcherStatusUpdateEvent = {
    type: 'watcher:status_update',
    data: {
      watcherId,
      status,
      message,
      lastRun: new Date().toISOString(),
    },
  };

  sendSSEEvent(event);
}

// Example: Sending a new listing notification to a specific user
export function notifyUserOfNewListing(
  userId: string,
  watcherId: string, 
  watcherQuery: string,
  listing: BlocketAd,
  matchedFilters: string[]
): void {
  const event: WatcherNewListingEvent = {
    type: 'watcher:new_listing',
    data: {
      watcherId,
      watcherQuery,
      listing,
      matchedFilters,
    },
  };

  sendSSEEventToUser(userId, event);
}

// Example: Broadcasting system errors to all clients
export function broadcastSystemError(
  error: string, 
  code?: string, 
  context?: Record<string, any>
): void {
  const event: SystemErrorEvent = {
    type: 'system:error',
    data: {
      error,
      code,
      timestamp: new Date().toISOString(),
      context,
    },
  };

  sendSSEEvent(event);
}

// Example: Notify user about notification status
export function notifyNotificationSent(
  userId: string,
  watcherId: string,
  notificationType: 'DISCORD' | 'EMAIL',
  success: boolean,
  message?: string
): void {
  const event: NotificationSentEvent = {
    type: 'notification:sent',
    data: {
      watcherId,
      notificationType,
      success,
      message,
      timestamp: new Date().toISOString(),
    },
  };

  sendSSEEventToUser(userId, event);
}

// Example: How to integrate with existing watcher service
export class WatcherSSEService {
  
  // Call this when a watcher starts running
  static onWatcherStarted(watcherId: string): void {
    broadcastWatcherStatusUpdate(watcherId, 'running', 'Watcher started scanning for listings');
  }

  // Call this when a watcher completes successfully
  static onWatcherCompleted(watcherId: string, foundListings: number): void {
    broadcastWatcherStatusUpdate(
      watcherId, 
      'active', 
      `Scan completed. Found ${foundListings} new listings.`
    );
  }

  // Call this when a watcher encounters an error
  static onWatcherError(watcherId: string, error: string): void {
    broadcastWatcherStatusUpdate(watcherId, 'error', `Error: ${error}`);
  }

  // Call this when a new listing matches watcher criteria
  static onNewListingFound(
    userId: string, 
    watcherId: string, 
    query: string, 
    listing: BlocketAd
  ): void {
    notifyUserOfNewListing(userId, watcherId, query, listing, ['price', 'location']);
  }
}

// Example: How to integrate with notification service
export class NotificationSSEService {
  
  // Call this after attempting to send a Discord notification
  static onDiscordNotificationSent(
    userId: string, 
    watcherId: string, 
    success: boolean, 
    error?: string
  ): void {
    notifyNotificationSent(
      userId, 
      watcherId, 
      'DISCORD', 
      success, 
      success ? 'Discord notification sent successfully' : `Failed to send Discord notification: ${error}`
    );
  }

  // Call this after attempting to send an email notification
  static onEmailNotificationSent(
    userId: string, 
    watcherId: string, 
    success: boolean, 
    error?: string
  ): void {
    notifyNotificationSent(
      userId, 
      watcherId, 
      'EMAIL', 
      success, 
      success ? 'Email notification sent successfully' : `Failed to send email notification: ${error}`
    );
  }
}