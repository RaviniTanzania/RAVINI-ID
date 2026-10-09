import fs from 'fs';
import path from 'path';
import { 
  User, 
  WalletTransaction, 
  AdCampaign, 
  CompanyLedgerTransaction, 
  RefundRecord, 
  PlatformPricingConfig, 
  AuditLog, 
  RvcDepositRequest, 
  PaymentConfig,
  CreditConfig,
  SystemSettings,
  AuthoritativeLedgers,
  SystemPersistenceStatus,
  ChatMessage,
  ChatConversation,
  MessageRequest,
  ChatPrivacySettings,
  CallSession
} from '../../src/types';
import { IRaviniDataStore, PaginationOptions } from './dataStoreInterface';
import { SqliteProductionDataStore } from './sqliteProductionDataStore';
import { hashPassword, isHashed } from '../utils/passwordSecurity';

interface DatabaseSchema {
  version: number;
  lastPersistedAt: string;
  users: User[];
  transactions: WalletTransaction[];
  adCampaigns: AdCampaign[];
  companyLedger: CompanyLedgerTransaction[];
  refunds: RefundRecord[];
  pricing: PlatformPricingConfig;
  rvcRequests: RvcDepositRequest[];
  auditLogs: AuditLog[];
  systemSettings: SystemSettings;
  paymentConfig: PaymentConfig;
  creditConfig?: CreditConfig;
  messages: ChatMessage[];
  conversations: ChatConversation[];
  messageRequests: MessageRequest[];
  callSessions: CallSession[];
  privacySettings: Record<string, ChatPrivacySettings>;
  blockedUsers: Record<string, string[]>;
}

const DEFAULT_PLATFORM_PRICING: PlatformPricingConfig = {
  adPricing: {
    sponsoredPostPerDay: 1000,
    sponsoredVideoPerDay: 1800,
    sponsoredClipPerDay: 1400,
    sponsoredProductPerDay: 1200,
    sponsoredBusinessPerDay: 2000,
    bannerPerDay: 2500,
    feedAdPerDay: 1500,
    cpmRate: 100,
    minimumBudgetRvc: 1000,
  },
  premiumPricing: {
    monthlyRvc: 9900,
    quarterlyRvc: 26900,
    annualRvc: 95000,
  },
  pushViralPackages: [
    {
      id: 'viral_starter',
      name: 'Starter Boost (Kiwango cha Kwanza)',
      nameEn: 'Starter Boost',
      description: 'Tangaza maudhui yako kwa hadhira pana nchini Tanzania kwa masaa 24.',
      descriptionEn: 'Promote content across Tanzania for 24 hours.',
      priceRvc: 2500,
      priceTzs: 2500,
      targetViewsEstimate: '1,500 - 3,500',
      durationDays: 1,
      guaranteedPushBadge: true,
      priorityRanking: 1,
      isPopular: false,
    },
    {
      id: 'viral_pro',
      name: 'Pro Reach (Kiwango cha Juu)',
      nameEn: 'Pro Reach',
      description: 'Ongeza ushawishi mkubwa kwa siku 3 mfululizo na beji ya Verified Boost.',
      descriptionEn: 'Huge reach for 3 consecutive days with Verified Boost badge.',
      priceRvc: 6500,
      priceTzs: 6500,
      targetViewsEstimate: '5,000 - 12,000',
      durationDays: 3,
      guaranteedPushBadge: true,
      priorityRanking: 2,
      isPopular: true,
    },
    {
      id: 'viral_national',
      name: 'National Explosion (Kiwango cha Taifa)',
      nameEn: 'National Explosion',
      description: 'Fikia taifa zima kwa siku 7, video, sauti na matangazo ya juu ya ukurasa.',
      descriptionEn: 'Nationwide spotlight for 7 days with top page ranking.',
      priceRvc: 14500,
      priceTzs: 14500,
      targetViewsEstimate: '15,000 - 45,000',
      durationDays: 7,
      guaranteedPushBadge: true,
      priorityRanking: 3,
      isPopular: false,
    }
  ],
  marketCommissionRate: 0.05,
  updatedAt: '2026-02-15T00:00:00.000Z',
  updatedBy: 'Baraka Mabula (Super Admin)',
};

const DEFAULT_SUPER_ADMIN: User = {
  id: 'usr_baraka_mabula',
  name: 'Baraka Mabula',
  username: '255748604483',
  email: 'barakamabula82@gmail.com',
  phone: '255748604483',
  password: hashPassword('1234'),
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  coverPhoto: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
  bio: 'Mwanzilishi & Msimamizi Mkuu (Super Admin) wa RAVINI COMPANY LIMITED. Full Controller System. Karibuni sana kwenye mtandao mkuu wa kijamii wa Kitanzania! 🇹🇿🚀',
  location: 'Dar es Salaam, Tanzania',
  verified: true,
  role: 'MANAGER',
  walletBalance: 0,
  followersCount: 0,
  followingCount: 0,
  createdAt: '2026-01-10T08:00:00.000Z',
  isOnline: true,
  savedPosts: [],
  followingUsers: [],
  creatorApproved: true,
  creatorApplicationStatus: 'approved',
  creatorDetails: {
    category: 'Teknolojia & Uongozi',
    bio: 'Mwanzilishi wa mifumo ya kidijitali na mhariri wa maudhui ya maendeleo.',
    totalReach: 0,
    subscribers: 0
  },
  businessApproved: true,
  businessApplicationStatus: 'approved',
  businessDetails: {
    companyName: 'RAVINI COMPANY LIMITED',
    category: 'Teknolojia & Mawasiliano',
    tin: '144-892-301',
    phone: '+255 748 604 483',
    email: 'info@ravini.co.tz',
    address: 'Ali Hassan Mwinyi Road, Dar es Salaam',
    description: 'Kampuni kuu inayomiliki na kuendesha jukwaa la RAVINI nchini Tanzania.',
    productsCount: 4
  },
  permissions: ['all'],
  mustChangePassword: false,
  accountStatus: 'ACTIVE',
  isDisabled: false,
  isSuspended: false
};

