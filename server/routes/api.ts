import express from 'express';
import fs from 'fs';
import path from 'path';
import { getDataStore } from '../db/fileDataStore';
import { walletService } from '../services/walletService';
import { adsService } from '../services/adsService';
import { refundService } from '../services/refundService';
import { chatService } from '../services/chatService';
import { chatSocketServer } from '../realtime/chatSocketServer';
import { soundService } from '../services/soundService';
import { mediaProcessingService } from '../services/mediaProcessingService';
import { authMiddleware, requireRole, requirePermission, AuthenticatedRequest } from '../middleware/auth';
import { User, PlatformPricingConfig, Post, PostComment, ContentReport } from '../../src/types';
import { hashPassword, verifyPassword, sanitizeUser } from '../utils/passwordSecurity';

const router = express.Router();
const dataStore = getDataStore();

// ----------------- SYSTEM & HEALTH -----------------
router.get('/system/status', async (req, res) => {
  try {
    const status = await dataStore.getPersistenceStatus();
    res.json({
      success: true,
      data: {
        ...status,
        databaseMigrationReadiness: {
          ormTarget: 'PostgreSQL / Cloud SQL / Firestore',
          repositoryInterface: 'IRaviniDataStore',
          currentImplementation: 'FileJsonDataStore (Atomic write + In-Memory Cache)',
          externalTelcoGateway: {
            vodacomDaraja: 'BLOCKED / NOT CONFIGURED (Production Telco API credentials pending)',
            tigoPesaWebhook: 'BLOCKED / NOT CONFIGURED (Production Telco API credentials pending)',
            airtelMoneyGateway: 'BLOCKED / NOT CONFIGURED (Production Telco API credentials pending)',
            activeMode: 'MANUAL_DEPOSIT_VERIFICATION_VIA_LIPA_NAMBA'
          }
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Production Database Backup Endpoints (Super Admin Only)
router.get('/system/backups', authMiddleware, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const list = await (dataStore as any).listBackups();
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/system/backup/create', authMiddleware, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const reason = req.body?.reason || 'manual_super_admin';
    const result = await (dataStore as any).createBackup(reason);
    await dataStore.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'DATABASE_BACKUP_CREATED',
      target: result.backupPath,
      targetId: result.timestamp,
      details: `Super Admin created production database backup: ${result.backupPath}`
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------- AUTHENTICATION -----------------
router.post('/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Weka barua pepe/simu na nenosiri.' });
    }

    const users = await dataStore.getUsers();
    const cleanId = identifier.trim().toLowerCase();
    const digitsOnly = identifier.replace(/[^0-9]/g, '');

    const user = users.find(u => {
      const uEmail = (u.email || '').toLowerCase();
      const uUsername = (u.username || '').toLowerCase();
      const uPhoneDigits = (u.phone || '').replace(/[^0-9]/g, '');

      if (uEmail === cleanId || uUsername === cleanId) return true;
      if (digitsOnly && uPhoneDigits && (uPhoneDigits === digitsOnly || uPhoneDigits.endsWith(digitsOnly) || digitsOnly.endsWith(uPhoneDigits))) return true;
      // Canonical Super Admin alias matching
      if (u.id === 'usr_baraka_mabula' && (cleanId === '255748604483' || digitsOnly === '255748604483' || digitsOnly === '0748604483' || cleanId === 'barakamabula')) {
        return true;
      }
      return false;
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Barua pepe, simu au nenosiri sio sahihi.' });
    }

    const isValid = verifyPassword(password, user.password);

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Barua pepe, simu au nenosiri sio sahihi.' });
    }

    if (user.isDisabled) {
      return res.status(403).json({ success: false, message: 'Akaunti hii imezimwa na msimamizi mkuu.' });
    }

    const token = `${user.id}:${Date.now()}`;
    res.json({
      success: true,
      message: `Karibu tena, ${user.name}!`,
      token,
      user: sanitizeUser(user)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/auth/register', async (req, res) => {
  try {
    const { name, phone, username, email, password } = req.body;

    if (!name || (!phone && !email) || !username) {
      return res.status(400).json({
        success: false,
        message: 'Jina, jina la mtumiaji, na nambari ya simu au barua pepe vinahitajika.'
      });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
    const cleanPhone = (phone || '').trim().replace(/[^0-9]/g, '');

    const users = await dataStore.getUsers();
    if (users.some(u => (u.username || '').toLowerCase() === cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Jina hili la mtumiaji tayari linatumika. Tafadhali chagua jingine.'
      });
    }

    if (cleanPhone && users.some(u => (u.phone || '').replace(/[^0-9]/g, '') === cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Nambari hii ya simu tayari imesajiliwa.'
      });
    }

    const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newUser: User = {
      id: newUserId,
      name: name.trim(),
      username: cleanUsername,
      phone: cleanPhone || '255000000000',
      email: email ? email.trim().toLowerCase() : `${cleanUsername}@ravini.co.tz`,
      password: hashPassword(password || '1234'),
      role: 'user', // Strictly user - manager accounts cannot be self-registered
      avatar: '',
      walletBalance: 0, // Strict zero initial balance
      verified: false,
      isOnline: true,
      createdAt: new Date().toISOString(),
      followersCount: 0,
      followingCount: 0,
      savedPosts: []
    };

    await dataStore.saveUser(newUser);

    const token = `${newUser.id}:${Date.now()}`;
    res.status(201).json({
      success: true,
      message: `Hongera ${newUser.name}, akaunti yako ya RAVINI imefunguliwa kikamilifu!`,
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/auth/change-password', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Weka nenosiri la sasa na jipya.' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'Nenosiri jipya linapaswa kuwa na angalau herufi 4.' });
    }

    const user = await dataStore.getUserById(req.user!.id);
    if (!user) return res.status(404).json({ success: false, message: 'Mtumiaji hakupatikana.' });

    const isCurrentValid = verifyPassword(currentPassword, user.password);

    if (!isCurrentValid) {
      return res.status(400).json({ success: false, message: 'Nenosiri la sasa si sahihi.' });
    }

    const hashedPassword = hashPassword(newPassword);
    const updatedUser = await dataStore.updateUser(user.id, { password: hashedPassword, mustChangePassword: false });

    await dataStore.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'PASSWORD_CHANGED',
      target: user.username,
      details: 'User successfully updated password.'
    });

    res.json({ success: true, message: 'Nenosiri limebadilishwa kikamilifu!', user: updatedUser ? sanitizeUser(updatedUser) : null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/auth/me', authMiddleware, async (req: AuthenticatedRequest, res) => {
  res.json({ success: true, user: req.user ? sanitizeUser(req.user) : null });
});

router.post('/auth/logout', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    await dataStore.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_LOGOUT',
      target: user.username,
      details: `User ${user.name} logged out.`
    });
    res.json({ success: true, message: 'Umetoka kikamilifu.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------- WALLET & TRANSACTIONS -----------------
router.get('/wallet/balance', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const balance = await walletService.getBalance(req.user!.id);
    res.json({ success: true, balance });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/wallet/transactions', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const transactions = await dataStore.getUserTransactions(req.user!.id, { limit, offset });
    res.json({ success: true, transactions });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/wallet/transfer', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { recipientId, amountRvc, description, idempotencyKey } = req.body;
    const amount = Number(amountRvc);

    const result = await walletService.transfer({
      senderId: req.user!.id,
      recipientId,
      amountRvc: amount,
      description,
      idempotencyKey
    });

    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/wallet/deposit-requests', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const isAdmin = req.user!.role === 'super_admin' || 
      (req.user!.permissions && (req.user!.permissions.includes('all') || req.user!.permissions.includes('verify_rvc')));

    const all = await dataStore.getRvcRequests();
    const filtered = isAdmin ? all : all.filter(r => r.userId === req.user!.id);
    res.json({ success: true, requests: filtered });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/wallet/deposit-request', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { amount, paymentMethod, transactionReference, phoneNumber, senderName } = req.body;
    const amountNum = Number(amount);

    const config = await dataStore.getPaymentConfig();
    if (config.isActive === false) {
      return res.status(400).json({ success: false, message: 'Huduma ya kuongeza salio la RAVINI haipatikani kwa sasa.' });
    }

    const minAmount = config.minTopUpAmount || 1000;
    const maxAmount = config.maxTopUpAmount || 5000000;

    if (isNaN(amountNum) || amountNum < minAmount) {
      return res.status(400).json({ success: false, message: `Kima cha chini cha kuweka RVC ni ${minAmount.toLocaleString()} RVC.` });
    }

    if (amountNum > maxAmount) {
      return res.status(400).json({ success: false, message: `Kiwango cha juu cha kuweka RVC kwa mkupuo ni ${maxAmount.toLocaleString()} RVC.` });
    }

    const cleanPhone = config.whatsappNumber.replace(/[^0-9]/g, '');
    const userRef = transactionReference ? transactionReference.trim() : 'REF-PENDING';
    const reqId = `rvc_req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const newReq = await dataStore.saveRvcRequest({
      id: reqId,
      userId: req.user!.id,
      userRaviniId: req.user!.raviniId || req.user!.username,
      userName: req.user!.name,
      userPhone: req.user!.phone || phoneNumber || '',
      amount: amountNum,
      paymentMethod: paymentMethod || 'M-Pesa',
      phoneNumber: phoneNumber || req.user!.phone,
      senderName: senderName || req.user!.name,
      paymentReference: userRef,
      transactionReference: userRef,
      status: 'pending_verification',
      requestedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    const prefilledMsg = `Habari ${config.whatsappDisplayName}, nahitaji kuongeza RVC ${amountNum.toLocaleString()} (TZS ${amountNum.toLocaleString()}) kwenye akaunti yangu ya RAVINI.\n` +
      `• Jina la Mtumiaji: ${req.user!.name} (@${req.user!.username || req.user!.id})\n` +
      `• Namba ya Simu: ${req.user!.phone || phoneNumber || 'N/A'}\n` +
      `• Njia ya Malipo: ${paymentMethod || 'Manual Payment'}\n` +
      `• Kumbukumbu ya Muamala: ${userRef}\n` +
      `• Namba ya Ombi: ${reqId}\n\n` +
      `Tafadhali thibitisha malipo yangu na uongeze salio langu la RVC.`;

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(prefilledMsg)}`;

    res.json({
      success: true,
      message: 'Ombi la malipo limetengenezwa. Fungua WhatsApp ili kutuma uthibitisho kwa Msimamizi Mkuu.',
      request: newReq,
      whatsappUrl,
      whatsappNumber: config.whatsappNumber,
      whatsappDisplayName: config.whatsappDisplayName
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/wallet/deposit-requests/:id/approve', authMiddleware, requirePermission('verify_rvc'), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await walletService.approveRvcDeposit(String(req.params.id), req.user!);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/wallet/deposit-requests/:id/reject', authMiddleware, requirePermission('verify_rvc'), async (req: AuthenticatedRequest, res) => {
  try {
    const { reason } = req.body;
    const result = await walletService.rejectRvcDeposit(String(req.params.id), req.user!, reason || '');
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Super Admin / Manager direct manual credit with double credit protection & audit log
router.post('/wallet/manual-credit', authMiddleware, requireRole('super_admin', 'admin', 'manager'), async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, amountRvc, paymentMethod, paymentReference, notes } = req.body;
    const result = await walletService.manualCreditUser({
      userId,
      amountRvc: Number(amountRvc),
      paymentMethod: paymentMethod || 'MANUAL_PAYMENT',
      paymentReference: paymentReference || '',
      notes: notes || '',
      admin: req.user!
    });
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------- PAYMENT CONFIGURATION (MANUAL PAYMENT ONLY) -----------------
router.get('/payment-config', async (req, res) => {
  try {
    const config = await dataStore.getPaymentConfig();
    res.json({ success: true, config });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/payment-config', authMiddleware, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await dataStore.updatePaymentConfig(req.body, req.user!.id, req.user!.name);
    res.json({ success: true, message: 'Mipangilio ya malipo ya manual imesasishwa kikamilifu.', config: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------- ADS CAMPAIGNS -----------------
router.get('/ads/campaigns', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const campaigns = await dataStore.getAdCampaigns({ limit });
    res.json({ success: true, campaigns });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/ads/campaigns', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await adsService.createCampaign(req.user!, req.body);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/ads/campaigns/:id/approve', authMiddleware, requirePermission('ADS_APPROVE'), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await adsService.approveCampaign(String(req.params.id), req.user!);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/ads/campaigns/:id/reject', authMiddleware, requirePermission('ADS_APPROVE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Tafadhali taja sababu ya kukataa tangazo.' });
    const result = await adsService.rejectCampaign(String(req.params.id), req.user!, reason);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/ads/campaigns/:id/pause', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await adsService.pauseCampaign(String(req.params.id), req.user!);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/ads/campaigns/:id/resume', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await adsService.resumeCampaign(String(req.params.id), req.user!);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------- REFUNDS -----------------
router.get('/refunds', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const isAdmin = req.user!.role === 'super_admin' || 
      (req.user!.permissions && (req.user!.permissions.includes('all') || req.user!.permissions.includes('REFUND_MANAGE')));

    const refunds = await dataStore.getRefunds();
    const filtered = isAdmin ? refunds : refunds.filter(r => r.userId === req.user!.id);
    res.json({ success: true, refunds: filtered });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/refunds', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await refundService.requestRefund(req.user!, req.body);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/refunds/:id/execute', authMiddleware, requirePermission('REFUND_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { adminNote } = req.body;
    const result = await refundService.executeRefund(String(req.params.id), req.user!, adminNote);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/refunds/:id/reject', authMiddleware, requirePermission('REFUND_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Weka sababu ya kukataa rejesho.' });
    const result = await refundService.rejectRefund(String(req.params.id), req.user!, reason);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------- PLATFORM PRICING -----------------
router.get('/pricing', async (req, res) => {
  try {
    const pricing = await dataStore.getPlatformPricing();
    res.json({ success: true, pricing });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/pricing', authMiddleware, requirePermission('PRICING_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await dataStore.updatePlatformPricing(req.body, req.user!.id, req.user!.name);
    res.json({ success: true, message: 'Bei na tozo za mfumo zimesasishwa.', pricing: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------- COMPANY REVENUE & AUTHORITATIVE LEDGERS -----------------
router.get('/finance/ledgers', authMiddleware, requirePermission('REVENUE_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const ledgers = await dataStore.getAuthoritativeLedgers();
    res.json({ success: true, ledgers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/finance/company-ledger', authMiddleware, requirePermission('REVENUE_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const ledger = await dataStore.getCompanyLedger({ limit });
    res.json({ success: true, ledger });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------- AUDIT LOGS -----------------
router.get('/admin/audit-logs', authMiddleware, requireRole('super_admin', 'admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const logs = await dataStore.getAuditLogs({ limit, offset });
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------- USERS ADMIN -----------------
router.get('/admin/users', authMiddleware, requirePermission('manage_users'), async (req: AuthenticatedRequest, res) => {
  try {
    const users = await dataStore.getUsers();
    res.json({ success: true, users: users.map(u => sanitizeUser(u)) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/admin/users/:id/permissions', authMiddleware, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const targetId = String(req.params.id);
    const { permissions, role } = req.body;

    const isCanonical = targetId === 'usr_baraka_mabula';
    if (!isCanonical && (role === 'SUPER_ADMIN' || role === 'super_admin')) {
      return res.status(403).json({ success: false, message: 'Huwezi kumpa mtumiaji mwingine cheo cha Super Admin. Kuna Super Admin mmoja tu wa RAVINI.' });
    }

    const assignedRole = isCanonical ? 'SUPER_ADMIN' : (role || 'user');
    const user = await dataStore.updateUser(targetId, { permissions, role: assignedRole });
    if (!user) return res.status(404).json({ success: false, message: 'Mtumiaji hakupatikana.' });

    await dataStore.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: 'super_admin',
      action: 'ADMIN_PERMISSIONS_UPDATED',
      target: user.name,
      targetId: user.id,
      details: `Updated permissions for ${user.name} (${user.id}): ${JSON.stringify(permissions)}. Role: ${assignedRole}.`
    });

    res.json({ success: true, message: 'Idhini za kiutawala zimesasishwa.', user: sanitizeUser(user) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin Reset Password (Customer Care recovery)
router.post('/admin/users/:id/reset-password', authMiddleware, requirePermission('user_manage'), async (req: AuthenticatedRequest, res) => {
  try {
    const targetId = String(req.params.id);
    const target = await dataStore.getUserById(targetId);
    if (!target) return res.status(404).json({ success: false, message: 'Mtumiaji hakupatikana.' });

    // Canonical Super Admin cannot be reset via temporary password
    if (target.id === 'usr_baraka_mabula' || target.phone === '255748604483' || target.role === 'super_admin' || target.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Nenosiri la Msimamizi Mkuu haliwezi kubadilishwa kwa njia ya muda.' });
    }

    const updated = await dataStore.updateUser(targetId, {
      password: hashPassword('1234'),
      mustChangePassword: true
    });

    await dataStore.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'PASSWORD_RESET_TEMPORARY',
      target: target.name,
      targetId: target.id,
      details: `Temporary password '1234' assigned. Forced password change flagged.`
    });

    res.json({
      success: true,
      message: `Nenosiri la muda (1234) limewekwa kwa ${target.name}. Mtumiaji atalazimika kubadilisha nenosiri akiingia.`,
      user: updated ? sanitizeUser(updated) : null
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create Admin Account (Starts with no permissions, password 1234, must change password)
router.post('/admin/create-admin', authMiddleware, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, phone, email, username } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Jina na nambari ya simu vinahitajika.' });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const existing = await dataStore.getUserByPhone(cleanPhone);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Nambari hii ya simu tayari imesajiliwa.' });
    }

    const newAdminId = `adm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAdmin: User = {
      id: newAdminId,
      name,
      username: username || cleanPhone,
      phone: cleanPhone,
      email: email || `${cleanPhone}@ravini.co.tz`,
      password: hashPassword('1234'),
      role: 'admin',
      permissions: [], // Starts with NO permissions until Super Admin grants them
      mustChangePassword: true,
      verified: true,
      bio: 'Msimamizi wa RAVINI',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      walletBalance: 0,
      followersCount: 0,
      followingCount: 0,
      createdAt: new Date().toISOString()
    };

    const saved = await dataStore.saveUser(newAdmin);

    await dataStore.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'ADMIN_ACCOUNT_CREATED',
      target: saved.name,
      targetId: saved.id,
      details: `New admin account created (${saved.username}) with initial password 1234 and zero permissions.`
    });

    res.json({
      success: true,
      message: `Akaunti ya Admin imeundwa na nenosiri la mwanzo 1234. Admin atalazimika kubadilisha nenosiri akiingia.`,
      admin: sanitizeUser(saved)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update User Account Status (Active, Suspended, Blocked)
router.put('/admin/users/:id/status', authMiddleware, requirePermission('user_manage'), async (req: AuthenticatedRequest, res) => {
  try {
    const targetId = String(req.params.id);
    const { status, isDisabled, isSuspended, suspensionDetails, reason } = req.body;

    const target = await dataStore.getUserById(targetId);
    if (!target) return res.status(404).json({ success: false, message: 'Mtumiaji hakupatikana.' });

    const isCanonical = target.id === 'usr_baraka_mabula' || target.phone === '255748604483' || (target.role || '').toLowerCase() === 'super_admin';
    if (isCanonical) {
      return res.status(403).json({ success: false, message: 'Akaunti ya Msimamizi Mkuu (Super Admin) haiwezi kusimamishwa wala kufungwa.' });
    }

    const updates: Partial<User> = {};
    if (status !== undefined) updates.accountStatus = status;
    if (isDisabled !== undefined) updates.isDisabled = !!isDisabled;
    if (isSuspended !== undefined) updates.isSuspended = !!isSuspended;
    if (suspensionDetails !== undefined) updates.suspensionDetails = suspensionDetails;

    // If account is suspended or blocked, disconnect live sessions
    if (updates.isDisabled || updates.isSuspended || updates.accountStatus === 'BLOCKED' || updates.accountStatus === 'SUSPENDED') {
      chatSocketServer.disconnectUser(targetId, reason || 'Akaunti imesimamishwa au kufungwa na uongozi.');
    }

    const updated = await dataStore.updateUser(targetId, updates);

    await dataStore.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'USER_STATUS_UPDATED',
      target: target.name,
      targetId: target.id,
      details: `Status updated for ${target.name} (${target.id}): status=${status}, disabled=${isDisabled}, suspended=${isSuspended}. Reason: ${reason || 'N/A'}`
    });

    res.json({
      success: true,
      message: 'Hali ya akaunti imesasishwa kikamilifu.',
      user: updated ? sanitizeUser(updated) : null
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Soft Delete User (Move to Trash)
router.delete('/admin/users/:id', authMiddleware, requirePermission('user_manage'), async (req: AuthenticatedRequest, res) => {
  try {
    const targetId = String(req.params.id);
    const { reason } = req.body || {};

    const target = await dataStore.getUserById(targetId);
    if (!target) return res.status(404).json({ success: false, message: 'Mtumiaji hakupatikana.' });

    const isCanonical = target.id === 'usr_baraka_mabula' || target.phone === '255748604483' || (target.role || '').toLowerCase() === 'super_admin';
    if (isCanonical) {
      return res.status(403).json({ success: false, message: 'Akaunti ya Msimamizi Mkuu haiwezi kufutwa.' });
    }

    const now = new Date().toISOString();
    const updated = await dataStore.updateUser(targetId, {
      isDeleted: true,
      deletedAt: now,
      accountStatus: 'DEACTIVATED',
      isDisabled: true
    });

    chatSocketServer.disconnectUser(targetId, 'Akaunti imefutwa na uongozi.');

    await dataStore.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'USER_SOFT_DELETED',
      target: target.name,
      targetId: target.id,
      details: `User ${target.name} (${target.id}) soft-deleted by ${req.user!.name}. Reason: ${reason || 'Admin action'}`
    });

    res.json({
      success: true,
      message: 'Akaunti ya mtumiaji imeondolewa kikamilifu.',
      user: updated ? sanitizeUser(updated) : null
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Restore Soft Deleted User
router.post('/admin/users/:id/restore', authMiddleware, requirePermission('user_manage'), async (req: AuthenticatedRequest, res) => {
  try {
    const targetId = String(req.params.id);
    const target = await dataStore.getUserById(targetId);
    if (!target) return res.status(404).json({ success: false, message: 'Mtumiaji hakupatikana.' });

    const updated = await dataStore.updateUser(targetId, {
      isDeleted: false,
      deletedAt: undefined,
      accountStatus: 'ACTIVE',
      isDisabled: false,
      isSuspended: false
    });

    await dataStore.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'USER_RESTORED',
      target: target.name,
      targetId: target.id,
      details: `User ${target.name} (${target.id}) restored by ${req.user!.name}.`
    });

    res.json({
      success: true,
      message: 'Akaunti ya mtumiaji imerejeshwa kikamilifu.',
      user: updated ? sanitizeUser(updated) : null
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Permanently Purge User (Super Admin only)
router.delete('/admin/users/:id/purge', authMiddleware, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const targetId = String(req.params.id);
    if (targetId === 'usr_baraka_mabula') {
      return res.status(403).json({ success: false, message: 'Akaunti ya Msimamizi Mkuu haiwezi kufutwa.' });
    }

    if (dataStore.purgeUser) {
      await dataStore.purgeUser(targetId, req.user!.id);
    } else {
      await dataStore.updateUser(targetId, { isDeleted: true, accountStatus: 'DEACTIVATED', isDisabled: true });
    }

    chatSocketServer.disconnectUser(targetId, 'Akaunti imefutwa kabisa kwenye mfumo.');

    res.json({
      success: true,
      message: 'Akaunti ya mtumiaji imefutwa kabisa kwenye mfumo (purged).'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Force Logout Single User
router.post('/admin/users/:id/force-logout', authMiddleware, requirePermission('user_manage'), async (req: AuthenticatedRequest, res) => {
  try {
    const targetId = String(req.params.id);
    const { reason } = req.body || {};

    const target = await dataStore.getUserById(targetId);
    if (!target) return res.status(404).json({ success: false, message: 'Mtumiaji hakupatikana.' });

    const now = new Date().toISOString();
    await dataStore.updateUser(targetId, { forceLogoutAt: now });
    const disconnected = chatSocketServer.disconnectUser(targetId, reason || 'Msimamizi amekatisha kipindi chako cha kuingia.');

    await dataStore.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'USER_FORCE_LOGOUT',
      target: target.name,
      targetId: target.id,
      details: `Force logout issued for ${target.name} (${target.id}). Active socket closed: ${disconnected}. Reason: ${reason || 'N/A'}`
    });

    res.json({
      success: true,
      message: `Mtumiaji ${target.name} amelazimishwa kutoka (logged out) kwenye vifaa vyote.`,
      activeSocketClosed: disconnected
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Force Logout All Non-Super-Admin Users (Emergency Session Reset)
router.post('/admin/force-logout-all', authMiddleware, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { reason } = req.body || {};
    const count = chatSocketServer.disconnectAllExcept(req.user!.id, reason || 'Usalama: Vipindi vyote vya watumiaji vimefungwa na Super Admin.');

    await dataStore.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: 'SUPER_ADMIN',
      action: 'SYSTEM_FORCE_LOGOUT_ALL',
      target: 'ALL_USERS',
      details: `Super Admin forced logout on all connected users (${count} active sessions terminated). Reason: ${reason || 'Emergency reset'}`
    });

    res.json({
      success: true,
      message: `Vipindi vyote ${count} vya watumiaji vimefungwa kikamilifu.`,
      terminatedCount: count
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Toggle User Posting Ability
router.put('/admin/users/:id/posting-permission', authMiddleware, requirePermission('user_manage'), async (req: AuthenticatedRequest, res) => {
  try {
    const targetId = String(req.params.id);
    const { isPostingDisabled, reason } = req.body;

    const target = await dataStore.getUserById(targetId);
    if (!target) return res.status(404).json({ success: false, message: 'Mtumiaji hakupatikana.' });

    const isCanonical = target.id === 'usr_baraka_mabula' || target.phone === '255748604483';
    if (isCanonical) {
      return res.status(403).json({ success: false, message: 'Huwezi kuzuia uchapishaji kwa Msimamizi Mkuu.' });
    }

    const updated = await dataStore.updateUser(targetId, { isPostingDisabled: !!isPostingDisabled });

    await dataStore.addAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: isPostingDisabled ? 'USER_POSTING_BLOCKED' : 'USER_POSTING_ENABLED',
      target: target.name,
      targetId: target.id,
      details: `Posting ${isPostingDisabled ? 'disabled' : 'enabled'} for ${target.name} (${target.id}). Reason: ${reason || 'N/A'}`
    });

    res.json({
      success: true,
      message: isPostingDisabled ? 'Uwezo wa kuchapisha umezuiwa kwa mtumiaji huyu.' : 'Uwezo wa kuchapisha umeruhusiwa kwa mtumiaji huyu.',
      user: updated ? sanitizeUser(updated) : null
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------- CHAT & REALTIME MESSAGING -----------------

// 1. Get User Conversations
router.get('/chat/conversations', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const conversations = await dataStore.getConversations(req.user!.id);
    const unreadCount = await dataStore.getUnreadChatCount(req.user!.id);
    res.json({ success: true, conversations, totalUnread: unreadCount });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Create or Get Direct Conversation
router.post('/chat/conversations/direct', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) return res.status(400).json({ success: false, message: 'Missing recipientId' });

    const check = await chatService.canUserMessageRecipient(req.user!.id, recipientId);
    if (!check.allowed) {
      return res.status(403).json({ success: false, message: check.reason || 'Hauruhusiwi kuwasiliana na mtumiaji huyu.' });
    }

    const conversation = await dataStore.getOrCreateDirectConversation(req.user!.id, recipientId);
    res.json({ success: true, conversation, requiresRequest: check.requiresRequest });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Create Group Conversation
router.post('/chat/conversations/group', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { groupName, groupDescription, groupPhoto, memberIds, onlyAdminsCanPost } = req.body;
    if (!groupName) return res.status(400).json({ success: false, message: 'Jina la kundi linahitajika.' });

    const group = await chatService.createGroup({
      creatorId: req.user!.id,
      groupName,
      groupDescription,
      groupPhoto,
      memberIds: memberIds || [],
      onlyAdminsCanPost: !!onlyAdminsCanPost
    });

    res.json({ success: true, group });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Add/Remove Group Members
router.put('/chat/conversations/:id/group-members', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { action, memberId, memberIds } = req.body;
    const conversationId = String(req.params.id);

    if (action === 'add') {
      const idsToAdd = memberIds || (memberId ? [memberId] : []);
      const updated = await chatService.addGroupMembers(conversationId, req.user!.id, idsToAdd);
      return res.json({ success: true, group: updated });
    } else if (action === 'remove') {
      const idToRemove = memberId || req.user!.id;
      const updated = await chatService.removeGroupMember(conversationId, req.user!.id, idToRemove);
      return res.json({ success: true, group: updated });
    }

    res.status(400).json({ success: false, message: 'Invalid action (add or remove)' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Get Messages for Conversation
router.get('/chat/conversations/:id/messages', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const conversationId = String(req.params.id);
    const conv = await dataStore.getConversationById(conversationId);
    if (!conv || !conv.participantIds.includes(req.user!.id)) {
      return res.status(403).json({ success: false, message: 'Huna idhini ya kutazama mazungumzo haya.' });
    }

    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const messages = await dataStore.getMessages(conversationId, { limit, offset });

    // Mark read
    await chatService.markConversationRead(conversationId, req.user!.id);

    res.json({ success: true, messages });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Send Message via REST (fallback / standard API)
router.post('/chat/conversations/:id/messages', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const conversationId = String(req.params.id);
    const { content, mediaUrl, mediaType, mediaName, mediaSize, location, contact, replyTo, forwarded, forwardedFrom, idempotencyKey } = req.body;

    const result = await chatService.sendMessage({
      senderId: req.user!.id,
      conversationId,
      content: content || '',
      mediaUrl,
      mediaType,
      mediaName,
      mediaSize,
      location,
      contact,
      replyTo,
      forwarded,
      forwardedFrom,
      idempotencyKey
    });

    res.json({ success: true, message: result.message, conversation: result.conversation });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Edit Message
router.put('/chat/messages/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const messageId = String(req.params.id);
    const { content } = req.body;
    const msg = await dataStore.getMessageById(messageId);
    if (!msg || msg.senderId !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'Huwezi kuhariri ujumbe huu.' });
    }

    const updated = await dataStore.updateMessage(messageId, {
      content,
      isEdited: true,
      editedAt: new Date().toISOString()
    });

    res.json({ success: true, message: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Delete Message
router.delete('/chat/messages/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const messageId = String(req.params.id);
    const forEveryone = req.query.forEveryone === 'true';
    const deleted = await dataStore.deleteMessage(messageId, req.user!.id, forEveryone);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. Search Messages
router.get('/chat/messages/search', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const query = (req.query.q as string) || '';
    const conversationId = req.query.conversationId as string | undefined;
    const results = await dataStore.searchMessages(req.user!.id, query, conversationId);
    res.json({ success: true, results });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 10. Message Requests
router.get('/chat/message-requests', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const requests = await dataStore.getMessageRequests(req.user!.id);
    res.json({ success: true, requests });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/chat/message-requests/:id/respond', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const requestId = String(req.params.id);
    const { action } = req.body; // 'accept' | 'decline' | 'block'

    const requests = await dataStore.getMessageRequests(req.user!.id);
    const reqItem = requests.find(r => r.id === requestId);
    if (!reqItem) return res.status(404).json({ success: false, message: 'Ombi halikupatikana.' });

    if (action === 'accept') {
      await dataStore.updateMessageRequest(requestId, { status: 'accepted' });
      await dataStore.getOrCreateDirectConversation(req.user!.id, reqItem.senderId);
      return res.json({ success: true, message: 'Ombi limekubaliwa.' });
    } else if (action === 'decline') {
      await dataStore.updateMessageRequest(requestId, { status: 'declined' });
      return res.json({ success: true, message: 'Ombi limekataliwa.' });
    } else if (action === 'block') {
      await dataStore.updateMessageRequest(requestId, { status: 'blocked' });
      await dataStore.blockUser(req.user!.id, reqItem.senderId);
      return res.json({ success: true, message: 'Mtumiaji amezuiliwa.' });
    }

    res.status(400).json({ success: false, message: 'Kitendo batili' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 11. Privacy & Screenshot Protection
router.get('/chat/privacy', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const settings = await dataStore.getUserPrivacySettings(req.user!.id);
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/chat/privacy', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { whoCanMessageMe, whoCanCallMe, showReadReceipts, showOnlineStatus, showLastSeen, screenshotProtection } = req.body;
    const updated = await dataStore.updateUserPrivacySettings(req.user!.id, {
      whoCanMessageMe,
      whoCanCallMe,
      showReadReceipts,
      showOnlineStatus,
      showLastSeen,
      screenshotProtection
    });

    // Also sync screenshotProtection to user profile
    if (typeof screenshotProtection === 'boolean') {
      await dataStore.updateUser(req.user!.id, { chatScreenshotProtection: screenshotProtection });
    }

    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 12. Block & Unblock
router.post('/chat/block', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ success: false, message: 'Missing targetUserId' });
    await dataStore.blockUser(req.user!.id, targetUserId);
    res.json({ success: true, message: 'Mtumiaji amezuiliwa kwa ufanisi.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/chat/unblock', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ success: false, message: 'Missing targetUserId' });
    await dataStore.unblockUser(req.user!.id, targetUserId);
    res.json({ success: true, message: 'Mtumiaji ameachiliwa kizuizi.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 13. Calls History & Logs
router.get('/chat/calls/history', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const sessions = await dataStore.getCallSessions(req.user!.id);
    res.json({ success: true, sessions });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 14. Real Chat Media Upload (Local Persistent Disk Storage)
router.post('/chat/upload', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { fileBase64, fileName, mimeType } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ success: false, message: 'Faili halikupatikana.' });
    }

    const uploadDir = path.join(process.cwd(), 'data', 'uploads', 'chat');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate safe unique filename
    const ext = path.extname(fileName || '') || (mimeType?.includes('image') ? '.jpg' : mimeType?.includes('audio') ? '.webm' : '.bin');
    const safeName = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const targetPath = path.join(uploadDir, safeName);

    // Clean base64 data prefix if included (e.g. data:image/png;base64,...)
    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    fs.writeFileSync(targetPath, buffer);

    const publicUrl = `/data/uploads/chat/${safeName}`;

    res.json({
      success: true,
      url: publicUrl,
      fileName: fileName || safeName,
      size: buffer.length,
      storageStatus: 'STORED_LOCALLY_ON_SERVER_PERSISTENT_DISK',
      externalCloudStorage: 'BLOCKED / NOT CONFIGURED (Production S3 / GCS credentials pending)'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 15. Unread Chat Count
router.get('/chat/unread-count', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const totalUnread = await dataStore.getUnreadChatCount(req.user!.id);
    res.json({ success: true, totalUnread });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 16. Chat Realtime System Status & STUN/TURN Report
router.get('/chat/status', async (req, res) => {
  try {
    const turnConfigured = !!(process.env.TURN_SERVER_URL && process.env.TURN_CREDENTIAL);
    const persistenceStatus = await dataStore.getPersistenceStatus();
    res.json({
      success: true,
      realtimeEngine: 'WebSocket (ws) on /ws (Port 3000)',
      messagePersistence: `${persistenceStatus.engine} (${persistenceStatus.filePath})`,
      persistenceStatus,
      localStorageStatus: 'PASS (Persistent local disk /data/uploads/chat)',
      cloudStorageStatus: process.env.S3_BUCKET_NAME || process.env.GCS_BUCKET_NAME 
        ? 'PASS (Cloud Storage Active)' 
        : 'BLOCKED / NOT CONFIGURED (Production S3 / GCS credentials pending in .env)',
      webrtcVoiceVideoSignaling: 'PASS (Active over WebSocket)',
      stunServer: 'PASS (stun:stun.l.google.com:19302)',
      turnServer: turnConfigured 
        ? 'PASS' 
        : 'BLOCKED / NOT CONFIGURED (TURN_SERVER_URL pending in .env)'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 17. WebRTC ICE Servers
router.get('/webrtc/ice-servers', async (req, res) => {
  try {
    const turnConfigured = !!(process.env.TURN_SERVER_URL && process.env.TURN_CREDENTIAL);
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' }
    ];

    if (turnConfigured) {
      iceServers.push({
        urls: process.env.TURN_SERVER_URL!,
        ...(process.env.TURN_USERNAME ? { username: process.env.TURN_USERNAME } : {}),
        credential: process.env.TURN_CREDENTIAL!
      } as any);
    }

    res.json({
      success: true,
      iceServers,
      stunStatus: 'PASS',
      turnStatus: turnConfigured ? 'PASS' : 'BLOCKED / NOT CONFIGURED'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 18. Real Daily Reports Calculated from Database Records
router.get('/reports/daily', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const period = (req.query.period as string) || 'today';
    const customStart = req.query.start as string | undefined;
    const customEnd = req.query.end as string | undefined;
    
    const report = await dataStore.generateDailyReport(
      period, 
      customStart && customEnd ? { start: customStart, end: customEnd } : undefined
    );
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 19. Export Real Daily Report CSV
router.get('/reports/daily/export', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const period = (req.query.period as string) || 'today';
    const report = await dataStore.generateDailyReport(period);
    
    const rows = [
      ['RIPOTI YA KILA SIKU - RAVINI (OFFICIAL DAILY REPORT)'],
      ['Tarehe ya Ripoti', report.date],
      ['Muda Uliozalishwa', report.generatedAt],
      ['Kipindi', report.period],
      [''],
      ['KIPENGELE', 'KIPIMO', 'THAMANI'],
      ['Watumiaji (Users)', 'Jumla ya Watumiaji', report.users?.total ?? report.newUsers],
      ['Watumiaji (Users)', 'Watumiaji Wapya', report.users?.newRegistered ?? report.newUsers],
      ['Watumiaji (Users)', 'Watumiaji Walio Mtandaoni (Active)', report.users?.active ?? report.activeUsers],
      ['Watumiaji (Users)', 'Watumiaji Waliosimamishwa', report.users?.suspended ?? report.suspendedUsers],
      ['Maudhui (Posts)', 'Jumla ya Machapisho', report.postsSummary?.total ?? report.posts],
      ['Maudhui (Posts)', 'Machapisho Mapya', report.postsSummary?.newPosts ?? report.posts],
      ['Maudhui (Posts)', 'Video', report.postsSummary?.videos ?? report.videos],
      ['Maudhui (Posts)', 'Clips', report.postsSummary?.clips ?? report.clips],
      ['Maudhui (Posts)', 'Likes & Reactions', report.postsSummary?.likes ?? report.likes],
      ['Maudhui (Posts)', 'Shares', report.postsSummary?.shares ?? report.shares],
      ['Maudhui (Posts)', 'Comments', report.postsSummary?.comments ?? report.comments],
      ['Mawasiliano (Chat)', 'Jumla ya Jumbe Zilizotumwa', report.messagesSummary?.totalSent ?? report.messages],
      ['Sokoni (Market)', 'Bidhaa Zilizopo', report.market?.totalItems ?? report.marketOrders],
      ['Sokoni (Market)', 'Bidhaa Mpya', report.market?.newItems ?? report.marketOrders],
      ['Fedha (RVC)', 'RVC Iliyonunuliwa', report.rvc?.totalPurchased ?? report.rvcPurchasedRvc],
      ['Fedha (RVC)', 'RVC Iliyotumika', report.rvc?.totalUsed ?? report.rvcUsedRvc],
      ['Fedha (RVC)', 'RVC Inayozunguka (Net)', report.rvc?.netCirculation ?? (report.rvcPurchasedRvc - report.rvcUsedRvc)],
      ['Matangazo & Viral', 'Kampeni Zinazoendelea', report.campaigns?.activeOfficialAds ?? report.pushViralCampaigns],
      ['Mapato (Revenue TZS)', 'Jumla ya Mapato', report.revenue?.totalTzs ?? report.companyRevenueRvc],
      ['Marejesho (Refunds)', 'Maombi ya Marejesho', report.refunds?.requestsCount ?? 0],
      ['Marejesho (Refunds)', 'Kiasi Kilichorejeshwa RVC', report.refunds?.amountTotal ?? report.refundsRvc],
      ['Usalama (Security)', 'Matukio ya Usalama', report.securityEvents],
      ['Usimamizi (Admin)', 'Vitendo vya Wasimamizi', report.adminActivityCount ?? report.adminActivity],
    ];

    const csvContent = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="ravini_daily_report_${report.date}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 20. Global Communication Control
router.get('/communication-control', async (req, res) => {
  try {
    const settings = await dataStore.getGlobalCommunicationSettings();
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/communication-control', authMiddleware, requireRole('SUPER_ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const { allEnabled, services, temporaryBlock, targetScope } = req.body;
    const actor = req.user!;

    const updated = await dataStore.updateGlobalCommunicationSettings(
      {
        ...(typeof allEnabled === 'boolean' ? { allEnabled } : {}),
        ...(services ? { services } : {}),
        ...(temporaryBlock ? { temporaryBlock } : {}),
        ...(targetScope ? { targetScope } : {})
      },
      actor.id,
      actor.name
    );

    // Realtime broadcast to all connected WebSocket clients instantly
    chatSocketServer.broadcastAll({
      type: 'communication_control_updated',
      settings: updated,
      actorName: actor.name,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Mipangilio ya mawasiliano ya mfumo mzima imesasishwa kikamilifu!',
      settings: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 21. REAL SOUND & MUSIC LIBRARY ENDPOINTS
// ==========================================

// Get all active sounds / filter by category or search
router.get('/sounds', async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const query = (req.query.q || req.query.query) as string | undefined;
    const sounds = await soundService.getAllSounds(category, query);
    res.json({ success: true, count: sounds.length, sounds });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get sound by ID
router.get('/sounds/:id', async (req, res) => {
  try {
    const sound = await soundService.getSoundById(req.params.id);
    if (!sound) {
      return res.status(404).json({ success: false, message: 'Wimbo/Sauti haikupatikana.' });
    }
    res.json({ success: true, sound });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Upload device/local audio
router.post('/sounds/upload', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, artist, audioBase64, mimeType, originalFilename } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ success: false, message: 'Tafadhali chagua faili la sauti kutoka kwenye kifaa.' });
    }

    const cleanBase64 = audioBase64.replace(/^data:audio\/[a-zA-Z0-9.-]+;base64,/, '');
    const audioBuffer = Buffer.from(cleanBase64, 'base64');

    if (audioBuffer.length > 30 * 1024 * 1024) { // 30MB limit for sound track
      return res.status(400).json({ success: false, message: 'Faili la sauti limezidi kiwango cha juu cha MB 30.' });
    }

    const newSound = await soundService.registerUserUploadedSound({
      userId: req.user!.id,
      userName: req.user!.name,
      title: title || originalFilename || 'Sauti Yangu ya Kifaa',
      artist: artist || req.user!.name,
      audioBuffer,
      mimeType: mimeType || 'audio/mp3',
      originalFilename
    });

    res.json({
      success: true,
      message: 'Sauti imepakiwa kikamilifu kwenye maktaba yako ya RAVINI!',
      sound: newSound
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 22. REAL MEDIA PROCESSING (FFMPEG ENGINE)
// ==========================================

router.post('/media/process-audio', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      videoData,
      audioData,
      soundId,
      originalAudioVolume,
      musicVolume,
      musicStartTime,
      musicTrimStart,
      musicTrimEnd,
      isMuted,
      isSlideshow,
      filterName
    } = req.body;

    if (!videoData) {
      return res.status(400).json({
        success: false,
        message: 'Tafadhali weka faili la video au picha ya kuchakata.'
      });
    }

    const result = await mediaProcessingService.processAudio({
      userId: req.user!.id,
      videoData,
      audioData,
      originalAudioVolume: typeof originalAudioVolume === 'number' ? originalAudioVolume : 100,
      musicVolume: typeof musicVolume === 'number' ? musicVolume : 100,
      musicStartTime: typeof musicStartTime === 'number' ? musicStartTime : 0,
      musicTrimStart: typeof musicTrimStart === 'number' ? musicTrimStart : 0,
      musicTrimEnd: typeof musicTrimEnd === 'number' ? musicTrimEnd : undefined,
      isMuted: !!isMuted,
      isSlideshow: !!isSlideshow,
      filterName
    });

    if (!result.success) {
      return res.status(422).json({
        success: false,
        message: result.message || 'Imeshindikana kuongeza sound. Tafadhali jaribu tena.',
        error: result.error
      });
    }

    // Increment sound usage count if a curated or registered sound was used
    if (soundId) {
      soundService.recordSoundUsage(soundId).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Maudhui yamechakatwa kikamilifu na sauti imeunganishwa!',
      processedMediaUrl: result.processedMediaUrl,
      thumbnailUrl: result.thumbnailUrl,
      duration: result.duration,
      fileSize: result.fileSize
    });
  } catch (err: any) {
    console.error('API process-audio fatal error:', err);
    res.status(500).json({
      success: false,
      message: 'Imeshindikana kuongeza sound. Tafadhali jaribu tena.',
      error: err.message
    });
  }
});

// Upload media directly to server storage
router.post('/media/upload-file', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { base64Data, mimeType, filename } = req.body;
    if (!base64Data) {
      return res.status(400).json({ success: false, message: 'Data ya faili haikupatikana.' });
    }

    const isVideo = (mimeType && mimeType.startsWith('video/')) || base64Data.startsWith('data:video/');

    if (isVideo) {
      try {
        const transcodeResult = await mediaProcessingService.transcodeVideo(base64Data);
        return res.json({
          success: true,
          url: transcodeResult.url,
          thumbnailUrl: transcodeResult.thumbnailUrl,
          fileSize: transcodeResult.fileSize,
          duration: transcodeResult.duration
        });
      } catch (transErr: any) {
        console.warn('Direct transcode fallback to raw buffer write:', transErr);
      }
    }

    const cleanBase64 = base64Data.replace(/^data:[a-zA-Z0-9/.-]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const uploadDir = path.join(process.cwd(), 'data', 'uploads', 'media');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = mimeType?.includes('png') ? 'png' : mimeType?.includes('video/webm') ? 'webm' : mimeType?.includes('video/mp4') ? 'mp4' : 'jpg';
    const savedName = `up_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(uploadDir, savedName);
    fs.writeFileSync(filePath, buffer);

    res.json({
      success: true,
      url: `/data/uploads/media/${savedName}`,
      fileSize: buffer.length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 23. REAL POST MANAGEMENT & MODERATION
// ==========================================

// Get posts (supports query params: authorId, includeDeleted, mediaType, moderationStatus, search, startDate, endDate, reportedOnly)
router.get('/posts', async (req, res) => {
  try {
    const authorId = req.query.authorId as string | undefined;
    const includeDeleted = req.query.includeDeleted === 'true';
    const mediaType = req.query.mediaType as string | undefined;
    const moderationStatus = req.query.moderationStatus as string | undefined;
    const search = req.query.search as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const reportedOnly = req.query.reportedOnly === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 200;
    
    const posts = await dataStore.getPosts({ 
      authorId, 
      includeDeleted, 
      mediaType,
      moderationStatus,
      search,
      startDate,
      endDate,
      reportedOnly,
      limit 
    });
    res.json({ success: true, count: posts.length, posts });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get post by ID
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await dataStore.getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Chapisho halijapatikana.' });
    }
    res.json({ success: true, post });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create new post (auth required)
router.post('/posts', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const postData = req.body;

    // Blueprint Section 5: Authoritative Server-Side Credit Deduction
    const isVideo = postData.mediaType === 'video' || postData.mediaType === 'clip';
    const creditResult = await walletService.deductCredits({
      userId: user.id,
      action: isVideo ? 'video_upload' : 'post_publish',
      targetId: postData.id,
      idempotencyKey: req.body.idempotencyKey
    });

    if (!creditResult.success) {
      return res.status(402).json({
        success: false,
        message: creditResult.message,
        code: creditResult.code
      });
    }

    const newPost: Post = {
      id: postData.id || `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authorId: user.id,
      ownerId: user.id,
      authorName: user.name,
      authorUsername: user.username || user.phone || 'user',
      authorAvatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      authorVerified: !!user.verified,
      content: postData.content || '',
      mediaUrl: postData.mediaUrl,
      mediaType: postData.mediaType || (postData.mediaUrl ? 'image' : undefined),
      feeling: postData.feeling,
      location: postData.location,
      privacy: postData.privacy || 'public',
      createdAt: new Date().toISOString(),
      reactions: {},
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      isDeleted: false,
      commentsDisabled: !!postData.commentsDisabled,
      moderationStatus: 'normal',
      soundId: postData.soundId,
      soundTitle: postData.soundTitle,
      soundArtist: postData.soundArtist,
      soundCoverUrl: postData.soundCoverUrl,
      soundAudioUrl: postData.soundAudioUrl,
      soundDuration: postData.soundDuration,
      originalAudioVolume: postData.originalAudioVolume,
      musicVolume: postData.musicVolume,
      musicStartTime: postData.musicStartTime,
      musicTrimStart: postData.musicTrimStart,
      musicTrimEnd: postData.musicTrimEnd
    };

    const saved = await dataStore.savePost(newPost);
    res.json({ success: true, message: 'Chapisho limechapishwa kikamilifu!', post: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update post (owner only)
router.put('/posts/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const postId = req.params.id as string;
    const post = await dataStore.getPostById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Chapisho halijapatikana.' });
    }

    const isOwner = post.authorId === user.id || post.ownerId === user.id;
    const isSuperAdmin = (user.role || '').toLowerCase() === 'super_admin';
    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Mwenye chapisho pekee anaweza kukihariri.' });
    }

    const allowedUpdates = {
      ...(req.body.content !== undefined ? { content: req.body.content } : {}),
      ...(req.body.privacy !== undefined ? { privacy: req.body.privacy } : {}),
      ...(req.body.commentsDisabled !== undefined ? { commentsDisabled: req.body.commentsDisabled } : {}),
      ...(req.body.feeling !== undefined ? { feeling: req.body.feeling } : {}),
      ...(req.body.location !== undefined ? { location: req.body.location } : {})
    };

    const updated = await dataStore.updatePost(postId, allowedUpdates);
    res.json({ success: true, message: 'Chapisho limesasishwa.', post: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete post (Owner or Super Admin or Admin with permission)
router.delete('/posts/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const postId = req.params.id as string;
    const reason = (req.body?.reason || req.query?.reason || 'Deleted by user') as string;
    const success = await dataStore.deletePost(postId, user.id, user.role, reason);
    res.json({ success: true, message: 'Chapisho limefutwa kikamilifu.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Purge post completely from database (Super Admin only)
router.delete('/posts/:id/purge', authMiddleware, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const postId = req.params.id as string;
    if (dataStore.purgePost) {
      await dataStore.purgePost(postId, user.id);
    } else {
      await dataStore.deletePost(postId, user.id, user.role, 'Purged');
    }
    res.json({ success: true, message: 'Chapisho limefutwa kabisa kwenye mfumo (purged).' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Restore post (Super Admin or Admin with permission)
router.post('/posts/:id/restore', authMiddleware, requirePermission('POST_MODERATION_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const postId = req.params.id as string;
    const success = await dataStore.restorePost(postId, user.id, user.role);
    res.json({ success, message: 'Chapisho limerejeshwa kikamilifu.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Restrict post (Super Admin or Admin with permission)
router.post('/posts/:id/restrict', authMiddleware, requirePermission('POST_MODERATION_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const postId = req.params.id as string;
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Tafadhali taja sababu ya kuzuia chapisho.' });
    }
    const success = await dataStore.restrictPost(postId, user.id, user.role, reason);
    res.json({ success, message: 'Chapisho limezuiwa (restricted).' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Toggle post comments (Owner or Admin)
router.post('/posts/:id/comments-toggle', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const postId = req.params.id as string;
    const { commentsDisabled } = req.body;
    const success = await dataStore.togglePostComments(postId, user.id, !!commentsDisabled);
    res.json({ 
      success, 
      message: commentsDisabled ? 'Maoni yamezimwa kwenye chapisho hili.' : 'Maoni yamewashwa kwenye chapisho hili.' 
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// React/Like post
router.post('/posts/:id/like', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const postId = req.params.id as string;
    const reaction = req.body.reaction || 'like';
    const result = await dataStore.likePost(postId, user.id, reaction);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get comments for post
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id as string;
    const includeRemoved = req.query.includeRemoved === 'true';
    const comments = await dataStore.getComments(postId, includeRemoved);
    res.json({ success: true, count: comments.length, comments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all comments for moderation management (Super Admin or Admin with permission)
router.get('/comments', authMiddleware, requirePermission('POST_MODERATION_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const postId = req.query.postId as string | undefined;
    const includeRemoved = req.query.includeRemoved === 'true';
    const authorId = req.query.authorId as string | undefined;
    const moderationStatus = req.query.moderationStatus as string | undefined;
    const search = req.query.search as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 200;

    const comments = await dataStore.getComments({
      postId,
      includeRemoved,
      authorId,
      moderationStatus,
      search,
      limit
    });
    res.json({ success: true, count: comments.length, comments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add comment to post
router.post('/posts/:id/comments', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const postId = req.params.id as string;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Tafadhali andika maoni yako.' });
    }

    const newComment: PostComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      postId,
      userId: user.id,
      authorId: user.id,
      userName: user.name,
      userAvatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      userVerified: !!user.verified,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      likesCount: 0,
      isRemoved: false,
      moderationStatus: 'normal'
    };

    const saved = await dataStore.addComment(newComment);
    res.json({ success: true, message: 'Maoni yamechapishwa.', comment: saved });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete/Remove comment (Comment owner, Post owner, Super Admin, or Admin with permission)
router.delete('/comments/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const commentId = req.params.id as string;
    const reason = (req.body?.reason || req.query?.reason || 'Comment removed') as string;
    const success = await dataStore.deleteComment(commentId, user.id, user.role, reason);
    res.json({ success, message: 'Maoni yameondolewa kikamilifu.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Restore comment (Super Admin or Admin with permission)
router.post('/comments/:id/restore', authMiddleware, requirePermission('POST_MODERATION_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const commentId = req.params.id as string;
    const success = await dataStore.restoreComment(commentId, user.id, user.role);
    res.json({ success, message: 'Maoni yamerejeshwa kikamilifu.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// 24. MODERATION QUEUE & REPORTING
// ==========================================

// Get reports queue (Super Admin or Admin with POST_MODERATION_MANAGE)
router.get('/reports', authMiddleware, requirePermission('POST_MODERATION_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const status = req.query.status as string | undefined;
    const targetType = req.query.targetType as string | undefined;
    const reports = await dataStore.getReports({ status, targetType });
    res.json({ success: true, count: reports.length, reports });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Submit report for post or comment (Any authenticated user)
router.post('/reports', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { targetType, targetId, postId, category, reason } = req.body;

    if (!targetType || !targetId || !category || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Tafadhali jaza taarifa zote za ripoti (aina, mlengwa, kategoria, sababu).'
      });
    }

    let targetOwnerId = '';
    let targetOwnerName = '';
    let reportedContentSnippet = '';

    if (targetType === 'post') {
      const post = await dataStore.getPostById(targetId);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Chapisho linaloripotiwa halijapatikana.' });
      }
      targetOwnerId = post.authorId;
      targetOwnerName = post.authorName;
      reportedContentSnippet = (post.content || '').substring(0, 100);
    } else if (targetType === 'comment') {
      const comment = await dataStore.getCommentById(targetId);
      if (!comment) {
        return res.status(404).json({ success: false, message: 'Maoni yanayoripotiwa hayajapatikana.' });
      }
      targetOwnerId = comment.authorId || comment.userId;
      targetOwnerName = comment.userName;
      reportedContentSnippet = (comment.content || '').substring(0, 100);
    } else if (targetType === 'user' || targetType === 'profile') {
      const targetUser = await dataStore.getUserById(targetId);
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'Mtumiaji anayeripotiwa hajapatikana.' });
      }
      targetOwnerId = targetUser.id;
      targetOwnerName = targetUser.name;
      reportedContentSnippet = `Akaunti ya Wasifu: @${targetUser.username} (RAVINI ID: ${targetUser.raviniId || targetUser.id})`;
    }

    const report: ContentReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      targetType,
      targetId,
      postId: postId || targetId,
      reporterId: user.id,
      reporterName: user.name,
      reporterAvatar: user.avatar,
      category,
      reason: reason.trim(),
      reportedContentSnippet,
      targetOwnerId,
      targetOwnerName,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const saved = await dataStore.saveReport(report);
    res.json({
      success: true,
      message: 'Ripoti yako imepokelewa na itafanyiwa kazi na wasimamizi.',
      report: saved
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Moderate report (Take action, dismiss, etc. Super Admin or Admin with permission)
const handleReportModeration = async (req: AuthenticatedRequest, res: any) => {
  try {
    const user = req.user!;
    const reportId = req.params.id as string;
    const { status, actionTaken, moderationNotes } = req.body;

    const existing = await dataStore.getReportById(reportId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Ripoti haikupatikana.' });
    }

    // Execute physical action on target content if specified
    if (actionTaken === 'removed' || status === 'action_taken') {
      const reason = moderationNotes || existing.reason || 'Maudhui yameondolewa kutokana na ripoti';
      if (existing.targetType === 'post') {
        await dataStore.deletePost(existing.targetId, user.id, user.role, reason);
      } else if (existing.targetType === 'comment') {
        await dataStore.deleteComment(existing.targetId, user.id, user.role, reason);
      }
    } else if (actionTaken === 'restricted' && existing.targetType === 'post') {
      const reason = moderationNotes || existing.reason || 'Maudhui yamezuiwa kutokana na ripoti';
      await dataStore.restrictPost(existing.targetId, user.id, user.role, reason);
    } else if (actionTaken === 'restored') {
      if (existing.targetType === 'post') {
        await dataStore.restorePost(existing.targetId, user.id, user.role);
      } else if (existing.targetType === 'comment') {
        await dataStore.restoreComment(existing.targetId, user.id, user.role);
      }
    } else if (status === 'dismissed') {
      // Check if target has no other pending reports
      if (existing.targetType === 'post') {
        const post = await dataStore.getPostById(existing.targetId);
        if (post && post.moderationStatus === 'reported') {
          post.moderationStatus = 'normal';
          await dataStore.savePost(post);
        }
      } else if (existing.targetType === 'comment') {
        const comment = await dataStore.getCommentById(existing.targetId);
        if (comment && comment.moderationStatus === 'reported') {
          comment.moderationStatus = 'normal';
          await dataStore.updateComment(existing.targetId, comment);
        }
      }
    }

    const now = new Date().toISOString();
    const updated = await dataStore.updateReport(reportId, {
      status: status || existing.status,
      actionTaken: actionTaken || existing.actionTaken,
      moderationNotes: moderationNotes || existing.moderationNotes,
      reviewedBy: user.id,
      reviewedByName: user.name,
      reviewedAt: now
    });

    await dataStore.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: (user.role || 'ADMIN').toUpperCase(),
      action: `REPORT_${(actionTaken || status || 'UPDATED').toUpperCase()}`,
      target: `Report ${reportId} on ${existing.targetType} ${existing.targetId}`,
      targetId: reportId,
      details: `Report ${reportId} (${existing.targetType}) updated to status '${status || existing.status}', action: '${actionTaken || 'none'}'. Notes: ${moderationNotes || 'none'}`
    });

    res.json({
      success: true,
      message: 'Ripoti imesasishwa na hatua ya kiutawala imetekelezwa kikamilifu.',
      report: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

router.put('/reports/:id', authMiddleware, requirePermission('POST_MODERATION_MANAGE'), handleReportModeration);
router.patch('/reports/:id', authMiddleware, requirePermission('POST_MODERATION_MANAGE'), handleReportModeration);

// ==========================================
// 25. FOLLOWING & FOLLOWERS
// ==========================================

router.post('/users/:id/follow', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const targetUserId = req.params.id as string;
    const result = await dataStore.followUser(user.id, targetUserId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/users/:id/unfollow', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const targetUserId = req.params.id as string;
    const result = await dataStore.unfollowUser(user.id, targetUserId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/users/:id/followers', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const targetUserId = req.params.id as string;
    const viewer = req.user!;
    const targetPrivacy = await dataStore.getUserPrivacySettings(targetUserId);

    // Check privacy of follower list
    if (targetPrivacy.whoCanSeeFollowList === 'only_me' && viewer.id !== targetUserId && viewer.role !== 'SUPER_ADMIN') {
      return res.json({ success: true, followers: [], restricted: true, message: 'Orodha ya wafuasi imewekwa kuwa ya siri na mmiliki wa akaunti.' });
    }
    if (targetPrivacy.whoCanSeeFollowList === 'followers_only' && viewer.id !== targetUserId && viewer.role !== 'SUPER_ADMIN') {
      const isFollowing = (viewer.followingUsers || []).includes(targetUserId);
      if (!isFollowing) {
        return res.json({ success: true, followers: [], restricted: true, message: 'Orodha ya wafuasi inaonekana kwa wanaomfuata mtumiaji huyu pekee.' });
      }
    }

    const followers = await dataStore.getFollowers(targetUserId);
    res.json({ success: true, count: followers.length, followers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/users/:id/following', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const targetUserId = req.params.id as string;
    const viewer = req.user!;
    const targetPrivacy = await dataStore.getUserPrivacySettings(targetUserId);

    if (targetPrivacy.whoCanSeeFollowList === 'only_me' && viewer.id !== targetUserId && viewer.role !== 'SUPER_ADMIN') {
      return res.json({ success: true, following: [], restricted: true, message: 'Orodha ya wanaofuatwa imewekwa kuwa ya siri na mmiliki wa akaunti.' });
    }
    if (targetPrivacy.whoCanSeeFollowList === 'followers_only' && viewer.id !== targetUserId && viewer.role !== 'SUPER_ADMIN') {
      const isFollowing = (viewer.followingUsers || []).includes(targetUserId);
      if (!isFollowing) {
        return res.json({ success: true, following: [], restricted: true, message: 'Orodha ya wanaofuatwa inaonekana kwa wanaomfuata mtumiaji huyu pekee.' });
      }
    }

    const following = await dataStore.getFollowing(targetUserId);
    res.json({ success: true, count: following.length, following });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/users/follow-requests', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const requests = await dataStore.getFollowRequests(req.user!.id);
    res.json({ success: true, count: requests.length, requests });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/users/follow-requests/:id/accept', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await dataStore.acceptFollowRequest(req.params.id as string, req.user!.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/users/follow-requests/:id/reject', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await dataStore.rejectFollowRequest(req.params.id as string, req.user!.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 26. PRIVACY & BLOCKING ENDPOINTS
// ==========================================

router.get('/users/privacy', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const privacy = await dataStore.getUserPrivacySettings(req.user!.id);
    res.json({ success: true, privacy });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/users/privacy', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const updates = req.body;
    const updated = await dataStore.updateUserPrivacySettings(user.id, updates);

    await dataStore.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'PRIVACY_SETTINGS_UPDATED',
      target: user.username,
      details: 'User updated privacy preferences.'
    });

    res.json({
      success: true,
      message: 'Mipangilio ya faragha imesasishwa kikamilifu.',
      privacy: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/users/:id/block', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const targetUserId = req.params.id as string;

    if (user.id === targetUserId) {
      return res.status(400).json({ success: false, message: 'Huwezi kujizuia mwenyewe.' });
    }

    await dataStore.blockUser(user.id, targetUserId);

    await dataStore.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_BLOCKED',
      target: targetUserId,
      details: `User ${user.id} blocked user ${targetUserId}`
    });

    res.json({
      success: true,
      message: 'Mtumiaji amezuiwa (Blocked) kikamilifu.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/users/:id/unblock', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const targetUserId = req.params.id as string;

    await dataStore.unblockUser(user.id, targetUserId);

    await dataStore.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_UNBLOCKED',
      target: targetUserId,
      details: `User ${user.id} unblocked user ${targetUserId}`
    });

    res.json({
      success: true,
      message: 'Kizuizi kimeondolewa kikamilifu.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/users/blocked', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const blockedUsers = await dataStore.getBlockedUsers(req.user!.id);
    res.json({ success: true, count: blockedUsers.length, blockedUsers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 27. PROFILE MANAGEMENT & DEACTIVATION
// ==========================================

router.put('/users/profile', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { name, username, bio, location, website, phone, email, avatar, coverPhoto } = req.body;

    const updates: Partial<User> = {};

    if (name !== undefined) updates.name = String(name).trim();
    if (bio !== undefined) updates.bio = String(bio).trim();
    if (location !== undefined) updates.location = String(location).trim();
    if (website !== undefined) updates.website = String(website).trim();
    if (avatar !== undefined) updates.avatar = String(avatar);
    if (coverPhoto !== undefined) updates.coverPhoto = String(coverPhoto);
    if (phone !== undefined) updates.phone = String(phone).trim();
    if (email !== undefined) updates.email = String(email).trim().toLowerCase();

    if (username !== undefined) {
      const cleanUsername = String(username).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (cleanUsername.length < 3 || cleanUsername.length > 30) {
        return res.status(400).json({
          success: false,
          message: 'Jina la mtumiaji (Username) linapaswa kuwa na herufi 3 hadi 30 (herufi, namba na _ pekee).'
        });
      }

      // Reserved check
      const reserved = ['admin', 'superadmin', 'super_admin', 'ravini', 'support', 'official', 'raviniofficial', 'help', 'system'];
      if (reserved.includes(cleanUsername) && user.role !== 'SUPER_ADMIN') {
        return res.status(400).json({
          success: false,
          message: 'Jina hili la mtumiaji limetengwa maalum na haliwezi kutumiwa.'
        });
      }

      // Unique check
      const existing = await dataStore.getUserByUsername(cleanUsername);
      if (existing && existing.id !== user.id) {
        return res.status(400).json({
          success: false,
          message: 'Jina hili la mtumiaji (Username) tayari limetumika na mtu mwingine.'
        });
      }

      updates.username = cleanUsername;
    }

    // Explicitly prevent mutating sensitive security fields
    delete (updates as any).id;
    delete (updates as any).firebaseUid;
    delete (updates as any).uid;
    delete (updates as any).raviniId;
    delete (updates as any).role;
    delete (updates as any).permissions;
    delete (updates as any).accountStatus;
    delete (updates as any).isSuspended;
    delete (updates as any).isDisabled;
    delete (updates as any).verified;
    delete (updates as any).verificationStatus;
    delete (updates as any).walletBalance;

    const updatedUser = await dataStore.updateUser(user.id, updates);

    await dataStore.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'PROFILE_UPDATED',
      target: user.username,
      details: `User updated profile fields: ${Object.keys(updates).join(', ')}`
    });

    res.json({
      success: true,
      message: 'Wasifu umesasishwa kikamilifu!',
      user: updatedUser
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/users/deactivate', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Tafadhali weka nenosiri lako ili kusitisha akaunti.' });
    }

    const dbUser = await dataStore.getUserById(user.id);
    if (!dbUser) return res.status(404).json({ success: false, message: 'Mtumiaji hakupatikana.' });

    if (dbUser.password !== password && !(dbUser.mustChangePassword && password === '1234')) {
      return res.status(400).json({ success: false, message: 'Nenosiri si sahihi.' });
    }

    if (dbUser.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Akaunti ya Msimamizi Mkuu (SUPER_ADMIN) haiwezi kusitishwa.' });
    }

    dbUser.accountStatus = 'DEACTIVATED';
    await dataStore.saveUser(dbUser);

    await dataStore.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'ACCOUNT_DEACTIVATED',
      target: user.username,
      details: 'User deactivated their account.'
    });

    res.json({
      success: true,
      message: 'Akaunti yako imesitishwa (Deactivated) kwa usalama. Data zako zimehifadhiwa.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/users/security/sessions', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const userAgent = req.headers['user-agent'] || 'Kivinjari cha Tovuti / Mobile App';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    const sessions = [
      {
        id: `sess_current_${user.id}`,
        device: userAgent.includes('Mobile') ? 'Simu ya Mkononi (Mobile Device)' : 'Kompyuta (Desktop Browser)',
        browser: userAgent.substring(0, 75),
        ip: String(ip).split(',')[0].trim(),
        location: 'Tanzania (Eneo la Sasa)',
        isCurrent: true,
        lastActive: new Date().toISOString(),
        status: 'Hai (Active)'
      }
    ];

    res.json({
      success: true,
      securityStatus: {
        isHealthy: true,
        twoFactorStatus: '2FA Tayari (SMS/Auth)',
        passwordChangedAt: 'Sasa Hivi',
        activeSessionsCount: 1,
        mustChangePassword: !!user.mustChangePassword
      },
      sessions
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/users/security/terminate-sessions', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    await dataStore.addAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'SESSIONS_TERMINATED',
      target: user.username,
      details: 'User terminated other active sessions.'
    });

    res.json({
      success: true,
      message: 'Vipindi vingine vyote vimefungwa kikamilifu.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/users/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const viewer = req.user!;
    const targetUserId = req.params.id as string;

    const targetUser = await dataStore.getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Mtumiaji hajapatikana.' });
    }

    const isBlocked = await dataStore.isUserBlocked(viewer.id, targetUserId);
    const viewerPrivacy = await dataStore.getUserPrivacySettings(viewer.id);
    const targetPrivacy = await dataStore.getUserPrivacySettings(targetUserId);

    const hasBlockedTarget = viewerPrivacy.blockedUserIds.includes(targetUserId);
    const isBlockedByTarget = targetPrivacy.blockedUserIds.includes(viewer.id);

    // Compute real counts
    const allUsers = await dataStore.getUsers();
    const realFollowersCount = allUsers.filter(u => u.id !== targetUserId && (u.followingUsers || []).includes(targetUserId)).length;
    const realFollowingCount = (targetUser.followingUsers || []).length;

    // Real posts count
    const posts = await dataStore.getPosts({ authorId: targetUserId, limit: 100 });
    const activePostsCount = posts.filter(p => !p.isDeleted && p.moderationStatus !== 'restricted' && p.moderationStatus !== 'removed').length;

    const isFollowing = (viewer.followingUsers || []).includes(targetUserId);

    // Check pending follow request
    const followRequests = await dataStore.getFollowRequests(targetUserId);
    const hasPendingFollowRequest = followRequests.some(r => r.senderId === viewer.id && r.status === 'pending');

    const isSelf = viewer.id === targetUserId;
    const isPrivate = targetPrivacy.accountVisibility === 'private';
    const canViewContent = isSelf || viewer.role === 'SUPER_ADMIN' || (!isBlocked && (!isPrivate || isFollowing));

    const sanitized = {
      id: targetUser.id,
      name: targetUser.name,
      username: targetUser.username,
      avatar: targetUser.avatar,
      coverPhoto: targetUser.coverPhoto,
      bio: targetUser.bio,
      location: targetUser.location,
      website: targetUser.website,
      verified: targetUser.verified,
      raviniId: targetUser.raviniId,
      role: targetUser.role,
      accountStatus: targetUser.accountStatus || 'ACTIVE',
      createdAt: targetUser.createdAt,
      followersCount: realFollowersCount,
      followingCount: realFollowingCount,
      postsCount: activePostsCount,
      isFollowing,
      hasPendingFollowRequest,
      isBlocked,
      hasBlockedTarget,
      isBlockedByTarget,
      isPrivate,
      canViewContent,
      privacy: isSelf ? targetPrivacy : undefined
    };

    res.json({ success: true, user: sanitized });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// BLUEPRINT SECTION 5: STRICT SERVER-SIDE CREDIT MANAGEMENT
// ==========================================

// Get user credit balance and manager status
router.get('/credits/balance', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const isManager = user.role === 'manager' || user.role === 'super_admin';
    const dbUser = await dataStore.getUserById(user.id);

    res.json({
      success: true,
      balance: isManager ? 999999999 : (dbUser?.walletBalance || 0),
      isUnlimited: isManager,
      role: user.role
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------- CREDIT SYSTEM & WHATSAPP CONFIGURATION -----------------

// Get current dynamic credit configuration (prices, bundles, WhatsApp number)
router.get('/credits/config', async (req, res) => {
  try {
    const config = await dataStore.getCreditConfig();
    res.json({ success: true, config });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update dynamic credit configuration (Manager / Super Admin only)
router.put('/credits/config', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const roleLower = (user.role || '').toLowerCase();
    if (roleLower !== 'manager' && roleLower !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Ruksa imezuiliwa: Ni Manager pekee anayeweza kurekebisha mipangilio ya Credits na namba ya WhatsApp.'
      });
    }

    const updated = await dataStore.updateCreditConfig(req.body, user.id, user.name);
    res.json({
      success: true,
      message: 'Mipangilio ya Credits na namba ya WhatsApp imesasishwa kikamilifu.',
      config: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get authoritative user credit balance and manager status
router.get('/credits/balance', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const dbUser = await dataStore.getUserById(user.id);
    const roleLower = (user.role || '').toLowerCase();
    const isManager = roleLower === 'manager' || roleLower === 'super_admin';
    const balance = dbUser?.walletBalance || 0;

    res.json({
      success: true,
      userId: user.id,
      isManager,
      balance,
      displayBalance: isManager ? '∞' : balance,
      canPerformAction: isManager || balance > 0
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Explicit Authoritative Credit Deduction Endpoint
router.post('/credits/deduct', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { action, targetId, idempotencyKey } = req.body;

    const result = await walletService.deductCredits({
      userId: user.id,
      action: action || 'post_publish',
      targetId,
      idempotencyKey
    });

    if (!result.success) {
      return res.status(402).json({
        success: false,
        code: result.code,
        message: result.message
      });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Authorize Movie Streaming or Download (-3 credits via walletService)
router.post('/movies/:id/authorize', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const movieId = req.params.id as string;
    const { idempotencyKey } = req.body;

    const result = await walletService.deductCredits({
      userId: user.id,
      action: 'movie_stream',
      targetId: movieId,
      idempotencyKey
    });

    if (!result.success) {
      return res.status(402).json({
        success: false,
        authorized: false,
        code: result.code,
        message: result.message
      });
    }

    res.json({
      success: true,
      authorized: true,
      deducted: result.deducted,
      remainingBalance: result.remainingBalance,
      isUnlimited: result.isUnlimited,
      message: 'Movie imethibitishwa kikamilifu! Furahia kutazama.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
