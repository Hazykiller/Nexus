import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance (singleton)
let pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (!pusherServer) {
    if (!process.env.PUSHER_APP_ID || !process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.PUSHER_SECRET || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
      console.warn('Pusher environment variables are missing. Real-time features disabled.');
      return null;
    }
    try {
      pusherServer = new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.NEXT_PUBLIC_PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        useTLS: true,
      });
    } catch (e) {
      console.error('Failed to initialize Pusher server:', e);
      return null;
    }
  }
  return pusherServer;
}

// Client-side Pusher instance (singleton)
let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (!pusherClient) {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
      console.warn('Pusher client environment variables are missing.');
      return null;
    }
    try {
      pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        authEndpoint: '/api/pusher/auth',
      });
    } catch (e) {
      console.error('Failed to initialize Pusher client:', e);
      return null;
    }
  }
  return pusherClient;
}

// Channel name helpers
export const channels = {
  user: (userId: string) => `private-user-${userId}`,
  conversation: (convId: string) => `private-conversation-${convId}`,
  presence: () => 'presence-online',
  post: (postId: string) => `post-${postId}`,
  notifications: (userId: string) => `private-notifications-${userId}`,
};

// Event name helpers
export const events = {
  NEW_MESSAGE: 'new-message',
  TYPING: 'client-typing',
  STOP_TYPING: 'client-stop-typing',
  MESSAGE_SEEN: 'message-seen',
  NEW_NOTIFICATION: 'new-notification',
  POST_LIKED: 'post-liked',
  POST_COMMENTED: 'post-commented',
  PRESENCE_UPDATE: 'presence-update',
  NEW_REACTION: 'new-reaction',
};