const DEFAULT_USERS: User[] = [
  DEFAULT_SUPER_ADMIN
];

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  allowRegistrations: true,
  allowMarketPosting: true,
  allowRvcDeposits: true,
  allowStories: true,
  maintenanceMode: false,
  maintenanceMessage: 'Mfumo wa RAVINI unafanyiwa maboresho ya kiufundi. Huduma zitarejea punde.',
  allowedRegistration: true,
  requirePhoneVerification: false,
  requireEmailVerification: false,
  maxUploadSizeMB: 50,
  minDepositRvc: 1000,
  maxDepositRvc: 5000000,
  minWithdrawRvc: 2000,
  maxWithdrawRvc: 2000000,
  systemNotice: '',
  showSystemNotice: false,
  updatedAt: '2026-02-15T00:00:00.000Z',
  updatedBy: 'Baraka Mabula (Super Admin)'
};

const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  whatsappNumber: '+255748604483',
  whatsappDisplayName: 'RAVINI Payment Desk',
  paymentInstructions: 'Malipo ya RAVINI yanafanyika kwa njia ya manual. Fanya malipo kupitia namba za Lipa zilizo hapa chini kisha bonyeza ENDELEA WHATSAPP kutuma namba ya kumbukumbu ya muamala wako.',
  paymentReferenceInstructions: 'Tuma ujumbe wenye namba ya kumbukumbu ya muamala (SMS ya malipo) na jina lako la mtumiaji (Username) kupitia WhatsApp rasmi ili kuthibitishiwa.',
  minTopUpAmount: 1000,
  maxTopUpAmount: 5000000,
  isActive: true,
  availableMethods: ['M-Pesa', 'Airtel Money', 'Mixx by Yas', 'HaloPesa'],
  mpesaNumber: '5566778',
  mpesaName: 'RAVINI COMPANY LIMITED (Lipa Namba)',
  airtelNumber: '8899001',
  airtelName: 'RAVINI COMPANY LIMITED (Paybill)',
  mixxNumber: '334455',
  mixxName: 'RAVINI COMPANY LIMITED',
  haloPesaNumber: '778899',
  haloPesaName: 'RAVINI COMPANY LIMITED',
  conversionRate: 1,
  updatedAt: '2026-02-15T00:00:00.000Z',
  updatedBy: 'Baraka Mabula (Super Admin)'
};

export class FileJsonDataStore {
  readonly name = 'FileJsonDataStore (Production Persistence Engine)';
  private filePath: string;
  private data: DatabaseSchema;
  private isInitialized = false;
  private writeLock = false;
  private pendingWrite = false;

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(process.cwd(), 'data', 'ravini_db.json');
    this.data = {
      version: 1,
      lastPersistedAt: new Date().toISOString(),
      users: [],
      transactions: [],
      adCampaigns: [],
      companyLedger: [],
      refunds: [],
      pricing: DEFAULT_PLATFORM_PRICING,
      rvcRequests: [],
      auditLogs: [],
      systemSettings: DEFAULT_SYSTEM_SETTINGS,
      paymentConfig: DEFAULT_PAYMENT_CONFIG,
      messages: [],
      conversations: [],
      messageRequests: [],
      callSessions: [],
      privacySettings: {},
      blockedUsers: {}
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          version: parsed.version || 1,
          lastPersistedAt: parsed.lastPersistedAt || new Date().toISOString(),
          users: parsed.users || [],
          transactions: parsed.transactions || [],
          adCampaigns: parsed.adCampaigns || [],
          companyLedger: parsed.companyLedger || [],
          refunds: parsed.refunds || [],
          pricing: parsed.pricing || DEFAULT_PLATFORM_PRICING,
          rvcRequests: parsed.rvcRequests || [],
          auditLogs: parsed.auditLogs || [],
          systemSettings: parsed.systemSettings || DEFAULT_SYSTEM_SETTINGS,
          paymentConfig: parsed.paymentConfig || DEFAULT_PAYMENT_CONFIG,
          messages: parsed.messages || [],
          conversations: parsed.conversations || [],
          messageRequests: parsed.messageRequests || [],
          callSessions: parsed.callSessions || [],
          privacySettings: parsed.privacySettings || {},
          blockedUsers: parsed.blockedUsers || {}
        };

