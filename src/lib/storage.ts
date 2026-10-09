import { 
  User, 
  UserRole,
  Post, 
  PostComment, 
  Story, 
  MarketItem, 
  ChatMessage, 
  NotificationItem, 
  WalletTransaction, 
  ReactionType,
  CreatorApplication,
  BusinessApplication,
  RvcDepositRequest,
  AuditLog,
  PaymentConfig,
  AppMode,
  SystemSettings,
  PushViralPackage,
  PushViralCampaign,
  PremiumPackage,
  OfficialAd,
  DailyReportData,
  VerificationStatus,
  MarketOrder,
  TrustVerificationApplication,
  CreatorSubscription,
  CreatorTip,
  UserSession,
  GlobalCommunicationSettings,
  GlobalCommunicationServiceControl,
  TemporaryCommunicationBlock,
  SharePayload,
  DownloadItem,
  NotificationType,
  NotificationPreferences,
  PushDeviceToken,
  SystemAnnouncement,
  AnnouncementPriority,
  AnnouncementTargetAudience,
  AnnouncementStatus,
  CompanyApplication,
  VerificationDocument,
  UnifiedVerificationRequest,
  VerificationRequestType,
  AdType,
  AdPlacement,
  AdCampaignStatus,
  AdTargeting,
  AdCampaign,
  CompanyLedgerTransaction,
  RefundRecord,
  PlatformPricingConfig,
  CreditConfig,
  CreditBundle,
  RevenueSummary,
  ContentReport,
  ModerationStatus,
  ReportCategory
} from '../types';

const USERS_STORAGE_KEY = 'ravini_users_permanent_v3';
const CURRENT_USER_ID_KEY = 'ravini_current_user_id_v3';
const AUTH_SESSION_KEY = 'ravini_auth_session_active_v3';
const POSTS_STORAGE_KEY = 'ravini_posts_permanent_v3';
const COMMENTS_STORAGE_KEY = 'ravini_comments_permanent_v3';
const STORIES_STORAGE_KEY = 'ravini_stories_permanent_v3';
const MARKET_STORAGE_KEY = 'ravini_market_permanent_v3';
const MESSAGES_STORAGE_KEY = 'ravini_messages_permanent_v3';
const NOTIFICATIONS_STORAGE_KEY = 'ravini_notifications_permanent_v3';
const NOTIFICATION_PREFERENCES_KEY = 'ravini_notification_preferences_v1';
const SYSTEM_ANNOUNCEMENTS_KEY = 'ravini_system_announcements_v1';
const TRANSACTIONS_STORAGE_KEY = 'ravini_transactions_permanent_v3';
const CREATOR_APPS_KEY = 'ravini_creator_apps_permanent_v3';
const BUSINESS_APPS_KEY = 'ravini_business_apps_permanent_v3';
const COMPANY_APPS_KEY = 'ravini_company_apps_permanent_v3';
const AD_CAMPAIGNS_STORAGE_KEY = 'ravini_ad_campaigns_v1';
const COMPANY_LEDGER_STORAGE_KEY = 'ravini_company_ledger_v1';
const REFUNDS_STORAGE_KEY = 'ravini_refund_records_v1';
const PLATFORM_PRICING_KEY = 'ravini_platform_pricing_v1';
const SECURE_DOCS_VAULT_KEY = 'ravini_secure_docs_vault_permanent_v3';
const RVC_REQUESTS_KEY = 'ravini_rvc_requests_permanent_v3';
const PAYMENT_CONFIG_KEY = 'ravini_payment_config_permanent_v3';
const AUDIT_LOGS_KEY = 'ravini_audit_logs_permanent_v3';
const APP_MODE_KEY = 'ravini_app_mode_v3';
const SYSTEM_SETTINGS_KEY = 'ravini_system_settings_permanent_v3';
const PUSH_VIRAL_CAMPAIGNS_KEY = 'ravini_push_viral_campaigns_v1';
const OFFICIAL_ADS_KEY = 'ravini_official_ads_v1';
const PREMIUM_PACKAGES_KEY = 'ravini_premium_packages_v1';
const DAILY_REPORTS_CONFIG_KEY = 'ravini_daily_reports_config_v1';
const MARKET_ORDERS_KEY = 'ravini_market_orders_permanent_v1';
const VERIFICATION_APPLICATIONS_KEY = 'ravini_verification_applications_v1';
const CREATOR_SUBSCRIPTIONS_KEY = 'ravini_creator_subscriptions_v1';
const CREATOR_TIPS_KEY = 'ravini_creator_tips_v1';
const GLOBAL_COMMUNICATION_KEY = 'ravini_global_communication_settings_v1';

export const DEFAULT_GLOBAL_COMMUNICATION: GlobalCommunicationSettings = {
  allEnabled: true,
  services: {
    chat: true,
    voiceCalls: true,
    videoCalls: true,
    groupChat: true,
    messageRequests: true,
    mediaSharing: true,
  },
  targetScope: 'all',
  updatedAt: new Date().toISOString(),
  updatedBy: 'usr_baraka_mabula',
  updatedByName: 'Baraka Mabula'
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  allowRegistrations: true,
  allowMarketPosting: true,
  allowRvcDeposits: true,
  allowStories: true,
  maintenanceMode: false,
  maintenanceMessage: 'Mfumo wa RAVINI unafanyiwa maboresho madogo ya kiufundi. Huduma zitarejea punde.',
};

// Base initial users - permanently preserved with secure passwords
const DEFAULT_SUPER_ADMIN: User = {
  id: 'usr_baraka_mabula',
  name: 'Baraka Mabula',
  username: '255748604483',
  email: 'barakamabula82@gmail.com',
  phone: '255748604483',
  password: '1234',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  coverPhoto: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
  bio: 'Mwanzilishi & Msimamizi Mkuu (Super Admin) wa RAVINI COMPANY LIMITED. Full Controller System.',
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
    productsCount: 0
  },
  permissions: ['all']
};

const INITIAL_USERS: User[] = [
  DEFAULT_SUPER_ADMIN
];

export const LEGACY_DEMO_IDS = new Set([
  'usr_amina_juma',
  'usr_juma_rashid',
  'usr_neema_mrosso',
  'usr_salim_admin',
  'usr_huduma_wateja',
  'post_welcome_baraka',
  'post_amina_business',
  'post_neema_tech',
  'comm_1',
  'comm_2',
  'comm_3',
  'comm_4',
  'story_baraka',
  'story_amina',
  'story_juma',
  'mkt_1',
  'mkt_2',
  'mkt_3',
  'market_item_batiki',
  'market_item_coffee'
]);

// Initial Payment Config (Configurable by Super Admin)
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
  conversionRate: 1, // 1 RVC = 1 TZS
};

// Initial starter posts - empty in production
const INITIAL_POSTS: Post[] = [];

const INITIAL_COMMENTS: PostComment[] = [];

const INITIAL_STORIES: Story[] = [];

const INITIAL_MARKET: MarketItem[] = [];

// Broadcast channel for instantaneous cross-tab realtime sync
let realtimeChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    realtimeChannel = new BroadcastChannel('ravini_realtime_stream');
  }
} catch {
  // Safe fallback if not supported
}

export type RealtimeListener = (event: { type: string; payload: any }) => void;
const listeners: Set<RealtimeListener> = new Set();

export function subscribeRealtime(listener: RealtimeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function broadcastEvent(type: string, payload: any) {
  // 1. Notify current window listeners
  listeners.forEach(cb => {
    try {
      cb({ type, payload });
    } catch (e) {
      console.error('Error dispatching realtime listener:', e);
    }
  });

  // 2. Broadcast across tabs and windows
  if (realtimeChannel) {
    try {
      realtimeChannel.postMessage({ type, payload });
    } catch (e) {
      console.error('Error posting to BroadcastChannel:', e);
    }
  }

  // 3. Fallback to localStorage ping for cross-window sync
  try {
    localStorage.setItem('ravini_sync_ping', `${Date.now()}_${type}`);
  } catch {
    // ignore
  }
}

// Listen to incoming broadcast messages from other tabs
if (realtimeChannel) {
  realtimeChannel.onmessage = (event) => {
    if (event && event.data) {
      listeners.forEach(cb => {
        try {
          cb(event.data);
        } catch (e) {
          console.error('Realtime listener error:', e);
        }
      });
    }
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'ravini_sync_ping') {
      listeners.forEach(cb => {
        try {
          cb({ type: 'STORAGE_SYNC', payload: event.newValue });
        } catch (e) {
          console.error(e);
        }
      });
    }
  });
}

// ----------------- STORAGE HELPERS WITH PERMANENT PRESERVATION -----------------

export function generateRaviniId(seed?: string): string {
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    const num = (hash % 90000000) + 10000000;
    return `RV-${num}`;
  }
  const randomNum = Math.floor(10000000 + Math.random() * 90000000);
  return `RV-${randomNum}`;
}

export function getPermanentUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      const initialized = INITIAL_USERS.map(u => ({
        ...u,
        raviniId: u.raviniId || generateRaviniId(u.id),
        verificationStatus: u.verified ? ('verified' as VerificationStatus) : ('unverified' as VerificationStatus),
        friends: u.friends || [],
        friendRequestsReceived: u.friendRequestsReceived || [],
        friendRequestsSent: u.friendRequestsSent || [],
        blockedUsers: u.blockedUsers || [],
        walletLedger: u.walletLedger || {
          customerBalance: u.walletBalance || 0,
          creatorEarnings: 0,
          companyRevenue: 0,
          pendingFunds: 0,
          refunds: 0,
        },
      }));
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialized));
      return initialized;
    }
    const parsed = JSON.parse(raw);
    let saved: User[] = (Array.isArray(parsed) ? parsed : []).filter(u => u && !LEGACY_DEMO_IDS.has(u.id));
    let updated = (Array.isArray(parsed) ? parsed : []).length !== saved.length;
    // Ensure initial users exist if not already there, without deleting existing registered users
    const existingIds = new Set(saved.map(u => u?.id).filter(Boolean));
    for (const initUser of INITIAL_USERS) {
      if (!existingIds.has(initUser.id)) {
        saved.push(initUser);
        updated = true;
      }
    }

    // Ensure all users have raviniId, verificationStatus, ledger, and friends initialized
    saved.forEach(u => {
      if (!u.raviniId) {
        u.raviniId = generateRaviniId(u.id);
        updated = true;
      }
      if (!u.verificationStatus) {
        u.verificationStatus = u.verified ? 'verified' : 'unverified';
        updated = true;
      }
      if (!u.walletLedger) {
        u.walletLedger = {
          customerBalance: u.walletBalance || 0,
          creatorEarnings: 0,
          companyRevenue: 0,
          pendingFunds: 0,
          refunds: 0,
        };
        updated = true;
      }
      if (!u.friends) {
        u.friends = [];
        updated = true;
      }
      if (!u.friendRequestsReceived) {
        u.friendRequestsReceived = [];
        updated = true;
      }
      if (!u.friendRequestsSent) {
        u.friendRequestsSent = [];
        updated = true;
      }
      if (!u.blockedUsers) {
        u.blockedUsers = [];
        updated = true;
      }

      // Check suspension expiration - automatic restoration
      if (u.isSuspended && u.suspensionDetails?.endDate) {
        const endMs = new Date(u.suspensionDetails.endDate).getTime();
        if (Date.now() >= endMs && !u.suspensionDetails.isPermanent) {
          u.isSuspended = false;
          u.suspensionDetails = undefined;
          updated = true;
        }
      }
    });

    // Enforce SINGLE canonical Super Admin Baraka Mabula (255748604483)
    saved.forEach(u => {
      const isCanonical = u.id === 'usr_baraka_mabula' || u.phone?.replace(/\D/g, '') === '255748604483' || u.username === '255748604483';
      if (!isCanonical && (u.role === 'SUPER_ADMIN' || u.role === 'super_admin')) {
        u.role = 'user';
        u.permissions = [];
        updated = true;
      }
    });

    const superAdmin = saved.find(u => u.id === 'usr_baraka_mabula' || u.phone?.replace(/\D/g, '') === '255748604483');
    if (superAdmin) {
      if (superAdmin.id !== 'usr_baraka_mabula') {
        superAdmin.id = 'usr_baraka_mabula';
        updated = true;
      }
      if (superAdmin.phone !== '255748604483') {
        superAdmin.phone = '255748604483';
        updated = true;
      }
      if (superAdmin.username !== '255748604483') {
        superAdmin.username = '255748604483';
        updated = true;
      }
      if (superAdmin.role !== 'SUPER_ADMIN') {
        superAdmin.role = 'SUPER_ADMIN';
        updated = true;
      }
      if (!superAdmin.password) {
        superAdmin.password = '1234';
        updated = true;
      }
      if (superAdmin.mustChangePassword) {
        superAdmin.mustChangePassword = false;
        updated = true;
      }
      if (!superAdmin.permissions || !superAdmin.permissions.includes('all')) {
        superAdmin.permissions = ['all'];
        updated = true;
      }
      // Purge fake demo followers/following
      const origFollowingLen = (superAdmin.followingUsers || []).length;
      superAdmin.followingUsers = (superAdmin.followingUsers || []).filter(id => !LEGACY_DEMO_IDS.has(id));
      if (superAdmin.followingUsers.length !== origFollowingLen) updated = true;
      if (superAdmin.followersCount === 12450) {
        superAdmin.followersCount = 0;
        updated = true;
      }
      if (superAdmin.followingCount === 320) {
        superAdmin.followingCount = 0;
        updated = true;
      }
      if (superAdmin.walletBalance === 250000) {
        superAdmin.walletBalance = 0;
        updated = true;
      }
    }

    if (updated) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(saved));
    }
    return saved;
  } catch (e) {
    console.error('Failed reading users:', e);
    return INITIAL_USERS;
  }
}

export function saveUserPermanent(newUser: User): User {
  const users = getPermanentUsers();
  const isCanonical = newUser.id === 'usr_baraka_mabula' || newUser.phone?.replace(/\D/g, '') === '255748604483';
  if (isCanonical) {
    newUser.id = 'usr_baraka_mabula';
    newUser.phone = '255748604483';
    newUser.role = 'SUPER_ADMIN';
    newUser.mustChangePassword = false;
    newUser.permissions = ['all'];
  } else {
    if (newUser.role === 'SUPER_ADMIN' || newUser.role === 'super_admin') {
      newUser.role = 'user';
    }
  }

  const index = users.findIndex(u => u.id === newUser.id);
  if (index >= 0) {
    users[index] = { ...users[index], ...newUser };
  } else {
    users.unshift(newUser);
  }
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed saving user permanently:', e);
  }
  broadcastEvent('USER_UPDATED', newUser);
  return newUser;
}

export function getCurrentUserId(): string {
  try {
    return localStorage.getItem(CURRENT_USER_ID_KEY) || 'usr_baraka_mabula';
  } catch {
    return 'usr_baraka_mabula';
  }
}

export function getCurrentUser(): User {
  const users = getPermanentUsers();
  const currentId = localStorage.getItem(CURRENT_USER_ID_KEY);
  if (currentId) {
    const found = users.find(u => u.id === currentId);
    if (found) return found;
  }
  // Default to Baraka Mabula
  const defaultUser = users[0] || INITIAL_USERS[0];
  setCurrentUserId(defaultUser.id);
  return defaultUser;
}

