// RAVINI - Unified Push Notifications Client (OneSignal + Native Android + WebPush)
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import OneSignal from '@onesignal/capacitor-plugin';
import { NmyApiClient } from './nmyApiClient';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export class PushClient {
  private static registeredFcmToken: string | null = null;
  private static listenersAttached = false;
  private static currentAuthToken: string | null = null;

  public static isNative(): boolean {
    return typeof window !== 'undefined' && Capacitor.isNativePlatform();
  }

  public static isSupported(): boolean {
    if (this.isNative()) return true;
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  public static getPermissionState(): NotificationPermission {
    if (typeof window === 'undefined') return 'denied';
    if (!('Notification' in window)) {
      return this.isNative() ? 'default' : 'denied';
    }
    return Notification.permission;
  }

  public static async checkNativePermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!this.isNative()) {
      const p = this.getPermissionState();
      return p === 'granted' ? 'granted' : p === 'denied' ? 'denied' : 'prompt';
    }
    try {
      const status = await PushNotifications.checkPermissions();
      return status.receive === 'granted' ? 'granted' : status.receive === 'denied' ? 'denied' : 'prompt';
    } catch {
      return 'prompt';
    }
  }

  public static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (this.isNative() || !this.isSupported()) return null;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      await navigator.serviceWorker.ready;
      return registration;
    } catch (err) {
      console.warn('[PUSH CLIENT] Service Worker registration failed:', err);
      return null;
    }
  }

  private static async sendFcmTokenToBackend(fcmTokenValue: string, authToken: string): Promise<void> {
    try {
      const apiBase = NmyApiClient.getApiBase();
      await fetch(`${apiBase}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          subscription: {
            endpoint: `fcm:${fcmTokenValue}`,
            keys: {
              p256dh: 'fcm',
              auth: 'fcm'
            }
          },
          userAgent: `RAVINI Native Android (App: com.ravini.app, Platform: ${Capacitor.getPlatform()})`
        })
      });
    } catch (e) {
      console.warn('[NATIVE PUSH SUB ERROR]:', e);
    }
  }

  public static async subscribe(token: string): Promise<{ success: boolean; message: string }> {
    this.currentAuthToken = token;

    if (!this.isSupported()) {
      return {
        success: false,
        message: 'Kifaa au kivinjari chako hakiruhusu arifa za moja kwa moja (Push Notifications).'
      };
    }

    // 1. NATIVE ANDROID INTEGRATION (CAPACITOR + FCM)
    if (this.isNative()) {
      try {
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive !== 'granted') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          return {
            success: false,
            message: 'Hujatoa ruhusa ya arifa kwenye simu yako. Tafadhali weka Ruhusu kwenye Mipangilio ya Simu.'
          };
        }

        // Ensure notification channel is created inside Capacitor Android bridge
        if (Capacitor.getPlatform() === 'android') {
          try {
            await PushNotifications.createChannel({
              id: 'ravini_default_channel',
              name: 'RAVINI Notifications',
              description: 'Arifa rasmi za mfumo wa RAVINI na maombi ya NIDA',
              importance: 5,
              visibility: 1,
              sound: 'default',
              vibration: true,
              lights: true,
              lightColor: '#DC2626'
            });
          } catch (channelErr) {
            console.warn('[PUSH CHANNEL NOTICE]:', channelErr);
          }
        }

        // Initialize OneSignal Push Provider
        try {
          const apiBase = NmyApiClient.getApiBase();
          const configRes = await fetch(`${apiBase}/api/public/config`).catch(() => null);
          const configData = configRes ? await configRes.json().catch(() => null) : null;
          const oneSignalAppId = configData?.config?.oneSignalAppId || (import.meta as any).env?.VITE_ONESIGNAL_APP_ID;

          if (oneSignalAppId) {
            await OneSignal.initialize(oneSignalAppId);
            await OneSignal.Notifications.requestPermission(true);

            const activeUser = NmyApiClient.getCurrentUser();
            if (activeUser && activeUser.id) {
              await OneSignal.login(activeUser.id);
              console.log('[ONESIGNAL] User associated with ID:', activeUser.id);
            }

            OneSignal.Notifications.addEventListener('click', (event) => {
              console.log('[ONESIGNAL NOTIFICATION CLICK]:', event);
              const dataUrl = (event.notification.additionalData as any)?.url || '/';
              window.dispatchEvent(new CustomEvent('ravini_navigate', { detail: { url: dataUrl } }));
            });
          }
        } catch (osErr) {
          console.warn('[ONESIGNAL INIT NOTICE]:', osErr);
        }

        // Retrieve or persist cached FCM token for instant session sync
        const cachedFcm = typeof localStorage !== 'undefined' ? localStorage.getItem('ravini_fcm_token') : null;
        if (!this.registeredFcmToken && cachedFcm) {
          this.registeredFcmToken = cachedFcm;
        }

        if (this.registeredFcmToken) {
          await this.sendFcmTokenToBackend(this.registeredFcmToken, token);
        }

        // Attach listeners once
        if (!this.listenersAttached) {
          PushNotifications.addListener('registration', async (fcmToken) => {
            console.log('[NATIVE PUSH] Device registered with FCM token:', fcmToken.value.substring(0, 15) + '...');
            this.registeredFcmToken = fcmToken.value;
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('ravini_fcm_token', fcmToken.value);
            }
            const activeAuthToken = this.currentAuthToken || token;
            await this.sendFcmTokenToBackend(fcmToken.value, activeAuthToken);
          });

          PushNotifications.addListener('registrationError', (error) => {
            console.warn('[NATIVE PUSH REGISTRATION ERROR]:', error);
          });

          // In-app banner when push arrives in foreground
          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('[NATIVE PUSH RECEIVED]:', notification);
          });

          // Deep-link when user taps notification in Android tray
          PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('[NATIVE PUSH TAP ACTION]:', notification);
            const dataUrl = notification.notification.data?.url || '/';
            window.dispatchEvent(new CustomEvent('ravini_navigate', { detail: { url: dataUrl } }));
          });

          // Local notifications tap handler
          try {
            LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
              console.log('[LOCAL NOTIF TAP ACTION]:', notification);
              const dataUrl = notification.notification.extra?.url || '/';
              window.dispatchEvent(new CustomEvent('ravini_navigate', { detail: { url: dataUrl } }));
            });
          } catch {}

          this.listenersAttached = true;
        }

        // Request local notification permissions as well
        try {
          await LocalNotifications.requestPermissions();
        } catch {}

        // Trigger native registration
        await PushNotifications.register();

        return {
          success: true,
          message: 'Kifaa cha Android kimesajiliwa kupokea arifa moja kwa moja!'
        };
      } catch (err: any) {
        console.error('[NATIVE PUSH ERROR]:', err);
        return {
          success: false,
          message: err.message || 'Hitilafu ya kuwezesha arifa kwenye Android.'
        };
      }
    }

    // 2. WEB PUSH / SERVICE WORKER INTEGRATION (BROWSER & PWA)
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return {
          success: false,
          message: 'Hujatoa ruhusa ya arifa. Tafadhali ruhusu arifa kwenye mipangilio ya simu yako.'
        };
      }

      const registration = await this.registerServiceWorker();
      if (!registration) {
        return { success: false, message: 'Hitilafu ya kujiandikisha na Service Worker.' };
      }

      const apiBase = NmyApiClient.getApiBase();
      const keyRes = await fetch(`${apiBase}/api/notifications/vapid-public-key`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const keyData = await keyRes.json();
      if (!keyData.success || !keyData.publicKey) {
        return { success: false, message: 'Hitilafu ya kupata ufunguo wa arifa kutoka seva.' };
      }

      const convertedKey = urlBase64ToUint8Array(keyData.publicKey);
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey as any
        });
      }

      const subRes = await fetch(`${apiBase}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent
        })
      });

      const subData = await subRes.json();
      return {
        success: subData.success,
        message: subData.message || (subData.success ? 'Kifaa kimesajiliwa kupokea arifa moja kwa moja!' : 'Hitilafu ya kusajili arifa.')
      };
    } catch (err: any) {
      console.error('[PUSH CLIENT SUBSCRIBE ERROR]:', err);
      return {
        success: false,
        message: err.message || 'Hitilafu ya kuwezesha arifa za simu.'
      };
    }
  }

  public static async autoRegisterIfGranted(token: string): Promise<boolean> {
    if (!this.isSupported()) return false;

    if (this.isNative()) {
      const perm = await this.checkNativePermission();
      if (perm === 'granted' || perm === 'prompt') {
        const res = await this.subscribe(token);
        return res.success;
      }
      return false;
    }

    if (Notification.permission !== 'granted') return false;

    try {
      const res = await this.subscribe(token);
      return res.success;
    } catch {
      return false;
    }
  }

  public static async unsubscribe(token?: string): Promise<boolean> {
    const apiBase = NmyApiClient.getApiBase();

    if (this.isNative()) {
      try {
        if (this.registeredFcmToken && token) {
          await fetch(`${apiBase}/api/notifications/unsubscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ endpoint: `fcm:${this.registeredFcmToken}` })
          }).catch(() => {});
        }
        try {
          await OneSignal.logout();
        } catch {}
        await PushNotifications.removeAllListeners();
        this.listenersAttached = false;
        this.registeredFcmToken = null;
        this.currentAuthToken = null;
        return true;
      } catch (err) {
        console.warn('[NATIVE PUSH UNSUBSCRIBE ERROR]:', err);
        return false;
      }
    }

    if (!this.isSupported()) return true;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        if (token) {
          await fetch(`${apiBase}/api/notifications/unsubscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ endpoint })
          }).catch(() => {});
        }
      }
      return true;
    } catch (err) {
      console.warn('[PUSH CLIENT UNSUBSCRIBE ERROR]:', err);
      return false;
    }
  }

  public static async sendTestNotification(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const apiBase = NmyApiClient.getApiBase();
      const res = await fetch(`${apiBase}/api/notifications/test-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message || 'Hitilafu ya kutuma arifa.' };
    }
  }

  public static async showLocalSystemNotification(title: string, body: string, url = '/'): Promise<boolean> {
    const displayTitle = title.startsWith('RAVINI') ? title : `RAVINI: ${title}`;

    // 1. Native Android Local Notifications via Capacitor
    if (this.isNative()) {
      try {
        let perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
          perm = await LocalNotifications.requestPermissions();
        }
        if (perm.display === 'granted') {
          await LocalNotifications.schedule({
            notifications: [
              {
                id: Math.floor(Math.random() * 1000000) + 1,
                title: displayTitle,
                body,
                channelId: 'ravini_default_channel',
                sound: 'default',
                smallIcon: 'ic_launcher',
                extra: { url }
              }
            ]
          });
          return true;
        }
      } catch (e) {
        console.warn('[LOCAL NOTIF ERROR]:', e);
      }
    }

    // 2. Service Worker showNotification
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
          return true;
        }
      } catch (e) {
        console.warn('[SW NOTIF ERROR]:', e);
      }
    }

    // 3. Web Notification API
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
        return true;
      } catch (e) {}
    }

    return false;
  }
}
