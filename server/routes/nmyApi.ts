import { Router, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../../src/db';
import { getNmyDb } from '../db/nmyDb';
import { getNmyBackupService } from '../services/nmyBackupService';
import { chatSocketServer } from '../realtime/chatSocketServer';
import { pushService } from '../services/pushService';
import { realtimeService } from '../services/realtimeService';
import { authRateLimiter, transactionRateLimiter } from '../middleware/rateLimiter';
import {
  nmyAuthMiddleware,
  requireNmyRole,
  requireNmyPermission,
  NmyAuthRequest
} from '../middleware/nmyAuth';
import {
  NmyUser,
  NmyUserRole,
  NmySession,
  NmyRequest
} from '../types/nmyTypes';

const router = Router();
const db = getNmyDb();
const backupService = getNmyBackupService();

// Helper: Normalize phone to 255XXXXXXXXX
function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('255') && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return '255' + digits.substring(1);
  }
  if (digits.length === 9) {
    return '255' + digits;
  }
  return digits;
}

// Helper: Phone masking for privacy (RULE 26: Normal Admin customer phone privacy)
function maskCustomerPhone(phone: string): string {
  if (!phone || phone.length < 8) return '****';
  return phone.slice(0, 4) + '***' + phone.slice(-3);
}

function sanitizeRequestForViewer(req: NmyRequest, viewer: NmyUser): NmyRequest {
  if (viewer.role === 'SUPER_ADMIN' || viewer.permissions?.includes('VIEW_CUSTOMER_PHONE')) {
    return req;
  }
  return {
    ...req,
    customerPhone: maskCustomerPhone(req.customerPhone)
  };
}

// Helper: Format Request ID NMY-YYYYMMDD-XXXXXX
function generateRequestId(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NMY-${yyyy}${mm}${dd}-${rand}`;
}

// -------------------------------------------------------------
// 1. HEALTH & PUBLIC CONFIGURATION
// -------------------------------------------------------------
router.get('/health', async (_req, res) => {
  try {
    const settings = await db.getSettings();
    res.json({
      status: 'ok',
      vision: 'VISION_2',
      version: '2.1.0',
      application: 'PASS',
      database: 'PASS',
      auth: 'PASS',
      platform: settings.platformName,
      company: settings.companyName,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.get('/public/config', async (_req, res) => {
  try {
    const settings = await db.getSettings();
    const services = await db.getServices();
    const mainService = services.find(s => s.code === 'NIDA_MITANDAO_YOTE') || services[0];
    const terms = await db.getLatestTerms();

    const cleanPaymentInstructions = settings.paymentInstructions
      ? settings.paymentInstructions.replace(/NIDA MITANDAO YOTE|RAVINI COMPANY LIMITED/g, 'RAVINI')
      : 'Lipa kiasi unachotaka cha Credit kupitia WhatsApp rasmi ya RAVINI.';

    const cleanTermsContent = terms.content
      ? terms.content.replace(/NIDA MITANDAO YOTE \(RAVINI COMPANY LIMITED\)|RAVINI COMPANY LIMITED|NIDA MITANDAO YOTE/g, 'RAVINI')
      : 'Vigezo na Masharti ya Huduma ya RAVINI.';

    const cleanPaymentMethods = settings.paymentMethods.filter(m => m.isActive).map(m => ({
      ...m,
      accountName: m.accountName.replace(/RAVINI COMPANY LIMITED/g, 'RAVINI')
    }));

    res.json({
      success: true,
      config: {
        platformName: 'RAVINI',
        companyName: 'RAVINI',
        oneSignalAppId: process.env.ONESIGNAL_APP_ID || '',
        publicRegistrationOpen: settings.publicRegistrationOpen,
        appAccessOpen: settings.appAccessOpen,
        requestTimeoutMinutes: settings.requestTimeoutMinutes,
        supportPhone: settings.supportPhone,
        whatsappNumber: settings.whatsappNumber,
        paymentInstructions: cleanPaymentInstructions,
        paymentMethods: cleanPaymentMethods,
        service: mainService
          ? {
              id: mainService.id,
              code: mainService.code,
              name: mainService.name.replace(/NIDA MITANDAO YOTE/g, 'Huduma ya NIDA'),
              description: mainService.description,
              priceTzs: mainService.priceTzs,
              isActive: mainService.isActive
            }
          : null,
        termsVersion: terms.version,
        termsContent: cleanTermsContent
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata taarifa za mfumo.' });
  }
});

// -------------------------------------------------------------
// 2. AUTHENTICATION (REGISTER, LOGIN)
// -------------------------------------------------------------
router.post('/auth/register', authRateLimiter, async (req, res) => {
  try {
    const settings = await db.getSettings();
    if (!settings.publicRegistrationOpen) {
      return res.status(403).json({
        success: false,
        code: 'REGISTRATION_CLOSED',
        message: 'USAJILI WA AKAUNTI MPYA HAUPO KWA SASA. TAFADHALI JARIBU TENA BAADAYE.'
      });
    }

    const { fullName, phone, password, repeatPassword, termsAccepted } = req.body;

    if (!fullName || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tafadhali jaza taarifa zote zinazohitajika.'
      });
    }

    if (password !== repeatPassword) {
      return res.status(400).json({
        success: false,
        message: 'Maneno ya siri hayafanani.'
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Neno la siri lazima liwe na angalau herufi au tarakimu 4.'
      });
    }

    if (!termsAccepted) {
      return res.status(400).json({
        success: false,
        message: 'Lazima ukubaliane na Vigezo na Masharti ili kujisajili.'
      });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone.startsWith('255') || normalizedPhone.length !== 12) {
      return res.status(400).json({
        success: false,
        message: 'Weka namba sahihi ya simu ya Tanzania (mfano 0712345678 au 255712345678).'
      });
    }

    const restriction = await db.isPhoneRestrictedByDeletion(normalizedPhone);
    if (restriction.restricted) {
      const expDate = restriction.expiresAt ? new Date(restriction.expiresAt).toLocaleDateString('sw-TZ') : 'siku 7';
      return res.status(403).json({
        success: false,
        message: `Namba hii ya simu ilifutwa hivi karibuni. Kulingana na sera ya usalama ya RAVINI, usajili upya unaruhusiwa baada ya siku 7 tangu kufutwa (hadi tarehe ${expDate}).`
      });
    }

    const existingUser = await db.getUserByPhone(normalizedPhone);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Namba hii ya simu tayari imesajiliwa kwenye mfumo. Tafadhali ingia.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser: NmyUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      phone: normalizedPhone,
      fullName: fullName.trim(),
      password: hashedPassword,
      role: 'CUSTOMER', // Strict: public registration creates CUSTOMER only
      status: 'ACTIVE',
      permissions: [],
      language: 'sw',
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.createUser(newUser);

    // Record terms acceptance
    const latestTerms = await db.getLatestTerms();
    await db.recordTermsAcceptance(newUser.id, latestTerms.version);

    await db.addAuditLog({
      actorId: newUser.id,
      actorName: newUser.fullName,
      actorRole: 'CUSTOMER',
      action: 'REGISTER',
      target: `USER:${newUser.id}`,
      targetId: newUser.id,
      details: `Customer registered successfully with phone ${newUser.phone}`
    });

    // Notify Admin and Super Admin of new customer registration
    pushService.sendNotificationToRole('ADMIN', {
      title: 'Mteja Mpya Amejisajili',
      message: `Mteja mpya ${newUser.fullName} (${newUser.phone}) amejisajili kwenye mfumo.`,
      type: 'USER',
      url: '/profile',
      eventKey: `reg_adm_${newUser.id}`
    }).catch((err: any) => console.warn('[PUSH REG ADMIN ERROR]:', err.message));

    pushService.sendNotificationToRole('SUPER_ADMIN', {
      title: 'Mteja Mpya Amejisajili',
      message: `Mteja mpya ${newUser.fullName} (${newUser.phone}) amejisajili kwenye mfumo.`,
      type: 'USER',
      url: '/profile',
      eventKey: `reg_sa_${newUser.id}`
    }).catch((err: any) => console.warn('[PUSH REG SA ERROR]:', err.message));

    res.status(201).json({
      success: true,
      message: 'USAJILI UMEKAMILIKA. Akaunti yako imeundwa kikamilifu. Tafadhali ingia kutumia namba yako ya simu na password.',
      userId: newUser.id
    });
  } catch (err: any) {
    console.error('[Register Error]:', err);
    res.status(500).json({ success: false, message: 'Hitilafu ya kusajili akaunti.' });
  }
});

router.post('/auth/login', authRateLimiter, async (req, res) => {
  try {
    const { phone, password, deviceName } = req.body;
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Weka namba ya simu na neno la siri.'
      });
    }

    const normalizedPhone = normalizePhone(phone);
    const user = await db.getUserByPhone(normalizedPhone);

    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Account not found.',
        messageSw: 'Akaunti haipo.',
        messageEn: 'Account not found.'
      });
    }

    // App access check (Super Admin can always login)
    const settings = await db.getSettings();
    if (!settings.appAccessOpen && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        code: 'APP_ACCESS_BLOCKED',
        message: 'App is temporarily unavailable. Please try again later.',
        messageSw: 'Mfumo umefungwa kwa muda. Tafadhali jaribu tena baadaye.',
        messageEn: 'App is temporarily unavailable. Please try again later.'
      });
    }

    // Check timed failed-attempt lock
    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      const remainingMinutes = Math.max(1, Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / (60 * 1000)));
      const lockMsgSw = `Akaunti imefungwa kwa muda kutokana na makosa ya password. Jaribu tena baada ya dakika ${remainingMinutes}.`;
      const lockMsgEn = `Account is temporarily locked due to incorrect password attempts. Try again in ${remainingMinutes} minute(s).`;
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_LOCKED_TIMED',
        remainingMinutes,
        message: user.language === 'sw' ? lockMsgSw : lockMsgEn,
        messageSw: lockMsgSw,
        messageEn: lockMsgEn
      });
    }

    // Check account status (SUSPENDED / DISABLED / MARKED_FOR_DELETION)
    if (user.status !== 'ACTIVE') {
      const lockReasonText = user.lockReason ? ` (${user.lockReason})` : '';
      const suspMsgSw = `Akaunti imefungwa${lockReasonText}. Tafadhali wasiliana na Uongozi wa RAVINI.`;
      const suspMsgEn = `Account is locked${lockReasonText}. Please contact RAVINI support.`;
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        status: user.status,
        reason: user.lockReason,
        message: user.language === 'sw' ? suspMsgSw : suspMsgEn,
        messageSw: suspMsgSw,
        messageEn: suspMsgEn
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Failed attempts tracking
      const currentAttempts = (user.failedLoginAttempts || 0) + 1;
      const currentLockLevel = user.lockLevel || 0;
      let newLockedUntil: string | null = null;
      let newLockLevel = currentLockLevel;
      let lockTriggeredMsgSw = '';
      let lockTriggeredMsgEn = '';

      if (currentAttempts >= 3) {
        if (currentLockLevel === 0) {
          newLockLevel = 1;
          newLockedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
          lockTriggeredMsgSw = 'Akaunti imefungwa kwa dakika 5 kutokana na makosa 3 ya password mfululizo.';
          lockTriggeredMsgEn = 'Account locked for 5 minutes due to 3 consecutive wrong password attempts.';
        } else if (currentLockLevel === 1) {
          newLockLevel = 2;
          newLockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
          lockTriggeredMsgSw = 'Akaunti imefungwa kwa dakika 30 kutokana na makosa 3 ya password mfululizo tena.';
          lockTriggeredMsgEn = 'Account locked for 30 minutes due to 3 consecutive wrong password attempts.';
        } else {
          newLockLevel = 3;
          newLockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          lockTriggeredMsgSw = 'Akaunti imefungwa kwa saa 24 kutokana na makosa ya mara kwa mara ya password. Wasiliana na Super Admin.';
          lockTriggeredMsgEn = 'Account locked for 24 hours due to repeated wrong password attempts. Contact Super Admin to unlock.';
        }
      }

      await pool.query(
        `UPDATE users SET failed_login_attempts = $1, lock_level = $2, locked_until = $3 WHERE id = $4`,
        [newLockedUntil ? 0 : currentAttempts, newLockLevel, newLockedUntil, user.id]
      );

      if (newLockedUntil) {
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_LOCKED_TIMED',
          message: user.language === 'sw' ? lockTriggeredMsgSw : lockTriggeredMsgEn,
          messageSw: lockTriggeredMsgSw,
          messageEn: lockTriggeredMsgEn
        });
      }

      const remaining = 3 - currentAttempts;
      const errSw = `Password si sahihi.${remaining > 0 ? ` Una majaribio ${remaining} kabla akaunti haijafungwa.` : ''}`;
      const errEn = `Incorrect password.${remaining > 0 ? ` You have ${remaining} attempt(s) remaining before lockout.` : ''}`;

      return res.status(401).json({
        success: false,
        code: 'INCORRECT_PASSWORD',
        remainingAttempts: remaining,
        message: user.language === 'sw' ? errSw : errEn,
        messageSw: errSw,
        messageEn: errEn
      });
    }

    // Reset failed login attempts on successful login
    await pool.query(
      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1`,
      [user.id]
    );

    // Create session (24h validity)
    const token = `nmy_tok_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const session: NmySession = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      token,
      userId: user.id,
      role: user.role,
      deviceName: deviceName || 'Mobile / Web Device',
      ip: req.ip || '127.0.0.1',
      createdAt: new Date().toISOString(),
      expiresAt,
      isRevoked: false
    };

    await db.createSession(session);
    await db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    await db.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'LOGIN',
      target: `USER:${user.id}`,
      targetId: user.id,
      details: `User logged in with role ${user.role}`
    });

    // Fetch authoritative balances
    let customerCredit = 0;
    let adminWorkCredit = 0;
    let superAdminWorkCredit = 0;

    if (user.role === 'CUSTOMER') {
      customerCredit = await db.getCustomerCredit(user.id);
    } else if (user.role === 'ADMIN') {
      adminWorkCredit = await db.getAdminWorkCredit(user.id);
    } else if (user.role === 'SUPER_ADMIN') {
      superAdminWorkCredit = await db.getSuperAdminWorkCredit(user.id);
    }

    const safeUser = {
      id: user.id,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      permissions: user.permissions,
      language: user.language,
      mustChangePassword: user.mustChangePassword
    };

    res.json({
      success: true,
      message: 'Umeingia kikamilifu.',
      token,
      user: safeUser,
      balances: {
        customerCredit,
        adminWorkCredit,
        superAdminWorkCredit
      }
    });
  } catch (err: any) {
    console.error('[Login Error]:', err);
    res.status(500).json({ success: false, message: 'Hitilafu ya kuingia kwenye mfumo.' });
  }
});

// -------------------------------------------------------------
// 3. COMMON AUTHENTICATED PROFILE & ACCOUNT
// -------------------------------------------------------------
router.get('/auth/me', nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    const user = req.user!;
    let customerCredit = 0;
    let adminWorkCredit = 0;
    let superAdminWorkCredit = 0;

    if (user.role === 'CUSTOMER') {
      customerCredit = await db.getCustomerCredit(user.id);
    } else if (user.role === 'ADMIN') {
      adminWorkCredit = await db.getAdminWorkCredit(user.id);
    } else if (user.role === 'SUPER_ADMIN') {
      superAdminWorkCredit = await db.getSuperAdminWorkCredit(user.id);
    }

    const notifications = await db.getNotifications(user.id);
    const unreadCount = notifications.filter(n => !n.read).length;

    res.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        permissions: user.permissions,
        language: user.language,
        mustChangePassword: user.mustChangePassword,
        departmentId: user.departmentId
      },
      balances: {
        customerCredit,
        adminWorkCredit,
        superAdminWorkCredit
      },
      unreadNotificationsCount: unreadCount
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata taarifa za mtumiaji.' });
  }
});

router.post('/auth/logout', nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    if (req.session) {
      await db.revokeSession(req.session.token);
    }

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      actorRole: req.user!.role,
      action: 'LOGOUT',
      target: `USER:${req.user!.id}`,
      targetId: req.user!.id,
      details: 'User logged out'
    });

    res.json({ success: true, message: 'Umetoka kikamilifu.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kutoka kwenye akaunti.' });
  }
});

router.post('/auth/change-password', nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = req.user!;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Weka neno la siri la sasa na jipya.' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Maneno mapya ya siri hayafanani.' });
    }

    if (newPassword === '1234') {
      return res.status(400).json({ success: false, message: 'Huwezi kutumia 1234 tena. Chagua neno la siri salama.' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'Neno jipya la siri lazima liwe na angalau tarakimu 4.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Neno la siri la sasa si sahihi.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.updateUser(user.id, {
      password: hashedPassword,
      mustChangePassword: false
    });

    await db.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'PASSWORD_CHANGE',
      target: `USER:${user.id}`,
      targetId: user.id,
      details: 'User successfully changed account password and cleared mustChangePassword flag.'
    });

    res.json({ success: true, message: 'Neno la siri limebadilishwa kikamilifu.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kubadilisha neno la siri.' });
  }
});

router.put('/auth/language', nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    const { language } = req.body;
    if (language !== 'sw' && language !== 'en') {
      return res.status(400).json({ success: false, message: 'Lugha lazima iwe sw au en.' });
    }
    await db.updateUser(req.user!.id, { language });
    res.json({ success: true, language });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kubadili lugha.' });
  }
});

router.get('/auth/sessions', nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    const sessions = await db.getActiveSessions(req.user!.id);
    res.json({ success: true, sessions });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata orodha ya session.' });
  }
});

router.post('/auth/sessions/revoke', nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token inahitajika.' });
    await db.revokeSession(token);
    res.json({ success: true, message: 'Session imesitishwa.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kusitisha session.' });
  }
});

router.get('/notifications', nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    const notifications = await db.getNotifications(req.user!.id);
    res.json({ success: true, notifications });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata taarifa.' });
  }
});

router.put('/notifications/:id/read', nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    await db.markNotificationAsRead(String(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kusoma taarifa.' });
  }
});

// REAL MOBILE PUSH NOTIFICATIONS
router.get('/notifications/vapid-public-key', async (_req, res: Response) => {
  try {
    const key = await pushService.getPublicKey();
    res.json({ success: true, publicKey: key });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya ufunguo wa arifa.' });
  }
});

router.post(['/notifications/subscribe', '/push/register'], nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    const subscription = req.body.subscription || (req.body.token ? {
      endpoint: `fcm:${req.body.token}`,
      keys: { p256dh: 'fcm', auth: 'fcm' }
    } : null);
    if (!subscription) {
      return res.status(400).json({ success: false, message: 'Taarifa za usajili wa kifaa zinahitajika.' });
    }
    await pushService.saveSubscription(req.user!.id, subscription, req.headers['user-agent']);
    res.json({ success: true, message: 'Kifaa kimesajiliwa kupokea arifa moja kwa moja.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kusajili kifaa kwa arifa.' });
  }
});

router.post('/notifications/unsubscribe', nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await pushService.removeSubscription(endpoint);
    }
    res.json({ success: true, message: 'Usajili wa arifa umeondolewa.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kuondoa arifa.' });
  }
});

router.post('/notifications/test-push', nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const deliveredCount = await pushService.sendNotificationToUser(user.id, {
      title: 'Jaribio la Arifa za Simu',
      body: `Habari ${user.fullName}, mfumo wa arifa za moja kwa moja (Mobile Push) unafanya kazi kikamilifu!`,
      url: '/'
    });

    await db.createNotification({
      userId: user.id,
      title: 'Jaribio la Arifa za Simu',
      message: 'Ujumbe wa jaribio la arifa umetumwa kwenye kifaa chako.',
      type: 'INFO'
    });

    res.json({
      success: true,
      deliveredDevices: deliveredCount,
      message: deliveredCount > 0
        ? `Arifa halisi imetumwa kwenye vifaa ${deliveredCount} vilivyosajiliwa.`
        : 'Hakuna kifaa kilichoruhusu arifa bado. Tafadhali bonyeza Ruhusu Arifa kwanza.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kutuma arifa ya jaribio.' });
  }
});

// ADMIN PUSH & FCM MANAGEMENT
router.get('/admin/push/status', nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Huna ruhusa ya kuona hali ya arifa.' });
    }
    const status = await pushService.getFcmStatus();
    res.json({ success: true, pushStatus: status });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata hali ya FCM.' });
  }
});

router.post('/admin/push/configure-fcm', nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Super Admin pekee anaweza kuweka Service Account ya FCM.' });
    }
    const { serviceAccountJson } = req.body;
    if (!serviceAccountJson) {
      return res.status(400).json({ success: false, message: 'Service Account JSON inahitajika.' });
    }
    const result = await pushService.updateServiceAccount(serviceAccountJson);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Hitilafu ya kusajili FCM Service Account.' });
  }
});

router.delete('/admin/push/configure-fcm', nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Super Admin pekee anaweza kuondoa Service Account.' });
    }
    const result = await pushService.removeServiceAccount();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Hitilafu ya kuondoa FCM Service Account.' });
  }
});

// REALTIME SERVER-SENT EVENTS (SSE) STREAM
router.get('/realtime/stream', nmyAuthMiddleware, (req: NmyAuthRequest, res: Response) => {
  const user = req.user!;
  realtimeService.addClient(user.id, user.role, res);
});

router.get('/files', nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    const files = await db.getFiles({
      ownerId: req.user!.id,
      role: req.user!.role,
      departmentId: req.user!.departmentId
    });
    res.json({ success: true, files });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata faili.' });
  }
});

// PRIVATE AUTHENTICATED FILE UPLOAD
router.post('/files/upload', nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    const { fileName, fileDataUrl, fileType } = req.body;
    if (!fileName || !fileDataUrl) {
      return res.status(400).json({ success: false, message: 'Weka faili na jina la faili.' });
    }

    const base64Data = fileDataUrl.includes(',') ? fileDataUrl.split(',')[1] : fileDataUrl;
    const buffer = Buffer.from(base64Data, 'base64');
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const savedFile = await db.createFile({
      id: fileId,
      userId: req.user!.id,
      fileName: fileName.trim(),
      fileUrl: `/api/files/${fileId}/download`,
      fileType: fileType || 'application/octet-stream',
      sizeBytes: buffer.length,
      checksum,
      storageBucket: 'cloud_sql_nmy_persistent',
      isPrivate: true,
      createdAt: new Date().toISOString()
    });

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      actorRole: req.user!.role,
      action: 'FILE_UPLOADED',
      target: `FILE:${fileId}`,
      targetId: fileId,
      details: `User uploaded private file ${fileName} (${buffer.length} bytes, SHA256: ${checksum})`
    });

    res.json({ success: true, file: savedFile });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupakia faili.' });
  }
});

// DELETE FILE
router.delete('/files/:id', nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    const fileId = String(req.params.id);
    const actor = { id: req.user!.id, name: req.user!.fullName, role: req.user!.role };
    const result = await db.deleteFile(fileId, actor);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    res.json({ success: true, message: result.message });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kufuta faili.' });
  }
});

// -------------------------------------------------------------
// 4. CUSTOMER ENDPOINTS (ROLE: CUSTOMER)
// -------------------------------------------------------------
router.get('/customer/dashboard', nmyAuthMiddleware, requireNmyRole('CUSTOMER'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const balanceTzs = await db.getCustomerCredit(userId);
    const requests = await db.getRequests({ customerId: userId });
    const services = await db.getServices();
    const mainService = services.find(s => s.code === 'NIDA_MITANDAO_YOTE') || services[0];
    const notifications = await db.getNotifications(userId);

    const pending = requests.filter(r => r.status === 'PENDING').length;
    const processing = requests.filter(r => r.status === 'PROCESSING').length;
    const approved = requests.filter(r => r.status === 'APPROVED').length;
    const rejected = requests.filter(r => r.status === 'REJECTED').length;

    res.json({
      success: true,
      balanceTzs,
      counts: { pending, processing, approved, rejected, total: requests.length },
      recentRequests: requests.slice(0, 10),
      service: mainService,
      notifications: notifications.slice(0, 5)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata dashboard ya mteja.' });
  }
});

router.get('/customer/credit', nmyAuthMiddleware, requireNmyRole('CUSTOMER'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const balanceTzs = await db.getCustomerCredit(userId);
    const ledger = await db.getCustomerLedger(userId);

    let totalAdded = 0;
    let totalCharged = 0;
    let totalRefunded = 0;
    for (const e of ledger) {
      if (e.type === 'ADD') totalAdded += e.amount;
      else if (e.type === 'CHARGE') totalCharged += e.amount;
      else if (e.type === 'REFUND') totalRefunded += e.amount;
    }

    // Dynamic 100% reference: Net deposited / starting basis
    const startingBase = Math.max(balanceTzs + totalCharged - totalRefunded, totalAdded, balanceTzs, 0);
    const usedPercentage = startingBase > 0 ? Math.min(100, Math.round((totalCharged / startingBase) * 100)) : 0;
    const remainingPercentage = startingBase > 0 ? Math.max(0, Math.min(100, Math.round((balanceTzs / startingBase) * 100))) : (balanceTzs > 0 ? 100 : 0);

    res.json({
      success: true,
      balanceTzs,
      ledger,
      startingBaseTzs: startingBase,
      totalAddedTzs: totalAdded,
      totalChargedTzs: totalCharged,
      totalRefundedTzs: totalRefunded,
      usedPercentage,
      remainingPercentage,
      claimTzs: balanceTzs
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata salio la Credit.' });
  }
});

// WHATSAPP-ONLY PAYMENT LINK (Server-authoritative, number not hardcoded or exposed)
router.get('/customer/credit/whatsapp-payment-link', nmyAuthMiddleware, requireNmyRole('CUSTOMER'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const amount = Number(req.query.amount) || 1000;
    const settings = await db.getSettings();
    const rawNumber = settings.whatsappNumber || '255748604483';
    const cleanNumber = normalizePhone(rawNumber);

    const message = `Habari RAVINI,\n\nNahitaji kuongeza Credit kwenye akaunti yangu ya RAVINI.\n\n👤 Jina: ${user.fullName}\n📱 Namba ya Simu: ${user.phone}\n💰 Kiasi Ninachotaka: TSh ${amount.toLocaleString()}\n\nTafadhali nisaidie kukamilisha malipo na kuniwekea Credit.`;

    const paymentUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

    res.json({
      success: true,
      paymentUrl,
      amount,
      instructions: 'Utakapofungua WhatsApp, tuma ujumbe huo ili uelekezwe kukamilisha malipo ya kiasi ulichochagua.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata kiunganishi cha malipo.' });
  }
});

router.post('/customer/credit/buy', nmyAuthMiddleware, requireNmyRole('CUSTOMER'), transactionRateLimiter, async (req: NmyAuthRequest, res: Response) => {
  try {
    const { amountTzs, paymentMethod, paymentReference, proofImageUrl } = req.body;
    const user = req.user!;

    const amount = Number(amountTzs);
    if (!amount || amount < 100) {
      return res.status(400).json({ success: false, message: 'Kiwango cha chini cha kuongeza Credit ni TSh 100.' });
    }

    if (!paymentReference || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Weka njia ya malipo na namba ya kumbukumbu (Reference).' });
    }

    const creditReq = await db.createCreditRequest({
      id: `cr_req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      customerId: user.id,
      customerName: user.fullName,
      customerPhone: user.phone,
      amountTzs: amount,
      paymentMethod,
      paymentReference: paymentReference.trim(),
      proofImageUrl,
      status: 'PENDING_VERIFICATION',
      createdAt: new Date().toISOString()
    });

    await db.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: 'CUSTOMER',
      action: 'CREDIT_TOPUP_REQUEST',
      target: `CREDIT_REQUEST:${creditReq.id}`,
      targetId: creditReq.id,
      details: `Customer requested top-up of TSh ${amount} via ${paymentMethod} (Ref: ${paymentReference})`
    });

    res.status(201).json({
      success: true,
      message: 'Ombi lako la kuongeza Credit limepokelewa na linasubiri uhakiki wa Uongozi wa RAVINI.',
      creditRequest: creditReq
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kuomba kuongeza Credit.' });
  }
});

