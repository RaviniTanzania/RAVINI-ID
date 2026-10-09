export type ReactionType = 'like' | 'love' | 'care' | 'haha' | 'wow' | 'sad' | 'angry';

export type UserRole = 
  | 'customer' 
  | 'vendor' 
  | 'winga' 
  | 'fundi' 
  | 'manager' 
  | 'MANAGER' 
  | 'admin' 
  | 'supervisor' 
  | 'employee' 
  | 'super_admin' 
  | 'SUPER_ADMIN' 
  | 'user' 
  | 'creator' 
  | 'business' 
  | 'company';
export type AppMode = 'personal' | 'creator' | 'business' | 'company';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected' | 'suspended' | 'more_info_requested';

export interface User {
  id: string;
  raviniId?: string; // Public format: RV-XXXXXXXX
  name: string;
  firstName?: string;
  lastName?: string;
  username: string;
  email: string;
  phone?: string;
  country?: string;
  countryCode?: string;
  password?: string;
  avatar: string;
  coverPhoto?: string;
  bio?: string;
  location?: string;
  website?: string;
  accountStatus?: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED' | 'DEACTIVATED';
  verified?: boolean;
  verificationStatus?: VerificationStatus;
  role: UserRole;
  currentMode?: AppMode;
  businessName?: string;
  walletBalance: number; // in TZS / RVC (1 RVC = 1 TZS)
  walletLedger?: {
    customerBalance: number;
    creatorEarnings: number;
    companyRevenue: number;
    pendingFunds: number;
    refunds: number;
  };
  followersCount: number;
  followingCount: number;
  createdAt: string;
  isOnline?: boolean;
  savedPosts?: string[];
  followingUsers?: string[]; // userIds this user follows
  friends?: string[]; // userIds of mutual friends
  friendRequestsReceived?: string[];
  friendRequestsSent?: string[];
  blockedUsers?: string[];
  isProfileSetupComplete?: boolean;
  creatorApproved?: boolean;
  creatorApplicationStatus?: 'none' | 'pending' | 'approved' | 'rejected' | 'more_info_requested' | 'suspended';
  creatorRejectionReason?: string;
  creatorInfoRequestedNote?: string;
  creatorAppliedAt?: string;
  creatorDetails?: {
    category: string;
    bio: string;
    socialLink?: string;
    totalReach?: number;
    subscribers?: number;
  };
  businessApproved?: boolean;
  businessApplicationStatus?: 'none' | 'pending' | 'approved' | 'rejected' | 'more_info_requested' | 'suspended';
  businessRejectionReason?: string;
  businessInfoRequestedNote?: string;
  businessAppliedAt?: string;
  businessDetails?: {
    companyName: string;
    category: string;
    tin?: string;
    phone: string;
    email: string;
    address: string;
    description: string;
    productsCount?: number;
    workingHours?: string;
    whatsapp?: string;
  };
  companyApproved?: boolean;
  companyApplicationStatus?: 'none' | 'pending' | 'approved' | 'rejected' | 'more_info_requested' | 'suspended';
  companyRejectionReason?: string;
  companyInfoRequestedNote?: string;
  companyAppliedAt?: string;
  companyDetails?: {
    companyName: string;
    registrationNumber?: string;
    tin?: string;
    industry: string;
    description: string;
    teamSize?: number;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  verificationRejectionReason?: string;
  verificationInfoRequestedNote?: string;
  verificationNote?: string;
  verificationAppliedAt?: string;
  verificationDocuments?: VerificationDocument[];
  permissions?: string[]; // Granular permissions for admins
  isDisabled?: boolean; // Super Admin can enable/disable user
  isPostingDisabled?: boolean; // Super Admin can disallow posting
  isSuspended?: boolean;
  suspensionDetails?: {
    startDate: string;
    endDate?: string;
    durationHours?: number;
    reason: string;
    isPermanent?: boolean;
  };
  forceLogoutAt?: string; // If Super Admin revoked sessions
  mustChangePassword?: boolean; // For initial password 1234
  premiumStatus?: {
    isActive: boolean;
    packageName?: string;
    expiresAt?: string;
    benefits?: string[];
  };
  sellerVerified?: boolean;
  trustBadgeType?: 'blue' | 'gold';
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'sms' | 'authenticator';
  activeSessions?: UserSession[];
  chatScreenshotProtection?: boolean; // When true: blocks screenshots/recordings where supported, watermarks, obfuscates on blur
  accountVisibility?: 'public' | 'private';
  privacySettings?: UserPrivacySettings;
  privacy?: any;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface VerificationDocument {
  id: string;
  name: string;
  type: 'nida' | 'passport' | 'voter_id' | 'brela_certificate' | 'tra_tin' | 'business_license' | 'tax_clearance' | 'other';
  mimeType: string;
  fileSize: number; // in bytes
  uploadedAt: string;
  docReference?: string;
  verified?: boolean;
  dataUrl?: string;
  fileDataUrl?: string;
  fileName?: string;
  documentType?: string;
}

export type SecureDocument = VerificationDocument;

export interface CreatorApplication {
  id: string;
  userId: string;
  userName: string;
  userUsername: string;
  userAvatar: string;
  category: string;
  experience: string;
  portfolioUrl?: string;
  reasons: string;
  status: 'pending' | 'approved' | 'rejected' | 'more_info_requested' | 'suspended';
  appliedAt: string;
  createdAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  infoRequestedNote?: string;
  documents?: VerificationDocument[];
}

export interface BusinessApplication {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  companyName: string;
  category: string;
  phone: string;
  email: string;
  location: string;
  tin?: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'more_info_requested' | 'suspended';
  appliedAt: string;
  createdAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  infoRequestedNote?: string;
  documents?: VerificationDocument[];
}

export interface CompanyApplication {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  companyName: string;
  registrationNumber: string; // BRELA
  tin: string; // TRA TIN
  industry: string;
  phone: string;
  email: string;
  address: string;
  website?: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'more_info_requested' | 'suspended';
  appliedAt: string;
  createdAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  infoRequestedNote?: string;
  documents?: VerificationDocument[];
}

export interface RvcDepositRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userAvatar?: string;
  amount: number; // TZS / RVC
  paymentMethod: 'M-Pesa' | 'Airtel Money' | 'Mixx by Yas' | 'HaloPesa' | string;
  paymentReference: string;
  status: 'pending' | 'pending_verification' | 'approved' | 'rejected' | 'refunded' | string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  transactionId?: string;
  createdAt?: string;
  processedAt?: string;
  processedBy?: string;
  transactionReference?: string;
  phoneNumber?: string;
  senderName?: string;
  userRaviniId?: string;
  previousBalance?: number;
  amountAdded?: number;
  newBalance?: number;
  whatsappReference?: string;
  notes?: string;
  creditedAt?: string;
  creditedBy?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  target?: string;
  targetId?: string;
  details: string;
  permissionUsed?: string;
  timestamp: string;
}

export type VerificationRequestType = 'creator' | 'business' | 'company' | 'trust_badge';

export interface UnifiedVerificationRequest {
  id: string;
  requestType: VerificationRequestType;
  userId: string;
  userName: string;
  userUsername: string;
  userAvatar: string;
  raviniId: string;
  accountType: string;
  submissionDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'more_info_requested' | 'suspended';
  details: Record<string, any>;
  documents: VerificationDocument[];
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  infoRequestedNote?: string;
}

export interface PaymentConfig {
  // WhatsApp Configuration (Configurable by Super Admin ONLY)
  whatsappNumber: string; // e.g., '+255748604483'
  whatsappDisplayName: string; // e.g., 'RAVINI Payment Desk'
  paymentInstructions: string; // General instructions
  paymentReferenceInstructions: string; // Instructions for sending payment reference
  minTopUpAmount: number; // e.g. 1000
  maxTopUpAmount: number; // e.g. 5000000
  isActive: boolean; // active/inactive status
  availableMethods?: string[];