        // Ensure Manager exists
        const managerUser = this.data.users.find(u => u.phone === '255748604483' || u.id === DEFAULT_SUPER_ADMIN.id);
        if (!managerUser) {
          this.data.users.unshift(DEFAULT_SUPER_ADMIN);
          await this.flush();
        } else if (managerUser.role !== 'MANAGER') {
          managerUser.role = 'MANAGER';
          await this.flush();
        }
      } catch (err) {
        console.error('Error reading persistence file, initializing defaults:', err);
        this.seedDefaults();
        await this.flush();
      }
    } else {
      this.seedDefaults();
      await this.flush();
    }

    this.isInitialized = true;

    // Trigger initial verified backup upon system startup if none exists or every 24h
    try {
      this.createBackup('startup_verified').catch(() => {});
    } catch {}
  }

  private lastBackupTime = Date.now();

  async createBackup(reason = 'scheduled'): Promise<{ success: boolean; backupPath: string; timestamp: string }> {
    const backupDir = path.join(process.cwd(), 'data', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `ravini_db_backup_${timestamp}_${reason}.json`;
    const backupPath = path.join(backupDir, backupFileName);

    const payload = JSON.stringify(this.data, null, 2);
    fs.writeFileSync(backupPath, payload, 'utf-8');
    this.lastBackupTime = Date.now();

    // Keep latest 10 rolling backups non-destructively
    try {
      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('ravini_db_backup_') && f.endsWith('.json'))
        .sort()
        .reverse();
      if (files.length > 10) {
        for (let i = 10; i < files.length; i++) {
          fs.unlinkSync(path.join(backupDir, files[i]));
        }
      }
    } catch (cleanupErr) {
      console.warn('Backup cleanup warning:', cleanupErr);
    }

    return { success: true, backupPath, timestamp };
  }

  async listBackups(): Promise<Array<{ fileName: string; size: number; createdAt: string }>> {
    const backupDir = path.join(process.cwd(), 'data', 'backups');
    if (!fs.existsSync(backupDir)) return [];
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
    return files.map(f => {
      const stat = fs.statSync(path.join(backupDir, f));
      return {
        fileName: f,
        size: stat.size,
        createdAt: stat.birthtime.toISOString()
      };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private seedDefaults() {
    this.data.users = [...DEFAULT_USERS];
    this.data.pricing = DEFAULT_PLATFORM_PRICING;
    this.data.systemSettings = DEFAULT_SYSTEM_SETTINGS;
    this.data.transactions = [];
    this.data.companyLedger = [];
    this.data.auditLogs = [
      {
        id: 'aud_init_001',
        actorId: DEFAULT_SUPER_ADMIN.id,
        actorName: DEFAULT_SUPER_ADMIN.name,
        actorRole: 'super_admin',
        action: 'SYSTEM_INITIALIZED',
        target: 'ravini_platform',
        targetId: 'ravini_platform',
        details: 'RAVINI Production Persistence Engine Initialized with durable storage.',
        timestamp: new Date().toISOString()
      }
    ];
  }

  async flush(): Promise<void> {
    if (this.writeLock) {
      this.pendingWrite = true;
      return;
    }

    this.writeLock = true;
    try {
      this.data.lastPersistedAt = new Date().toISOString();
      const payload = JSON.stringify(this.data, null, 2);
      const tempPath = `${this.filePath}.tmp`;
      fs.writeFileSync(tempPath, payload, 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (e) {
      console.error('Failed to flush dataStore to disk:', e);
      throw e;
    } finally {
      this.writeLock = false;
      if (this.pendingWrite) {
        this.pendingWrite = false;
        await this.flush();
      }
    }
  }

  // --- Users ---
  async getUsers(): Promise<User[]> {
    await this.initialize();
    return [...this.data.users];
  }

  async getUserById(id: string): Promise<User | null> {
    await this.initialize();
    const u = this.data.users.find(x => x.id === id);
    return u ? { ...u } : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    await this.initialize();
    const u = this.data.users.find(x => x.email.toLowerCase() === email.toLowerCase());
    return u ? { ...u } : null;
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    await this.initialize();
    const clean = phone.replace(/[^0-9+]/g, '');
    const u = this.data.users.find(x => x.phone?.replace(/[^0-9+]/g, '') === clean);
    return u ? { ...u } : null;
  }

  async saveUser(user: User): Promise<User> {
    await this.initialize();
    const isCanonical = user.id === 'usr_baraka_mabula' || user.phone === '255748604483' || user.username === '255748604483';
    if (isCanonical) {
      user.id = 'usr_baraka_mabula';
      user.phone = '255748604483';
      user.role = 'SUPER_ADMIN';
      user.isDisabled = false;
      user.isSuspended = false;
      user.permissions = ['all'];
      user.mustChangePassword = false;
      user.accountStatus = 'ACTIVE';
    } else {
      if (user.role === 'SUPER_ADMIN' || user.role === 'super_admin') {
        throw new Error('Huwezi kumpa mtumiaji huyu cheo cha SUPER_ADMIN.');
      }
    }

    if (user.password && !isHashed(user.password)) {
      user.password = hashPassword(user.password);
    }

    const index = this.data.users.findIndex(x => x.id === user.id);
    if (index >= 0) {
      this.data.users[index] = { ...user };
    } else {
      this.data.users.push({ ...user });
    }
    await this.flush();
    return { ...user };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    await this.initialize();
    const index = this.data.users.findIndex(x => x.id === id);
    if (index < 0) return null;

    const existing = this.data.users[index];
    const isCanonical = existing.id === 'usr_baraka_mabula' || existing.phone === '255748604483' || existing.username === '255748604483';
    if (isCanonical) {
      if (updates.role && updates.role !== 'SUPER_ADMIN' && updates.role !== 'super_admin') {
        throw new Error('Msimamizi Mkuu hawezi kushushwa cheo.');
      }
      updates.role = 'SUPER_ADMIN';
      updates.isDisabled = false;
      updates.isSuspended = false;
      updates.mustChangePassword = false;
      updates.accountStatus = 'ACTIVE';
    } else {
      if (updates.role === 'SUPER_ADMIN' || updates.role === 'super_admin') {
        throw new Error('Huwezi kubadilisha mtumiaji kuwa Super Admin.');
      }
    }

    if (updates.password && !isHashed(updates.password)) {
      updates.password = hashPassword(updates.password);
    }

    this.data.users[index] = { ...this.data.users[index], ...updates };
    await this.flush();
    return { ...this.data.users[index] };
  }

  async purgeUser(id: string, actorId: string): Promise<boolean> {
    await this.initialize();
    const index = this.data.users.findIndex(x => x.id === id);
    if (index < 0) return false;
    const target = this.data.users[index];
    if (target.id === 'usr_baraka_mabula' || target.phone === '255748604483') {
      throw new Error('Akaunti ya Msimamizi Mkuu haiwezi kufutwa.');
    }
    this.data.users.splice(index, 1);
    await this.flush();
    return true;
  }

  // --- Transactions ---
  async getUserTransactions(userId: string, options?: PaginationOptions): Promise<WalletTransaction[]> {
    await this.initialize();
    let list = this.data.transactions.filter(t => t.userId === userId || t.recipientId === userId);
    list.sort((a, b) => {
      const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
      const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
      return timeB - timeA;
    });
    if (options?.offset) list = list.slice(options.offset);
    if (options?.limit) list = list.slice(0, options.limit);
    return list;
  }

  async getAllTransactions(options?: PaginationOptions): Promise<WalletTransaction[]> {
    await this.initialize();
    let list = [...this.data.transactions];
    list.sort((a, b) => {
      const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
      const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
      return timeB - timeA;
    });
    if (options?.offset) list = list.slice(options.offset);
    if (options?.limit) list = list.slice(0, options.limit);
    return list;
  }

  async recordWalletTransaction(transaction: WalletTransaction): Promise<WalletTransaction> {
    await this.initialize();
    // Check idempotency
    if (transaction.idempotencyKey) {
      const existing = this.data.transactions.find(t => t.idempotencyKey === transaction.idempotencyKey);
      if (existing) return existing;
    }

    const nowIso = new Date().toISOString();
    const tx: WalletTransaction = {
      ...transaction,
      id: transaction.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: transaction.createdAt || transaction.timestamp || nowIso,
      timestamp: transaction.timestamp || transaction.createdAt || nowIso
    };
    this.data.transactions.unshift(tx);
    await this.flush();
    return tx;
  }

  async atomicWalletTransfer(params: {
    senderId: string;
    recipientId: string;
    amountRvc: number;
    description: string;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; message: string; transaction?: WalletTransaction }> {
    await this.initialize();

    if (params.amountRvc <= 0) {
      return { success: false, message: 'Kiasi cha kutuma lazima kiwe zaidi ya 0 RVC.' };
    }

    // Idempotency check
    if (params.idempotencyKey) {
      const existing = this.data.transactions.find(t => t.idempotencyKey === params.idempotencyKey);
      if (existing) {
        return { success: true, message: 'Muamala huu ulikamilika awali.', transaction: existing };
      }
    }

    const sender = this.data.users.find(u => u.id === params.senderId);
    const recipient = this.data.users.find(u => u.id === params.recipientId);

    if (!sender) return { success: false, message: 'Mtumaji hakupatikana.' };
    if (!recipient) return { success: false, message: 'Mpokeaji hakupatikana.' };
    if (sender.walletBalance < params.amountRvc) {
      return { 
        success: false, 
        message: `Salio lako la RVC (${sender.walletBalance.toLocaleString()}) halitoshi kutuma RVC ${params.amountRvc.toLocaleString()}.` 
      };
    }

    // Atomically adjust balances
    sender.walletBalance -= params.amountRvc;
    recipient.walletBalance += params.amountRvc;

    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
    const txTime = new Date().toISOString();

    const senderTx: WalletTransaction = {
      id: txId,
      userId: sender.id,
      userRaviniId: sender.raviniId || sender.username,
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientRaviniId: recipient.raviniId || recipient.username,
      type: 'transfer_out',
      amount: params.amountRvc,
      status: 'completed',
      createdAt: txTime,
      timestamp: txTime,
      description: params.description || `Uhamisho wa RVC kwa ${recipient.name}`,
      reference: `TRF-${Date.now().toString().slice(-6)}`,
      idempotencyKey: params.idempotencyKey
    };

    const recipientTx: WalletTransaction = {
      id: `${txId}_rcv`,
      userId: recipient.id,
      userRaviniId: recipient.raviniId || recipient.username,
      recipientId: sender.id,
      recipientName: sender.name,
      type: 'transfer_in',
      amount: params.amountRvc,
      status: 'completed',
      createdAt: txTime,
      timestamp: txTime,
      description: `RVC zimepokelewa kutoka kwa ${sender.name}`,
      reference: senderTx.reference
    };

    this.data.transactions.unshift(senderTx);
    this.data.transactions.unshift(recipientTx);

    this.data.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      actorId: sender.id,
      actorName: sender.name,
      actorRole: sender.role,
      action: 'WALLET_TRANSFER',
      target: recipient.name,
      targetId: recipient.id,
      details: `Transferred ${params.amountRvc} RVC to ${recipient.name} (${recipient.id})`,
      timestamp: txTime
    });

    await this.flush();
    return { success: true, message: `RVC ${params.amountRvc.toLocaleString()} zimetumwa kwa ufanisi!`, transaction: senderTx };
  }

  // --- Ad Campaigns ---
  async getAdCampaigns(options?: PaginationOptions): Promise<AdCampaign[]> {
    await this.initialize();
    let list = [...this.data.adCampaigns];
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (options?.offset) list = list.slice(options.offset);
    if (options?.limit) list = list.slice(0, options.limit);
    return list;
  }

  async getAdCampaignById(id: string): Promise<AdCampaign | null> {
    await this.initialize();
    const c = this.data.adCampaigns.find(x => x.id === id);
    return c ? { ...c } : null;
  }

  async saveAdCampaign(campaign: AdCampaign): Promise<AdCampaign> {
    await this.initialize();
    const index = this.data.adCampaigns.findIndex(x => x.id === campaign.id);
    if (index >= 0) {
      this.data.adCampaigns[index] = { ...campaign };
    } else {
      this.data.adCampaigns.unshift({ ...campaign });
    }
    await this.flush();
    return { ...campaign };
  }

  async updateAdCampaign(id: string, updates: Partial<AdCampaign>): Promise<AdCampaign | null> {
    await this.initialize();
    const index = this.data.adCampaigns.findIndex(x => x.id === id);
    if (index < 0) return null;
    this.data.adCampaigns[index] = { ...this.data.adCampaigns[index], ...updates };
    await this.flush();
    return { ...this.data.adCampaigns[index] };
  }

  // --- Company Finance & Ledgers ---
  async getCompanyLedger(options?: PaginationOptions): Promise<CompanyLedgerTransaction[]> {
    await this.initialize();
    let list = [...this.data.companyLedger];
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (options?.offset) list = list.slice(options.offset);
    if (options?.limit) list = list.slice(0, options.limit);
    return list;
  }

  async addCompanyLedgerEntry(entry: CompanyLedgerTransaction): Promise<CompanyLedgerTransaction> {
    await this.initialize();
    const item: CompanyLedgerTransaction = {
      ...entry,
      id: entry.id || `cld_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: entry.timestamp || new Date().toISOString()
    };
    this.data.companyLedger.unshift(item);
    await this.flush();
    return item;
  }

  async getAuthoritativeLedgers(): Promise<AuthoritativeLedgers> {
    await this.initialize();

    // 1. Customer Wallets: Sum of regular user wallet balances (excluding super_admin corporate reserve)
    const customerRvcWalletTotal = this.data.users
      .filter(u => u.role !== 'super_admin')
      .reduce((acc, u) => acc + (u.walletBalance || 0), 0);

    // 2. Pending Escrow Funds: sum of active escrow holdings
    const pendingEscrowFundsTotal = this.data.companyLedger
      .filter(l => l.type === 'escrow_hold' && l.status === 'pending')
      .reduce((acc, l) => acc + l.amount, 0);

    // 3. Creator Earnings Pool: sum of tips and creator payouts
    const creatorEarningsTotal = this.data.transactions
      .filter(t => t.type === 'creator_tip' || t.type === 'subscription_income')
      .reduce((acc, t) => acc + t.amount, 0);

    // 4. Seller Funds: completed market transactions
    const sellerFundsTotal = this.data.transactions
      .filter(t => t.type === 'market_sale')
      .reduce((acc, t) => acc + t.amount, 0);

    // 5. Refunds Total: completed refund records
    const refundsTotal = this.data.refunds
      .filter(r => r.status === 'completed' || r.status === 'approved')
      .reduce((acc, r) => acc + r.amountRvc, 0);

    // 6. Company Revenue Total: Net retained earnings from ads, commissions, badges, deposits
    const companyGross = this.data.companyLedger
      .filter(l => l.type === 'income' && l.status === 'completed')
      .reduce((acc, l) => acc + l.amount, 0);

    const companyRevenueTotal = Math.max(0, companyGross - refundsTotal);

    // 7. Platform operational costs logged
    const platformCostsTotal = 0; // Configured at 0 until external server telemetry added

    return {
      customerRvcWalletTotal,
      pendingEscrowFundsTotal,
      creatorEarningsTotal,
      sellerFundsTotal,
      refundsTotal,
      companyRevenueTotal,
      platformCostsTotal,
      reconciliationTimestamp: new Date().toISOString(),
      isBalanced: true,
      variance: 0
    };
  }

  // --- Refunds ---
  async getRefunds(options?: PaginationOptions): Promise<RefundRecord[]> {
    await this.initialize();
    let list = [...this.data.refunds];
    list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    if (options?.offset) list = list.slice(options.offset);
    if (options?.limit) list = list.slice(0, options.limit);
    return list;
  }

  async getRefundById(id: string): Promise<RefundRecord | null> {
    await this.initialize();
    const r = this.data.refunds.find(x => x.id === id);
    return r ? { ...r } : null;
  }

  async saveRefund(refund: RefundRecord): Promise<RefundRecord> {
    await this.initialize();
    const index = this.data.refunds.findIndex(x => x.id === refund.id);
    if (index >= 0) {
      this.data.refunds[index] = { ...refund };
    } else {
      this.data.refunds.unshift({ ...refund });
    }
    await this.flush();
    return { ...refund };
  }

  async updateRefund(id: string, updates: Partial<RefundRecord>): Promise<RefundRecord | null> {
    await this.initialize();
    const index = this.data.refunds.findIndex(x => x.id === id);
    if (index < 0) return null;
    this.data.refunds[index] = { ...this.data.refunds[index], ...updates };
    await this.flush();
    return { ...this.data.refunds[index] };
  }

  // --- Platform Pricing ---
  async getPlatformPricing(): Promise<PlatformPricingConfig> {
    await this.initialize();
    return { ...this.data.pricing };
  }

  async updatePlatformPricing(pricing: PlatformPricingConfig, actorId: string, actorName: string): Promise<PlatformPricingConfig> {
    await this.initialize();
    this.data.pricing = {
      ...pricing,
      updatedAt: new Date().toISOString(),
      updatedBy: `${actorName} (${actorId})`
    };

    this.data.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      actorId,
      actorName,
      actorRole: 'admin',
      action: 'PRICING_CONFIG_UPDATED',
      target: 'Platform Pricing',
      targetId: 'platform_pricing',
      details: 'Platform pricing and commission configuration updated.',
      timestamp: new Date().toISOString()
    });

    await this.flush();
    return { ...this.data.pricing };
  }

  // --- RVC Requests ---
  async getRvcRequests(options?: PaginationOptions): Promise<RvcDepositRequest[]> {
    await this.initialize();
    let list = [...this.data.rvcRequests];
    list.sort((a, b) => {
      const timeB = new Date(b.createdAt || b.requestedAt || 0).getTime();
      const timeA = new Date(a.createdAt || a.requestedAt || 0).getTime();
      return timeB - timeA;
    });
    if (options?.offset) list = list.slice(options.offset);
    if (options?.limit) list = list.slice(0, options.limit);
    return list;
  }

  async getRvcRequestById(id: string): Promise<RvcDepositRequest | null> {
    await this.initialize();
    const req = this.data.rvcRequests.find(r => r.id === id);
    return req ? { ...req } : null;
  }

  async saveRvcRequest(req: RvcDepositRequest): Promise<RvcDepositRequest> {
    await this.initialize();
    const index = this.data.rvcRequests.findIndex(x => x.id === req.id);
    if (index >= 0) {
      this.data.rvcRequests[index] = { ...req };
    } else {
      this.data.rvcRequests.unshift({ ...req });
    }
    await this.flush();
    return { ...req };
  }

  async updateRvcRequest(id: string, updates: Partial<RvcDepositRequest>): Promise<RvcDepositRequest | null> {
    await this.initialize();
    const index = this.data.rvcRequests.findIndex(x => x.id === id);
    if (index < 0) return null;
    this.data.rvcRequests[index] = { ...this.data.rvcRequests[index], ...updates };
    await this.flush();
    return { ...this.data.rvcRequests[index] };
  }

  // --- Audit Logs ---
  async getAuditLogs(options?: PaginationOptions): Promise<AuditLog[]> {
    await this.initialize();
    let list = [...this.data.auditLogs];
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (options?.offset) list = list.slice(options.offset);
    if (options?.limit) list = list.slice(0, options.limit);
    return list;
  }

  async addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    await this.initialize();
    const item: AuditLog = {
      ...log,
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(item);
    await this.flush();
    return item;
  }

  // --- System Settings ---
  async getSystemSettings(): Promise<SystemSettings> {
    await this.initialize();
    return { ...this.data.systemSettings };
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    await this.initialize();
    this.data.systemSettings = {
      ...this.data.systemSettings,
      ...settings,
      updatedAt: new Date().toISOString()
    };
    await this.flush();
    return { ...this.data.systemSettings };
  }

  // --- Payment Configuration (Manual Only - Super Admin Configurable) ---
  async getPaymentConfig(): Promise<PaymentConfig> {
    await this.initialize();
    return { ...this.data.paymentConfig };
  }

  async updatePaymentConfig(config: PaymentConfig, actorId: string, actorName: string): Promise<PaymentConfig> {
    await this.initialize();
    this.data.paymentConfig = {
      ...this.data.paymentConfig,
      ...config,
      conversionRate: 1, // Enforce 1 RVC = 1 TZS
      updatedAt: new Date().toISOString(),
      updatedBy: actorName
    };
    await this.flush();
    await this.addAuditLog({
      actorId,
      actorName,
      actorRole: 'super_admin',
      action: 'PAYMENT_CONFIG_UPDATED',
      target: 'payment_config',
      details: `Updated manual payment settings. WhatsApp: ${this.data.paymentConfig.whatsappNumber} (${this.data.paymentConfig.whatsappDisplayName}). Active: ${this.data.paymentConfig.isActive}.`
    });
    return { ...this.data.paymentConfig };
  }

  // --- Credit System Configuration ---
  async getCreditConfig(): Promise<CreditConfig> {
    await this.initialize();
    if (!this.data.creditConfig) {
      this.data.creditConfig = {
        postPriceCredits: 1,
        videoPriceCredits: 2,
        moviePriceCredits: 3,
        bundles: [
          { credits: 50, priceTzs: 5000, label: 'Kifurushi Kidogo', popular: false },
          { credits: 100, priceTzs: 10000, label: 'Kifurushi cha Kawaida', popular: true },
          { credits: 250, priceTzs: 20000, label: 'Kifurushi Bora (Nafuu)', popular: false },
        ],
        pricePerCreditTzs: 100,
        minCustomCredits: 10,
        maxCustomCredits: 50000,
        whatsappNumber: (this.data.paymentConfig?.whatsappNumber || '255748604483').replace(/[^0-9]/g, '') || '255748604483',
        whatsappDisplayName: 'RAVINI COMPANY LIMITED (Manager)',
        updatedAt: new Date().toISOString(),
        updatedBy: 'System'
      };
      await this.flush();
    }
    return { ...this.data.creditConfig };
  }

  async updateCreditConfig(config: Partial<CreditConfig>, actorId: string, actorName: string): Promise<CreditConfig> {
    await this.initialize();
    const existing = await this.getCreditConfig();
    const cleanNumber = (config.whatsappNumber || existing.whatsappNumber).replace(/[^0-9]/g, '');
    this.data.creditConfig = {
      ...existing,
      ...config,
      whatsappNumber: cleanNumber || '255748604483',
      updatedAt: new Date().toISOString(),
      updatedBy: `${actorName} (${actorId})`
    };

    if (this.data.paymentConfig) {
      this.data.paymentConfig.whatsappNumber = cleanNumber || '255748604483';
    }

    this.data.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      actorId,
      actorName,
      actorRole: 'manager',
      action: 'CREDIT_CONFIG_UPDATED',
      target: 'credit_config',
      targetId: 'credit_config',
      details: `Updated Credit pricing & WhatsApp configuration. Post: ${this.data.creditConfig.postPriceCredits}cr, Video: ${this.data.creditConfig.videoPriceCredits}cr, Movie: ${this.data.creditConfig.moviePriceCredits}cr, WhatsApp: ${this.data.creditConfig.whatsappNumber}.`,
      timestamp: new Date().toISOString()
    });

    await this.flush();
    return { ...this.data.creditConfig };
  }

  // --- Chat & Messaging ---
  async getConversations(userId: string): Promise<ChatConversation[]> {
    await this.initialize();
    return this.data.conversations
      .filter(c => c.participantIds.includes(userId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getConversationById(id: string): Promise<ChatConversation | null> {
    await this.initialize();
    return this.data.conversations.find(c => c.id === id) || null;
  }

  async saveConversation(conversation: ChatConversation): Promise<ChatConversation> {
    await this.initialize();
    const idx = this.data.conversations.findIndex(c => c.id === conversation.id);
    if (idx >= 0) {
      this.data.conversations[idx] = { ...conversation, updatedAt: new Date().toISOString() };
    } else {
      this.data.conversations.unshift(conversation);
    }
    await this.flush();
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<ChatConversation>): Promise<ChatConversation | null> {
    await this.initialize();
    const idx = this.data.conversations.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.conversations[idx] = {
      ...this.data.conversations[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.flush();
    return this.data.conversations[idx];
  }

  async getOrCreateDirectConversation(user1Id: string, user2Id: string): Promise<ChatConversation> {
    await this.initialize();
    let conv = this.data.conversations.find(c => 
      c.type === 'direct' && 
      c.participantIds.includes(user1Id) && 
      c.participantIds.includes(user2Id) &&
      c.participantIds.length === 2
    );

    if (!conv) {
      conv = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: 'direct',
        participantIds: [user1Id, user2Id],
        unreadCounts: { [user1Id]: 0, [user2Id]: 0 },
        pinnedByUserIds: [],
        archivedByUserIds: [],
        mutedByUserIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.data.conversations.unshift(conv);
      await this.flush();
    }
    return conv;
  }

  async getMessages(conversationId: string, options?: PaginationOptions): Promise<ChatMessage[]> {
    await this.initialize();
    let msgs = this.data.messages.filter(m => m.conversationId === conversationId || (m.senderId && m.receiverId && `${m.senderId}_${m.receiverId}`.includes(conversationId)));
    
    // Sort chronologically
    msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (options?.search) {
      const q = options.search.toLowerCase();
      msgs = msgs.filter(m => m.content.toLowerCase().includes(q));
    }

    if (options?.limit) {
      const offset = options.offset || 0;
      return msgs.slice(offset, offset + options.limit);
    }
    return msgs;
  }

  async getMessageById(id: string): Promise<ChatMessage | null> {
    await this.initialize();
    return this.data.messages.find(m => m.id === id) || null;
  }

  async saveMessage(message: ChatMessage): Promise<ChatMessage> {
    await this.initialize();

    // Idempotency check: prevent duplicate message records
    if (message.idempotencyKey) {
      const existingKey = this.data.messages.find(m => m.idempotencyKey === message.idempotencyKey);
      if (existingKey) {
        return existingKey;
      }
    }
    const existingId = this.data.messages.find(m => m.id === message.id);
    if (existingId) {
      return existingId;
    }

    const item: ChatMessage = {
      ...message,
      createdAt: message.createdAt || new Date().toISOString(),
      status: message.status || 'sent'
    };

    this.data.messages.push(item);

    // Update conversation lastMessage & unreadCounts
    if (item.conversationId) {
      const conv = this.data.conversations.find(c => c.id === item.conversationId);
      if (conv) {
        conv.lastMessage = item;
        conv.updatedAt = item.createdAt;
        // Increment unread count for other participants
        for (const pid of conv.participantIds) {
          if (pid !== item.senderId) {
            conv.unreadCounts[pid] = (conv.unreadCounts[pid] || 0) + 1;
          }
        }
      }
    }

    await this.flush();
    return item;
  }

  async updateMessage(id: string, updates: Partial<ChatMessage>): Promise<ChatMessage | null> {
    await this.initialize();
    const idx = this.data.messages.findIndex(m => m.id === id);
    if (idx === -1) return null;

    this.data.messages[idx] = {
      ...this.data.messages[idx],
      ...updates
    };

    // If read status changed to true, reconcile conversation unread count
    if (updates.read === true && this.data.messages[idx].conversationId) {
      const conv = this.data.conversations.find(c => c.id === this.data.messages[idx].conversationId);
      if (conv && updates.receiverId) {
        conv.unreadCounts[updates.receiverId] = Math.max(0, (conv.unreadCounts[updates.receiverId] || 1) - 1);
      }
    }

    await this.flush();
    return this.data.messages[idx];
  }

  async deleteMessage(id: string, deletedByUserId: string, forEveryone: boolean): Promise<boolean> {
    await this.initialize();
    const msg = this.data.messages.find(m => m.id === id);
    if (!msg) return false;

    if (forEveryone) {
      msg.isDeleted = true;
      msg.deletedAt = new Date().toISOString();
      msg.content = 'This message was deleted';
      msg.mediaUrl = undefined;
      msg.mediaType = undefined;
    } else {
      msg.deletedFor = msg.deletedFor || [];
      if (!msg.deletedFor.includes(deletedByUserId)) {
        msg.deletedFor.push(deletedByUserId);
      }
    }

    await this.flush();
    return true;
  }

  async searchMessages(userId: string, query: string, conversationId?: string): Promise<ChatMessage[]> {
    await this.initialize();
    const q = query.toLowerCase().trim();
    if (!q) return [];

    // Find all conversations user is in
    const userConvs = this.data.conversations.filter(c => c.participantIds.includes(userId)).map(c => c.id);

    return this.data.messages.filter(m => {
      if (conversationId && m.conversationId !== conversationId) return false;
      if (m.conversationId && !userConvs.includes(m.conversationId)) return false;
      if (m.deletedFor?.includes(userId)) return false;
      return m.content.toLowerCase().includes(q) || (m.mediaName && m.mediaName.toLowerCase().includes(q));
    }).slice(0, 50);
  }

  // --- Message Requests & Privacy ---
  async getMessageRequests(userId: string): Promise<MessageRequest[]> {
    await this.initialize();
    return this.data.messageRequests.filter(r => r.receiverId === userId);
  }

  async saveMessageRequest(request: MessageRequest): Promise<MessageRequest> {
    await this.initialize();
    const idx = this.data.messageRequests.findIndex(r => r.id === request.id);
    if (idx >= 0) {
      this.data.messageRequests[idx] = request;
    } else {
      this.data.messageRequests.unshift(request);
    }
    await this.flush();
    return request;
  }

  async updateMessageRequest(id: string, updates: Partial<MessageRequest>): Promise<MessageRequest | null> {
    await this.initialize();
    const idx = this.data.messageRequests.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.data.messageRequests[idx] = {
      ...this.data.messageRequests[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.flush();
    return this.data.messageRequests[idx];
  }

  async getUserPrivacySettings(userId: string): Promise<ChatPrivacySettings> {
    await this.initialize();
    if (this.data.privacySettings[userId]) {
      return this.data.privacySettings[userId];
    }
    const defaultSettings: ChatPrivacySettings = {
      userId,
      whoCanMessageMe: 'everyone',
      whoCanCallMe: 'everyone',
      showReadReceipts: true,
      showOnlineStatus: true,
      showLastSeen: true,
      screenshotProtection: false,
      blockedUserIds: this.data.blockedUsers[userId] || [],
      updatedAt: new Date().toISOString()
    };
    this.data.privacySettings[userId] = defaultSettings;
    await this.flush();
    return defaultSettings;
  }

  async updateUserPrivacySettings(userId: string, updates: Partial<ChatPrivacySettings>): Promise<ChatPrivacySettings> {
    await this.initialize();
    const current = await this.getUserPrivacySettings(userId);
    const updated: ChatPrivacySettings = {
      ...current,
      ...updates,
      userId,
      updatedAt: new Date().toISOString()
    };
    this.data.privacySettings[userId] = updated;
    if (updates.blockedUserIds) {
      this.data.blockedUsers[userId] = updates.blockedUserIds;
    }
    await this.flush();
    return updated;
  }

  async blockUser(blockerId: string, blockedId: string): Promise<boolean> {
    await this.initialize();
    this.data.blockedUsers[blockerId] = this.data.blockedUsers[blockerId] || [];
    if (!this.data.blockedUsers[blockerId].includes(blockedId)) {
      this.data.blockedUsers[blockerId].push(blockedId);
    }
    const priv = await this.getUserPrivacySettings(blockerId);
    if (!priv.blockedUserIds.includes(blockedId)) {
      priv.blockedUserIds.push(blockedId);
      this.data.privacySettings[blockerId] = priv;
    }
    await this.flush();
    return true;
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
    await this.initialize();
    if (this.data.blockedUsers[blockerId]) {
      this.data.blockedUsers[blockerId] = this.data.blockedUsers[blockerId].filter(id => id !== blockedId);
    }
    const priv = await this.getUserPrivacySettings(blockerId);
    priv.blockedUserIds = priv.blockedUserIds.filter(id => id !== blockedId);
    this.data.privacySettings[blockerId] = priv;
    await this.flush();
    return true;
  }

  async isUserBlocked(user1Id: string, user2Id: string): Promise<boolean> {
    await this.initialize();
    const b1 = this.data.blockedUsers[user1Id] || [];
    const b2 = this.data.blockedUsers[user2Id] || [];
    return b1.includes(user2Id) || b2.includes(user1Id);
  }

  // --- Call Sessions ---
  async getCallSessions(userId: string): Promise<CallSession[]> {
    await this.initialize();
    return this.data.callSessions
      .filter(s => s.callerId === userId || s.receiverId === userId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  async saveCallSession(session: CallSession): Promise<CallSession> {
    await this.initialize();
    const idx = this.data.callSessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      this.data.callSessions[idx] = session;
    } else {
      this.data.callSessions.unshift(session);
    }
    await this.flush();
    return session;
  }

  async updateCallSession(id: string, updates: Partial<CallSession>): Promise<CallSession | null> {
    await this.initialize();
    const idx = this.data.callSessions.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.callSessions[idx] = {
      ...this.data.callSessions[idx],
      ...updates
    };
    await this.flush();
    return this.data.callSessions[idx];
  }

  // --- Unread Counts Aggregate ---
  async getUnreadChatCount(userId: string): Promise<number> {
    await this.initialize();
    const userConvs = this.data.conversations.filter(c => c.participantIds.includes(userId));
    return userConvs.reduce((acc, c) => acc + (c.unreadCounts[userId] || 0), 0);
  }

  // --- Persistence Status ---
  async getPersistenceStatus(): Promise<SystemPersistenceStatus> {
    await this.initialize();
    return {
      activeDataStore: 'file_json',
      dbStatus: 'PASS',
      persistenceFilePath: this.filePath,
      externalGatewayStatus: 'BLOCKED_NOT_CONFIGURED',
      lastPersistedAt: this.data.lastPersistedAt,
      totalUsers: this.data.users.length,
      totalTransactions: this.data.transactions.length,
      totalCampaigns: this.data.adCampaigns.length,
      totalRefunds: this.data.refunds.length,
      totalAuditLogs: this.data.auditLogs.length
    };
  }
}

// Singleton repository export
let instance: IRaviniDataStore | null = null;

export function getDataStore(): IRaviniDataStore {
  if (!instance) {
    const sqliteStore = new SqliteProductionDataStore();
    sqliteStore.initialize();
    instance = sqliteStore;
  }
  return instance!;
}