router.get('/customer/credit/requests', nmyAuthMiddleware, requireNmyRole('CUSTOMER'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const all = await db.getCreditRequests();
    const mine = all.filter(r => r.customerId === req.user!.id);
    res.json({ success: true, requests: mine });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata maombi ya Credit.' });
  }
});

// WHATSAPP-ONLY PAYMENT ACTION (Strictly manual, no telecom APIs/STK)
router.post('/customer/credit/whatsapp-action', nmyAuthMiddleware, requireNmyRole('CUSTOMER'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const requestedAmount = Number(req.body.amountTzs) || 1000;
    const settings = await db.getSettings();
    const rawNumber = settings.whatsappNumber || '255748604483';
    const cleanNumber = normalizePhone(rawNumber);

    const message = `Habari Uongozi wa RAVINI,\nNaitwa: ${user.fullName}\nNamba ya Simu: ${user.phone}\nUser ID: ${user.id}\n\nNahitaji kuongeza Credit ya TSh ${requestedAmount.toLocaleString()}.\nNimefanya/nafanya malipo ya fedha kwa njia ya simu. Tafadhali nipokee malipo na uniongezee Credit kwenye akaunti yangu ya RAVINI.`;

    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

    res.json({
      success: true,
      whatsappUrl,
      prefilledMessage: message,
      amountTzs: requestedAmount
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kuandaa mawasiliano ya WhatsApp.' });
  }
});

router.post('/customer/requests', nmyAuthMiddleware, requireNmyRole('CUSTOMER'), transactionRateLimiter, async (req: NmyAuthRequest, res: Response) => {
  try {
    const targetPhoneNumber = req.body.targetPhoneNumber || req.body.targetPhone;
    const user = req.user!;

    if (!targetPhoneNumber) {
      return res.status(400).json({ success: false, message: 'Weka namba ya simu ya mteja (tarakimu 10).' });
    }

    const cleanTargetPhone = String(targetPhoneNumber).replace(/\D/g, '');
    // Validate target phone number: exactly 10 digits starting with 0
    if (!/^0\d{9}$/.test(cleanTargetPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Namba ya simu lazima iwe na tarakimu 10 na ianze na 0 (mfano: 0712345678).'
      });
    }

    // Emergency Lock Check
    const settings = await db.getSettings();
    if (settings.emergencyLockActive) {
      return res.status(423).json({
        success: false,
        message: settings.emergencyLockReason || 'Huduma imesimamishwa kwa muda kwa ajili ya usalama wa mfumo (Emergency Lock).'
      });
    }

    // Check duplicate submission within 10 seconds
    const recentRequests = await db.getRequests({ customerId: user.id });
    const duplicate = recentRequests.find(r =>
      r.targetPhoneNumber === cleanTargetPhone &&
      (Date.now() - new Date(r.createdAt).getTime()) < 10000
    );
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'Ombi la namba hii tayari limepokelewa sekunde chache zilizopita. Tafadhali subiri lifanyiwe kazi.'
      });
    }

    // Check service active
    const services = await db.getServices();
    const service = services.find(s => s.code === 'NIDA_MITANDAO_YOTE') || services[0];
    if (!service || !service.isActive) {
      return res.status(503).json({
        success: false,
        message: 'HUDUMA HII HAIJAPATIKANA KWA SASA. UTAPEWA TAARIFA ITAKAPOPATIKANA.'
      });
    }

    // Dynamic price snapshot
    const chargedPrice = service.priceTzs;
    if (chargedPrice === undefined || chargedPrice === null) {
      return res.status(500).json({
        success: false,
        message: 'HUDUMA HAJAWEKEWA BEI. Tafadhali wasiliana na Uongozi.'
      });
    }

    // Check customer credit
    const currentBalance = await db.getCustomerCredit(user.id);
    if (currentBalance < chargedPrice) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDIT',
        message: `Huna salio la kutosha la Credit. Salio lako ni TSh ${currentBalance.toLocaleString()} wakati huduma inahitaji TSh ${chargedPrice.toLocaleString()}. Tafadhali ongeza Credit.`,
        currentBalance,
        requiredPrice: chargedPrice
      });
    }

    const requestId = generateRequestId();

    // Atomic charge
    const chargeResult = await db.chargeCustomerCredit({
      userId: user.id,
      amount: chargedPrice,
      requestId,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: 'CUSTOMER',
      reason: `Malipo ya ombi la NIDA kwa namba ${cleanTargetPhone}`
    });

    const newRequest: NmyRequest = {
      id: requestId,
      customerId: user.id,
      customerName: user.fullName,
      customerPhone: user.phone,
      serviceId: service.id,
      serviceCode: service.code,
      serviceName: service.name,
      targetPhoneNumber: cleanTargetPhone,
      chargedPriceTzs: chargedPrice, // Snapshot price
      status: 'PENDING',
      refundStatus: 'NONE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.createRequest(newRequest);

    await db.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: 'CUSTOMER',
      action: 'REQUEST_CREATED',
      target: `REQUEST:${requestId}`,
      targetId: requestId,
      details: `Customer submitted request ${requestId} for ${cleanTargetPhone}. Charged: TSh ${chargedPrice}. New balance: TSh ${chargeResult.balanceAfter}.`
    });

    // 1. Notify Customer in-app and via Push
    await db.createNotification({
      userId: user.id,
      title: 'Ombi Limepokelewa',
      message: `Ombi lako la namba ${cleanTargetPhone} limepokelewa kikamilifu na linasubiri kushughulikiwa.`,
      type: 'REQUEST'
    });

    pushService.sendNotificationToUser(user.id, {
      title: 'Ombi Limepokelewa',
      message: `Ombi lako la namba ${cleanTargetPhone} limepokelewa kikamilifu.`,
      type: 'REQUEST',
      url: '/maombi',
      eventKey: `req_recv_${requestId}`
    }).catch((err: any) => console.warn('[PUSH REQ RECV ERROR]:', err.message));

    // 2. Notify Admins and Super Admin of new request
    pushService.sendNotificationToRole('ADMIN', {
      title: 'Ombi Jipya la NIDA',
      message: `Ombi jipya la namba ${cleanTargetPhone} kutoka kwa ${user.fullName} limeingia kwenye foleni.`,
      type: 'REQUEST',
      url: '/huduma',
      eventKey: `new_req_adm_${requestId}`
    }).catch((err: any) => console.warn('[PUSH NEW REQ ADMIN ERROR]:', err.message));

    pushService.sendNotificationToRole('SUPER_ADMIN', {
      title: 'Ombi Jipya la NIDA',
      message: `Ombi jipya la namba ${cleanTargetPhone} kutoka kwa ${user.fullName} limeingia kwenye foleni.`,
      type: 'REQUEST',
      url: '/huduma',
      eventKey: `new_req_sa_${requestId}`
    }).catch((err: any) => console.warn('[PUSH NEW REQ SA ERROR]:', err.message));

    // Realtime in-app synchronization
    realtimeService.notifyRole('ADMIN', { type: 'NEW_REQUEST', requestId, customerName: user.fullName });
    realtimeService.notifyRole('SUPER_ADMIN', { type: 'NEW_REQUEST', requestId, customerName: user.fullName });
    realtimeService.notifyUser(user.id, { type: 'REQUEST_CREATED', requestId, newBalance: chargeResult.balanceAfter });

    res.status(201).json({
      success: true,
      message: 'Ombi lako limepokelewa na linasubiri usindikaji.',
      request: newRequest,
      newBalance: chargeResult.balanceAfter
    });
  } catch (err: any) {
    console.error('[Create Request Error]:', err);
    res.status(500).json({ success: false, message: 'Hitilafu ya kutengeneza ombi.' });
  }
});