  // Mobile Network Manual Payment Instructions
  mpesaNumber: string;
  mpesaName: string;
  airtelNumber: string;
  airtelName: string;
  mixxNumber: string;
  mixxName: string;
  haloPesaNumber: string;
  haloPesaName: string;
  conversionRate: number; // 1 RVC = 1 TZS

  updatedAt?: string;
  updatedBy?: string;
}

export interface CreditBundle {
  credits: number;
  priceTzs: number;
  label: string;
  popular?: boolean;
}

export interface CreditConfig {
  postPriceCredits: number; // default: 1
  videoPriceCredits: number; // default: 2
  moviePriceCredits: number; // default: 3
  bundles: CreditBundle[];
  pricePerCreditTzs: number; // default: 100 TZS per Credit
  minCustomCredits: number; // default: 10
  maxCustomCredits: number; // default: 50000
  whatsappNumber: string; // default: '255748604483'
  whatsappDisplayName: string; // default: 'RAVINI COMPANY LIMITED (Manager)'
  updatedAt?: string;
  updatedBy?: string;
}

export interface PostReaction {
  userId: string;
  userName: string;
  userAvatar: string;
  type: ReactionType;
  createdAt: string;
}

export type ReportTargetType = 'post' | 'comment';
export type ReportCategory = 
  | 'abusive' // Matusi / Abusive
  | 'harassment' // Usumbufu / Harassment
  | 'threat' // Vitisho / Threat
  | 'hate_speech' // Chuki / Hate Speech
  | 'spam' // Ujumbe Taka / Spam
  | 'fake_scam' // Utapeli / Fake / Scam
  | 'inappropriate' // Maudhui Yasiyofaa / Inappropriate
  | 'other'; // Nyinginezo

export type ModerationStatus = 'pending' | 'under_review' | 'action_taken' | 'dismissed';

export interface ContentReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  postId: string;
  reporterId: string;
  reporterName: string;
  reporterAvatar?: string;
  category: ReportCategory;
  reason: string;
  reportedContentSnippet?: string;
  targetOwnerId: string;
  targetOwnerName: string;
  status: ModerationStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  actionTaken?: 'none' | 'removed' | 'restricted' | 'dismissed' | 'restored';
  moderationNotes?: string;
}

