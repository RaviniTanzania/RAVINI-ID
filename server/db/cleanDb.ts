import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  CleanUser,
  BusinessApplication,
  SokoniProduct,
  WingaAd,
  MovieItem,
  FundiListing,
  CreditTransaction,
  AuditLog,
  NotificationItem,
  SystemConfig,
  UserRole
} from '../types/raviniTypes';

interface DatabaseSchema {
  users: CleanUser[];
  applications: BusinessApplication[];
  products: SokoniProduct[];
  ads: WingaAd[];
  movies: MovieItem[];
  fundis: FundiListing[];
  transactions: CreditTransaction[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  config: SystemConfig;
}

const DEFAULT_CONFIG: SystemConfig = {
  platformName: 'RAVINI',
  companyName: 'RAVINI COMPANY LIMITED',
  whatsappNumber: '255748604483',
  postPriceCredits: 1,
  videoPriceCredits: 2,
  moviePriceCredits: 3,
  bundles: [
    { credits: 50, priceTzs: 5000, label: '50 Credits (TZS 5,000)' },
    { credits: 100, priceTzs: 10000, label: '100 Credits (TZS 10,000)' },
    { credits: 250, priceTzs: 20000, label: '250 Credits (TZS 20,000)' }
  ],
  termsAndConditions: 'Jukwaa la RAVINI linaendeshwa na RAVINI COMPANY LIMITED nchini Tanzania. Malipo yote ya kuongeza salio la credits hufanyika moja kwa moja kwa uthibitisho wa manual kupitia WhatsApp rasmi ya Msimamizi Mkuu.'
};

export class CleanDatabase {
  private static instance: CleanDatabase;
  private filePath: string;
  private data: DatabaseSchema;
  private initialized: boolean = false;