router.get('/customer/requests', nmyAuthMiddleware, requireNmyRole('CUSTOMER'), async (req: NmyAuthRequest, res: Response) => {
  try {
    await db.checkAndExpireTimedOutRequests().catch(() => {});
    const requests = await db.getRequests({ customerId: req.user!.id });
    res.json({ success: true, requests });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata maombi yako.' });
  }
});

router.post('/customer/requests/:id/resubmit', nmyAuthMiddleware, requireNmyRole('CUSTOMER'), transactionRateLimiter, async (req: NmyAuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const oldRequest = await db.getRequestById(String(req.params.id));
    if (!oldRequest || oldRequest.customerId !== user.id) {
      return res.status(404).json({ success: false, message: 'Ombi halikupatikana.' });
    }

    if (oldRequest.status !== 'EXPIRED' && oldRequest.status !== 'REJECTED') {
      return res.status(400).json({ success: false, message: 'Ombi hili haliwezi kutumwa upya kwa sababu halijaisha muda wala kukataliwa.' });
    }

    const settings = await db.getSettings();
    if (settings.emergencyLockActive) {
      return res.status(423).json({ success: false, message: settings.emergencyLockReason || 'Huduma imesimamishwa kwa dharura.' });
    }

    const services = await db.getServices();
    const service = services.find(s => s.id === oldRequest.serviceId) || services[0];
    const chargedPrice = service?.priceTzs ?? oldRequest.chargedPriceTzs;

    const currentBalance = await db.getCustomerCredit(user.id);
    if (currentBalance < chargedPrice) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDIT',
        message: `Huna salio la kutosha la Credit kutuma tena ombi hili. Salio lako ni TSh ${currentBalance.toLocaleString()} wakati huduma inahitaji TSh ${chargedPrice.toLocaleString()}.`,
        currentBalance,
        requiredPrice: chargedPrice
      });
    }

    const newRequestId = generateRequestId();
    const chargeResult = await db.chargeCustomerCredit({
      userId: user.id,
      amount: chargedPrice,
      requestId: newRequestId,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: 'CUSTOMER',
      reason: `Kutuma tena ombi la NIDA kwa namba ${oldRequest.targetPhoneNumber} (Kufuatia ${oldRequest.status.toLowerCase()})`
    });

    const newReq: NmyRequest = {
      id: newRequestId,
      customerId: user.id,
      customerName: user.fullName,
      customerPhone: user.phone,
      serviceId: service.id,
      serviceCode: service.code,
      serviceName: service.name,
      targetPhoneNumber: oldRequest.targetPhoneNumber,
      chargedPriceTzs: chargedPrice,
      status: 'PENDING',
      refundStatus: 'NONE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.createRequest(newReq);

    await db.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: 'CUSTOMER',
      action: 'REQUEST_RESUBMITTED',
      target: `REQUEST:${newRequestId}`,
      targetId: newRequestId,
      details: `Mteja ametuma tena ombi ${newRequestId} kwa namba ${oldRequest.targetPhoneNumber} kufuatia ombi la awali ${oldRequest.id} kuwa ${oldRequest.status}. Kiasi: TSh ${chargedPrice}. Salio jipya: TSh ${chargeResult.balanceAfter}.`
    });

    pushService.sendNotificationToRole('ADMIN', {
      title: 'Ombi Jipya la NIDA (Limerudiwa)',
      message: `Mteja ametuma tena ombi jipya kwa ajili ya ${oldRequest.targetPhoneNumber}.`,
      url: '/admin/requests',
      type: 'INFO'
    }).catch(() => {});

    pushService.sendNotificationToRole('SUPER_ADMIN', {
      title: 'Ombi Jipya la NIDA (Limerudiwa)',
      message: `Ombi jipya limetumwa tena kwa namba ${oldRequest.targetPhoneNumber}.`,
      url: '/super-admin/requests',
      type: 'INFO'
    }).catch(() => {});

    realtimeService.notifyRole('ADMIN', { type: 'NEW_REQUEST', requestId: newRequestId, customerName: user.fullName });
    realtimeService.notifyRole('SUPER_ADMIN', { type: 'NEW_REQUEST', requestId: newRequestId, customerName: user.fullName });
    realtimeService.notifyUser(user.id, { type: 'REQUEST_CREATED', requestId: newRequestId, newBalance: chargeResult.balanceAfter });

    res.status(201).json({
      success: true,
      message: 'Ombi lako limetumwa upya kikamilifu na linasubiri usindikaji.',
      request: newReq,
      newBalance: chargeResult.balanceAfter
    });
  } catch (err: any) {
    console.error('[Resubmit Request Error]:', err);
    res.status(500).json({ success: false, message: 'Hitilafu ya kutuma tena ombi.' });
  }
});

router.get('/customer/requests/:id', nmyAuthMiddleware, requireNmyRole('CUSTOMER'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const request = await db.getRequestById(String(req.params.id));
    if (!request || request.customerId !== req.user!.id) {
      return res.status(404).json({ success: false, message: 'Ombi halikupatikana.' });
    }
    res.json({ success: true, request });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata ombi.' });
  }
});

// RULE 2: Mteja anayeamua kufuta request yake mwenyewe
router.delete('/customer/requests/:id', nmyAuthMiddleware, requireNmyRole('CUSTOMER'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const reqId = String(req.params.id);
    const result = await db.deleteCustomerRequest(reqId, req.user!.id);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.json({
      success: true,
      message: 'Ombi limefutwa kikamilifu kwenye orodha yako. Kumbukumbu za muamala zimehifadhiwa salama.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kufuta ombi.' });
  }
});

router.post('/customer/requests/:id/delete', nmyAuthMiddleware, requireNmyRole('CUSTOMER'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const reqId = String(req.params.id);
    const result = await db.deleteCustomerRequest(reqId, req.user!.id);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.json({
      success: true,
      message: 'Ombi limefutwa kikamilifu kwenye orodha yako. Kumbukumbu za muamala zimehifadhiwa salama.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kufuta ombi.' });
  }
});

// -------------------------------------------------------------
// 5. ADMIN & SUPER ADMIN WORKFLOW (ROLE: ADMIN, SUPER_ADMIN, SUPER_ADMIN_OPERATIONS)
// -------------------------------------------------------------
router.get('/admin/dashboard', nmyAuthMiddleware, requireNmyRole('ADMIN', 'SUPER_ADMIN', 'SUPER_ADMIN_OPERATIONS'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const allRequests = await db.getRequests();

    const pendingRequests = allRequests.filter(r => r.status === 'PENDING');
    const myHandled = allRequests.filter(r => r.claimedByWorkerId === user.id);
    const myProcessing = myHandled.filter(r => r.status === 'PROCESSING');
    const myCompleted = myHandled.filter(r => r.status === 'APPROVED');
    const myRejected = myHandled.filter(r => r.status === 'REJECTED');
    const myExpired = myHandled.filter(r => r.status === 'EXPIRED');

    let workAccountBalance = 0;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN_OPERATIONS') {
      workAccountBalance = await db.getAdminWorkCredit(user.id);
    } else {
      workAccountBalance = await db.getSuperAdminWorkCredit(user.id);
    }

    res.json({
      success: true,
      counts: {
        pendingQueue: pendingRequests.length,
        myProcessing: myProcessing.length,
        myCompleted: myCompleted.length,
        myRejected: myRejected.length,
        myExpired: myExpired.length,
        totalHandled: myHandled.length,
        totalInSystem: allRequests.length
      },
      workAccountBalance,
      pendingRequests: pendingRequests.slice(0, 50).map(r => sanitizeRequestForViewer(r, user)),
      processingRequests: myProcessing.map(r => sanitizeRequestForViewer(r, user)),
      recentCompleted: myCompleted.map(r => sanitizeRequestForViewer(r, user)),
      myAllHandled: myHandled.map(r => sanitizeRequestForViewer(r, user))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata dashboard ya Admin.' });
  }
});

router.get('/admin/work-account', nmyAuthMiddleware, requireNmyRole('ADMIN', 'SUPER_ADMIN', 'SUPER_ADMIN_OPERATIONS'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const user = req.user!;
    let balanceTzs = 0;
    let ledger: any[] = [];

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN_OPERATIONS') {
      balanceTzs = await db.getAdminWorkCredit(user.id);
      ledger = await db.getAdminWorkLedger(user.id);
    } else {
      balanceTzs = await db.getSuperAdminWorkCredit(user.id);
      ledger = await db.getSuperAdminWorkLedger(user.id);
    }

    res.json({ success: true, balanceTzs, ledger });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata akaunti ya kazi.' });
  }
});

// Super Admin resets their work balance to 0
router.post('/super-admin/work-account/reset-balance', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const actor = { id: req.user!.id, name: req.user!.fullName };
    const { reason } = req.body;
    const result = await db.resetSuperAdminWorkBalance(req.user!.id, actor, reason);
    res.json({
      success: true,
      message: `Salio la kazi la Super Admin limewekwa kuwa TSh 0 (Lilikuwa TSh ${result.balanceBefore.toLocaleString()}).`,
      balanceBefore: result.balanceBefore,
      balanceAfter: 0
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kurekebisha salio la kazi kuwa 0.' });
  }
});

router.get('/admin/requests', nmyAuthMiddleware, requireNmyRole('ADMIN', 'SUPER_ADMIN', 'SUPER_ADMIN_OPERATIONS'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { status } = req.query;
    const requests = await db.getRequests({ status: status as string });
    const sanitized = requests.map(r => sanitizeRequestForViewer(r, user));
    res.json({ success: true, requests: sanitized });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata maombi ya wateja.' });
  }
});