export interface ModerationHistoryItem {
  action: string;
  moderatorId: string;
  moderatorName: string;
  moderatorRole: string;
  reason: string;
  timestamp: string;
  previousStatus?: string;
  resultingStatus?: string;
}

export interface CommentModerationHistoryItem {
  commentId: string;
  postId: string;
  commentOwnerId: string;
  moderatorId: string;
  moderatorRole: string;
  reason: string;
  timestamp: string;
  previousStatus: string;
  newStatus: string;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  authorId?: string;
  userName: string;
  userAvatar: string;
  userVerified?: boolean;
  content: string;
  createdAt: string;
  likesCount: number;
  likedBy?: string[];
  isRemoved?: boolean;
  removedAt?: string;
  removedBy?: string;
  removedByRole?: string;
  removeReason?: string;
  isRestricted?: boolean;
  moderationStatus?: 'normal' | 'reported' | 'removed';
  moderationHistory?: CommentModerationHistoryItem[];
}

export interface RaviniSound {
  id: string;
  title: string;
  artist: string;
  category: 'all' | 'bongo_flava' | 'afrobeat' | 'amapiano' | 'acoustic' | 'cinematic' | 'chill' | 'device';
  audioUrl: string;
  coverUrl: string;
  duration: number; // in seconds
  language?: string;
  country?: string;
  isActive: boolean;
  usageCount: number;
  license: string;
  createdAt: string;
  uploaderId?: string;
}

export interface Post {
  id: string;
  authorId: string;
  ownerId?: string; // Canonical alias for authorId (authorId === ownerId)
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  authorVerified?: boolean;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'clip';
  isMuted?: boolean;
  mediaFilter?: string;
  mediaDuration?: number;
  aspectRatio?: 'original' | '1:1' | '4:5' | '9:16' | '16:9';
  feeling?: string;
  location?: string;
  privacy: 'public' | 'followers' | 'only_me';
  createdAt: string;
  reactions: Record<string, ReactionType>; // userId -> reactionType
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  isDeleted?: boolean; // Soft deletion for trash & restore
  deletedAt?: string;
  deletedBy?: string;
  deleteReason?: string;
  // Post Management & Moderation
  commentsDisabled?: boolean; // Turn comments ON/OFF
  isArchived?: boolean; // User archive/hide option
  archivedAt?: string;
  moderationStatus?: 'normal' | 'reported' | 'under_review' | 'restricted' | 'removed';
  restrictedReason?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  moderationHistory?: ModerationHistoryItem[];
  allowDownload?: boolean; // Creator/owner permission to allow or disable downloads
  allowShare?: boolean; // Permission to allow or disable sharing
  // Sound / Audio Mixing Metadata
  soundId?: string;
  soundTitle?: string;
  soundArtist?: string;
  soundCoverUrl?: string;
  soundAudioUrl?: string;
  soundDuration?: number;
  originalAudioVolume?: number; // 0 to 100
  musicVolume?: number; // 0 to 100
  musicStartTime?: number; // seconds offset in video
  musicTrimStart?: number; // seconds start in audio track
  musicTrimEnd?: number; // seconds end in audio track
  mediaProcessingStatus?: 'none' | 'processing' | 'completed' | 'failed';
  originalMediaUrl?: string;
  processedMediaUrl?: string;
  isSlideshow?: boolean;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  caption?: string;
  createdAt: string;
  expiresAt: string;
  viewsCount: number;
  allowDownload?: boolean;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type ChatMediaType = 'image' | 'video' | 'voice' | 'file' | 'location' | 'contact' | 'item' | 'sticker';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  conversationId?: string;
  groupId?: string;
  content: string;
  createdAt: string;
  read: boolean;
  isRead?: boolean;
  status?: MessageStatus;
  deliveredAt?: string;
  isDelivered?: boolean;
  readAt?: string;
  mediaUrl?: string;
  mediaType?: ChatMediaType;
  mediaName?: string;
  mediaSize?: number;
  itemId?: string;
  allowDownload?: boolean;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contact?: {
    name: string;
    phone: string;
    email?: string;
    raviniId?: string;
    avatar?: string;
    userId?: string;
  };
  replyTo?: {
    id: string;
    content: string;
    senderId?: string;
    senderName?: string;
    mediaType?: string;
  };
  forwarded?: boolean;
  forwardedFrom?: string;
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedFor?: string[];
  isPinned?: boolean;
  pinnedAt?: string;
  pinnedBy?: string;
  reactions?: Record<string, string[]>; // emoji -> list of userIds
  idempotencyKey?: string;
}