  private constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, 'ravini_clean_db.json');
    this.data = {
      users: [],
      applications: [],
      products: [],
      ads: [],
      movies: [],
      fundis: [],
      transactions: [],
      auditLogs: [],
      notifications: [],
      config: DEFAULT_CONFIG
    };
  }

  public static getInstance(): CleanDatabase {
    if (!CleanDatabase.instance) {
      CleanDatabase.instance = new CleanDatabase();
    }
    return CleanDatabase.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || [],
          applications: parsed.applications || [],
          products: parsed.products || [],
          ads: parsed.ads || [],
          movies: parsed.movies || [],
          fundis: parsed.fundis || [],
          transactions: parsed.transactions || [],
          auditLogs: parsed.auditLogs || [],
          notifications: parsed.notifications || [],
          config: parsed.config || DEFAULT_CONFIG
        };
      } catch (err) {
        console.error('[RAVINI DB] Failed to parse existing database file, reinitializing cleanly:', err);
      }
    }

    // Enforce EXACTLY ONE Canonical SUPER_ADMIN (255748604483)
    const canonicalPhone = '255748604483';
    let superAdmin = this.data.users.find(u => u.phone === canonicalPhone || u.role === 'SUPER_ADMIN');

    if (!superAdmin) {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync('1234', salt);
      superAdmin = {
        id: 'usr_baraka_mabula',
        firstName: 'Baraka',
        lastName: 'Mabula',
        name: 'Baraka Mabula',
        phone: canonicalPhone,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        businessApproved: true,
        permissions: [
          'REVIEW_APPLICATIONS',
          'REVIEW_ADS',
          'REVIEW_MOVIES',
          'MODERATE_CONTENT',
          'VIEW_REPORTS'
        ],
        status: 'ACTIVE',
        walletBalance: 0,
        createdAt: new Date().toISOString()
      };
      this.data.users = [superAdmin];
      this.persistSync();
      console.log('[RAVINI DB] Initialized Clean Production Database with 1 Canonical SUPER_ADMIN (Baraka Mabula - 255748604483).');
    } else {
      // Ensure canonical phone, role, and active status are preserved
      superAdmin.phone = canonicalPhone;
      superAdmin.role = 'SUPER_ADMIN';
      superAdmin.status = 'ACTIVE';
      this.persistSync();
    }

    this.initialized = true;
  }

  private persistSync(): void {
    try {
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('[RAVINI DB] Persistence error:', err);
    }
  }

  // --- USER OPERATIONS ---
  public async getUsers(): Promise<CleanUser[]> {
    return [...this.data.users];
  }

  public async getUserById(id: string): Promise<CleanUser | undefined> {
    return this.data.users.find(u => u.id === id);
  }

  public async getUserByPhone(phone: string): Promise<CleanUser | undefined> {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return this.data.users.find(u => u.phone.replace(/[^0-9]/g, '') === cleanPhone);
  }

  public async saveUser(user: CleanUser): Promise<CleanUser> {
    const index = this.data.users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      this.data.users[index] = { ...this.data.users[index], ...user, updatedAt: new Date().toISOString() };
    } else {
      this.data.users.unshift(user);
    }
    this.persistSync();
    return user;
  }

  public async deleteUser(id: string): Promise<boolean> {
    const user = this.data.users.find(u => u.id === id);
    if (!user || user.role === 'SUPER_ADMIN' || user.phone === '255748604483') {
      return false; // Cannot delete canonical Super Admin
    }
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.persistSync();
    return true;
  }

  // --- BUSINESS APPLICATIONS ---
  public async getApplications(status?: string): Promise<BusinessApplication[]> {
    if (status) {
      return this.data.applications.filter(a => a.status === status);
    }
    return [...this.data.applications];
  }

  public async getApplicationById(id: string): Promise<BusinessApplication | undefined> {
    return this.data.applications.find(a => a.id === id);
  }

  public async getUserApplications(userId: string): Promise<BusinessApplication[]> {
    return this.data.applications.filter(a => a.userId === userId);
  }

  public async saveApplication(app: BusinessApplication): Promise<BusinessApplication> {
    const index = this.data.applications.findIndex(a => a.id === app.id);
    if (index >= 0) {
      this.data.applications[index] = app;
    } else {
      this.data.applications.unshift(app);
    }
    this.persistSync();
    return app;
  }

  // --- SOKONI PRODUCTS ---
  public async getProducts(filter?: { status?: string; vendorId?: string }): Promise<SokoniProduct[]> {
    return this.data.products.filter(p => {
      if (filter?.status && p.status !== filter.status) return false;
      if (filter?.vendorId && p.vendorId !== filter.vendorId) return false;
      return true;
    });
  }

  public async getProductById(id: string): Promise<SokoniProduct | undefined> {
    return this.data.products.find(p => p.id === id);
  }

  public async saveProduct(product: SokoniProduct): Promise<SokoniProduct> {
    const index = this.data.products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      this.data.products[index] = product;
    } else {
      this.data.products.unshift(product);
    }
    this.persistSync();
    return product;
  }

  // --- WINGA ADS ---
  public async getAds(filter?: { status?: string; wingaId?: string }): Promise<WingaAd[]> {
    return this.data.ads.filter(a => {
      if (filter?.status && a.status !== filter.status) return false;
      if (filter?.wingaId && a.wingaId !== filter.wingaId) return false;
      return true;
    });
  }

  public async getAdById(id: string): Promise<WingaAd | undefined> {
    return this.data.ads.find(a => a.id === id);
  }

  public async saveAd(ad: WingaAd): Promise<WingaAd> {
    const index = this.data.ads.findIndex(a => a.id === ad.id);
    if (index >= 0) {
      this.data.ads[index] = ad;
    } else {
      this.data.ads.unshift(ad);
    }
    this.persistSync();
    return ad;
  }

  // --- MOVIES ---
  public async getMovies(filter?: { status?: string; sellerId?: string }): Promise<MovieItem[]> {
    return this.data.movies.filter(m => {
      if (filter?.status && m.status !== filter.status) return false;
      if (filter?.sellerId && m.sellerId !== filter.sellerId) return false;
      return true;
    });
  }

  public async getMovieById(id: string): Promise<MovieItem | undefined> {
    return this.data.movies.find(m => m.id === id);
  }

  public async saveMovie(movie: MovieItem): Promise<MovieItem> {
    const index = this.data.movies.findIndex(m => m.id === movie.id);
    if (index >= 0) {
      this.data.movies[index] = movie;
    } else {
      this.data.movies.unshift(movie);
    }
    this.persistSync();
    return movie;
  }

  // --- FUNDIS ---
  public async getFundis(filter?: { status?: string }): Promise<FundiListing[]> {
    return this.data.fundis.filter(f => {
      if (filter?.status && f.status !== filter.status) return false;
      return true;
    });
  }

  public async saveFundi(fundi: FundiListing): Promise<FundiListing> {
    const index = this.data.fundis.findIndex(f => f.id === fundi.id);
    if (index >= 0) {
      this.data.fundis[index] = fundi;
    } else {
      this.data.fundis.unshift(fundi);
    }
    this.persistSync();
    return fundi;
  }

  // --- CREDIT TRANSACTIONS & LEDGER ---
  public async getTransactions(userId?: string): Promise<CreditTransaction[]> {
    if (userId) {
      return this.data.transactions.filter(t => t.userId === userId);
    }
    return [...this.data.transactions];
  }

  public async addTransaction(tx: CreditTransaction): Promise<CreditTransaction> {
    this.data.transactions.unshift(tx);
    this.persistSync();
    return tx;
  }

  // --- ATOMIC CREDIT OPERATIONS (Section 44) ---
  public async deductCredits(
    userId: string,
    amount: number,
    params: {
      actorId: string;
      actorName: string;
      actorRole: UserRole;
      reference: string;
      reason: string;
      relatedAction?: string;
      relatedId?: string;
    }
  ): Promise<{ success: boolean; newBalance?: number; error?: string; code?: string; transaction?: CreditTransaction }> {
    if (!amount || amount <= 0) {
      return { success: false, error: 'Kiasi cha credits lazima kiwe nambari chanya.', code: 'INVALID_AMOUNT' };
    }

    const user = this.data.users.find(u => u.id === userId);
    if (!user) {
      return { success: false, error: 'Mtumiaji hakupatikana.', code: 'USER_NOT_FOUND' };
    }

    // Idempotency: avoid double-deducting identical reference
    const cleanRef = params.reference.trim();
    if (this.data.transactions.some(t => t.reference === cleanRef)) {
      return { success: false, error: 'Muamala huu tayari ulishakatwa awali.', code: 'DUPLICATE_REFERENCE' };
    }

    const currentBalance = user.walletBalance || 0;
    if (currentBalance < amount) {
      return {
        success: false,
        error: `Salio halitoshi. Unahitaji Credits ${amount}, lakini unazo Credits ${currentBalance}.`,
        code: 'INSUFFICIENT_CREDITS'
      };
    }

    const balanceBefore = currentBalance;
    const balanceAfter = balanceBefore - amount;
    if (balanceAfter < 0) {
      return { success: false, error: 'Salio haliwezi kuwa hasi chini ya 0.', code: 'NEGATIVE_BALANCE_PREVENTED' };
    }

    user.walletBalance = balanceAfter;
    user.updatedAt = new Date().toISOString();

    const tx: CreditTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      userName: user.name,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      type: 'DEDUCTION',
      amount,
      balanceBefore,
      balanceAfter,
      reference: cleanRef,
      reason: params.reason,
      relatedAction: params.relatedAction,
      relatedId: params.relatedId,
      timestamp: new Date().toISOString()
    };

    this.data.transactions.unshift(tx);
    this.persistSync();

    return { success: true, newBalance: balanceAfter, transaction: tx };
  }

  public async addCredits(
    userId: string,
    amount: number,
    params: {
      actorId: string;
      actorName: string;
      actorRole: UserRole;
      reference?: string;
      reason: string;
      relatedAction?: string;
    }
  ): Promise<{ success: boolean; newBalance?: number; error?: string; code?: string; transaction?: CreditTransaction }> {
    if (!amount || amount <= 0) {
      return { success: false, error: 'Kiasi cha credits lazima kiwe nambari chanya.', code: 'INVALID_AMOUNT' };
    }

    const user = this.data.users.find(u => u.id === userId);
    if (!user) {
      return { success: false, error: 'Mtumiaji hakupatikana.', code: 'USER_NOT_FOUND' };
    }

    const cleanRef = (params.reference || `MANUAL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`).trim();
    if (this.data.transactions.some(t => t.reference === cleanRef)) {
      return {
        success: false,
        error: `Muamala wenye kumbukumbu "${cleanRef}" tayari ulishaongezwa awali.`,
        code: 'DUPLICATE_REFERENCE'
      };
    }

    const balanceBefore = user.walletBalance || 0;
    const balanceAfter = balanceBefore + Math.floor(amount);
    user.walletBalance = balanceAfter;
    user.updatedAt = new Date().toISOString();

    const tx: CreditTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      userName: user.name,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      type: 'MANUAL_TOP_UP',
      amount: Math.floor(amount),
      balanceBefore,
      balanceAfter,
      reference: cleanRef,
      reason: params.reason,
      relatedAction: params.relatedAction,
      timestamp: new Date().toISOString()
    };

    this.data.transactions.unshift(tx);
    this.persistSync();

    return { success: true, newBalance: balanceAfter, transaction: tx };
  }

  // --- AUDIT LOGS ---
  public async getAuditLogs(limit: number = 200): Promise<AuditLog[]> {
    return this.data.auditLogs.slice(0, limit);
  }

  public async addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const fullLog: AuditLog = {
      ...log,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(fullLog);
    this.persistSync();
    return fullLog;
  }

  // --- NOTIFICATIONS ---
  public async getNotifications(userId: string): Promise<NotificationItem[]> {
    return this.data.notifications.filter(n => n.userId === userId);
  }

  public async addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>): Promise<NotificationItem> {
    const fullNotif: NotificationItem = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(fullNotif);
    this.persistSync();
    return fullNotif;
  }

  public async markNotificationRead(id: string, userId: string): Promise<boolean> {
    const notif = this.data.notifications.find(n => n.id === id && n.userId === userId);
    if (notif) {
      notif.read = true;
      this.persistSync();
      return true;
    }
    return false;
  }

  // --- SYSTEM CONFIG ---
  public async getConfig(): Promise<SystemConfig> {
    return { ...this.data.config };
  }

  public async updateConfig(newConfig: Partial<SystemConfig>): Promise<SystemConfig> {
    this.data.config = { ...this.data.config, ...newConfig };
    this.persistSync();
    return { ...this.data.config };
  }
}

export const getCleanDb = () => CleanDatabase.getInstance();