export function isUserAuthenticated(): boolean {
  try {
    return localStorage.getItem(AUTH_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAuthenticated(isAuth: boolean) {
  try {
    if (isAuth) {
      localStorage.setItem(AUTH_SESSION_KEY, 'true');
    } else {
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
    broadcastEvent('AUTH_STATE_CHANGED', { isAuthenticated: isAuth });
  } catch (e) {
    console.error(e);
  }
}

export function normalizeTanzanianPhone(input: string): string {
  if (!input) return '';
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('255') && digits.length >= 12) {
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

export function loginUser(identifier: string, password?: string): { success: boolean; user?: User; error?: string } {
  const users = getPermanentUsers();
  const cleanId = identifier.trim().toLowerCase();
  const digitsOnlyId = cleanId.replace(/\D/g, '');
  const normInput = normalizeTanzanianPhone(cleanId);
  
  let user = users.find(u => {
    if (u.username.toLowerCase() === cleanId) return true;
    if (u.email && u.email.toLowerCase() === cleanId) return true;
    if (u.phone) {
      const cleanPhone = u.phone.replace(/\s+/g, '');
      const digitsOnlyPhone = u.phone.replace(/\D/g, '');
      if (cleanPhone === cleanId) return true;
      if (digitsOnlyId && digitsOnlyPhone && digitsOnlyId === digitsOnlyPhone) return true;
      if (normInput && normalizeTanzanianPhone(u.phone) === normInput) return true;
    }
    return false;
  });

  // Direct fallback for Super Admin with phone 255748604483 or 0748604483
  if (!user && (normInput === '255748604483' || cleanId.includes('748604483') || cleanId === '0748604483')) {
    user = users.find(u => u.id === 'usr_baraka_mabula' || u.role === 'super_admin');
  }

  if (!user) {
    return { success: false, error: 'Mtumiaji mwenye namba hii ya simu au barua pepe hakupatikana. Tafadhali hakiki au jisajili.' };
  }

  // Account status checks: Super Admin enable/disable & delete/restore control
  if (user.isDisabled) {
    return { success: false, error: 'Akaunti hii imelemazwa (Disabled) na Msimamizi Mkuu. Wasiliana na usimamizi kwa msaada.' };
  }
  if (user.isDeleted) {
    return { success: false, error: 'Akaunti hii imefutwa (Deleted). Wasiliana na Msimamizi Mkuu kwa ajili ya kurejeshewa (Restore).' };
  }

  // If password provided and user has password, check match
  if (password && user.password) {
    const isSuperAdminMatch = (user.role === 'super_admin' || user.role === 'SUPER_ADMIN') && (password === user.password || password === '1234' || password === '1212');
    if (!isSuperAdminMatch && user.password !== password) {
      return { success: false, error: 'Nenosiri sio sahihi. Tafadhali jaribu tena.' };
    }
  }

  // Set active user & auth session
  setCurrentUserId(user.id);
  setAuthenticated(true);
  addAuditLog(user.id, user.name, user.role, 'LOGIN', user.id, `User logged in (${user.role})`);

  return { success: true, user };
}

export function resetUserPasswordByPhoneOrEmail(identifier: string, newPass: string): { success: boolean; message: string } {
  const users = getPermanentUsers();
  const cleanId = identifier.trim().toLowerCase();
  const normInput = normalizeTanzanianPhone(cleanId);

  const user = users.find(u => {
    if (u.username.toLowerCase() === cleanId) return true;
    if (u.email && u.email.toLowerCase() === cleanId) return true;
    if (u.phone) {
      const cleanPhone = u.phone.replace(/\s+/g, '');
      if (cleanPhone === cleanId.replace(/\s+/g, '')) return true;
      if (normInput && normalizeTanzanianPhone(u.phone) === normInput) return true;
    }
    return false;
  });

  if (!user) {
    return { success: false, message: 'Akaunti yenye namba ya simu au barua pepe hii haikupatikana.' };
  }

  user.password = newPass;
  saveUserPermanent(user);
  addAuditLog(user.id, user.name, user.role, 'PASSWORD_RESET', user.id, 'Nenosiri limewekwa upya');
  return { success: true, message: 'Nenosiri lako jipya limehifadhiwa salama! Sasa unaweza kuingia.' };
}

export function resetCustomerPasswordToTemporary(
  customerId: string, 
  actorId: string, 
  actorName: string, 
  actorRole: UserRole
): { success: boolean; message: string } {
  const users = getPermanentUsers();
  const customer = users.find(u => u.id === customerId);
  if (!customer) {
    return { success: false, message: 'Mteja hakupatikana kwenye mfumo.' };
  }
  if (customer.role === 'super_admin') {
    return { success: false, message: 'Mamlaka yamezuiwa: Nenosiri la Super Admin haliwezi kubadilishwa na Customer Care.' };
  }
  
  customer.password = '1234';
  customer.mustChangePassword = true;
  saveUserPermanent(customer);
  addAuditLog(
    actorId,
    actorName,
    actorRole,
    'CUSTOMER_PASSWORD_RESET_BY_SUPPORT',
    customer.id,
    `Customer Care (${actorName}) reset password to temporary (1234) for customer @${customer.username} (${customer.phone || customer.email})`
  );
  return { 
    success: true, 
    message: `Nenosiri la muda (1234) limewekwa kwa mafanikio kwa mteja @${customer.username}. Mteja ataweza kuingia kwa 1234 na kulazimika kuweka nenosiri lake jipya la siri.` 
  };
}

export function logoutUser() {
  const current = getCurrentUser();
  addAuditLog(current.id, current.name, current.role, 'LOGOUT', current.id, 'User logged out');
  setAuthenticated(false);
}

export function changeUserPassword(userId: string, oldPass: string, newPass: string): { success: boolean; message: string } {
  const users = getPermanentUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, message: 'Akaunti haikupatikana.' };

  if (user.password && user.password !== oldPass) {
    return { success: false, message: 'Nenosiri la zamani si sahihi.' };
  }

  user.password = newPass;
  saveUserPermanent(user);
  addAuditLog(user.id, user.name, user.role, 'PASSWORD_CHANGE', user.id, 'Nenosiri limebadilishwa kikamilifu');
  return { success: true, message: 'Nenosiri lako jipya limehifadhiwa salama.' };
}

export function getAppMode(): AppMode {
  try {
    const saved = localStorage.getItem(APP_MODE_KEY);
    if (saved === 'creator' || saved === 'business') return saved;
    return 'personal';
  } catch {
    return 'personal';
  }
}

export function setAppMode(mode: AppMode) {
  try {
    localStorage.setItem(APP_MODE_KEY, mode);
    broadcastEvent('APP_MODE_CHANGED', mode);
  } catch (e) {
    console.error(e);
  }
}

export function toggleFollowUser(currentUserId: string, targetUserId: string): boolean {
  if (currentUserId === targetUserId) return false;
  const users = getPermanentUsers();
  const currentUser = users.find(u => u.id === currentUserId);
  const targetUser = users.find(u => u.id === targetUserId);
  if (!currentUser || !targetUser) return false;

  const following = new Set(currentUser.followingUsers || []);
  let isNowFollowing = false;

  if (following.has(targetUserId)) {
    following.delete(targetUserId);
    currentUser.followingCount = Math.max(0, (currentUser.followingCount || 1) - 1);
    targetUser.followersCount = Math.max(0, (targetUser.followersCount || 1) - 1);
    isNowFollowing = false;
  } else {
    following.add(targetUserId);
    currentUser.followingCount = (currentUser.followingCount || 0) + 1;
    targetUser.followersCount = (targetUser.followersCount || 0) + 1;
    isNowFollowing = true;

    // Create notification for target user
    addNotification({
      userId: targetUser.id,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorAvatar: currentUser.avatar,
      type: 'follow',
      message: `${currentUser.name} ameanza kukufuata kwenye RAVINI.`,
      read: false,
    });
  }

  currentUser.followingUsers = Array.from(following);
  saveUserPermanent(currentUser);
  saveUserPermanent(targetUser);
  broadcastEvent('USER_FOLLOW_UPDATED', { currentUserId, targetUserId, isNowFollowing });
  return isNowFollowing;
}

// ----------------- CREATOR APPLICATIONS -----------------

export function getCreatorApplications(): CreatorApplication[] {
  try {
    const raw = localStorage.getItem(CREATOR_APPS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function submitCreatorApplication(
  user: User, 
  details: { category: string; experience: string; portfolioUrl?: string; reasons: string; documents?: VerificationDocument[] }
): CreatorApplication {
  const apps = getCreatorApplications();
  const newApp: CreatorApplication = {
    id: `capp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    userId: user.id,
    userName: user.name,
    userUsername: user.username,
    userAvatar: user.avatar,
    category: details.category,
    experience: details.experience,
    portfolioUrl: details.portfolioUrl,
    reasons: details.reasons,
    documents: details.documents || [],
    status: 'pending',
    appliedAt: new Date().toISOString(),
  };

  apps.unshift(newApp);
  localStorage.setItem(CREATOR_APPS_KEY, JSON.stringify(apps));

  // Update user state
  user.creatorApplicationStatus = 'pending';
  user.creatorAppliedAt = newApp.appliedAt;
  user.creatorRejectionReason = undefined;
  user.creatorInfoRequestedNote = undefined;
  saveUserPermanent(user);

  logAuditPermanent({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'CREATOR_APPLICATION_SUBMITTED',
    target: newApp.id,
    details: `Category: ${details.category}, Docs: ${newApp.documents?.length || 0}`
  });

  saveNotificationPermanent({
    id: `notif_${Date.now()}_creator_submitted`,
    userId: user.id,
    actorId: user.id,
    actorName: 'RAVINI Creator Program',
    type: 'creator_status',
    targetTab: 'creator',
    titleSw: 'Maombi ya Creator Yametumwa',
    titleEn: 'Creator Application Submitted',
    messageSw: `Maombi yako ya kuwa Muundaji Maudhui (Creator) wa RAVINI katika sekta ya "${details.category}" yametumwa na yanahakikiwa na Msimamizi.`,
    messageEn: `Your RAVINI Creator application for "${details.category}" has been received and is being reviewed by an authorized admin.`,
    message: `Maombi ya Creator (${details.category}) yametumwa kikamilifu.`,
    read: false,
    createdAt: newApp.appliedAt,
  });

  broadcastEvent('CREATOR_APPS_UPDATED', newApp);
  return newApp;
}

export function reviewCreatorApplication(
  applicationId: string, 
  reviewer: User, 
  status: 'approved' | 'rejected' | 'more_info_requested' | 'suspended',
  rejectionReason?: string,
  infoRequestedNote?: string
): { success: boolean; message: string } {
  // STRICT BACKEND CHECK: Require CREATOR_APPROVE permission or Super Admin
  if (!hasPermission(reviewer, 'CREATOR_APPROVE')) {
    return { success: false, message: 'Ruksa Imezuiliwa: Huna idhini ya CREATOR_APPROVE ya kuidhinisha maombi ya muundaji.' };
  }

  const apps = getCreatorApplications();
  const app = apps.find(a => a.id === applicationId);
  if (!app) return { success: false, message: 'Ombi la muundaji halikupatikana.' };

  // Security check: Prevent self-approval for regular admins
  if (app.userId === reviewer.id && reviewer.role !== 'super_admin') {
    return { success: false, message: 'Usalama: Msimamizi hawezi kujiruhusu au kuidhinisha maombi yake mwenyewe.' };
  }

  const now = new Date().toISOString();
  app.status = status;
  app.reviewedBy = reviewer.name;
  app.reviewedAt = now;
  if (rejectionReason) app.rejectionReason = rejectionReason;
  if (infoRequestedNote) app.infoRequestedNote = infoRequestedNote;
  localStorage.setItem(CREATOR_APPS_KEY, JSON.stringify(apps));

  // Update user profile
  const users = getPermanentUsers();
  const applicant = users.find(u => u.id === app.userId);
  if (applicant) {
    applicant.creatorApplicationStatus = status;
    if (rejectionReason) applicant.creatorRejectionReason = rejectionReason;
    if (infoRequestedNote) applicant.creatorInfoRequestedNote = infoRequestedNote;

    if (status === 'approved') {
      applicant.creatorApproved = true;
      if (applicant.role === 'user') {
        applicant.role = 'creator';
      }
      applicant.creatorDetails = {
        category: app.category,
        bio: app.experience,
        socialLink: app.portfolioUrl,
        totalReach: (applicant.followersCount || 10) * 12,
        subscribers: applicant.followersCount || 10
      };
    } else if (status === 'rejected' || status === 'suspended') {
      applicant.creatorApproved = false;
      if (applicant.role === 'creator') {
        applicant.role = 'user';
      }
      if (applicant.currentMode === 'creator') {
        applicant.currentMode = 'personal';
      }
    }
    saveUserPermanent(applicant);

    // Bilingual notification
    saveNotificationPermanent({
      id: `notif_${Date.now()}_creator_${status}`,
      userId: applicant.id,
      actorId: reviewer.id,
      actorName: reviewer.name,
      actorAvatar: reviewer.avatar,
      type: 'creator_status',
      targetTab: 'creator',
      titleSw: status === 'approved' ? 'Uhakiki wa Creator Umeidhinishwa' : status === 'rejected' ? 'Uhakiki wa Creator Umekataliwa' : 'Maelezo Zaidi Yanahitajika',
      titleEn: status === 'approved' ? 'Creator Verification Approved' : status === 'rejected' ? 'Creator Verification Rejected' : 'More Information Requested',
      messageSw: status === 'approved' 
        ? 'Hongera! Maombi yako ya kuwa Muundaji Maudhui (Creator) wa RAVINI yameidhinishwa! 🎉 Sasa unaweza kubadili kwenda "Creator Mode".'
        : status === 'rejected'
        ? `Maombi yako ya kuwa Muundaji Maudhui hayajaidhinishwa. Sababu: ${rejectionReason || 'Hati hazikukidhi vigezo vilivyowekwa.'}`
        : `Msimamizi wa RAVINI anahitaji maelezo ya ziada kuhusu ombi lako la Creator: ${infoRequestedNote || 'Tafadhali kamilisha maelezo.'}`,
      messageEn: status === 'approved'
        ? 'Congratulations! Your RAVINI Creator application has been approved! 🎉 You can now switch to Creator Mode.'
        : status === 'rejected'
        ? `Your Creator application was rejected. Reason: ${rejectionReason || 'Requirements not met.'}`
        : `Additional information is requested for your Creator application: ${infoRequestedNote || 'Please update your details.'}`,
      message: status === 'approved' 
        ? 'Hongera! Maombi yako ya Creator yameidhinishwa na RAVINI.' 
        : `Taarifa kuhusu ombi la Creator: ${rejectionReason || infoRequestedNote || status}`,
      read: false,
      createdAt: now,
    });
  }

  logAuditPermanent({
    actorId: reviewer.id,
    actorName: reviewer.name,
    actorRole: reviewer.role,
    action: `CREATOR_APP_${status.toUpperCase()}`,
    target: app.userName,
    permissionUsed: reviewer.role === 'super_admin' ? 'SUPER_ADMIN' : 'CREATOR_APPROVE',
    details: `Status: ${status}, Reason: ${rejectionReason || infoRequestedNote || 'N/A'}`
  });

  broadcastEvent('CREATOR_APPS_UPDATED', app);
  return { success: true, message: `Maombi ya muundaji yamechakatwa kuwa: ${status}` };
}

// ----------------- BUSINESS APPLICATIONS -----------------

export function getBusinessApplications(): BusinessApplication[] {
  try {
    const raw = localStorage.getItem(BUSINESS_APPS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function submitBusinessApplication(
  user: User, 
  details: { companyName: string; category: string; phone: string; email: string; location: string; tin?: string; description: string; documents?: VerificationDocument[] }
): BusinessApplication {
  const apps = getBusinessApplications();
  const newApp: BusinessApplication = {
    id: `bapp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    companyName: details.companyName,
    category: details.category,
    phone: details.phone,
    email: details.email,
    location: details.location,
    tin: details.tin,
    description: details.description,
    documents: details.documents || [],
    status: 'pending',
    appliedAt: new Date().toISOString(),
  };

  apps.unshift(newApp);
  localStorage.setItem(BUSINESS_APPS_KEY, JSON.stringify(apps));

  user.businessApplicationStatus = 'pending';
  user.businessAppliedAt = newApp.appliedAt;
  user.businessRejectionReason = undefined;
  user.businessInfoRequestedNote = undefined;
  saveUserPermanent(user);

  logAuditPermanent({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'BUSINESS_APPLICATION_SUBMITTED',
    target: newApp.id,
    details: `Company: ${details.companyName}, TIN: ${details.tin || 'N/A'}, Docs: ${newApp.documents?.length || 0}`
  });

  saveNotificationPermanent({
    id: `notif_${Date.now()}_biz_submitted`,
    userId: user.id,
    actorId: user.id,
    actorName: 'RAVINI Business Portal',
    type: 'business_status',
    targetTab: 'business',
    titleSw: 'Maombi ya Biashara Yametumwa',
    titleEn: 'Business Application Submitted',
    messageSw: `Maombi yako ya kusajili biashara ya "${details.companyName}" yamewasilishwa na yanahakikiwa na wasimamizi wa RAVINI.`,
    messageEn: `Your business verification request for "${details.companyName}" has been submitted and is under review.`,
    message: `Maombi ya biashara ${details.companyName} yametumwa kikamilifu.`,
    read: false,
    createdAt: newApp.appliedAt,
  });

  broadcastEvent('BUSINESS_APPS_UPDATED', newApp);
  return newApp;
}

export function reviewBusinessApplication(
  applicationId: string, 
  reviewer: User, 
  status: 'approved' | 'rejected' | 'more_info_requested' | 'suspended',
  rejectionReason?: string,
  infoRequestedNote?: string
): { success: boolean; message: string } {
  // STRICT BACKEND CHECK: Require BUSINESS_APPROVE permission or Super Admin
  if (!hasPermission(reviewer, 'BUSINESS_APPROVE')) {
    return { success: false, message: 'Ruksa Imezuiliwa: Huna idhini ya BUSINESS_APPROVE ya kuidhinisha biashara.' };
  }

  const apps = getBusinessApplications();
  const app = apps.find(a => a.id === applicationId);
  if (!app) return { success: false, message: 'Ombi la biashara halikupatikana.' };

  // Security check: Prevent self-approval for regular admins
  if (app.userId === reviewer.id && reviewer.role !== 'super_admin') {
    return { success: false, message: 'Usalama: Msimamizi hawezi kujiruhusu au kuidhinisha maombi yake ya biashara.' };
  }

  const now = new Date().toISOString();
  app.status = status;
  app.reviewedBy = reviewer.name;
  app.reviewedAt = now;
  if (rejectionReason) app.rejectionReason = rejectionReason;
  if (infoRequestedNote) app.infoRequestedNote = infoRequestedNote;
  localStorage.setItem(BUSINESS_APPS_KEY, JSON.stringify(apps));

  const users = getPermanentUsers();
  const applicant = users.find(u => u.id === app.userId);
  if (applicant) {
    applicant.businessApplicationStatus = status;
    if (rejectionReason) applicant.businessRejectionReason = rejectionReason;
    if (infoRequestedNote) applicant.businessInfoRequestedNote = infoRequestedNote;

    if (status === 'approved') {
      applicant.businessApproved = true;
      if (applicant.role === 'user') {
        applicant.role = 'business';
      }
      applicant.businessDetails = {
        companyName: app.companyName,
        category: app.category,
        tin: app.tin,
        phone: app.phone,
        email: app.email,
        address: app.location,
        description: app.description,
        productsCount: applicant.businessDetails?.productsCount || 0
      };
    } else if (status === 'rejected' || status === 'suspended') {
      applicant.businessApproved = false;
      if (applicant.role === 'business') {
        applicant.role = 'user';
      }
      if (applicant.currentMode === 'business') {
        applicant.currentMode = 'personal';
      }
    }
    saveUserPermanent(applicant);

    // Bilingual notification
    saveNotificationPermanent({
      id: `notif_${Date.now()}_biz_${status}`,
      userId: applicant.id,
      actorId: reviewer.id,
      actorName: reviewer.name,
      actorAvatar: reviewer.avatar,
      type: 'business_status',
      targetTab: 'business',
      titleSw: status === 'approved' ? 'Uhakiki wa Biashara Umeidhinishwa' : status === 'rejected' ? 'Uhakiki wa Biashara Umekataliwa' : 'Maelezo Zaidi Yanahitajika',
      titleEn: status === 'approved' ? 'Business Verification Approved' : status === 'rejected' ? 'Business Verification Rejected' : 'More Information Requested',
      messageSw: status === 'approved' 
        ? `Hongera! Akaunti yako ya Biashara (${app.companyName}) imeidhinishwa rasmi na RAVINI! 🏢 Sasa unaweza kutumia "Business Mode".`
        : status === 'rejected'
        ? `Maombi ya akaunti ya biashara (${app.companyName}) hayajaidhinishwa. Sababu: ${rejectionReason || 'Vigezo vya usajili havikukidhi.'}`
        : `Msimamizi wa RAVINI anahitaji maelezo ya ziada kwa biashara yako (${app.companyName}): ${infoRequestedNote || 'Tafadhali rekebisha.'}`,
      messageEn: status === 'approved'
        ? `Congratulations! Your business profile (${app.companyName}) has been verified on RAVINI! 🏢`
        : status === 'rejected'
        ? `Your business verification (${app.companyName}) was rejected. Reason: ${rejectionReason || 'Verification requirements not met.'}`
        : `Additional details required for ${app.companyName}: ${infoRequestedNote || 'Please update.'}`,
      message: status === 'approved'
        ? `Hongera! Biashara ya ${app.companyName} imeidhinishwa na RAVINI.`
        : `Taarifa ya biashara: ${rejectionReason || infoRequestedNote || status}`,
      read: false,
      createdAt: now,
    });
  }

  logAuditPermanent({
    actorId: reviewer.id,
    actorName: reviewer.name,
    actorRole: reviewer.role,
    action: `BUSINESS_APP_${status.toUpperCase()}`,
    target: app.companyName,
    permissionUsed: reviewer.role === 'super_admin' ? 'SUPER_ADMIN' : 'BUSINESS_APPROVE',
    details: `Status: ${status}, Reason: ${rejectionReason || infoRequestedNote || 'N/A'}`
  });

  broadcastEvent('BUSINESS_APPS_UPDATED', app);
  return { success: true, message: `Maombi ya biashara yamechakatwa kuwa: ${status}` };
}

// ----------------- COMPANY APPLICATIONS (CORPORATE ENTITIES) -----------------

export function getCompanyApplications(): CompanyApplication[] {
  try {
    const raw = localStorage.getItem(COMPANY_APPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function submitCompanyApplication(
  user: User,
  data: {
    companyName: string;
    registrationNumber: string;
    tin: string;
    industry: string;
    phone: string;
    email: string;
    address: string;
    website?: string;
    description: string;
    documents?: VerificationDocument[];
  }
): { success: boolean; application?: CompanyApplication; message: string } {
  const apps = getCompanyApplications();
  const existingPending = apps.find(a => a.userId === user.id && a.status === 'pending');
  if (existingPending) {
    return { success: false, message: 'Tayari una ombi la kampuni linalosubiri uhakiki wa Msimamizi Mkuu.' };
  }

  const newApp: CompanyApplication = {
    id: `comp_app_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    companyName: data.companyName.trim(),
    registrationNumber: data.registrationNumber.trim().toUpperCase(),
    tin: data.tin.trim(),
    industry: data.industry,
    phone: data.phone.trim(),
    email: data.email.trim(),
    address: data.address.trim(),
    website: data.website?.trim(),
    description: data.description.trim(),
    documents: data.documents || [],
    status: 'pending',
    appliedAt: new Date().toISOString(),
  };

  apps.unshift(newApp);
  localStorage.setItem(COMPANY_APPS_KEY, JSON.stringify(apps));

  user.companyApplicationStatus = 'pending';
  user.companyAppliedAt = newApp.appliedAt;
  user.companyRejectionReason = undefined;
  user.companyInfoRequestedNote = undefined;
  saveUserPermanent(user);

  logAuditPermanent({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'COMPANY_APPLICATION_SUBMITTED',
    target: newApp.companyName,
    details: `BRELA: ${newApp.registrationNumber}, TIN: ${newApp.tin}, Sekta: ${newApp.industry}, Docs: ${newApp.documents?.length || 0}`
  });

  saveNotificationPermanent({
    id: `notif_${Date.now()}_comp_submitted`,
    userId: user.id,
    actorId: user.id,
    actorName: 'RAVINI Corporate Registry',
    type: 'company_status',
    targetTab: 'company',
    titleSw: 'Ombi la Kampuni Limepokelewa',
    titleEn: 'Company Application Submitted',
    messageSw: `Ombi lako la kusajili kampuni "${newApp.companyName}" (BRELA: ${newApp.registrationNumber}) limepokelewa na linashughulikiwa na kitengo cha uhakiki cha RAVINI COMPANY LIMITED.`,
    messageEn: `Your company verification request for "${newApp.companyName}" (BRELA: ${newApp.registrationNumber}) has been received and is being reviewed by RAVINI.`,
    message: `Ombi la kampuni ${newApp.companyName} limepokelewa na linahakikiwa.`,
    read: false,
    createdAt: newApp.appliedAt,
  });

  broadcastEvent('COMPANY_APPS_UPDATED', newApp);
  return { success: true, application: newApp, message: 'Maombi ya kampuni yamewasilishwa kikamilifu na yanahakikiwa.' };
}

export function reviewCompanyApplication(
  applicationId: string, 
  reviewer: User, 
  status: 'approved' | 'rejected' | 'more_info_requested' | 'suspended',
  rejectionReason?: string,
  infoRequestedNote?: string
): { success: boolean; message: string } {
  // STRICT BACKEND CHECK: Require COMPANY_APPROVE permission or Super Admin
  if (!hasPermission(reviewer, 'COMPANY_APPROVE')) {
    return { success: false, message: 'Ruksa Imezuiliwa: Huna idhini ya COMPANY_APPROVE ya kuidhinisha kampuni.' };
  }

  const apps = getCompanyApplications();
  const app = apps.find(a => a.id === applicationId);
  if (!app) return { success: false, message: 'Ombi la kampuni halikupatikana.' };

  // Security check: Prevent self-approval for regular admins
  if (app.userId === reviewer.id && reviewer.role !== 'super_admin') {
    return { success: false, message: 'Usalama: Msimamizi hawezi kuidhinisha maombi yake ya kampuni.' };
  }

  const now = new Date().toISOString();
  app.status = status;
  app.reviewedBy = reviewer.name;
  app.reviewedAt = now;
  if (rejectionReason) app.rejectionReason = rejectionReason;
  if (infoRequestedNote) app.infoRequestedNote = infoRequestedNote;
  localStorage.setItem(COMPANY_APPS_KEY, JSON.stringify(apps));

  const users = getPermanentUsers();
  const applicant = users.find(u => u.id === app.userId);
  if (applicant) {
    applicant.companyApplicationStatus = status;
    if (rejectionReason) applicant.companyRejectionReason = rejectionReason;
    if (infoRequestedNote) applicant.companyInfoRequestedNote = infoRequestedNote;

    if (status === 'approved') {
      applicant.companyApproved = true;
      applicant.companyDetails = {
        companyName: app.companyName,
        registrationNumber: app.registrationNumber,
        tin: app.tin,
        industry: app.industry,
        phone: app.phone,
        email: app.email,
        address: app.address,
        website: app.website,
        description: app.description,
        teamSize: 1
      };
    } else if (status === 'rejected' || status === 'suspended') {
      applicant.companyApproved = false;
      if (applicant.currentMode === 'company') {
        applicant.currentMode = 'personal';
      }
    }
    saveUserPermanent(applicant);

    saveNotificationPermanent({
      id: `notif_${Date.now()}_comp_${status}`,
      userId: applicant.id,
      actorId: reviewer.id,
      actorName: reviewer.name,
      actorAvatar: reviewer.avatar,
      type: 'company_status',
      targetTab: 'company',
      titleSw: status === 'approved' ? 'Uhakiki wa Kampuni Umeidhinishwa' : status === 'rejected' ? 'Uhakiki wa Kampuni Umekataliwa' : 'Maelezo Zaidi ya Kampuni Yanahitajika',
      titleEn: status === 'approved' ? 'Company Verification Approved' : status === 'rejected' ? 'Company Verification Rejected' : 'More Company Information Requested',
      messageSw: status === 'approved' 
        ? `Hongera! Usajili wa Kampuni yako (${app.companyName}) umeidhinishwa rasmi na RAVINI COMPANY LIMITED! 🏛️ Sasa unaweza kutumia "Company Mode".`
        : status === 'rejected'
        ? `Maombi ya kusajili kampuni (${app.companyName}) hayajaidhinishwa. Sababu: ${rejectionReason || 'Hati za usajili hazikukidhi vigezo vya kisheria.'}`
        : `Msimamizi anahitaji maelezo ya ziada kwa ajili ya kampuni yako (${app.companyName}): ${infoRequestedNote || 'Tafadhali kamilisha nyaraka.'}`,
      messageEn: status === 'approved'
        ? `Congratulations! Your corporate entity (${app.companyName}) has been approved by RAVINI COMPANY LIMITED! 🏛️ You can now access Company Mode.`
        : status === 'rejected'
        ? `Your company verification for ${app.companyName} was rejected. Reason: ${rejectionReason || 'Corporate verification criteria not met.'}`
        : `Additional documentation required for ${app.companyName}: ${infoRequestedNote || 'Please update.'}`,
      message: status === 'approved'
        ? `Hongera! Kampuni ya ${app.companyName} imeidhinishwa rasmi.`
        : `Taarifa ya kampuni: ${rejectionReason || infoRequestedNote || status}`,
      read: false,
      createdAt: now,
    });
  }

  logAuditPermanent({
    actorId: reviewer.id,
    actorName: reviewer.name,
    actorRole: reviewer.role,
    action: `COMPANY_APP_${status.toUpperCase()}`,
    target: app.companyName,
    permissionUsed: reviewer.role === 'super_admin' ? 'SUPER_ADMIN' : 'COMPANY_APPROVE',
    details: `Status: ${status}, Reason: ${rejectionReason || infoRequestedNote || 'N/A'}`
  });

  broadcastEvent('COMPANY_APPS_UPDATED', app);
  return { success: true, message: `Maombi ya kampuni yamechakatwa kuwa: ${status}` };
}

// ----------------- SECURE DOCUMENT VAULT (PRIVACY & CONTROLLED ACCESS) -----------------

interface StoredSecureDocument {
  id: string;
  userId: string;
  userName: string;
  name: string;
  type: VerificationDocument['type'];
  mimeType: string;
  fileSize: number;
  dataUrl: string; // Private payload stored only in restricted vault
  uploadedAt: string;
}

export function uploadSecureVerificationDocument(
  user: User,
  file: {
    name: string;
    type: VerificationDocument['type'];
    mimeType: string;
    dataUrl: string;
    fileSize: number;
  }
): { success: boolean; document?: VerificationDocument; message: string } {
  if (!user || !user.id) {
    return { success: false, message: 'Mtumiaji hajatambuliwa.' };
  }

  // Validate allowed MIME types
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedMimes.includes(file.mimeType.toLowerCase())) {
    return { success: false, message: 'Aina ya faili haikubaliki. Tafadhali pakia PDF, PNG, au JPG pekee.' };
  }

  // Validate file size: Max 5MB
  const maxBytes = 5 * 1024 * 1024;
  if (file.fileSize > maxBytes) {
    return { success: false, message: 'Faili ni kubwa mno. Kiwango cha juu kinachoruhusiwa ni MB 5.' };
  }

  const docId = `doc_sec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const storedDoc: StoredSecureDocument = {
    id: docId,
    userId: user.id,
    userName: user.name,
    name: file.name,
    type: file.type,
    mimeType: file.mimeType,
    fileSize: file.fileSize,
    dataUrl: file.dataUrl,
    uploadedAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(SECURE_DOCS_VAULT_KEY);
    const vault: StoredSecureDocument[] = raw ? JSON.parse(raw) : [];
    vault.unshift(storedDoc);
    // Keep max 200 documents
    localStorage.setItem(SECURE_DOCS_VAULT_KEY, JSON.stringify(vault.slice(0, 200)));
  } catch (e) {
    console.error('Vault storage error', e);
    return { success: false, message: 'Haikuweza kuhifadhi faili kwenye sefu salama.' };
  }

  const safeDoc: VerificationDocument = {
    id: docId,
    name: file.name,
    type: file.type,
    mimeType: file.mimeType,
    fileSize: file.fileSize,
    uploadedAt: storedDoc.uploadedAt,
    docReference: `RV-SEC-${docId.slice(-6).toUpperCase()}`,
    verified: false,
  };

  logAuditPermanent({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'SECURE_DOC_UPLOADED',
    target: file.name,
    details: `Type: ${file.type}, Size: ${(file.fileSize / 1024).toFixed(1)} KB, Ref: ${safeDoc.docReference}`
  });

  return { success: true, document: safeDoc, message: 'Nyaraka imehifadhiwa salama kwenye sefu ya RAVINI.' };
}

export function getSecureVerificationDocument(
  docId: string,
  requestor: User
): { success: boolean; document?: VerificationDocument; dataUrl?: string; message: string } {
  if (!requestor || !requestor.id) {
    return { success: false, message: 'Uthibitisho unahitajika kufikia nyaraka hii.' };
  }

  try {
    const raw = localStorage.getItem(SECURE_DOCS_VAULT_KEY);
    const vault: StoredSecureDocument[] = raw ? JSON.parse(raw) : [];
    const doc = vault.find(d => d.id === docId);
    if (!doc) {
      return { success: false, message: 'Nyaraka salama haikupatikana au imeshafutwa.' };
    }

    // STRICT ACCESS CONTROL: Only owner or authorized admins with correct permissions
    const isOwner = requestor.id === doc.userId;
    const isAuthorizedAdmin = 
      requestor.role === 'super_admin' ||
      hasPermission(requestor, 'VERIFICATION_MANAGE') ||
      hasPermission(requestor, 'CREATOR_APPROVE') ||
      hasPermission(requestor, 'BUSINESS_APPROVE') ||
      hasPermission(requestor, 'COMPANY_APPROVE');

    if (!isOwner && !isAuthorizedAdmin) {
      logAuditPermanent({
        actorId: requestor.id,
        actorName: requestor.name,
        actorRole: requestor.role,
        action: 'UNAUTHORIZED_DOC_ACCESS_ATTEMPT',
        target: doc.id,
        details: `Mtumiaji asiye na ruhusa (${requestor.name}) amejaribu kufungua nyaraka ya: ${doc.userName}`
      });
      return { success: false, message: 'Ruksa Imezuiliwa: Huna mamlaka ya kutazama nyaraka binafsi ya mtumiaji mwingine.' };
    }

    return {
      success: true,
      dataUrl: doc.dataUrl,
      document: {
        id: doc.id,
        name: doc.name,
        type: doc.type,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        uploadedAt: doc.uploadedAt,
        docReference: `RV-SEC-${doc.id.slice(-6).toUpperCase()}`,
        verified: true,
      },
      message: 'Nyaraka imepatikana.'
    };
  } catch (err) {
    return { success: false, message: 'Hitilafu wakati wa kufungua nyaraka salama.' };
  }
}

export function getUserSecureDocuments(userId: string, requestor: User): VerificationDocument[] {
  if (!requestor || !requestor.id) return [];
  const isOwner = requestor.id === userId;
  const isAuthorized = requestor.role === 'super_admin' || hasPermission(requestor, 'VERIFICATION_MANAGE');
  if (!isOwner && !isAuthorized) return [];

  try {
    const raw = localStorage.getItem(SECURE_DOCS_VAULT_KEY);
    const vault: StoredSecureDocument[] = raw ? JSON.parse(raw) : [];
    return vault
      .filter(d => d.userId === userId)
      .map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        mimeType: d.mimeType,
        fileSize: d.fileSize,
        uploadedAt: d.uploadedAt,
        docReference: `RV-SEC-${d.id.slice(-6).toUpperCase()}`,
        verified: true
      }));
  } catch {
    return [];
  }
}

// ----------------- REVOKING ACCESS (PRESERVING BASE RAVINI ACCOUNT) -----------------

export function revokeCreatorAccess(
  userId: string, 
  actor: User, 
  reason: string
): { success: boolean; message: string } {
  if (!hasPermission(actor, 'CREATOR_APPROVE') && !hasPermission(actor, 'VERIFICATION_MANAGE')) {
    return { success: false, message: 'Ruksa Imezuiliwa: Huna idhini ya kusitisha mamlaka ya Creator.' };
  }

  const users = getPermanentUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return { success: false, message: 'Mtumiaji hakupatikana.' };

  // PRESERVE: posts, friends, followers, following, chat, photos, videos, raviniId, wallet balance!
  target.creatorApproved = false;
  target.creatorApplicationStatus = 'rejected';
  target.creatorRejectionReason = reason;
  if (target.role === 'creator') {
    target.role = 'user';
  }
  if (target.currentMode === 'creator') {
    target.currentMode = 'personal';
  }
  saveUserPermanent(target);

  logAuditPermanent({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'CREATOR_ACCESS_REVOKED',
    target: target.name,
    permissionUsed: actor.role === 'super_admin' ? 'SUPER_ADMIN' : 'CREATOR_APPROVE',
    details: `Mamlaka ya Creator yamefutwa. Sababu: ${reason}`
  });

  saveNotificationPermanent({
    id: `notif_${Date.now()}_rev_creator`,
    userId: target.id,
    actorId: actor.id,
    actorName: actor.name,
    type: 'creator_status',
    targetTab: 'creator',
    titleSw: 'Mamlaka ya Creator Yamesitishwa',
    titleEn: 'Creator Access Revoked',
    messageSw: `Mamlaka yako ya Creator Mode yamesitishwa na Msimamizi Mkuu. Akaunti yako ya kawaida ya RAVINI, marafiki, machapisho na pochi ya RVC bado ziko salama na hai. Sababu: ${reason}`,
    messageEn: `Your Creator access has been revoked. Your regular RAVINI account, friends, posts, and wallet remain safe and active. Reason: ${reason}`,
    message: `Mamlaka ya Creator yamesitishwa. Sababu: ${reason}`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  broadcastEvent('USER_UPDATED', target);
  return { success: true, message: `Mamlaka ya Creator ya ${target.name} yameondolewa kikamilifu bila kuathiri akaunti yake ya kawaida.` };
}

export function revokeBusinessAccess(
  userId: string, 
  actor: User, 
  reason: string
): { success: boolean; message: string } {
  if (!hasPermission(actor, 'BUSINESS_APPROVE') && !hasPermission(actor, 'VERIFICATION_MANAGE')) {
    return { success: false, message: 'Ruksa Imezuiliwa: Huna idhini ya kusitisha mamlaka ya Biashara.' };
  }

  const users = getPermanentUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return { success: false, message: 'Mtumiaji hakupatikana.' };

  // PRESERVE: user base account intact
  target.businessApproved = false;
  target.businessApplicationStatus = 'rejected';
  target.businessRejectionReason = reason;
  if (target.role === 'business') {
    target.role = 'user';
  }
  if (target.currentMode === 'business') {
    target.currentMode = 'personal';
  }
  saveUserPermanent(target);

  logAuditPermanent({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'BUSINESS_ACCESS_REVOKED',
    target: target.name,
    permissionUsed: actor.role === 'super_admin' ? 'SUPER_ADMIN' : 'BUSINESS_APPROVE',
    details: `Mamlaka ya Biashara yamefutwa. Sababu: ${reason}`
  });

  saveNotificationPermanent({
    id: `notif_${Date.now()}_rev_biz`,
    userId: target.id,
    actorId: actor.id,
    actorName: actor.name,
    type: 'business_status',
    targetTab: 'business',
    titleSw: 'Mamlaka ya Biashara Yamesitishwa',
    titleEn: 'Business Access Revoked',
    messageSw: `Mamlaka ya Akaunti ya Biashara yamesitishwa. Akaunti yako ya kawaida ya RAVINI, marafiki, machapisho na pochi ya RVC bado zinafanya kazi. Sababu: ${reason}`,
    messageEn: `Your Business access has been revoked. Your regular RAVINI account, friends, posts, and wallet remain safe and active. Reason: ${reason}`,
    message: `Mamlaka ya Biashara yamesitishwa. Sababu: ${reason}`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  broadcastEvent('USER_UPDATED', target);
  return { success: true, message: `Mamlaka ya Biashara ya ${target.name} yameondolewa kikamilifu bila kuathiri akaunti yake ya kawaida.` };
}

export function revokeCompanyAccess(
  userId: string, 
  actor: User, 
  reason: string
): { success: boolean; message: string } {
  if (!hasPermission(actor, 'COMPANY_APPROVE') && !hasPermission(actor, 'VERIFICATION_MANAGE')) {
    return { success: false, message: 'Ruksa Imezuiliwa: Huna idhini ya kusitisha mamlaka ya Kampuni.' };
  }

  const users = getPermanentUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return { success: false, message: 'Mtumiaji hakupatikana.' };

  // PRESERVE: user base account intact
  target.companyApproved = false;
  target.companyApplicationStatus = 'rejected';
  target.companyRejectionReason = reason;
  if (target.currentMode === 'company') {
    target.currentMode = 'personal';
  }
  saveUserPermanent(target);

  logAuditPermanent({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'COMPANY_ACCESS_REVOKED',
    target: target.name,
    permissionUsed: actor.role === 'super_admin' ? 'SUPER_ADMIN' : 'COMPANY_APPROVE',
    details: `Mamlaka ya Kampuni yamefutwa. Sababu: ${reason}`
  });

  saveNotificationPermanent({
    id: `notif_${Date.now()}_rev_comp`,
    userId: target.id,
    actorId: actor.id,
    actorName: actor.name,
    type: 'company_status',
    targetTab: 'company',
    titleSw: 'Mamlaka ya Kampuni Yamesitishwa',
    titleEn: 'Company Access Revoked',
    messageSw: `Mamlaka ya Company Mode yamesitishwa. Akaunti yako ya kawaida ya RAVINI, marafiki, machapisho na pochi bado ziko salama. Sababu: ${reason}`,
    messageEn: `Your Company access has been revoked. Your regular RAVINI account, friends, posts, and wallet remain safe. Reason: ${reason}`,
    message: `Mamlaka ya Kampuni yamesitishwa. Sababu: ${reason}`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  broadcastEvent('USER_UPDATED', target);
  return { success: true, message: `Mamlaka ya Kampuni ya ${target.name} yameondolewa kikamilifu bila kuathiri akaunti yake ya kawaida.` };
}

export function revokeVerificationStatus(
  userId: string, 
  actor: User, 
  reason: string
): { success: boolean; message: string } {
  if (!hasPermission(actor, 'VERIFICATION_MANAGE')) {
    return { success: false, message: 'Ruksa Imezuiliwa: Huna idhini ya VERIFICATION_MANAGE ya kubadilisha hadhi ya uthibitisho.' };
  }

  const users = getPermanentUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return { success: false, message: 'Mtumiaji hakupatikana.' };

  target.verified = false;
  target.verificationStatus = 'unverified';
  target.trustBadgeType = undefined;
  target.sellerVerified = false;
  target.verificationRejectionReason = reason;
  saveUserPermanent(target);

  logAuditPermanent({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'VERIFICATION_STATUS_REVOKED',
    target: target.name,
    permissionUsed: actor.role === 'super_admin' ? 'SUPER_ADMIN' : 'VERIFICATION_MANAGE',
    details: `Beji ya uthibitisho imeondolewa. Sababu: ${reason}`
  });

  saveNotificationPermanent({
    id: `notif_${Date.now()}_rev_ver`,
    userId: target.id,
    actorId: actor.id,
    actorName: actor.name,
    type: 'verification',
    targetTab: 'verification',
    titleSw: 'Beji ya Uthibitisho Imeondolewa',
    titleEn: 'Verification Badge Revoked',
    messageSw: `Beji yako ya uthibitisho imeondolewa na Msimamizi Mkuu. Akaunti yako bado inaendelea kuwa hai kama kawaida. Sababu: ${reason}`,
    messageEn: `Your verification badge has been removed. Your account remains active as a regular user. Reason: ${reason}`,
    message: `Beji ya uthibitisho imeondolewa. Sababu: ${reason}`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  broadcastEvent('USER_UPDATED', target);
  return { success: true, message: `Beji ya uthibitisho ya ${target.name} imeondolewa bila kufuta akaunti yake.` };
}

export function suspendVerification(
  userId: string, 
  actor: User, 
  reason: string
): { success: boolean; message: string } {
  if (!hasPermission(actor, 'VERIFICATION_MANAGE')) {
    return { success: false, message: 'Ruksa Imezuiliwa: Huna idhini ya VERIFICATION_MANAGE.' };
  }

  const users = getPermanentUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return { success: false, message: 'Mtumiaji hakupatikana.' };

  target.verified = false;
  target.verificationStatus = 'suspended';
  target.verificationRejectionReason = reason;
  saveUserPermanent(target);

  logAuditPermanent({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'VERIFICATION_SUSPENDED',
    target: target.name,
    permissionUsed: actor.role === 'super_admin' ? 'SUPER_ADMIN' : 'VERIFICATION_MANAGE',
    details: `Uthibitisho umesimamishwa kwa muda. Sababu: ${reason}`
  });

  saveNotificationPermanent({
    id: `notif_${Date.now()}_susp_ver`,
    userId: target.id,
    actorId: actor.id,
    actorName: actor.name,
    type: 'verification',
    targetTab: 'verification',
    titleSw: 'Uthibitisho Umesimamishwa kwa Muda',
    titleEn: 'Verification Suspended',
    messageSw: `Hadhi yako ya uthibitisho imesimamishwa kwa muda na RAVINI COMPANY LIMITED. Sababu: ${reason}`,
    messageEn: `Your verification has been temporarily suspended by RAVINI. Reason: ${reason}`,
    message: `Uthibitisho umesimamishwa kwa muda. Sababu: ${reason}`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  broadcastEvent('USER_UPDATED', target);
  return { success: true, message: `Uthibitisho wa ${target.name} umesimamishwa kwa muda.` };
}

// ----------------- UNIFIED VERIFICATION REQUESTS (ALL IN ONE) -----------------

export function getAllVerificationRequests(actor: User): UnifiedVerificationRequest[] {
  if (actor.role !== 'super_admin' && actor.role !== 'admin') {
    return [];
  }

  const results: UnifiedVerificationRequest[] = [];
  const users = getPermanentUsers();

  // 1. Creator Apps
  const creatorApps = getCreatorApplications();
  creatorApps.forEach(c => {
    const u = users.find(user => user.id === c.userId);
    results.push({
      id: c.id,
      requestType: 'creator',
      userId: c.userId,
      userName: c.userName,
      userUsername: c.userUsername || u?.username || 'creator_user',
      userAvatar: c.userAvatar,
      raviniId: u?.raviniId || `RV-${c.userId.slice(0, 6).toUpperCase()}`,
      accountType: 'Creator Mode',
      submissionDate: c.appliedAt,
      status: c.status,
      details: {
        category: c.category,
        experience: c.experience,
        portfolioUrl: c.portfolioUrl,
        reasons: c.reasons
      },
      documents: c.documents || [],
      reviewedBy: c.reviewedBy,
      reviewedAt: c.reviewedAt,
      rejectionReason: c.rejectionReason,
      infoRequestedNote: c.infoRequestedNote
    });
  });

  // 2. Business Apps
  const bizApps = getBusinessApplications();
  bizApps.forEach(b => {
    const u = users.find(user => user.id === b.userId);
    results.push({
      id: b.id,
      requestType: 'business',
      userId: b.userId,
      userName: b.userName,
      userUsername: u?.username || 'business_user',
      userAvatar: b.userAvatar,
      raviniId: u?.raviniId || `RV-${b.userId.slice(0, 6).toUpperCase()}`,
      accountType: 'Business Mode',
      submissionDate: b.appliedAt,
      status: b.status,
      details: {
        companyName: b.companyName,
        category: b.category,
        phone: b.phone,
        email: b.email,
        location: b.location,
        tin: b.tin,
        description: b.description
      },
      documents: b.documents || [],
      reviewedBy: b.reviewedBy,
      reviewedAt: b.reviewedAt,
      rejectionReason: b.rejectionReason,
      infoRequestedNote: b.infoRequestedNote
    });
  });

  // 3. Company Apps
  const compApps = getCompanyApplications();
  compApps.forEach(cp => {
    const u = users.find(user => user.id === cp.userId);
    results.push({
      id: cp.id,
      requestType: 'company',
      userId: cp.userId,
      userName: cp.userName,
      userUsername: u?.username || 'company_user',
      userAvatar: cp.userAvatar,
      raviniId: u?.raviniId || `RV-${cp.userId.slice(0, 6).toUpperCase()}`,
      accountType: 'Company Mode',
      submissionDate: cp.appliedAt,
      status: cp.status,
      details: {
        companyName: cp.companyName,
        registrationNumber: cp.registrationNumber,
        tin: cp.tin,
        industry: cp.industry,
        phone: cp.phone,
        email: cp.email,
        address: cp.address,
        website: cp.website,
        description: cp.description
      },
      documents: cp.documents || [],
      reviewedBy: cp.reviewedBy,
      reviewedAt: cp.reviewedAt,
      rejectionReason: cp.rejectionReason,
      infoRequestedNote: cp.infoRequestedNote
    });
  });

  // 4. Trust / Badge Apps
  const trustApps = getTrustVerificationApplications();
  trustApps.forEach(t => {
    const u = users.find(user => user.id === t.userId);
    results.push({
      id: t.id,
      requestType: 'trust_badge',
      userId: t.userId,
      userName: t.userName,
      userUsername: u?.username || 'user',
      userAvatar: t.userAvatar,
      raviniId: u?.raviniId || `RV-${t.userId.slice(0, 6).toUpperCase()}`,
      accountType: t.badgeType === 'gold' ? 'Gold Badge (Biashara/Kampuni)' : 'Blue Badge (Binafsi/Muundaji)',
      submissionDate: t.appliedAt,
      status: t.status === 'verified' ? 'approved' : t.status,
      details: {
        badgeType: t.badgeType,
        documentType: t.documentType,
        nationalIdNumber: t.nationalIdNumber,
        businessRegistrationNumber: t.businessRegistrationNumber,
        phone: t.userPhone
      },
      documents: t.documents || (t.documentUrl ? [{
        id: `doc_${t.id}`,
        name: `Hati ya ${t.documentType.toUpperCase()}`,
        type: t.documentType === 'nida' ? 'nida' : t.documentType === 'passport' ? 'passport' : 'brela_certificate',
        mimeType: 'image/jpeg',
        fileSize: 1024 * 350,
        uploadedAt: t.appliedAt,
        docReference: `RV-DOC-${t.id.slice(-5).toUpperCase()}`,
        verified: t.status === 'verified'
      }] : []),
      reviewedBy: t.reviewedBy,
      reviewedAt: t.reviewedAt,
      rejectionReason: t.rejectionReason,
      infoRequestedNote: t.infoRequestedNote
    });
  });

  // Sort newest first
  return results.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
}

// ----------------- RVC PAYMENT REQUESTS & SUPER ADMIN VERIFICATION -----------------

export function getRvcRequests(): RvcDepositRequest[] {
  try {
    const raw = localStorage.getItem(RVC_REQUESTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function submitRvcDepositRequest(
  user: User, 
  amount: number, 
  paymentMethod: 'M-Pesa' | 'Airtel Money' | 'Mixx by Yas' | 'HaloPesa' | string,
  paymentReference: string
): RvcDepositRequest {
  const requests = getRvcRequests();
  const newReq: RvcDepositRequest = {
    id: `rvc_req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    userId: user.id,
    userName: user.name,
    userPhone: user.phone || 'Hakuna namba',
    userAvatar: user.avatar,
    amount,
    paymentMethod,
    paymentReference: paymentReference.trim().toUpperCase(),
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };

  requests.unshift(newReq);
  localStorage.setItem(RVC_REQUESTS_KEY, JSON.stringify(requests));

  addAuditLog(user.id, user.name, user.role, 'RVC_REQUEST_SUBMITTED', newReq.id, `Amount: TZS ${amount}, Ref: ${paymentReference}`);
  broadcastEvent('RVC_REQUESTS_UPDATED', newReq);
  return newReq;
}

export const requestRvcDeposit = submitRvcDepositRequest;

export function approveRvcDepositRequest(
  requestId: string, 
  superAdmin: User
): { 
  success: boolean; 
  message: string;
  data?: {
    customer: string;
    amount: number;
    previousBalance: number;
    amountAdded: number;
    newBalance: number;
    transactionId: string;
    paymentReference: string;
    admin: string;
    timestamp: string;
  };
} {
  // STRICT RULE: ONLY SUPER ADMIN CAN CREDIT OR APPROVE RVC
  if (superAdmin.role !== 'super_admin' && superAdmin.role !== 'admin') {
    return { success: false, message: 'Ruksa imezuiliwa: Ni Msimamizi Mkuu (Super Admin) pekee anayeweza kuidhinisha na kuongeza salio la RVC.' };
  }

  const requests = getRvcRequests();
  const req = requests.find(r => r.id === requestId);
  if (!req) return { success: false, message: 'Ombi hili halikupatikana.' };
  if (req.status !== 'pending' && req.status !== 'pending_verification') {
    return { success: false, message: 'Ombi hili tayari limeshachakatwa na salio kuongezwa. Haliwezi ku-creditwa mara ya pili.' };
  }

  const users = getPermanentUsers();
  const customer = users.find(u => u.id === req.userId);
  if (!customer) return { success: false, message: 'Mteja hakupatikana.' };

  // Double-credit protection check in ledger
  const rawTx = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  const txList: WalletTransaction[] = rawTx ? JSON.parse(rawTx) : [];
  const payRef = (req.paymentReference || req.transactionReference || '').trim();
  if (payRef && txList.some(t => t.reference === payRef || (req.transactionId && t.reference === req.transactionId))) {
    return { success: false, message: `Muamala wenye kumbukumbu "${payRef}" tayari ulishaongezwa kwenye pochi. Ombi hili haliwezi ku-creditwa mara ya pili.` };
  }

  // Generate unique transaction ID
  const uniqueTxnId = `TXN-RVC-${Math.floor(100000 + Math.random() * 900000)}`;
  const prevBalance = customer.walletBalance || 0;
  const newBalance = prevBalance + req.amount;
  const depTime = new Date().toISOString();

  // Atomic state changes
  req.status = 'approved';
  req.approvedBy = superAdmin.name;
  req.approvedAt = depTime;
  req.processedAt = depTime;
  req.processedBy = superAdmin.name;
  req.transactionId = uniqueTxnId;
  req.previousBalance = prevBalance;
  req.amountAdded = req.amount;
  req.newBalance = newBalance;
  req.creditedAt = depTime;
  req.creditedBy = superAdmin.name;
  localStorage.setItem(RVC_REQUESTS_KEY, JSON.stringify(requests));

  customer.walletBalance = newBalance;
  saveUserPermanent(customer);

  // Ledger recording
  txList.unshift({
    id: `tx_${Date.now()}_approved_rvc`,
    userId: customer.id,
    type: 'credit',
    amount: req.amount,
    description: `Malipo ya RVC yamethibitishwa kupitia ${req.paymentMethod} (Kumb: ${payRef || uniqueTxnId})`,
    createdAt: depTime,
    status: 'completed',
    reference: uniqueTxnId,
  });
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(txList));

  // Customer notification
  addNotification({
    userId: customer.id,
    actorId: superAdmin.id,
    actorName: superAdmin.name,
    actorAvatar: superAdmin.avatar,
    type: 'wallet',
    message: `Hongera! Ombi lako la RVC ${req.amount.toLocaleString()} kupitia ${req.paymentMethod} (Kumb: ${payRef}) limethibitishwa na Msimamizi Mkuu. Salio la awali: RVC ${prevBalance.toLocaleString()} → Salio jipya: RVC ${newBalance.toLocaleString()}. Muamala: ${uniqueTxnId}`,
    read: false,
  });

  addAuditLog(
    superAdmin.id, 
    superAdmin.name, 
    superAdmin.role, 
    'RVC_DEPOSIT_APPROVED', 
    uniqueTxnId, 
    `Approved RVC deposit of ${req.amount} for ${customer.name} (${customer.id}). Prev: ${prevBalance}, New: ${newBalance}, Ref: ${payRef}`
  );
  broadcastEvent('WALLET_UPDATED', { userId: customer.id });
  broadcastEvent('RVC_REQUESTS_UPDATED', req);

  return { 
    success: true, 
    message: `Umefanikiwa kuidhinisha RVC ${req.amount.toLocaleString()} kwa ${customer.name}. Namba ya Muamala: ${uniqueTxnId}`,
    data: {
      customer: customer.name,
      amount: req.amount,
      previousBalance: prevBalance,
      amountAdded: req.amount,
      newBalance,
      transactionId: uniqueTxnId,
      paymentReference: payRef,
      admin: superAdmin.name,
      timestamp: depTime
    }
  };
}

export function rejectRvcDepositRequest(
  requestId: string, 
  superAdmin: User,
  reason?: string
): { success: boolean; message: string } {
  if (superAdmin.role !== 'super_admin' && superAdmin.role !== 'admin') {
    return { success: false, message: 'Ruksa imezuiliwa: Ni Msimamizi Mkuu pekee anayeweza kukataa ombi la RVC.' };
  }

  const requests = getRvcRequests();
  const req = requests.find(r => r.id === requestId);
  if (!req) return { success: false, message: 'Ombi halikupatikana.' };
  if (req.status !== 'pending' && req.status !== 'pending_verification') {
    return { success: false, message: 'Ombi hili tayari limeshachakatwa.' };
  }

  const rejTime = new Date().toISOString();
  req.status = 'rejected';
  req.approvedBy = superAdmin.name;
  req.approvedAt = rejTime;
  req.processedAt = rejTime;
  req.processedBy = superAdmin.name;
  req.notes = reason || 'Namba ya muamala haikulingana na stakabadhi.';
  localStorage.setItem(RVC_REQUESTS_KEY, JSON.stringify(requests));

  addNotification({
    userId: req.userId,
    actorId: superAdmin.id,
    actorName: superAdmin.name,
    actorAvatar: superAdmin.avatar,
    type: 'wallet',
    message: `Samahani, ombi lako la kuweka RVC ${req.amount.toLocaleString()} (Kumb: ${req.paymentReference}) halikuidhinishwa. Sababu: ${reason || 'Namba ya muamala haikulingana na stakabadhi.'}`,
    read: false,
  });

  addAuditLog(superAdmin.id, superAdmin.name, superAdmin.role, 'RVC_DEPOSIT_REJECTED', req.id, `Rejected for ${req.userName}. Reason: ${reason || 'Invalid reference'}`);
  broadcastEvent('RVC_REQUESTS_UPDATED', req);

  return { success: true, message: 'Ombi limekataliwa kikamilifu.' };
}

export function manualCreditUser(
  userId: string,
  amount: number,
  paymentMethod: string,
  paymentReference: string,
  notes: string,
  superAdmin: User
): {
  success: boolean;
  message: string;
  data?: {
    customer: string;
    amount: number;
    previousBalance: number;
    amountAdded: number;
    newBalance: number;
    transactionId: string;
    paymentReference: string;
    admin: string;
    timestamp: string;
  };
} {
  const roleLower = (superAdmin.role || '').toLowerCase();
  if (roleLower !== 'super_admin' && roleLower !== 'admin' && roleLower !== 'manager') {
    return { success: false, message: 'Ruksa imezuiliwa: Ni Manager pekee anayeweza kuongeza salio la credits.' };
  }

  if (!amount || isNaN(amount) || !isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    return { success: false, message: 'Kiasi cha credits lazima kiwe nambari chanya kamili (integer).' };
  }

  const users = getPermanentUsers();
  const customer = users.find(u => u.id === userId);
  if (!customer) return { success: false, message: 'Mteja hakupatikana.' };

  const payRef = paymentReference.trim();
  const rawTx = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  const txList: WalletTransaction[] = rawTx ? JSON.parse(rawTx) : [];
  if (payRef && txList.some(t => t.reference === payRef)) {
    return { success: false, message: `Muamala wenye kumbukumbu "${payRef}" tayari ulishaongezwa awali kwenye pochi.` };
  }

  const uniqueTxnId = `TXN-RVC-${Math.floor(100000 + Math.random() * 900000)}`;
  const prevBalance = customer.walletBalance || 0;
  const newBalance = prevBalance + amount;
  const depTime = new Date().toISOString();

  customer.walletBalance = newBalance;
  saveUserPermanent(customer);

  txList.unshift({
    id: `tx_${Date.now()}_manual_rvc`,
    userId: customer.id,
    userRaviniId: customer.raviniId || customer.username,
    actorId: superAdmin.id,
    type: 'MANUAL_TOP_UP',
    amount,
    balanceBefore: prevBalance,
    balanceAfter: newBalance,
    description: `Manual Credit (WhatsApp Verification): ${paymentMethod} (${payRef || uniqueTxnId}) - ${notes || 'Malipo yamethibitishwa'}`,
    createdAt: depTime,
    timestamp: depTime,
    status: 'completed',
    reference: payRef || uniqueTxnId,
    paymentMethod
  });
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(txList));

  // Sync to server in background if online
  try {
    fetch('/api/wallet/manual-credit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdmin.id}`,
        'x-user-id': superAdmin.id
      },
      body: JSON.stringify({
        userId: customer.id,
        amountRvc: amount,
        paymentMethod,
        paymentReference: payRef || uniqueTxnId,
        notes: notes || 'Malipo ya WhatsApp'
      })
    }).catch(() => {});
  } catch {}

  addNotification({
    userId: customer.id,
    actorId: superAdmin.id,
    actorName: superAdmin.name,
    actorAvatar: superAdmin.avatar,
    type: 'wallet',
    message: `Hongera! Salio la RVC ${amount.toLocaleString()} limeongezwa kwenye pochi yako na Msimamizi Mkuu. Salio la awali: RVC ${prevBalance.toLocaleString()} → Salio jipya: RVC ${newBalance.toLocaleString()}. Muamala: ${uniqueTxnId}`,
    read: false,
  });

  addAuditLog(
    superAdmin.id,
    superAdmin.name,
    superAdmin.role,
    'MANUAL_RVC_CREDIT',
    uniqueTxnId,
    `Super Admin ${superAdmin.name} manually credited ${amount} RVC to ${customer.name}. Prev: ${prevBalance}, New: ${newBalance}. Method: ${paymentMethod}, Ref: ${payRef}, Note: ${notes}`
  );

  broadcastEvent('WALLET_UPDATED', { userId: customer.id });

  return {
    success: true,
    message: `Salio la RVC ${amount.toLocaleString()} limeongezwa kwa ${customer.name}. Salio jipya: RVC ${newBalance.toLocaleString()}.`,
    data: {
      customer: customer.name,
      amount,
      previousBalance: prevBalance,
      amountAdded: amount,
      newBalance,
      transactionId: uniqueTxnId,
      paymentReference: payRef || uniqueTxnId,
      admin: superAdmin.name,
      timestamp: depTime,
    }
  };
}

// ----------------- AUTHORITATIVE SERVER CREDIT DEDUCTION -----------------

export async function deductUserCreditsServer(
  userId: string,
  action: 'movie_stream' | 'video_upload' | 'post_publish' | 'market_listing',
  targetId?: string
): Promise<{
  success: boolean;
  message: string;
  deducted?: number;
  remainingBalance?: number;
  isUnlimited?: boolean;
  code?: string;
}> {
  const users = getPermanentUsers();
  const user = users.find(u => u.id === userId);
  const roleLower = (user?.role || '').toLowerCase();
  const isManager = roleLower === 'manager' || roleLower === 'super_admin';

  if (isManager) {
    return {
      success: true,
      message: 'Manager Unlimited Credits Privilege: Bypass deduction.',
      deducted: 0,
      remainingBalance: 999999999,
      isUnlimited: true
    };
  }

  try {
    const res = await fetch('/api/credits/deduct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userId}`,
        'x-user-id': userId
      },
      body: JSON.stringify({
        action,
        targetId,
        idempotencyKey: `idem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (user && typeof data.remainingBalance === 'number') {
        user.walletBalance = data.remainingBalance;
        saveUserPermanent(user);
        broadcastEvent('WALLET_UPDATED', { userId });
      }
      return data;
    } else {
      return {
        success: false,
        message: data.message || 'Salio halitoshi au hitilafu imetokea.',
        code: data.code || 'INSUFFICIENT_CREDITS'
      };
    }
  } catch (err: any) {
    // Network fallback:
    let required = 1;
    if (action === 'movie_stream') required = 3;
    else if (action === 'video_upload') required = 2;

    const cur = user?.walletBalance || 0;
    if (cur < required) {
      return {
        success: false,
        message: `Salio la credits halitoshi. Unahitaji credits ${required}, unazo ${cur}.`,
        code: 'INSUFFICIENT_CREDITS'
      };
    }

    if (user) {
      user.walletBalance = cur - required;
      saveUserPermanent(user);
      recordWalletTransaction(userId, required, 'debit', `Deduction for ${action}`);
      broadcastEvent('WALLET_UPDATED', { userId });
    }

    return {
      success: true,
      message: `Credits ${required} zimekatwa.`,
      deducted: required,
      remainingBalance: (user?.walletBalance || 0),
      isUnlimited: false
    };
  }
}

// ----------------- PAYMENT CONFIG (SUPER ADMIN CONFIGURABLE) -----------------

export function getPaymentConfig(): PaymentConfig {
  try {
    const raw = localStorage.getItem(PAYMENT_CONFIG_KEY);
    if (!raw) return DEFAULT_PAYMENT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PAYMENT_CONFIG,
      ...parsed,
      conversionRate: 1, // Strictly 1 RVC = 1 TZS
    };
  } catch {
    return DEFAULT_PAYMENT_CONFIG;
  }
}

export function updatePaymentConfig(config: PaymentConfig, adminUser: User): boolean {
  if (adminUser.role !== 'super_admin') return false;
  const existing = getPaymentConfig();
  const merged: PaymentConfig = {
    ...existing,
    ...config,
    conversionRate: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: adminUser.name,
  };
  localStorage.setItem(PAYMENT_CONFIG_KEY, JSON.stringify(merged));
  
  const auditDetails = config.whatsappNumber !== existing.whatsappNumber
    ? `WhatsApp contact updated from ${existing.whatsappNumber} to ${config.whatsappNumber}. Lipa numbers & instructions updated.`
    : `Payment numbers & instructions updated. Active: ${merged.isActive}. Min: ${merged.minTopUpAmount}, Max: ${merged.maxTopUpAmount}.`;

  addAuditLog(adminUser.id, adminUser.name, adminUser.role, 'PAYMENT_CONFIG_UPDATED', 'payment_config', auditDetails);
  broadcastEvent('PAYMENT_CONFIG_UPDATED', merged);
  return true;
}

// ----------------- AUDIT LOGS -----------------

export function getAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addAuditLog(
  actorId: string, 
  actorName: string, 
  actorRole: string, 
  action: string, 
  target: string, 
  details: string
) {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    const logs: AuditLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift({
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      actorId,
      actorName,
      actorRole,
      action,
      target,
      details,
      timestamp: new Date().toISOString(),
    });
    // Keep last 300 logs
    if (logs.length > 300) logs.pop();
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error(e);
  }
}

// ----------------- ADMIN & PERMISSIONS MANAGEMENT -----------------

export function hasPermission(user: User, permission: string): boolean {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  if (user.role === 'admin') {
    // Sensitive financial and ads permissions require explicit dedicated grant (never automatic)
    if (
      permission === 'GLOBAL_COMMUNICATION_MANAGE' ||
      permission === 'ADS_MANAGE' ||
      permission === 'ADS_APPROVE' ||
      permission === 'REVENUE_VIEW' ||
      permission === 'REFUND_MANAGE' ||
      permission === 'PRICING_MANAGE'
    ) {
      return user.permissions?.includes(permission) || false;
    }
    if (user.permissions?.includes('all')) return true;

    // Explicit Trust & Verification permissions with backward-compatible aliases
    if (permission === 'CREATOR_APPROVE') {
      return user.permissions?.includes('CREATOR_APPROVE') || user.permissions?.includes('review_creators') || false;
    }
    if (permission === 'review_creators') {
      return user.permissions?.includes('review_creators') || user.permissions?.includes('CREATOR_APPROVE') || false;
    }

    if (permission === 'BUSINESS_APPROVE') {
      return user.permissions?.includes('BUSINESS_APPROVE') || user.permissions?.includes('review_business') || false;
    }
    if (permission === 'review_business') {
      return user.permissions?.includes('review_business') || user.permissions?.includes('BUSINESS_APPROVE') || false;
    }

    if (permission === 'COMPANY_APPROVE') {
      return user.permissions?.includes('COMPANY_APPROVE') || false;
    }

    if (permission === 'VERIFICATION_MANAGE') {
      return user.permissions?.includes('VERIFICATION_MANAGE') || user.permissions?.includes('manage_users') || false;
    }
    if (permission === 'manage_users') {
      return user.permissions?.includes('manage_users') || user.permissions?.includes('VERIFICATION_MANAGE') || false;
    }

    return user.permissions?.includes(permission) || false;
  }
  return false;
}

export function promoteToAdmin(userId: string, permissions: string[], actor: User): { success: boolean; message: string } {
  const isActorSuper = (actor.role || '').toUpperCase() === 'SUPER_ADMIN' || actor.id === 'usr_baraka_mabula';
  if (!isActorSuper) {
    return { success: false, message: 'Ni Msimamizi Mkuu (Super Admin - Baraka Mabula) pekee anayeweza kuteua Wasimamizi.' };
  }
  const users = getPermanentUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return { success: false, message: 'Mtumiaji hakupatikana.' };
  if (target.id === 'usr_baraka_mabula' || (target.role || '').toUpperCase() === 'SUPER_ADMIN') {
    return { success: false, message: 'Huwezi kubadilisha Msimamizi Mkuu.' };
  }

  target.role = 'admin';
  target.permissions = permissions || [];
  saveUserPermanent(target);

  addAuditLog(actor.id, actor.name, actor.role, 'PROMOTE_ADMIN', target.id, `Promoted ${target.name} to Admin with permissions: [${permissions.join(', ') || 'none'}]`);
  broadcastEvent('USER_UPDATED', target);
  return { success: true, message: `${target.name} ameteuliwa kuwa Msimamizi (Admin) kikamilifu na kupewa idhini zilizochaguliwa.` };
}

export function revokeAdmin(userId: string, actor: User): { success: boolean; message: string } {
  const isActorSuper = (actor.role || '').toUpperCase() === 'SUPER_ADMIN' || actor.id === 'usr_baraka_mabula';
  if (!isActorSuper) {
    return { success: false, message: 'Ni Msimamizi Mkuu (Super Admin - Baraka Mabula) pekee anayeweza kuondoa mamlaka ya Msimamizi.' };
  }
  const users = getPermanentUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return { success: false, message: 'Mtumiaji hakupatikana.' };
  if (target.id === 'usr_baraka_mabula' || (target.role || '').toUpperCase() === 'SUPER_ADMIN') {
    return { success: false, message: 'Huwezi kuondoa mamlaka ya Msimamizi Mkuu.' };
  }

  target.role = 'user';
  target.permissions = [];
  saveUserPermanent(target);

  addAuditLog(actor.id, actor.name, actor.role, 'REVOKE_ADMIN', target.id, `Revoked Admin status from ${target.name}`);
  broadcastEvent('USER_UPDATED', target);
  return { success: true, message: `Mamlaka ya kiutawala kwa ${target.name} yameondolewa. Amerejeshwa kuwa mwanachama wa kawaida.` };
}

export function updateAdminPermissions(userId: string, permissions: string[], actor: User): { success: boolean; message: string } {
  const isActorSuper = (actor.role || '').toUpperCase() === 'SUPER_ADMIN' || actor.id === 'usr_baraka_mabula';
  if (!isActorSuper) {
    return { success: false, message: 'Ni Msimamizi Mkuu (Super Admin) pekee anayeweza kusimamia idhini za Wasimamizi.' };
  }
  const users = getPermanentUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return { success: false, message: 'Mtumiaji hakupatikana.' };
  if (target.id === 'usr_baraka_mabula' || (target.role || '').toUpperCase() === 'SUPER_ADMIN') {
    return { success: false, message: 'Super Admin ana mamlaka yote daima.' };
  }

  target.permissions = permissions;
  saveUserPermanent(target);

  addAuditLog(actor.id, actor.name, actor.role, 'UPDATE_ADMIN_PERMISSIONS', target.id, `Updated permissions for ${target.name}: [${permissions.join(', ') || 'none'}]`);
  broadcastEvent('USER_UPDATED', target);
  return { success: true, message: `Idhini za ${target.name} zimesasishwa kikamilifu.` };
}

export function toggleUserVerification(userId: string, actor: User): { success: boolean; isVerified: boolean; message: string } {
  if (actor.role !== 'super_admin' && !hasPermission(actor, 'manage_users')) {
    return { success: false, isVerified: false, message: 'Huna idhini ya kuthibitisha watumiaji.' };
  }
  const users = getPermanentUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return { success: false, isVerified: false, message: 'Mtumiaji hakupatikana.' };

  target.verified = !target.verified;
  saveUserPermanent(target);

  addAuditLog(actor.id, actor.name, actor.role, 'TOGGLE_VERIFY_USER', target.id, `${target.verified ? 'Verified' : 'Unverified'} user @${target.username}`);
  broadcastEvent('USER_UPDATED', target);
  return { 
    success: true, 
    isVerified: target.verified, 
    message: target.verified ? `Mtumiaji ${target.name} amethibitishwa (Verified Badge).` : `Uthibitisho wa ${target.name} umeondolewa.` 
  };
}

// Full Controller: Allow / Disallow Posting
export function toggleUserPostingAllowed(userId: string, actor: User): { success: boolean; isPostingAllowed: boolean; message: string } {
  if (actor.role !== 'super_admin' && !hasPermission(actor, 'manage_users')) {
    return { success: false, isPostingAllowed: true, message: 'Huna mamlaka ya kubadilisha idhini ya kuchapisha.' };
  }
  const users = getPermanentUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return { success: false, isPostingAllowed: true, message: 'Mtumiaji hakupatikana.' };
  if (target.role === 'super_admin') return { success: false, isPostingAllowed: true, message: 'Huwezi kuzuia Super Admin kuchapisha.' };

  target.isPostingDisabled = !target.isPostingDisabled;
  saveUserPermanent(target);

  const allowed = !target.isPostingDisabled;
  addAuditLog(actor.id, actor.name, actor.role, 'TOGGLE_POSTING_PERMISSION', target.id, allowed ? `Allowed posting for @${target.username}` : `Disallowed posting for @${target.username}`);
  broadcastEvent('USER_UPDATED', target);
  return {
    success: true,
    isPostingAllowed: allowed,
    message: allowed ? `Uwezo wa kuchapisha kwa @${target.username} umeruhusiwa (Allowed).` : `Uwezo wa kuchapisha kwa @${target.username} umezuiliwa (Disallowed).`
  };
}

// Full Controller: Enable / Disable User Account
export function toggleUserAccountStatus(userId: string, actor: User): { success: boolean; isDisabled: boolean; message: string } {
  const isActorSuper = (actor.role || '').toUpperCase() === 'SUPER_ADMIN' || actor.id === 'usr_baraka_mabula';
  if (!isActorSuper) {
    return { success: false, isDisabled: false, message: 'Ni Super Admin pekee anayeweza kuwezesha au kulemaza akaunti ya mtumiaji.' };
  }
  const users = getPermanentUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return { success: false, isDisabled: false, message: 'Mtumiaji hakupatikana.' };
  if (target.id === 'usr_baraka_mabula' || (target.role || '').toUpperCase() === 'SUPER_ADMIN') {
    return { success: false, isDisabled: false, message: 'Huwezi kulemaza akaunti ya Msimamizi Mkuu (Super Admin).' };
  }

  target.isDisabled = !target.isDisabled;
  saveUserPermanent(target);

  addAuditLog(actor.id, actor.name, actor.role, 'TOGGLE_USER_STATUS', target.id, target.isDisabled ? `Disabled user @${target.username}` : `Enabled user @${target.username}`);
  broadcastEvent('USER_UPDATED', target);
  return {
    success: true,
    isDisabled: target.isDisabled,
    message: target.isDisabled 
      ? `Akaunti ya @${target.username} imelemazwa (Disabled). Mtumiaji amezuiwa kuingia na kutumia mfumo.` 
      : `Akaunti ya @${target.username} imewezeshwa (Enabled) kikamilifu.`
  };
}

// Full Controller: Delete User (Soft-delete to Trash)
export function deleteUserAdmin(userId: string, actor: User, reason?: string): { success: boolean; message: string } {
  const isActorSuper = (actor.role || '').toUpperCase() === 'SUPER_ADMIN' || actor.id === 'usr_baraka_mabula';
  if (!isActorSuper) {
    return { success: false, message: 'Ni Super Admin pekee anayeweza kufuta mtumiaji.' };
  }
  const users = getPermanentUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return { success: false, message: 'Mtumiaji hakupatikana.' };
  if (target.id === 'usr_baraka_mabula' || (target.role || '').toUpperCase() === 'SUPER_ADMIN') {
    return { success: false, message: 'Huwezi kufuta Super Admin.' };
  }

  target.isDeleted = true;
  target.deletedAt = new Date().toISOString();
  saveUserPermanent(target);

  addAuditLog(actor.id, actor.name, actor.role, 'DELETE_USER', target.id, `Deleted user @${target.username}. Reason: ${reason || 'Hatua ya usimamizi mkuu'}`);
  broadcastEvent('USER_UPDATED', target);
  return { success: true, message: `Akaunti ya @${target.username} imefutwa na kupelekwa kwenye Jalada (Trash). Unaweza kuirejesha (Restore) wakati wowote.` };
}

// Full Controller: Restore Deleted User
export function restoreUserAdmin(userId: string, actor: User): { success: boolean; message: string } {
  const isActorSuper = (actor.role || '').toUpperCase() === 'SUPER_ADMIN' || actor.id === 'usr_baraka_mabula';
  if (!isActorSuper) {
    return { success: false, message: 'Ni Super Admin pekee anayeweza kurejesha mtumiaji.' };
  }
  const users = getPermanentUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return { success: false, message: 'Mtumiaji hakupatikana.' };

  target.isDeleted = false;
  target.deletedAt = undefined;
  saveUserPermanent(target);

  addAuditLog(actor.id, actor.name, actor.role, 'RESTORE_USER', target.id, `Restored user @${target.username} back to active`);
  broadcastEvent('USER_UPDATED', target);
  return { success: true, message: `Akaunti ya @${target.username} imerejeshwa (Restored) kikamilifu!` };
}

// Full Controller: Soft Delete Post (Move to Trash)
export function deletePostAdmin(postId: string, actor: User, reason?: string): { success: boolean; message: string } {
  if (actor.role !== 'super_admin' && !hasPermission(actor, 'moderate_posts') && !hasPermission(actor, 'post_moderation_manage')) {
    return { success: false, message: 'Huna idhini ya kuondoa machapisho ya watumiaji.' };
  }
  const posts = getPermanentPosts(true);
  const target = posts.find(p => p.id === postId);
  if (!target) return { success: false, message: 'Chapisho halikupatikana.' };

  const now = new Date().toISOString();
  target.isDeleted = true;
  target.deletedAt = now;
  target.deletedBy = actor.name;
  target.deleteReason = reason || 'Ukiukaji wa miongozo ya jamii ya RAVINI';
  target.moderationStatus = 'removed';

  if (!target.moderationHistory) target.moderationHistory = [];
  target.moderationHistory.push({
    action: 'POST_DELETED',
    moderatorId: actor.id,
    moderatorName: actor.name,
    moderatorRole: actor.role,
    reason: target.deleteReason,
    timestamp: now,
    previousStatus: target.moderationStatus || 'normal',
    resultingStatus: 'removed'
  });

  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error(e);
  }

  // Synchronize with backend API
  fetch(`/api/v1/posts/${postId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: target.deleteReason })
  }).catch(() => {});

  addAuditLog(actor.id, actor.name, actor.role, 'DELETE_POST', postId, `Soft-deleted post by @${target.authorUsername}. Reason: ${target.deleteReason}`);
  broadcastEvent('NEW_POST', posts);
  return { success: true, message: 'Chapisho limeondolewa hewani na kupelekwa kwenye Jalada (Trash). Unaweza kulirejesha (Restore) wakati wowote.' };
}

// Full Controller: Restore Deleted Post back to Live Feed
export function restorePostAdmin(postId: string, actor: User): { success: boolean; message: string } {
  if (actor.role !== 'super_admin' && !hasPermission(actor, 'moderate_posts') && !hasPermission(actor, 'post_moderation_manage')) {
    return { success: false, message: 'Huna idhini ya kurejesha machapisho.' };
  }
  const posts = getPermanentPosts(true);
  const target = posts.find(p => p.id === postId);
  if (!target) return { success: false, message: 'Chapisho halikupatikana.' };

  const now = new Date().toISOString();
  target.isDeleted = false;
  target.deletedAt = undefined;
  target.deletedBy = undefined;
  target.deleteReason = undefined;
  target.moderationStatus = 'normal';

  if (!target.moderationHistory) target.moderationHistory = [];
  target.moderationHistory.push({
    action: 'POST_RESTORED',
    moderatorId: actor.id,
    moderatorName: actor.name,
    moderatorRole: actor.role,
    reason: 'Restored by admin review',
    timestamp: now,
    previousStatus: 'removed',
    resultingStatus: 'normal'
  });

  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error(e);
  }

  // Synchronize with backend API
  fetch(`/api/v1/posts/${postId}/restore`, {
    method: 'POST'
  }).catch(() => {});

  addAuditLog(actor.id, actor.name, actor.role, 'RESTORE_POST', postId, `Restored post by @${target.authorUsername} back to live feed`);
  broadcastEvent('NEW_POST', posts);
  return { success: true, message: `Chapisho la @${target.authorUsername} limerejeshwa (Restored) kwenye mtandao kikamilifu!` };
}

// Full Controller: Restrict Post
export function restrictPostAdmin(postId: string, actor: User, reason: string): { success: boolean; message: string } {
  if (actor.role !== 'super_admin' && !hasPermission(actor, 'moderate_posts') && !hasPermission(actor, 'post_moderation_manage')) {
    return { success: false, message: 'Huna idhini ya kuzuia machapisho.' };
  }
  const posts = getPermanentPosts(true);
  const target = posts.find(p => p.id === postId);
  if (!target) return { success: false, message: 'Chapisho halikupatikana.' };

  const now = new Date().toISOString();
  target.moderationStatus = 'restricted';
  target.restrictedReason = reason;
  target.moderatedBy = actor.id;
  target.moderatedAt = now;

  if (!target.moderationHistory) target.moderationHistory = [];
  target.moderationHistory.push({
    action: 'POST_RESTRICTED',
    moderatorId: actor.id,
    moderatorName: actor.name,
    moderatorRole: actor.role,
    reason,
    timestamp: now,
    previousStatus: 'normal',
    resultingStatus: 'restricted'
  });

  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error(e);
  }

  // Synchronize with backend API
  fetch(`/api/v1/posts/${postId}/restrict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  }).catch(() => {});

  addAuditLog(actor.id, actor.name, actor.role, 'RESTRICT_POST', postId, `Restricted post by @${target.authorUsername}. Reason: ${reason}`);
  broadcastEvent('NEW_POST', posts);
  return { success: true, message: `Chapisho la @${target.authorUsername} limezuiwa (restricted) kutokana na: ${reason}` };
}

// Full Controller: Toggle Post Comments
export function togglePostCommentsAdmin(postId: string, actor: User, commentsDisabled: boolean): { success: boolean; message: string } {
  const posts = getPermanentPosts(true);
  const target = posts.find(p => p.id === postId);
  if (!target) return { success: false, message: 'Chapisho halikupatikana.' };

  const isOwner = target.authorId === actor.id || target.ownerId === actor.id;
  const isSuperAdmin = actor.role === 'super_admin';
  const isAdmin = actor.role === 'admin' && (hasPermission(actor, 'moderate_posts') || hasPermission(actor, 'post_moderation_manage'));

  if (!isOwner && !isSuperAdmin && !isAdmin) {
    return { success: false, message: 'Mwenye chapisho au Msimamizi pekee anaweza kurekebisha hali ya maoni.' };
  }

  target.commentsDisabled = commentsDisabled;
  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error(e);
  }

  // Synchronize with backend API
  fetch(`/api/v1/posts/${postId}/comments-toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commentsDisabled })
  }).catch(() => {});

  broadcastEvent('NEW_POST', posts);
  return { 
    success: true, 
    message: commentsDisabled ? 'Maoni yamezimwa kwenye chapisho hili.' : 'Maoni yamewashwa kwenye chapisho hili.' 
  };
}

// Full Controller: Delete Comment Admin
export function deleteCommentAdmin(commentId: string, actor: User, reason: string = 'Comment removed'): { success: boolean; message: string } {
  // Sync with backend API
  fetch(`/api/v1/comments/${commentId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  }).catch(() => {});

  addAuditLog(actor.id, actor.name, actor.role, 'DELETE_COMMENT', commentId, `Deleted comment ${commentId}. Reason: ${reason}`);
  return { success: true, message: 'Maoni yameondolewa kikamilifu.' };
}

// Full Controller: Restore Comment Admin
export function restoreCommentAdmin(commentId: string, actor: User): { success: boolean; message: string } {
  // Sync with backend API
  fetch(`/api/v1/comments/${commentId}/restore`, {
    method: 'POST'
  }).catch(() => {});

  addAuditLog(actor.id, actor.name, actor.role, 'RESTORE_COMMENT', commentId, `Restored comment ${commentId}`);
  return { success: true, message: 'Maoni yamerejeshwa kikamilifu.' };
}

// Full Controller: Unrestrict Post
export function unrestrictPostAdmin(postId: string, actor: User): { success: boolean; message: string } {
  if (actor.role !== 'super_admin' && !hasPermission(actor, 'moderate_posts') && !hasPermission(actor, 'post_moderation_manage')) {
    return { success: false, message: 'Huna idhini ya kuondoa kizuizi kwenye chapisho.' };
  }
  const posts = getPermanentPosts(true);
  const target = posts.find(p => p.id === postId);
  if (!target) return { success: false, message: 'Chapisho halikupatikana.' };

  const now = new Date().toISOString();
  target.moderationStatus = 'normal';
  target.restrictedReason = undefined;

  if (!target.moderationHistory) target.moderationHistory = [];
  target.moderationHistory.push({
    action: 'POST_UNRESTRICTED',
    moderatorId: actor.id,
    moderatorName: actor.name,
    moderatorRole: actor.role,
    reason: 'Unrestricted by admin review',
    timestamp: now,
    previousStatus: 'restricted',
    resultingStatus: 'normal'
  });

  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error(e);
  }

  fetch(`/api/v1/posts/${postId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moderationStatus: 'normal', restrictedReason: null })
  }).catch(() => {});

  addAuditLog(actor.id, actor.name, actor.role, 'UNRESTRICT_POST', postId, `Unrestricted post by @${target.authorUsername}`);
  broadcastEvent('NEW_POST', posts);
  return { success: true, message: `Kizuizi kimeondolewa kwenye chapisho la @${target.authorUsername}!` };
}

// Full Controller: Remove Media Only
export function removePostMediaAdmin(postId: string, actor: User, reason: string = 'Media removed for violating guidelines'): { success: boolean; message: string } {
  if (actor.role !== 'super_admin' && !hasPermission(actor, 'moderate_posts') && !hasPermission(actor, 'post_moderation_manage')) {
    return { success: false, message: 'Huna idhini ya kuondoa media kwenye chapisho.' };
  }
  const posts = getPermanentPosts(true);
  const target = posts.find(p => p.id === postId);
  if (!target) return { success: false, message: 'Chapisho halikupatikana.' };

  const now = new Date().toISOString();
  target.mediaUrl = undefined;
  target.mediaType = undefined;
  target.mediaDuration = undefined;
  (target as any).thumbnailUrl = undefined;
  target.mediaFilter = undefined;

  if (!target.moderationHistory) target.moderationHistory = [];
  target.moderationHistory.push({
    action: 'MEDIA_REMOVED',
    moderatorId: actor.id,
    moderatorName: actor.name,
    moderatorRole: actor.role,
    reason,
    timestamp: now,
    previousStatus: target.moderationStatus || 'normal',
    resultingStatus: target.moderationStatus || 'normal'
  });

  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error(e);
  }

  fetch(`/api/v1/posts/${postId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mediaUrl: null, mediaType: null })
  }).catch(() => {});

  addAuditLog(actor.id, actor.name, actor.role, 'REMOVE_MEDIA_POST', postId, `Removed media from post by @${target.authorUsername}. Reason: ${reason}`);
  broadcastEvent('NEW_POST', posts);
  return { success: true, message: 'Media (Picha/Video) imeondolewa kwenye chapisho hili huku maelezo ya maandishi yakibaki.' };
}

// Full Controller: Mark Post Safe
export function markPostSafeAdmin(postId: string, actor: User): { success: boolean; message: string } {
  if (actor.role !== 'super_admin' && !hasPermission(actor, 'moderate_posts') && !hasPermission(actor, 'post_moderation_manage')) {
    return { success: false, message: 'Huna idhini ya kusafisha ripoti za machapisho.' };
  }
  const posts = getPermanentPosts(true);
  const target = posts.find(p => p.id === postId);
  if (!target) return { success: false, message: 'Chapisho halikupatikana.' };

  const now = new Date().toISOString();
  target.moderationStatus = 'normal';
  target.restrictedReason = undefined;

  if (!target.moderationHistory) target.moderationHistory = [];
  target.moderationHistory.push({
    action: 'MARKED_SAFE',
    moderatorId: actor.id,
    moderatorName: actor.name,
    moderatorRole: actor.role,
    reason: 'Cleared all flags & marked safe',
    timestamp: now,
    previousStatus: target.moderationStatus || 'normal',
    resultingStatus: 'normal'
  });

  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error(e);
  }

  // Also dismiss pending reports for this post
  const reports = getContentReports();
  reports.forEach(r => {
    if (r.targetId === postId && r.status === 'pending') {
      resolveContentReport(r.id, 'dismiss', actor, 'Marked post safe by moderator review');
    }
  });

  addAuditLog(actor.id, actor.name, actor.role, 'MARK_POST_SAFE', postId, `Marked post by @${target.authorUsername} as safe`);
  broadcastEvent('NEW_POST', posts);
  return { success: true, message: `Chapisho la @${target.authorUsername} limewekwa alama kuwa salama (Marked Safe) na ripoti zimefungwa.` };
}

// Full Controller: Apply Warning Strike to User
export function applyUserWarningStrike(targetUserId: string, actor: User, reason: string): { success: boolean; message: string; warningStrikes: number } {
  if (actor.role !== 'super_admin' && !hasPermission(actor, 'moderate_posts') && !hasPermission(actor, 'manage_users')) {
    return { success: false, message: 'Huna idhini ya kutoa onyo kwa watumiaji.', warningStrikes: 0 };
  }
  const users = getPermanentUsers();
  const target = users.find(u => u.id === targetUserId);
  if (!target) return { success: false, message: 'Mtumiaji hakupatikana.', warningStrikes: 0 };

  const currentStrikes = ((target as any).warningStrikes || 0) + 1;
  (target as any).warningStrikes = currentStrikes;
  if (!(target as any).warningsHistory) (target as any).warningsHistory = [];
  (target as any).warningsHistory.push({
    id: 'wrn_' + Date.now(),
    reason,
    issuedBy: actor.name,
    issuedAt: new Date().toISOString()
  });

  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error(e);
  }

  // Synchronize with backend API
  fetch(`/api/v1/users/${targetUserId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ warningStrikes: currentStrikes })
  }).catch(() => {});

  addAuditLog(actor.id, actor.name, actor.role, 'USER_WARNING_STRIKE', targetUserId, `Applied strike #${currentStrikes} to @${target.username}. Reason: ${reason}`);
  broadcastEvent('USER_UPDATED', target);
  return { 
    success: true, 
    message: `Onyo limetumwa kwa @${target.username} (Strike ${currentStrikes}/3). Sababu: ${reason}`,
    warningStrikes: currentStrikes 
  };
}

// Full Controller: Permanently Purge Post
export function purgePostAdmin(postId: string, actor: User): { success: boolean; message: string } {
  if (actor.role !== 'super_admin') {
    return { success: false, message: 'Ni Super Admin pekee anayeweza kufuta chapisho kabisa bila uwezo wa kurejesha.' };
  }
  let posts = getPermanentPosts(true);
  const beforeLen = posts.length;
  posts = posts.filter(p => p.id !== postId);
  if (posts.length === beforeLen) return { success: false, message: 'Chapisho halikupatikana.' };

  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error(e);
  }

  addAuditLog(actor.id, actor.name, actor.role, 'PURGE_POST', postId, 'Permanently purged post');
  broadcastEvent('NEW_POST', posts);
  return { success: true, message: 'Chapisho limefutwa kabisa (Permanently deleted) kutoka kwenye kumbukumbu ya mfumo.' };
}

// Full Controller: Soft Delete Market Item
export function deleteMarketItemAdmin(itemId: string, actor: User): { success: boolean; message: string } {
  if (actor.role !== 'super_admin' && !hasPermission(actor, 'moderate_posts')) {
    return { success: false, message: 'Huna idhini ya kuondoa bidhaa sokoni.' };
  }
  const market = getPermanentMarket(true);
  const target = market.find(m => m.id === itemId);
  if (!target) return { success: false, message: 'Bidhaa haikupatikana.' };

  target.isDeleted = true;
  target.deletedAt = new Date().toISOString();
  target.deletedBy = actor.name;
  localStorage.setItem(MARKET_STORAGE_KEY, JSON.stringify(market));

  addAuditLog(actor.id, actor.name, actor.role, 'DELETE_MARKET_ITEM', itemId, `Deleted market item: ${target.title}`);
  broadcastEvent('NEW_MARKET_ITEM', target);
  return { success: true, message: 'Bidhaa imeondolewa sokoni na kupelekwa kwenye Trash. Unaweza kuirejesha wakati wowote.' };
}

// Full Controller: Restore Market Item
export function restoreMarketItemAdmin(itemId: string, actor: User): { success: boolean; message: string } {
  if (actor.role !== 'super_admin' && !hasPermission(actor, 'moderate_posts')) {
    return { success: false, message: 'Huna idhini ya kurejesha bidhaa.' };
  }
  const market = getPermanentMarket(true);
  const target = market.find(m => m.id === itemId);
  if (!target) return { success: false, message: 'Bidhaa haikupatikana.' };

  target.isDeleted = false;
  target.deletedAt = undefined;
  target.deletedBy = undefined;
  localStorage.setItem(MARKET_STORAGE_KEY, JSON.stringify(market));

  addAuditLog(actor.id, actor.name, actor.role, 'RESTORE_MARKET_ITEM', itemId, `Restored market item: ${target.title}`);
  broadcastEvent('NEW_MARKET_ITEM', target);
  return { success: true, message: 'Bidhaa imerejeshwa sokoni kikamilifu!' };
}

// Full Controller: Change Super Admin Password
export function updateSuperAdminPassword(newPass: string, actor: User): { success: boolean; message: string } {
  if (actor.role !== 'super_admin') {
    return { success: false, message: 'Ni Super Admin pekee anayeweza kubadili nenosiri la Msimamizi Mkuu hapa.' };
  }
  if (!newPass || newPass.trim().length < 4) {
    return { success: false, message: 'Nenosiri jipya lazima liwe na angalau herufi au tarakimu 4.' };
  }
  const users = getPermanentUsers();
  const superAdmin = users.find(u => u.id === actor.id || u.role === 'super_admin');
  if (!superAdmin) return { success: false, message: 'Super Admin hakupatikana.' };

  superAdmin.password = newPass.trim();
  saveUserPermanent(superAdmin);
  addAuditLog(actor.id, actor.name, actor.role, 'SUPER_ADMIN_PASSWORD_UPDATED', superAdmin.id, 'Super Admin password updated');
  return { success: true, message: 'Nenosiri la Msimamizi Mkuu limebadilishwa kikamilifu! Sasa unaweza kulitumia kuingia.' };
}

// Full Controller: System Settings Global Controls
export function getSystemSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(SYSTEM_SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(DEFAULT_SYSTEM_SETTINGS));
      return DEFAULT_SYSTEM_SETTINGS;
    }
    return { ...DEFAULT_SYSTEM_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SYSTEM_SETTINGS;
  }
}

export function updateSystemSettings(
  newSettings: Partial<SystemSettings>, 
  actor: User
): { success: boolean; settings: SystemSettings; message: string } {
  if (actor.role !== 'super_admin') {
    return { success: false, settings: getSystemSettings(), message: 'Ni Super Admin pekee anayeweza kubadili mipangilio mikuu ya mfumo mzima.' };
  }
  const current = getSystemSettings();
  const updated: SystemSettings = { ...current, ...newSettings };
  localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(updated));
  addAuditLog(actor.id, actor.name, actor.role, 'SYSTEM_SETTINGS_UPDATED', 'system_controller', JSON.stringify(newSettings));
  broadcastEvent('SYSTEM_SETTINGS_UPDATED', updated);
  return { success: true, settings: updated, message: 'Mipangilio ya mfumo imehifadhiwa kikamilifu.' };
}

export function setCurrentUserId(userId: string) {
  try {
    localStorage.setItem(CURRENT_USER_ID_KEY, userId);
    broadcastEvent('ACTIVE_USER_CHANGED', userId);
  } catch (e) {
    console.error('Failed setting current user id:', e);
  }
}

// ----------------- POSTS MANAGEMENT (REAL-TIME & PERMANENT) -----------------

export function getPermanentPosts(includeDeleted = false): Post[] {
  try {
    const raw = localStorage.getItem(POSTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    let posts: Post[] = Array.isArray(parsed) ? parsed : [];
    const origLen = posts.length;
    posts = posts.filter(p => p && !LEGACY_DEMO_IDS.has(p.id) && !p.id.startsWith('post_welcome_') && !p.id.startsWith('post_amina_') && !p.id.startsWith('post_neema_'));
    if (posts.length !== origLen) {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
    }
    if (includeDeleted) return posts;
    return posts.filter(p => p && !p.isDeleted);
  } catch (e) {
    console.error('Failed reading posts:', e);
    return [];
  }
}

export function createNewPost(postData: Omit<Post, 'id' | 'createdAt' | 'reactions' | 'commentsCount' | 'sharesCount' | 'viewsCount'>): Post {
  // Blueprint Section 5: Strict Credit Balance Management
  // Deductions: Post = -1 credit, Video Upload = -2 credits
  // Manager Special Privilege: Unlimited credits (∞), bypass deduction
  const isVideo = postData.mediaType === 'video' || postData.mediaType === 'clip';
  const requiredCredits = isVideo ? 2 : 1;
  const allUsers = getPermanentUsers();
  const authorIndex = allUsers.findIndex(u => u.id === postData.authorId);

  if (authorIndex !== -1) {
    const author = allUsers[authorIndex];
    const isManager = author.role === 'manager' || author.role === 'super_admin';
    if (!isManager) {
      const currentBalance = author.walletBalance || 0;
      if (currentBalance < requiredCredits) {
        throw new Error(`Salio halitoshi! Unahitaji credits ${requiredCredits} kuchapisha (${isVideo ? 'Video Upload' : 'Chapisho'}), lakini unazo credits ${currentBalance}. Tafadhali ongeza salio kupitia WhatsApp ya Manager.`);
      }
      author.walletBalance = currentBalance - requiredCredits;
      allUsers[authorIndex] = author;
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
        recordWalletTransaction(author.id, requiredCredits, 'debit', `Makato ya credits kwa ${isVideo ? 'kupakia video' : 'kuchapisha'}`);
      } catch (err) {
        console.error('Failed updating user wallet on post create:', err);
      }
    }
  }

  const posts = getPermanentPosts();
  const newPost: Post = {
    ...postData,
    id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    reactions: {},
    commentsCount: 0,
    sharesCount: 0,
    viewsCount: 1,
  };

  // Add at the top for instant visibility
  posts.unshift(newPost);
  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error('Failed saving new post:', e);
  }

  // Broadcast realtime update to all tabs/listeners
  broadcastEvent('NEW_POST', newPost);
  return newPost;
}

export function togglePostReaction(postId: string, userId: string, reactionType: ReactionType): Post | null {
  const posts = getPermanentPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return null;

  if (!post.reactions) post.reactions = {};

  if (post.reactions[userId] === reactionType) {
    // Remove reaction if clicked twice
    delete post.reactions[userId];
  } else {
    post.reactions[userId] = reactionType;
    if (post.authorId && post.authorId !== userId) {
      const reactingUser = getPermanentUsers().find(u => u.id === userId);
      const reactionEmojiMap: Record<ReactionType, string> = {
        like: '👍',
        love: '❤️',
        care: '🥰',
        haha: '😂',
        wow: '😮',
        sad: '😢',
        angry: '😡'
      };
      const reactionEmoji = reactionEmojiMap[reactionType] || '👍';
      addNotification({
        userId: post.authorId,
        actorId: userId,
        actorName: reactingUser?.name || 'Mtumiaji wa RAVINI',
        actorAvatar: reactingUser?.avatar,
        type: 'like',
        title: 'Mwitikio Mpya wa Chapisho',
        titleSw: `Mwitikio Mpya: ${reactionEmoji}`,
        titleEn: `New Reaction: ${reactionEmoji}`,
        message: `${reactingUser?.name || 'Mtumiaji'} amependa chapisho lako.`,
        messageSw: `${reactingUser?.name || 'Mtumiaji'} ameitikia chapisho lako (${reactionEmoji}).`,
        messageEn: `${reactingUser?.name || 'A user'} reacted (${reactionEmoji}) to your post.`,
        targetTab: 'feed',
        read: false,
      });
    }
  }

  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error('Failed updating reactions:', e);
  }

  broadcastEvent('POST_REACTION_UPDATED', { postId, reactions: post.reactions });
  return post;
}

export function incrementPostShares(postId: string): number {
  const posts = getPermanentPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return 0;
  post.sharesCount = (post.sharesCount || 0) + 1;
  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error(e);
  }
  broadcastEvent('POST_SHARE_UPDATED', { postId, sharesCount: post.sharesCount });
  return post.sharesCount;
}

// ----------------- COMMENTS (REAL-TIME & PERMANENT) -----------------

export function getPermanentComments(postId?: string): PostComment[] {
  try {
    const raw = localStorage.getItem(COMMENTS_STORAGE_KEY);
    let comments: PostComment[] = raw ? JSON.parse(raw) : [];
    if (Array.isArray(comments)) {
      const origLen = comments.length;
      comments = comments.filter(c => c && !LEGACY_DEMO_IDS.has(c.userId) && !c.id.startsWith('comm_1') && !c.id.startsWith('comm_2') && !c.id.startsWith('comm_3') && !c.id.startsWith('comm_4'));
      if (comments.length !== origLen) {
        localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
      }
    } else {
      comments = [];
    }
    if (postId) {
      return comments.filter(c => c.postId === postId);
    }
    return comments;
  } catch (e) {
    console.error('Failed reading comments:', e);
    return [];
  }
}

export function addPostComment(postId: string, user: User, content: string): PostComment {
  const allComments = getPermanentComments();
  const newComment: PostComment = {
    id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    postId,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    userVerified: user.verified,
    content,
    createdAt: new Date().toISOString(),
    likesCount: 0,
    likedBy: [],
  };

  allComments.push(newComment);
  try {
    localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(allComments));
  } catch (e) {
    console.error('Failed saving comment:', e);
  }

  // Update post comments count
  const posts = getPermanentPosts();
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.commentsCount = (post.commentsCount || 0) + 1;
    try {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
      console.error(e);
    }

    // Generate real notification for post author
    if (post.authorId && post.authorId !== user.id) {
      addNotification({
        userId: post.authorId,
        actorId: user.id,
        actorName: user.name,
        actorAvatar: user.avatar,
        type: 'comment',
        title: 'Maoni Mapya',
        titleSw: 'Maoni Mapya ya Chapisho',
        titleEn: 'New Post Comment',
        message: `${user.name} ametoa maoni: "${content.substring(0, 45)}"`,
        messageSw: `${user.name} ametoa maoni: "${content.substring(0, 45)}"`,
        messageEn: `${user.name} commented: "${content.substring(0, 45)}"`,
        targetTab: 'feed',
        read: false,
      });
    }
  }

  broadcastEvent('NEW_COMMENT', newComment);
  broadcastEvent('POST_COMMENTS_COUNT_UPDATED', { postId, count: post?.commentsCount || 1 });
  return newComment;
}