// Admin Claims request
router.post('/admin/requests/:id/claim', nmyAuthMiddleware, requireNmyRole('ADMIN', 'SUPER_ADMIN', 'SUPER_ADMIN_OPERATIONS'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const reqId = String(req.params.id);
    const result = await db.claimRequest({
      requestId: reqId,
      workerId: user.id,
      workerName: user.fullName,
      workerRole: user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN'
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    await db.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'REQUEST_CLAIMED',
      target: `REQUEST:${reqId}`,
      targetId: reqId,
      details: `${user.role} ${user.fullName} claimed request ${reqId} for processing.`
    });

    // Notify customer that request moved to PROCESSING
    if (result.request?.customerId) {
      const targetPhone = result.request.targetPhoneNumber;
      await db.createNotification({
        userId: result.request.customerId,
        title: 'Ombi Linashughulikiwa',
        message: `Mhudumu wetu ameanza kushughulikia ombi lako la namba ${targetPhone}.`,
        type: 'REQUEST'
      });

      pushService.sendNotificationToUser(result.request.customerId, {
        title: 'Ombi Linashughulikiwa',
        message: `Mhudumu wetu ameanza kushughulikia ombi lako la namba ${targetPhone}.`,
        type: 'REQUEST',
        url: '/maombi',
        eventKey: `req_proc_${reqId}`
      }).catch((err: any) => console.warn('[PUSH CLAIM ERROR]:', err.message));

      realtimeService.notifyUser(result.request.customerId, { type: 'REQUEST_UPDATED', requestId: reqId, status: 'PROCESSING' });
      realtimeService.notifyRole('ADMIN', { type: 'REQUEST_UPDATED', requestId: reqId, status: 'PROCESSING' });
      realtimeService.notifyRole('SUPER_ADMIN', { type: 'REQUEST_UPDATED', requestId: reqId, status: 'PROCESSING' });
    }

    res.json({
      success: true,
      message: 'Umechukua ombi hili. Sasa unaweza kuingiza namba ya NIDA ili kulikamilisha.',
      request: result.request
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kuchukua ombi.' });
  }
});

// Complete request (Requires exactly 20 digits NIDA result)
router.post('/admin/requests/:id/complete', nmyAuthMiddleware, requireNmyRole('ADMIN', 'SUPER_ADMIN', 'SUPER_ADMIN_OPERATIONS'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const nidaResult = req.body.nidaResult || req.body.nidaNumber;
    const user = req.user!;

    if (!nidaResult) {
      return res.status(400).json({ success: false, message: 'Weka namba ya NIDA ya tarakimu 20.' });
    }

    const cleanNida = String(nidaResult).replace(/\D/g, '');
    if (!/^\d{20}$/.test(cleanNida)) {
      return res.status(400).json({
        success: false,
        message: 'Namba ya NIDA lazima iwe na tarakimu 20 haswa (mfano: 19900101111010000123).'
      });
    }

    const reqId = String(req.params.id);
    const result = await db.completeRequest({
      requestId: reqId,
      workerId: user.id,
      nidaResult: cleanNida
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    await db.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'REQUEST_APPROVED',
      target: `REQUEST:${reqId}`,
      targetId: reqId,
      details: `${user.role} ${user.fullName} completed request ${reqId}. NIDA: ${cleanNida}. Earned: TSh ${result.request?.chargedPriceTzs}.`
    });

    // Notify customer that request is approved and NIDA is ready
    if (result.request?.customerId) {
      const targetPhone = result.request.targetPhoneNumber;
      await db.createNotification({
        userId: result.request.customerId,
        title: 'Ombi Limekamilika! ✅',
        message: `Ombi lako la namba ${targetPhone} limekamilika na namba yako ya NIDA ipo tayari.`,
        type: 'REQUEST'
      });

      pushService.sendNotificationToUser(result.request.customerId, {
        title: 'Ombi Limekamilika! ✅',
        message: `Ombi lako la namba ${targetPhone} limekamilika. NIDA ipo tayari.`,
        type: 'REQUEST',
        url: '/maombi',
        eventKey: `req_appr_${reqId}`
      }).catch((err: any) => console.warn('[PUSH COMPLETE ERROR]:', err.message));

      realtimeService.notifyUser(result.request.customerId, { type: 'REQUEST_UPDATED', requestId: reqId, status: 'APPROVED' });
      realtimeService.notifyRole('ADMIN', { type: 'REQUEST_UPDATED', requestId: reqId, status: 'APPROVED' });
      realtimeService.notifyRole('SUPER_ADMIN', { type: 'REQUEST_UPDATED', requestId: reqId, status: 'APPROVED' });
    }

    res.json({
      success: true,
      message: 'Ombi limekamilika na kupitishwa kikamilifu. Mapato yameingizwa kwenye Salio lako la Kazi.',
      request: result.request
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kukamilisha ombi.' });
  }
});

// Reject request (Requires reason, triggers atomic refund)
router.post('/admin/requests/:id/reject', nmyAuthMiddleware, requireNmyRole('ADMIN', 'SUPER_ADMIN', 'SUPER_ADMIN_OPERATIONS'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const user = req.user!;

    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Weka sababu halisi ya kukataa ombi hili.'
      });
    }

    const reqId = String(req.params.id);
    const result = await db.rejectRequest({
      requestId: reqId,
      workerId: user.id,
      workerName: user.fullName,
      workerRole: user.role,
      rejectionReason: reason.trim()
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    const targetReq = result.request;

    // Record audit log
    await db.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'REQUEST_REJECTED',
      target: `REQUEST:${reqId}`,
      targetId: reqId,
      details: `${user.role} ${user.fullName} rejected request ${reqId}. Reason: ${reason.trim()}. Refunded TSh ${targetReq?.chargedPriceTzs}.`
    });

    // Notify customer in-app & push
    if (targetReq?.customerId) {
      const refundTzs = targetReq.chargedPriceTzs || 100;
      await db.createNotification({
        userId: targetReq.customerId,
        title: 'Ombi la NIDA Limekataliwa',
        message: `Ombi lako la namba ${targetReq.targetPhoneNumber} limekataliwa. Sababu: ${reason.trim()}. Salio la TSh ${refundTzs.toLocaleString()} limerejeshwa kwenye akaunti yako.`,
        type: 'REQUEST'
      });

      pushService.sendNotificationToUser(targetReq.customerId, {
        title: 'Ombi Limekataliwa',
        message: `Ombi lako la namba ${targetReq.targetPhoneNumber} limekataliwa na salio limerejeshwa. Fungua app kuona maelezo kamili.`,
        type: 'REQUEST',
        url: '/maombi',
        eventKey: `req_rej_${reqId}`
      }).catch((err: any) => console.warn('[PUSH REJECTION ERROR]:', err.message));

      realtimeService.notifyUser(targetReq.customerId, { type: 'REQUEST_UPDATED', requestId: reqId, status: 'REJECTED' });
      realtimeService.notifyRole('ADMIN', { type: 'REQUEST_UPDATED', requestId: reqId, status: 'REJECTED' });
      realtimeService.notifyRole('SUPER_ADMIN', { type: 'REQUEST_UPDATED', requestId: reqId, status: 'REJECTED' });
    }

    res.json({
      success: true,
      message: 'Ombi limekataliwa na mteja amerudishiwa salio lake la Credit kikamilifu.',
      request: targetReq
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kukataa ombi.' });
  }
});

// -------------------------------------------------------------
// 6. SUPER ADMIN MANAGEMENT ENDPOINTS (ROLE: SUPER_ADMIN ONLY)
// -------------------------------------------------------------
router.get('/super-admin/overview', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    // Run automatic expiration sweep
    await db.checkAndExpireTimedOutRequests();

    const users = await db.getUsers();
    const requests = await db.getRequests();
    const creditRequests = await db.getCreditRequests();
    const ledger = await db.getAllCreditLedger();
    const settings = await db.getSettings();

    const customers = users.filter(u => u.role === 'CUSTOMER');
    const admins = users.filter(u => u.role === 'ADMIN');

    const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
    const processingRequests = requests.filter(r => r.status === 'PROCESSING').length;
    const approvedRequests = requests.filter(r => r.status === 'APPROVED').length;
    const rejectedRequests = requests.filter(r => r.status === 'REJECTED').length;
    const expiredRequests = requests.filter(r => r.status === 'EXPIRED').length;

    const pendingCreditRequests = creditRequests.filter(r => r.status === 'PENDING_VERIFICATION').length;
    const approvedCreditRequests = creditRequests.filter(r => r.status === 'APPROVED');
    const rejectedCreditRequests = creditRequests.filter(r => r.status === 'REJECTED');

    // Real Cash Received Breakdown (Top-ups)
    const approvedCashReceivedTzs = approvedCreditRequests.reduce((sum, cr) => sum + (Number(cr.amountTzs) || 0), 0);
    const pendingCashTzs = creditRequests.filter(r => r.status === 'PENDING_VERIFICATION').reduce((sum, cr) => sum + (Number(cr.amountTzs) || 0), 0);
    const rejectedCashTzs = rejectedCreditRequests.reduce((sum, cr) => sum + (Number(cr.amountTzs) || 0), 0);

    // Ledger Cash / Refunds
    let totalCustomerBalances = 0;
    const creditAccountsRes = await pool.query(`SELECT user_id, balance_tzs FROM credit_accounts`);
    const creditMap = new Map(creditAccountsRes.rows.map(r => [r.user_id, Number(r.balance_tzs) || 0]));

    for (const c of customers) {
      totalCustomerBalances += creditMap.get(c.id) || 0;
    }

    const totalRefundsTzs = ledger.filter(l => l.type === 'REFUND').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    const totalChargesTzs = ledger.filter(l => l.type === 'CHARGE').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

    // Customer Segmentation
    const customersWithCreditCount = customers.filter(c => (creditMap.get(c.id) || 0) > 0).length;
    const customersWithoutCreditCount = customers.filter(c => (creditMap.get(c.id) || 0) === 0).length;
    const suspendedCustomersCount = customers.filter(c => c.status === 'SUSPENDED' || c.status === 'DISABLED').length;
    const deletedCustomersCount = customers.filter(c => c.status === 'DELETED' || c.markedForDeletionAt !== null && c.markedForDeletionAt !== undefined).length;

    // Super Admin & Admin Work Balances (Debts)
    const superAdminAccRes = await pool.query(`SELECT balance_tzs FROM super_admin_work_credit_accounts WHERE super_admin_id = $1`, [req.user!.id]);
    const superAdminWorkBalanceTzs = Number(superAdminAccRes.rows[0]?.balance_tzs) || 0;

    const adminAccsRes = await pool.query(`SELECT balance_tzs FROM admin_work_credit_accounts`);
    const adminTotalWorkBalanceTzs = adminAccsRes.rows.reduce((sum, r) => sum + (Number(r.balance_tzs) || 0), 0);
    const totalOutstandingWorkDebtTzs = superAdminWorkBalanceTzs + adminTotalWorkBalanceTzs;

    // Jobs Segmentation
    const superAdminJobs = requests.filter(r => r.claimedByWorkerRole === 'SUPER_ADMIN' || r.claimedByWorkerId === req.user!.id);
    const adminJobs = requests.filter(r => r.claimedByWorkerRole === 'ADMIN');

    const totalJobsCount = requests.length;
    const completedJobsCount = approvedRequests;
    const eligibleJobsCount = totalJobsCount - expiredRequests;
    const completedPercentage = eligibleJobsCount > 0 ? Math.round((completedJobsCount / eligibleJobsCount) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalCustomers: customers.length,
        customersWithCreditCount,
        customersWithoutCreditCount,
        suspendedCustomersCount,
        deletedCustomersCount,
        totalAdmins: admins.length,
        totalRequests: totalJobsCount,
        pendingRequests,
        processingRequests,
        approvedRequests,
        rejectedRequests,
        expiredRequests,
        completedPercentage,
        pendingCreditRequests,
        totalCustomerBalances,
        // Real Cash Received
        approvedCashReceivedTzs,
        pendingCashTzs,
        rejectedCashTzs,
        totalRefundsTzs,
        totalChargesTzs,
        // Work Balances & Debts
        superAdminWorkBalanceTzs,
        adminTotalWorkBalanceTzs,
        totalOutstandingWorkDebtTzs,
        // Jobs details
        superAdminJobsCount: superAdminJobs.length,
        superAdminJobsCompleted: superAdminJobs.filter(j => j.status === 'APPROVED').length,
        adminJobsCount: adminJobs.length,
        adminJobsCompleted: adminJobs.filter(j => j.status === 'APPROVED').length,
        // Settings
        servicePriceTzs: settings.servicePriceTzs,
        appAccessOpen: settings.appAccessOpen,
        publicRegistrationOpen: settings.publicRegistrationOpen
      },
      recentRequests: requests.slice(0, 10),
      recentCreditRequests: creditRequests.slice(0, 5),
      recentLedger: ledger.slice(0, 10)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata taarifa za Super Admin.' });
  }
});

