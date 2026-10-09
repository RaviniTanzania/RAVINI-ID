import { pgTable, text, integer, boolean, timestamp, jsonb, serial, uniqueIndex, index } from 'drizzle-orm/pg-core';

// 1. USERS
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  phone: text('phone').notNull().unique(),
  fullName: text('full_name').notNull(),
  password: text('password').notNull(), // bcrypt hash
  role: text('role').notNull().default('CUSTOMER'), // 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN'
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'SUSPENDED' | 'DISABLED'
  departmentId: text('department_id'),
  permissions: jsonb('permissions').$type<string[]>().default([]),
  language: text('language').notNull().default('sw'),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('users_phone_idx').on(table.phone),
  index('users_role_idx').on(table.role),
]);

// 2. SESSIONS
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id),
  role: text('role').notNull(),
  deviceName: text('device_name').notNull(),
  ip: text('ip').notNull(),
  isRevoked: boolean('is_revoked').notNull().default(false),
  revokeReason: text('revoke_reason'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('sessions_token_idx').on(table.token),
  index('sessions_user_id_idx').on(table.userId),
]);

// 3. TERMS VERSIONS
export const termsVersions = pgTable('terms_versions', {
  version: text('version').primaryKey(),
  content: text('content').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 4. TERMS ACCEPTANCES
export const termsAcceptances = pgTable('terms_acceptances', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  termsVersion: text('terms_version').notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('terms_acceptances_user_idx').on(table.userId),
]);

// 5. SERVICES
export const services = pgTable('services', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  priceTzs: integer('price_tzs').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  inputRequirement: text('input_requirement').notNull(),
  resultType: text('result_type').notNull(),
  departmentId: text('department_id'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 6. CREDIT ACCOUNTS (CUSTOMER CREDIT)
export const creditAccounts = pgTable('credit_accounts', {
  userId: text('user_id').primaryKey().references(() => users.id),
  balanceTzs: integer('balance_tzs').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 7. CREDIT LEDGER
export const creditLedger = pgTable('credit_ledger', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // 'ADD' | 'CHARGE' | 'REFUND' | 'ADJUSTMENT'
  amount: integer('amount').notNull(),
  balanceBefore: integer('balance_before').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  requestId: text('request_id'),
  actorId: text('actor_id').notNull(),
  actorName: text('actor_name').notNull(),
  actorRole: text('actor_role').notNull(),
  reason: text('reason').notNull(),
  reference: text('reference').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('credit_ledger_user_idx').on(table.userId),
  index('credit_ledger_request_idx').on(table.requestId),
]);

// 8. ADMIN WORK CREDIT ACCOUNTS
export const adminWorkCreditAccounts = pgTable('admin_work_credit_accounts', {
  adminId: text('admin_id').primaryKey().references(() => users.id),
  balanceTzs: integer('balance_tzs').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 9. ADMIN WORK CREDIT LEDGER
export const adminWorkCreditLedger = pgTable('admin_work_credit_ledger', {
  id: text('id').primaryKey(),
  adminId: text('admin_id').notNull().references(() => users.id),
  type: text('type').notNull(), // 'WORK_EARNING' | 'WITHDRAWAL' | 'ADJUSTMENT'
  amount: integer('amount').notNull(),
  balanceBefore: integer('balance_before').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  requestId: text('request_id'),
  actorId: text('actor_id').notNull(),
  actorName: text('actor_name').notNull(),
  actorRole: text('actor_role').notNull(),
  reason: text('reason').notNull(),
  reference: text('reference').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('admin_work_credit_ledger_admin_idx').on(table.adminId),
]);

// 10. SUPER ADMIN WORK CREDIT ACCOUNTS
export const superAdminWorkCreditAccounts = pgTable('super_admin_work_credit_accounts', {
  superAdminId: text('super_admin_id').primaryKey().references(() => users.id),
  balanceTzs: integer('balance_tzs').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 11. SUPER ADMIN WORK CREDIT LEDGER
export const superAdminWorkCreditLedger = pgTable('super_admin_work_credit_ledger', {
  id: text('id').primaryKey(),
  superAdminId: text('super_admin_id').notNull().references(() => users.id),
  amount: integer('amount').notNull(),
  balanceBefore: integer('balance_before').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  requestId: text('request_id'),
  actorId: text('actor_id').notNull(),
  actorName: text('actor_name').notNull(),
  actorRole: text('actor_role').notNull(),
  reason: text('reason').notNull(),
  reference: text('reference').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('super_admin_work_credit_ledger_admin_idx').on(table.superAdminId),
]);

// 12. REQUESTS (APPLICATIONS)
export const requests = pgTable('requests', {
  id: text('id').primaryKey(), // NMY-YYYYMMDD-XXXXXX
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  serviceId: text('service_id').notNull(),
  serviceCode: text('service_code').notNull(),
  serviceName: text('service_name').notNull(),
  targetPhoneNumber: text('target_phone_number').notNull(),
  chargedPriceTzs: integer('charged_price_tzs').notNull(),
  status: text('status').notNull(), // 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  claimedByWorkerId: text('claimed_by_worker_id'),
  claimedByWorkerName: text('claimed_by_worker_name'),
  claimedByWorkerRole: text('claimed_by_worker_role'),
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  nidaResult: text('nida_result'),
  rejectionReason: text('rejection_reason'),
  refundStatus: text('refund_status').default('NONE'), // 'NONE' | 'REFUNDED'
  refundedAt: timestamp('refunded_at', { withTimezone: true }),
  // Soft-deletion fields for customer self-service safety
  isDeletedByCustomer: boolean('is_deleted_by_customer').notNull().default(false),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: text('deleted_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('requests_customer_id_idx').on(table.customerId),
  index('requests_status_idx').on(table.status),
  index('requests_worker_id_idx').on(table.claimedByWorkerId),
  index('requests_created_at_idx').on(table.createdAt),
]);

// 13. REQUEST EVENTS
export const requestEvents = pgTable('request_events', {
  id: text('id').primaryKey(),
  requestId: text('request_id').notNull().references(() => requests.id),
  eventType: text('event_type').notNull(),
  actorId: text('actor_id').notNull(),
  actorName: text('actor_name').notNull(),
  actorRole: text('actor_role').notNull(),
  details: text('details').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('request_events_request_id_idx').on(table.requestId),
]);

// 14. CREDIT REQUESTS (PAYMENTS SUBMITTED)
export const creditRequests = pgTable('credit_requests', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  amountTzs: integer('amount_tzs').notNull(),
  paymentMethod: text('payment_method').notNull(),
  paymentReference: text('payment_reference').notNull(),
  proofImageUrl: text('proof_image_url'),
  status: text('status').notNull().default('PENDING_VERIFICATION'), // 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED'
  reviewedBy: text('reviewed_by'),
  rejectionReason: text('rejection_reason'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('credit_requests_customer_id_idx').on(table.customerId),
  index('credit_requests_status_idx').on(table.status),
]);

// 15. NOTIFICATIONS
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('INFO'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('notifications_user_id_idx').on(table.userId),
]);

// 16. ANNOUNCEMENTS
export const announcements = pgTable('announcements', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  targetType: text('target_type').notNull().default('ALL'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// 17. DEPARTMENTS
export const departments = pgTable('departments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  permissions: jsonb('permissions').$type<string[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// 18. FILES
export const files = pgTable('files', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  checksum: text('checksum'),
  storageBucket: text('storage_bucket'),
  isPrivate: boolean('is_private').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('files_user_id_idx').on(table.userId),
]);

// 19. AUDIT LOGS
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  actorId: text('actor_id').notNull(),
  actorName: text('actor_name').notNull(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  target: text('target').notNull(),
  targetId: text('target_id'),
  details: text('details').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('audit_logs_actor_idx').on(table.actorId),
  index('audit_logs_action_idx').on(table.action),
  index('audit_logs_timestamp_idx').on(table.timestamp),
]);

// 20. SETTINGS
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 21. ADVERTISEMENTS (MATANGAZO YA VIDEO, PICHA NA MAANDISHI)
export const advertisements = pgTable('advertisements', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'VIDEO' | 'IMAGE' | 'TEXT'
  title: text('title').notNull(),
  description: text('description').notNull(),
  mediaUrl: text('media_url'),
  coverUrl: text('cover_url'),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  createdById: text('created_by_id').notNull(),
  createdByName: text('created_by_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('advertisements_is_active_idx').on(table.isActive),
  index('advertisements_created_at_idx').on(table.createdAt),
]);

// 22. PUSH SUBSCRIPTIONS (MOBILE PUSH NOTIFICATIONS)
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('push_subscriptions_user_idx').on(table.userId),
]);