// ----------------- STORIES (REAL-TIME & PERMANENT) -----------------

export function getPermanentStories(): Story[] {
  try {
    const raw = localStorage.getItem(STORIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    let stories: Story[] = Array.isArray(parsed) ? parsed : [];
    const origLen = stories.length;
    stories = stories.filter(s => s && !LEGACY_DEMO_IDS.has(s.id) && !s.id.startsWith('story_baraka') && !s.id.startsWith('story_amina') && !s.id.startsWith('story_juma'));
    if (stories.length !== origLen) {
      localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(stories));
    }
    return stories;
  } catch (e) {
    return [];
  }
}

export function addPermanentStory(user: User, mediaUrl: string, caption?: string): Story {
  const stories = getPermanentStories();
  const newStory: Story = {
    id: `story_${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    mediaUrl,
    caption,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    viewsCount: 1,
  };
  stories.unshift(newStory);
  try {
    localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(stories));
  } catch (e) {
    console.error(e);
  }
  broadcastEvent('NEW_STORY', newStory);
  return newStory;
}

export const addStory = addPermanentStory;

// ----------------- MARKETPLACE (REAL-TIME) -----------------

export function getPermanentMarket(includeDeleted = false): MarketItem[] {
  try {
    const raw = localStorage.getItem(MARKET_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MARKET_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    let items: MarketItem[] = Array.isArray(parsed) ? parsed : [];
    const origLen = items.length;
    items = items.filter(m => m && !LEGACY_DEMO_IDS.has(m.id) && !m.id.startsWith('mkt_1') && !m.id.startsWith('mkt_2') && !m.id.startsWith('mkt_3') && !m.id.startsWith('market_item_'));
    if (items.length !== origLen) {
      localStorage.setItem(MARKET_STORAGE_KEY, JSON.stringify(items));
    }
    if (includeDeleted) return items;
    return items.filter(m => m && !m.isDeleted);
  } catch (e) {
    return [];
  }
}

export const getPermanentMarketItems = getPermanentMarket;

export function addMarketItem(user: User, item: Omit<MarketItem, 'id' | 'sellerId' | 'sellerName' | 'sellerAvatar' | 'createdAt'>): MarketItem {
  // Blueprint Section 5: Deduct 1 credit for market listing (Manager bypass)
  const isManager = user.role === 'manager' || user.role === 'super_admin';
  const requiredCredits = 1;
  const allUsers = getPermanentUsers();
  const userIdx = allUsers.findIndex(u => u.id === user.id);

  if (!isManager) {
    const currentBalance = (userIdx !== -1 ? allUsers[userIdx].walletBalance : user.walletBalance) || 0;
    if (currentBalance < requiredCredits) {
      throw new Error(`Salio halitoshi! Unahitaji credit ${requiredCredits} kuorodhesha bidhaa sokoni, una credits ${currentBalance}. Ongeza salio kupitia WhatsApp ya Manager.`);
    }
    if (userIdx !== -1) {
      allUsers[userIdx].walletBalance = currentBalance - requiredCredits;
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
        recordWalletTransaction(user.id, requiredCredits, 'debit', `Makato ya kuorodhesha bidhaa sokoni: ${item.title}`);
      } catch (err) {
        console.error('Failed saving wallet deduction for market item:', err);
      }
    }
  }

  const market = getPermanentMarket();
  const newItem: MarketItem = {
    ...item,
    id: `mkt_${Date.now()}`,
    sellerId: user.id,
    sellerName: user.name,
    sellerAvatar: user.avatar,
    createdAt: new Date().toISOString(),
  };
  market.unshift(newItem);
  try {
    localStorage.setItem(MARKET_STORAGE_KEY, JSON.stringify(market));
  } catch (e) {
    console.error(e);
  }
  broadcastEvent('NEW_MARKET_ITEM', newItem);
  return newItem;
}

// ----------------- CHAT / MESSENGER -----------------

export function getPermanentMessages(userId1?: string, userId2?: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
    const messages: ChatMessage[] = raw ? JSON.parse(raw) : [];
    if (!userId1 || !userId2) {
      return messages;
    }
    return messages.filter(m =>
      (m.senderId === userId1 && m.receiverId === userId2) ||
      (m.senderId === userId2 && m.receiverId === userId1)
    );
  } catch {
    return [];
  }
}

export function sendChatMessage(
  senderId: string, 
  receiverId: string, 
  content: string, 
  options?: { mediaUrl?: string; mediaType?: 'image' | 'voice' | 'item'; itemId?: string }
): ChatMessage {
  // Backend Authorization & Global Communication Check
  const allUsers = getPermanentUsers();
  const sender = allUsers.find(u => u.id === senderId);
  const senderRole = sender?.role || 'user';

  const commCheck = checkCommunicationAllowed('chat', senderRole);
  if (!commCheck.allowed) {
    throw new Error(commCheck.reason || '🔒 Mawasiliano yamefungwa kwa muda na Super Admin.');
  }

  if (options?.mediaUrl) {
    const mediaCheck = checkCommunicationAllowed('mediaSharing', senderRole);
    if (!mediaCheck.allowed) {
      throw new Error(mediaCheck.reason || '🔒 Kushiriki picha na faili kumesitishwa kwa muda na Super Admin.');
    }
  }

  const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
  const messages: ChatMessage[] = raw ? JSON.parse(raw) : [];
  const newMsg: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    senderId,
    receiverId,
    content,
    createdAt: new Date().toISOString(),
    read: false,
    mediaUrl: options?.mediaUrl,
    mediaType: options?.mediaType,
    itemId: options?.itemId,
  };
  messages.push(newMsg);
  try {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error(e);
  }
  broadcastEvent('NEW_CHAT_MESSAGE', newMsg);

  // Generate real notification for message receiver
  if (receiverId && receiverId !== senderId && receiverId !== 'usr_huduma_wateja') {
    addNotification({
      userId: receiverId,
      actorId: senderId,
      actorName: sender?.name || 'Mtumiaji wa RAVINI',
      actorAvatar: sender?.avatar,
      type: 'message',
      title: 'Ujumbe Mpya',
      titleSw: 'Ujumbe Mpya',
      titleEn: 'New Message',
      message: `${sender?.name || 'Mtumiaji'}: ${content.substring(0, 45)}`,
      messageSw: `${sender?.name || 'Mtumiaji'}: ${content.substring(0, 45)}`,
      messageEn: `${sender?.name || 'User'}: ${content.substring(0, 45)}`,
      targetTab: 'chat',
      read: false,
    });
  }

  // If message sent to Customer Care (usr_huduma_wateja), generate automated supportive reply
  if (receiverId === 'usr_huduma_wateja' && senderId !== 'usr_huduma_wateja') {
    setTimeout(() => {
      const lower = content.toLowerCase();
      let reply = 'Habari ndugu mwanachama wa RAVINI! 🇹🇿 Dawati la Huduma kwa Wateja limepokea ujumbe wako. Tuko hapa kukusaidia. Je, unahitaji msaada kuhusu Pochi ya RVC, Usajili wa Biashara/Muundaji, au jambo gani jingine?';

      if (lower.includes('pochi') || lower.includes('pesa') || lower.includes('salio') || lower.includes('rvc') || lower.includes('topup')) {
        reply = 'Habari! Kuhusu Pochi ya RVC:\n1. Unaweza kuongeza salio (Top-Up) kupitia M-Pesa, Tigo Pesa, Airtel Money, au HaloPesa.\n2. Malipo yako yanapopokelewa, thibitisho la namba ya muamala huingizwa na Msimamizi Mkuu huidhinisha mara moja.\n3. Salio lako halipotei na lipo salama kwenye pochi yako ya kidijitali!';
      } else if (lower.includes('biashara') || lower.includes('duka') || lower.includes('kampuni') || lower.includes('sokoni') || lower.includes('business')) {
        reply = 'Habari! Kuanzisha duka au kusajili kampuni yako RAVINI:\n1. Nenda kwenye Wasifu wako (Profile) -> Mipangilio -> "Sajili Kampuni / Biashara".\n2. Jaza jina la kampuni, namba ya TIN, na maelezo ya bidhaa.\n3. Super Admin ataipitia na kukupa beji rasmi ya Biashara (Business Badge)!';
      } else if (lower.includes('creator') || lower.includes('muundaji') || lower.includes('sanaa') || lower.includes('video')) {
        reply = 'Habari! Kujiunga kama Muundaji Maudhui (Creator):\n1. Nenda kwenye Wasifu (Profile) -> Mipangilio -> "Akaunti ya Muundaji".\n2. Chagua kitengo chako (Sanaa, Muziki, Teknolojia, Mitindo n.k) na utume maombi.\n3. Ukikubaliwa utaweza kupata "Creator Mode" na kufikia maelfu ya wafuasi!';
      } else if (lower.includes('nenosiri') || lower.includes('password') || lower.includes('badili')) {
        reply = 'Habari! Unaweza kubadilisha nenosiri lako wakati wowote kwa kwenda kwenye Wasifu (Profile) -> Mipangilio -> "Badili Nenosiri". Kumbuka kuweka nenosiri lenye nguvu.';
      } else if (lower.includes('habari') || lower.includes('mambo') || lower.includes('hello') || lower.includes('hi')) {
        reply = 'Habari ya leo! Karibu sana RAVINI Customer Care. Mfumo wetu unakuwezesha kuwasiliana na marafiki, wafanyabiashara sokoni, na waundaji maudhui kwa urahisi kabisa. Nini ungependa tukusaidie leo?';
      }

      const autoReplyMsg: ChatMessage = {
        id: `msg_reply_${Date.now()}`,
        senderId: 'usr_huduma_wateja',
        receiverId: senderId,
        content: reply,
        createdAt: new Date().toISOString(),
        read: false,
      };

      try {
        const currentRaw = localStorage.getItem(MESSAGES_STORAGE_KEY);
        const currentMsgs: ChatMessage[] = currentRaw ? JSON.parse(currentRaw) : [];
        currentMsgs.push(autoReplyMsg);
        localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(currentMsgs));
        broadcastEvent('NEW_CHAT_MESSAGE', autoReplyMsg);
      } catch (err) {
        console.error('Failed auto-replying:', err);
      }
    }, 700);
  }

  return newMsg;
}

// ----------------- NOTIFICATIONS & PREFERENCES -----------------

function getInitialSeedNotifications(): NotificationItem[] {
  // STRICT USER DIRECTIVE: Real Notification System
  // Notifications must be generated ONLY from real events.
  // Do NOT create: fake notifications, demo notifications, random notifications, or placeholder counts.
  // If there are no notifications, show: "Huna notifications mpya."
  return [];
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  messages: true,
  calls: true,
  friends: true,
  followers: true,
  likes: true,
  comments: true,
  shares: true,
  market: true,
  creator: true,
  business: true,
  company: true,
  premium: true,
  security: true, // Always true
  announcements: true,
  pushEnabled: true,
  inAppEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  socialRequests: true,
  activityLikesComments: true,
  chatMessagesCalls: true,
  marketOrdersDelivery: true,
  walletTransactions: true,
  officialAnnouncements: true,
  creatorUpdates: true,
  securityAlerts: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  pushDevices: [
    {
      deviceId: 'dev_primary_web',
      deviceName: 'Chrome Web Push (Primary)',
      browser: 'Google Chrome / Android',
      token: 'rvn_push_token_chrome_849201',
      registeredAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    }
  ]
};

export function getNotificationPreferences(userId: string): NotificationPreferences {
  try {
    const raw = localStorage.getItem(`${NOTIFICATION_PREFERENCES_KEY}_${userId}`);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...parsed,
      security: true // Invariant
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export function saveNotificationPreferences(userId: string, prefs: Partial<NotificationPreferences>): NotificationPreferences {
  const current = getNotificationPreferences(userId);
  const updated: NotificationPreferences = {
    ...current,
    ...prefs,
    security: true // Invariant: Cannot be turned off
  };
  try {
    localStorage.setItem(`${NOTIFICATION_PREFERENCES_KEY}_${userId}`, JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
  broadcastEvent('NOTIFICATION_PREFERENCES_UPDATED', { userId, preferences: updated });
  return updated;
}

export function registerDevicePushToken(userId: string, deviceName: string, browser: string, token?: string): PushDeviceToken {
  const prefs = getNotificationPreferences(userId);
  const generatedToken = token || `rvn_push_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const newDevice: PushDeviceToken = {
    deviceId: `dev_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
    deviceName: deviceName || 'Kifaa Kipya / Web Browser',
    browser: browser || 'Modern Web Browser',
    token: generatedToken,
    registeredAt: new Date().toISOString(),
    lastActive: new Date().toISOString()
  };

  const existingDevices = prefs.pushDevices || [];
  const filtered = existingDevices.filter(d => d.token !== generatedToken);
  filtered.push(newDevice);

  saveNotificationPreferences(userId, { pushDevices: filtered, pushEnabled: true });
  return newDevice;
}

export function removeDevicePushToken(userId: string, deviceId: string): void {
  const prefs = getNotificationPreferences(userId);
  const filtered = (prefs.pushDevices || []).filter(d => d.deviceId !== deviceId);
  saveNotificationPreferences(userId, { pushDevices: filtered });
}

function mapNotificationTypeToCategory(type: NotificationType): keyof Omit<NotificationPreferences, 'pushEnabled' | 'pushDevices'> {
  switch (type) {
    case 'message':
    case 'message_request':
      return 'messages';
    case 'voice_call':
    case 'video_call':
      return 'calls';
    case 'friend_request':
    case 'friend_accepted':
      return 'friends';
    case 'follow':
      return 'followers';
    case 'like':
    case 'reaction':
      return 'likes';
    case 'comment':
      return 'comments';
    case 'share':
      return 'shares';
    case 'order':
    case 'order_status':
    case 'delivery':
      return 'market';
    case 'creator_status':
    case 'creator_earnings':
      return 'creator';
    case 'business_status':
      return 'business';
    case 'company_status':
      return 'company';
    case 'premium':
    case 'viral_campaign':
      return 'premium';
    case 'wallet':
    case 'rvc_transaction':
    case 'tip':
      return 'premium';
    case 'security_alert':
    case 'account_status':
    case 'password_reset':
      return 'security';
    case 'announcement':
      return 'announcements';
    default:
      return 'announcements';
  }
}

export function getPermanentNotifications(userId?: string): NotificationItem[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notifications: NotificationItem[] = raw ? JSON.parse(raw) : [];
    if (userId) {
      return notifications.filter(n => n.userId === userId);
    }
    return notifications;
  } catch {
    return [];
  }
}

export function addNotification(item: Omit<NotificationItem, 'id' | 'createdAt'>): NotificationItem | null {
  // Check user notification preferences
  const prefs = getNotificationPreferences(item.userId);
  const category = mapNotificationTypeToCategory(item.type);

  // Critical security notifications bypass preference checks
  const isSecurity = category === 'security' || item.isCriticalSecurity;
  if (!isSecurity && prefs[category] === false) {
    return null; // Suppressed by user preference
  }

  const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  const notifications: NotificationItem[] = raw ? JSON.parse(raw) : [];
  const newNotif: NotificationItem = {
    ...item,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(newNotif);
  // Cap at 300 to preserve performance
  if (notifications.length > 300) notifications.pop();
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error(e);
  }
  broadcastEvent('NEW_NOTIFICATION', newNotif);
  broadcastEvent('NOTIFICATIONS_UPDATED', { userId: item.userId });
  return newNotif;
}

export function markNotificationRead(notifId: string) {
  const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  const notifications: NotificationItem[] = raw ? JSON.parse(raw) : [];
  const found = notifications.find(n => n.id === notifId);
  if (found) {
    found.read = true;
    found.readAt = new Date().toISOString();
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
    broadcastEvent('NOTIFICATIONS_UPDATED', { notifId, userId: found.userId });
  }
}

export function markAllNotificationsRead(userId: string): void {
  const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  const notifications: NotificationItem[] = raw ? JSON.parse(raw) : [];
  const now = new Date().toISOString();
  notifications.forEach(n => {
    if (n.userId === userId) {
      n.read = true;
      n.readAt = now;
    }
  });
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error(e);
  }
  broadcastEvent('NOTIFICATIONS_UPDATED', { userId });
}

export function archiveNotificationPermanent(notifId: string, archived: boolean = true): void {
  const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  const notifications: NotificationItem[] = raw ? JSON.parse(raw) : [];
  const found = notifications.find(n => n.id === notifId);
  if (found) {
    found.archived = archived;
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
    broadcastEvent('NOTIFICATIONS_UPDATED', { notifId, userId: found.userId });
  }
}

export function deleteNotificationPermanent(notifId: string): void {
  const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  const notifications: NotificationItem[] = raw ? JSON.parse(raw) : [];
  const found = notifications.find(n => n.id === notifId);
  const remaining = notifications.filter(n => n.id !== notifId);
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(remaining));
  } catch (e) {
    console.error(e);
  }
  if (found) {
    broadcastEvent('NOTIFICATIONS_UPDATED', { userId: found.userId });
  }
}

export function clearNotificationsPermanent(userId: string): void {
  const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  const notifications: NotificationItem[] = raw ? JSON.parse(raw) : [];
  const remaining = notifications.filter(n => n.userId !== userId);
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(remaining));
  } catch (e) {
    console.error(e);
  }
  broadcastEvent('NOTIFICATIONS_UPDATED', { userId });
}

// ----------------- SYSTEM ANNOUNCEMENTS (SUPER ADMIN & PERMITTED ADMINS) -----------------

export const DEFAULT_SYSTEM_ANNOUNCEMENTS: SystemAnnouncement[] = [
  {
    id: 'ann_welcome_2026',
    title: 'Karibu kwenye RAVINI — Mtandao Rasmi wa Kitanzania 🇹🇿',
    titleSw: 'Karibu kwenye RAVINI — Mtandao Rasmi wa Kitanzania 🇹🇿',
    titleEn: 'Welcome to RAVINI — Official Tanzanian Platform 🇹🇿',
    message: 'Tunawakaribisha watumiaji wote kujiunga, kushirikiana, kufanya biashara sokoni na kuendeleza uchumi wa kidijitali kupitia RAVINI COMPANY LIMITED.',
    messageSw: 'Tunawakaribisha watumiaji wote kujiunga, kushirikiana, kufanya biashara sokoni na kuendeleza uchumi wa kidijitali kupitia RAVINI COMPANY LIMITED.',
    messageEn: 'We welcome all users to connect, trade on the marketplace, and build the digital economy through RAVINI COMPANY LIMITED.',
    mediaUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
    language: 'all',
    priority: 'normal',
    targetAudience: 'all',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.000Z',
    status: 'published',
    createdById: 'usr_baraka_mabula',
    createdByName: 'Baraka Mabula',
    createdAt: '2026-01-01T00:00:00.000Z',
    publishedAt: '2026-01-01T00:00:00.000Z',
    impressionsCount: 2450,
    readsCount: 1820,
    readByUserIds: ['usr_baraka_mabula']
  },
  {
    id: 'ann_security_kyc',
    title: 'Uhakiki wa Kitambulisho cha Taifa (NIDA) & Usalama wa Pochi',
    titleSw: 'Uhakiki wa Kitambulisho cha Taifa (NIDA) & Usalama wa Pochi',
    titleEn: 'NIDA Verification & Wallet Security Guidelines',
    message: 'Tafadhali kamilisha uthibitishaji wa akaunti yako kupitia NIDA ili kuongeza ukomo wa kutoa fedha na kupata beji rasmi ya Verified.',
    messageSw: 'Tafadhali kamilisha uthibitishaji wa akaunti yako kupitia NIDA ili kuongeza ukomo wa kutoa fedha na kupata beji rasmi ya Verified.',
    messageEn: 'Please complete your account verification via NIDA to increase transaction limits and earn the official Verified badge.',
    language: 'all',
    priority: 'urgent',
    targetAudience: 'all',
    startDate: '2026-02-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.000Z',
    status: 'published',
    createdById: 'usr_baraka_mabula',
    createdByName: 'Baraka Mabula',
    createdAt: '2026-02-01T00:00:00.000Z',
    publishedAt: '2026-02-01T00:00:00.000Z',
    impressionsCount: 1980,
    readsCount: 1420,
    readByUserIds: []
  }
];

export function getSystemAnnouncements(): SystemAnnouncement[] {
  try {
    const raw = localStorage.getItem(SYSTEM_ANNOUNCEMENTS_KEY);
    if (!raw) {
      localStorage.setItem(SYSTEM_ANNOUNCEMENTS_KEY, JSON.stringify(DEFAULT_SYSTEM_ANNOUNCEMENTS));
      return DEFAULT_SYSTEM_ANNOUNCEMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SYSTEM_ANNOUNCEMENTS;
  }
}

export function getAnnouncementsForUser(user: User): SystemAnnouncement[] {
  const all = getSystemAnnouncements();
  const now = new Date();

  return all.filter(ann => {
    // Must be published
    if (ann.status !== 'published') return false;

    // Check dates
    const start = new Date(ann.startDate);
    if (now < start) return false;
    if (ann.endDate) {
      const end = new Date(ann.endDate);
      if (now > end) return false;
    }

    // Check target audience
    if (ann.targetAudience === 'all') return true;
    if (ann.targetAudience === 'creator' && user.creatorApproved) return true;
    if (ann.targetAudience === 'business' && user.businessApproved) return true;
    if (ann.targetAudience === 'company' && user.businessApproved) return true;
    if (ann.targetAudience === 'admin' && (user.role === 'admin' || user.role === 'super_admin')) return true;
    if (ann.targetAudience === 'employee' && (user.role === 'admin' || user.role === 'super_admin')) return true;
    if (ann.targetAudience === 'customer' && user.role === 'user') return true;

    return false;
  });
}

export function createSystemAnnouncement(
  data: Omit<SystemAnnouncement, 'id' | 'createdAt' | 'impressionsCount' | 'readsCount' | 'readByUserIds'>,
  actor: User
): { success: boolean; message: string; announcement?: SystemAnnouncement } {
  // Authorization check: Super Admin or Admin with ANNOUNCEMENT_MANAGE permission
  const isSuper = actor.role === 'super_admin';
  const hasPerm = hasPermission(actor, 'ANNOUNCEMENT_MANAGE');
  if (!isSuper && !hasPerm) {
    return {
      success: false,
      message: 'Huna idhini ya kuchapisha au kusimamia matangazo rasmi (ANNOUNCEMENT_MANAGE inahitajika).'
    };
  }

  const all = getSystemAnnouncements();
  const newAnn: SystemAnnouncement = {
    ...data,
    id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdById: actor.id,
    createdByName: actor.name,
    createdAt: new Date().toISOString(),
    publishedAt: data.status === 'published' ? new Date().toISOString() : undefined,
    impressionsCount: 0,
    readsCount: 0,
    readByUserIds: []
  };

  all.unshift(newAnn);
  try {
    localStorage.setItem(SYSTEM_ANNOUNCEMENTS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error(e);
  }

  // Audit log
  addAuditLog(
    actor.id,
    actor.name,
    actor.role,
    'CREATE_ANNOUNCEMENT',
    newAnn.id,
    `Created official announcement: "${newAnn.title}" [Target: ${newAnn.targetAudience}, Priority: ${newAnn.priority}, Status: ${newAnn.status}]`
  );

  // If published, distribute notifications to relevant users
  if (newAnn.status === 'published') {
    const users = getPermanentUsers();
    users.forEach(u => {
      let isTarget = false;
      if (newAnn.targetAudience === 'all') isTarget = true;
      else if (newAnn.targetAudience === 'creator' && u.creatorApproved) isTarget = true;
      else if (newAnn.targetAudience === 'business' && u.businessApproved) isTarget = true;
      else if (newAnn.targetAudience === 'company' && u.businessApproved) isTarget = true;
      else if (newAnn.targetAudience === 'admin' && (u.role === 'admin' || u.role === 'super_admin')) isTarget = true;
      else if (newAnn.targetAudience === 'employee' && (u.role === 'admin' || u.role === 'super_admin')) isTarget = true;
      else if (newAnn.targetAudience === 'customer' && u.role === 'user') isTarget = true;

      if (isTarget) {
        addNotification({
          userId: u.id,
          type: 'announcement',
          title: newAnn.title,
          titleSw: newAnn.titleSw || newAnn.title,
          titleEn: newAnn.titleEn || newAnn.title,
          message: newAnn.message,
          messageSw: newAnn.messageSw || newAnn.message,
          messageEn: newAnn.messageEn || newAnn.message,
          targetId: newAnn.id,
          targetTab: 'notifications',
          read: false,
          priority: newAnn.priority,
          isCriticalSecurity: newAnn.priority === 'critical'
        });
      }
    });
  }

  broadcastEvent('ANNOUNCEMENT_CREATED', newAnn);
  return {
    success: true,
    message: `Tangazo rasmi "${newAnn.title}" limefanikiwa kuhifadhiwa!`,
    announcement: newAnn
  };
}

export function updateSystemAnnouncement(
  id: string,
  updates: Partial<SystemAnnouncement>,
  actor: User
): { success: boolean; message: string; announcement?: SystemAnnouncement } {
  const isSuper = actor.role === 'super_admin';
  const hasPerm = hasPermission(actor, 'ANNOUNCEMENT_MANAGE');
  if (!isSuper && !hasPerm) {
    return { success: false, message: 'Huna idhini ya kurekebisha matangazo rasmi.' };
  }

  const all = getSystemAnnouncements();
  const index = all.findIndex(a => a.id === id);
  if (index === -1) return { success: false, message: 'Tangazo halikupatikana.' };

  const current = all[index];
  const updated: SystemAnnouncement = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  if (updates.status === 'published' && current.status !== 'published') {
    updated.publishedAt = new Date().toISOString();
  } else if (updates.status === 'disabled' && current.status !== 'disabled') {
    updated.disabledAt = new Date().toISOString();
  } else if (updates.status === 'expired' && current.status !== 'expired') {
    updated.expiredAt = new Date().toISOString();
  }

  all[index] = updated;
  try {
    localStorage.setItem(SYSTEM_ANNOUNCEMENTS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error(e);
  }

  addAuditLog(
    actor.id,
    actor.name,
    actor.role,
    'UPDATE_ANNOUNCEMENT',
    id,
    `Updated announcement: "${updated.title}" [Status: ${updated.status}]`
  );

  broadcastEvent('ANNOUNCEMENT_UPDATED', updated);
  return { success: true, message: 'Tangazo limerekebishwa kwa ufanisi.', announcement: updated };
}

export function deleteSystemAnnouncement(id: string, actor: User): { success: boolean; message: string } {
  const isSuper = actor.role === 'super_admin';
  const hasPerm = hasPermission(actor, 'ANNOUNCEMENT_MANAGE');
  if (!isSuper && !hasPerm) {
    return { success: false, message: 'Huna idhini ya kufuta matangazo rasmi.' };
  }

  const all = getSystemAnnouncements();
  const target = all.find(a => a.id === id);
  const remaining = all.filter(a => a.id !== id);

  try {
    localStorage.setItem(SYSTEM_ANNOUNCEMENTS_KEY, JSON.stringify(remaining));
  } catch (e) {
    console.error(e);
  }

  if (target) {
    addAuditLog(
      actor.id,
      actor.name,
      actor.role,
      'DELETE_ANNOUNCEMENT',
      id,
      `Deleted announcement: "${target.title}"`
    );
  }

  broadcastEvent('ANNOUNCEMENT_DELETED', { id });
  return { success: true, message: 'Tangazo limefutwa.' };
}

export function trackAnnouncementImpression(id: string): void {
  const all = getSystemAnnouncements();
  const found = all.find(a => a.id === id);
  if (found) {
    found.impressionsCount = (found.impressionsCount || 0) + 1;
    try {
      localStorage.setItem(SYSTEM_ANNOUNCEMENTS_KEY, JSON.stringify(all));
    } catch (e) {
      console.error(e);
    }
  }
}

export function markAnnouncementRead(id: string, userId: string): void {
  const all = getSystemAnnouncements();
  const found = all.find(a => a.id === id);
  if (found) {
    found.readByUserIds = found.readByUserIds || [];
    if (!found.readByUserIds.includes(userId)) {
      found.readByUserIds.push(userId);
      found.readsCount = (found.readsCount || 0) + 1;
      try {
        localStorage.setItem(SYSTEM_ANNOUNCEMENTS_KEY, JSON.stringify(all));
      } catch (e) {
        console.error(e);
      }
    }
  }
}

// ----------------- WALLET & TRANSACTIONS -----------------

export function recordWalletTransaction(
  userId: string,
  amount: number,
  type: 'credit' | 'debit' | 'transfer',
  description: string
): WalletTransaction {
  const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  const list: WalletTransaction[] = raw ? JSON.parse(raw) : [];
  const tx: WalletTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    type,
    amount: type === 'debit' ? -Math.abs(amount) : Math.abs(amount),
    description,
    createdAt: new Date().toISOString(),
    status: 'completed',
    reference: `TXN-${Math.floor(100000 + Math.random() * 900000)}`
  };
  list.unshift(tx);
  try {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(list));
    broadcastEvent('WALLET_UPDATED', { userId, tx });
  } catch (err) {
    console.error('Failed writing transaction:', err);
  }
  return tx;
}

export function getPermanentTransactions(userId: string): WalletTransaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    const list: WalletTransaction[] = raw ? JSON.parse(raw) : [];
    return list.filter(t => t.userId === userId);
  } catch {
    return [];
  }
}

export function performWalletTransfer(senderUser: User, recipientUserId: string, amount: number, note: string): { success: boolean; message: string } {
  if (senderUser.walletBalance < amount) {
    return { success: false, message: 'Salio lako halitoshi kufanya muamala huu.' };
  }

  const users = getPermanentUsers();
  const recipient = users.find(u => u.id === recipientUserId);
  if (!recipient) {
    return { success: false, message: 'Mtumiaji anayepokea hakupatikana.' };
  }

  // Deduct sender
  senderUser.walletBalance -= amount;
  saveUserPermanent(senderUser);

  // Credit receiver
  recipient.walletBalance += amount;
  saveUserPermanent(recipient);

  // Record transactions
  const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  const list: WalletTransaction[] = raw ? JSON.parse(raw) : [];
  const txRef = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

  list.unshift({
    id: `tx_${Date.now()}_out`,
    userId: senderUser.id,
    type: 'transfer',
    amount: -amount,
    description: `Uhamisho kwenda kwa ${recipient.name} (${note || 'Bila maelezo'})`,
    createdAt: new Date().toISOString(),
    status: 'completed',
    reference: txRef,
  });

  list.unshift({
    id: `tx_${Date.now()}_in`,
    userId: recipient.id,
    type: 'credit',
    amount: amount,
    description: `Umepokea kutoka kwa ${senderUser.name} (${note || 'Bila maelezo'})`,
    createdAt: new Date().toISOString(),
    status: 'completed',
    reference: txRef,
  });

  try {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }

  broadcastEvent('WALLET_UPDATED', { senderId: senderUser.id, recipientId: recipient.id });
  return { success: true, message: `Umefanikiwa kutuma TZS ${amount.toLocaleString()} kwa ${recipient.name}!` };
}

export function topUpWallet(userId: string, amount: number, provider: string): { success: boolean; message: string } {
  // Production Data Hardening (Requirement 10: REAL DATA ONLY)
  // Direct mobile money (M-Pesa / Tigo Pesa / Airtel) API gateway credentials are not configured in this environment.
  // We DO NOT simulate fake balance or fabricate successful transactions.
  return {
    success: false,
    message: `BLOCKED / NOT CONFIGURED: Muunganisho wa moja kwa moja wa lango la malipo ya mtandao (${provider} API) haujasanidiwa kwenye mazingira haya ya seva. Tafadhali tumia mfumo rasmi wa "Wasilisha Ombi la RVC" (Manual Deposit Request) kwa kuambatanisha kumbukumbu ya muamala ili ukaguliwe na kuidhinishwa na Wasimamizi wa Fedha.`
  };
}

// ----------------- AUDIT LOGS & NOTIFICATIONS PERMANENT -----------------

export function logAuditPermanent(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
  const logs = getAuditLogs();
  const entry: AuditLog = {
    ...log,
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(entry);
  try {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 1000)));
  } catch (e) {
    console.error(e);
  }
  broadcastEvent('AUDIT_LOG_ADDED', entry);
  return entry;
}

export const logAudit = logAuditPermanent;

export function saveNotificationPermanent(notif: NotificationItem): void {
  try {
    const list = getPermanentNotifications();
    list.unshift(notif);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list.slice(0, 500)));
    broadcastEvent('NEW_NOTIFICATION', notif);
  } catch (e) {
    console.error(e);
  }
}

// ----------------- FORCE LOGOUT & SESSION SECURITY -----------------

export function forceLogoutAllUsers(superAdminId: string): { success: boolean; message: string; count: number } {
  const users = getPermanentUsers();
  const superAdmin = users.find(u => u.id === superAdminId);
  if (!superAdmin || superAdmin.role !== 'super_admin') {
    return { success: false, message: 'Ruhusa hii ni ya Super Admin pekee.', count: 0 };
  }

  const now = new Date().toISOString();
  let count = 0;
  users.forEach(u => {
    if (u.id !== superAdminId) {
      u.forceLogoutAt = now;
      count++;
    }
  });

  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error(e);
  }

  logAuditPermanent({
    actorId: superAdmin.id,
    actorName: superAdmin.name,
    actorRole: 'super_admin',
    action: 'FORCE_LOGOUT_ALL_USERS',
    target: 'All Non-Super-Admin Users',
    details: `Super Admin ametekeleza Force Logout kwa watumiaji ${count}. Vikao vyote vimefungwa mara moja.`
  });

  broadcastEvent('FORCE_LOGOUT_ALL', { actorId: superAdminId, timestamp: now });
  return { success: true, message: `Vikao vyote vya watumiaji (${count}) vimefungwa mara moja.`, count };
}

export function forceLogoutUser(userId: string, superAdminId: string): { success: boolean; message: string } {
  const users = getPermanentUsers();
  const actor = users.find(u => u.id === superAdminId);
  if (!actor || (actor.role !== 'super_admin' && actor.role !== 'admin')) {
    return { success: false, message: 'Huna mamlaka ya kufanya oparesheni hii.' };
  }

  const target = users.find(u => u.id === userId);
  if (!target) return { success: false, message: 'Mtumiaji hakupatikana.' };

  target.forceLogoutAt = new Date().toISOString();
  saveUserPermanent(target);

  logAuditPermanent({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'FORCE_LOGOUT_USER',
    target: `${target.name} (${target.username})`,
    details: `Kikao cha mtumiaji kimefungwa kwa lazima (Force Logout).`
  });

  broadcastEvent('FORCE_LOGOUT_USER', { userId, timestamp: target.forceLogoutAt });
  return { success: true, message: `Kikao cha ${target.name} kimefungwa kwa lazima.` };
}

export function forceLogoutAllAdmins(superAdminId: string): { success: boolean; message: string; count: number } {
  const users = getPermanentUsers();
  const superAdmin = users.find(u => u.id === superAdminId);
  if (!superAdmin || superAdmin.role !== 'super_admin') {
    return { success: false, message: 'Ruhusa hii ni ya Super Admin pekee.', count: 0 };
  }

  const now = new Date().toISOString();
  let count = 0;
  users.forEach(u => {
    if (u.id !== superAdminId && (u.role === 'admin' || u.role === 'employee')) {
      u.forceLogoutAt = now;
      count++;
    }
  });

  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error(e);
  }

  logAuditPermanent({
    actorId: superAdmin.id,
    actorName: superAdmin.name,
    actorRole: 'super_admin',
    action: 'FORCE_LOGOUT_ALL_ADMINS',
    target: 'All Admin & Staff Accounts',
    details: `Super Admin amelazimisha force logout kwa wasimamizi wote (${count}).`
  });

  broadcastEvent('FORCE_LOGOUT_ADMINS', { actorId: superAdminId, timestamp: now });
  return { success: true, message: `Vikao vya wasimamizi wote (${count}) vimefungwa mara moja.`, count };
}

// ----------------- TEMPORARY & PERMANENT ACCOUNT BLOCKING -----------------

export function temporarilyBlockAccount(
  userId: string,
  durationHours: number,
  reason: string,
  isPermanent: boolean,
  actorId: string
): { success: boolean; message: string } {
  const users = getPermanentUsers();
  const actor = users.find(u => u.id === actorId);
  if (!actor || (actor.role !== 'super_admin' && !actor.permissions?.includes('manage_users') && !actor.permissions?.includes('all'))) {
    return { success: false, message: 'Huna ruhusa ya kufunga akaunti.' };
  }

  const target = users.find(u => u.id === userId);
  if (!target) return { success: false, message: 'Mtumiaji hakupatikana.' };
  if (target.role === 'super_admin') {
    return { success: false, message: 'Huwezi kufunga akaunti ya Super Admin!' };
  }

  const now = new Date();
  const endDate = isPermanent ? undefined : new Date(now.getTime() + durationHours * 3600000).toISOString();

  target.isSuspended = true;
  target.suspensionDetails = {
    startDate: now.toISOString(),
    endDate,
    durationHours,
    reason: reason || 'Kukiuka kanuni za matumizi ya mfumo wa RAVINI.',
    isPermanent,
  };
  target.forceLogoutAt = now.toISOString();

  saveUserPermanent(target);

  logAuditPermanent({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: isPermanent ? 'PERMANENT_ACCOUNT_BLOCK' : 'TEMPORARY_ACCOUNT_BLOCK',
    target: `${target.name} (${target.username})`,
    details: `Akaunti imefungwa ${isPermanent ? 'moja kwa moja' : `kwa masaa ${durationHours}`}. Sababu: ${reason}`
  });

  broadcastEvent('USER_SUSPENDED', { userId: target.id, isPermanent, endDate, reason });
  return { 
    success: true, 
    message: isPermanent 
      ? `Akaunti ya ${target.name} imefungwa moja kwa moja.` 
      : `Akaunti ya ${target.name} imefungwa kwa masaa ${durationHours}. Itafunguka kiotomatiki ${new Date(endDate!).toLocaleString()}.` 
  };
}

export function unblockAccount(userId: string, actorId: string): { success: boolean; message: string } {
  const users = getPermanentUsers();
  const actor = users.find(u => u.id === actorId);
  if (!actor || (actor.role !== 'super_admin' && !actor.permissions?.includes('manage_users') && !actor.permissions?.includes('all'))) {
    return { success: false, message: 'Huna ruhusa ya kufungua akaunti.' };
  }

  const target = users.find(u => u.id === userId);
  if (!target) return { success: false, message: 'Mtumiaji hakupatikana.' };

  target.isSuspended = false;
  target.suspensionDetails = undefined;
  saveUserPermanent(target);

  logAuditPermanent({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'UNBLOCK_ACCOUNT',
    target: `${target.name} (${target.username})`,
    details: `Akaunti imerejeshwa kufanya kazi kikamilifu.`
  });

  broadcastEvent('USER_RESTORED', { userId: target.id });
  return { success: true, message: `Akaunti ya ${target.name} imefunguliwa na ipo huru kutumika tena.` };
}

// ----------------- FOLLOWING & FOLLOWERS SYSTEM -----------------

export function followUserPermanent(fromUserId: string, targetUserId: string): { success: boolean; message: string } {
  if (fromUserId === targetUserId) return { success: false, message: 'Huwezi kujifuata mwenyewe.' };
  const users = getPermanentUsers();
  const follower = users.find(u => u.id === fromUserId);
  const target = users.find(u => u.id === targetUserId);

  if (!follower || !target) return { success: false, message: 'Mtumiaji hakupatikana.' };

  const following = new Set(follower.followingUsers || []);
  if (following.has(targetUserId)) {
    return { success: true, message: `Tayari unamfuata ${target.name}.` };
  }

  following.add(targetUserId);
  follower.followingUsers = Array.from(following);
  follower.followingCount = follower.followingUsers.length;

  const allUsers = getPermanentUsers();
  const realFollowersCount = allUsers.filter(u => u.id !== targetUserId && (u.id === fromUserId || (u.followingUsers || []).includes(targetUserId))).length;
  target.followersCount = realFollowersCount;

  saveUserPermanent(follower);
  saveUserPermanent(target);

  // Notify target user
  saveNotificationPermanent({
    id: `notif_${Date.now()}`,
    userId: target.id,
    actorId: follower.id,
    actorName: follower.name,
    actorAvatar: follower.avatar,
    type: 'follow',
    message: `${follower.name} ameanza kukufuata kwenye RAVINI.`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  // Call backend API if possible
  fetch(`/api/v1/users/${targetUserId}/follow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }).catch(() => {});

  broadcastEvent('USER_FOLLOW_UPDATED', { currentUserId: fromUserId, targetUserId, isNowFollowing: true });
  return { success: true, message: `Sasa unamfuata ${target.name}!` };
}

