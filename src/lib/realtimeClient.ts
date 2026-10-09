import { NmyApiClient } from './nmyApiClient';
import { PushClient } from './pushClient';

export interface RealtimeEventPayload {
  type: 'REQUEST_CREATED' | 'REQUEST_UPDATED' | 'CREDIT_UPDATED' | 'NEW_REQUEST' | 'ANNOUNCEMENT_CREATED';
  [key: string]: any;
}

// Helper to trigger system notification outside the app (Status bar / Notification tray)
async function showExternalSystemNotification(title: string, body: string, url = '/') {
  // Delegate directly to PushClient's unified system notification handler (LocalNotifications + SW + Web)
  try {
    const success = await PushClient.showLocalSystemNotification(title, body, url);
    if (success) return;
  } catch (e) {
    console.warn('[PUSH DELEGATION NOTICE]:', e);
  }

  const displayTitle = title.startsWith('RAVINI') ? title : `RAVINI: ${title}`;

  // 1. Try Service Worker message
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title: displayTitle,
        body,
        url,
        tag: `ravini_${Date.now()}`
      });
      return;
    } catch {}
  }

  // 2. Try Service Worker registration.showNotification
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(displayTitle, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: `ravini_${Date.now()}`,
          vibrate: [0, 250, 250, 250],
          data: { url }
        } as any);
        return;
      }
    } catch {}
  }

  // 3. Try standard Web Notification
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const n = new Notification(displayTitle, {
        body,
        icon: '/pwa-192x192.png',
        tag: `ravini_${Date.now()}`
      });
      n.onclick = () => {
        window.focus();
        window.location.href = url;
      };
    } catch {}
  }
}

export class RealtimeClient {
  private static instance: RealtimeClient;
  private eventSource: EventSource | null = null;
  private reconnectTimer: any = null;
  private reconnectAttempts = 0;
  private isConnected = false;
  private currentToken: string | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Reconnect immediately when window gains focus/visibility if lost
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.currentToken && !this.isConnected) {
          this.connect(this.currentToken);
        }
      });

      // Handle network online / offline
      window.addEventListener('online', () => {
        if (this.currentToken) {
          this.connect(this.currentToken);
        }
      });
      window.addEventListener('offline', () => {
        this.disconnect();
      });
    }
  }

  public static getInstance(): RealtimeClient {
    if (!RealtimeClient.instance) {
      RealtimeClient.instance = new RealtimeClient();
    }
    return RealtimeClient.instance;
  }

  public connect(token: string): void {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    this.currentToken = token;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      const apiBase = NmyApiClient.getApiBase();
      const sseUrl = `${apiBase}/api/realtime/stream?token=${encodeURIComponent(token)}`;

      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        if (!event.data || event.data.startsWith(':')) return; // Ignore heartbeat/comments
        try {
          const payload: RealtimeEventPayload = JSON.parse(event.data);
          window.dispatchEvent(new CustomEvent('ravini_realtime_event', { detail: payload }));

          // TRIGGER OUTSIDE ANDROID NOTIFICATION TRAY NOTIFICATION
          let title = 'Taarifa Mpya ya RAVINI';
          let body = 'Una taarifa mpya kwenye akaunti yako ya RAVINI.';
          let targetUrl = '/';

          if (payload.type === 'NEW_REQUEST') {
            title = 'Ombi Jipya la NIDA';
            body = payload.message || 'Ombi jipya la NIDA limeingia kwenye foleni ya usindikaji.';
            targetUrl = '/requests';
          } else if (payload.type === 'REQUEST_UPDATED') {
            title = payload.status === 'COMPLETED' ? 'Majibu ya NIDA Yapo Tayari' : 'Ombi Limesasishwa';
            body = payload.message || `Ombi la namba ${payload.phoneNumber || ''} limesasishwa.`;
            targetUrl = '/requests';
          } else if (payload.type === 'CREDIT_UPDATED') {
            title = 'Salio Lako Limeongezwa';
            body = payload.message || `Salio lako jipya ni TSh ${payload.newBalance?.toLocaleString() || ''}.`;
            targetUrl = '/profile';
          } else if (payload.type === 'ANNOUNCEMENT_CREATED') {
            title = payload.title || 'Tangazo Jipya la RAVINI';
            body = payload.message || 'Kuna tangazo jipya kutoka ofisi ya RAVINI.';
            targetUrl = '/announcements';
          }

          showExternalSystemNotification(title, body, targetUrl);
        } catch (e) {
          // Ignore parse errors on malformed messages
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        // Exponential backoff reconnect: 2s, 4s, 8s, up to 30s
        if (this.currentToken && document.visibilityState === 'visible') {
          const delay = Math.min(30000, 2000 * Math.pow(1.5, this.reconnectAttempts));
          this.reconnectAttempts++;
          this.reconnectTimer = setTimeout(() => {
            if (this.currentToken) {
              this.connect(this.currentToken);
            }
          }, delay);
        }
      };
    } catch {
      // EventSource failed to instantiate
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
  }
}

export const realtimeClient = RealtimeClient.getInstance();
