export type UserRole = 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';

export type AdminPermission = 
  | 'REVIEW_APPLICATIONS' 
  | 'REVIEW_ADS' 
  | 'REVIEW_MOVIES' 
  | 'MODERATE_CONTENT' 
  | 'VIEW_REPORTS';

export type BusinessCategory = 'fundi' | 'sokoni' | 'movies' | 'winga';

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CleanUser {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  password: string; // bcrypt hash
  role: UserRole;
  businessName?: string;
  businessCategory?: BusinessCategory;
  businessApproved: boolean;
  permissions: AdminPermission[];
  status: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED';
  walletBalance: number;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BusinessApplication {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  category: BusinessCategory;
  businessName: string;
  description: string;
  servicesOrProducts: string;
  contactPhone: string;
  location?: string;
  status: ApplicationStatus;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByRole?: UserRole;
}

export interface SokoniProduct {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
  title: string;
  description: string;
  priceTzs: number;
  category: string;
  images: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface WingaAd {
  id: string;
  wingaId: string;
  wingaName: string;
  wingaPhone: string;
  title: string;
  adType: 'house' | 'vehicle' | 'product' | 'land' | 'service';
  description: string;
  priceTzs: number;
  location: string;
  images: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface MovieItem {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  genre: string;
  durationMinutes: number;
  description: string;
  posterUrl: string;
  videoUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  viewsCount: number;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface FundiListing {
  id: string;
  fundiId: string;
  fundiName: string;
  phone: string;
  serviceType: string;
  skills: string[];
  bio: string;
  location: string;
  rateEstimate?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  userName: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  type: 'MANUAL_TOP_UP' | 'DEDUCTION';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  reason: string;
  relatedAction?: string;
  relatedId?: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  target: string;
  targetId?: string;
  details: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'application' | 'credits' | 'content' | 'system';
  read: boolean;
  createdAt: string;
}

export interface CreditBundle {
  credits: number;
  priceTzs: number;
  label: string;
}

export interface SystemConfig {
  whatsappNumber: string;
  postPriceCredits: number;
  videoPriceCredits: number;
  moviePriceCredits: number;
  creditTzsRate?: number;
  systemOpen?: boolean;
  bundles: CreditBundle[];
  termsAndConditions: string;
  platformName: string;
  companyName: string;
}