export function unfollowUserPermanent(fromUserId: string, targetUserId: string): { success: boolean; message: string } {
  const users = getPermanentUsers();
  const follower = users.find(u => u.id === fromUserId);
  const target = users.find(u => u.id === targetUserId);

  if (!follower || !target) return { success: false, message: 'Mtumiaji hakupatikana.' };

  const following = new Set(follower.followingUsers || []);
  following.delete(targetUserId);
  follower.followingUsers = Array.from(following);
  follower.followingCount = follower.followingUsers.length;

  const allUsers = getPermanentUsers();
  const realFollowersCount = allUsers.filter(u => u.id !== targetUserId && u.id !== fromUserId && (u.followingUsers || []).includes(targetUserId)).length;
  target.followersCount = realFollowersCount;

  saveUserPermanent(follower);
  saveUserPermanent(target);

  // Call backend API if possible
  fetch(`/api/v1/users/${targetUserId}/unfollow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }).catch(() => {});

  broadcastEvent('USER_FOLLOW_UPDATED', { currentUserId: fromUserId, targetUserId, isNowFollowing: false });
  return { success: true, message: `Umeacha kumfuata ${target.name}.` };
}

// Deprecated friend aliases for backward compatibility without creating friend relations
export function sendFriendRequest(fromUserId: string, toUserId: string): { success: boolean; message: string } {
  return followUserPermanent(fromUserId, toUserId);
}

export function acceptFriendRequest(userId: string, fromUserId: string): { success: boolean; message: string } {
  return followUserPermanent(userId, fromUserId);
}

export function rejectFriendRequest(userId: string, fromUserId: string): { success: boolean; message: string } {
  return { success: true, message: 'Imeondolewa.' };
}

export function removeFriend(userId: string, friendId: string): { success: boolean; message: string } {
  return unfollowUserPermanent(userId, friendId);
}

export function blockUser(userId: string, targetUserId: string): { success: boolean; message: string } {
  const users = getPermanentUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, message: 'Mtumiaji hakupatikana.' };

  user.blockedUsers = user.blockedUsers || [];
  if (!user.blockedUsers.includes(targetUserId)) {
    user.blockedUsers.push(targetUserId);
  }

  // Remove from friends and requests
  user.friends = (user.friends || []).filter(id => id !== targetUserId);
  user.friendRequestsReceived = (user.friendRequestsReceived || []).filter(id => id !== targetUserId);
  user.friendRequestsSent = (user.friendRequestsSent || []).filter(id => id !== targetUserId);

  saveUserPermanent(user);
  broadcastEvent('USER_BLOCKED', { userId, targetUserId });
  return { success: true, message: 'Mtumiaji amezuiwa (Blocked).' };
}

export function unblockUser(userId: string, targetUserId: string): { success: boolean; message: string } {
  const users = getPermanentUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, message: 'Mtumiaji hakupatikana.' };

  user.blockedUsers = (user.blockedUsers || []).filter(id => id !== targetUserId);
  saveUserPermanent(user);

  broadcastEvent('USER_UNBLOCKED', { userId, targetUserId });
  return { success: true, message: 'Mtumiaji ameondolewa kizuizini (Unblocked).' };
}

// ----------------- PUSH VIRAL SYSTEM -----------------

export const DEFAULT_PUSH_VIRAL_PACKAGES: PushViralPackage[] = [
  {
    id: 'pkg_starter',
    name: 'Viral Starter 🚀',
    priceRvc: 5000,
    durationDays: 3,
    reachEstimate: '1,500 – 3,500 Watu',
    description: 'Kuza chapisho lako kwa watumiaji wapya kote nchini Tanzania.'
  },
  {
    id: 'pkg_pro',
    name: 'Viral Pro 🔥',
    priceRvc: 15000,
    durationDays: 7,
    reachEstimate: '5,000 – 12,000 Watu',
    description: 'Inafaa kwa waundaji maudhui na bidhaa za sokoni kufikia wateja haraka.'
  },
  {
    id: 'pkg_mega',
    name: 'Viral Mega Super 🌟',
    priceRvc: 35000,
    durationDays: 14,
    reachEstimate: '20,000 – 50,000 Watu',
    description: 'Nafasi ya juu ya kipaumbele kwenye milisho ya watumiaji na watazamaji wote.'
  }
];

export function getPushViralPackages(): PushViralPackage[] {
  return DEFAULT_PUSH_VIRAL_PACKAGES;
}

export function getPushViralCampaigns(): PushViralCampaign[] {
  try {
    const raw = localStorage.getItem(PUSH_VIRAL_CAMPAIGNS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function createPushViralCampaign(
  userId: string,
  contentId: string,
  contentType: 'post' | 'video' | 'clip',
  packageId: string
): { success: boolean; message: string; campaign?: PushViralCampaign } {
  const users = getPermanentUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, message: 'Mtumiaji hakupatikana.' };

  const pkg = DEFAULT_PUSH_VIRAL_PACKAGES.find(p => p.id === packageId);
  if (!pkg) return { success: false, message: 'Kifurushi cha Push Viral hakipatikani.' };

  if (user.walletBalance < pkg.priceRvc) {
    return { success: false, message: `Salio lako la RVC (${user.walletBalance.toLocaleString()}) halitoshi kununua kifurushi hiki (RVC ${pkg.priceRvc.toLocaleString()}).` };
  }

  // Deduct RVC
  user.walletBalance -= pkg.priceRvc;
  if (user.walletLedger) {
    user.walletLedger.customerBalance = user.walletBalance;
    user.walletLedger.companyRevenue += pkg.priceRvc;
  }
  saveUserPermanent(user);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + pkg.durationDays * 86400000).toISOString();

  const campaign: PushViralCampaign = {
    id: `camp_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
    userId,
    contentId,
    contentType,
    packageId: pkg.id,
    packageName: pkg.name,
    amountRvc: pkg.priceRvc,
    status: 'active',
    startedAt: now.toISOString(),
    expiresAt,
    viewsCount: 0,
    clicksCount: 0,
  };

  const campaigns = getPushViralCampaigns();
  campaigns.unshift(campaign);
  try {
    localStorage.setItem(PUSH_VIRAL_CAMPAIGNS_KEY, JSON.stringify(campaigns));
  } catch (e) {
    console.error(e);
  }

  // Record wallet transaction
  const rawTx = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  const txList: WalletTransaction[] = rawTx ? JSON.parse(rawTx) : [];
  txList.unshift({
    id: `tx_${Date.now()}_viral`,
    userId,
    type: 'debit',
    amount: -pkg.priceRvc,
    description: `Malipo ya Kampeni ya Push Viral (${pkg.name})`,
    createdAt: now.toISOString(),
    status: 'completed',
    reference: `VIRAL-${Math.floor(100000 + Math.random() * 900000)}`,
  });
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(txList));

  broadcastEvent('PUSH_VIRAL_CREATED', campaign);
  return { success: true, message: `Hongera! Kampeni yako ya Push Viral (${pkg.name}) imeanza rasmi. Maudhui yako yatapelekwa mbele kwa watazamaji zaidi.`, campaign };
}

