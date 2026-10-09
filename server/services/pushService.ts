import fs from 'fs';
import path from 'path';
import webpush from 'web-push';
import { initializeApp, getApps, cert, deleteApp, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { pool } from '../../src/db';
import { NmyUserRole } from '../types/nmyTypes';

export interface PushNotificationPayload {
  title: string;
  message?: string;
  body?: string;
  type?: string;
  url?: string;
  eventKey?: string;
  data?: Record<string, any>;
}

export class PushService {
  private static instance: PushService;
  private isConfigured = false;
  private vapidPublicKey = '';
  private vapidPrivateKey = '';
  private fcmAdminApp: App | null = null;
  private fcmMessaging: Messaging | null = null;
  private fcmAuthenticated = false;
  private fcmProject = 'genuine-purpose-m07pf';
  private fcmClientEmail = '';
  private oneSignalAppId = process.env.ONESIGNAL_APP_ID || '';
  private oneSignalRestApiKey = process.env.ONESIGNAL_REST_API_KEY || '';
  private sentEventKeys = new Map<string, number>();

  private constructor() {}

  public static getInstance(): PushService {
    if (!PushService.instance) {
      PushService.instance = new PushService();
    }
    return PushService.instance;
  }

  public async sendOneSignalNotification(
    target: { externalIds?: string[]; segment?: string },
    payload: PushNotificationPayload
  ): Promise<boolean> {
    const appId = this.oneSignalAppId || process.env.ONESIGNAL_APP_ID;
    const apiKey = this.oneSignalRestApiKey || process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !apiKey) {
      return false;
    }

    const displayTitle = payload.title.startsWith('RAVINI') ? payload.title : `RAVINI: ${payload.title}`;
    const messageBody = payload.body || payload.message || 'Una taarifa mpya kwenye akaunti yako ya RAVINI';

    try {
      const body: any = {
        app_id: appId,
        target_channel: 'push',
        headings: { en: displayTitle, sw: displayTitle },
        contents: { en: messageBody, sw: messageBody },
        data: {
          url: payload.url || '/',
          type: payload.type || 'INFO',
          ...(payload.data || {})
        },
        android_channel_id: 'ravini_default_channel',
        priority: 10,
        android_sound: 'default'
      };

      if (target.segment) {
        body.included_segments = [target.segment];
      } else if (target.externalIds && target.externalIds.length > 0) {
        body.include_aliases = {
          external_id: target.externalIds
        };
      } else {
        return false;
      }

      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${apiKey}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('[ONESIGNAL DISPATCH NOTICE]:', response.status, errorText);
        return false;
      }

      const resData: any = await response.json();
      console.log('[ONESIGNAL DISPATCH SUCCESS]:', resData.id, 'recipients:', resData.recipients);
      return true;
    } catch (e: any) {
      console.warn('[ONESIGNAL ERROR]:', e.message);
      return false;
    }
  }

  public isDuplicateEvent(eventKey?: string): boolean {
    if (!eventKey) return false;
    const now = Date.now();
    const lastSent = this.sentEventKeys.get(eventKey);
    if (lastSent && (now - lastSent) < 15000) {
      return true;
    }
    this.sentEventKeys.set(eventKey, now);
    if (this.sentEventKeys.size > 1000) {
      for (const [k, v] of this.sentEventKeys.entries()) {
        if (now - v > 60000) this.sentEventKeys.delete(k);
      }
    }
    return false;
  }

  public async initializeFcm(): Promise<void> {
    try {
      let serviceAccount: any = null;

      // 1. Check environment variable FIREBASE_SERVICE_ACCOUNT_KEY
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
          if (raw.startsWith('{')) {
            serviceAccount = JSON.parse(raw);
          } else {
            const decoded = Buffer.from(raw, 'base64').toString('utf8');
            serviceAccount = JSON.parse(decoded);
          }
        } catch (e: any) {
          console.warn('[PUSH SERVICE] Error parsing FIREBASE_SERVICE_ACCOUNT_KEY env:', e.message);
        }
      }

      // 2. Check GOOGLE_APPLICATION_CREDENTIALS file path
      if (!serviceAccount && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        try {
          const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS.trim();
          if (fs.existsSync(credPath)) {
            serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));
          }
        } catch (e: any) {
          console.warn('[PUSH SERVICE] Error reading GOOGLE_APPLICATION_CREDENTIALS:', e.message);
        }
      }

      // 3. Check local secure server-side file (Not stored in database)
      if (!serviceAccount) {
        const potentialPaths = [
          path.resolve(process.cwd(), 'firebase-service-account.json'),
          path.resolve(process.cwd(), 'service-account.json'),
          path.resolve(__dirname, '../../firebase-service-account.json')
        ];
        for (const p of potentialPaths) {
          if (fs.existsSync(p)) {
            try {
              serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
              break;
            } catch (e: any) {
              console.warn('[PUSH SERVICE] Error reading service account file:', e.message);
            }
          }
        }
      }

      if (serviceAccount && serviceAccount.private_key && serviceAccount.client_email) {
        if (this.fcmAdminApp) {
          try {
            await deleteApp(this.fcmAdminApp);
          } catch (e) {}
        }
        this.fcmProject = serviceAccount.project_id || 'genuine-purpose-m07pf';
        this.fcmClientEmail = serviceAccount.client_email;
        this.fcmAdminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: this.fcmProject
        }, `ravini-fcm-${Date.now()}`);
        this.fcmMessaging = getMessaging(this.fcmAdminApp);
        this.fcmAuthenticated = true;
        console.log(`[PUSH SERVICE] Firebase Admin authenticated successfully with service account: ${this.fcmClientEmail} for project: ${this.fcmProject}`);
      } else {
        const app = getApps().length === 0
          ? initializeApp({ projectId: this.fcmProject })
          : getApps()[0];
        this.fcmMessaging = getMessaging(app);
        this.fcmAuthenticated = false;
        console.log(`[PUSH SERVICE] Firebase Admin initialized with project ${this.fcmProject} (Awaiting secure server secret: FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS)`);
      }
    } catch (fcmErr: any) {
      console.warn('[PUSH SERVICE] FCM init notice:', fcmErr.message);
    }
  }

  public async updateServiceAccount(serviceAccountJson: any): Promise<{ success: boolean; message: string }> {
    try {
      const parsed = typeof serviceAccountJson === 'string' ? JSON.parse(serviceAccountJson) : serviceAccountJson;
      if (!parsed.client_email || !parsed.private_key || !parsed.project_id) {
        return {
          success: false,
          message: 'Faili ya Service Account lazima iwe na project_id, client_email na private_key.'
        };
      }

      // Save strictly to local secure server file (Mode 0600 - Owner read/write only). NEVER write to SQL database.
      const secretPath = path.resolve(process.cwd(), 'firebase-service-account.json');
      fs.writeFileSync(secretPath, JSON.stringify(parsed, null, 2), { mode: 0o600 });

      await this.initializeFcm();

      return {
        success: true,
        message: `Service Account ya FCM kwa mradi wa ${parsed.project_id} imehifadhiwa kwenye secure server storage na kuwashwa kikamilifu!`
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Hitilafu ya kusajili Service Account.' };
    }
  }

  public async removeServiceAccount(): Promise<{ success: boolean; message: string }> {
    try {
      const secretPath = path.resolve(process.cwd(), 'firebase-service-account.json');
      if (fs.existsSync(secretPath)) {
        fs.unlinkSync(secretPath);
      }
      try {
        await pool.query(`DELETE FROM settings WHERE key = 'firebase_service_account'`);
      } catch {}

      if (this.fcmAdminApp) {
        try {
          await deleteApp(this.fcmAdminApp);
        } catch {}
      }
      this.fcmAdminApp = null;
      this.fcmMessaging = null;
      this.fcmAuthenticated = false;
      this.fcmClientEmail = '';
      return { success: true, message: 'FCM Service Account imeondolewa kikamilifu.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Hitilafu ya kuondoa Service Account.' };
    }
  }

  public async getFcmStatus(): Promise<{
    authenticated: boolean;
    projectId: string;
    clientEmail: string;
    oneSignalConfigured: boolean;
    oneSignalAppId: string;
    totalSubscriptions: number;
    fcmSubscriptions: number;
    webSubscriptions: number;
  }> {
    let totalSubs = 0;
    let fcmSubs = 0;
    let webSubs = 0;
    try {
      const res = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE endpoint LIKE 'fcm:%' OR p256dh = 'fcm') as fcm_count,
          COUNT(*) FILTER (WHERE NOT (endpoint LIKE 'fcm:%' OR p256dh = 'fcm')) as web_count
        FROM push_subscriptions
      `);
      if (res.rows.length > 0) {
        totalSubs = parseInt(res.rows[0].total) || 0;
        fcmSubs = parseInt(res.rows[0].fcm_count) || 0;
        webSubs = parseInt(res.rows[0].web_count) || 0;
      }
    } catch (e) {}

    return {
      authenticated: this.fcmAuthenticated,
      projectId: this.fcmProject,
      clientEmail: this.fcmClientEmail,
      oneSignalConfigured: Boolean((this.oneSignalAppId || process.env.ONESIGNAL_APP_ID) && (this.oneSignalRestApiKey || process.env.ONESIGNAL_REST_API_KEY)),
      oneSignalAppId: this.oneSignalAppId || process.env.ONESIGNAL_APP_ID || '',
      totalSubscriptions: totalSubs,
      fcmSubscriptions: fcmSubs,
      webSubscriptions: webSubs
    };
  }

  public async initialize(): Promise<void> {
    if (this.isConfigured) return;

    // 1. Initialize Firebase Admin Cloud Messaging (FCM) for Native Android
    await this.initializeFcm();

    // 2. Load or generate persistent VAPID keys in Cloud SQL settings table for Web Push
    try {
      const vapidRes = await pool.query(`SELECT value FROM settings WHERE key = 'vapid_keys'`);
      if (vapidRes.rowCount && vapidRes.rowCount > 0) {
        const keys = typeof vapidRes.rows[0].value === 'string'
          ? JSON.parse(vapidRes.rows[0].value)
          : vapidRes.rows[0].value;
        this.vapidPublicKey = keys.publicKey;
        this.vapidPrivateKey = keys.privateKey;
      } else {
        const newKeys = webpush.generateVAPIDKeys();
        this.vapidPublicKey = newKeys.publicKey;
        this.vapidPrivateKey = newKeys.privateKey;

        await pool.query(
          `INSERT INTO settings (key, value, updated_at)
           VALUES ('vapid_keys', $1, NOW())
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [JSON.stringify(newKeys)]
        );
        console.log('[PUSH SERVICE] Generated new persistent VAPID keys in Cloud SQL');
      }

      webpush.setVapidDetails(
        'mailto:support@ravini.co.tz',
        this.vapidPublicKey,
        this.vapidPrivateKey
      );

      this.isConfigured = true;
      console.log('[PUSH SERVICE] Initialized with Cloud SQL persistent VAPID keys');
    } catch (err: any) {
      console.error('[PUSH SERVICE INIT ERROR]:', err.message);
      if (!this.vapidPublicKey || !this.vapidPrivateKey) {
        const fallbackKeys = webpush.generateVAPIDKeys();
        this.vapidPublicKey = fallbackKeys.publicKey;
        this.vapidPrivateKey = fallbackKeys.privateKey;
        webpush.setVapidDetails(
          'mailto:support@ravini.co.tz',
          this.vapidPublicKey,
          this.vapidPrivateKey
        );
        this.isConfigured = true;
      }
    }
  }

  public async getPublicKey(): Promise<string> {
    if (!this.isConfigured) {
      await this.initialize();
    }
    return this.vapidPublicKey;
  }

  public async saveSubscription(
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    userAgent?: string
  ): Promise<void> {
    if (!this.isConfigured) {
      await this.initialize();
    }

    const id = `push_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await pool.query(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (endpoint) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth,
         user_agent = EXCLUDED.user_agent,
         updated_at = NOW()`,
      [id, userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, userAgent || null]
    );
  }

  public async removeSubscription(endpoint: string): Promise<void> {
    await pool.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [endpoint]);
  }

  private async deliverToSingleEndpoint(
    endpoint: string,
    p256dh: string,
    auth: string,
    title: string,
    messageBody: string,
    payload: PushNotificationPayload
  ): Promise<boolean> {
    const displayTitle = title.startsWith('RAVINI') ? title : `RAVINI: ${title}`;

    // 1. NATIVE ANDROID FCM TOKEN
    if (endpoint.startsWith('fcm:') || p256dh === 'fcm') {
      const fcmToken = endpoint.replace(/^fcm:/, '');
      if (!this.fcmMessaging) {
        console.warn('[FCM PUSH] Messaging not initialized, cannot deliver to FCM token');
        return false;
      }
      try {
        await this.fcmMessaging.send({
          token: fcmToken,
          notification: {
            title: displayTitle,
            body: messageBody
          },
          data: {
            url: payload.url || '/',
            type: payload.type || 'INFO',
            timestamp: String(Date.now()),
            ...(payload.data ? Object.fromEntries(Object.entries(payload.data).map(([k, v]) => [k, String(v)])) : {})
          },
          android: {
            priority: 'high',
            notification: {
              title: displayTitle,
              body: messageBody,
              sound: 'default',
              defaultSound: true,
              defaultVibrateTimings: true,
              clickAction: 'OPEN_ACTIVITY',
              channelId: 'ravini_default_channel',
              visibility: 'public'
            }
          }
        });
        return true;
      } catch (fcmErr: any) {
        if (
          fcmErr.code === 'messaging/registration-token-not-registered' ||
          fcmErr.code === 'messaging/invalid-registration-token'
        ) {
          await this.removeSubscription(endpoint);
        } else {
          console.warn('[FCM PUSH DELIVERY ERROR]:', fcmErr.message);
        }
        return false;
      }
    }

    // 2. STANDARD WEB PUSH (BROWSER & PWA)
    const pushSubscription = {
      endpoint,
      keys: { p256dh, auth }
    };
    const notificationPayload = JSON.stringify({
      title: displayTitle,
      message: messageBody,
      body: messageBody,
      type: payload.type || 'INFO',
      url: payload.url || '/',
      data: payload.data || {},
      timestamp: Date.now()
    });

    try {
      await webpush.sendNotification(pushSubscription, notificationPayload);
      return true;
    } catch (sendErr: any) {
      if (sendErr.statusCode === 404 || sendErr.statusCode === 410) {
        await this.removeSubscription(endpoint);
      } else {
        console.warn('[WEB PUSH DELIVERY WARNING]:', sendErr.message);
      }
      return false;
    }
  }

  public async sendNotificationToUser(
    userId: string,
    payload: PushNotificationPayload
  ): Promise<number> {
    if (payload.eventKey && this.isDuplicateEvent(payload.eventKey)) {
      console.log(`[PUSH DEDUP] Skipping duplicate notification for key: ${payload.eventKey}`);
      return 0;
    }

    if (!this.isConfigured) {
      await this.initialize();
    }

    let delivered = 0;

    // 1. OneSignal remote push dispatch (Primary External Push Provider)
    try {
      const osSuccess = await this.sendOneSignalNotification({ externalIds: [userId] }, payload);
      if (osSuccess) delivered++;
    } catch (osErr: any) {
      console.warn('[ONESIGNAL SEND NOTICE]:', osErr.message);
    }

    try {
      const res = await pool.query(
        `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
        [userId]
      );

      if (res.rowCount === 0) {
        return delivered;
      }

      const messageBody = payload.message || payload.body || '';

      for (const row of res.rows) {
        const ok = await this.deliverToSingleEndpoint(
          row.endpoint,
          row.p256dh,
          row.auth,
          payload.title,
          messageBody,
          payload
        );
        if (ok) delivered++;
      }

      return delivered;
    } catch (err: any) {
      console.error('[PUSH SERVICE SEND ERROR]:', err.message);
      return delivered;
    }
  }

  public async broadcastNotification(payload: PushNotificationPayload): Promise<number> {
    if (payload.eventKey && this.isDuplicateEvent(payload.eventKey)) {
      console.log(`[PUSH DEDUP] Skipping duplicate broadcast for key: ${payload.eventKey}`);
      return 0;
    }

    if (!this.isConfigured) {
      await this.initialize();
    }

    let delivered = 0;

    // 1. OneSignal broadcast to all devices
    try {
      const osSuccess = await this.sendOneSignalNotification({ segment: 'Total Subscriptions' }, payload);
      if (osSuccess) delivered++;
    } catch (osErr: any) {
      console.warn('[ONESIGNAL BROADCAST NOTICE]:', osErr.message);
    }

    try {
      const res = await pool.query(`SELECT endpoint, p256dh, auth FROM push_subscriptions`);
      if (res.rowCount === 0) return delivered;

      const messageBody = payload.message || payload.body || '';

      for (const row of res.rows) {
        const ok = await this.deliverToSingleEndpoint(
          row.endpoint,
          row.p256dh,
          row.auth,
          payload.title,
          messageBody,
          payload
        );
        if (ok) delivered++;
      }

      return delivered;
    } catch (err: any) {
      console.error('[PUSH BROADCAST ERROR]:', err.message);
      return delivered;
    }
  }

  public async sendNotificationToRole(role: NmyUserRole, payload: PushNotificationPayload): Promise<number> {
    if (payload.eventKey && this.isDuplicateEvent(payload.eventKey)) {
      console.log(`[PUSH DEDUP] Skipping duplicate role notification for key: ${payload.eventKey}`);
      return 0;
    }

    if (!this.isConfigured) {
      await this.initialize();
    }

    let delivered = 0;

    // 1. OneSignal role-based dispatch
    try {
      const roleUsers = await pool.query('SELECT id FROM users WHERE role = $1 AND is_active = true', [role]);
      const userIds = roleUsers.rows.map((r: any) => r.id);
      if (userIds.length > 0) {
        const osSuccess = await this.sendOneSignalNotification({ externalIds: userIds }, payload);
        if (osSuccess) delivered++;
      }
    } catch (osErr: any) {
      console.warn('[ONESIGNAL ROLE DISPATCH NOTICE]:', osErr.message);
    }

    try {
      const res = await pool.query(
        `SELECT ps.endpoint, ps.p256dh, ps.auth
         FROM push_subscriptions ps
         JOIN users u ON ps.user_id = u.id
         WHERE u.role = $1`,
        [role]
      );

      if (res.rowCount === 0) return delivered;

      const messageBody = payload.message || payload.body || '';

      for (const row of res.rows) {
        const ok = await this.deliverToSingleEndpoint(
          row.endpoint,
          row.p256dh,
          row.auth,
          payload.title,
          messageBody,
          payload
        );
        if (ok) delivered++;
      }

      return delivered;
    } catch (err: any) {
      console.error('[PUSH ROLE ERROR]:', err.message);
      return delivered;
    }
  }
}

export const pushService = PushService.getInstance();