router.get('/super-admin/users', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (_req: NmyAuthRequest, res: Response) => {
  try {
    const users = await db.getUsers();
    const allLedger = await db.getAllCreditLedger();
    const allRequests = await db.getRequests();

    const list = await Promise.all(
      users.map(async u => {
        const isCustomer = u.role === 'CUSTOMER';
        const isAdmin = u.role === 'ADMIN';
        const isSuperAdmin = u.role === 'SUPER_ADMIN';

        let creditBal = 0;
        let totalAdded = 0;
        let totalCharged = 0;
        let totalRefunded = 0;
        let lastTx: any = null;

        if (isCustomer) {
          creditBal = await db.getCustomerCredit(u.id);
          const cLedger = allLedger.filter(l => l.userId === u.id);
          for (const e of cLedger) {
            if (e.type === 'ADD') totalAdded += e.amount;
            else if (e.type === 'CHARGE') totalCharged += e.amount;
            else if (e.type === 'REFUND') totalRefunded += e.amount;
          }
          if (cLedger.length > 0) {
            const sorted = [...cLedger].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            lastTx = sorted[0];
          }
        }

        let workBal = 0;
        let totalEarnings = 0;
        let workMetrics: any = null;
        let recentWorkJobs: any[] = [];

        if (isAdmin || isSuperAdmin) {
          workBal = isAdmin ? await db.getAdminWorkCredit(u.id) : await db.getSuperAdminWorkCredit(u.id);
          const workLedger = isAdmin ? await db.getAdminWorkLedger(u.id) : await db.getSuperAdminWorkLedger(u.id);
          for (const w of workLedger) {
            totalEarnings += w.amount;
          }
          const assigned = allRequests.filter(r => r.claimedByWorkerId === u.id);
          workMetrics = {
            totalClaimed: assigned.length,
            completedCount: assigned.filter(r => r.status === 'APPROVED').length,
            processingCount: assigned.filter(r => r.status === 'PROCESSING').length,
            rejectedCount: assigned.filter(r => r.status === 'REJECTED').length,
            totalWorkEarnings: totalEarnings
          };
          recentWorkJobs = assigned.slice(0, 5);
        }

        return {
          id: u.id,
          phone: u.phone,
          fullName: u.fullName,
          role: u.role,
          status: u.status,
          departmentId: u.departmentId,
          permissions: u.permissions,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt,
          creditBalance: isCustomer ? creditBal : undefined,
          creditBalanceTzs: isCustomer ? creditBal : undefined,
          totalCreditAdded: isCustomer ? totalAdded : undefined,
          totalCreditCharged: isCustomer ? totalCharged : undefined,
          totalRefunded: isCustomer ? totalRefunded : undefined,
          lastTransaction: lastTx,
          workBalance: (isAdmin || isSuperAdmin) ? workBal : undefined,
          workBalanceTzs: (isAdmin || isSuperAdmin) ? workBal : undefined,
          totalWorkEarningsTzs: (isAdmin || isSuperAdmin) ? totalEarnings : undefined,
          workMetrics: workMetrics || undefined,
          recentJobs: (isAdmin || isSuperAdmin) ? recentWorkJobs : undefined
        };
      })
    );
    res.json({ success: true, users: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata orodha ya watumiaji.' });
  }
});

// REAL CUSTOMER CREDIT VISIBILITY & BREAKDOWN
router.get('/super-admin/customers/credits', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (_req: NmyAuthRequest, res: Response) => {
  try {
    const users = await db.getUsers();
    const customers = users.filter(u => u.role === 'CUSTOMER');
    const allLedger = await db.getAllCreditLedger();

    const customerCreditList = await Promise.all(
      customers.map(async c => {
        const balanceTzs = await db.getCustomerCredit(c.id);
        const cLedger = allLedger.filter(l => l.userId === c.id);

        let totalAdded = 0;
        let totalCharged = 0;
        let totalRefunded = 0;
        let totalAdjustments = 0;

        for (const entry of cLedger) {
          if (entry.type === 'ADD') totalAdded += entry.amount;
          else if (entry.type === 'CHARGE') totalCharged += entry.amount;
          else if (entry.type === 'REFUND') totalRefunded += entry.amount;
          else if (entry.type === 'ADJUSTMENT') totalAdjustments += entry.amount;
        }

        const sorted = [...cLedger].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const lastTx = sorted[0] || null;

        // Dynamic 100% calculation
        const startingBase = Math.max(balanceTzs + totalCharged - totalRefunded, totalAdded, balanceTzs, 0);
        const usedPct = startingBase > 0 ? Math.min(100, Math.round((totalCharged / startingBase) * 100)) : 0;
        const remPct = startingBase > 0 ? Math.max(0, Math.min(100, Math.round((balanceTzs / startingBase) * 100))) : (balanceTzs > 0 ? 100 : 0);

        return {
          id: c.id,
          fullName: c.fullName,
          phone: c.phone,
          status: c.status,
          createdAt: c.createdAt,
          lastLoginAt: c.lastLoginAt,
          currentBalanceTzs: balanceTzs,
          startingBaseTzs: startingBase,
          usedPercentage: usedPct,
          remainingPercentage: remPct,
          claimTzs: balanceTzs,
          totalAddedTzs: totalAdded,
          totalChargedTzs: totalCharged,
          totalRefundedTzs: totalRefunded,
          totalAdjustedTzs: totalAdjustments,
          lastTransaction: lastTx
            ? {
                id: lastTx.id,
                amount: lastTx.amount,
                type: lastTx.type,
                reference: lastTx.reference,
                reason: lastTx.reason,
                timestamp: lastTx.timestamp
              }
            : null,
          ledgerCount: cLedger.length,
          recentLedger: sorted.slice(0, 10)
        };
      })
    );

    let totalOutstanding = 0;
    let totalAddedEver = 0;
    let totalChargedEver = 0;
    let totalRefundedEver = 0;
    let totalStartingBase = 0;

    for (const c of customerCreditList) {
      totalOutstanding += c.currentBalanceTzs;
      totalAddedEver += c.totalAddedTzs;
      totalChargedEver += c.totalChargedTzs;
      totalRefundedEver += c.totalRefundedTzs;
      totalStartingBase += c.startingBaseTzs;
    }

    const overallUsedPct = totalStartingBase > 0 ? Math.min(100, Math.round((totalChargedEver / totalStartingBase) * 100)) : 0;
    const overallRemPct = totalStartingBase > 0 ? Math.max(0, Math.min(100, Math.round((totalOutstanding / totalStartingBase) * 100))) : (totalOutstanding > 0 ? 100 : 0);

    res.json({
      success: true,
      customers: customerCreditList,
      summary: {
        totalCustomers: customers.length,
        totalCustomersWithCredit: customerCreditList.filter(c => c.currentBalanceTzs > 0).length,
        totalOutstandingCreditTzs: totalOutstanding,
        totalCreditAddedEverTzs: totalAddedEver,
        totalCreditChargedEverTzs: totalChargedEver,
        totalRefundedEverTzs: totalRefundedEver,
        totalStartingBaseTzs: totalStartingBase,
        totalUsedPercentage: overallUsedPct,
        totalRemainingPercentage: overallRemPct,
        totalCustomerClaimTzs: totalOutstanding,
        totalExposureTzs: totalOutstanding,
        totalTransactions: allLedger.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata taarifa za Credit za wateja.' });
  }
});

// HISTORIA YA KAZI YA ADMIN WOTE
router.get('/super-admin/work-history/admins', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (_req: NmyAuthRequest, res: Response) => {
  try {
    const users = await db.getUsers();
    const admins = users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' || u.role === 'SUPER_ADMIN_OPERATIONS');
    const allRequests = await db.getRequests();

    let totalSuperAdminWorkBalance = 0;
    let totalAdminWorkBalance = 0;
    let totalWorkBalanceEverAdded = 0;
    let totalWorkBalanceEverUsed = 0;

    const adminWorkList = await Promise.all(
      admins.map(async adm => {
        const isSuper = adm.role === 'SUPER_ADMIN';
        const workBalance = isSuper ? await db.getSuperAdminWorkCredit(adm.id) : await db.getAdminWorkCredit(adm.id);
        const workLedger = isSuper ? await db.getSuperAdminWorkLedger(adm.id) : await db.getAdminWorkLedger(adm.id);

        const assignedJobs = allRequests.filter(r => r.claimedByWorkerId === adm.id);
        const processingJobs = assignedJobs.filter(r => r.status === 'PROCESSING');
        const completedJobs = assignedJobs.filter(r => r.status === 'APPROVED');
        const rejectedJobs = assignedJobs.filter(r => r.status === 'REJECTED');

        let totalEarnings = 0;
        let totalPaidOut = 0;
        for (const entry of workLedger) {
          if (entry.amount > 0) {
            totalEarnings += entry.amount;
          } else {
            totalPaidOut += Math.abs(entry.amount);
          }
        }

        if (isSuper) {
          totalSuperAdminWorkBalance += workBalance;
        } else {
          totalAdminWorkBalance += workBalance;
        }
        totalWorkBalanceEverAdded += totalEarnings;
        totalWorkBalanceEverUsed += totalPaidOut;

        // Dynamic 100% Work Balance Basis
        const startingWorkBase = Math.max(workBalance + totalPaidOut, totalEarnings, workBalance, 0);
        const usedWorkPct = startingWorkBase > 0 ? Math.min(100, Math.round((totalPaidOut / startingWorkBase) * 100)) : 0;
        const remainingWorkPct = startingWorkBase > 0 ? Math.max(0, Math.min(100, Math.round((workBalance / startingWorkBase) * 100))) : (workBalance > 0 ? 100 : 0);

        const jobsWithDurations = assignedJobs.map(job => {
          let durationMs: number | null = null;
          let durationHuman: string | null = null;

          if (job.claimedAt && (job.completedAt || job.rejectedAt)) {
            const end = new Date(job.completedAt || job.rejectedAt!).getTime();
            const start = new Date(job.claimedAt).getTime();
            durationMs = Math.max(0, end - start);
            const secs = Math.floor(durationMs / 1000);
            const mins = Math.floor(secs / 60);
            if (mins > 0) {
              durationHuman = `${mins}m ${secs % 60}s`;
            } else {
              durationHuman = `${secs}s`;
            }
          }

          return {
            id: job.id,
            targetPhoneNumber: job.targetPhoneNumber,
            serviceName: job.serviceName,
            chargedPriceTzs: job.chargedPriceTzs,
            status: job.status,
            customerId: job.customerId,
            customerName: job.customerName,
            customerPhone: job.customerPhone,
            claimedAt: job.claimedAt,
            completedAt: job.completedAt,
            rejectedAt: job.rejectedAt,
            nidaResult: job.nidaResult,
            rejectionReason: job.rejectionReason,
            refundStatus: job.refundStatus,
            processingDurationMs: durationMs,
            processingDurationHuman: durationHuman,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt
          };
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return {
          id: adm.id,
          fullName: adm.fullName,
          phone: adm.phone,
          role: adm.role,
          status: adm.status,
          departmentId: adm.departmentId || 'dept_nida_processing',
          permissions: adm.permissions || [],
          createdAt: adm.createdAt,
          lastLoginAt: adm.lastLoginAt,
          workBalanceTzs: workBalance,
          startingWorkBaseTzs: startingWorkBase,
          usedPercentage: usedWorkPct,
          remainingPercentage: remainingWorkPct,
          totalWorkEarningsTzs: totalEarnings,
          totalWorkPaidOutTzs: totalPaidOut,
          metrics: {
            totalClaimed: assignedJobs.length,
            processingCount: processingJobs.length,
            completedCount: completedJobs.length,
            rejectedCount: rejectedJobs.length,
            completionRate: assignedJobs.length > 0 ? Math.round((completedJobs.length / assignedJobs.length) * 100) : 0
          },
          jobs: jobsWithDurations,
          workLedger
        };
      })
    );

    const totalJobsProcessed = allRequests.filter(r => r.claimedByWorkerId).length;
    const totalJobsCompleted = allRequests.filter(r => r.status === 'APPROVED').length;
    const totalJobsRejected = allRequests.filter(r => r.status === 'REJECTED').length;
    const totalCombinedWorkBalance = totalSuperAdminWorkBalance + totalAdminWorkBalance;
    const totalOverallStartingBase = totalCombinedWorkBalance + totalWorkBalanceEverUsed;
    const overallWorkUsedPct = totalOverallStartingBase > 0 ? Math.min(100, Math.round((totalWorkBalanceEverUsed / totalOverallStartingBase) * 100)) : 0;
    const overallWorkRemPct = totalOverallStartingBase > 0 ? Math.max(0, Math.min(100, Math.round((totalCombinedWorkBalance / totalOverallStartingBase) * 100))) : (totalCombinedWorkBalance > 0 ? 100 : 0);

    res.json({
      success: true,
      admins: adminWorkList,
      summary: {
        totalAdmins: admins.filter(a => a.role === 'ADMIN' || a.role === 'SUPER_ADMIN_OPERATIONS').length,
        totalAdminsTracked: admins.length,
        totalJobsProcessed,
        totalJobsCompleted,
        totalJobsRejected,
        totalWorkEarningsAllTzs: totalWorkBalanceEverAdded,
        startingWorkBalanceTzs: totalOverallStartingBase,
        workBalanceAddedTzs: totalWorkBalanceEverAdded,
        workBalanceUsedTzs: totalWorkBalanceEverUsed,
        currentWorkBalanceTzs: totalCombinedWorkBalance,
        percentageUsed: overallWorkUsedPct,
        percentageRemaining: overallWorkRemPct,
        superAdminWorkBalanceTzs: totalSuperAdminWorkBalance,
        adminWorkBalanceTzs: totalAdminWorkBalance,
        totalAdminWorkBalanceTzs: totalAdminWorkBalance,
        totalWorkBalanceTzs: totalCombinedWorkBalance
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata taarifa za kazi za Admins.' });
  }
});

// HISTORIA YA KAZI YA WATU WOTE
router.get('/super-admin/work-history/all', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (_req: NmyAuthRequest, res: Response) => {
  try {
    const allRequests = await db.getRequests();

    const jobs = allRequests.map(job => {
      let durationMs: number | null = null;
      let durationHuman: string | null = null;

      if (job.claimedAt && (job.completedAt || job.rejectedAt)) {
        const end = new Date(job.completedAt || job.rejectedAt!).getTime();
        const start = new Date(job.claimedAt).getTime();
        durationMs = Math.max(0, end - start);
        const secs = Math.floor(durationMs / 1000);
        const mins = Math.floor(secs / 60);
        if (mins > 0) {
          durationHuman = `${mins}m ${secs % 60}s`;
        } else {
          durationHuman = `${secs}s`;
        }
      }

      return {
        id: job.id,
        targetPhoneNumber: job.targetPhoneNumber,
        serviceName: job.serviceName,
        chargedPriceTzs: job.chargedPriceTzs,
        status: job.status,
        customerId: job.customerId,
        customerName: job.customerName,
        customerPhone: job.customerPhone,
        claimedByWorkerId: job.claimedByWorkerId,
        claimedByWorkerName: job.claimedByWorkerName,
        claimedByWorkerRole: job.claimedByWorkerRole,
        claimedAt: job.claimedAt,
        completedAt: job.completedAt,
        rejectedAt: job.rejectedAt,
        nidaResult: job.nidaResult,
        rejectionReason: job.rejectionReason,
        refundStatus: job.refundStatus,
        processingDurationMs: durationMs,
        processingDurationHuman: durationHuman,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      requests: jobs,
      summary: {
        totalJobs: allRequests.length,
        pendingJobs: allRequests.filter(r => r.status === 'PENDING').length,
        processingJobs: allRequests.filter(r => r.status === 'PROCESSING').length,
        completedJobs: allRequests.filter(r => r.status === 'APPROVED').length,
        rejectedJobs: allRequests.filter(r => r.status === 'REJECTED').length,
        expiredJobs: allRequests.filter(r => r.status === 'EXPIRED').length
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata historia ya kazi zote.' });
  }
});

router.put(['/super-admin/users/:id/status', '/admin/users/:id/status'], nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    const { status, reason } = req.body;
    if (status !== 'ACTIVE' && status !== 'SUSPENDED' && status !== 'DISABLED') {
      return res.status(400).json({ success: false, message: 'Hali (status) si sahihi.' });
    }

    const actor = req.user!;
    const userId = String(req.params.id);

    const targetUser = await db.getUserById(userId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'Mtumiaji hakupatikana.' });

    // Permissions check:
    if (actor.role === 'CUSTOMER' || actor.role === 'SUPER_ADMIN_OPERATIONS') {
      return res.status(403).json({ success: false, message: 'Huna mamlaka ya kubadilisha hali ya akaunti.' });
    }

    if (actor.role === 'ADMIN') {
      const hasUserManagement = Array.isArray(actor.permissions) && (actor.permissions.includes('MANAGE_USERS') || actor.permissions.includes('ALL'));
      if (!hasUserManagement) {
        return res.status(403).json({ success: false, message: 'Huna mamlaka ya kubadili hali ya watumiaji. Super Admin pekee anaweza kukupa ruhusa ya "MANAGE_USERS".' });
      }
      if (targetUser.role !== 'CUSTOMER') {
        return res.status(403).json({ success: false, message: 'Huna mamlaka ya kubadilisha hali ya akaunti ya mtumishi au Super Admin.' });
      }
    }

    if (actor.id === userId && status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Huwezi kujifunga akaunti yako mwenyewe.' });
    }

    const updated = await db.updateUser(userId, { status });
    if (!updated) return res.status(404).json({ success: false, message: 'Mtumiaji hakupatikana.' });

    const isLocking = status === 'SUSPENDED' || status === 'DISABLED';

    if (isLocking) {
      // Immediately revoke all active sessions for this user so they are instantly booted
      await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
    }

    const action = isLocking ? 'ACCOUNT_LOCKED' : 'ACCOUNT_UNLOCKED';
    const actionDetails = isLocking
      ? `${actor.role} ${actor.fullName} alifunga akaunti ya ${targetUser.fullName} (${targetUser.phone}). Sababu: ${reason || 'Hatua ya kiutawala/usalama'}. Data, salio na maombi vimehifadhiwa.`
      : `${actor.role} ${actor.fullName} alifungua akaunti ya ${targetUser.fullName} (${targetUser.phone}).`;

    await db.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role as any,
      action,
      target: `USER:${userId}`,
      targetId: userId,
      details: actionDetails
    });

    res.json({
      success: true,
      message: isLocking
        ? `Akaunti ya ${targetUser.fullName} imefungwa (LOCKED/SUSPENDED). Data na salio vimehifadhiwa salama.`
        : `Akaunti ya ${targetUser.fullName} imefunguliwa na kuwezeshwa (ACTIVE).`,
      user: updated
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Hitilafu ya kubadili hali ya mtumiaji.' });
  }
});

// Grant or Revoke Admin "KUONGEZA CREDIT" permission (Super Admin only)
router.post('/super-admin/admins/:id/credit-permission', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const adminId = String(req.params.id);
    const { canAddCredit } = req.body;
    const actor = { id: req.user!.id, name: req.user!.fullName };

    const result = await db.updateAdminCreditPermission(adminId, Boolean(canAddCredit), actor);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    res.json({
      success: true,
      message: canAddCredit
        ? 'Ruhusa ya kuongeza Credit imetolewa kwa Admin huyu.'
        : 'Ruhusa ya kuongeza Credit imeondolewa kwa Admin huyu.',
      user: result.user
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kurekebisha ruhusa ya Admin.' });
  }
});

// Mark user for deletion (7-day grace period, Super Admin only)
router.post('/super-admin/users/:id/mark-for-deletion', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const userId = String(req.params.id);
    const actor = { id: req.user!.id, name: req.user!.fullName };

    const result = await db.markUserForDeletion(userId, actor);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: result.message, user: result.user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kuweka akaunti kwenye hatua ya kufutwa.' });
  }
});

// Restore user from deletion grace period (Super Admin only)
router.post('/super-admin/users/:id/restore-from-deletion', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const userId = String(req.params.id);
    const actor = { id: req.user!.id, name: req.user!.fullName };

    const result = await db.restoreUserFromDeletion(userId, actor);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: result.message, user: result.user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kurejesha akaunti.' });
  }
});

// Permanent Delete user account (Super Admin only)
router.delete('/super-admin/users/:id/permanent', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const userId = String(req.params.id);
    const actor = { id: req.user!.id, name: req.user!.fullName };

    const result = await db.permanentlyDeleteUser(userId, actor, true);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: result.message });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kufuta akaunti kabisa.' });
  }
});

// Delete user account endpoint (Super Admin only - defaults to 7-day grace period unless already marked)
router.delete(['/super-admin/users/:id', '/admin/users/:id'], nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Super Admin pekee mwenye mamlaka ya kufuta akaunti ya mtumiaji.' });
    }
    const userId = String(req.params.id);
    const actor = { id: req.user!.id, name: req.user!.fullName };
    const force = req.query.force === 'true' || req.body?.force === true;

    const user = await db.getUserById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Mtumiaji hakupatikana.' });

    // If user is already MARKED_FOR_DELETION or force is requested, permanently delete
    if (user.status === 'MARKED_FOR_DELETION' || force) {
      const result = await db.permanentlyDeleteUser(userId, actor, true);
      if (!result.success) {
        return res.status(400).json({ success: false, message: result.message });
      }
      return res.json({ success: true, message: result.message });
    }

    // Otherwise initiate the 7-day grace period
    const markResult = await db.markUserForDeletion(userId, actor);
    if (!markResult.success) {
      return res.status(400).json({ success: false, message: markResult.message });
    }

    res.json({ success: true, message: markResult.message, user: markResult.user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kufuta akaunti ya mtumiaji.' });
  }
});

// Reset Password / PIN for Customer or Admin (Super Admin only -> Resets to temporary 1234)
router.post('/super-admin/users/:id/reset-password', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const userId = String(req.params.id);
    const targetUser = await db.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Mtumiaji hakupatikana.' });
    }

    if (targetUser.role === 'SUPER_ADMIN' && targetUser.id !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'Huwezi kubadilisha neno la siri la Super Admin mwingine.' });
    }

    // Canonical temporary password is 1234 (never stored in plaintext)
    const tempPassword = (req.body.newPassword && String(req.body.newPassword).trim()) ? String(req.body.newPassword).trim() : '1234';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const updated = await db.updateUser(userId, {
      password: hashedPassword,
      mustChangePassword: true
    });

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      actorRole: 'SUPER_ADMIN',
      action: 'PASSWORD_RESET_BY_SUPER_ADMIN',
      target: `USER:${userId}`,
      targetId: userId,
      details: `Super Admin ${req.user!.fullName} reset password for ${targetUser.fullName} (${targetUser.phone}) to temporary password 1234. User is strictly required to change password on next login.`
    });

    res.json({
      success: true,
      message: `Neno la siri la ${targetUser.fullName} limewekwa upya kuwa nenosiri la muda (1234). Mtumiaji atalazimika kubadilisha nenosiri akiingia.`,
      user: updated,
      temporaryPassword: '1234'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kuweka upya neno la siri.' });
  }
});