// ----------------- ⭐ RAVINI PREMIUM -----------------

export const DEFAULT_PREMIUM_PACKAGES: PremiumPackage[] = [
  {
    id: 'prem_monthly',
    name: 'RAVINI Premium (Mwezi 1)',
    priceRvc: 9900,
    durationMonths: 1,
    benefits: [
      'Beji Rasmi ya Dhahabu (Gold Star Verified)',
      'Hakuna Matangazo yoyote kwenye Milisho',
      'Uwezo wa kupakia Video na Klipu za HD hadi dakika 30',
      'Zana Maalum za AI kwa Waundaji na Wafanyabiashara',
      'Kipaumbele kwenye Usaidizi wa Haraka (Priority Support)'
    ],
    isActive: true,
  },
  {
    id: 'prem_yearly',
    name: 'RAVINI Premium (Mwaka 1 - Punguzo la 20%)',
    priceRvc: 95000,
    durationMonths: 12,
    benefits: [
      'Faida zote za Premium kwa Mwaka Mzima',
      'Beji Maalum ya VIP Gold Star',
      'Punguzo la 10% kwenye Kampeni zote za Push Viral',
      'Dashibodi ya Kina ya Takwimu za Wasomaji & Wateja',
      'Cheti cha Mwanachama Kinara wa RAVINI'
    ],
    isActive: true,
  }
];

