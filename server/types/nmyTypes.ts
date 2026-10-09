export type NmyUserRole = 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN' | 'SUPER_ADMIN_OPERATIONS';
export type NmyUserStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'MARKED_FOR_DELETION' | 'DELETED';

export interface NmyUser {
  id: string;
  phone: string; // Canonical 255XXXXXXXXX
  fullName: string;
  password: string; // bcrypt hash
  role: NmyUserRole;
  status: NmyUserStatus;
  departmentId?: string;
  permissions: string[];
  language: 'sw' | 'en';
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  markedForDeletionAt?: string;
  scheduledPermanentDeletionAt?: string;
  deletionInitiatedBy?: string;
  failedLoginAttempts?: number;
  lockLevel?: number;
  lockedUntil?: string;
  lockReason?: string;
}

export interface NmySession {
  id: string;
  token: string;
  userId: string;
  role: NmyUserRole;
  deviceName: string;
  ip: string;
  createdAt: string;
  expiresAt: string;
  isRevoked: boolean;
  revokeReason?: string;
}

export interface NmyTermsVersion {
  version: string;
  content: string;
  updatedAt: string;
}

export interface NmyTermsAcceptance {
  userId: string;
  termsVersion: string;
  acceptedAt: string;
}

export interface NmyService {
  id: string;
  code: string;
  name: string;
  description: string;
  priceTzs: number;
  isActive: boolean;
  inputRequirement: string;
  resultType: string;
  departmentId?: string;
  updatedAt: string;
}

export interface NmyCreditAccount {
  userId: string;
  balanceTzs: number;
  updatedAt: string;
}

export type NmyCreditLedgerType = 'ADD' | 'CHARGE' | 'REFUND' | 'ADJUSTMENT';

export interface NmyCreditLedgerEntry {
  id: string;
  userId: string;
  type: NmyCreditLedgerType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  requestId?: string;
  actorId: string;
  actorName: string;
  actorRole: NmyUserRole;
  reason: string;
  reference: string;
  timestamp: string;
}

export interface NmyAdminWorkCreditAccount {
  workerId: string;
  balanceTzs: number;
  updatedAt: string;
}

export interface NmyAdminWorkCreditLedgerEntry {
  id: string;
  workerId: string;
  adminId?: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  requestId: string;
  actorId: string;
  actorName: string;
  actorRole: 'ADMIN';
  reason: string;
  reference: string;
  timestamp: string;
}

export interface NmySuperAdminWorkCreditAccount {
  superAdminId: string;
  balanceTzs: number;
  updatedAt: string;
}

export interface NmySuperAdminWorkCreditLedgerEntry {
  id: string;
  superAdminId: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  requestId: string;
  actorId: string;
  actorName: string;
  actorRole: 'SUPER_ADMIN';
  reason: string;
  reference: string;
  timestamp: string;
}

export type NmyRequestStatus = 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface NmyRequest {
  id: string; // NMY-YYYYMMDD-XXXXXX
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  targetPhoneNumber: string; // 10 digits starting with 0
  chargedPriceTzs: number; // Snapshot of price at creation
  status: NmyRequestStatus;
  claimedByWorkerId?: string;
  claimedByWorkerName?: string;
  claimedByWorkerRole?: NmyUserRole;
  claimedAt?: string;
  completedAt?: string;
  nidaResult?: string; // 20 digits
  rejectedAt?: string;
  rejectionReason?: string;
  refundStatus?: 'NONE' | 'REFUNDED';
  refundedAt?: string;
  isDeletedByCustomer?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NmyRequestEvent {
  id: string;
  requestId: string;
  eventType: string;
  actorId: string;
  actorName: string;
  actorRole: NmyUserRole;
  details: string;
  timestamp: string;
}

export type NmyCreditRequestStatus = 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';

export interface NmyCreditRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  amountTzs: number;
  paymentMethod: string;
  paymentReference: string;
  proofImageUrl?: string;
  status: NmyCreditRequestStatus;
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface NmyNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'REQUEST' | 'CREDIT' | 'ANNOUNCEMENT' | 'SECURITY' | 'SYSTEM';
  read: boolean;
  relatedId?: string;
  createdAt: string;
}

export interface NmyAnnouncement {
  id: string;
  title: string;
  message: string;
  targetType: 'ALL' | 'ALL_CUSTOMERS' | 'ALL_ADMINS' | 'SPECIFIC_USER' | 'CUSTOM_GROUP';
  targetUserId?: string;
  createdById: string;
  createdByName: string;
  recipientCount: number;
  isActive?: boolean;
  createdAt: string;
}

export type NmyAdMediaType = 'VIDEO' | 'IMAGE' | 'TEXT';

export interface NmyAdvertisement {
  id: string;
  type: NmyAdMediaType;
  title: string;
  description: string;
  mediaUrl?: string; // Persistent URL, data URL or /api/files/:id
  coverUrl?: string; // Optional cover / thumbnail image
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface NmyDepartment {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  adminIds: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NmyFile {
  id: string;
  userId?: string;
  ownerId?: string;
  ownerRole?: NmyUserRole;
  requestId?: string;
  type?: string;
  filename?: string;
  fileName?: string;
  fileType?: string;
  fileUrl: string;
  fileSize?: number;
  sizeBytes?: number;
  checksum?: string;
  storageBucket?: string;
  isPrivate?: boolean;
  mimeType?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
  accessibleByRoles?: NmyUserRole[];
  accessibleByDepartments?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface NmyAuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: NmyUserRole;
  action: string;
  target: string;
  targetId?: string;
  details: string;
  ip?: string;
  timestamp: string;
}

export interface NmyPaymentMethod {
  id: string;
  name: string;
  accountNumber: string;
  accountName: string;
  instructions: string;
  isActive: boolean;
}

export interface NmySettings {
  platformName: string;
  companyName: string;
  publicRegistrationOpen: boolean;
  appAccessOpen: boolean;
  requestTimeoutMinutes: number;
  supportPhone: string;
  whatsappNumber: string;
  paymentInstructions: string;
  paymentMethods: NmyPaymentMethod[];
  servicePriceTzs: number;
  emergencyLockActive?: boolean;
  emergencyLockReason?: string;
  sessionTimeoutEnabled?: boolean;
  sessionTimeoutMinutes?: number;
  maxConcurrentDevicesCustomer?: number;
  maxConcurrentDevicesAdmin?: number;
  maxConcurrentDevicesSuperAdmin?: number;
  dataProtectionLocked?: boolean;
}

export interface NmyBackupRecord {
  id: string;
  filename: string;
  filePath: string;
  sizeBytes: number;
  sha256Checksum: string;
  timestamp: string;
  environment: string;
  databaseIdentity: string;
  isVerified: boolean;
  verifiedAt?: string;
  recordCounts: {
    users: number;
    requests: number;
    creditLedger: number;
    creditRequests: number;
    auditLogs: number;
  };
  status: 'VERIFIED' | 'FAILED' | 'PENDING';
  errorDetails?: string;
}

export interface NmyIntegrityReport {
  isHealthy: boolean;
  checkedAt: string;
  totalUsers: number;
  totalRequests: number;
  totalLedgerEntries: number;
  totalCreditRequests: number;
  totalAuditLogs: number;
  discrepancies: Array<{
    type: 'CREDIT_MISMATCH' | 'ORPHAN_REQUEST' | 'DUPLICATE_TRANSACTION' | 'UNRESOLVED_PAYMENT' | 'DATA_LOCK_TRIGGER';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    details?: any;
  }>;
}