// Create Admin or Super Admin Operations (Super Admin only)
router.post('/super-admin/admins', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const { fullName, phone, password, permissions, departmentId, role: requestedRole } = req.body;

    if (!fullName || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Jaza jina, simu na password.' });
    }

    const normalizedPhone = normalizePhone(phone);
    const existing = await db.getUserByPhone(normalizedPhone);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Namba hii ya simu tayari imesajiliwa.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const targetRole: NmyUserRole = requestedRole === 'SUPER_ADMIN_OPERATIONS' ? 'SUPER_ADMIN_OPERATIONS' : 'ADMIN';
    const isOps = targetRole === 'SUPER_ADMIN_OPERATIONS';

    const defaultPermissions = isOps
      ? ['PROCESS_REQUESTS', 'APPROVE_REQUESTS', 'REJECT_REQUESTS', 'CAN_ADD_CREDIT', 'VIEW_CUSTOMER_PHONE']
      : ['PROCESS_REQUESTS', 'APPROVE_REQUESTS', 'REJECT_REQUESTS'];

    const newAdmin: NmyUser = {
      id: `usr_${isOps ? 'ops' : 'adm'}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      phone: normalizedPhone,
      fullName: fullName.trim(),
      password: hashedPassword,
      role: targetRole,
      status: 'ACTIVE',
      departmentId: departmentId || (isOps ? 'dept_operations' : 'dept_nida_processing'),
      permissions: Array.isArray(permissions) && permissions.length > 0 ? permissions : defaultPermissions,
      language: 'sw',
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.createUser(newAdmin);

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      actorRole: 'SUPER_ADMIN',
      action: isOps ? 'SUPER_ADMIN_OPERATIONS_CREATED' : 'ADMIN_CREATED',
      target: `${targetRole}:${newAdmin.id}`,
      targetId: newAdmin.id,
      details: `Super Admin created ${isOps ? 'Super Admin Operations' : 'Admin'} account for ${newAdmin.fullName} (${newAdmin.phone})`
    });

    res.status(201).json({
      success: true,
      message: isOps ? 'Akaunti ya Super Admin Operations imeundwa kikamilifu.' : 'Akaunti ya Admin imeundwa kikamilifu.',
      admin: {
        id: newAdmin.id,
        fullName: newAdmin.fullName,
        phone: newAdmin.phone,
        role: newAdmin.role,
        permissions: newAdmin.permissions
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kuunda akaunti.' });
  }
});

// Review Credit Requests (Approve/Reject)
router.get('/super-admin/credit/requests', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (_req: NmyAuthRequest, res: Response) => {
  try {
    const list = await db.getCreditRequests();
    res.json({ success: true, requests: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata maombi ya Credit.' });
  }
});

router.post('/super-admin/credit/requests/:id/review', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const { action, rejectionReason } = req.body;
    const user = req.user!;

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return res.status(400).json({ success: false, message: 'Kitendo lazima kiwe APPROVE au REJECT.' });
    }

    const credReqId = String(req.params.id);
    const result = await db.reviewCreditRequest({
      id: credReqId,
      action,
      reviewedBy: user.fullName || user.id,
      rejectionReason
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    await db.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: 'SUPER_ADMIN',
      action: action === 'APPROVE' ? 'CREDIT_ADDED' : 'CREDIT_REQUEST_REJECTED',
      target: `CREDIT_REQUEST:${credReqId}`,
      targetId: credReqId,
      details: `Super Admin ${action === 'APPROVE' ? 'approved' : 'rejected'} credit request for TSh ${result.creditRequest?.amountTzs}.`
    });

    res.json({
      success: true,
      message: action === 'APPROVE' ? 'Credit imeidhinishwa na kuongezwa kwa mteja.' : 'Ombi la Credit limekataliwa.',
      creditRequest: result.creditRequest
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kukagua ombi la Credit.' });
  }
});

// CUSTOMER LOOKUP BY PHONE NUMBER OR ID (ROLE: SUPER_ADMIN, SUPER_ADMIN_OPERATIONS OR ADMIN)
router.get(['/super-admin/customers/lookup', '/admin/customers/lookup'], nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN_OPERATIONS') {
      return res.status(403).json({ success: false, message: 'Huna mamlaka ya kutafuta mteja.' });
    }
    const rawQuery = String(req.query.phone || req.query.query || '').trim();
    if (!rawQuery) {
      return res.status(400).json({
        success: false,
        message: 'Weka namba ya simu ya mteja (mfano 0766..., 255766..., +255766...) au User ID.'
      });
    }

    const norm = normalizePhone(rawQuery);
    let targetCustomer: NmyUser | null = null;

    // 1. Check exact phone match
    if (norm) {
      targetCustomer = await db.getUserByPhone(norm);
    }

    // 2. Check user ID match
    if (!targetCustomer) {
      targetCustomer = await db.getUserById(rawQuery);
    }

    // 3. Search in all customers by partial phone or name
    if (!targetCustomer) {
      const allUsers = await db.getUsers();
      targetCustomer = allUsers.find(u =>
        u.role === 'CUSTOMER' && (
          u.phone === norm ||
          u.phone.includes(norm || rawQuery) ||
          u.fullName.toLowerCase().includes(rawQuery.toLowerCase()) ||
          u.id.toLowerCase() === rawQuery.toLowerCase()
        )
      ) || null;
    }

    if (!targetCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Hakuna mteja aliyepatikana kwa namba ya simu au utambulisho uliowekwa.'
      });
    }

    const balanceTzs = await db.getCustomerCredit(targetCustomer.id);
    const ledger = await db.getCustomerLedger(targetCustomer.id);

    let totalAdded = 0;
    let totalUsed = 0;
    for (const l of ledger) {
      if (l.type === 'ADD') totalAdded += l.amount;
      else if (l.type === 'CHARGE') totalUsed += l.amount;
    }

    res.json({
      success: true,
      customer: {
        id: targetCustomer.id,
        fullName: targetCustomer.fullName,
        phone: targetCustomer.phone,
        status: targetCustomer.status,
        currentBalanceTzs: balanceTzs,
        totalAdded,
        totalUsed,
        recentLedger: ledger.slice(0, 5)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kutafuta mteja.' });
  }
});

// Manual Credit Adjustment (Supports Super Admin, Super Admin Operations, and Authorized Admins)
router.post(['/super-admin/credit/manual-adjust', '/admin/credit/manual-adjust'], nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    const { customerId, phone, amountTzs, reason } = req.body;
    const user = req.user!;
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const isSuperAdminOps = user.role === 'SUPER_ADMIN_OPERATIONS';
    const isAdminWithPermission = user.role === 'ADMIN' && Array.isArray(user.permissions) && user.permissions.includes('CAN_ADD_CREDIT');

    if (!isSuperAdmin && !isSuperAdminOps && !isAdminWithPermission) {
      return res.status(403).json({
        success: false,
        message: 'Huna mamlaka ya kuongeza Credit. Wasiliana na Super Admin.'
      });
    }

    const amount = Number(amountTzs);
    if ((!customerId && !phone) || !amount || !reason || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Weka namba ya simu au ID ya mteja, kiasi cha Credit, na sababu.'
      });
    }

    if (!isSuperAdmin && amount <= 0) {
      return res.status(403).json({
        success: false,
        message: 'Unaruhusiwa tu kuongeza Credit, si kupunguza salio la mteja.'
      });
    }

    let targetCustomer: NmyUser | null = null;
    if (phone) {
      const norm = normalizePhone(String(phone));
      targetCustomer = await db.getUserByPhone(norm);
    }
    if (!targetCustomer && customerId) {
      const norm = normalizePhone(String(customerId));
      targetCustomer = await db.getUserByPhone(norm) || await db.getUserById(String(customerId));
    }

    if (!targetCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Mteja hakupatikana kwa namba ya simu au ID uliyoweka. Tafadhali hakikisha mteja yupo kwenye mfumo.'
      });
    }

    // Server-authoritative Negative Balance Protection
    const currentBalance = await db.getCustomerCredit(targetCustomer.id);
    if (amount < 0 && currentBalance + amount < 0) {
      return res.status(400).json({
        success: false,
        message: `Salio la mteja halitoshi kupunguza kiasi hiki (Negative Balance Protection). Salio la sasa ni TSh ${currentBalance.toLocaleString()}.`
      });
    }

    // Server-authoritative Duplicate Protection (within 5 seconds)
    const recentCustLedger = await db.getCustomerLedger(targetCustomer.id);
    const isDuplicate = recentCustLedger.some(entry =>
      entry.amount === amount &&
      (entry.reason === `Marekebisho ya Uongozi: ${reason}` || entry.reason === `Kuongeza Credit (Admin ${user.fullName}): ${reason}`) &&
      (Date.now() - new Date(entry.timestamp).getTime()) < 5000
    );
    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        message: 'Marekebisho haya yalikwishafanyika sekunde chache zilizopita (Duplicate Operation Protected).',
        newBalance: currentBalance
      });
    }

    const actionReason = isSuperAdmin ? `Marekebisho ya Uongozi: ${reason}` : `Kuongeza Credit (Admin ${user.fullName}): ${reason}`;

    const result = await db.addCustomerCredit({
      userId: targetCustomer.id,
      amount,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role as any,
      reason: actionReason,
      reference: `ADJUST_${Date.now()}`
    });

    await db.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: amount > 0 ? 'CREDIT_ADDED' : 'CREDIT_DEDUCTED',
      target: `USER:${targetCustomer.id}`,
      targetId: targetCustomer.id,
      details: `${user.role} ${user.fullName} manually adjusted credit by TSh ${amount} for ${targetCustomer.fullName} (${targetCustomer.phone}). Reason: ${reason}. New balance: TSh ${result.balanceAfter}.`
    });

    // Notify customer in-app & send real mobile push notification
    const notifTitle = amount > 0 ? 'Credit Imeongezwa' : 'Credit Imerekebishwa';
    const notifMsg = amount > 0
      ? `Credit ya TSh ${amount.toLocaleString()} imeongezwa kwenye akaunti yako na Uongozi wa RAVINI. Salio jipya: TSh ${result.balanceAfter.toLocaleString()}.`
      : `Credit ya TSh ${Math.abs(amount).toLocaleString()} imepunguzwa kwenye akaunti yako. Salio jipya: TSh ${result.balanceAfter.toLocaleString()}.`;

    await db.createNotification({
      userId: targetCustomer.id,
      title: notifTitle,
      message: notifMsg,
      type: 'CREDIT'
    });

    pushService.sendNotificationToUser(targetCustomer.id, {
      title: notifTitle,
      message: notifMsg,
      type: 'CREDIT',
      url: '/profile',
      eventKey: `credit_${targetCustomer.id}_${result.ledgerEntry?.id || Date.now()}`
    }).catch((err: any) => console.warn('[PUSH CREDIT ERROR]:', err.message));

    realtimeService.notifyUser(targetCustomer.id, { type: 'CREDIT_UPDATED', newBalance: result.balanceAfter });

    res.json({
      success: true,
      message: `Credit ya mteja ${targetCustomer.fullName} (${targetCustomer.phone}) imesasishwa kikamilifu. Salio jipya: TSh ${result.balanceAfter.toLocaleString()}.`,
      newBalance: result.balanceAfter,
      customer: {
        id: targetCustomer.id,
        fullName: targetCustomer.fullName,
        phone: targetCustomer.phone
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Hitilafu ya kurekebisha Credit.' });
  }
});

// CHANGE WHATSAPP PAYMENT NUMBER (SUPER_ADMIN ONLY, WITH AUDIT LOG)
router.put('/super-admin/settings/whatsapp-number', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const { whatsappNumber } = req.body;
    if (!whatsappNumber) {
      return res.status(400).json({ success: false, message: 'Weka namba mpya ya WhatsApp ya malipo.' });
    }

    const normalized = normalizePhone(String(whatsappNumber));
    if (!normalized || normalized.length < 9) {
      return res.status(400).json({ success: false, message: 'Namba ya WhatsApp si sahihi (weka 07... au 255...).' });
    }

    const currentSettings = await db.getSettings();
    const oldNumber = currentSettings.whatsappNumber || 'N/A';

    const updatedPaymentMethods = (currentSettings.paymentMethods || []).map(m => ({
      ...m,
      accountNumber: normalized,
      instructions: m.instructions?.replace(/\b0\d{9}\b|\b255\d{9}\b/g, normalized) || m.instructions
    }));

    const updated = await db.updateSettings({
      whatsappNumber: normalized,
      supportPhone: normalized,
      paymentMethods: updatedPaymentMethods
    }, {
      id: req.user!.id,
      name: req.user!.fullName
    });

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      actorRole: 'SUPER_ADMIN',
      action: 'WHATSAPP_NUMBER_CHANGED',
      target: 'SYSTEM_SETTINGS:WHATSAPP',
      details: `Super Admin ${req.user!.fullName} changed central WhatsApp & support contact from ${oldNumber} to ${normalized}. All support, payment, and WhatsApp links synchronized.`
    });

    res.json({
      success: true,
      message: `Namba ya WhatsApp na Huduma imesasishwa kuwa ${normalized}. Sehemu zote za malipo, msaada na mawasiliano zitatumia namba hii mara moja.`,
      whatsappNumber: updated.whatsappNumber
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kusasisha namba ya WhatsApp.' });
  }
});

// CHANGE REQUEST TIMEOUT DURATION (SUPER_ADMIN ONLY, WITH AUDIT LOG)
router.put('/super-admin/settings/request-timeout', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const { timeoutMinutes } = req.body;
    const minutes = Number(timeoutMinutes);
    if (!minutes || isNaN(minutes) || minutes < 1 || minutes > 1440) {
      return res.status(400).json({ success: false, message: 'Weka muda sahihi wa dakika kati ya 1 na 1440 (masaa 24).' });
    }

    const currentSettings = await db.getSettings();
    const oldTimeout = currentSettings.requestTimeoutMinutes || 15;

    const updated = await db.updateSettings({ requestTimeoutMinutes: minutes }, {
      id: req.user!.id,
      name: req.user!.fullName
    });

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      actorRole: 'SUPER_ADMIN',
      action: 'REQUEST_TIMEOUT_CHANGED',
      target: 'SYSTEM_SETTINGS:REQUEST_TIMEOUT',
      details: `Super Admin ${req.user!.fullName} alibadilisha muda wa ombi kuisha (request timeout) kutoka dakika ${oldTimeout} kuwa dakika ${minutes}.`
    });

    res.json({
      success: true,
      message: `Muda wa maombi kuisha umesasishwa kuwa dakika ${minutes}.`,
      requestTimeoutMinutes: updated.requestTimeoutMinutes
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kusasisha muda wa ombi.' });
  }
});

// ADMIN WORK ACCOUNT PAYMENT LINK (PRE-FILL WHATSAPP FOR SUPER ADMIN)
router.get('/super-admin/admins/:id/work-payment-link', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const adminId = String(req.params.id);
    const targetUser = await db.getUserById(adminId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Mtendaji hakupatikana.' });
    }

    const isSuper = targetUser.role === 'SUPER_ADMIN';
    const outstandingBalance = isSuper
      ? await db.getSuperAdminWorkCredit(adminId)
      : await db.getAdminWorkCredit(adminId);

    const reqAmount = Number(req.query.amount);
    const amountToPay = !isNaN(reqAmount) && reqAmount > 0 ? reqAmount : outstandingBalance;

    if (amountToPay > outstandingBalance) {
      return res.status(400).json({
        success: false,
        message: `Kiasi cha malipo (TSh ${amountToPay.toLocaleString()}) hakiwezi kuzidi salio lililopo (TSh ${outstandingBalance.toLocaleString()}).`
      });
    }

    const cleanPhone = normalizePhone(targetUser.phone);
    const remainingPreview = outstandingBalance - amountToPay;
    const message = `Habari ${targetUser.fullName},\n\nNimekutumia malipo ya kazi TSh ${amountToPay.toLocaleString()} kupitia simu yako (${targetUser.phone}).\n\nSalio lako la kazi lililobaki ni: TSh ${remainingPreview.toLocaleString()}.\n\nAsante kwa kazi nzuri! - RAVINI.`;

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    res.json({
      success: true,
      whatsappUrl,
      prefilledMessage: message,
      admin: {
        id: targetUser.id,
        fullName: targetUser.fullName,
        phone: targetUser.phone,
        role: targetUser.role
      },
      outstandingBalance,
      amountToPay,
      remainingBalance: remainingPreview
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kuandaa mawasiliano ya malipo.' });
  }
});

// ADMIN & SUPER ADMIN WORK ACCOUNT PAYMENT CONFIRMATION (CONFIRM PAID IN POSTGRESQL)
router.post('/super-admin/admins/:id/work-payment', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const adminId = String(req.params.id);
    const { amount, reason } = req.body;
    const user = req.user!;

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Weka kiasi halali cha kulipa (zaidi ya 0).' });
    }

    const targetUser = await db.getUserById(adminId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Mtendaji hakupatikana.' });
    }

    const isSuper = targetUser.role === 'SUPER_ADMIN';
    const currentOutstanding = isSuper
      ? await db.getSuperAdminWorkCredit(adminId)
      : await db.getAdminWorkCredit(adminId);

    if (payAmount > currentOutstanding) {
      return res.status(400).json({
        success: false,
        message: `Kiasi cha malipo (TSh ${payAmount.toLocaleString()}) hakiwezi kuzidi salio lililopo la kazi (TSh ${currentOutstanding.toLocaleString()}).`
      });
    }

    let balanceAfter = 0;
    let ledgerEntry: any;

    if (isSuper) {
      const paymentResult = await db.paySuperAdminWorkBalance({
        superAdminId: adminId,
        amount: payAmount,
        actorId: user.id,
        actorName: user.fullName,
        reason: reason || 'Malipo ya Kazi ya Super Admin (Payout Confirmed)'
      });
      balanceAfter = paymentResult.balanceAfter;
      ledgerEntry = paymentResult.ledgerEntry;
    } else {
      const paymentResult = await db.payAdminWorkBalance({
        adminId,
        amount: payAmount,
        actorId: user.id,
        actorName: user.fullName,
        reason: reason || 'Malipo ya Kazi ya Admin (WhatsApp Manual Payment)'
      });
      balanceAfter = paymentResult.balanceAfter;
      ledgerEntry = paymentResult.ledgerEntry;

      // Notify Admin in-app & push
      await db.createNotification({
        userId: adminId,
        title: 'Malipo ya Kazi Yamepokelewa',
        message: `Umepokea malipo ya kazi ya TSh ${payAmount.toLocaleString()} kutoka kwa Super Admin ${user.fullName}. Salio lako jipya la kazi ni TSh ${balanceAfter.toLocaleString()}.`,
        type: 'CREDIT'
      });

      pushService.sendNotificationToUser(adminId, {
        title: 'Malipo ya Kazi Yamepokelewa',
        message: `Umepokea malipo ya TSh ${payAmount.toLocaleString()}. Salio la kazi: TSh ${balanceAfter.toLocaleString()}.`,
        type: 'CREDIT',
        url: '/huduma'
      }).catch((err: any) => console.warn('[PUSH WORK PAYMENT ERROR]:', err.message));
    }

    res.json({
      success: true,
      message: `Malipo ya TSh ${payAmount.toLocaleString()} yamethibitishwa kikamilifu kwa ${targetUser.fullName}. Salio lililobaki: TSh ${balanceAfter.toLocaleString()}.`,
      paidAmount: payAmount,
      remainingBalance: balanceAfter,
      ledgerEntry,
      admin: {
        id: targetUser.id,
        fullName: targetUser.fullName,
        phone: targetUser.phone,
        role: targetUser.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Hitilafu ya kukamilisha malipo ya kazi.' });
  }
});

// Services & Pricing Management
router.get('/super-admin/services', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (_req: NmyAuthRequest, res: Response) => {
  try {
    const services = await db.getServices();
    res.json({ success: true, services });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata huduma.' });
  }
});

router.put('/super-admin/services/:id/price', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const { priceTzs } = req.body;
    const price = Number(priceTzs);
    if (price === undefined || isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, message: 'Weka bei halali (TSh).' });
    }

    const srvId = String(req.params.id);
    const updated = await db.updateServicePrice(srvId, price, {
      id: req.user!.id,
      name: req.user!.fullName
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Huduma haikupatikana.' });
    }

    res.json({
      success: true,
      message: `Bei ya huduma imesasishwa kuwa TSh ${price.toLocaleString()}.`,
      service: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kubadili bei ya huduma.' });
  }
});

// System Settings Management
router.get('/super-admin/settings', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (_req: NmyAuthRequest, res: Response) => {
  try {
    const settings = await db.getSettings();
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata mipangilio ya mfumo.' });
  }
});

router.put('/super-admin/settings', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const patch = req.body;
    const updated = await db.updateSettings(patch, {
      id: req.user!.id,
      name: req.user!.fullName
    });

    res.json({
      success: true,
      message: 'Mipangilio ya mfumo imesasishwa kikamilifu.',
      settings: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kusasisha mipangilio.' });
  }
});

// -------------------------------------------------------------
// ANNOUNCEMENTS (TEXT ONLY)
// -------------------------------------------------------------
router.get('/announcements/active', nmyAuthMiddleware, async (req: NmyAuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role || 'CUSTOMER';
    const announcements = await db.getActiveAnnouncementsForRole(userRole);
    res.json({ success: true, announcements });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata matangazo.' });
  }
});

router.get('/super-admin/announcements', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (_req: NmyAuthRequest, res: Response) => {
  try {
    const announcements = await db.getAnnouncements(false); // Return all, active and inactive
    res.json({ success: true, announcements });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata matangazo.' });
  }
});

router.post('/super-admin/announcements', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const { title, message, targetType, targetUserId, isActive } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Weka kichwa na maelezo ya tangazo.' });
    }

    const announcement = await db.createAnnouncement({
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      message: message.trim(),
      targetType: targetType || 'ALL',
      targetUserId,
      isActive: isActive !== false,
      createdById: req.user!.id,
      createdByName: req.user!.fullName,
      recipientCount: 0,
      createdAt: new Date().toISOString()
    });

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      actorRole: 'SUPER_ADMIN',
      action: 'ANNOUNCEMENT_CREATED',
      target: `ANNOUNCEMENT:${announcement.id}`,
      targetId: announcement.id,
      details: `Super Admin created text announcement: "${announcement.title}" for ${announcement.targetType} (Active: ${announcement.isActive})`
    });

    // Real Mobile Push Notification to target audience if active
    if (announcement.isActive) {
      const pushTitle = `Tangazo: ${announcement.title}`;
      const pushBody = announcement.message.length > 120 ? `${announcement.message.substring(0, 117)}...` : announcement.message;

      if (announcement.targetType === 'ALL_CUSTOMERS') {
        pushService.sendNotificationToRole('CUSTOMER', {
          title: pushTitle,
          message: pushBody,
          type: 'ANNOUNCEMENT',
          url: '/',
          eventKey: `ann_cust_${announcement.id}`
        }).catch((err: any) => console.warn('[PUSH ANNOUNCEMENT CUST ERROR]:', err.message));
      } else if (announcement.targetType === 'ALL_ADMINS') {
        pushService.sendNotificationToRole('ADMIN', {
          title: pushTitle,
          message: pushBody,
          type: 'ANNOUNCEMENT',
          url: '/',
          eventKey: `ann_adm_${announcement.id}`
        }).catch((err: any) => console.warn('[PUSH ANNOUNCEMENT ADM ERROR]:', err.message));
      } else {
        pushService.broadcastNotification({
          title: pushTitle,
          message: pushBody,
          type: 'ANNOUNCEMENT',
          url: '/',
          eventKey: `ann_all_${announcement.id}`
        }).catch((err: any) => console.warn('[PUSH ANNOUNCEMENT ALL ERROR]:', err.message));
      }

      realtimeService.broadcast({
        type: 'ANNOUNCEMENT_CREATED',
        announcementId: announcement.id,
        title: announcement.title,
        message: announcement.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Tangazo limerekodiwa na kuchapishwa kikamilifu.',
      announcement
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kutuma tangazo.' });
  }
});

router.put('/super-admin/announcements/:id', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const annId = String(req.params.id);
    const { title, message, targetType, isActive } = req.body;

    const updated = await db.updateAnnouncement(annId, {
      title,
      message,
      targetType,
      isActive
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Tangazo halikupatikana.' });
    }

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      actorRole: 'SUPER_ADMIN',
      action: 'ANNOUNCEMENT_UPDATED',
      target: `ANNOUNCEMENT:${annId}`,
      targetId: annId,
      details: `Super Admin updated announcement "${updated.title}" (Active: ${updated.isActive})`
    });

    res.json({
      success: true,
      message: 'Tangazo limesasishwa kikamilifu.',
      announcement: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kusasisha tangazo.' });
  }
});

router.patch('/super-admin/announcements/:id/status', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const annId = String(req.params.id);
    const { isActive } = req.body;

    const updated = await db.updateAnnouncement(annId, { isActive: Boolean(isActive) });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Tangazo halikupatikana.' });
    }

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      actorRole: 'SUPER_ADMIN',
      action: 'ANNOUNCEMENT_STATUS_CHANGED',
      target: `ANNOUNCEMENT:${annId}`,
      targetId: annId,
      details: `Super Admin changed announcement status to ${updated.isActive ? 'ACTIVE' : 'INACTIVE'}`
    });

    if (updated.isActive) {
      const pushTitle = `Tangazo: ${updated.title}`;
      const pushBody = updated.message.length > 120 ? `${updated.message.substring(0, 117)}...` : updated.message;

      if (updated.targetType === 'ALL_CUSTOMERS') {
        pushService.sendNotificationToRole('CUSTOMER', {
          title: pushTitle,
          message: pushBody,
          type: 'ANNOUNCEMENT',
          url: '/',
          eventKey: `ann_status_cust_${updated.id}`
        }).catch((err: any) => console.warn('[PUSH ANNOUNCEMENT CUST ERROR]:', err.message));
      } else if (updated.targetType === 'ALL_ADMINS') {
        pushService.sendNotificationToRole('ADMIN', {
          title: pushTitle,
          message: pushBody,
          type: 'ANNOUNCEMENT',
          url: '/',
          eventKey: `ann_status_adm_${updated.id}`
        }).catch((err: any) => console.warn('[PUSH ANNOUNCEMENT ADM ERROR]:', err.message));
      } else {
        pushService.broadcastNotification({
          title: pushTitle,
          message: pushBody,
          type: 'ANNOUNCEMENT',
          url: '/',
          eventKey: `ann_status_all_${updated.id}`
        }).catch((err: any) => console.warn('[PUSH ANNOUNCEMENT ALL ERROR]:', err.message));
      }
    }

    res.json({
      success: true,
      message: `Tangazo sasa ni ${updated.isActive ? 'LINALOONEKANA (Active)' : 'LILILOZIMWA (Inactive)'}.`,
      announcement: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kubadili hali ya tangazo.' });
  }
});

router.delete('/super-admin/announcements/:id', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const annId = String(req.params.id);
    const deleted = await db.deleteAnnouncement(annId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Tangazo halikupatikana.' });
    }

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      actorRole: 'SUPER_ADMIN',
      action: 'ANNOUNCEMENT_DELETED',
      target: `ANNOUNCEMENT:${annId}`,
      targetId: annId,
      details: `Super Admin deleted announcement ${annId}`
    });

    res.json({
      success: true,
      message: 'Tangazo limefutwa kikamilifu.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kufuta tangazo.' });
  }
});

// Audit Logs
router.get('/super-admin/audit-logs', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const logs = await db.getAuditLogs(limit);
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata audit logs.' });
  }
});

// Departments
router.get('/super-admin/departments', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (_req: NmyAuthRequest, res: Response) => {
  try {
    const depts = await db.getDepartments();
    res.json({ success: true, departments: depts });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata vitengo.' });
  }
});

// -------------------------------------------------------------
// 7. BACKUP & RECOVERY CENTER (ROLE: SUPER_ADMIN ONLY)
// -------------------------------------------------------------
router.get('/super-admin/backups', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (_req: NmyAuthRequest, res: Response) => {
  try {
    const backups = backupService.getBackups();
    const lastBackup = backupService.getLastBackup();
    const lastVerified = backupService.getLastVerifiedBackup();
    res.json({
      success: true,
      backups,
      lastBackup,
      lastVerified,
      status: lastVerified ? 'HEALTHY' : 'WARNING'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata orodha ya backup.' });
  }
});

router.post('/super-admin/backups/create', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const result = await backupService.createVerifiedBackup(`MANUAL_SUPER_ADMIN_${user.fullName}`);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    await db.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: 'SUPER_ADMIN',
      action: 'BACKUP_CREATED_MANUAL',
      target: 'BACKUP_CENTER',
      targetId: result.record?.id,
      details: `Super Admin created verified manual backup: ${result.record?.filename} (${result.record?.sizeBytes} bytes, SHA256: ${result.record?.sha256Checksum.slice(0, 10)}...).`
    });

    res.status(201).json({
      success: true,
      message: '✅ Backup imekamilika na kuthibitishwa kikamilifu (Verified Backup).',
      backup: result.record
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kutengeneza backup.' });
  }
});

router.post('/super-admin/backups/:id/restore', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const backupId = String(req.params.id);
    const user = req.user!;
    const { confirmPhrase } = req.body;

    if (confirmPhrase !== 'THIBITISHA REJESHA') {
      return res.status(400).json({
        success: false,
        message: 'Tafadhali andika neno "THIBITISHA REJESHA" ili kuidhinisha urejeshaji salama.'
      });
    }

    const result = await backupService.safeRestorePoint(backupId, {
      id: user.id,
      name: user.fullName,
      role: 'SUPER_ADMIN'
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    // Re-initialize database instance with restored file
    await db.initialize();

    await db.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: 'SUPER_ADMIN',
      action: 'CONTROLLED_RECOVERY_RESTORE',
      target: `BACKUP:${backupId}`,
      targetId: backupId,
      details: `Super Admin executed controlled safe restore from backup ${result.restoredRecord?.filename}. Pre-restore snapshot preserved.`
    });

    res.json({
      success: true,
      message: '✅ Mfumo umerejeshwa salama kulingana na Recovery Point uliyochagua. Data ya sasa ilihifadhiwa kwanza kabla ya kurejesha.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kurejesha mfumo kutoka kwenye backup.' });
  }
});

// DATA INTEGRITY CHECKER
router.get('/super-admin/integrity-check', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const rawData = await db.getRawSnapshot();
    const report = await backupService.runDataIntegrityCheck(rawData);

    await db.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.fullName,
      actorRole: 'SUPER_ADMIN',
      action: 'DATA_INTEGRITY_CHECK_RUN',
      target: 'DATABASE_INTEGRITY',
      details: `Super Admin ran integrity check. Status: ${report.isHealthy ? 'HEALTHY' : 'DISCREPANCIES DETECTED'} (${report.discrepancies.length} alerts).`
    });

    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kukagua data integrity.' });
  }
});

// EMERGENCY LOCK TOGGLE
router.post('/super-admin/emergency-lock', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const { active, reason } = req.body;
    const user = req.user!;
    const isLocking = Boolean(active);

    const updated = await db.updateSettings({
      emergencyLockActive: isLocking,
      emergencyLockReason: reason || (isLocking ? 'Mfumo umefungwa kwa muda kwa ajili ya usalama wa data.' : undefined)
    }, { id: user.id, name: user.fullName });

    await db.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: 'SUPER_ADMIN',
      action: isLocking ? 'EMERGENCY_LOCK_ACTIVATED' : 'EMERGENCY_LOCK_DEACTIVATED',
      target: 'SYSTEM_SECURITY',
      details: `Super Admin ${user.fullName} ${isLocking ? 'ACTIVATED' : 'DEACTIVATED'} Emergency Lock. Reason: ${reason || 'N/A'}`
    });

    res.json({
      success: true,
      message: isLocking ? '🔒 Emergency Lock imewashwa kikamilifu. Vitendo hatarishi vimesitishwa kwa muda.' : '🔓 Emergency Lock imezimwa. Mfumo umerejea kawaida.',
      emergencyLockActive: updated.emergencyLockActive,
      emergencyLockReason: updated.emergencyLockReason
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kubadili Emergency Lock.' });
  }
});

// MANUAL HISTORY CLEANUP (RULE 47: No automatic deletion; explicit confirmation + audit)
router.post('/super-admin/cleanup-history', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const { olderThanDays, category, confirmation } = req.body;
    const user = req.user!;

    if (confirmation !== 'FUTA HISTORIA') {
      return res.status(400).json({
        success: false,
        message: 'Tafadhali andika neno "FUTA HISTORIA" ili kuthibitisha kitendo hiki.'
      });
    }

    const days = Number(olderThanDays) || 30;
    if (days < 7) {
      return res.status(400).json({ success: false, message: 'Muda wa chini wa kufuta historia ni siku 7.' });
    }

    const result = await db.cleanupHistoryManual({
      olderThanDays: days,
      category,
      actorId: user.id,
      actorName: user.fullName
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    res.json({
      success: true,
      message: `✅ Rekodi ${result.affectedCount} za ${category} zimefutwa kwa usalama. Akaunti, salio, na maombi ya wateja hayajaguswa.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kufanya cleanup.' });
  }
});