export interface ChatConversation {
  id: string;
  type: 'direct' | 'group';
  participantIds: string[];
  lastMessage?: ChatMessage;
  lastMessageText?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  isGroup?: boolean;
  unreadCounts: Record<string, number>;
  pinnedByUserIds?: string[];
  archivedByUserIds?: string[];
  mutedByUserIds?: string[];
  name?: string;
  groupName?: string;
  participantNames?: Record<string, string>;
  participantAvatars?: Record<string, string>;
  groupPhoto?: string;
  groupDescription?: string;
  groupAdminIds?: string[];
  groupCreatedBy?: string;
  onlyAdminsCanPost?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRaviniId?: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  initialMessage: string;
  previewMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatPrivacySettings {
  userId: string;
  whoCanMessageMe: 'everyone' | 'friends_only' | 'followers_only' | 'nobody';
  whoCanCallMe: 'everyone' | 'friends_only' | 'followers_only' | 'nobody';
  showReadReceipts: boolean;
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  screenshotProtection: boolean;
  blockedUserIds: string[];
  updatedAt: string;
}

export interface UserPrivacySettings {
  userId: string;
  accountVisibility: 'public' | 'private'; // public vs private account
  whoCanFollowMe: 'everyone' | 'request'; // everyone vs manual approval
  whoCanMessageMe: 'everyone' | 'followers_only' | 'friends_only' | 'nobody';
  whoCanCallMe?: 'everyone' | 'followers_only' | 'friends_only' | 'nobody';
  whoCanComment: 'everyone' | 'followers_only' | 'nobody';
  whoCanMentionMe: 'everyone' | 'followers_only' | 'nobody';
  whoCanTagMe: 'everyone' | 'followers_only' | 'nobody';
  whoCanSeePosts: 'public' | 'followers_only' | 'only_me';
  whoCanSeeFollowList: 'everyone' | 'followers_only' | 'only_me';
  showLastSeen: boolean;
  showOnlineStatus: boolean;
  showReadReceipts: boolean;
  allowDownloads: boolean;
  screenshotProtection: boolean;
  blockedUserIds: string[];
  updatedAt: string;
}

export interface FollowRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatar?: string;
  senderRaviniId?: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CallSession {
  id: string;
  type: 'voice' | 'video';
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  groupId?: string;
  status: 'ringing' | 'connected' | 'busy' | 'declined' | 'missed' | 'ended' | 'failed';
  startedAt: string;
  createdAt?: string;
  connectedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  stunTurnConfigured?: boolean;
}

export interface MarketItem {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerPhone: string;
  title: string;
  price: number; // in TZS
  currency: string;
  category: 'electronics' | 'vehicles' | 'property' | 'fashion' | 'services' | 'other';
  location: string;
  imageUrl: string;
  description: string;
  createdAt: string;
  condition: 'new' | 'used';
  sharesCount?: number;
  allowDownload?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  itemType?: 'product' | 'movie' | 'winga' | 'fundi';
  movieDetails?: {
    duration?: string;
    genre?: string;
    streamUrl?: string;
    director?: string;
    releaseYear?: number;
    trailerUrl?: string;
    isFeatured?: boolean;
    rating?: string;
  };
  wingaDetails?: {
    commissionRate?: string;
    listingType?: string;
    verifiedBroker?: boolean;
  };
  fundiDetails?: {
    serviceCategory?: string;
    experienceYears?: number;
    availableForHire?: boolean;
    hourlyRate?: number;
    rating?: number;
  };
}

export interface SystemSettings {
  allowRegistrations: boolean;
  allowMarketPosting: boolean;
  allowRvcDeposits: boolean;
  allowStories: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  allowedRegistration?: boolean;
  requirePhoneVerification?: boolean;
  requireEmailVerification?: boolean;
  maxUploadSizeMB?: number;
  minDepositRvc?: number;
  maxDepositRvc?: number;
  minWithdrawRvc?: number;
  maxWithdrawRvc?: number;
  systemNotice?: string;
  showSystemNotice?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface UserSession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export type NotificationType = 
  | 'like' 
  | 'comment' 
  | 'reaction' 
  | 'share' 
  | 'mention' 
  | 'follow' 
  | 'friend_request' 
  | 'friend_accepted' 
  | 'message' 
  | 'message_request' 
  | 'voice_call' 
  | 'video_call' 
  | 'order' 
  | 'order_status' 
  | 'delivery' 
  | 'wallet' 
  | 'rvc_transaction' 
  | 'tip' 
  | 'premium' 
  | 'viral_campaign' 
  | 'creator_status' 
  | 'creator_earnings' 
  | 'business_status' 
  | 'company_status' 
  | 'security_alert' 
  | 'account_status' 
  | 'password_reset' 
  | 'announcement'
  | 'verification'
  | 'ad_campaign';

export interface NotificationItem {
  id: string;
  userId: string; // receiver
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  type: NotificationType;
  title?: string;
  titleSw?: string;
  titleEn?: string;
  message: string;
  messageSw?: string;
  messageEn?: string;
  targetId?: string;
  actionUrl?: string;
  targetTab?: MainTabType;
  targetSubTab?: string;
  read: boolean;
  archived?: boolean;
  isCriticalSecurity?: boolean;
  priority?: 'normal' | 'urgent' | 'critical';
  createdAt: string;
  readAt?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'expired' | 'ordered' | 'in_transit' | 'delivered' | 'refunded';
export type PaymentStatus = 'unpaid' | 'pending_verification' | 'approved' | 'rejected' | 'refunded';

export interface MarketOrder {
  id: string;
  itemId: string;
  itemTitle: string;
  itemImage: string;
  itemPrice: number;
  quantity: number;
  totalAmount: number; // in TZS / RVC
  commissionRate: number; // 0.05 (5% platform fee to RAVINI COMPANY LIMITED)
  platformCommission: number; // 5%
  sellerEarnings: number; // 95%
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  status: 'ordered' | 'in_transit' | 'delivered' | 'refunded' | 'cancelled';
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  trackingNumber: string; // e.g. RV-DLV-74921
  createdAt: string;
  updatedAt: string;
  refundReason?: string;
  refundedAt?: string;
}

export interface TrustVerificationApplication {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userPhone?: string;
  badgeType: 'blue' | 'gold';
  nationalIdNumber?: string;
  businessRegistrationNumber?: string;
  documentType: 'nida' | 'passport' | 'voter' | 'brela_tin';
  documentUrl?: string;
  documents?: VerificationDocument[];
  status: 'pending' | 'verified' | 'rejected' | 'more_info_requested' | 'suspended';
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  infoRequestedNote?: string;
}

export interface CreatorSubscription {
  id: string;
  creatorId: string;
  subscriberId: string;
  subscriberName: string;
  subscriberAvatar: string;
  tier: 'bronze' | 'silver' | 'gold';
  amountRvc: number;
  status: 'active' | 'cancelled';
  expiresAt: string;
  createdAt: string;
}

export interface CreatorTip {
  id: string;
  creatorId: string;
  tipperId: string;
  tipperName: string;
  tipperAvatar: string;
  amountRvc: number;
  message?: string;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  senderId?: string;
  senderName?: string;
  userRaviniId?: string;
  recipientId?: string;
  recipientName?: string;
  recipientRaviniId?: string;
  currency?: string;
  paymentMethod?: string;
  type: 'credit' | 'debit' | 'transfer' | 'topup' | 'payment' | 'refund' | 'deposit' | 'creator_tip' | 'subscription_income' | 'market_sale' | 'transfer_in' | 'transfer_out' | 'MANUAL_TOP_UP' | 'POST_DEDUCTION' | 'VIDEO_DEDUCTION' | 'MOVIE_DEDUCTION' | 'ADMIN_ADJUSTMENT' | string;
  amount: number; // TZS / RVC / Credits
  description: string;
  createdAt: string;
  timestamp?: string;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
  idempotencyKey?: string;
  actorId?: string;
  balanceBefore?: number;
  balanceAfter?: number;
}

export interface PushViralPackage {
  id: string;
  name: string;
  nameEn?: string;
  priceRvc: number;
  priceTzs?: number;
  durationDays: number;
  reachEstimate?: string;
  targetViewsEstimate?: string;
  description: string;
  descriptionEn?: string;
  guaranteedPushBadge?: boolean;
  priorityRanking?: number;
  isPopular?: boolean;
}

export interface PushViralCampaign {
  id: string;
  userId: string;
  contentId: string;
  contentType: 'post' | 'video' | 'clip';
  packageId: string;
  packageName: string;
  amountRvc: number;
  status: 'active' | 'completed' | 'pending';
  startedAt: string;
  expiresAt: string;
  viewsCount: number;
  clicksCount: number;
}

export interface PremiumPackage {
  id: string;
  name?: string;
  titleSw?: string;
  titleEn?: string;
  descSw?: string;
  priceRvc: number;
  durationMonths: number;
  benefits?: string[];
  isActive?: boolean;
  isPopular?: boolean;
}

export interface OfficialAd {
  id: string;
  title: string;
  companyName: string;
  advertiser?: string;
  body: string;
  description?: string;
  mediaUrl?: string;
  imageUrl?: string;
  ctaText: string;
  ctaLink: string;
  targetUrl?: string;
  callToAction?: string;
  status: 'active' | 'paused';
  createdAt: string;
  viewsCount: number;
  impressions?: number;
  clicksCount: number;
  clicks?: number;
  adType?: AdType;
  campaignId?: string;
}

// ----------------- RAVINI ADS & REVENUE TYPES -----------------

export type AdType = 
  | 'sponsored_post' 
  | 'sponsored_video' 
  | 'sponsored_clip' 
  | 'sponsored_product' 
  | 'sponsored_business' 
  | 'banner' 
  | 'feed_ad';

export type AdPlacement = 'feed' | 'video_feed' | 'clips_feed' | 'market' | 'banner' | 'all';

export type AdCampaignStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'active' 
  | 'paused' 
  | 'rejected' 
  | 'completed' 
  | 'cancelled';

export interface AdTargeting {
  countries: string[];
  regions: string[];
  cities?: string[];
  languages: string[];
  userTypes: ('all' | 'user' | 'creator' | 'business' | 'company')[];
  interests: string[];
  ageGroups?: string[];
  gender?: string;
}

export interface AdCampaign {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRaviniId: string;
  userRole: UserRole;
  companyName?: string;
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
  totalBudgetRvc?: number;
  dailyBudgetRvc: number;
  spentRvc: number;
  status: AdCampaignStatus;
  rejectionReason?: string;
  adminNotes?: string;
  isPaid: boolean;
  paymentTransactionId?: string;
  idempotencyKey?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  startedAt?: string;
  scheduledStartDate?: string;
  expiresAt?: string;
  impressions: number;
  views: number;
  clicks: number;
  shares: number;
  engagement: number;
  remainingBudgetRvc?: number;
  startDate?: string;
  endDate?: string;
  impressionsCount?: number;
  clicksCount?: number;
  ctrPercent?: number;
  maxDailyImpressions?: number;
}

export interface CompanyLedgerTransaction {
  id: string;
  userId: string;
  userRaviniId: string;
  userName: string;
  service: 'ads' | 'push_viral' | 'premium' | 'market_commission' | 'wallet_topup' | 'refund' | 'other';
  amount: number; // in RVC
  currency: 'RVC';
  type: 'income' | 'refund' | 'commission' | 'escrow_hold' | 'escrow_release';
  status: 'completed' | 'pending' | 'refunded' | 'failed';
  description?: string;
  createdAt?: string;
  timestamp: string;
  reference: string;
  relatedId?: string;
  relatedType?: 'campaign' | 'order' | 'subscription' | 'ad' | 'manual';
  refundStatus?: 'none' | 'requested' | 'approved' | 'rejected' | 'completed';
  refundReason?: string;
  refundId?: string;
  idempotencyKey?: string;
}

export interface RefundRecord {
  id: string;
  transactionId: string;
  userId: string;
  userRaviniId: string;
  userName: string;
  service: string;
  amountRvc: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNote?: string;
}

export interface PlatformPricingConfig {
  adPricing: {
    sponsoredPostPerDay: number;
    sponsoredVideoPerDay: number;
    sponsoredClipPerDay: number;
    sponsoredProductPerDay: number;
    sponsoredBusinessPerDay: number;
    bannerPerDay: number;
    feedAdPerDay: number;
    cpmRate: number;
    minimumBudgetRvc: number;
  };
  premiumPricing: {
    monthlyRvc: number;
    quarterlyRvc: number;
    annualRvc: number;
  };
  pushViralPackages: PushViralPackage[];
  marketCommissionRate: number; // 0.05
  updatedAt: string;
  updatedBy: string;
}

export interface RevenueSummary {
  grossRevenueRvc: number;
  refundsRvc: number;
  netRevenueRvc: number;
  rvcReceived: number;
  rvcSpent: number;
  pendingRevenueRvc: number;
  completedRevenueRvc: number;
  byService: {
    premium: number;
    pushViral: number;
    ads: number;
    marketCommissions: number;
    other: number;
  };
  companyBalanceRvc: number; // RAVINI COMPANY LIMITED true earnings
  creatorEarningsPoolRvc: number; // Distinct creator pool
  sellerBalancesTotalRvc: number; // Distinct seller funds in escrow/wallet
  customerBalancesTotalRvc: number; // Distinct user-held RVC in wallets
}

export interface DailyReportData {
  id: string;
  date: string;
  period: 'today' | 'yesterday' | '7days' | '30days' | 'custom' | string;
  newUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  logins: number;
  failedLogins: number;
  friendRequests: number;
  newFriends: number;
  posts: number;
  videos: number;
  clips: number;
  liveSessions: number;
  messages: number;
  likes: number;
  comments: number;
  shares: number;
  marketOrders: number;
  marketSalesRvc: number;
  rvcTransactions: number;
  rvcPurchasedRvc: number;
  rvcUsedRvc: number;
  pushViralCampaigns: number;
  premiumPurchases: number;
  creatorActivity: number;
  creatorEarningsRvc: number;
  businessActivity: number;
  companyActivity: number;
  reportsComplaints: number;
  securityEvents: number;
  adminActivity: number;
  adminActivityCount?: number;
  companyRevenueRvc: number;
  refundsRvc: number;
  netRevenueRvc: number;
  generatedAt: string;
  users?: {
    total: number;
    newRegistered: number;
    active: number;
    suspended: number;
  };
  market?: {
    totalItems: number;
    newItems: number;
    orders: number;
  };
  rvc?: {
    totalPurchased: number;
    totalUsed: number;
    netCirculation: number;
  };
  campaigns?: {
    activeOfficialAds: number;
    totalSponsoredPosts: number;
    impressionsDelivered: number;
  };
  revenue?: {
    totalTzs: number;
    adsRevenueTzs: number;
    commissionTzs: number;
    rvcDepositsTzs: number;
  };
  refunds?: {
    requestsCount: number;
    approvedCount: number;
    rejectedCount: number;
    amountTotal: number;
  };
  postsSummary?: {
    total: number;
    newPosts: number;
    videos: number;
    clips: number;
    likes: number;
    shares: number;
    comments: number;
  };
  messagesSummary?: {
    totalSent: number;
    activeConversations?: number;
    callSessions?: number;
  };
  communicationControl?: any;
}

export type MainTabType = 
  | 'feed'         // 🏠 Home
  | 'files'        // 📁 Files / Services (Grid Cards)
  | 'people'       // 👥 People (Following, Followers, Discovery)
  | 'following'    // 👥 Following & Followers
  | 'friends'      // Deprecated alias to following/people
  | 'social'       // Traditional Social post browsing experience
  | 'chat'         // 💬 Chat
  | 'dashboard'    // ☰ Dashboard
  | 'movies'       // 🎬 Movies (Entertainment content & Fullscreen Player)
  | 'winga'        // 🤝 Mawinga / Madalali (Commission Listings)
  | 'mafundi'      // 🛠️ Mafundi & Watoa Huduma (Service Providers)
  // Dashboard Hub sub-modules:
  | 'profile'
  | 'location'
  | 'wallet'
  | 'market'
  | 'creator'
  | 'business'
  | 'company'
  | 'notifications'
  | 'settings'
  | 'support'
  | 'ai'
  | 'premium'
  | 'ads'
  | 'push_viral'
  | 'security'
  | 'ravini_id'
  | 'verification'
  | 'admin'
  | 'stories';

// ----------------- GLOBAL COMMUNICATION CONTROL & SHARING -----------------

export interface GlobalCommunicationServiceControl {
  chat: boolean;          // Chat / Messages
  voiceCalls: boolean;    // Voice Calls
  videoCalls: boolean;    // Video Calls
  groupChat: boolean;     // Group Chat
  messageRequests: boolean; // Message Requests
  mediaSharing: boolean;  // Media Sharing
}

export interface TemporaryCommunicationBlock {
  isActive: boolean;
  startDate: string; // ISO String
  endDate?: string;  // ISO String
  reason: string;
  affectedServices: (keyof GlobalCommunicationServiceControl)[];
  targetScope: 'all' | 'customer' | 'creator' | 'business' | 'user';
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface GlobalCommunicationSettings {
  allEnabled: boolean;
  services: GlobalCommunicationServiceControl;
  targetScope: 'all' | 'customer' | 'creator' | 'business' | 'user';
  temporaryBlock?: TemporaryCommunicationBlock;
  updatedAt: string;
  updatedBy: string;
  updatedByName: string;
}

export interface SharePayload {
  type: 'post' | 'photo' | 'video' | 'clip' | 'profile' | 'market' | 'link' | 'official';
  id: string;
  title: string;
  text?: string;
  mediaUrl?: string;
  url?: string;
  authorName?: string;
  authorId?: string;
  privacy?: 'public' | 'followers' | 'friends' | 'only_me';
  allowShare?: boolean;
}

export interface DownloadItem {
  type: 'photo' | 'video' | 'clip' | 'document' | 'market' | 'chat_attachment';
  category?: string;
  id: string;
  title: string;
  mediaUrl: string;
  url?: string;
  fileSize?: string | number;
  authorId?: string;
  authorName?: string;
  allowDownload?: boolean;
  downloadDate?: string;
}

// ----------------- NOTIFICATION PREFERENCES & SYSTEM ANNOUNCEMENTS -----------------

export interface PushDeviceToken {
  deviceId: string;
  deviceName: string;
  browser: string;
  token: string;
  registeredAt: string;
  lastActive: string;
}

export interface NotificationPreferences {
  messages: boolean;
  calls: boolean;
  friends: boolean;
  followers: boolean;
  likes: boolean;
  comments: boolean;
  shares: boolean;
  market: boolean;
  creator: boolean;
  business: boolean;
  company: boolean;
  premium: boolean;
  security: boolean; // LOCKED to true (critical alerts cannot be disabled)
  announcements: boolean;
  pushEnabled: boolean;
  pushDevices: PushDeviceToken[];
  inAppEnabled?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  socialRequests?: boolean;
  activityLikesComments?: boolean;
  chatMessagesCalls?: boolean;
  marketOrdersDelivery?: boolean;
  walletTransactions?: boolean;
  officialAnnouncements?: boolean;
  creatorUpdates?: boolean;
  securityAlerts?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  updatedAt?: string;
}

export type AnnouncementPriority = 'normal' | 'urgent' | 'critical';
export type AnnouncementTargetAudience = 'all' | 'customer' | 'creator' | 'business' | 'company' | 'employee' | 'admin';
export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'disabled' | 'expired';

export interface SystemAnnouncement {
  id: string;
  title: string;
  titleSw?: string;
  titleEn?: string;
  message: string;
  messageSw?: string;
  messageEn?: string;
  mediaUrl?: string;
  language: 'all' | 'sw' | 'en';
  priority: AnnouncementPriority;
  targetAudience: AnnouncementTargetAudience;
  startDate: string; // ISO
  endDate?: string;  // ISO
  status: AnnouncementStatus;
  createdById: string;
  createdByName: string;
  createdAt: string;
  publishedAt?: string;
  updatedAt?: string;
  disabledAt?: string;
  expiredAt?: string;
  impressionsCount: number;
  readsCount: number;
  readByUserIds: string[];
}

export interface AuthoritativeLedgers {
  customerRvcWalletTotal: number;
  pendingEscrowFundsTotal: number;
  creatorEarningsTotal: number;
  sellerFundsTotal: number;
  refundsTotal: number;
  companyRevenueTotal: number;
  platformCostsTotal: number;
  reconciliationTimestamp: string;
  isBalanced: boolean;
  variance: number;
  totalRevenueTzs?: number;
  totalAdsRevenueTzs?: number;
  totalCommissionEarnedTzs?: number;
  totalRvcDepositsTzs?: number;
  activeLedgerTransactionsCount?: number;
  lastAuditedAt?: string;
}

export interface SystemPersistenceStatus {
  activeDataStore: 'file_json' | 'sqlite' | 'postgres' | 'firestore';
  dbStatus: 'PASS' | 'PARTIAL' | 'BLOCKED';
  persistenceFilePath: string;
  externalGatewayStatus: 'BLOCKED_NOT_CONFIGURED' | 'ACTIVE';
  lastPersistedAt: string;
  totalUsers: number;
  totalTransactions: number;
  totalCampaigns: number;
  totalRefunds: number;
  totalAuditLogs: number;
  engine?: string;
  filePath?: string;
  fileSizeBytes?: number;
  entitiesCount?: {
    users: number;
    messages: number;
    conversations: number;
    transactions: number;
    posts: number;
    marketItems: number;
    adCampaigns: number;
    companyLedger: number;
    auditLogs: number;
    refunds?: number;
    rvcRequests?: number;
    messageRequests?: number;
    callSessions?: number;
  };
  syncIntervalMs?: number;
  isHealthy?: boolean;
}