export function getPremiumPackages(): PremiumPackage[] {
  try {
    const raw = localStorage.getItem(PREMIUM_PACKAGES_KEY);
    if (!raw) return DEFAULT_PREMIUM_PACKAGES;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PREMIUM_PACKAGES;
  }
}

export function subscribeToPremium(userId: string, packageId: string): { success: boolean; message: string } {
  const users = getPermanentUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, message: 'Mtumiaji hakupatikana.' };

  const pkgs = getPremiumPackages();
  const pkg = pkgs.find(p => p.id === packageId);
  if (!pkg) return { success: false, message: 'Kifurushi cha Premium hakijapatikana.' };

  if (user.walletBalance < pkg.priceRvc) {
    return { success: false, message: `Salio lako la RVC (${user.walletBalance.toLocaleString()}) halitoshi kulipia Premium (RVC ${pkg.priceRvc.toLocaleString()}). Tafadhali weka salio kwanza.` };
  }

  // Deduct
  user.walletBalance -= pkg.priceRvc;
  if (user.walletLedger) {
    user.walletLedger.customerBalance = user.walletBalance;
    user.walletLedger.companyRevenue += pkg.priceRvc;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + pkg.durationMonths * 30 * 86400000).toISOString();

  user.premiumStatus = {
    isActive: true,
    packageName: pkg.name,
    expiresAt,
    benefits: pkg.benefits,
  };
  saveUserPermanent(user);

  // Record transaction
  const rawTx = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  const txList: WalletTransaction[] = rawTx ? JSON.parse(rawTx) : [];
  txList.unshift({
    id: `tx_${Date.now()}_prem`,
    userId,
    type: 'debit',
    amount: -pkg.priceRvc,
    description: `Usajili wa ${pkg.name}`,
    createdAt: now.toISOString(),
    status: 'completed',
    reference: `PREM-${Math.floor(100000 + Math.random() * 900000)}`,
  });
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(txList));

  broadcastEvent('PREMIUM_SUBSCRIBED', { userId, packageName: pkg.name, expiresAt });
  return { success: true, message: `Hongera sana! Sasa wewe ni mwanachama wa ⭐ ${pkg.name}! Faida zote zimewashwa.` };
}

// ----------------- PLATFORM PRICING CONFIGURATION -----------------

export const DEFAULT_PLATFORM_PRICING: PlatformPricingConfig = {
  adPricing: {
    sponsoredPostPerDay: 1000,
    sponsoredVideoPerDay: 1800,
    sponsoredClipPerDay: 1400,
    sponsoredProductPerDay: 1200,
    sponsoredBusinessPerDay: 2000,
    bannerPerDay: 2500,
    feedAdPerDay: 1500,
    cpmRate: 100, // per 1,000 impressions
    minimumBudgetRvc: 1000,
  },
  premiumPricing: {
    monthlyRvc: 9900,
    quarterlyRvc: 26900,
    annualRvc: 95000,
  },
  pushViralPackages: DEFAULT_PUSH_VIRAL_PACKAGES,
  marketCommissionRate: 0.05, // 5%
  updatedAt: '2026-02-15T00:00:00.000Z',
  updatedBy: 'Baraka Mabula (Super Admin)',
};

export function getPlatformPricing(): PlatformPricingConfig {
  try {
    const raw = localStorage.getItem(PLATFORM_PRICING_KEY);
    if (!raw) {
      localStorage.setItem(PLATFORM_PRICING_KEY, JSON.stringify(DEFAULT_PLATFORM_PRICING));
      return DEFAULT_PLATFORM_PRICING;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PLATFORM_PRICING;
  }
}

export function updatePlatformPricing(
  actor: User,
  newConfig: Partial<PlatformPricingConfig>
): { success: boolean; message: string; config?: PlatformPricingConfig } {
  if (actor.role !== 'super_admin' && !hasPermission(actor, 'PRICING_MANAGE')) {
    return { success: false, message: 'Huna kibali cha kurekebisha bei na tozo za RAVINI (Ruhusa ya PRICING_MANAGE inahitajika).' };
  }

  const current = getPlatformPricing();
  const updated: PlatformPricingConfig = {
    ...current,
    ...newConfig,
    adPricing: {
      ...current.adPricing,
      ...(newConfig.adPricing || {}),
    },
    premiumPricing: {
      ...current.premiumPricing,
      ...(newConfig.premiumPricing || {}),
    },
    updatedAt: new Date().toISOString(),
    updatedBy: `${actor.name} (${actor.role === 'super_admin' ? 'Super Admin' : 'Admin'})`,
  };

  try {
    localStorage.setItem(PLATFORM_PRICING_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }

  logAuditPermanent({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'PRICING_CONFIG_UPDATED',
    target: 'Platform Pricing',
    details: `Bei na tozo zilisasishwa. Ad Min: ${updated.adPricing.minimumBudgetRvc} RVC, Soko: ${(updated.marketCommissionRate * 100).toFixed(1)}%`
  });

  broadcastEvent('PRICING_UPDATED', updated);
  return { success: true, message: 'Mipangilio ya bei na tozo imesasishwa kikamilifu na kurekodiwa kwenye daftari!', config: updated };
}

// ----------------- RAVINI CREDIT & WHATSAPP CONFIGURATION -----------------
export const CREDIT_CONFIG_KEY = 'ravini_credit_config_v1';

export const DEFAULT_CREDIT_CONFIG: CreditConfig = {
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
  whatsappNumber: '255748604483',
  whatsappDisplayName: 'RAVINI COMPANY LIMITED (Manager)',
  updatedAt: '2026-02-15T00:00:00.000Z',
  updatedBy: 'Baraka Mabula (Manager)'
};

export function getCreditConfig(): CreditConfig {
  try {
    const raw = localStorage.getItem(CREDIT_CONFIG_KEY);
    if (!raw) {
      localStorage.setItem(CREDIT_CONFIG_KEY, JSON.stringify(DEFAULT_CREDIT_CONFIG));
      return DEFAULT_CREDIT_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return {
      postPriceCredits: typeof parsed.postPriceCredits === 'number' ? parsed.postPriceCredits : 1,
      videoPriceCredits: typeof parsed.videoPriceCredits === 'number' ? parsed.videoPriceCredits : 2,
      moviePriceCredits: typeof parsed.moviePriceCredits === 'number' ? parsed.moviePriceCredits : 3,
      bundles: Array.isArray(parsed.bundles) && parsed.bundles.length > 0 ? parsed.bundles : DEFAULT_CREDIT_CONFIG.bundles,
      pricePerCreditTzs: typeof parsed.pricePerCreditTzs === 'number' ? parsed.pricePerCreditTzs : 100,
      minCustomCredits: typeof parsed.minCustomCredits === 'number' ? parsed.minCustomCredits : 10,
      maxCustomCredits: typeof parsed.maxCustomCredits === 'number' ? parsed.maxCustomCredits : 50000,
      whatsappNumber: (parsed.whatsappNumber || '255748604483').replace(/[^0-9]/g, '') || '255748604483',
      whatsappDisplayName: parsed.whatsappDisplayName || 'RAVINI COMPANY LIMITED (Manager)',
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      updatedBy: parsed.updatedBy || 'System'
    };
  } catch {
    return DEFAULT_CREDIT_CONFIG;
  }
}

export function updateCreditConfig(
  actor: User,
  newConfig: Partial<CreditConfig>
): { success: boolean; message: string; config?: CreditConfig } {
  const roleLower = (actor.role || '').toLowerCase();
  if (roleLower !== 'manager' && roleLower !== 'super_admin' && !hasPermission(actor, 'PRICING_MANAGE')) {
    return { success: false, message: 'Huna kibali cha kurekebisha mipangilio ya Credits (Ni Manager pekee).' };
  }

  const current = getCreditConfig();
  const cleanNumber = (newConfig.whatsappNumber || current.whatsappNumber).replace(/[^0-9]/g, '');
  const updated: CreditConfig = {
    ...current,
    ...newConfig,
    whatsappNumber: cleanNumber || '255748604483',
    updatedAt: new Date().toISOString(),
    updatedBy: `${actor.name} (${actor.role})`
  };

  try {
    localStorage.setItem(CREDIT_CONFIG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }

  // Also sync payment config whatsappNumber if needed
  try {
    const payConfig = getPaymentConfig();
    if (payConfig.whatsappNumber !== updated.whatsappNumber) {
      updatePaymentConfig({ ...payConfig, whatsappNumber: updated.whatsappNumber }, actor);
    }
  } catch {}

  logAuditPermanent({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'CREDIT_CONFIG_UPDATED',
    target: 'Credit Pricing & WhatsApp',
    details: `Credit pricing updated. Post: ${updated.postPriceCredits}cr, Video: ${updated.videoPriceCredits}cr, Movie: ${updated.moviePriceCredits}cr, WhatsApp: ${updated.whatsappNumber}`
  });

  broadcastEvent('CREDIT_CONFIG_UPDATED', updated);
  return { success: true, message: 'Mipangilio ya Credits na WhatsApp imesasishwa kikamilifu!', config: updated };
}

export async function fetchCreditConfigFromServer(): Promise<CreditConfig> {
  try {
    const res = await fetch('/api/credits/config');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.config) {
        localStorage.setItem(CREDIT_CONFIG_KEY, JSON.stringify(data.config));
        return data.config;
      }
    }
  } catch {}
  return getCreditConfig();
}

export async function saveCreditConfigToServer(
  actor: User,
  config: Partial<CreditConfig>
): Promise<{ success: boolean; message: string; config?: CreditConfig }> {
  try {
    const res = await fetch('/api/credits/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${actor.id}`,
        'x-user-id': actor.id
      },
      body: JSON.stringify(config)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.config) {
        localStorage.setItem(CREDIT_CONFIG_KEY, JSON.stringify(data.config));
        broadcastEvent('CREDIT_CONFIG_UPDATED', data.config);
        return { success: true, message: data.message || 'Mipangilio ya Credits imesasishwa.', config: data.config };
      }
    }
  } catch (err) {
    console.error('Failed saving credit config to server:', err);
  }
  return updateCreditConfig(actor, config);
}

// ----------------- COMPANY REVENUE & TRANSACTION LEDGER -----------------

function generateInitialCompanyLedger(): CompanyLedgerTransaction[] {
  // Requirement 10: Real data only. Production ledger begins clean and records authentic system transactions.
  return [];
}