// MANUAL CUSTOMER DELETION / DISABLE
router.post('/super-admin/customers/:id/delete', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const customerId = String(req.params.id);
    const { reason, confirmation } = req.body;
    const user = req.user!;

    if (confirmation !== 'FUTA AKAUNTI') {
      return res.status(400).json({
        success: false,
        message: 'Tafadhali andika neno "FUTA AKAUNTI" ili kuthibitisha kufunga/kufuta akaunti hii.'
      });
    }

    const result = await db.deleteCustomerAccountManual({
      customerId,
      actorId: user.id,
      actorName: user.fullName,
      reason: reason || 'Kufutwa na Super Admin'
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    res.json({
      success: true,
      message: '✅ Akaunti ya mteja imefungwa/kufutwa kwa usalama. Kumbukumbu za muamala na vitendo zimehifadhiwa kwa ajili ya ukaguzi.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kufuta akaunti ya mteja.' });
  }
});

// -------------------------------------------------------------
// 8. GLOBAL SEARCH & 360° VIEWS (ROLE: SUPER_ADMIN ONLY)
// -------------------------------------------------------------
router.get('/super-admin/global-search', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    if (!q) {
      return res.json({ success: true, results: { customers: [], admins: [], requests: [], payments: [] } });
    }

    const users = await db.getUsers();
    const requests = await db.getRequests();
    const creditRequests = await db.getCreditRequests();

    const normalizedQ = normalizePhone(q);
    const matchedCustomers = users
      .filter(u => u.role === 'CUSTOMER')
      .filter(u =>
        u.fullName.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (normalizedQ && u.phone === normalizedQ) ||
        (normalizedQ && u.phone.includes(normalizedQ)) ||
        u.id.toLowerCase().includes(q)
      )
      .slice(0, 10);

    const matchedAdmins = users
      .filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')
      .filter(u =>
        u.fullName.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (normalizedQ && u.phone === normalizedQ) ||
        (normalizedQ && u.phone.includes(normalizedQ)) ||
        u.id.toLowerCase().includes(q)
      )
      .slice(0, 10);

    const matchedRequests = requests
      .filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.targetPhoneNumber.includes(q) ||
        (r.nidaResult && r.nidaResult.includes(q)) ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.includes(q)
      )
      .slice(0, 15);

    const matchedPayments = creditRequests
      .filter(p =>
        p.id.toLowerCase().includes(q) ||
        p.paymentReference.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.customerPhone.includes(q)
      )
      .slice(0, 10);

    res.json({
      success: true,
      query: q,
      results: {
        customers: matchedCustomers,
        admins: matchedAdmins,
        requests: matchedRequests,
        payments: matchedPayments
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kufanya global search.' });
  }
});

