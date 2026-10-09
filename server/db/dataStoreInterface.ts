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
  UserPrivacySettings,
  CallSession,
  Post,
  PostComment,
  ContentReport,
  MarketItem,
  MarketOrder,
  NotificationItem,
  CreatorApplication,
  BusinessApplication,
  CompanyApplication,
  GlobalCommunicationSettings,
  GlobalCommunicationServiceControl,
  DailyReportData
} from '../../src/types';

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  search?: string;
  category?: string;
}

export interface IRaviniDataStore {
  readonly name: string;
  initialize(): Promise<void>;
  
  // User & Authentication Management
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByPhone(phone: string): Promise<User | null>;
  saveUser(user: User): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | null>;
  purgeUser?(id: string, actorId: string): Promise<boolean>;

  // Financial Wallet & Transactions
  getUserTransactions(userId: string, options?: PaginationOptions): Promise<WalletTransaction[]>;
  getAllTransactions(options?: PaginationOptions): Promise<WalletTransaction[]>;
  recordWalletTransaction(transaction: WalletTransaction): Promise<WalletTransaction>;
  atomicWalletTransfer(params: {
    senderId: string;
    recipientId: string;
    amountRvc: number;
    description: string;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; message: string; transaction?: WalletTransaction }>;

  // Ad Campaigns
  getAdCampaigns(options?: PaginationOptions): Promise<AdCampaign[]>;
  getAdCampaignById(id: string): Promise<AdCampaign | null>;
  saveAdCampaign(campaign: AdCampaign): Promise<AdCampaign>;
  updateAdCampaign(id: string, updates: Partial<AdCampaign>): Promise<AdCampaign | null>;

  // Company Finance & Ledgers
  getCompanyLedger(options?: PaginationOptions): Promise<CompanyLedgerTransaction[]>;
  addCompanyLedgerEntry(entry: CompanyLedgerTransaction): Promise<CompanyLedgerTransaction>;
  getAuthoritativeLedgers(): Promise<AuthoritativeLedgers>;

  // Refunds
  getRefunds(options?: PaginationOptions): Promise<RefundRecord[]>;
  getRefundById(id: string): Promise<RefundRecord | null>;
  saveRefund(refund: RefundRecord): Promise<RefundRecord>;
  updateRefund(id: string, updates: Partial<RefundRecord>): Promise<RefundRecord | null>;

  // Platform Pricing
  getPlatformPricing(): Promise<PlatformPricingConfig>;
  updatePlatformPricing(pricing: PlatformPricingConfig, actorId: string, actorName: string): Promise<PlatformPricingConfig>;

  // RVC Deposit / Cash-in Requests
  getRvcRequests(options?: PaginationOptions): Promise<RvcDepositRequest[]>;
  getRvcRequestById(id: string): Promise<RvcDepositRequest | null>;
  saveRvcRequest(req: RvcDepositRequest): Promise<RvcDepositRequest>;
  updateRvcRequest(id: string, updates: Partial<RvcDepositRequest>): Promise<RvcDepositRequest | null>;

  // Payment Settings (Manual Only - Super Admin Configurable)
  getPaymentConfig(): Promise<PaymentConfig>;
  updatePaymentConfig(config: PaymentConfig, actorId: string, actorName: string): Promise<PaymentConfig>;

  // Credit System Configuration (Prices, Bundles, WhatsApp)
  getCreditConfig(): Promise<CreditConfig>;
  updateCreditConfig(config: Partial<CreditConfig>, actorId: string, actorName: string): Promise<CreditConfig>;

  // Audit Logs (Immutable)
  getAuditLogs(options?: PaginationOptions): Promise<AuditLog[]>;
  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog>;

  // System Settings
  getSystemSettings(): Promise<SystemSettings>;
  updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings>;

  // Chat & Messaging
  getConversations(userId: string): Promise<ChatConversation[]>;
  getConversationById(id: string): Promise<ChatConversation | null>;
  saveConversation(conversation: ChatConversation): Promise<ChatConversation>;
  updateConversation(id: string, updates: Partial<ChatConversation>): Promise<ChatConversation | null>;
  getOrCreateDirectConversation(user1Id: string, user2Id: string): Promise<ChatConversation>;
  getMessages(conversationId: string, options?: PaginationOptions): Promise<ChatMessage[]>;
  getMessageById(id: string): Promise<ChatMessage | null>;
  saveMessage(message: ChatMessage): Promise<ChatMessage>;
  updateMessage(id: string, updates: Partial<ChatMessage>): Promise<ChatMessage | null>;
  deleteMessage(id: string, deletedByUserId: string, forEveryone: boolean): Promise<boolean>;
  searchMessages(userId: string, query: string, conversationId?: string): Promise<ChatMessage[]>;
  
  // Message Requests & Privacy
  getMessageRequests(userId: string): Promise<MessageRequest[]>;
  saveMessageRequest(request: MessageRequest): Promise<MessageRequest>;
  updateMessageRequest(id: string, updates: Partial<MessageRequest>): Promise<MessageRequest | null>;
  getUserPrivacySettings(userId: string): Promise<UserPrivacySettings>;
  updateUserPrivacySettings(userId: string, updates: Partial<UserPrivacySettings>): Promise<UserPrivacySettings>;
  blockUser(blockerId: string, blockedId: string): Promise<boolean>;
  unblockUser(blockerId: string, blockedId: string): Promise<boolean>;
  isUserBlocked(user1Id: string, user2Id: string): Promise<boolean>;

  // Call Sessions
  getCallSessions(userId: string): Promise<CallSession[]>;
  saveCallSession(session: CallSession): Promise<CallSession>;
  updateCallSession(id: string, updates: Partial<CallSession>): Promise<CallSession | null>;

  // Unread Aggregates
  getUnreadChatCount(userId: string): Promise<number>;

  // Posts & Interactions
  getPosts(options?: PaginationOptions & { 
    authorId?: string; 
    includeDeleted?: boolean;
    mediaType?: string;
    moderationStatus?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    reportedOnly?: boolean;
  }): Promise<Post[]>;
  getPostById(id: string): Promise<Post | null>;
  savePost(post: Post): Promise<Post>;
  updatePost(id: string, updates: Partial<Post>): Promise<Post | null>;
  deletePost(id: string, actorId: string, actorRole?: string, reason?: string): Promise<boolean>;
  restorePost(id: string, actorId: string, actorRole?: string): Promise<boolean>;
  purgePost?(id: string, actorId: string): Promise<boolean>;
  restrictPost(id: string, actorId: string, actorRole?: string, reason?: string): Promise<boolean>;
  togglePostComments(id: string, actorId: string, commentsDisabled: boolean): Promise<boolean>;
  likePost(postId: string, userId: string, reaction?: string): Promise<{ likesCount: number; reactions: Record<string, string> }>;
  getComments(
    postIdOrOptions?: string | {
      postId?: string;
      includeRemoved?: boolean;
      authorId?: string;
      moderationStatus?: string;
      search?: string;
      limit?: number;
    },
    legacyIncludeRemoved?: boolean
  ): Promise<PostComment[]>;
  getCommentById(id: string): Promise<PostComment | null>;
  addComment(comment: PostComment): Promise<PostComment>;
  updateComment(id: string, updates: Partial<PostComment>): Promise<PostComment | null>;
  deleteComment(id: string, actorId: string, actorRole?: string, reason?: string): Promise<boolean>;
  restoreComment(id: string, actorId: string, actorRole?: string): Promise<boolean>;

  // Moderation & Reports
  getReports(options?: { status?: string; targetType?: string }): Promise<ContentReport[]>;
  getReportById(id: string): Promise<ContentReport | null>;
  saveReport(report: ContentReport): Promise<ContentReport>;
  updateReport(id: string, updates: Partial<ContentReport>): Promise<ContentReport | null>;

  // Following / Followers
  followUser(followerId: string, targetUserId: string): Promise<{ success: boolean; status?: string; message: string }>;
  unfollowUser(followerId: string, targetUserId: string): Promise<{ success: boolean; message: string }>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  getFollowRequests(userId: string): Promise<any[]>;
  acceptFollowRequest(requestId: string, receiverId: string): Promise<{ success: boolean; message: string }>;
  rejectFollowRequest(requestId: string, receiverId: string): Promise<{ success: boolean; message: string }>;
  getBlockedUsers(userId: string): Promise<User[]>;

  // Market & Orders
  getMarketItems(options?: PaginationOptions): Promise<MarketItem[]>;
  getMarketItemById(id: string): Promise<MarketItem | null>;
  saveMarketItem(item: MarketItem): Promise<MarketItem>;
  updateMarketItem(id: string, updates: Partial<MarketItem>): Promise<MarketItem | null>;
  deleteMarketItem(id: string, userId: string): Promise<boolean>;
  getMarketOrders(userId?: string): Promise<MarketOrder[]>;
  saveMarketOrder(order: MarketOrder): Promise<MarketOrder>;
  updateMarketOrder(id: string, updates: Partial<MarketOrder>): Promise<MarketOrder | null>;

  // Notifications
  getNotifications(userId: string): Promise<NotificationItem[]>;
  saveNotification(notification: NotificationItem): Promise<NotificationItem>;
  markNotificationRead(id: string, userId: string): Promise<boolean>;
  markAllNotificationsRead(userId: string): Promise<boolean>;

  // Verification & Applications
  getCreatorApplications(): Promise<CreatorApplication[]>;
  saveCreatorApplication(app: CreatorApplication): Promise<CreatorApplication>;
  updateCreatorApplication(id: string, updates: Partial<CreatorApplication>): Promise<CreatorApplication | null>;
  getBusinessApplications(): Promise<BusinessApplication[]>;
  saveBusinessApplication(app: BusinessApplication): Promise<BusinessApplication>;
  updateBusinessApplication(id: string, updates: Partial<BusinessApplication>): Promise<BusinessApplication | null>;
  getCompanyApplications(): Promise<CompanyApplication[]>;
  saveCompanyApplication(app: CompanyApplication): Promise<CompanyApplication>;
  updateCompanyApplication(id: string, updates: Partial<CompanyApplication>): Promise<CompanyApplication | null>;

  // Super Admin Global Communication Control
  getGlobalCommunicationSettings(): Promise<GlobalCommunicationSettings>;
  updateGlobalCommunicationSettings(settings: Partial<GlobalCommunicationSettings>, actorId: string, actorName: string): Promise<GlobalCommunicationSettings>;
  isCommunicationServiceAllowed(service: keyof GlobalCommunicationServiceControl, userRole?: string): Promise<{ allowed: boolean; reason?: string }>;

  // Real Database Daily Reports
  generateDailyReport(period: string, customRange?: { start: string; end: string }): Promise<DailyReportData>;

  // Persistence Status
  getPersistenceStatus(): Promise<SystemPersistenceStatus>;
  flush(): Promise<void>;
}