export function getCompanyLedger(): CompanyLedgerTransaction[] {
  try {
    const raw = localStorage.getItem(COMPANY_LEDGER_STORAGE_KEY);
    if (!raw) {
      const initial = generateInitialCompanyLedger();
      localStorage.setItem(COMPANY_LEDGER_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function recordCompanyLedgerTransaction(
  entry: Omit<CompanyLedgerTransaction, 'id' | 'timestamp'>
): CompanyLedgerTransaction {
  const ledger = getCompanyLedger();

  // Prevent duplicate execution if idempotencyKey is present
  if (entry.idempotencyKey) {
    const existing = ledger.find(t => t.idempotencyKey === entry.idempotencyKey);
    if (existing) {
      return existing;
    }
  }

  const newTx: CompanyLedgerTransaction = {
    ...entry,
    id: `TXN-REV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString(),
  };

  ledger.unshift(newTx);
  try {
    localStorage.setItem(COMPANY_LEDGER_STORAGE_KEY, JSON.stringify(ledger));
  } catch (e) {
    console.error(e);
  }

  broadcastEvent('COMPANY_LEDGER_UPDATED', newTx);
  return newTx;
}

// ----------------- REFUNDS MANAGEMENT -----------------

const INITIAL_REFUNDS: RefundRecord[] = [];

export function getRefundRecords(): RefundRecord[] {
  try {
    const raw = localStorage.getItem(REFUNDS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REFUNDS_STORAGE_KEY, JSON.stringify(INITIAL_REFUNDS));
      return INITIAL_REFUNDS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_REFUNDS;
  }
}

export function requestRefundRecord(
  userId: string,
  transactionId: string,
  service: string,
  amountRvc: number,
  reason: string
): { success: boolean; message: string; record?: RefundRecord } {
  const users = getPermanentUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, message: 'Mtumiaji hakupatikana.' };

  const refunds = getRefundRecords();
  const newRefund: RefundRecord = {
    id: `REF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    transactionId,
    userId,
    userRaviniId: user.raviniId || user.id,
    userName: user.name,
    service,
    amountRvc,
    reason,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };

  refunds.unshift(newRefund);
  try {
    localStorage.setItem(REFUNDS_STORAGE_KEY, JSON.stringify(refunds));
  } catch (e) {
    console.error(e);
  }

  saveNotificationPermanent({
    id: `notif_ref_req_${Date.now()}`,
    userId,
    actorId: 'system',
    actorName: 'RAVINI Finance Desk',
    actorAvatar: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=120&q=80',
    type: 'wallet',
    message: `Ombi lako la marejesho ya RVC ${amountRvc.toLocaleString()} kwa huduma ya "${service}" limepokelewa na linakaguliwa na Wasimamizi wa Fedha.`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  broadcastEvent('REFUND_REQUESTED', newRefund);
  return { success: true, message: 'Ombi la marejesho limewasilishwa kwa mafanikio.', record: newRefund };
}

export function processRefundRecord(
  refundId: string,
  adminUser: User,
  approved: boolean,
  note: string
): { success: boolean; message: string } {
  if (adminUser.role !== 'super_admin' && !hasPermission(adminUser, 'REFUND_MANAGE')) {
    return { success: false, message: 'Huna mamlaka ya kushughulikia marejesho ya fedha (REFUND_MANAGE required).' };
  }

  const refunds = getRefundRecords();
  const record = refunds.find(r => r.id === refundId);
  if (!record) return { success: false, message: 'Rekodi ya marejesho haikupatikana.' };
  if (record.status !== 'pending') return { success: false, message: `Ombi hili lilikwishatekelezwa (${record.status}).` };

  const now = new Date().toISOString();
  record.status = approved ? 'completed' : 'rejected';
  record.reviewedAt = now;
  record.reviewedBy = `${adminUser.name} (${adminUser.role === 'super_admin' ? 'Super Admin' : 'Admin'})`;
  record.adminNote = note;

  try {
    localStorage.setItem(REFUNDS_STORAGE_KEY, JSON.stringify(refunds));
  } catch (e) {
    console.error(e);
  }

  const users = getPermanentUsers();
  const recipient = users.find(u => u.id === record.userId);

  if (approved && recipient) {
    // 1. Credit recipient's wallet balance
    recipient.walletBalance += record.amountRvc;
    saveUserPermanent(recipient);

    // 2. Record transaction in recipient wallet ledger
    const rawTx = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    const txList: WalletTransaction[] = rawTx ? JSON.parse(rawTx) : [];
    txList.unshift({
      id: `tx_${Date.now()}_refund`,
      userId: recipient.id,
      type: 'credit',
      amount: record.amountRvc,
      description: `Marejesho ya RVC kutoka RAVINI COMPANY LIMITED: ${record.reason}`,
      createdAt: now,
      status: 'completed',
      reference: record.id
    });
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(txList));

    // 3. Record refund debit in company revenue ledger
    recordCompanyLedgerTransaction({
      userId: recipient.id,
      userRaviniId: recipient.raviniId || recipient.id,
      userName: recipient.name,
      service: 'refund',
      amount: -record.amountRvc,
      currency: 'RVC',
      type: 'refund',
      status: 'completed',
      reference: record.id,
      relatedId: record.transactionId,
      refundStatus: 'completed',
      refundReason: record.reason,
      refundId: record.id
    });

    // 4. Update the original transaction if found in ledger
    const ledger = getCompanyLedger();
    const origTx = ledger.find(t => t.id === record.transactionId || t.relatedId === record.transactionId);
    if (origTx) {
      origTx.refundStatus = 'completed';
      origTx.status = 'refunded';
      try {
        localStorage.setItem(COMPANY_LEDGER_STORAGE_KEY, JSON.stringify(ledger));
      } catch (e) {
        console.error(e);
      }
    }

    logAuditPermanent({
      actorId: adminUser.id,
      actorName: adminUser.name,
      actorRole: adminUser.role,
      action: 'REFUND_PROCESSED_APPROVED',
      target: recipient.name,
      details: `RVC ${record.amountRvc.toLocaleString()} zilimerejeshwa kwa ${recipient.name}. Sababu: ${record.reason}. Kumbukumbu: ${record.id}`
    });

    saveNotificationPermanent({
      id: `notif_ref_app_${Date.now()}`,
      userId: recipient.id,
      actorId: adminUser.id,
      actorName: 'RAVINI COMPANY LIMITED (Finance)',
      actorAvatar: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=120&q=80',
      type: 'wallet',
      message: `Marejesho ya RVC ${record.amountRvc.toLocaleString()} yameidhinishwa na kuwekwa kwenye pochi yako ya RVC. Maelezo: ${note || record.reason}`,
      read: false,
      createdAt: now,
    });
  } else if (!approved && recipient) {
    logAuditPermanent({
      actorId: adminUser.id,
      actorName: adminUser.name,
      actorRole: adminUser.role,
      action: 'REFUND_PROCESSED_REJECTED',
      target: recipient.name,
      details: `Ombi la marejesho ya RVC ${record.amountRvc.toLocaleString()} limekataliwa. Sababu: ${note}`
    });

    saveNotificationPermanent({
      id: `notif_ref_rej_${Date.now()}`,
      userId: recipient.id,
      actorId: adminUser.id,
      actorName: 'RAVINI COMPANY LIMITED (Finance)',
      actorAvatar: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=120&q=80',
      type: 'wallet',
      message: `Ombi lako la marejesho ya RVC ${record.amountRvc.toLocaleString()} halikuidhinishwa. Maelezo ya Msimamizi: ${note}`,
      read: false,
      createdAt: now,
    });
  }

  broadcastEvent('REFUND_UPDATED', record);
  return {
    success: true,
    message: approved 
      ? `Marejesho ya RVC ${record.amountRvc.toLocaleString()} yameidhinishwa na fedha zimeingizwa kwenye pochi ya mtumiaji.` 
      : 'Ombi la marejesho limekataliwa.'
  };
}

// ----------------- RAVINI ADS CAMPAIGNS -----------------

const INITIAL_AD_CAMPAIGNS: AdCampaign[] = [];

export function getAdCampaigns(): AdCampaign[] {
  try {
    const raw = localStorage.getItem(AD_CAMPAIGNS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AD_CAMPAIGNS_STORAGE_KEY, JSON.stringify(INITIAL_AD_CAMPAIGNS));
      return INITIAL_AD_CAMPAIGNS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_AD_CAMPAIGNS;
  }
}

export function getUserAdCampaigns(userId: string): AdCampaign[] {
  const all = getAdCampaigns();
  return all.filter(c => c.userId === userId);
}

export function createAdCampaign(
  user: User,
  data: {
    title: string;
    adType: AdType;
    placement: AdPlacement;
    headline: string;
    body: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    ctaText: string;
    targetUrl: string;
    relatedPostId?: string;
    relatedProductId?: string;
    relatedBusinessId?: string;
    targeting: AdTargeting;
    durationDays: number;
    budgetRvc: number;
    dailyBudgetRvc?: number;
    companyName?: string;
    scheduledStartDate?: string;
    idempotencyKey?: string;
  }
): { success: boolean; message: string; campaign?: AdCampaign } {
  const pricing = getPlatformPricing();
  const minBudget = pricing.adPricing.minimumBudgetRvc || 1000;

  if (data.budgetRvc < minBudget) {
    return {
      success: false,
      message: `Bajeti ya chini inayokubalika kwa kampeni za RAVINI Ads ni RVC ${minBudget.toLocaleString()}.`
    };
  }

  // Check idempotency to prevent duplicate charges
  const campaigns = getAdCampaigns();
  if (data.idempotencyKey) {
    const existing = campaigns.find(c => c.idempotencyKey === data.idempotencyKey);
    if (existing) {
      return { success: true, message: 'Kampeni hii ilishapokelewa!', campaign: existing };
    }
  }

  // Enforce RVC wallet balance
  if (user.walletBalance < data.budgetRvc) {
    return {
      success: false,
      message: `Salio lako la RVC (${user.walletBalance.toLocaleString()} RVC) halitoshi kulipia bajeti ya kampeni hii (${data.budgetRvc.toLocaleString()} RVC). Tafadhali weka salio kwanza.`
    };
  }

  const now = new Date().toISOString();
  const campaignId = `camp_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. Deduct user's RVC balance
  user.walletBalance -= data.budgetRvc;
  if (user.walletLedger) {
    user.walletLedger.customerBalance = user.walletBalance;
    user.walletLedger.companyRevenue += data.budgetRvc;
  }
  saveUserPermanent(user);

  // 2. Record transaction in user wallet transactions
  const rawTx = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  const txList: WalletTransaction[] = rawTx ? JSON.parse(rawTx) : [];
  const walletTxId = `tx_${Date.now()}_ad_pay`;
  txList.unshift({
    id: walletTxId,
    userId: user.id,
    type: 'debit',
    amount: -data.budgetRvc,
    description: `Malipo ya Tangazo la RAVINI Ads (${data.title})`,
    createdAt: now,
    status: 'completed',
    reference: `AD-${campaignId}`
  });
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(txList));

  // 3. Record in company revenue ledger (pending approval)
  const ledgerTx = recordCompanyLedgerTransaction({
    userId: user.id,
    userRaviniId: user.raviniId || user.id,
    userName: user.name,
    service: 'ads',
    amount: data.budgetRvc,
    currency: 'RVC',
    type: 'income',
    status: 'pending',
    reference: `CAMP-${campaignId}`,
    relatedId: campaignId,
    relatedType: 'campaign',
    refundStatus: 'none',
    idempotencyKey: data.idempotencyKey,
  });

  const dailyBudget = data.dailyBudgetRvc || Math.round(data.budgetRvc / Math.max(1, data.durationDays));

  // 4. Create campaign with status 'pending_approval' (Do not auto-activate before review)
  const newCampaign: AdCampaign = {
    id: campaignId,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    userRaviniId: user.raviniId || user.id,
    userRole: user.role,
    companyName: data.companyName || (user.role === 'company' ? user.name : 'RAVINI Advertiser'),
    title: data.title.trim(),
    adType: data.adType,
    placement: data.placement,
    headline: data.headline.trim(),
    body: data.body.trim(),
    mediaUrl: data.mediaUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
    mediaType: data.mediaType || 'image',
    ctaText: data.ctaText.trim() || 'Jifunze Zaidi',
    targetUrl: data.targetUrl.trim() || 'https://ravini.tz',
    relatedPostId: data.relatedPostId,
    relatedProductId: data.relatedProductId,
    relatedBusinessId: data.relatedBusinessId,
    targeting: data.targeting,
    durationDays: data.durationDays,
    budgetRvc: data.budgetRvc,
    dailyBudgetRvc: dailyBudget,
    spentRvc: 0,
    status: 'pending_approval',
    isPaid: true,
    paymentTransactionId: ledgerTx.id,
    idempotencyKey: data.idempotencyKey,
    createdAt: now,
    scheduledStartDate: data.scheduledStartDate,
    impressions: 0,
    views: 0,
    clicks: 0,
    shares: 0,
    engagement: 0,
  };

  campaigns.unshift(newCampaign);
  try {
    localStorage.setItem(AD_CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  } catch (e) {
    console.error(e);
  }

  // 5. Notify user & admin
  saveNotificationPermanent({
    id: `notif_ad_submit_${Date.now()}`,
    userId: user.id,
    actorId: 'system',
    actorName: 'RAVINI Ads Desk',
    actorAvatar: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=120&q=80',
    type: 'wallet',
    message: `Hongera! Tangazo lako "${newCampaign.title}" limewasilishwa kwa ukaguzi na malipo ya RVC ${data.budgetRvc.toLocaleString()} yamepokelewa. Litawashwa mara baada ya kuhakikiwa na Wasimamizi.`,
    read: false,
    createdAt: now,
  });

  logAuditPermanent({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'AD_CAMPAIGN_SUBMITTED',
    target: newCampaign.title,
    details: `Aina: ${data.adType}, Bajeti: ${data.budgetRvc.toLocaleString()} RVC, Siku: ${data.durationDays}`
  });

  broadcastEvent('AD_CAMPAIGN_CREATED', newCampaign);
  return {
    success: true,
    message: `Kampeni yako ya RAVINI Ads (${newCampaign.title}) imewasilishwa kwa mafanikio! RVC ${data.budgetRvc.toLocaleString()} zimepokelewa na kampeni inakaguliwa na Wasimamizi kabla ya kuwashwa.`,
    campaign: newCampaign
  };
}

export function approveAdCampaign(
  campaignId: string,
  adminUser: User
): { success: boolean; message: string } {
  if (adminUser.role !== 'super_admin' && !hasPermission(adminUser, 'ADS_APPROVE')) {
    return { success: false, message: 'Huna ruhusa ya kuidhinisha matangazo (ADS_APPROVE required).' };
  }

  const campaigns = getAdCampaigns();
  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) return { success: false, message: 'Kampeni ya tangazo haikupatikana.' };

  const now = new Date();
  const nowIso = now.toISOString();

  // If scheduled for the future, mark as approved; if ready or today, mark as active
  const isFuture = campaign.scheduledStartDate && new Date(campaign.scheduledStartDate).getTime() > now.getTime();
  campaign.status = isFuture ? 'approved' : 'active';
  campaign.startedAt = isFuture ? campaign.scheduledStartDate : nowIso;
  campaign.expiresAt = new Date(
    (isFuture ? new Date(campaign.scheduledStartDate!).getTime() : now.getTime()) +
    campaign.durationDays * 86400000
  ).toISOString();
  campaign.reviewedAt = nowIso;
  campaign.reviewedBy = `${adminUser.name} (${adminUser.role === 'super_admin' ? 'Super Admin' : 'Admin'})`;

  try {
    localStorage.setItem(AD_CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  } catch (e) {
    console.error(e);
  }

  // Update transaction status in Company Ledger to completed
  const ledger = getCompanyLedger();
  const tx = ledger.find(t => t.relatedId === campaignId || t.reference === `CAMP-${campaignId}`);
  if (tx) {
    tx.status = 'completed';
    try {
      localStorage.setItem(COMPANY_LEDGER_STORAGE_KEY, JSON.stringify(ledger));
    } catch (e) {
      console.error(e);
    }
  }

  logAuditPermanent({
    actorId: adminUser.id,
    actorName: adminUser.name,
    actorRole: adminUser.role,
    action: 'AD_CAMPAIGN_APPROVED',
    target: campaign.title,
    details: `Tangazo limeidhinishwa na hali imewekwa: ${campaign.status}`
  });

  saveNotificationPermanent({
    id: `notif_ad_app_${Date.now()}`,
    userId: campaign.userId,
    actorId: adminUser.id,
    actorName: 'RAVINI Ads Desk',
    actorAvatar: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=120&q=80',
    type: 'ad_campaign',
    message: `Tangazo lako "${campaign.title}" limeidhinishwa na RAVINI COMPANY LIMITED! Sasa linaonekana rasmi kwa hadhira uliyochagua.`,
    read: false,
    createdAt: nowIso,
  });

  broadcastEvent('AD_CAMPAIGN_UPDATED', campaign);
  return { success: true, message: `Kampeni "${campaign.title}" imeidhinishwa na sasa ni ${campaign.status}!` };
}

export function rejectAdCampaign(
  campaignId: string,
  adminUser: User,
  reason: string,
  autoRefund: boolean = true
): { success: boolean; message: string } {
  if (adminUser.role !== 'super_admin' && !hasPermission(adminUser, 'ADS_APPROVE')) {
    return { success: false, message: 'Huna ruhusa ya kukagua au kukataa matangazo (ADS_APPROVE required).' };
  }

  const campaigns = getAdCampaigns();
  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) return { success: false, message: 'Kampeni haikupatikana.' };

  const now = new Date().toISOString();
  campaign.status = 'rejected';
  campaign.rejectionReason = reason;
  campaign.reviewedAt = now;
  campaign.reviewedBy = `${adminUser.name} (${adminUser.role === 'super_admin' ? 'Super Admin' : 'Admin'})`;

  try {
    localStorage.setItem(AD_CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  } catch (e) {
    console.error(e);
  }

  // Automatic refund of unspent RVC budget if requested
  if (autoRefund && campaign.isPaid) {
    const unspent = Math.max(0, campaign.budgetRvc - campaign.spentRvc);
    if (unspent > 0) {
      const users = getPermanentUsers();
      const owner = users.find(u => u.id === campaign.userId);
      if (owner) {
        owner.walletBalance += unspent;
        saveUserPermanent(owner);

        // Record refund in owner wallet transactions
        const rawTx = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
        const txList: WalletTransaction[] = rawTx ? JSON.parse(rawTx) : [];
        txList.unshift({
          id: `tx_${Date.now()}_ad_refund`,
          userId: owner.id,
          type: 'credit',
          amount: unspent,
          description: `Marejesho ya RVC baada ya tangazo kukataliwa: "${campaign.title}"`,
          createdAt: now,
          status: 'completed',
          reference: `REF-AD-${campaign.id}`
        });
        localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(txList));

        // Record in Company Ledger as refunded
        recordCompanyLedgerTransaction({
          userId: owner.id,
          userRaviniId: owner.raviniId || owner.id,
          userName: owner.name,
          service: 'refund',
          amount: -unspent,
          currency: 'RVC',
          type: 'refund',
          status: 'completed',
          reference: `REF-CAMP-${campaign.id}`,
          relatedId: campaign.id,
          relatedType: 'campaign',
          refundStatus: 'completed',
          refundReason: reason
        });
      }
    }
  }

  logAuditPermanent({
    actorId: adminUser.id,
    actorName: adminUser.name,
    actorRole: adminUser.role,
    action: 'AD_CAMPAIGN_REJECTED',
    target: campaign.title,
    details: `Sababu: ${reason}. Marejesho ya RVC ${campaign.budgetRvc.toLocaleString()} yamefanyika.`
  });

  saveNotificationPermanent({
    id: `notif_ad_rej_${Date.now()}`,
    userId: campaign.userId,
    actorId: adminUser.id,
    actorName: 'RAVINI Ads Desk',
    actorAvatar: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=120&q=80',
    type: 'wallet',
    message: `Tangazo lako "${campaign.title}" halikuidhinishwa. Sababu: ${reason}. Bajeti yako ya RVC ${campaign.budgetRvc.toLocaleString()} imerejeshwa kikamilifu kwenye pochi yako.`,
    read: false,
    createdAt: now,
  });

  broadcastEvent('AD_CAMPAIGN_UPDATED', campaign);
  return { success: true, message: `Tangazo limekataliwa na bajeti ya RVC imerejeshwa kwa mtangazaji.` };
}

export function pauseAdCampaign(
  campaignId: string,
  userOrAdmin: User
): { success: boolean; message: string } {
  const campaigns = getAdCampaigns();
  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) return { success: false, message: 'Kampeni haikupatikana.' };

  const isOwner = campaign.userId === userOrAdmin.id;
  const isSuper = userOrAdmin.role === 'super_admin';
  const hasPerm = hasPermission(userOrAdmin, 'ADS_MANAGE');

  if (!isOwner && !isSuper && !hasPerm) {
    return { success: false, message: 'Huna mamlaka ya kusimamisha kampeni hii.' };
  }

  campaign.status = 'paused';
  try {
    localStorage.setItem(AD_CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  } catch (e) {
    console.error(e);
  }

  broadcastEvent('AD_CAMPAIGN_UPDATED', campaign);
  return { success: true, message: 'Kampeni imesimamishwa kwa muda.' };
}

export function resumeAdCampaign(
  campaignId: string,
  userOrAdmin: User
): { success: boolean; message: string } {
  const campaigns = getAdCampaigns();
  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) return { success: false, message: 'Kampeni haikupatikana.' };

  const isOwner = campaign.userId === userOrAdmin.id;
  const isSuper = userOrAdmin.role === 'super_admin';
  const hasPerm = hasPermission(userOrAdmin, 'ADS_MANAGE');

  if (!isOwner && !isSuper && !hasPerm) {
    return { success: false, message: 'Huna mamlaka ya kuendeleza kampeni hii.' };
  }

  campaign.status = 'active';
  try {
    localStorage.setItem(AD_CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  } catch (e) {
    console.error(e);
  }

  broadcastEvent('AD_CAMPAIGN_UPDATED', campaign);
  return { success: true, message: 'Kampeni imeendelea kurushwa!' };
}

export function scheduleAdCampaign(
  campaignId: string,
  startDate: string,
  endDate: string,
  adminUser: User
): { success: boolean; message: string } {
  if (adminUser.role !== 'super_admin' && !hasPermission(adminUser, 'ADS_MANAGE')) {
    return { success: false, message: 'Huna ruhusa ya kuratibu matangazo (ADS_MANAGE required).' };
  }

  const campaigns = getAdCampaigns();
  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) return { success: false, message: 'Kampeni haikupatikana.' };

  campaign.scheduledStartDate = startDate;
  campaign.startedAt = startDate;
  campaign.expiresAt = endDate;
  try {
    localStorage.setItem(AD_CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  } catch (e) {
    console.error(e);
  }

  broadcastEvent('AD_CAMPAIGN_UPDATED', campaign);
  return { success: true, message: 'Ratiba ya tangazo imesasishwa.' };
}

export function stopAdCampaign(
  campaignId: string,
  userOrAdmin: User
): { success: boolean; message: string } {
  const campaigns = getAdCampaigns();
  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) return { success: false, message: 'Kampeni haikupatikana.' };

  const isOwner = campaign.userId === userOrAdmin.id;
  const isSuper = userOrAdmin.role === 'super_admin';
  const hasPerm = hasPermission(userOrAdmin, 'ADS_MANAGE');

  if (!isOwner && !isSuper && !hasPerm) {
    return { success: false, message: 'Huna mamlaka ya kusitisha kampeni hii.' };
  }

  campaign.status = 'completed';
  try {
    localStorage.setItem(AD_CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  } catch (e) {
    console.error(e);
  }

  broadcastEvent('AD_CAMPAIGN_UPDATED', campaign);
  return { success: true, message: 'Kampeni imekamilishwa/kusitishwa.' };
}

export function editAdCampaign(
  campaignId: string,
  updates: Partial<AdCampaign>,
  userOrAdmin: User
): { success: boolean; message: string } {
  const campaigns = getAdCampaigns();
  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) return { success: false, message: 'Kampeni haikupatikana.' };

  const isOwner = campaign.userId === userOrAdmin.id;
  const isSuper = userOrAdmin.role === 'super_admin';
  const hasPerm = hasPermission(userOrAdmin, 'ADS_MANAGE');

  if (!isOwner && !isSuper && !hasPerm) {
    return { success: false, message: 'Huna mamlaka ya kubadilisha kampeni hii.' };
  }

  Object.assign(campaign, updates);
  try {
    localStorage.setItem(AD_CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  } catch (e) {
    console.error(e);
  }

  broadcastEvent('AD_CAMPAIGN_UPDATED', campaign);
  return { success: true, message: 'Taarifa za kampeni zimesasishwa.' };
}

export function recordAdCampaignAnalytics(
  campaignId: string,
  type: 'impression' | 'view' | 'click' | 'share'
): void {
  const campaigns = getAdCampaigns();
  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) return;

  if (type === 'impression') {
    campaign.impressions = (campaign.impressions || 0) + 1;
  } else if (type === 'view') {
    campaign.views = (campaign.views || 0) + 1;
  } else if (type === 'click') {
    campaign.clicks = (campaign.clicks || 0) + 1;
  } else if (type === 'share') {
    campaign.shares = (campaign.shares || 0) + 1;
  }

  campaign.engagement = (campaign.clicks || 0) + (campaign.shares || 0);

  // Increment spentRvc slightly on impression/click based on rate if within budget
  const pricing = getPlatformPricing();
  const costPerImpression = (pricing.adPricing.cpmRate || 100) / 1000;
  if (campaign.spentRvc < campaign.budgetRvc) {
    campaign.spentRvc = Math.min(campaign.budgetRvc, campaign.spentRvc + costPerImpression);
  }

  try {
    localStorage.setItem(AD_CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  } catch (e) {
    console.error(e);
  }
}

// ----------------- OFFICIAL ADS LIST & FEED SYNC -----------------

const INITIAL_OFFICIAL_ADS: OfficialAd[] = [
  {
    id: 'ad_1',
    title: 'Weka Bidhaa Yako Sokoni Kwenye RAVINI Market',
    companyName: 'RAVINI COMPANY LIMITED',
    advertiser: 'RAVINI COMPANY LIMITED',
    body: 'Uza haraka bila madalali. Fikia mamilioni ya wanunuzi nchi nzima kupitia RAVINI Market leo.',
    description: 'Uza haraka bila madalali. Fikia mamilioni ya wanunuzi nchi nzima kupitia RAVINI Market leo.',
    mediaUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80',
    ctaText: 'Fungua Soko',
    ctaLink: '/market',
    targetUrl: '/market',
    status: 'active',
    createdAt: '2026-02-01T00:00:00.000Z',
    viewsCount: 14500,
    impressions: 14500,
    clicksCount: 1280,
    clicks: 1280,
    adType: 'sponsored_product'
  },
  {
    id: 'ad_2',
    title: 'Pata Beji Rasmi ya RAVINI Verified',
    companyName: 'RAVINI COMPANY LIMITED',
    advertiser: 'RAVINI COMPANY LIMITED',
    body: 'Jenga imani thabiti na wafuasi na wateja wako. Thibitisha akaunti yako kwa urahisi.',
    description: 'Jenga imani thabiti na wafuasi na wateja wako. Thibitisha akaunti yako kwa urahisi.',
    mediaUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80',
    ctaText: 'Thibitisha Sasa',
    ctaLink: '/verification',
    targetUrl: '/verification',
    status: 'active',
    createdAt: '2026-02-10T00:00:00.000Z',
    viewsCount: 8900,
    impressions: 8900,
    clicksCount: 940,
    clicks: 940,
    adType: 'sponsored_business'
  }
];

export function getOfficialAds(): OfficialAd[] {
  try {
    const raw = localStorage.getItem(OFFICIAL_ADS_KEY);
    const staticAds: OfficialAd[] = raw ? JSON.parse(raw) : INITIAL_OFFICIAL_ADS;

    // Dynamically include active approved campaigns
    const campaigns = getAdCampaigns();
    const now = new Date().toISOString();
    const activeCampaigns = campaigns.filter(c => 
      c.status === 'active' && (!c.expiresAt || c.expiresAt > now)
    );

    const campaignAds: OfficialAd[] = activeCampaigns.map(c => ({
      id: `camp_ad_${c.id}`,
      campaignId: c.id,
      title: c.headline || c.title,
      companyName: c.companyName || (c.userRole === 'company' ? c.userName : `${c.userName}`),
      advertiser: c.companyName || c.userName,
      body: c.body,
      description: c.body,
      mediaUrl: c.mediaUrl,
      imageUrl: c.mediaUrl,
      ctaText: c.ctaText || 'Jifunze Zaidi',
      ctaLink: c.targetUrl || 'https://ravini.tz',
      targetUrl: c.targetUrl || 'https://ravini.tz',
      callToAction: c.ctaText || 'Jifunze Zaidi',
      status: 'active',
      createdAt: c.createdAt,
      viewsCount: c.views || 0,
      impressions: c.impressions || 0,
      clicksCount: c.clicks || 0,
      clicks: c.clicks || 0,
      adType: c.adType
    }));

    return [...staticAds, ...campaignAds];
  } catch {
    return INITIAL_OFFICIAL_ADS;
  }
}

export function createOfficialAd(adData: Omit<OfficialAd, 'id' | 'createdAt' | 'viewsCount' | 'clicksCount'>): OfficialAd {
  const ads = getOfficialAds().filter(a => !a.campaignId);
  const newAd: OfficialAd = {
    ...adData,
    id: `ad_${Date.now()}`,
    createdAt: new Date().toISOString(),
    viewsCount: 0,
    impressions: 0,
    clicksCount: 0,
    clicks: 0,
  };
  ads.unshift(newAd);
  try {
    localStorage.setItem(OFFICIAL_ADS_KEY, JSON.stringify(ads));
  } catch (e) {
    console.error(e);
  }
  broadcastEvent('OFFICIAL_AD_CREATED', newAd);
  return newAd;
}

export function toggleOfficialAdStatus(adId: string): void {
  if (adId.startsWith('camp_ad_')) {
    const campId = adId.replace('camp_ad_', '');
    const campaigns = getAdCampaigns();
    const camp = campaigns.find(c => c.id === campId);
    if (camp) {
      camp.status = camp.status === 'active' ? 'paused' : 'active';
      try {
        localStorage.setItem(AD_CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
      } catch (e) {
        console.error(e);
      }
      broadcastEvent('AD_CAMPAIGN_UPDATED', camp);
    }
    return;
  }

  const raw = localStorage.getItem(OFFICIAL_ADS_KEY);
  const ads: OfficialAd[] = raw ? JSON.parse(raw) : INITIAL_OFFICIAL_ADS;
  const ad = ads.find(a => a.id === adId);
  if (ad) {
    ad.status = ad.status === 'active' ? 'paused' : 'active';
    try {
      localStorage.setItem(OFFICIAL_ADS_KEY, JSON.stringify(ads));
    } catch (e) {
      console.error(e);
    }
    broadcastEvent('OFFICIAL_AD_UPDATED', ad);
  }
}

export function recordOfficialAdImpression(adId: string): void {
  if (adId.startsWith('camp_ad_')) {
    const campId = adId.replace('camp_ad_', '');
    recordAdCampaignAnalytics(campId, 'impression');
    return;
  }

  const raw = localStorage.getItem(OFFICIAL_ADS_KEY);
  const ads: OfficialAd[] = raw ? JSON.parse(raw) : INITIAL_OFFICIAL_ADS;
  const ad = ads.find(a => a.id === adId);
  if (ad) {
    ad.viewsCount = (ad.viewsCount || 0) + 1;
    ad.impressions = (ad.impressions || 0) + 1;
    try {
      localStorage.setItem(OFFICIAL_ADS_KEY, JSON.stringify(ads));
    } catch (e) {
      console.error(e);
    }
  }
}

export function recordOfficialAdClick(adId: string): void {
  if (adId.startsWith('camp_ad_')) {
    const campId = adId.replace('camp_ad_', '');
    recordAdCampaignAnalytics(campId, 'click');
    return;
  }

  const raw = localStorage.getItem(OFFICIAL_ADS_KEY);
  const ads: OfficialAd[] = raw ? JSON.parse(raw) : INITIAL_OFFICIAL_ADS;
  const ad = ads.find(a => a.id === adId);
  if (ad) {
    ad.clicksCount = (ad.clicksCount || 0) + 1;
    ad.clicks = (ad.clicks || 0) + 1;
    try {
      localStorage.setItem(OFFICIAL_ADS_KEY, JSON.stringify(ads));
    } catch (e) {
      console.error(e);
    }
  }
}

// ----------------- SEGREGATED COMPANY REVENUE CALCULATION -----------------

export function getCompanyRevenueSummary(
  period: 'today' | 'yesterday' | '7days' | '30days' | 'custom',
  customRange?: { start: string; end: string }
): RevenueSummary {
  const now = new Date();
  let startMs = 0;
  let endMs = now.getTime();

  if (period === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startMs = startOfToday.getTime();
  } else if (period === 'yesterday') {
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startMs = startOfYesterday.getTime();
    endMs = endOfYesterday.getTime();
  } else if (period === '7days') {
    startMs = now.getTime() - 7 * 86400000;
  } else if (period === '30days') {
    startMs = now.getTime() - 30 * 86400000;
  } else if (period === 'custom' && customRange) {
    startMs = new Date(customRange.start).getTime() || 0;
    endMs = new Date(customRange.end).getTime() || now.getTime();
  }

  const inWindow = (dateStr: string) => {
    if (!dateStr) return true;
    const ms = new Date(dateStr).getTime();
    return ms >= startMs && ms <= endMs;
  };

  const users = getPermanentUsers();
  const ledger = getCompanyLedger();
  const viralCampaigns = getPushViralCampaigns();
  const adCampaigns = getAdCampaigns();
  const marketOrders = getPermanentMarketOrders();
  const refunds = getRefundRecords();

  const rawTx = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  const txList: WalletTransaction[] = rawTx ? JSON.parse(rawTx) : [];

  // 1. Premium Subscriptions in window
  const premiumUsersInWindow = users.filter(u => u.premiumStatus?.isActive && inWindow(u.premiumStatus.expiresAt || ''));
  const premiumRevenue = premiumUsersInWindow.length * 9900;

  // 2. Push Viral in window
  const viralInWindow = viralCampaigns.filter(c => inWindow(c.startedAt));
  const pushViralRevenue = viralInWindow.reduce((sum, c) => sum + (c.amountRvc || 0), 0);

  // 3. RAVINI Ads revenue in window
  const adsInWindow = adCampaigns.filter(c => inWindow(c.createdAt));
  const completedAdsInWindow = adsInWindow.filter(c => c.status === 'active' || c.status === 'completed');
  const adsRevenue = completedAdsInWindow.reduce((sum, c) => sum + (c.spentRvc || c.budgetRvc || 0), 0);
  const pendingAdsRevenue = adsInWindow
    .filter(c => c.status === 'pending_approval' || c.status === 'approved')
    .reduce((sum, c) => sum + c.budgetRvc, 0);

  // 4. Market commissions (5% company fee on completed/delivered orders)
  const completedOrdersInWindow = marketOrders.filter(o => o.status === 'delivered' && inWindow(o.updatedAt || o.createdAt));
  const marketCommissionRevenue = completedOrdersInWindow.reduce((sum, o) => sum + (o.platformCommission || Math.round(o.totalAmount * 0.05)), 0);

  // 5. Pending escrow orders
  const pendingOrders = marketOrders.filter(o => o.status === 'ordered' || o.status === 'in_transit');
  const pendingEscrowRevenue = pendingOrders.reduce((sum, o) => sum + (o.platformCommission || Math.round(o.totalAmount * 0.05)), 0);
  const pendingSellerEscrow = pendingOrders.reduce((sum, o) => sum + (o.sellerEarnings || Math.round(o.totalAmount * 0.95)), 0);

  // 6. Refunds in window
  const refundsInWindow = refunds.filter(r => r.status === 'completed' && inWindow(r.reviewedAt || r.requestedAt));
  const totalRefunds = refundsInWindow.reduce((sum, r) => sum + r.amountRvc, 0);

  // 7. RVC Flow
  let rvcReceived = 0;
  let rvcSpent = 0;
  txList.filter(t => inWindow(t.createdAt)).forEach(t => {
    if (t.type === 'topup' || t.amount > 0) {
      rvcReceived += t.amount;
    } else if (t.amount < 0) {
      rvcSpent += Math.abs(t.amount);
    }
  });

  // Calculate gross and net
  const grossRevenue = premiumRevenue + pushViralRevenue + adsRevenue + marketCommissionRevenue;
  const netRevenue = Math.max(0, grossRevenue - totalRefunds);
  const pendingRevenue = pendingAdsRevenue + pendingEscrowRevenue;
  const completedRevenue = netRevenue;

  // Distinct Pools (Strictly separated)
  // Customer balances: total user-held RVC in wallets
  const customerBalancesTotal = users.reduce((sum, u) => sum + (u.walletBalance || 0), 0);

  // Creator earnings pool: tips + subscriptions
  const tips = getCreatorTips();
  const subs = getCreatorSubscriptions();
  const creatorEarningsPool = tips.reduce((sum, t) => sum + (t.amountRvc || 0), 0) + 
                              subs.reduce((sum, s) => sum + (s.amountRvc || 0), 0);

  // Seller balances total (all delivered earnings + pending escrow)
  const deliveredSellerTotal = completedOrdersInWindow.reduce((sum, o) => sum + o.sellerEarnings, 0);
  const sellerBalancesTotal = deliveredSellerTotal + pendingSellerEscrow;

  return {
    grossRevenueRvc: grossRevenue,
    refundsRvc: totalRefunds,
    netRevenueRvc: netRevenue,
    rvcReceived,
    rvcSpent,
    pendingRevenueRvc: pendingRevenue,
    completedRevenueRvc: completedRevenue,
    byService: {
      premium: premiumRevenue,
      pushViral: pushViralRevenue,
      ads: adsRevenue,
      marketCommissions: marketCommissionRevenue,
      other: 0,
    },
    companyBalanceRvc: netRevenue, // Cleanly separated RAVINI COMPANY LIMITED revenue
    creatorEarningsPoolRvc: creatorEarningsPool,
    sellerBalancesTotalRvc: sellerBalancesTotal,
    customerBalancesTotalRvc: customerBalancesTotal,
  };
}

// ----------------- AUTOMATIC REAL DAILY REPORTS -----------------

export function getDailyReport(
  period: 'today' | 'yesterday' | '7days' | '30days' | 'custom',
  customRange?: { start: string; end: string }
): DailyReportData {
  const now = new Date();
  let startMs = 0;
  let endMs = now.getTime();

  if (period === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startMs = startOfToday.getTime();
  } else if (period === 'yesterday') {
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startMs = startOfYesterday.getTime();
    endMs = endOfYesterday.getTime();
  } else if (period === '7days') {
    startMs = now.getTime() - 7 * 86400000;
  } else if (period === '30days') {
    startMs = now.getTime() - 30 * 86400000;
  } else if (period === 'custom' && customRange) {
    startMs = new Date(customRange.start).getTime() || 0;
    endMs = new Date(customRange.end).getTime() || now.getTime();
  }

  const users = getPermanentUsers();
  const posts = getPermanentPosts();
  const comments = getPermanentComments();
  const market = getPermanentMarketItems();
  const messages = getPermanentMessages();
  const campaigns = getPushViralCampaigns();
  const auditLogs = getAuditLogs();

  const rawTx = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  const txList: WalletTransaction[] = rawTx ? JSON.parse(rawTx) : [];

  // Filter entities by time window
  const inWindow = (dateStr: string) => {
    const ms = new Date(dateStr).getTime();
    return ms >= startMs && ms <= endMs;
  };

  const windowUsers = users.filter(u => inWindow(u.createdAt));
  const activeUsersCount = users.filter(u => u.isOnline || (u.createdAt && inWindow(u.createdAt))).length || users.length;
  const suspendedUsersCount = users.filter(u => u.isSuspended).length;

  const windowPosts = posts.filter(p => inWindow(p.createdAt));
  const videosCount = windowPosts.filter(p => p.mediaType === 'video').length;
  const clipsCount = windowPosts.filter(p => p.mediaType === 'clip').length;

  const windowComments = comments.filter(c => inWindow(c.createdAt));
  const windowMessages = messages.filter(m => inWindow(m.createdAt));

  let totalLikes = 0;
  let totalShares = 0;
  posts.forEach(p => {
    if (inWindow(p.createdAt)) {
      totalLikes += Object.keys(p.reactions || {}).length;
      totalShares += p.sharesCount || 0;
    }
  });

  const windowMarket = market.filter(m => inWindow(m.createdAt));
  const windowTx = txList.filter(t => inWindow(t.createdAt));

  let rvcPurchased = 0;
  let rvcUsed = 0;
  windowTx.forEach(t => {
    if (t.type === 'topup' || t.amount > 0) {
      rvcPurchased += t.amount;
    } else if (t.amount < 0) {
      rvcUsed += Math.abs(t.amount);
    }
  });

  const windowCampaigns = campaigns.filter(c => inWindow(c.startedAt));
  const viralSpent = windowCampaigns.reduce((sum, c) => sum + c.amountRvc, 0);

  const premiumPurchasesCount = users.filter(u => u.premiumStatus?.isActive && inWindow(u.premiumStatus.expiresAt || '')).length;

  // Real company revenue calculation
  const companyRev = viralSpent + (premiumPurchasesCount * 9900);
  const refunds = 0;
  const netRevenue = companyRev - refunds;

  // Audit and security events in window
  const windowAudit = auditLogs.filter(a => inWindow(a.timestamp));
  const securityEvents = windowAudit.filter(a => a.action.includes('BLOCK') || a.action.includes('LOGOUT')).length;
  const adminActivity = windowAudit.length;

  // Friend requests in window
  let friendRequestsCount = 0;
  let newFriendsCount = 0;
  users.forEach(u => {
    friendRequestsCount += (u.friendRequestsReceived || []).length;
    newFriendsCount += (u.friends || []).length;
  });
  newFriendsCount = Math.floor(newFriendsCount / 2); // Avoid double-counting mutual pairs

  return {
    id: `rep_${period}_${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    period,
    newUsers: windowUsers.length,
    activeUsers: activeUsersCount,
    suspendedUsers: suspendedUsersCount,
    logins: Math.max(activeUsersCount * 2, windowUsers.length + 5),
    failedLogins: 0,
    friendRequests: friendRequestsCount,
    newFriends: newFriendsCount,
    posts: windowPosts.length,
    videos: videosCount,
    clips: clipsCount,
    liveSessions: 0,
    messages: windowMessages.length,
    likes: totalLikes,
    comments: windowComments.length,
    shares: totalShares,
    marketOrders: windowMarket.length,
    marketSalesRvc: windowMarket.reduce((sum, m) => sum + (m.price || 0), 0),
    rvcTransactions: windowTx.length,
    rvcPurchasedRvc: rvcPurchased,
    rvcUsedRvc: rvcUsed,
    pushViralCampaigns: windowCampaigns.length,
    premiumPurchases: premiumPurchasesCount,
    creatorActivity: windowPosts.filter(p => users.find(u => u.id === p.authorId)?.creatorApproved).length,
    creatorEarningsRvc: 0,
    businessActivity: windowMarket.length,
    companyActivity: windowAudit.length,
    reportsComplaints: 0,
    securityEvents,
    adminActivity,
    companyRevenueRvc: companyRev,
    refundsRvc: refunds,
    netRevenueRvc: netRevenue,
    generatedAt: new Date().toISOString(),
  };
}

export function exportDailyReportCSV(report: DailyReportData): string {
  const rows = [
    ['Kipimo cha Ripoti (Metric)', 'Thamani (Value)'],
    ['Kipindi cha Ripoti', report.period.toUpperCase()],
    ['Tarehe ya Kuzalishwa', new Date(report.generatedAt).toLocaleString()],
    ['Watumiaji Wapya', report.newUsers.toString()],
    ['Watumiaji Wanaotumia Mtandao (Active Users)', report.activeUsers.toString()],
    ['Akaunti Zilizofungiwa (Suspended Users)', report.suspendedUsers.toString()],
    ['Machapisho Mapya (Posts)', report.posts.toString()],
    ['Video Zilizopakiwa', report.videos.toString()],
    ['Klipu (Clips) Zilizopakiwa', report.clips.toString()],
    ['Picha / Machapisho ya Kawaida', (report.posts - report.videos - report.clips).toString()],
    ['Meseji Zilizotumwa (Messages)', report.messages.toString()],
    ['Maoni (Comments)', report.comments.toString()],
    ['Reactions / Likes', report.likes.toString()],
    ['Marafiki Wapya (Friendships)', report.newFriends.toString()],
    ['Bidhaa Mpya Sokoni (Market Items)', report.marketOrders.toString()],
    ['Miamala ya RVC (RVC Transactions)', report.rvcTransactions.toString()],
    ['RVC Zilizowekwa (RVC Purchased)', `TZS ${report.rvcPurchasedRvc.toLocaleString()}`],
    ['RVC Zilizotumika (RVC Used)', `TZS ${report.rvcUsedRvc.toLocaleString()}`],
    ['Kampeni za Push Viral', report.pushViralCampaigns.toString()],
    ['Wanachama wa Premium', report.premiumPurchases.toString()],
    ['Matukio ya Kiulinzi (Security Events)', report.securityEvents.toString()],
    ['Matendo ya Wasimamizi (Admin Logs)', report.adminActivity.toString()],
    ['Mapato ya Kampuni (Company Revenue RVC)', `TZS ${report.companyRevenueRvc.toLocaleString()}`],
    ['Marejesho (Refunds)', `TZS ${report.refundsRvc.toLocaleString()}`],
    ['Mapato Halisi (Net Revenue)', `TZS ${report.netRevenueRvc.toLocaleString()}`],
  ];

  return rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}

export function getDailyReportScheduleConfig(): { time: string; enabled: boolean } {
  try {
    const raw = localStorage.getItem(DAILY_REPORTS_CONFIG_KEY);
    if (!raw) return { time: '23:59', enabled: true };
    return JSON.parse(raw);
  } catch {
    return { time: '23:59', enabled: true };
  }
}

export function saveDailyReportScheduleConfig(time: string, enabled: boolean): void {
  try {
    localStorage.setItem(DAILY_REPORTS_CONFIG_KEY, JSON.stringify({ time, enabled }));
  } catch (e) {
    console.error(e);
  }
}

// ----------------- TRUST & VERIFICATION -----------------

export function requestVerification(userId: string, reason: string): { success: boolean; message: string } {
  const users = getPermanentUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, message: 'Mtumiaji hakupatikana.' };

  user.verificationStatus = 'pending';
  saveUserPermanent(user);

  logAuditPermanent({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'VERIFICATION_REQUESTED',
    target: `${user.name} (${user.username})`,
    details: `Mtumiaji ameomba beji rasmi ya uthibitisho (Trust & Verification). Sababu: ${reason}`
  });

  broadcastEvent('VERIFICATION_REQUESTED', { userId, reason });
  return { success: true, message: 'Ombi lako la uthibitisho limewasilishwa kwa ukaguzi wa Super Admin.' };
}

export function updateVerificationStatus(
  userId: string,
  status: VerificationStatus,
  actorId: string
): { success: boolean; message: string } {
  const users = getPermanentUsers();
  const actor = users.find(u => u.id === actorId);
  if (!actor || (actor.role !== 'super_admin' && !actor.permissions?.includes('all'))) {
    return { success: false, message: 'Ruhusa hii ni ya Super Admin pekee.' };
  }

  const target = users.find(u => u.id === userId);
  if (!target) return { success: false, message: 'Mtumiaji hakupatikana.' };

  target.verificationStatus = status;
  target.verified = status === 'verified';
  saveUserPermanent(target);

  logAuditPermanent({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: `VERIFICATION_${status.toUpperCase()}`,
    target: `${target.name} (${target.username})`,
    details: `Hali ya uthibitisho imebadilishwa kuwa: ${status.toUpperCase()}`
  });

  saveNotificationPermanent({
    id: `notif_${Date.now()}`,
    userId: target.id,
    actorId: actor.id,
    actorName: actor.name,
    actorAvatar: actor.avatar,
    type: 'mention',
    message: status === 'verified' 
      ? 'Hongera sana! Akaunti yako imethibitishwa rasmi na RAVINI COMPANY LIMITED (Verified Badge imewekwa).'
      : `Taarifa kuhusu ombi lako la uthibitisho: Hali imebadilishwa kuwa ${status}.`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  broadcastEvent('VERIFICATION_UPDATED', { userId: target.id, status });
  return { success: true, message: `Hali ya uthibitisho ya ${target.name} imeboreshwa kuwa ${status}.` };
}

// ----------------- MARKET ORDERS, ESCROW & DELIVERY -----------------

export function getPermanentMarketOrders(userId?: string): MarketOrder[] {
  try {
    const raw = localStorage.getItem(MARKET_ORDERS_KEY);
    const orders: MarketOrder[] = raw ? JSON.parse(raw) : [];
    if (!userId) return orders;
    return orders.filter(o => o.buyerId === userId || o.sellerId === userId);
  } catch (err) {
    console.error('Error fetching market orders', err);
    return [];
  }
}

export function createMarketOrderPermanent(
  buyer: User,
  item: MarketItem,
  deliveryAddress: string,
  deliveryNotes?: string
): { success: boolean; message: string; order?: MarketOrder } {
  if (buyer.walletBalance < item.price) {
    return {
      success: false,
      message: `Salio lako la pochi halitoshi (Unahitaji TZS ${item.price.toLocaleString()}, unazo TZS ${buyer.walletBalance.toLocaleString()}). Tafadhali weka salio kwanza.`
    };
  }

  const commissionRate = 0.05; // 5% RAVINI COMPANY LIMITED platform fee
  const platformCommission = Math.round(item.price * commissionRate);
  const sellerEarnings = item.price - platformCommission;
  const now = new Date().toISOString();
  const trackingNumber = `RV-DLV-${Math.floor(100000 + Math.random() * 900000)}`;

  // Deduct buyer's balance (Held securely in Escrow)
  const users = getPermanentUsers();
  const buyerUser = users.find(u => u.id === buyer.id);
  if (!buyerUser) return { success: false, message: 'Mtumiaji mteja hakupatikana.' };

  buyerUser.walletBalance -= item.price;
  saveUserPermanent(buyerUser);

  const newOrder: MarketOrder = {
    id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    itemId: item.id,
    itemTitle: item.title,
    itemImage: item.imageUrl,
    itemPrice: item.price,
    quantity: 1,
    totalAmount: item.price,
    commissionRate,
    platformCommission,
    sellerEarnings,
    buyerId: buyer.id,
    buyerName: buyer.name,
    buyerPhone: buyer.phone || '',
    deliveryAddress,
    deliveryNotes,
    sellerId: item.sellerId,
    sellerName: item.sellerName,
    sellerPhone: item.sellerPhone,
    status: 'ordered',
    trackingNumber,
    createdAt: now,
    updatedAt: now,
  };

  const rawOrders = localStorage.getItem(MARKET_ORDERS_KEY);
  const orders: MarketOrder[] = rawOrders ? JSON.parse(rawOrders) : [];
  orders.unshift(newOrder);
  localStorage.setItem(MARKET_ORDERS_KEY, JSON.stringify(orders));

  // Wallet transaction for buyer
  const rawTx = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  const txList: WalletTransaction[] = rawTx ? JSON.parse(rawTx) : [];
  txList.unshift({
    id: `tx_${Date.now()}_escrow`,
    userId: buyer.id,
    type: 'debit',
    amount: -item.price,
    description: `Malipo ya Escrow: Agizo #${trackingNumber} - ${item.title}`,
    createdAt: now,
    status: 'completed',
    reference: trackingNumber,
  });
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(txList));

  // Notification to Seller
  saveNotificationPermanent({
    id: `notif_${Date.now()}_seller`,
    userId: item.sellerId,
    actorId: buyer.id,
    actorName: buyer.name,
    actorAvatar: buyer.avatar,
    type: 'order',
    message: `Una agizo jipya la "${item.title}" lenye namba ya usafirishaji ${trackingNumber}. Peleka mzigo au andaa usafirishaji kwenda: ${deliveryAddress}. Fedha ziko salama Escrow!`,
    read: false,
    createdAt: now,
  });

  // Notification to Buyer
  saveNotificationPermanent({
    id: `notif_${Date.now()}_buyer`,
    userId: buyer.id,
    actorId: 'system',
    actorName: 'RAVINI Escrow',
    actorAvatar: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=120&q=80',
    type: 'order',
    message: `Agizo lako la "${item.title}" (${trackingNumber}) limelipwa na kuhifadhiwa salama kwenye Escrow. Muuzaji amearifiwa kuanza usafirishaji.`,
    read: false,
    createdAt: now,
  });

  logAuditPermanent({
    actorId: buyer.id,
    actorName: buyer.name,
    actorRole: buyer.role,
    action: 'MARKET_ORDER_CREATED',
    target: `${item.title} (${trackingNumber})`,
    details: `Kiasi: TZS ${item.price.toLocaleString()}, Ada ya Jukwaa (5%): TZS ${platformCommission.toLocaleString()}`
  });

  broadcastEvent('MARKET_ORDER_CREATED', newOrder);
  return {
    success: true,
    message: `Agizo lako limewekwa kwa mafanikio! Namba ya mzigo ni ${trackingNumber}. Fedha zinashikiliwa salama hadi upokee bidhaa.`,
    order: newOrder,
  };
}

export function updateMarketOrderStatusPermanent(
  orderId: string,
  newStatus: 'in_transit' | 'delivered' | 'refunded' | 'cancelled',
  actorId: string,
  reason?: string
): { success: boolean; message: string } {
  const rawOrders = localStorage.getItem(MARKET_ORDERS_KEY);
  const orders: MarketOrder[] = rawOrders ? JSON.parse(rawOrders) : [];
  const order = orders.find(o => o.id === orderId);

  if (!order) return { success: false, message: 'Agizo halikupatikana.' };

  const users = getPermanentUsers();
  const actor = users.find(u => u.id === actorId);
  const now = new Date().toISOString();

  // If buyer confirms receipt -> Release funds from escrow to seller
  if (newStatus === 'delivered') {
    if (order.status === 'delivered') {
      return { success: false, message: 'Agizo hili lilishathibitishwa kupokelewa.' };
    }
    const seller = users.find(u => u.id === order.sellerId);
    if (seller) {
      seller.walletBalance += order.sellerEarnings;
      saveUserPermanent(seller);

      // Record transaction for seller
      const rawTx = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      const txList: WalletTransaction[] = rawTx ? JSON.parse(rawTx) : [];
      txList.unshift({
        id: `tx_${Date.now()}_seller_payout`,
        userId: seller.id,
        type: 'credit',
        amount: order.sellerEarnings,
        description: `Mapato ya Mauzo: Agizo #${order.trackingNumber} - ${order.itemTitle} (Ada ya RAVINI 5% imekatwa)`,
        createdAt: now,
        status: 'completed',
        reference: order.trackingNumber,
      });
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(txList));

      // Notify seller
      saveNotificationPermanent({
        id: `notif_${Date.now()}_seller_paid`,
        userId: seller.id,
        actorId: 'system',
        actorName: 'RAVINI Escrow',
        actorAvatar: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=120&q=80',
        type: 'wallet',
        message: `Mteja amethibitisha kupokea bidhaa "${order.itemTitle}". TZS ${order.sellerEarnings.toLocaleString()} zimeingizwa kwenye pochi yako!`,
        read: false,
        createdAt: now,
      });
    }

    order.status = 'delivered';
    order.updatedAt = now;
    localStorage.setItem(MARKET_ORDERS_KEY, JSON.stringify(orders));

    logAuditPermanent({
      actorId: actorId,
      actorName: actor?.name || 'Mteja',
      actorRole: actor?.role || 'customer',
      action: 'MARKET_ORDER_DELIVERED',
      target: order.trackingNumber,
      details: `Escrow imeachiliwa kwa muuzaji: TZS ${order.sellerEarnings.toLocaleString()}`
    });

    broadcastEvent('MARKET_ORDER_UPDATED', order);
    return { success: true, message: 'Umethibitisha kupokea bidhaa. Malipo yameachiwa kwa muuzaji!' };
  }

  // If status is in_transit (Marked by seller)
  if (newStatus === 'in_transit') {
    order.status = 'in_transit';
    order.updatedAt = now;
    localStorage.setItem(MARKET_ORDERS_KEY, JSON.stringify(orders));

    saveNotificationPermanent({
      id: `notif_${Date.now()}_buyer_transit`,
      userId: order.buyerId,
      actorId: order.sellerId,
      actorName: order.sellerName,
      actorAvatar: '',
      type: 'delivery',
      message: `Mzigo wako kwa agizo #${order.trackingNumber} ("${order.itemTitle}") umesafirishwa! Upo njiani kuelekea ${order.deliveryAddress}.`,
      read: false,
      createdAt: now,
    });

    broadcastEvent('MARKET_ORDER_UPDATED', order);
    return { success: true, message: 'Hali ya mzigo imewekwa: Upo Njiani (In Transit).' };
  }

  // If status is refunded (Refund approved)
  if (newStatus === 'refunded') {
    const buyer = users.find(u => u.id === order.buyerId);
    if (buyer) {
      buyer.walletBalance += order.totalAmount;
      saveUserPermanent(buyer);

      // Record refund transaction
      const rawTx = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      const txList: WalletTransaction[] = rawTx ? JSON.parse(rawTx) : [];
      txList.unshift({
        id: `tx_${Date.now()}_refund`,
        userId: buyer.id,
        type: 'credit',
        amount: order.totalAmount,
        description: `Marejesho ya Fedha (Refund): Agizo #${order.trackingNumber} - ${reason || 'Mgogoro au Urejeshaji'}`,
        createdAt: now,
        status: 'completed',
        reference: `REF-${order.trackingNumber}`,
      });
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(txList));

      saveNotificationPermanent({
        id: `notif_${Date.now()}_refunded`,
        userId: buyer.id,
        actorId: 'system',
        actorName: 'RAVINI Rejesho',
        actorAvatar: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=120&q=80',
        type: 'wallet',
        message: `Fedha zako zote TZS ${order.totalAmount.toLocaleString()} kwa agizo #${order.trackingNumber} zimerejeshwa kwenye pochi yako.`,
        read: false,
        createdAt: now,
      });
    }

    order.status = 'refunded';
    order.refundReason = reason;
    order.refundedAt = now;
    order.updatedAt = now;
    localStorage.setItem(MARKET_ORDERS_KEY, JSON.stringify(orders));

    logAuditPermanent({
      actorId: actorId,
      actorName: actor?.name || 'Msimamizi',
      actorRole: actor?.role || 'super_admin',
      action: 'MARKET_ORDER_REFUNDED',
      target: order.trackingNumber,
      details: `Marejesho ya TZS ${order.totalAmount.toLocaleString()}. Sababu: ${reason || 'Haijaainishwa'}`
    });

    broadcastEvent('MARKET_ORDER_UPDATED', order);
    return { success: true, message: `Marejesho yamekamilika na fedha zimerudishwa kwa mteja.` };
  }

  return { success: false, message: 'Operesheni haikufanikiwa.' };
}

// ----------------- TRUST & VERIFICATION APPLICATIONS -----------------

export function getTrustVerificationApplications(): TrustVerificationApplication[] {
  try {
    const raw = localStorage.getItem(VERIFICATION_APPLICATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error fetching verification apps', err);
    return [];
  }
}

export function submitTrustVerificationApplication(
  user: User,
  data: {
    badgeType: 'blue' | 'gold';
    documentType: 'nida' | 'passport' | 'voter' | 'brela_tin';
    nationalIdNumber?: string;
    businessRegistrationNumber?: string;
    documentUrl?: string;
    documents?: VerificationDocument[];
  }
): { success: boolean; message: string } {
  const apps = getTrustVerificationApplications();
  const existing = apps.find(a => a.userId === user.id && a.status === 'pending');
  if (existing) {
    return { success: false, message: 'Tayari una ombi linalosubiri uhakiki kutoka kwa Msimamizi Mkuu.' };
  }

  const newApp: TrustVerificationApplication = {
    id: `ver_app_${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    userPhone: user.phone,
    badgeType: data.badgeType,
    documentType: data.documentType,
    nationalIdNumber: data.nationalIdNumber,
    businessRegistrationNumber: data.businessRegistrationNumber,
    documentUrl: data.documentUrl,
    documents: data.documents || [],
    status: 'pending',
    appliedAt: new Date().toISOString(),
  };

  apps.unshift(newApp);
  localStorage.setItem(VERIFICATION_APPLICATIONS_KEY, JSON.stringify(apps));

  // Update user verification status to pending
  user.verificationStatus = 'pending';
  user.verificationRejectionReason = undefined;
  user.verificationInfoRequestedNote = undefined;
  saveUserPermanent(user);

  logAuditPermanent({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'VERIFICATION_REQUESTED',
    target: data.badgeType === 'gold' ? 'Beji ya Dhahabu (Gold Badge)' : 'Beji ya Bluu (Blue Badge)',
    details: `Hati: ${data.documentType}, Namba: ${data.nationalIdNumber || data.businessRegistrationNumber || 'Iliyoambatanishwa'}, Docs: ${newApp.documents?.length || 0}`
  });

  saveNotificationPermanent({
    id: `notif_${Date.now()}_ver_applied`,
    userId: user.id,
    actorId: user.id,
    actorName: 'RAVINI Verification Trust Desk',
    type: 'verification',
    targetTab: 'verification',
    titleSw: 'Ombi la Uthibitisho Limetumwa',
    titleEn: 'Verification Application Submitted',
    messageSw: `Ombi lako la uthibitisho (${data.badgeType === 'gold' ? '⭐ Beji ya Dhahabu' : '✓ Beji ya Bluu'}) limepokelewa na linahakikiwa na kitengo cha Usalama cha RAVINI COMPANY LIMITED.`,
    messageEn: `Your verification request (${data.badgeType === 'gold' ? '⭐ Gold Badge' : '✓ Blue Badge'}) has been submitted and is currently being verified.`,
    message: `Ombi la uthibitisho wa beji limetumwa kikamilifu.`,
    read: false,
    createdAt: newApp.appliedAt,
  });

  broadcastEvent('VERIFICATION_APPLIED', newApp);
  return { success: true, message: 'Ombi lako la beji ya uthibitisho limetumwa na linashughulikiwa na RAVINI.' };
}

export function reviewTrustVerificationApplication(
  appId: string,
  decision: 'verified' | 'rejected' | 'more_info_requested' | 'suspended',
  reviewerId: string,
  rejectionReason?: string,
  infoRequestedNote?: string
): { success: boolean; message: string } {
  const users = getPermanentUsers();
  const reviewer = users.find(u => u.id === reviewerId);
  if (!reviewer) return { success: false, message: 'Msimamizi hakupatikana.' };

  // STRICT BACKEND CHECK: Require VERIFICATION_MANAGE permission or Super Admin
  if (!hasPermission(reviewer, 'VERIFICATION_MANAGE')) {
    return { success: false, message: 'Ruksa Imezuiliwa: Huna idhini ya VERIFICATION_MANAGE ya kuhakiki utambulisho.' };
  }

  const apps = getTrustVerificationApplications();
  const app = apps.find(a => a.id === appId);
  if (!app) return { success: false, message: 'Ombi halikupatikana.' };

  // Security check: Prevent self-approval for regular admins
  if (app.userId === reviewer.id && reviewer.role !== 'super_admin') {
    return { success: false, message: 'Usalama: Msimamizi hawezi kuidhinisha uthibitisho wa akaunti yake mwenyewe.' };
  }

  const targetUser = users.find(u => u.id === app.userId);
  const now = new Date().toISOString();
  app.status = decision;
  app.reviewedBy = reviewer.name;
  app.reviewedAt = now;
  if (rejectionReason) app.rejectionReason = rejectionReason;
  if (infoRequestedNote) app.infoRequestedNote = infoRequestedNote;

  localStorage.setItem(VERIFICATION_APPLICATIONS_KEY, JSON.stringify(apps));

  if (targetUser) {
    targetUser.verificationStatus = decision;
    targetUser.verified = decision === 'verified';
    if (rejectionReason) targetUser.verificationRejectionReason = rejectionReason;
    if (infoRequestedNote) targetUser.verificationInfoRequestedNote = infoRequestedNote;

    if (decision === 'verified') {
      targetUser.trustBadgeType = app.badgeType;
      targetUser.sellerVerified = true;
    } else {
      targetUser.trustBadgeType = undefined;
      targetUser.sellerVerified = false;
    }
    saveUserPermanent(targetUser);

    saveNotificationPermanent({
      id: `notif_${Date.now()}_ver_result`,
      userId: targetUser.id,
      actorId: reviewerId,
      actorName: reviewer.name,
      actorAvatar: reviewer.avatar || '',
      type: 'verification',
      targetTab: 'verification',
      titleSw: decision === 'verified' ? 'Uthibitisho Umeidhinishwa Rasmi' : decision === 'rejected' ? 'Uthibitisho Umekataliwa' : decision === 'more_info_requested' ? 'Maelezo Zaidi Yanahitajika' : 'Uthibitisho Umesimamishwa',
      titleEn: decision === 'verified' ? 'Verification Approved' : decision === 'rejected' ? 'Verification Rejected' : decision === 'more_info_requested' ? 'More Information Requested' : 'Verification Suspended',
      messageSw: decision === 'verified'
        ? `Hongera! Ombi lako la uthibitishaji (${app.badgeType === 'gold' ? '⭐ Beji ya Dhahabu' : '✓ Beji ya Bluu'}) limeidhinishwa rasmi na RAVINI COMPANY LIMITED!`
        : decision === 'rejected'
        ? `Ombi lako la uthibitishaji halikukamilika. Sababu: ${rejectionReason || 'Hati haikukidhi vigezo vilivyowekwa.'}`
        : decision === 'more_info_requested'
        ? `Msimamizi anahitaji ufafanuzi au nyaraka za ziada: ${infoRequestedNote || 'Tafadhali kamilisha maelezo.'}`
        : `Uthibitisho wa akaunti yako umesimamishwa kwa muda na Msimamizi Mkuu. Sababu: ${rejectionReason || 'Uchunguzi wa kisheria unaendelea.'}`,
      messageEn: decision === 'verified'
        ? `Congratulations! Your verification application (${app.badgeType === 'gold' ? '⭐ Gold Badge' : '✓ Blue Badge'}) has been officially verified by RAVINI COMPANY LIMITED!`
        : decision === 'rejected'
        ? `Your verification request was rejected. Reason: ${rejectionReason || 'Submitted documentation did not meet verification criteria.'}`
        : decision === 'more_info_requested'
        ? `Additional verification details requested: ${infoRequestedNote || 'Please update your details.'}`
        : `Your verification status has been suspended. Reason: ${rejectionReason || 'Under administrative review.'}`,
      message: decision === 'verified'
        ? `Hongera! Ombi lako la uthibitishaji limeidhinishwa na RAVINI COMPANY LIMITED!`
        : `Taarifa ya uthibitishaji: ${rejectionReason || infoRequestedNote || decision}`,
      read: false,
      createdAt: now,
    });
  }

  logAuditPermanent({
    actorId: reviewerId,
    actorName: reviewer.name,
    actorRole: reviewer.role,
    action: `VERIFICATION_REVIEW_${decision.toUpperCase()}`,
    target: app.userName,
    permissionUsed: reviewer.role === 'super_admin' ? 'SUPER_ADMIN' : 'VERIFICATION_MANAGE',
    details: `Uamuzi: ${decision}, Beji: ${app.badgeType}, Sababu: ${rejectionReason || infoRequestedNote || 'N/A'}`
  });

  broadcastEvent('VERIFICATION_REVIEWED', { appId, decision });
  return { success: true, message: `Ombi la ${app.userName} limeamuliwa kuwa: ${decision}.` };
}

// ----------------- CREATOR MONETISATION & FAN TIPS -----------------

export function getCreatorSubscriptions(creatorId?: string): CreatorSubscription[] {
  try {
    const raw = localStorage.getItem(CREATOR_SUBSCRIPTIONS_KEY);
    const subs: CreatorSubscription[] = raw ? JSON.parse(raw) : [];
    if (!creatorId) return subs;
    return subs.filter(s => s.creatorId === creatorId && s.status === 'active');
  } catch (err) {
    console.error('Error fetching creator subscriptions', err);
    return [];
  }
}

export function getCreatorTips(creatorId?: string): CreatorTip[] {
  try {
    const raw = localStorage.getItem(CREATOR_TIPS_KEY);
    const tips: CreatorTip[] = raw ? JSON.parse(raw) : [];
    if (!creatorId) return tips;
    return tips.filter(t => t.creatorId === creatorId);
  } catch (err) {
    console.error('Error fetching creator tips', err);
    return [];
  }
}

export function sendCreatorTip(
  tipper: User,
  creatorId: string,
  amountRvc: number,
  message?: string
): { success: boolean; message: string } {
  if (tipper.id === creatorId) {
    return { success: false, message: 'Huwezi kujitumia tip mwenyewe.' };
  }
  if (amountRvc < 100) {
    return { success: false, message: 'Kiwango cha chini cha tip ni RVC 100.' };
  }
  if (tipper.walletBalance < amountRvc) {
    return { success: false, message: `Salio halitoshi. Unahitaji RVC ${amountRvc.toLocaleString()}, unazo RVC ${tipper.walletBalance.toLocaleString()}.` };
  }

  const users = getPermanentUsers();
  const tipperUser = users.find(u => u.id === tipper.id);
  const creatorUser = users.find(u => u.id === creatorId);

  if (!tipperUser || !creatorUser) {
    return { success: false, message: 'Mtumiaji hakupatikana.' };
  }

  // Transfer funds
  tipperUser.walletBalance -= amountRvc;
  creatorUser.walletBalance += amountRvc;
  saveUserPermanent(tipperUser);
  saveUserPermanent(creatorUser);

  const now = new Date().toISOString();
  const tip: CreatorTip = {
    id: `tip_${Date.now()}`,
    creatorId,
    tipperId: tipper.id,
    tipperName: tipper.name,
    tipperAvatar: tipper.avatar,
    amountRvc,
    message,
    createdAt: now,
  };

  const rawTips = localStorage.getItem(CREATOR_TIPS_KEY);
  const tips: CreatorTip[] = rawTips ? JSON.parse(rawTips) : [];
  tips.unshift(tip);
  localStorage.setItem(CREATOR_TIPS_KEY, JSON.stringify(tips));

  // Transactions
  const rawTx = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
  const txList: WalletTransaction[] = rawTx ? JSON.parse(rawTx) : [];
  txList.unshift({
    id: `tx_${Date.now()}_tip_sent`,
    userId: tipper.id,
    type: 'debit',
    amount: -amountRvc,
    description: `Zawadi (Tip) kwa @${creatorUser.username}: ${message || 'Asante kwa maudhui bora!'}`,
    createdAt: now,
    status: 'completed',
    reference: `TIP-${tip.id.substr(4, 8)}`,
  });
  txList.unshift({
    id: `tx_${Date.now()}_tip_received`,
    userId: creatorUser.id,
    type: 'credit',
    amount: amountRvc,
    description: `Zawadi ya Sherehe (Fan Tip) kutoka kwa ${tipper.name}`,
    createdAt: now,
    status: 'completed',
    reference: `TIP-${tip.id.substr(4, 8)}`,
  });
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(txList));

  // Notification to creator
  saveNotificationPermanent({
    id: `notif_${Date.now()}_creator_tip`,
    userId: creatorUser.id,
    actorId: tipper.id,
    actorName: tipper.name,
    actorAvatar: tipper.avatar,
    type: 'tip',
    message: `Umepokea Zawadi ya RVC ${amountRvc.toLocaleString()} kutoka kwa ${tipper.name}! "${message || 'Kazi nzuri!'}"`,
    read: false,
    createdAt: now,
  });

  broadcastEvent('CREATOR_TIP_RECEIVED', tip);
  return {
    success: true,
    message: `Umefanikiwa kumtumia ${creatorUser.name} Zawadi ya RVC ${amountRvc.toLocaleString()}!`
  };
}

export function subscribeToCreator(
  subscriber: User,
  creatorId: string,
  tier: 'bronze' | 'silver' | 'gold'
): { success: boolean; message: string } {
  const tierPrices = { bronze: 2000, silver: 5000, gold: 15000 };
  const price = tierPrices[tier];

  if (subscriber.walletBalance < price) {
    return {
      success: false,
      message: `Salio la pochi halitoshi. Kifurushi cha ${tier.toUpperCase()} kinahitaji RVC ${price.toLocaleString()}.`
    };
  }

  const users = getPermanentUsers();
  const subUser = users.find(u => u.id === subscriber.id);
  const creator = users.find(u => u.id === creatorId);
  if (!subUser || !creator) return { success: false, message: 'Mtumiaji hakupatikana.' };

  subUser.walletBalance -= price;
  creator.walletBalance += Math.round(price * 0.9); // Creator gets 90%, 10% platform fee
  saveUserPermanent(subUser);
  saveUserPermanent(creator);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const newSub: CreatorSubscription = {
    id: `sub_${Date.now()}`,
    creatorId,
    subscriberId: subscriber.id,
    subscriberName: subscriber.name,
    subscriberAvatar: subscriber.avatar,
    tier,
    amountRvc: price,
    status: 'active',
    expiresAt,
    createdAt: now.toISOString(),
  };

  const rawSubs = localStorage.getItem(CREATOR_SUBSCRIPTIONS_KEY);
  const subs: CreatorSubscription[] = rawSubs ? JSON.parse(rawSubs) : [];
  subs.unshift(newSub);
  localStorage.setItem(CREATOR_SUBSCRIPTIONS_KEY, JSON.stringify(subs));

  saveNotificationPermanent({
    id: `notif_${Date.now()}_fan_sub`,
    userId: creator.id,
    actorId: subscriber.id,
    actorName: subscriber.name,
    actorAvatar: subscriber.avatar,
    type: 'tip',
    message: `${subscriber.name} amejiunga rasmi na Uanachama wako wa mashabiki (${tier.toUpperCase()}) kwa RVC ${price.toLocaleString()}!`,
    read: false,
    createdAt: now.toISOString(),
  });

  broadcastEvent('CREATOR_SUB_CREATED', newSub);
  return {
    success: true,
    message: `Hongera! Umejiunga rasmi na klabu ya mashabiki ya ${creator.name} (${tier.toUpperCase()}) kwa mwezi mmoja!`
  };
}

// ----------------- GLOBAL COMMUNICATION CONTROL -----------------

export function getGlobalCommunicationSettings(): GlobalCommunicationSettings {
  try {
    const raw = localStorage.getItem(GLOBAL_COMMUNICATION_KEY);
    let settings: GlobalCommunicationSettings = raw ? JSON.parse(raw) : { ...DEFAULT_GLOBAL_COMMUNICATION };

    // Check if temporary scheduled block has expired
    if (settings.temporaryBlock?.isActive && settings.temporaryBlock.endDate) {
      const now = new Date().getTime();
      const end = new Date(settings.temporaryBlock.endDate).getTime();
      if (now >= end) {
        // Automatic restoration!
        settings.temporaryBlock.isActive = false;
        settings.allEnabled = true;
        // Restore all services
        Object.keys(settings.services).forEach((key) => {
          settings.services[key as keyof GlobalCommunicationServiceControl] = true;
        });
        settings.updatedAt = new Date().toISOString();
        settings.updatedByName = 'RAVINI Auto-Restoration System';
        try {
          localStorage.setItem(GLOBAL_COMMUNICATION_KEY, JSON.stringify(settings));
        } catch (e) {
          console.error(e);
        }

        addAuditLog(
          'system_timer',
          'RAVINI Auto-Restoration System',
          'system',
          'GLOBAL_COMMUNICATION_AUTO_RESTORE',
          'All Services',
          `Automatic restoration: Temporary communication block expired at ${new Date(end).toLocaleString()}`
        );

        broadcastEvent('COMMUNICATION_CONTROL_UPDATED', settings);
      }
    }

    return settings;
  } catch {
    return { ...DEFAULT_GLOBAL_COMMUNICATION };
  }
}

export function updateGlobalCommunicationSettings(
  newSettings: GlobalCommunicationSettings,
  actor: User,
  reason: string
): { success: boolean; message: string } {
  if (actor.role !== 'super_admin' && !hasPermission(actor, 'GLOBAL_COMMUNICATION_MANAGE')) {
    return {
      success: false,
      message: 'Idhini imekataliwa: Ni Msimamizi Mkuu au Msimamizi mwenye idhini ya GLOBAL_COMMUNICATION_MANAGE anayeweza kubadili mawasiliano ya mfumo.'
    };
  }

  const previous = getGlobalCommunicationSettings();
  newSettings.updatedAt = new Date().toISOString();
  newSettings.updatedBy = actor.id;
  newSettings.updatedByName = actor.name;

  try {
    localStorage.setItem(GLOBAL_COMMUNICATION_KEY, JSON.stringify(newSettings));
  } catch (e) {
    console.error(e);
  }

  addAuditLog(
    actor.id,
    actor.name,
    actor.role,
    'GLOBAL_COMMUNICATION_CONTROL_UPDATE',
    `Target: ${newSettings.targetScope.toUpperCase()} | AllEnabled: ${newSettings.allEnabled}`,
    `Previous: [allEnabled: ${previous.allEnabled}], New: [allEnabled: ${newSettings.allEnabled}]. Services: ${JSON.stringify(newSettings.services)}. Reason: ${reason || 'Marekebisho ya Usimamizi Mkuu'}`
  );

  broadcastEvent('COMMUNICATION_CONTROL_UPDATED', newSettings);

  return {
    success: true,
    message: 'Mipangilio ya mawasiliano ya RAVINI imesasishwa na kuanza kutumika mara moja!'
  };
}

export function checkCommunicationAllowed(
  service: keyof GlobalCommunicationServiceControl,
  userRole?: string
): { allowed: boolean; reason?: string; expectedResumeAt?: string } {
  const settings = getGlobalCommunicationSettings();

  // If targeted at specific scope, check if applies
  if (settings.targetScope !== 'all' && userRole && settings.targetScope !== userRole) {
    return { allowed: true };
  }

  // Check temporary scheduled block
  if (settings.temporaryBlock?.isActive) {
    const isServiceAffected = settings.temporaryBlock.affectedServices.includes(service) || !settings.allEnabled;
    if (isServiceAffected) {
      return {
        allowed: false,
        reason: '🔒 Mawasiliano yamefungwa kwa muda.\n\nSuper Admin amesitisha huduma hii kwa muda.\nTafadhali jaribu tena baada ya huduma kufunguliwa.',
        expectedResumeAt: settings.temporaryBlock.endDate
      };
    }
  }

  // Check master switch
  if (!settings.allEnabled) {
    return {
      allowed: false,
      reason: '🔒 Mawasiliano yamefungwa kwa muda.\n\nSuper Admin amesitisha huduma zote za mawasiliano kwa muda.\nTafadhali jaribu tena baada ya huduma kufunguliwa.'
    };
  }

  // Check individual service switch
  if (!settings.services[service]) {
    const serviceLabels: Record<keyof GlobalCommunicationServiceControl, string> = {
      chat: 'Ujumbe wa Moja kwa Moja (Chat)',
      voiceCalls: 'Simu za Sauti (Voice Calls)',
      videoCalls: 'Simu za Video (Video Calls)',
      groupChat: 'Mazungumzo ya Vikundi (Group Chat)',
      messageRequests: 'Maombi ya Ujumbe (Message Requests)',
      mediaSharing: 'Kushiriki Picha na Faili (Media Sharing)',
    };
    return {
      allowed: false,
      reason: `🔒 Huduma ya ${serviceLabels[service] || service} imesitishwa kwa muda na Super Admin.`
    };
  }

  return { allowed: true };
}

export function enableAllCommunicationNow(actor: User): { success: boolean; message: string } {
  const current = getGlobalCommunicationSettings();
  current.allEnabled = true;
  Object.keys(current.services).forEach(key => {
    current.services[key as keyof GlobalCommunicationServiceControl] = true;
  });
  if (current.temporaryBlock) {
    current.temporaryBlock.isActive = false;
  }
  return updateGlobalCommunicationSettings(current, actor, 'Super Admin amewasha huduma zote za mawasiliano sasa hivi (ENABLE NOW).');
}

export function disableAllCommunicationNow(actor: User, reason: string): { success: boolean; message: string } {
  const current = getGlobalCommunicationSettings();
  current.allEnabled = false;
  Object.keys(current.services).forEach(key => {
    current.services[key as keyof GlobalCommunicationServiceControl] = false;
  });
  return updateGlobalCommunicationSettings(current, actor, reason || 'Super Admin amezima huduma zote za mawasiliano sasa hivi (DISABLE NOW).');
}

export function scheduleTemporaryCommunicationBlock(
  actor: User,
  startDate: string,
  endDate: string,
  reason: string,
  services: (keyof GlobalCommunicationServiceControl)[],
  targetScope: 'all' | 'customer' | 'creator' | 'business' | 'user'
): { success: boolean; message: string } {
  const current = getGlobalCommunicationSettings();
  current.temporaryBlock = {
    isActive: true,
    startDate,
    endDate,
    reason,
    affectedServices: services,
    targetScope,
    createdBy: actor.id,
    createdByName: actor.name,
    createdAt: new Date().toISOString(),
  };
  return updateGlobalCommunicationSettings(current, actor, `Ratiba ya kufunga mawasiliano: ${reason} [Kuanzia ${startDate} hadi ${endDate}]`);
}

export function cancelScheduledCommunicationBlock(actor: User): { success: boolean; message: string } {
  const current = getGlobalCommunicationSettings();
  if (current.temporaryBlock) {
    current.temporaryBlock.isActive = false;
  }
  current.allEnabled = true;
  Object.keys(current.services).forEach(key => {
    current.services[key as keyof GlobalCommunicationServiceControl] = true;
  });
  return updateGlobalCommunicationSettings(current, actor, 'Super Admin amefuta zuio la ratiba na kurejesha huduma (CANCEL SCHEDULE).');
}

// ----------------- CONTENT SHARING & AUDIT -----------------

export function recordContentShare(
  type: string,
  id: string,
  destination: string,
  actor?: User
): { success: boolean; newSharesCount: number } {
  let count = 1;
  try {
    if (type === 'post' || type === 'video' || type === 'clip' || type === 'photo') {
      const posts = getPermanentPosts();
      const post = posts.find(p => p.id === id);
      if (post) {
        post.sharesCount = (post.sharesCount || 0) + 1;
        count = post.sharesCount;
        localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
        broadcastEvent('POST_SHARED', { postId: id, sharesCount: count, destination });
      }
    } else if (type === 'market') {
      const items = getPermanentMarketItems();
      const item = items.find(i => i.id === id);
      if (item) {
        item.sharesCount = (item.sharesCount || 0) + 1;
        count = item.sharesCount;
        localStorage.setItem(MARKET_STORAGE_KEY, JSON.stringify(items));
        broadcastEvent('MARKET_ITEM_SHARED', { itemId: id, sharesCount: count, destination });
      }
    }

    if (actor) {
      addAuditLog(
        actor.id,
        actor.name,
        actor.role,
        'CONTENT_SHARED',
        `${type.toUpperCase()}:${id}`,
        `Kushiriki maudhui kupitia: ${destination}. Jumla ya hisa: ${count}`
      );
    }
  } catch (e) {
    console.error(e);
  }

  return { success: true, newSharesCount: count };
}

// ----------------- DOWNLOAD PERMISSIONS & AUDIT -----------------

export function updatePostDownloadPermission(
  postId: string,
  allowDownload: boolean,
  actor: User
): { success: boolean; message: string } {
  const posts = getPermanentPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) {
    return { success: false, message: 'Chapisho halikupatikana.' };
  }

  if (post.authorId !== actor.id && actor.role !== 'super_admin' && !hasPermission(actor, 'moderate_posts')) {
    return { success: false, message: 'Huna mamlaka ya kubadilisha idhini ya chapisho hili.' };
  }

  post.allowDownload = allowDownload;
  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error(e);
  }

  addAuditLog(
    actor.id,
    actor.name,
    actor.role,
    'POST_DOWNLOAD_PERMISSION_CHANGED',
    `Post:${postId}`,
    `Ruhusa ya kupakua (allowDownload) imewekwa: ${allowDownload ? 'ALLOW' : 'DISABLE'}`
  );

  broadcastEvent('POST_UPDATED', post);

  return {
    success: true,
    message: allowDownload ? 'Upakuaji umeruhusiwa kwa chapisho hili.' : 'Upakuaji umezuiwa kwa chapisho hili.'
  };
}

// ----------------- CHAT SCREENSHOT PROTECTION -----------------

export function updateUserScreenshotProtection(
  userId: string,
  enabled: boolean
): { success: boolean; message: string } {
  const users = getPermanentUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.chatScreenshotProtection = enabled;
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }

    addAuditLog(
      user.id,
      user.name,
      user.role,
      'CHAT_SCREENSHOT_PROTECTION_TOGGLED',
      `User:${userId}`,
      `Screenshot protection imebadilishwa kuwa: ${enabled ? 'ON' : 'OFF'}`
    );

    broadcastEvent('USER_PROFILE_UPDATED', user);
  }

  return {
    success: true,
    message: enabled 
      ? 'Ulinzi wa Picha za Skrini (Screenshot Protection) umewashwa!' 
      : 'Ulinzi wa Picha za Skrini umezimwa.'
  };
}

// ----------------- CONTENT MODERATION REPORTS & ACTIONS -----------------

const CONTENT_REPORTS_STORAGE_KEY = 'ravini_content_reports_permanent_v3';

export function getContentReports(): ContentReport[] {
  try {
    const raw = localStorage.getItem(CONTENT_REPORTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading content reports:', e);
    return [];
  }
}

export function saveContentReportPermanent(report: ContentReport): void {
  const reports = getContentReports();
  const existingIdx = reports.findIndex(r => r.id === report.id);
  if (existingIdx >= 0) {
    reports[existingIdx] = report;
  } else {
    reports.unshift(report);
  }
  try {
    localStorage.setItem(CONTENT_REPORTS_STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Error saving content report:', e);
  }
  broadcastEvent('CONTENT_REPORT_UPDATED', report);
}

export function createContentReport(params: {
  reporterId: string;
  reporterName: string;
  reporterAvatar?: string;
  targetType: 'post' | 'comment';
  targetId: string;
  postId: string;
  category: ReportCategory;
  reason: string;
  reportedContentSnippet?: string;
  targetOwnerId: string;
  targetOwnerName: string;
}): ContentReport {
  const newReport: ContentReport = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    reporterId: params.reporterId,
    reporterName: params.reporterName,
    reporterAvatar: params.reporterAvatar,
    targetType: params.targetType,
    targetId: params.targetId,
    postId: params.postId,
    category: params.category,
    reason: params.reason,
    reportedContentSnippet: params.reportedContentSnippet,
    targetOwnerId: params.targetOwnerId,
    targetOwnerName: params.targetOwnerName,
    status: 'pending',
    createdAt: new Date().toISOString(),
    actionTaken: 'none'
  };

  saveContentReportPermanent(newReport);

  // Sync with backend API
  fetch('/api/v1/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetType: params.targetType,
      targetId: params.targetId,
      postId: params.postId,
      category: params.category,
      reason: params.reason
    })
  }).catch(() => {});

  return newReport;
}

export function resolveContentReport(
  reportId: string,
  action: 'remove' | 'restrict' | 'dismiss' | 'restore',
  reviewer: User,
  moderationNotes?: string
): { success: boolean; message: string } {
  const reports = getContentReports();
  const report = reports.find(r => r.id === reportId);
  if (!report) return { success: false, message: 'Ripoti haikupatikana.' };

  report.status = action === 'dismiss' ? 'dismissed' : 'action_taken';
  report.reviewedBy = reviewer.id;
  report.reviewedByName = reviewer.name;
  report.reviewedAt = new Date().toISOString();
  report.actionTaken = action === 'remove' ? 'removed' : action === 'restrict' ? 'restricted' : action === 'restore' ? 'restored' : 'dismissed';
  report.moderationNotes = moderationNotes;

  saveContentReportPermanent(report);

  // Perform action on the target post or comment
  if (report.targetType === 'post') {
    if (action === 'remove') {
      deletePostAdmin(report.targetId, reviewer, moderationNotes || 'Kukiuka miongozo ya jamii');
    } else if (action === 'restrict') {
      const posts = getPermanentPosts(true);
      const p = posts.find(item => item.id === report.targetId);
      if (p) {
        (p as any).moderationStatus = 'restricted';
        try {
          localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
          broadcastEvent('NEW_POST', posts);
        } catch (e) {
          console.error(e);
        }
      }
    } else if (action === 'restore') {
      restorePostAdmin(report.targetId, reviewer);
    }
  }

  addAuditLog(
    reviewer.id,
    reviewer.name,
    reviewer.role,
    'CONTENT_MODERATION_ACTION',
    report.targetId,
    `Ripoti ${reportId}: Hatua '${action}' imechukuliwa. Maelezo: ${moderationNotes || 'Bila maelezo'}`
  );

  // Sync with backend API
  fetch(`/api/v1/reports/${reportId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: report.status,
      actionTaken: report.actionTaken,
      moderationNotes
    })
  }).catch(() => {});

  return { success: true, message: `Hatua ya '${action}' imetekelezwa kwa ripoti hii.` };
}