// CUSTOMER 360°
router.get('/super-admin/customers/:id/360', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const customerId = String(req.params.id);
    const user = await db.getUserById(customerId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Mteja hakupatikana.' });
    }

    const balanceTzs = await db.getCustomerCredit(customerId);
    const ledger = await db.getCustomerLedger(customerId);
    const requests = await db.getRequests({ customerId });
    const allCreditRequests = await db.getCreditRequests();
    const payments = allCreditRequests.filter(cr => cr.customerId === customerId);
    const allAudit = await db.getAuditLogs(500);
    const activity = allAudit.filter(a => a.actorId === customerId || a.targetId === customerId);

    // Compute metrics
    let totalAdded = 0;
    let totalCharged = 0;
    let totalRefunded = 0;

    for (const entry of ledger) {
      if (entry.type === 'ADD') totalAdded += entry.amount;
      else if (entry.type === 'CHARGE') totalCharged += entry.amount;
      else if (entry.type === 'REFUND') totalRefunded += entry.amount;
    }

    res.json({
      success: true,
      customer: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        status: user.status,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        language: user.language
      },
      credit: {
        currentBalance: balanceTzs,
        totalAdded,
        totalCharged,
        totalRefunded,
        ledger
      },
      requests,
      payments,
      activity
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata Customer 360.' });
  }
});

// ADMIN 360°
router.get('/super-admin/admins/:id/360', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const adminId = String(req.params.id);
    const user = await db.getUserById(adminId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin hakupatikana.' });
    }

    const workBalance = user.role === 'ADMIN' ? await db.getAdminWorkCredit(adminId) : await db.getSuperAdminWorkCredit(adminId);
    const workLedger = user.role === 'ADMIN' ? await db.getAdminWorkLedger(adminId) : await db.getSuperAdminWorkLedger(adminId);
    const allRequests = await db.getRequests();
    const assignedWork = allRequests.filter(r => r.claimedByWorkerId === adminId);
    const completedWork = assignedWork.filter(r => r.status === 'APPROVED');
    const rejectedWork = assignedWork.filter(r => r.status === 'REJECTED');
    const allAudit = await db.getAuditLogs(500);
    const activity = allAudit.filter(a => a.actorId === adminId || a.targetId === adminId);

    res.json({
      success: true,
      admin: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status,
        departmentId: user.departmentId,
        permissions: user.permissions,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      },
      workAccount: {
        balanceTzs: workBalance,
        ledger: workLedger
      },
      workload: {
        totalClaimed: assignedWork.length,
        completedCount: completedWork.length,
        rejectedCount: rejectedWork.length,
        completionRate: assignedWork.length > 0 ? Math.round((completedWork.length / assignedWork.length) * 100) : 0
      },
      recentWork: assignedWork.slice(0, 20),
      activity
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata Admin 360.' });
  }
});

// REVENUE HISTORY
router.get('/super-admin/revenue-history', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const filter = String(req.query.period || 'this_month');
    const ledger = await db.getAllCreditLedger();
    const allCreditRequests = await db.getCreditRequests();

    const now = new Date();
    let startDate = new Date(0);
    let endDate: Date | null = null;

    const customStart = req.query.startDate ? String(req.query.startDate) : null;
    const customEnd = req.query.endDate ? String(req.query.endDate) : null;

    if (customStart) {
      startDate = new Date(customStart);
      // Start of day in local/UTC
      if (!customStart.includes('T')) {
        startDate.setHours(0, 0, 0, 0);
      }
      if (customEnd) {
        endDate = new Date(customEnd);
        if (!customEnd.includes('T')) {
          endDate.setHours(23, 59, 59, 999);
        }
      } else {
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
      }
    } else if (filter === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === 'yesterday') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    } else if (filter === 'this_week') {
      const day = now.getDay() || 7;
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
    } else if (filter === 'last_week') {
      const day = now.getDay() || 7;
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day - 6);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day, 23, 59, 59, 999);
    } else if (filter === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filter === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (filter === 'this_year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const filteredLedger = ledger.filter(l => {
      const ts = new Date(l.timestamp).getTime();
      if (ts < startDate.getTime()) return false;
      if (endDate && ts > endDate.getTime()) return false;
      return true;
    });

    const filteredCreditRequests = allCreditRequests.filter(cr => {
      const ts = new Date(cr.createdAt).getTime();
      if (ts < startDate.getTime()) return false;
      if (endDate && ts > endDate.getTime()) return false;
      return cr.status === 'APPROVED';
    });

    let totalRevenueTzs = 0;
    let totalRefundsTzs = 0;
    let countCharges = 0;

    for (const entry of filteredLedger) {
      if (entry.type === 'CHARGE') {
        totalRevenueTzs += entry.amount;
        countCharges++;
      } else if (entry.type === 'REFUND') {
        totalRefundsTzs += entry.amount;
      }
    }

    const approvedTopUpTotal = filteredCreditRequests.reduce((sum, cr) => sum + cr.amountTzs, 0);
    const netRevenueTzs = totalRevenueTzs - totalRefundsTzs;

    res.json({
      success: true,
      period: filter,
      summary: {
        totalRevenueTzs,
        totalRefundsTzs,
        netRevenueTzs,
        approvedTopUpTotal,
        transactionCount: countCharges,
        approvedPaymentCount: filteredCreditRequests.length
      },
      transactions: filteredLedger.slice(0, 50)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupata historia ya mapato.' });
  }
});

// EXCEL / CSV REPORT DOWNLOAD
router.get('/super-admin/reports/export', nmyAuthMiddleware, requireNmyRole('SUPER_ADMIN'), async (req: NmyAuthRequest, res: Response) => {
  try {
    const reportType = String(req.query.type || 'revenue');
    let csvData = '';
    let filename = `nmy_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (reportType === 'revenue') {
      const ledger = await db.getAllCreditLedger();
      csvData = 'Tarehe,Aina ya Muamala,Kiasi (TSh),Salio Kabla,Salio Baada,Mteja ID,Namba ya Kumbukumbu,Sababu\n' +
        ledger.map(l => `"${l.timestamp}","${l.type}",${l.amount},${l.balanceBefore},${l.balanceAfter},"${l.userId}","${l.reference}","${l.reason.replace(/"/g, '""')}"`).join('\n');
    } else if (reportType === 'requests') {
      const requests = await db.getRequests();
      csvData = 'Request ID,Mteja,Simu ya Mteja,Simu Iliyotumwa,Bei (TSh),Hali,Mhudumu,Matokeo ya NIDA,Tarehe\n' +
        requests.map(r => `"${r.id}","${r.customerName}","${r.customerPhone}","${r.targetPhoneNumber}",${r.chargedPriceTzs},"${r.status}","${r.claimedByWorkerName || '-'}","${r.nidaResult || '-'}","${r.createdAt}"`).join('\n');
    } else if (reportType === 'audit') {
      const logs = await db.getAuditLogs(1000);
      csvData = 'Tarehe,Mtendaji,Wadhifa,Kitendo,Lengo,Maelezo\n' +
        logs.map(l => `"${l.timestamp}","${l.actorName}","${l.actorRole}","${l.action}","${l.target}","${l.details.replace(/"/g, '""')}"`).join('\n');
    } else {
      const users = await db.getUsers();
      csvData = 'User ID,Jina Kamili,Namba ya Simu,Wadhifa,Hali,Tarehe ya Kujiunga,Mwisho Kuingia\n' +
        users.map(u => `"${u.id}","${u.fullName}","${u.phone}","${u.role}","${u.status}","${u.createdAt}","${u.lastLoginAt || '-'}"`).join('\n');
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csvData); // UTF-8 BOM for Excel compatibility
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya kupakua ripoti.' });
  }
});

export default router;
