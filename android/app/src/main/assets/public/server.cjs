"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express2 = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_path4 = __toESM(require("path"), 1);
var import_fs4 = __toESM(require("fs"), 1);
var import_vite = require("vite");

// server/routes/nmyApi.ts
var import_express = require("express");
var import_crypto2 = __toESM(require("crypto"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);

// src/db/index.ts
var import_node_postgres = require("drizzle-orm/node-postgres");
var import_pg = require("pg");

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminWorkCreditAccounts: () => adminWorkCreditAccounts,
  adminWorkCreditLedger: () => adminWorkCreditLedger,
  advertisements: () => advertisements,
  announcements: () => announcements,
  auditLogs: () => auditLogs,
  creditAccounts: () => creditAccounts,
  creditLedger: () => creditLedger,
  creditRequests: () => creditRequests,
  departments: () => departments,
  files: () => files,
  notifications: () => notifications,
  pushSubscriptions: () => pushSubscriptions,
  requestEvents: () => requestEvents,
  requests: () => requests,
  services: () => services,
  sessions: () => sessions,
  settings: () => settings,
  superAdminWorkCreditAccounts: () => superAdminWorkCreditAccounts,
  superAdminWorkCreditLedger: () => superAdminWorkCreditLedger,
  termsAcceptances: () => termsAcceptances,
  termsVersions: () => termsVersions,
  users: () => users
});
var import_pg_core = require("drizzle-orm/pg-core");
var users = (0, import_pg_core.pgTable)("users", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  phone: (0, import_pg_core.text)("phone").notNull().unique(),
  fullName: (0, import_pg_core.text)("full_name").notNull(),
  password: (0, import_pg_core.text)("password").notNull(),
  // bcrypt hash
  role: (0, import_pg_core.text)("role").notNull().default("CUSTOMER"),
  // 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN'
  status: (0, import_pg_core.text)("status").notNull().default("ACTIVE"),
  // 'ACTIVE' | 'SUSPENDED' | 'DISABLED'
  departmentId: (0, import_pg_core.text)("department_id"),
  permissions: (0, import_pg_core.jsonb)("permissions").$type().default([]),
  language: (0, import_pg_core.text)("language").notNull().default("sw"),
  mustChangePassword: (0, import_pg_core.boolean)("must_change_password").notNull().default(false),
  lastLoginAt: (0, import_pg_core.timestamp)("last_login_at", { withTimezone: true }),
  createdAt: (0, import_pg_core.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  (0, import_pg_core.uniqueIndex)("users_phone_idx").on(table.phone),
  (0, import_pg_core.index)("users_role_idx").on(table.role)
]);
var sessions = (0, import_pg_core.pgTable)("sessions", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  token: (0, import_pg_core.text)("token").notNull().unique(),
  userId: (0, import_pg_core.text)("user_id").notNull().references(() => users.id),
  role: (0, import_pg_core.text)("role").notNull(),
  deviceName: (0, import_pg_core.text)("device_name").notNull(),
  ip: (0, import_pg_core.text)("ip").notNull(),
  isRevoked: (0, import_pg_core.boolean)("is_revoked").notNull().default(false),
  revokeReason: (0, import_pg_core.text)("revoke_reason"),
  expiresAt: (0, import_pg_core.timestamp)("expires_at", { withTimezone: true }).notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  (0, import_pg_core.uniqueIndex)("sessions_token_idx").on(table.token),
  (0, import_pg_core.index)("sessions_user_id_idx").on(table.userId)
]);
var termsVersions = (0, import_pg_core.pgTable)("terms_versions", {
  version: (0, import_pg_core.text)("version").primaryKey(),
  content: (0, import_pg_core.text)("content").notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var termsAcceptances = (0, import_pg_core.pgTable)("terms_acceptances", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.text)("user_id").notNull().references(() => users.id),
  termsVersion: (0, import_pg_core.text)("terms_version").notNull(),
  acceptedAt: (0, import_pg_core.timestamp)("accepted_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  (0, import_pg_core.index)("terms_acceptances_user_idx").on(table.userId)
]);
var services = (0, import_pg_core.pgTable)("services", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  code: (0, import_pg_core.text)("code").notNull().unique(),
  name: (0, import_pg_core.text)("name").notNull(),
  description: (0, import_pg_core.text)("description"),
  priceTzs: (0, import_pg_core.integer)("price_tzs").notNull(),
  isActive: (0, import_pg_core.boolean)("is_active").notNull().default(true),
  inputRequirement: (0, import_pg_core.text)("input_requirement").notNull(),
  resultType: (0, import_pg_core.text)("result_type").notNull(),
  departmentId: (0, import_pg_core.text)("department_id"),
  updatedAt: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var creditAccounts = (0, import_pg_core.pgTable)("credit_accounts", {
  userId: (0, import_pg_core.text)("user_id").primaryKey().references(() => users.id),
  balanceTzs: (0, import_pg_core.integer)("balance_tzs").notNull().default(0),
  updatedAt: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var creditLedger = (0, import_pg_core.pgTable)("credit_ledger", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  userId: (0, import_pg_core.text)("user_id").notNull().references(() => users.id),
  type: (0, import_pg_core.text)("type").notNull(),
  // 'ADD' | 'CHARGE' | 'REFUND' | 'ADJUSTMENT'
  amount: (0, import_pg_core.integer)("amount").notNull(),
  balanceBefore: (0, import_pg_core.integer)("balance_before").notNull(),
  balanceAfter: (0, import_pg_core.integer)("balance_after").notNull(),
  requestId: (0, import_pg_core.text)("request_id"),
  actorId: (0, import_pg_core.text)("actor_id").notNull(),
  actorName: (0, import_pg_core.text)("actor_name").notNull(),
  actorRole: (0, import_pg_core.text)("actor_role").notNull(),
  reason: (0, import_pg_core.text)("reason").notNull(),
  reference: (0, import_pg_core.text)("reference").notNull(),
  timestamp: (0, import_pg_core.timestamp)("timestamp", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  (0, import_pg_core.index)("credit_ledger_user_idx").on(table.userId),
  (0, import_pg_core.index)("credit_ledger_request_idx").on(table.requestId)
]);
var adminWorkCreditAccounts = (0, import_pg_core.pgTable)("admin_work_credit_accounts", {
  adminId: (0, import_pg_core.text)("admin_id").primaryKey().references(() => users.id),
  balanceTzs: (0, import_pg_core.integer)("balance_tzs").notNull().default(0),
  updatedAt: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var adminWorkCreditLedger = (0, import_pg_core.pgTable)("admin_work_credit_ledger", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  adminId: (0, import_pg_core.text)("admin_id").notNull().references(() => users.id),
  type: (0, import_pg_core.text)("type").notNull(),
  // 'WORK_EARNING' | 'WITHDRAWAL' | 'ADJUSTMENT'
  amount: (0, import_pg_core.integer)("amount").notNull(),
  balanceBefore: (0, import_pg_core.integer)("balance_before").notNull(),
  balanceAfter: (0, import_pg_core.integer)("balance_after").notNull(),
  requestId: (0, import_pg_core.text)("request_id"),
  actorId: (0, import_pg_core.text)("actor_id").notNull(),
  actorName: (0, import_pg_core.text)("actor_name").notNull(),
  actorRole: (0, import_pg_core.text)("actor_role").notNull(),
  reason: (0, import_pg_core.text)("reason").notNull(),
  reference: (0, import_pg_core.text)("reference").notNull(),
  timestamp: (0, import_pg_core.timestamp)("timestamp", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  (0, import_pg_core.index)("admin_work_credit_ledger_admin_idx").on(table.adminId)
]);
var superAdminWorkCreditAccounts = (0, import_pg_core.pgTable)("super_admin_work_credit_accounts", {
  superAdminId: (0, import_pg_core.text)("super_admin_id").primaryKey().references(() => users.id),
  balanceTzs: (0, import_pg_core.integer)("balance_tzs").notNull().default(0),
  updatedAt: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var superAdminWorkCreditLedger = (0, import_pg_core.pgTable)("super_admin_work_credit_ledger", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  superAdminId: (0, import_pg_core.text)("super_admin_id").notNull().references(() => users.id),
  amount: (0, import_pg_core.integer)("amount").notNull(),
  balanceBefore: (0, import_pg_core.integer)("balance_before").notNull(),
  balanceAfter: (0, import_pg_core.integer)("balance_after").notNull(),
  requestId: (0, import_pg_core.text)("request_id"),
  actorId: (0, import_pg_core.text)("actor_id").notNull(),
  actorName: (0, import_pg_core.text)("actor_name").notNull(),
  actorRole: (0, import_pg_core.text)("actor_role").notNull(),
  reason: (0, import_pg_core.text)("reason").notNull(),
  reference: (0, import_pg_core.text)("reference").notNull(),
  timestamp: (0, import_pg_core.timestamp)("timestamp", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  (0, import_pg_core.index)("super_admin_work_credit_ledger_admin_idx").on(table.superAdminId)
]);
var requests = (0, import_pg_core.pgTable)("requests", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  // NMY-YYYYMMDD-XXXXXX
  customerId: (0, import_pg_core.text)("customer_id").notNull(),
  customerName: (0, import_pg_core.text)("customer_name").notNull(),
  customerPhone: (0, import_pg_core.text)("customer_phone").notNull(),
  serviceId: (0, import_pg_core.text)("service_id").notNull(),
  serviceCode: (0, import_pg_core.text)("service_code").notNull(),
  serviceName: (0, import_pg_core.text)("service_name").notNull(),
  targetPhoneNumber: (0, import_pg_core.text)("target_phone_number").notNull(),
  chargedPriceTzs: (0, import_pg_core.integer)("charged_price_tzs").notNull(),
  status: (0, import_pg_core.text)("status").notNull(),
  // 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  claimedByWorkerId: (0, import_pg_core.text)("claimed_by_worker_id"),
  claimedByWorkerName: (0, import_pg_core.text)("claimed_by_worker_name"),
  claimedByWorkerRole: (0, import_pg_core.text)("claimed_by_worker_role"),
  claimedAt: (0, import_pg_core.timestamp)("claimed_at", { withTimezone: true }),
  completedAt: (0, import_pg_core.timestamp)("completed_at", { withTimezone: true }),
  rejectedAt: (0, import_pg_core.timestamp)("rejected_at", { withTimezone: true }),
  nidaResult: (0, import_pg_core.text)("nida_result"),
  rejectionReason: (0, import_pg_core.text)("rejection_reason"),
  refundStatus: (0, import_pg_core.text)("refund_status").default("NONE"),
  // 'NONE' | 'REFUNDED'
  refundedAt: (0, import_pg_core.timestamp)("refunded_at", { withTimezone: true }),
  // Soft-deletion fields for customer self-service safety
  isDeletedByCustomer: (0, import_pg_core.boolean)("is_deleted_by_customer").notNull().default(false),
  deletedAt: (0, import_pg_core.timestamp)("deleted_at", { withTimezone: true }),
  deletedBy: (0, import_pg_core.text)("deleted_by"),
  createdAt: (0, import_pg_core.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  (0, import_pg_core.index)("requests_customer_id_idx").on(table.customerId),
  (0, import_pg_core.index)("requests_status_idx").on(table.status),
  (0, import_pg_core.index)("requests_worker_id_idx").on(table.claimedByWorkerId),
  (0, import_pg_core.index)("requests_created_at_idx").on(table.createdAt)
]);
var requestEvents = (0, import_pg_core.pgTable)("request_events", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  requestId: (0, import_pg_core.text)("request_id").notNull().references(() => requests.id),
  eventType: (0, import_pg_core.text)("event_type").notNull(),
  actorId: (0, import_pg_core.text)("actor_id").notNull(),
  actorName: (0, import_pg_core.text)("actor_name").notNull(),
  actorRole: (0, import_pg_core.text)("actor_role").notNull(),
  details: (0, import_pg_core.text)("details").notNull(),
  timestamp: (0, import_pg_core.timestamp)("timestamp", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  (0, import_pg_core.index)("request_events_request_id_idx").on(table.requestId)
]);
var creditRequests = (0, import_pg_core.pgTable)("credit_requests", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  customerId: (0, import_pg_core.text)("customer_id").notNull(),
  customerName: (0, import_pg_core.text)("customer_name").notNull(),
  customerPhone: (0, import_pg_core.text)("customer_phone").notNull(),
  amountTzs: (0, import_pg_core.integer)("amount_tzs").notNull(),
  paymentMethod: (0, import_pg_core.text)("payment_method").notNull(),
  paymentReference: (0, import_pg_core.text)("payment_reference").notNull(),
  proofImageUrl: (0, import_pg_core.text)("proof_image_url"),
  status: (0, import_pg_core.text)("status").notNull().default("PENDING_VERIFICATION"),
  // 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED'
  reviewedBy: (0, import_pg_core.text)("reviewed_by"),
  rejectionReason: (0, import_pg_core.text)("rejection_reason"),
  reviewedAt: (0, import_pg_core.timestamp)("reviewed_at", { withTimezone: true }),
  createdAt: (0, import_pg_core.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  (0, import_pg_core.index)("credit_requests_customer_id_idx").on(table.customerId),
  (0, import_pg_core.index)("credit_requests_status_idx").on(table.status)
]);
var notifications = (0, import_pg_core.pgTable)("notifications", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  userId: (0, import_pg_core.text)("user_id").notNull(),
  title: (0, import_pg_core.text)("title").notNull(),
  message: (0, import_pg_core.text)("message").notNull(),
  type: (0, import_pg_core.text)("type").notNull().default("INFO"),
  isRead: (0, import_pg_core.boolean)("is_read").notNull().default(false),
  createdAt: (0, import_pg_core.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  (0, import_pg_core.index)("notifications_user_id_idx").on(table.userId)
]);
var announcements = (0, import_pg_core.pgTable)("announcements", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  title: (0, import_pg_core.text)("title").notNull(),
  message: (0, import_pg_core.text)("message").notNull(),
  targetType: (0, import_pg_core.text)("target_type").notNull().default("ALL"),
  isActive: (0, import_pg_core.boolean)("is_active").notNull().default(true),
  createdAt: (0, import_pg_core.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
});
var departments = (0, import_pg_core.pgTable)("departments", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  name: (0, import_pg_core.text)("name").notNull(),
  code: (0, import_pg_core.text)("code").notNull().unique(),
  description: (0, import_pg_core.text)("description"),
  permissions: (0, import_pg_core.jsonb)("permissions").$type().default([]),
  createdAt: (0, import_pg_core.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
});
var files = (0, import_pg_core.pgTable)("files", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  userId: (0, import_pg_core.text)("user_id").notNull(),
  fileName: (0, import_pg_core.text)("file_name").notNull(),
  fileUrl: (0, import_pg_core.text)("file_url").notNull(),
  fileType: (0, import_pg_core.text)("file_type").notNull(),
  sizeBytes: (0, import_pg_core.integer)("size_bytes").notNull(),
  checksum: (0, import_pg_core.text)("checksum"),
  storageBucket: (0, import_pg_core.text)("storage_bucket"),
  isPrivate: (0, import_pg_core.boolean)("is_private").notNull().default(true),
  createdAt: (0, import_pg_core.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  (0, import_pg_core.index)("files_user_id_idx").on(table.userId)
]);
var auditLogs = (0, import_pg_core.pgTable)("audit_logs", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  actorId: (0, import_pg_core.text)("actor_id").notNull(),
  actorName: (0, import_pg_core.text)("actor_name").notNull(),
  actorRole: (0, import_pg_core.text)("actor_role").notNull(),
  action: (0, import_pg_core.text)("action").notNull(),
  target: (0, import_pg_core.text)("target").notNull(),
  targetId: (0, import_pg_core.text)("target_id"),
  details: (0, import_pg_core.text)("details").notNull(),
  timestamp: (0, import_pg_core.timestamp)("timestamp", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  (0, import_pg_core.index)("audit_logs_actor_idx").on(table.actorId),
  (0, import_pg_core.index)("audit_logs_action_idx").on(table.action),
  (0, import_pg_core.index)("audit_logs_timestamp_idx").on(table.timestamp)
]);
var settings = (0, import_pg_core.pgTable)("settings", {
  key: (0, import_pg_core.text)("key").primaryKey(),
  value: (0, import_pg_core.jsonb)("value").notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow()
});
var advertisements = (0, import_pg_core.pgTable)("advertisements", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  type: (0, import_pg_core.text)("type").notNull(),
  // 'VIDEO' | 'IMAGE' | 'TEXT'
  title: (0, import_pg_core.text)("title").notNull(),
  description: (0, import_pg_core.text)("description").notNull(),
  mediaUrl: (0, import_pg_core.text)("media_url"),
  coverUrl: (0, import_pg_core.text)("cover_url"),
  startDate: (0, import_pg_core.timestamp)("start_date", { withTimezone: true }),
  endDate: (0, import_pg_core.timestamp)("end_date", { withTimezone: true }),
  isActive: (0, import_pg_core.boolean)("is_active").notNull().default(true),
  createdById: (0, import_pg_core.text)("created_by_id").notNull(),
  createdByName: (0, import_pg_core.text)("created_by_name").notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  (0, import_pg_core.index)("advertisements_is_active_idx").on(table.isActive),
  (0, import_pg_core.index)("advertisements_created_at_idx").on(table.createdAt)
]);
var pushSubscriptions = (0, import_pg_core.pgTable)("push_subscriptions", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  userId: (0, import_pg_core.text)("user_id").notNull().references(() => users.id),
  endpoint: (0, import_pg_core.text)("endpoint").notNull().unique(),
  p256dh: (0, import_pg_core.text)("p256dh").notNull(),
  auth: (0, import_pg_core.text)("auth").notNull(),
  userAgent: (0, import_pg_core.text)("user_agent"),
  createdAt: (0, import_pg_core.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  (0, import_pg_core.index)("push_subscriptions_user_idx").on(table.userId)
]);

// src/db/index.ts
var createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new import_pg.Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15e3,
      idleTimeoutMillis: 3e4
    });
    global._postgresPool.on("error", (err) => {
      console.error("[Cloud SQL Pool Error]: Unexpected error on idle client:", err);
    });
  }
  return global._postgresPool;
};
var pool = createPool();
var db = (0, import_node_postgres.drizzle)(pool, { schema: schema_exports });

// server/services/pushService.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_web_push = __toESM(require("web-push"), 1);
var import_app = require("firebase-admin/app");
var import_messaging = require("firebase-admin/messaging");
var PushService = class _PushService {
  static instance;
  isConfigured = false;
  vapidPublicKey = "";
  vapidPrivateKey = "";
  fcmAdminApp = null;
  fcmMessaging = null;
  fcmAuthenticated = false;
  fcmProject = "genuine-purpose-m07pf";
  fcmClientEmail = "";
  oneSignalAppId = process.env.ONESIGNAL_APP_ID || "";
  oneSignalRestApiKey = process.env.ONESIGNAL_REST_API_KEY || "";
  sentEventKeys = /* @__PURE__ */ new Map();
  constructor() {
  }
  static getInstance() {
    if (!_PushService.instance) {
      _PushService.instance = new _PushService();
    }
    return _PushService.instance;
  }
  async sendOneSignalNotification(target, payload) {
    const appId = this.oneSignalAppId || process.env.ONESIGNAL_APP_ID;
    const apiKey = this.oneSignalRestApiKey || process.env.ONESIGNAL_REST_API_KEY;
    if (!appId || !apiKey) {
      return false;
    }
    const displayTitle = payload.title.startsWith("RAVINI") ? payload.title : `RAVINI: ${payload.title}`;
    const messageBody = payload.body || payload.message || "Una taarifa mpya kwenye akaunti yako ya RAVINI";
    try {
      const body = {
        app_id: appId,
        target_channel: "push",
        headings: { en: displayTitle, sw: displayTitle },
        contents: { en: messageBody, sw: messageBody },
        data: {
          url: payload.url || "/",
          type: payload.type || "INFO",
          ...payload.data || {}
        },
        android_channel_id: "ravini_default_channel",
        priority: 10,
        android_sound: "default"
      };
      if (target.segment) {
        body.included_segments = [target.segment];
      } else if (target.externalIds && target.externalIds.length > 0) {
        body.include_aliases = {
          external_id: target.externalIds
        };
      } else {
        return false;
      }
      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${apiKey}`
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.warn("[ONESIGNAL DISPATCH NOTICE]:", response.status, errorText);
        return false;
      }
      const resData = await response.json();
      console.log("[ONESIGNAL DISPATCH SUCCESS]:", resData.id, "recipients:", resData.recipients);
      return true;
    } catch (e) {
      console.warn("[ONESIGNAL ERROR]:", e.message);
      return false;
    }
  }
  isDuplicateEvent(eventKey) {
    if (!eventKey) return false;
    const now = Date.now();
    const lastSent = this.sentEventKeys.get(eventKey);
    if (lastSent && now - lastSent < 15e3) {
      return true;
    }
    this.sentEventKeys.set(eventKey, now);
    if (this.sentEventKeys.size > 1e3) {
      for (const [k, v] of this.sentEventKeys.entries()) {
        if (now - v > 6e4) this.sentEventKeys.delete(k);
      }
    }
    return false;
  }
  async initializeFcm() {
    try {
      let serviceAccount = null;
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
          if (raw.startsWith("{")) {
            serviceAccount = JSON.parse(raw);
          } else {
            const decoded = Buffer.from(raw, "base64").toString("utf8");
            serviceAccount = JSON.parse(decoded);
          }
        } catch (e) {
          console.warn("[PUSH SERVICE] Error parsing FIREBASE_SERVICE_ACCOUNT_KEY env:", e.message);
        }
      }
      if (!serviceAccount && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        try {
          const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS.trim();
          if (import_fs.default.existsSync(credPath)) {
            serviceAccount = JSON.parse(import_fs.default.readFileSync(credPath, "utf8"));
          }
        } catch (e) {
          console.warn("[PUSH SERVICE] Error reading GOOGLE_APPLICATION_CREDENTIALS:", e.message);
        }
      }
      if (!serviceAccount) {
        const potentialPaths = [
          import_path.default.resolve(process.cwd(), "firebase-service-account.json"),
          import_path.default.resolve(process.cwd(), "service-account.json"),
          import_path.default.resolve(__dirname, "../../firebase-service-account.json")
        ];
        for (const p of potentialPaths) {
          if (import_fs.default.existsSync(p)) {
            try {
              serviceAccount = JSON.parse(import_fs.default.readFileSync(p, "utf8"));
              break;
            } catch (e) {
              console.warn("[PUSH SERVICE] Error reading service account file:", e.message);
            }
          }
        }
      }
      if (serviceAccount && serviceAccount.private_key && serviceAccount.client_email) {
        if (this.fcmAdminApp) {
          try {
            await (0, import_app.deleteApp)(this.fcmAdminApp);
          } catch (e) {
          }
        }
        this.fcmProject = serviceAccount.project_id || "genuine-purpose-m07pf";
        this.fcmClientEmail = serviceAccount.client_email;
        this.fcmAdminApp = (0, import_app.initializeApp)({
          credential: (0, import_app.cert)(serviceAccount),
          projectId: this.fcmProject
        }, `ravini-fcm-${Date.now()}`);
        this.fcmMessaging = (0, import_messaging.getMessaging)(this.fcmAdminApp);
        this.fcmAuthenticated = true;
        console.log(`[PUSH SERVICE] Firebase Admin authenticated successfully with service account: ${this.fcmClientEmail} for project: ${this.fcmProject}`);
      } else {
        const app = (0, import_app.getApps)().length === 0 ? (0, import_app.initializeApp)({ projectId: this.fcmProject }) : (0, import_app.getApps)()[0];
        this.fcmMessaging = (0, import_messaging.getMessaging)(app);
        this.fcmAuthenticated = false;
        console.log(`[PUSH SERVICE] Firebase Admin initialized with project ${this.fcmProject} (Awaiting secure server secret: FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS)`);
      }
    } catch (fcmErr) {
      console.warn("[PUSH SERVICE] FCM init notice:", fcmErr.message);
    }
  }
  async updateServiceAccount(serviceAccountJson) {
    try {
      const parsed = typeof serviceAccountJson === "string" ? JSON.parse(serviceAccountJson) : serviceAccountJson;
      if (!parsed.client_email || !parsed.private_key || !parsed.project_id) {
        return {
          success: false,
          message: "Faili ya Service Account lazima iwe na project_id, client_email na private_key."
        };
      }
      const secretPath = import_path.default.resolve(process.cwd(), "firebase-service-account.json");
      import_fs.default.writeFileSync(secretPath, JSON.stringify(parsed, null, 2), { mode: 384 });
      await this.initializeFcm();
      return {
        success: true,
        message: `Service Account ya FCM kwa mradi wa ${parsed.project_id} imehifadhiwa kwenye secure server storage na kuwashwa kikamilifu!`
      };
    } catch (e) {
      return { success: false, message: e.message || "Hitilafu ya kusajili Service Account." };
    }
  }
  async removeServiceAccount() {
    try {
      const secretPath = import_path.default.resolve(process.cwd(), "firebase-service-account.json");
      if (import_fs.default.existsSync(secretPath)) {
        import_fs.default.unlinkSync(secretPath);
      }
      try {
        await pool.query(`DELETE FROM settings WHERE key = 'firebase_service_account'`);
      } catch {
      }
      if (this.fcmAdminApp) {
        try {
          await (0, import_app.deleteApp)(this.fcmAdminApp);
        } catch {
        }
      }
      this.fcmAdminApp = null;
      this.fcmMessaging = null;
      this.fcmAuthenticated = false;
      this.fcmClientEmail = "";
      return { success: true, message: "FCM Service Account imeondolewa kikamilifu." };
    } catch (e) {
      return { success: false, message: e.message || "Hitilafu ya kuondoa Service Account." };
    }
  }
  async getFcmStatus() {
    let totalSubs = 0;
    let fcmSubs = 0;
    let webSubs = 0;
    try {
      const res = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE endpoint LIKE 'fcm:%' OR p256dh = 'fcm') as fcm_count,
          COUNT(*) FILTER (WHERE NOT (endpoint LIKE 'fcm:%' OR p256dh = 'fcm')) as web_count
        FROM push_subscriptions
      `);
      if (res.rows.length > 0) {
        totalSubs = parseInt(res.rows[0].total) || 0;
        fcmSubs = parseInt(res.rows[0].fcm_count) || 0;
        webSubs = parseInt(res.rows[0].web_count) || 0;
      }
    } catch (e) {
    }
    return {
      authenticated: this.fcmAuthenticated,
      projectId: this.fcmProject,
      clientEmail: this.fcmClientEmail,
      oneSignalConfigured: Boolean((this.oneSignalAppId || process.env.ONESIGNAL_APP_ID) && (this.oneSignalRestApiKey || process.env.ONESIGNAL_REST_API_KEY)),
      oneSignalAppId: this.oneSignalAppId || process.env.ONESIGNAL_APP_ID || "",
      totalSubscriptions: totalSubs,
      fcmSubscriptions: fcmSubs,
      webSubscriptions: webSubs
    };
  }
  async initialize() {
    if (this.isConfigured) return;
    await this.initializeFcm();
    try {
      const vapidRes = await pool.query(`SELECT value FROM settings WHERE key = 'vapid_keys'`);
      if (vapidRes.rowCount && vapidRes.rowCount > 0) {
        const keys = typeof vapidRes.rows[0].value === "string" ? JSON.parse(vapidRes.rows[0].value) : vapidRes.rows[0].value;
        this.vapidPublicKey = keys.publicKey;
        this.vapidPrivateKey = keys.privateKey;
      } else {
        const newKeys = import_web_push.default.generateVAPIDKeys();
        this.vapidPublicKey = newKeys.publicKey;
        this.vapidPrivateKey = newKeys.privateKey;
        await pool.query(
          `INSERT INTO settings (key, value, updated_at)
           VALUES ('vapid_keys', $1, NOW())
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [JSON.stringify(newKeys)]
        );
        console.log("[PUSH SERVICE] Generated new persistent VAPID keys in Cloud SQL");
      }
      import_web_push.default.setVapidDetails(
        "mailto:support@ravini.co.tz",
        this.vapidPublicKey,
        this.vapidPrivateKey
      );
      this.isConfigured = true;
      console.log("[PUSH SERVICE] Initialized with Cloud SQL persistent VAPID keys");
    } catch (err) {
      console.error("[PUSH SERVICE INIT ERROR]:", err.message);
      if (!this.vapidPublicKey || !this.vapidPrivateKey) {
        const fallbackKeys = import_web_push.default.generateVAPIDKeys();
        this.vapidPublicKey = fallbackKeys.publicKey;
        this.vapidPrivateKey = fallbackKeys.privateKey;
        import_web_push.default.setVapidDetails(
          "mailto:support@ravini.co.tz",
          this.vapidPublicKey,
          this.vapidPrivateKey
        );
        this.isConfigured = true;
      }
    }
  }
  async getPublicKey() {
    if (!this.isConfigured) {
      await this.initialize();
    }
    return this.vapidPublicKey;
  }
  async saveSubscription(userId, subscription, userAgent) {
    if (!this.isConfigured) {
      await this.initialize();
    }
    const id = `push_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await pool.query(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (endpoint) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth,
         user_agent = EXCLUDED.user_agent,
         updated_at = NOW()`,
      [id, userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, userAgent || null]
    );
  }
  async removeSubscription(endpoint) {
    await pool.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [endpoint]);
  }
  async deliverToSingleEndpoint(endpoint, p256dh, auth, title, messageBody, payload) {
    const displayTitle = title.startsWith("RAVINI") ? title : `RAVINI: ${title}`;
    if (endpoint.startsWith("fcm:") || p256dh === "fcm") {
      const fcmToken = endpoint.replace(/^fcm:/, "");
      if (!this.fcmMessaging) {
        console.warn("[FCM PUSH] Messaging not initialized, cannot deliver to FCM token");
        return false;
      }
      try {
        await this.fcmMessaging.send({
          token: fcmToken,
          notification: {
            title: displayTitle,
            body: messageBody
          },
          data: {
            url: payload.url || "/",
            type: payload.type || "INFO",
            timestamp: String(Date.now()),
            ...payload.data ? Object.fromEntries(Object.entries(payload.data).map(([k, v]) => [k, String(v)])) : {}
          },
          android: {
            priority: "high",
            notification: {
              title: displayTitle,
              body: messageBody,
              sound: "default",
              defaultSound: true,
              defaultVibrateTimings: true,
              clickAction: "OPEN_ACTIVITY",
              channelId: "ravini_default_channel",
              visibility: "public"
            }
          }
        });
        return true;
      } catch (fcmErr) {
        if (fcmErr.code === "messaging/registration-token-not-registered" || fcmErr.code === "messaging/invalid-registration-token") {
          await this.removeSubscription(endpoint);
        } else {
          console.warn("[FCM PUSH DELIVERY ERROR]:", fcmErr.message);
        }
        return false;
      }
    }
    const pushSubscription = {
      endpoint,
      keys: { p256dh, auth }
    };
    const notificationPayload = JSON.stringify({
      title: displayTitle,
      message: messageBody,
      body: messageBody,
      type: payload.type || "INFO",
      url: payload.url || "/",
      data: payload.data || {},
      timestamp: Date.now()
    });
    try {
      await import_web_push.default.sendNotification(pushSubscription, notificationPayload);
      return true;
    } catch (sendErr) {
      if (sendErr.statusCode === 404 || sendErr.statusCode === 410) {
        await this.removeSubscription(endpoint);
      } else {
        console.warn("[WEB PUSH DELIVERY WARNING]:", sendErr.message);
      }
      return false;
    }
  }
  async sendNotificationToUser(userId, payload) {
    if (payload.eventKey && this.isDuplicateEvent(payload.eventKey)) {
      console.log(`[PUSH DEDUP] Skipping duplicate notification for key: ${payload.eventKey}`);
      return 0;
    }
    if (!this.isConfigured) {
      await this.initialize();
    }
    let delivered = 0;
    try {
      const osSuccess = await this.sendOneSignalNotification({ externalIds: [userId] }, payload);
      if (osSuccess) delivered++;
    } catch (osErr) {
      console.warn("[ONESIGNAL SEND NOTICE]:", osErr.message);
    }
    try {
      const res = await pool.query(
        `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
        [userId]
      );
      if (res.rowCount === 0) {
        return delivered;
      }
      const messageBody = payload.message || payload.body || "";
      for (const row of res.rows) {
        const ok = await this.deliverToSingleEndpoint(
          row.endpoint,
          row.p256dh,
          row.auth,
          payload.title,
          messageBody,
          payload
        );
        if (ok) delivered++;
      }
      return delivered;
    } catch (err) {
      console.error("[PUSH SERVICE SEND ERROR]:", err.message);
      return delivered;
    }
  }
  async broadcastNotification(payload) {
    if (payload.eventKey && this.isDuplicateEvent(payload.eventKey)) {
      console.log(`[PUSH DEDUP] Skipping duplicate broadcast for key: ${payload.eventKey}`);
      return 0;
    }
    if (!this.isConfigured) {
      await this.initialize();
    }
    let delivered = 0;
    try {
      const osSuccess = await this.sendOneSignalNotification({ segment: "Total Subscriptions" }, payload);
      if (osSuccess) delivered++;
    } catch (osErr) {
      console.warn("[ONESIGNAL BROADCAST NOTICE]:", osErr.message);
    }
    try {
      const res = await pool.query(`SELECT endpoint, p256dh, auth FROM push_subscriptions`);
      if (res.rowCount === 0) return delivered;
      const messageBody = payload.message || payload.body || "";
      for (const row of res.rows) {
        const ok = await this.deliverToSingleEndpoint(
          row.endpoint,
          row.p256dh,
          row.auth,
          payload.title,
          messageBody,
          payload
        );
        if (ok) delivered++;
      }
      return delivered;
    } catch (err) {
      console.error("[PUSH BROADCAST ERROR]:", err.message);
      return delivered;
    }
  }
  async sendNotificationToRole(role, payload) {
    if (payload.eventKey && this.isDuplicateEvent(payload.eventKey)) {
      console.log(`[PUSH DEDUP] Skipping duplicate role notification for key: ${payload.eventKey}`);
      return 0;
    }
    if (!this.isConfigured) {
      await this.initialize();
    }
    let delivered = 0;
    try {
      const roleUsers = await pool.query("SELECT id FROM users WHERE role = $1 AND is_active = true", [role]);
      const userIds = roleUsers.rows.map((r) => r.id);
      if (userIds.length > 0) {
        const osSuccess = await this.sendOneSignalNotification({ externalIds: userIds }, payload);
        if (osSuccess) delivered++;
      }
    } catch (osErr) {
      console.warn("[ONESIGNAL ROLE DISPATCH NOTICE]:", osErr.message);
    }
    try {
      const res = await pool.query(
        `SELECT ps.endpoint, ps.p256dh, ps.auth
         FROM push_subscriptions ps
         JOIN users u ON ps.user_id = u.id
         WHERE u.role = $1`,
        [role]
      );
      if (res.rowCount === 0) return delivered;
      const messageBody = payload.message || payload.body || "";
      for (const row of res.rows) {
        const ok = await this.deliverToSingleEndpoint(
          row.endpoint,
          row.p256dh,
          row.auth,
          payload.title,
          messageBody,
          payload
        );
        if (ok) delivered++;
      }
      return delivered;
    } catch (err) {
      console.error("[PUSH ROLE ERROR]:", err.message);
      return delivered;
    }
  }
};
var pushService = PushService.getInstance();

// server/db/nmyDb.ts
function normalizePhone(input) {
  if (!input) return "";
  const digits = String(input).replace(/\D/g, "");
  if (digits.startsWith("255") && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return "255" + digits.substring(1);
  }
  if (digits.length === 9) {
    return "255" + digits;
  }
  return digits;
}
var NmyDatabase = class _NmyDatabase {
  static instance;
  isInitialized = false;
  constructor() {
  }
  static getInstance() {
    if (!_NmyDatabase.instance) {
      _NmyDatabase.instance = new _NmyDatabase();
    }
    return _NmyDatabase.instance;
  }
  // --- HARDENED STARTUP & HEALTH CHECK ---
  // ZERO SILENT RECREATION: If connection fails or tables are missing, FAIL SAFE!
  async initialize() {
    if (this.isInitialized) return;
    if (!process.env.SQL_HOST || !process.env.SQL_DB_NAME || !process.env.SQL_USER) {
      throw new Error("[DATA PROTECTION LOCK] Missing Cloud SQL environment variables (SQL_HOST, SQL_DB_NAME, SQL_USER). Refusing to start.");
    }
    try {
      const ping = await pool.query("SELECT current_database(), current_user, NOW() as current_time");
      console.log(`[NMY CLOUD SQL] Connected to PostgreSQL database: ${ping.rows[0].current_database} as ${ping.rows[0].current_user}`);
      const requiredTables = [
        "users",
        "sessions",
        "terms_versions",
        "terms_acceptances",
        "services",
        "credit_accounts",
        "credit_ledger",
        "admin_work_credit_accounts",
        "admin_work_credit_ledger",
        "super_admin_work_credit_accounts",
        "super_admin_work_credit_ledger",
        "requests",
        "request_events",
        "credit_requests",
        "notifications",
        "announcements",
        "departments",
        "files",
        "audit_logs",
        "settings",
        "advertisements"
      ];
      const tablesRes = await pool.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
      );
      const existingTables = new Set(tablesRes.rows.map((r) => r.table_name));
      for (const t of requiredTables) {
        if (!existingTables.has(t)) {
          throw new Error(`[DATA INTEGRITY LOCK] Required production table '${t}' is missing in Cloud SQL. Refusing to run.`);
        }
      }
      const superAdminRes = await pool.query(
        `SELECT id, phone, role, status FROM users WHERE phone = '255748604483'`
      );
      if (superAdminRes.rowCount === 0) {
        throw new Error("[DATA INTEGRITY LOCK] Canonical Super Admin (255748604483) does not exist in Cloud SQL PostgreSQL. Refusing silent seed.");
      }
      this.isInitialized = true;
      console.log("[NMY CLOUD SQL] Production Database Initialized and Verified: Cloud SQL PostgreSQL is AUTHORITATIVE SOURCE OF TRUTH.");
    } catch (err) {
      console.error("[NMY CLOUD SQL CRITICAL FAIL-SAFE]:", err.message);
      throw err;
    }
  }
  // --- USERS ---
  async getUsers() {
    const res = await pool.query(
      `SELECT id, phone, full_name as "fullName", password, role, status,
              department_id as "departmentId", permissions, language,
              must_change_password as "mustChangePassword",
              last_login_at as "lastLoginAt",
              marked_for_deletion_at as "markedForDeletionAt",
              scheduled_permanent_deletion_at as "scheduledPermanentDeletionAt",
              deletion_initiated_by as "deletionInitiatedBy",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users ORDER BY created_at ASC`
    );
    return res.rows.map((r) => ({
      ...r,
      permissions: Array.isArray(r.permissions) ? r.permissions : JSON.parse(r.permissions || "[]"),
      lastLoginAt: r.lastLoginAt ? new Date(r.lastLoginAt).toISOString() : void 0,
      markedForDeletionAt: r.markedForDeletionAt ? new Date(r.markedForDeletionAt).toISOString() : void 0,
      scheduledPermanentDeletionAt: r.scheduledPermanentDeletionAt ? new Date(r.scheduledPermanentDeletionAt).toISOString() : void 0,
      deletionInitiatedBy: r.deletionInitiatedBy || void 0,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString()
    }));
  }
  async getUserById(id) {
    const res = await pool.query(
      `SELECT id, phone, full_name as "fullName", password, role, status,
              department_id as "departmentId", permissions, language,
              must_change_password as "mustChangePassword",
              last_login_at as "lastLoginAt",
              marked_for_deletion_at as "markedForDeletionAt",
              scheduled_permanent_deletion_at as "scheduledPermanentDeletionAt",
              deletion_initiated_by as "deletionInitiatedBy",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE id = $1`,
      [id]
    );
    if (res.rowCount === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      permissions: Array.isArray(r.permissions) ? r.permissions : JSON.parse(r.permissions || "[]"),
      lastLoginAt: r.lastLoginAt ? new Date(r.lastLoginAt).toISOString() : void 0,
      markedForDeletionAt: r.markedForDeletionAt ? new Date(r.markedForDeletionAt).toISOString() : void 0,
      scheduledPermanentDeletionAt: r.scheduledPermanentDeletionAt ? new Date(r.scheduledPermanentDeletionAt).toISOString() : void 0,
      deletionInitiatedBy: r.deletionInitiatedBy || void 0,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString()
    };
  }
  async getUserByPhone(phone) {
    const normalized = normalizePhone(phone);
    const res = await pool.query(
      `SELECT id, phone, full_name as "fullName", password, role, status,
              department_id as "departmentId", permissions, language,
              must_change_password as "mustChangePassword",
              last_login_at as "lastLoginAt",
              marked_for_deletion_at as "markedForDeletionAt",
              scheduled_permanent_deletion_at as "scheduledPermanentDeletionAt",
              deletion_initiated_by as "deletionInitiatedBy",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE phone = $1`,
      [normalized]
    );
    if (res.rowCount === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      permissions: Array.isArray(r.permissions) ? r.permissions : JSON.parse(r.permissions || "[]"),
      lastLoginAt: r.lastLoginAt ? new Date(r.lastLoginAt).toISOString() : void 0,
      markedForDeletionAt: r.markedForDeletionAt ? new Date(r.markedForDeletionAt).toISOString() : void 0,
      scheduledPermanentDeletionAt: r.scheduledPermanentDeletionAt ? new Date(r.scheduledPermanentDeletionAt).toISOString() : void 0,
      deletionInitiatedBy: r.deletionInitiatedBy || void 0,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString()
    };
  }
  async createUser(user) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const normalized = normalizePhone(user.phone);
      const res = await client.query(
        `INSERT INTO users (id, phone, full_name, password, role, status, department_id, permissions, language, must_change_password, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id, phone, full_name as "fullName", password, role, status, department_id as "departmentId", permissions, language, must_change_password as "mustChangePassword", created_at as "createdAt", updated_at as "updatedAt"`,
        [
          user.id,
          normalized,
          user.fullName,
          user.password,
          user.role,
          user.status,
          user.departmentId || null,
          JSON.stringify(user.permissions || []),
          user.language || "sw",
          user.mustChangePassword || false,
          new Date(user.createdAt || Date.now()),
          new Date(user.updatedAt || Date.now())
        ]
      );
      if (user.role === "CUSTOMER") {
        await client.query(
          `INSERT INTO credit_accounts (user_id, balance_tzs, updated_at)
           VALUES ($1, 0, NOW())
           ON CONFLICT (user_id) DO NOTHING`,
          [user.id]
        );
      } else if (user.role === "ADMIN") {
        await client.query(
          `INSERT INTO admin_work_credit_accounts (admin_id, balance_tzs, updated_at)
           VALUES ($1, 0, NOW())
           ON CONFLICT (admin_id) DO NOTHING`,
          [user.id]
        );
      } else if (user.role === "SUPER_ADMIN") {
        await client.query(
          `INSERT INTO super_admin_work_credit_accounts (super_admin_id, balance_tzs, updated_at)
           VALUES ($1, 0, NOW())
           ON CONFLICT (super_admin_id) DO NOTHING`,
          [user.id]
        );
      }
      await client.query("COMMIT");
      const r = res.rows[0];
      return {
        ...r,
        permissions: Array.isArray(r.permissions) ? r.permissions : JSON.parse(r.permissions || "[]"),
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString()
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  async updateUser(id, patch) {
    const fields = [];
    const values = [];
    let idx = 1;
    if (patch.fullName !== void 0) {
      fields.push(`full_name = $${idx++}`);
      values.push(patch.fullName);
    }
    if (patch.password !== void 0) {
      fields.push(`password = $${idx++}`);
      values.push(patch.password);
    }
    if (patch.role !== void 0) {
      fields.push(`role = $${idx++}`);
      values.push(patch.role);
    }
    if (patch.status !== void 0) {
      fields.push(`status = $${idx++}`);
      values.push(patch.status);
    }
    if (patch.departmentId !== void 0) {
      fields.push(`department_id = $${idx++}`);
      values.push(patch.departmentId);
    }
    if (patch.permissions !== void 0) {
      fields.push(`permissions = $${idx++}`);
      values.push(JSON.stringify(patch.permissions));
    }
    if (patch.language !== void 0) {
      fields.push(`language = $${idx++}`);
      values.push(patch.language);
    }
    if (patch.mustChangePassword !== void 0) {
      fields.push(`must_change_password = $${idx++}`);
      values.push(patch.mustChangePassword);
    }
    if (patch.lastLoginAt !== void 0) {
      fields.push(`last_login_at = $${idx++}`);
      values.push(patch.lastLoginAt ? new Date(patch.lastLoginAt) : null);
    }
    if (patch.markedForDeletionAt !== void 0) {
      fields.push(`marked_for_deletion_at = $${idx++}`);
      values.push(patch.markedForDeletionAt ? new Date(patch.markedForDeletionAt) : null);
    }
    if (patch.scheduledPermanentDeletionAt !== void 0) {
      fields.push(`scheduled_permanent_deletion_at = $${idx++}`);
      values.push(patch.scheduledPermanentDeletionAt ? new Date(patch.scheduledPermanentDeletionAt) : null);
    }
    if (patch.deletionInitiatedBy !== void 0) {
      fields.push(`deletion_initiated_by = $${idx++}`);
      values.push(patch.deletionInitiatedBy || null);
    }
    fields.push(`updated_at = NOW()`);
    values.push(id);
    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, phone, full_name as "fullName", password, role, status, department_id as "departmentId", permissions, language, must_change_password as "mustChangePassword", last_login_at as "lastLoginAt", marked_for_deletion_at as "markedForDeletionAt", scheduled_permanent_deletion_at as "scheduledPermanentDeletionAt", deletion_initiated_by as "deletionInitiatedBy", created_at as "createdAt", updated_at as "updatedAt"`;
    const res = await pool.query(query, values);
    if (res.rowCount === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      permissions: Array.isArray(r.permissions) ? r.permissions : JSON.parse(r.permissions || "[]"),
      lastLoginAt: r.lastLoginAt ? new Date(r.lastLoginAt).toISOString() : void 0,
      markedForDeletionAt: r.markedForDeletionAt ? new Date(r.markedForDeletionAt).toISOString() : void 0,
      scheduledPermanentDeletionAt: r.scheduledPermanentDeletionAt ? new Date(r.scheduledPermanentDeletionAt).toISOString() : void 0,
      deletionInitiatedBy: r.deletionInitiatedBy || void 0,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString()
    };
  }
  // --- SESSIONS & DEVICE LIMITS ---
  // Device limits: CUSTOMER max 1, ADMIN max 2, SUPER_ADMIN max 3
  async createSession(session) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const maxDevices = session.role === "CUSTOMER" ? 1 : session.role === "ADMIN" ? 2 : 3;
      const activeRes = await client.query(
        `SELECT id, token FROM sessions WHERE user_id = $1 AND is_revoked = false AND expires_at > NOW() ORDER BY created_at ASC`,
        [session.userId]
      );
      if (activeRes.rowCount !== null && activeRes.rowCount >= maxDevices) {
        const toRevokeCount = activeRes.rowCount - maxDevices + 1;
        const idsToRevoke = activeRes.rows.slice(0, toRevokeCount).map((r) => r.id);
        await client.query(
          `UPDATE sessions SET is_revoked = true, revoke_reason = 'ANOTHER_DEVICE' WHERE id = ANY($1::text[])`,
          [idsToRevoke]
        );
      }
      const now = Date.now();
      const expiresAt = session.expiresAt ? new Date(session.expiresAt) : new Date(now + 30 * 24 * 60 * 60 * 1e3);
      const createdAt = session.createdAt ? new Date(session.createdAt) : new Date(now);
      const sessionId = session.id || `sess_${now}_${Math.random().toString(36).substring(2, 9)}`;
      const token = session.token || `tok_${now}_${Math.random().toString(36).substring(2, 15)}`;
      const finalSession = {
        ...session,
        id: sessionId,
        token,
        expiresAt: expiresAt.toISOString(),
        createdAt: createdAt.toISOString(),
        isRevoked: session.isRevoked || false
      };
      await client.query(
        `INSERT INTO sessions (id, token, user_id, role, device_name, ip, is_revoked, revoke_reason, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          sessionId,
          token,
          session.userId,
          session.role,
          session.deviceName,
          session.ip,
          session.isRevoked || false,
          session.revokeReason || null,
          expiresAt,
          createdAt
        ]
      );
      await client.query("COMMIT");
      return finalSession;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  async getSessionByToken(token) {
    const res = await pool.query(
      `SELECT id, token, user_id as "userId", role, device_name as "deviceName", ip,
              is_revoked as "isRevoked", revoke_reason as "revokeReason",
              expires_at as "expiresAt", created_at as "createdAt"
       FROM sessions WHERE token = $1`,
      [token]
    );
    if (res.rowCount === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      expiresAt: new Date(r.expiresAt).toISOString(),
      createdAt: new Date(r.createdAt).toISOString()
    };
  }
  async revokeSession(token) {
    const res = await pool.query(
      `UPDATE sessions SET is_revoked = true WHERE token = $1`,
      [token]
    );
    return (res.rowCount || 0) > 0;
  }
  async revokeAllUserSessions(userId) {
    await pool.query(
      `UPDATE sessions SET is_revoked = true WHERE user_id = $1`,
      [userId]
    );
  }
  async getActiveSessions(userId) {
    const res = await pool.query(
      `SELECT id, token, user_id as "userId", role, device_name as "deviceName", ip,
              is_revoked as "isRevoked", revoke_reason as "revokeReason",
              expires_at as "expiresAt", created_at as "createdAt"
       FROM sessions WHERE user_id = $1 AND is_revoked = false AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows.map((r) => ({
      ...r,
      expiresAt: new Date(r.expiresAt).toISOString(),
      createdAt: new Date(r.createdAt).toISOString()
    }));
  }
  // --- TERMS ---
  async getLatestTerms() {
    const res = await pool.query(
      `SELECT version, content, updated_at as "updatedAt" FROM terms_versions ORDER BY updated_at DESC LIMIT 1`
    );
    if (res.rowCount === 0) {
      return {
        version: "v1.0",
        content: "Vigezo na Masharti ya Huduma ya NIDA MITANDAO YOTE (RAVINI COMPANY LIMITED).",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    const r = res.rows[0];
    return {
      version: r.version,
      content: r.content,
      updatedAt: new Date(r.updatedAt).toISOString()
    };
  }
  async recordTermsAcceptance(userId, termsVersion) {
    await pool.query(
      `INSERT INTO terms_acceptances (user_id, terms_version, accepted_at)
       VALUES ($1, $2, NOW())`,
      [userId, termsVersion]
    );
  }
  // --- SERVICES ---
  async getServices() {
    const res = await pool.query(
      `SELECT id, code, name, description, price_tzs as "priceTzs", is_active as "isActive",
              input_requirement as "inputRequirement", result_type as "resultType",
              department_id as "departmentId", updated_at as "updatedAt"
       FROM services ORDER BY id ASC`
    );
    return res.rows.map((r) => ({
      ...r,
      updatedAt: new Date(r.updatedAt).toISOString()
    }));
  }
  async updateServicePrice(serviceId, newPriceTzs, actor) {
    const res = await pool.query(
      `UPDATE services SET price_tzs = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, code, name, description, price_tzs as "priceTzs", is_active as "isActive",
                 input_requirement as "inputRequirement", result_type as "resultType",
                 department_id as "departmentId", updated_at as "updatedAt"`,
      [newPriceTzs, serviceId]
    );
    if (res.rowCount === 0) return null;
    await this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: "SUPER_ADMIN",
      action: "SERVICE_PRICE_UPDATED",
      target: `SERVICE:${serviceId}`,
      targetId: serviceId,
      details: `Super Admin changed price to TSh ${newPriceTzs.toLocaleString()}`
    });
    const r = res.rows[0];
    return {
      ...r,
      updatedAt: new Date(r.updatedAt).toISOString()
    };
  }
  // --- CUSTOMER CREDIT & TRANSACTION-SAFE LEDGER ---
  async getCustomerCredit(userId) {
    const res = await pool.query(
      `SELECT balance_tzs FROM credit_accounts WHERE user_id = $1`,
      [userId]
    );
    if (res.rowCount === 0) return 0;
    return Number(res.rows[0].balance_tzs) || 0;
  }
  async getCustomerLedger(userId) {
    const res = await pool.query(
      `SELECT id, user_id as "userId", type, amount, balance_before as "balanceBefore",
              balance_after as "balanceAfter", request_id as "requestId",
              actor_id as "actorId", actor_name as "actorName", actor_role as "actorRole",
              reason, reference, timestamp
       FROM credit_ledger WHERE user_id = $1 ORDER BY timestamp DESC`,
      [userId]
    );
    return res.rows.map((r) => ({
      ...r,
      timestamp: new Date(r.timestamp).toISOString()
    }));
  }
  async getAllCreditLedger() {
    const res = await pool.query(
      `SELECT id, user_id as "userId", type, amount, balance_before as "balanceBefore",
              balance_after as "balanceAfter", request_id as "requestId",
              actor_id as "actorId", actor_name as "actorName", actor_role as "actorRole",
              reason, reference, timestamp
       FROM credit_ledger ORDER BY timestamp DESC LIMIT 100`
    );
    return res.rows.map((r) => ({
      ...r,
      timestamp: new Date(r.timestamp).toISOString()
    }));
  }
  // Atomic, Row-Locked Credit ADD
  async addCustomerCredit(params) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const accRes = await client.query(
        `SELECT balance_tzs FROM credit_accounts WHERE user_id = $1 FOR UPDATE`,
        [params.userId]
      );
      let balanceBefore = 0;
      if (accRes.rowCount === 0) {
        await client.query(
          `INSERT INTO credit_accounts (user_id, balance_tzs, updated_at) VALUES ($1, 0, NOW())`,
          [params.userId]
        );
      } else {
        balanceBefore = Number(accRes.rows[0].balance_tzs) || 0;
      }
      const balanceAfter = balanceBefore + params.amount;
      if (balanceAfter < 0) {
        throw new Error(`Salio la mteja haliwezi kuwa chini ya sifuri (Negative Balance Protection). Salio la sasa: TSh ${balanceBefore.toLocaleString()}, kiasi cha kupunguza: TSh ${Math.abs(params.amount).toLocaleString()}.`);
      }
      await client.query(
        `UPDATE credit_accounts SET balance_tzs = $1, updated_at = NOW() WHERE user_id = $2`,
        [balanceAfter, params.userId]
      );
      const ledgerId = `c_led_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = /* @__PURE__ */ new Date();
      const ledgerType = params.amount >= 0 ? "ADD" : "ADJUSTMENT";
      await client.query(
        `INSERT INTO credit_ledger (id, user_id, type, amount, balance_before, balance_after, request_id, actor_id, actor_name, actor_role, reason, reference, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          ledgerId,
          params.userId,
          ledgerType,
          params.amount,
          balanceBefore,
          balanceAfter,
          null,
          params.actorId,
          params.actorName,
          params.actorRole,
          params.reason,
          params.reference,
          now
        ]
      );
      const entry = {
        id: ledgerId,
        userId: params.userId,
        type: ledgerType,
        amount: params.amount,
        balanceBefore,
        balanceAfter,
        actorId: params.actorId,
        actorName: params.actorName,
        actorRole: params.actorRole,
        reason: params.reason,
        reference: params.reference,
        timestamp: now.toISOString()
      };
      await client.query("COMMIT");
      return { balanceAfter, ledgerEntry: entry };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  // Atomic, Row-Locked Credit CHARGE (Prevents double spending & negative balance)
  async chargeCustomerCredit(params) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const accRes = await client.query(
        `SELECT balance_tzs FROM credit_accounts WHERE user_id = $1 FOR UPDATE`,
        [params.userId]
      );
      if (accRes.rowCount === 0) {
        throw new Error("Akaunti ya Credit haikupatikana.");
      }
      const balanceBefore = Number(accRes.rows[0].balance_tzs) || 0;
      if (balanceBefore < params.amount) {
        throw new Error("SALIO LA CREDIT HALITOSHI. Tafadhali ongeza salio kwanza ili uweze kutuma ombi hili.");
      }
      const balanceAfter = balanceBefore - params.amount;
      await client.query(
        `UPDATE credit_accounts SET balance_tzs = $1, updated_at = NOW() WHERE user_id = $2`,
        [balanceAfter, params.userId]
      );
      const ledgerId = `c_led_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const ref = `CHARGE_${params.requestId}`;
      const now = /* @__PURE__ */ new Date();
      await client.query(
        `INSERT INTO credit_ledger (id, user_id, type, amount, balance_before, balance_after, request_id, actor_id, actor_name, actor_role, reason, reference, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          ledgerId,
          params.userId,
          "CHARGE",
          params.amount,
          balanceBefore,
          balanceAfter,
          params.requestId,
          params.actorId,
          params.actorName,
          params.actorRole,
          params.reason,
          ref,
          now
        ]
      );
      const entry = {
        id: ledgerId,
        userId: params.userId,
        type: "CHARGE",
        amount: params.amount,
        balanceBefore,
        balanceAfter,
        requestId: params.requestId,
        actorId: params.actorId,
        actorName: params.actorName,
        actorRole: params.actorRole,
        reason: params.reason,
        reference: ref,
        timestamp: now.toISOString()
      };
      await client.query("COMMIT");
      return { balanceAfter, ledgerEntry: entry };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  // Atomic REFUND with Idempotency Protection
  async refundCustomerCredit(params) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const existingRefund = await client.query(
        `SELECT id FROM credit_ledger WHERE request_id = $1 AND type = 'REFUND'`,
        [params.requestId]
      );
      if (existingRefund.rowCount !== null && existingRefund.rowCount > 0) {
        throw new Error("Ombi hili lilikwishafanyiwa refund tayari.");
      }
      const accRes = await client.query(
        `SELECT balance_tzs FROM credit_accounts WHERE user_id = $1 FOR UPDATE`,
        [params.userId]
      );
      let balanceBefore = 0;
      if (accRes.rowCount === 0) {
        await client.query(
          `INSERT INTO credit_accounts (user_id, balance_tzs, updated_at) VALUES ($1, 0, NOW())`,
          [params.userId]
        );
      } else {
        balanceBefore = Number(accRes.rows[0].balance_tzs) || 0;
      }
      const balanceAfter = balanceBefore + params.amount;
      await client.query(
        `UPDATE credit_accounts SET balance_tzs = $1, updated_at = NOW() WHERE user_id = $2`,
        [balanceAfter, params.userId]
      );
      const ledgerId = `c_led_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const ref = `REFUND_${params.requestId}`;
      const now = /* @__PURE__ */ new Date();
      await client.query(
        `INSERT INTO credit_ledger (id, user_id, type, amount, balance_before, balance_after, request_id, actor_id, actor_name, actor_role, reason, reference, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          ledgerId,
          params.userId,
          "REFUND",
          params.amount,
          balanceBefore,
          balanceAfter,
          params.requestId,
          params.actorId,
          params.actorName,
          params.actorRole,
          params.reason,
          ref,
          now
        ]
      );
      await client.query(
        `UPDATE requests SET refund_status = 'REFUNDED', refunded_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [params.requestId]
      );
      const entry = {
        id: ledgerId,
        userId: params.userId,
        type: "REFUND",
        amount: params.amount,
        balanceBefore,
        balanceAfter,
        requestId: params.requestId,
        actorId: params.actorId,
        actorName: params.actorName,
        actorRole: params.actorRole,
        reason: params.reason,
        reference: ref,
        timestamp: now.toISOString()
      };
      await client.query("COMMIT");
      return { balanceAfter, ledgerEntry: entry };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  // --- WORK ACCOUNT (ADMIN & SUPER ADMIN) ---
  async getAdminWorkCredit(workerId) {
    const res = await pool.query(
      `SELECT balance_tzs FROM admin_work_credit_accounts WHERE admin_id = $1`,
      [workerId]
    );
    if (res.rowCount === 0) return 0;
    return Number(res.rows[0].balance_tzs) || 0;
  }
  async getSuperAdminWorkCredit(superAdminId) {
    const res = await pool.query(
      `SELECT balance_tzs FROM super_admin_work_credit_accounts WHERE super_admin_id = $1`,
      [superAdminId]
    );
    if (res.rowCount === 0) return 0;
    return Number(res.rows[0].balance_tzs) || 0;
  }
  async getAdminWorkLedger(workerId) {
    const res = await pool.query(
      `SELECT id, admin_id as "adminId", type, amount, balance_before as "balanceBefore",
              balance_after as "balanceAfter", request_id as "requestId",
              actor_id as "actorId", actor_name as "actorName", actor_role as "actorRole",
              reason, reference, timestamp
       FROM admin_work_credit_ledger WHERE admin_id = $1 ORDER BY timestamp DESC`,
      [workerId]
    );
    return res.rows.map((r) => ({
      ...r,
      timestamp: new Date(r.timestamp).toISOString()
    }));
  }
  async getSuperAdminWorkLedger(superAdminId) {
    const res = await pool.query(
      `SELECT id, super_admin_id as "superAdminId", amount, balance_before as "balanceBefore",
              balance_after as "balanceAfter", request_id as "requestId",
              actor_id as "actorId", actor_name as "actorName", actor_role as "actorRole",
              reason, reference, timestamp
       FROM super_admin_work_credit_ledger WHERE super_admin_id = $1 ORDER BY timestamp DESC`,
      [superAdminId]
    );
    return res.rows.map((r) => ({
      ...r,
      timestamp: new Date(r.timestamp).toISOString()
    }));
  }
  async creditWorkerEarning(params) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const isSuper = params.workerRole === "SUPER_ADMIN";
      const table = isSuper ? "super_admin_work_credit_accounts" : "admin_work_credit_accounts";
      const colId = isSuper ? "super_admin_id" : "admin_id";
      const ledgerTable = isSuper ? "super_admin_work_credit_ledger" : "admin_work_credit_ledger";
      const accRes = await client.query(
        `SELECT balance_tzs FROM ${table} WHERE ${colId} = $1 FOR UPDATE`,
        [params.workerId]
      );
      let balanceBefore = 0;
      if (accRes.rowCount === 0) {
        await client.query(
          `INSERT INTO ${table} (${colId}, balance_tzs, updated_at) VALUES ($1, 0, NOW())`,
          [params.workerId]
        );
      } else {
        balanceBefore = Number(accRes.rows[0].balance_tzs) || 0;
      }
      const balanceAfter = balanceBefore + params.amount;
      await client.query(
        `UPDATE ${table} SET balance_tzs = $1, updated_at = NOW() WHERE ${colId} = $2`,
        [balanceAfter, params.workerId]
      );
      const ledgerId = `w_led_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const ref = `WORK_PAYOUT_${params.requestId}`;
      if (isSuper) {
        await client.query(
          `INSERT INTO ${ledgerTable} (id, super_admin_id, amount, balance_before, balance_after, request_id, actor_id, actor_name, actor_role, reason, reference, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
          [ledgerId, params.workerId, params.amount, balanceBefore, balanceAfter, params.requestId, params.actorId, params.actorName, "SUPER_ADMIN", params.reason, ref]
        );
      } else {
        await client.query(
          `INSERT INTO ${ledgerTable} (id, admin_id, type, amount, balance_before, balance_after, request_id, actor_id, actor_name, actor_role, reason, reference, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
          [ledgerId, params.workerId, "WORK_EARNING", params.amount, balanceBefore, balanceAfter, params.requestId, params.actorId, params.actorName, "ADMIN", params.reason, ref]
        );
      }
      await client.query("COMMIT");
      return { balanceAfter };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  // --- ADMIN WORK ACCOUNT PAYOUT (PAY ACTION) ---
  async payAdminWorkBalance(params) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (params.amount <= 0) {
        throw new Error("Kiasi cha malipo lazima kiwe zaidi ya 0.");
      }
      const accRes = await client.query(
        `SELECT balance_tzs FROM admin_work_credit_accounts WHERE admin_id = $1 FOR UPDATE`,
        [params.adminId]
      );
      if (accRes.rowCount === 0) {
        throw new Error("Akaunti ya kazi ya mtendaji haikupatikana.");
      }
      const balanceBefore = Number(accRes.rows[0].balance_tzs) || 0;
      if (params.amount > balanceBefore) {
        throw new Error(`Kiasi cha malipo (TSh ${params.amount.toLocaleString()}) hakiwezi kuzidi salio lililopo la kazi (TSh ${balanceBefore.toLocaleString()}).`);
      }
      const balanceAfter = balanceBefore - params.amount;
      await client.query(
        `UPDATE admin_work_credit_accounts SET balance_tzs = $1, updated_at = NOW() WHERE admin_id = $2`,
        [balanceAfter, params.adminId]
      );
      const ledgerId = `w_pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const ref = params.reference || `PAYOUT_${Date.now()}`;
      const now = /* @__PURE__ */ new Date();
      await client.query(
        `INSERT INTO admin_work_credit_ledger (id, admin_id, type, amount, balance_before, balance_after, request_id, actor_id, actor_name, actor_role, reason, reference, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          ledgerId,
          params.adminId,
          "WITHDRAWAL",
          params.amount,
          balanceBefore,
          balanceAfter,
          null,
          params.actorId,
          params.actorName,
          "SUPER_ADMIN",
          params.reason,
          ref,
          now
        ]
      );
      const entry = {
        id: ledgerId,
        workerId: params.adminId,
        adminId: params.adminId,
        amount: params.amount,
        balanceBefore,
        balanceAfter,
        requestId: "",
        actorId: params.actorId,
        actorName: params.actorName,
        actorRole: "SUPER_ADMIN",
        reason: params.reason,
        reference: ref,
        timestamp: now.toISOString()
      };
      await this.addAuditLog({
        actorId: params.actorId,
        actorName: params.actorName,
        actorRole: "SUPER_ADMIN",
        action: "ADMIN_WORK_PAYMENT_CONFIRMED",
        target: `ADMIN_WORK:${params.adminId}`,
        targetId: params.adminId,
        details: `Super Admin confirmed payment of TSh ${params.amount.toLocaleString()} to Admin ${params.adminId}. Remaining balance: TSh ${balanceAfter.toLocaleString()}. Ref: ${ref}.`
      });
      await client.query("COMMIT");
      return { balanceAfter, paidAmount: params.amount, ledgerEntry: entry };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  // --- REQUESTS (APPLICATIONS) ---
  async createRequest(request) {
    const res = await pool.query(
      `INSERT INTO requests (id, customer_id, customer_name, customer_phone, service_id, service_code, service_name, target_phone_number, charged_price_tzs, status, claimed_by_worker_id, claimed_by_worker_name, claimed_by_worker_role, claimed_at, completed_at, rejected_at, nida_result, rejection_reason, refund_status, refunded_at, is_deleted_by_customer, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
       RETURNING *`,
      [
        request.id,
        request.customerId,
        request.customerName,
        request.customerPhone,
        request.serviceId,
        request.serviceCode,
        request.serviceName,
        request.targetPhoneNumber,
        request.chargedPriceTzs,
        request.status,
        request.claimedByWorkerId || null,
        request.claimedByWorkerName || null,
        request.claimedByWorkerRole || null,
        request.claimedAt ? new Date(request.claimedAt) : null,
        request.completedAt ? new Date(request.completedAt) : null,
        request.rejectedAt ? new Date(request.rejectedAt) : null,
        request.nidaResult || null,
        request.rejectionReason || null,
        request.refundStatus || "NONE",
        request.refundedAt ? new Date(request.refundedAt) : null,
        request.isDeletedByCustomer || false,
        new Date(request.createdAt || Date.now()),
        new Date(request.updatedAt || Date.now())
      ]
    );
    return this.mapRequestRow(res.rows[0]);
  }
  async getRequests(options) {
    const where = [];
    const values = [];
    let idx = 1;
    if (options?.customerId) {
      where.push(`customer_id = $${idx++}`);
      values.push(options.customerId);
    }
    if (options?.workerId) {
      where.push(`claimed_by_worker_id = $${idx++}`);
      values.push(options.workerId);
    }
    if (options?.status) {
      where.push(`status = $${idx++}`);
      values.push(options.status);
    }
    if (!options?.includeDeletedByCustomer) {
      where.push(`is_deleted_by_customer = false`);
    }
    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const res = await pool.query(
      `SELECT * FROM requests ${whereClause} ORDER BY created_at DESC`,
      values
    );
    return res.rows.map((r) => this.mapRequestRow(r));
  }
  async getRequestById(id) {
    const res = await pool.query(`SELECT * FROM requests WHERE id = $1`, [id]);
    if (res.rowCount === 0) return null;
    return this.mapRequestRow(res.rows[0]);
  }
  async claimRequest(params) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const reqRes = await client.query(
        `SELECT * FROM requests WHERE id = $1 FOR UPDATE`,
        [params.requestId]
      );
      if (reqRes.rowCount === 0) {
        return { success: false, error: "Ombi halikupatikana." };
      }
      const current = reqRes.rows[0];
      if (current.status !== "PENDING") {
        return { success: false, error: "Ombi hili tayari limechukuliwa au kusindikwa na mtumiaji mwingine." };
      }
      const now = /* @__PURE__ */ new Date();
      const updateRes = await client.query(
        `UPDATE requests SET
           status = 'PROCESSING',
           claimed_by_worker_id = $1,
           claimed_by_worker_name = $2,
           claimed_by_worker_role = $3,
           claimed_at = $4,
           updated_at = $4
         WHERE id = $5
         RETURNING *`,
        [params.workerId, params.workerName, params.workerRole, now, params.requestId]
      );
      await client.query("COMMIT");
      return { success: true, request: this.mapRequestRow(updateRes.rows[0]) };
    } catch (err) {
      await client.query("ROLLBACK");
      return { success: false, error: err.message || "Hitilafu ya kudai ombi." };
    } finally {
      client.release();
    }
  }
  async completeRequest(params) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const reqRes = await client.query(
        `SELECT * FROM requests WHERE id = $1 FOR UPDATE`,
        [params.requestId]
      );
      if (reqRes.rowCount === 0) {
        return { success: false, error: "Ombi halikupatikana." };
      }
      const current = reqRes.rows[0];
      if (current.status !== "PROCESSING") {
        return { success: false, error: "Ombi haliko katika hali ya kufanyiwa kazi." };
      }
      const now = /* @__PURE__ */ new Date();
      const updateRes = await client.query(
        `UPDATE requests SET
           status = 'APPROVED',
           nida_result = $1,
           completed_at = $2,
           updated_at = $2
         WHERE id = $3
         RETURNING *`,
        [params.nidaResult, now, params.requestId]
      );
      await this.creditWorkerEarning({
        workerId: current.claimed_by_worker_id,
        workerRole: current.claimed_by_worker_role,
        amount: current.charged_price_tzs || 100,
        requestId: params.requestId,
        actorId: params.workerId,
        actorName: current.claimed_by_worker_name,
        reason: `Malipo ya kukamilisha ombi la NIDA ${params.requestId}`
      });
      await client.query("COMMIT");
      return { success: true, request: this.mapRequestRow(updateRes.rows[0]) };
    } catch (err) {
      await client.query("ROLLBACK");
      return { success: false, error: err.message || "Hitilafu ya kukamilisha ombi." };
    } finally {
      client.release();
    }
  }
  async rejectRequest(params) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const reqRes = await client.query(
        `SELECT * FROM requests WHERE id = $1 FOR UPDATE`,
        [params.requestId]
      );
      if (reqRes.rowCount === 0) {
        await client.query("ROLLBACK");
        return { success: false, error: "Ombi halikupatikana." };
      }
      const current = reqRes.rows[0];
      if (current.status !== "PENDING" && current.status !== "PROCESSING") {
        await client.query("ROLLBACK");
        return {
          success: false,
          error: `Ombi haliko katika hali inayoweza kukataliwa. Hali ya sasa ni: ${current.status}.`
        };
      }
      const refundAmount = Number(current.charged_price_tzs) || 100;
      const workerName = params.workerName || current.claimed_by_worker_name || "Admin";
      const workerRole = params.workerRole || current.claimed_by_worker_role || "ADMIN";
      const refundReason = `Marejesho (Refund): Ombi lilikataliwa kwa sababu - ${params.rejectionReason}`;
      const existingRefund = await client.query(
        `SELECT id FROM credit_ledger WHERE request_id = $1 AND type = 'REFUND'`,
        [params.requestId]
      );
      const alreadyRefunded = existingRefund.rowCount !== null && existingRefund.rowCount > 0 || current.refund_status === "REFUNDED";
      if (!alreadyRefunded && refundAmount > 0) {
        const accRes = await client.query(
          `SELECT balance_tzs FROM credit_accounts WHERE user_id = $1 FOR UPDATE`,
          [current.customer_id]
        );
        let balanceBefore = 0;
        if (accRes.rowCount === 0) {
          await client.query(
            `INSERT INTO credit_accounts (user_id, balance_tzs, updated_at) VALUES ($1, 0, NOW())`,
            [current.customer_id]
          );
        } else {
          balanceBefore = Number(accRes.rows[0].balance_tzs) || 0;
        }
        const balanceAfter = balanceBefore + refundAmount;
        await client.query(
          `UPDATE credit_accounts SET balance_tzs = $1, updated_at = NOW() WHERE user_id = $2`,
          [balanceAfter, current.customer_id]
        );
        const ledgerId = `c_led_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const ref = `REFUND_${params.requestId}`;
        const now = /* @__PURE__ */ new Date();
        await client.query(
          `INSERT INTO credit_ledger (id, user_id, type, amount, balance_before, balance_after, request_id, actor_id, actor_name, actor_role, reason, reference, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            ledgerId,
            current.customer_id,
            "REFUND",
            refundAmount,
            balanceBefore,
            balanceAfter,
            params.requestId,
            params.workerId,
            workerName,
            workerRole,
            refundReason,
            ref,
            now
          ]
        );
      }
      const updateRes = await client.query(
        `UPDATE requests SET
           status = 'REJECTED',
           rejection_reason = $1,
           rejected_at = NOW(),
           refund_status = 'REFUNDED',
           refunded_at = COALESCE(refunded_at, NOW()),
           updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [params.rejectionReason, params.requestId]
      );
      await client.query("COMMIT");
      return { success: true, request: this.mapRequestRow(updateRes.rows[0]) };
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("[REJECT REQUEST ERROR]:", err);
      return { success: false, error: err.message || "Hitilafu ya kukataa ombi." };
    } finally {
      client.release();
    }
  }
  // SOFT DELETION for customer self-service safety
  async deleteCustomerRequest(requestId, customerId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const reqRes = await client.query(
        `SELECT * FROM requests WHERE id = $1 AND customer_id = $2 FOR UPDATE`,
        [requestId, customerId]
      );
      if (reqRes.rowCount === 0) {
        return { success: false, error: "Ombi halikupatikana au huna idhini nalo." };
      }
      const current = reqRes.rows[0];
      if (current.status === "PENDING") {
        await this.refundCustomerCredit({
          userId: customerId,
          amount: current.charged_price_tzs,
          requestId: current.id,
          actorId: customerId,
          actorName: current.customer_name,
          actorRole: "CUSTOMER",
          reason: "Mteja amefuta ombi lililokuwa linasubiri (Cancellation refund)."
        });
      }
      await client.query(
        `UPDATE requests SET
           is_deleted_by_customer = true,
           deleted_at = NOW(),
           deleted_by = $1,
           updated_at = NOW()
         WHERE id = $2`,
        [customerId, requestId]
      );
      await this.addAuditLog({
        actorId: customerId,
        actorName: current.customer_name,
        actorRole: "CUSTOMER",
        action: "CUSTOMER_REQUEST_SOFT_DELETED",
        target: `REQUEST:${requestId}`,
        targetId: requestId,
        details: `Customer soft-deleted request ${requestId}. Financial ledger and history safely preserved.`
      });
      await client.query("COMMIT");
      return { success: true };
    } catch (err) {
      await client.query("ROLLBACK");
      return { success: false, error: err.message || "Hitilafu ya kufuta ombi." };
    } finally {
      client.release();
    }
  }
  // Soft deactivate customer
  async deleteCustomerAccountManual(params) {
    const user = await this.getUserById(params.customerId);
    if (!user) return { success: false, error: "Mteja hakupatikana." };
    if (user.role === "SUPER_ADMIN" || user.phone === "255748604483") {
      return { success: false, error: "Huwezi kufuta akaunti ya Super Admin." };
    }
    await pool.query(
      `UPDATE users SET status = 'DISABLED', updated_at = NOW() WHERE id = $1`,
      [params.customerId]
    );
    await this.addAuditLog({
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: "SUPER_ADMIN",
      action: "CUSTOMER_ACCOUNT_DISABLED_MANUAL",
      target: `USER:${user.id}`,
      targetId: user.id,
      details: `Super Admin ${params.actorName} deactivated customer ${user.fullName} (${user.phone}). Reason: ${params.reason}. Financial records preserved.`
    });
    return { success: true };
  }
  async checkAndExpireTimedOutRequests() {
    try {
      const settings2 = await this.getSettings();
      const timeoutMinutes = Number(settings2.requestTimeoutMinutes) || 15;
      const res = await pool.query(
        `SELECT id, customer_id as "customerId", customer_name as "customerName", charged_price_tzs as "chargedPriceTzs", target_phone_number as "targetPhoneNumber"
         FROM requests
         WHERE status = 'PENDING'
           AND created_at < NOW() - ($1 || ' minutes')::interval`,
        [timeoutMinutes]
      );
      let expiredCount = 0;
      for (const row of res.rows) {
        const requestId = row.id;
        const customerId = row.customerId;
        const amount = Number(row.chargedPriceTzs) || 0;
        await pool.query(
          `UPDATE requests
           SET status = 'EXPIRED',
               refund_status = 'COMPLETED',
               updated_at = NOW()
           WHERE id = $1 AND status = 'PENDING'`,
          [requestId]
        );
        if (amount > 0) {
          await this.refundCustomerCredit({
            userId: customerId,
            amount,
            requestId,
            actorId: "system",
            actorName: "Mfumo wa RAVINI (Timeout)",
            actorRole: "SUPER_ADMIN",
            reason: `Rejesho la moja kwa moja: Ombi ${requestId} limeisha muda (${timeoutMinutes} dakika).`
          }).catch((err) => console.error("[EXPIRE REFUND ERROR]:", err));
        }
        await this.addAuditLog({
          actorId: "system",
          actorName: "Mfumo wa RAVINI (Timeout)",
          actorRole: "SUPER_ADMIN",
          action: "REQUEST_EXPIRED",
          target: `REQUEST:${requestId}`,
          targetId: requestId,
          details: `Ombi ${requestId} limepitisha muda wa dakika ${timeoutMinutes} bila kushughulikiwa. Hali imebadilika kuwa EXPIRED na TSh ${amount} zimerudishwa kwa mteja.`
        }).catch(() => {
        });
        await this.createNotification({
          userId: customerId,
          title: "Ombi Limeisha Muda",
          message: `Ombi lako la namba ${row.targetPhoneNumber} limeisha muda wa kushughulikiwa (${timeoutMinutes} dakika). TSh ${amount} zimerudishwa kwenye salio lako. Bofya "Tuma Tena Ombi" ikiwa bado unahitaji huduma.`,
          type: "WARNING",
          url: "/customer/requests"
        }).catch(() => {
        });
        pushService.sendNotificationToUser(customerId, {
          title: "Ombi Limeisha Muda",
          message: `Ombi lako la ${row.targetPhoneNumber} limeisha muda. Salio lako limerejeshwa.`,
          url: "/customer/requests",
          type: "WARNING"
        }).catch(() => {
        });
        expiredCount++;
      }
      return expiredCount;
    } catch (err) {
      console.error("[EXPIRE TIMEOUT ERROR]:", err);
      return 0;
    }
  }
  async deleteUserWithSevenDayRestriction(userId, actor) {
    const user = await this.getUserById(userId);
    if (!user) return { success: false, message: "Mtumiaji hakupatikana." };
    if (user.role === "SUPER_ADMIN" || user.phone === "255748604483") {
      return { success: false, message: "Akaunti ya Super Admin haiwezi kufutwa." };
    }
    const normPhone = normalizePhone(user.phone);
    try {
      const restRes = await pool.query(`SELECT value FROM settings WHERE key = 'deleted_phone_restrictions'`);
      let restrictions = [];
      if (restRes.rowCount && restRes.rowCount > 0) {
        restrictions = typeof restRes.rows[0].value === "string" ? JSON.parse(restRes.rows[0].value) : restRes.rows[0].value;
      }
      const now = Date.now();
      restrictions = (Array.isArray(restrictions) ? restrictions : []).filter(
        (r) => new Date(r.expiresAt).getTime() > now && r.phone !== normPhone
      );
      restrictions.push({
        phone: normPhone,
        deletedAt: (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1e3).toISOString(),
        actorName: actor.name
      });
      await pool.query(
        `INSERT INTO settings (key, value, updated_at)
         VALUES ('deleted_phone_restrictions', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [JSON.stringify(restrictions)]
      );
    } catch (e) {
      console.error("[RESTRICTION SAVE ERROR]:", e);
    }
    await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
    await this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: "SUPER_ADMIN",
      action: "ACCOUNT_DELETED",
      target: `USER:${userId}`,
      targetId: userId,
      details: `Super Admin ${actor.name} alifuta akaunti ya ${user.fullName} (${user.phone}). Usajili mpya umezuiwa kwa siku 7.`
    });
    try {
      await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    } catch (delErr) {
      await pool.query(`UPDATE users SET status = 'DELETED', updated_at = NOW() WHERE id = $1`, [userId]);
    }
    return {
      success: true,
      message: `Akaunti ya ${user.fullName} imefutwa kikamilifu. Namba hii imezuiwa kujisajili upya kwa siku 7.`
    };
  }
  async markUserForDeletion(userId, actor) {
    const user = await this.getUserById(userId);
    if (!user) return { success: false, message: "Mtumiaji hakupatikana." };
    if (user.role === "SUPER_ADMIN") {
      return { success: false, message: "Huwezi kufuta akaunti ya Super Admin." };
    }
    const now = /* @__PURE__ */ new Date();
    const scheduled = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1e3);
    await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
    await pool.query(
      `UPDATE users
       SET status = 'MARKED_FOR_DELETION',
           marked_for_deletion_at = $1,
           scheduled_permanent_deletion_at = $2,
           deletion_initiated_by = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [now, scheduled, actor.name, userId]
    );
    await this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: "SUPER_ADMIN",
      action: "ACCOUNT_MARKED_FOR_DELETION",
      target: `USER:${userId}`,
      targetId: userId,
      details: `Super Admin ${actor.name} alianzisha ufutaji wa akaunti ya ${user.fullName} (${user.phone}). Akaunti imeingia kwenye Grace Period ya siku 7 (hadi ${scheduled.toISOString()}). Sessions zimefungwa.`
    });
    const updatedUser = await this.getUserById(userId);
    return {
      success: true,
      message: `Akaunti ya ${user.fullName} imewekwa MARKED_FOR_DELETION na kuingia kwenye Grace Period ya siku 7. Mtumiaji hawezi kuingia. Unaweza kuirejesha (Restore) wakati wowote kabla ya siku 7.`,
      user: updatedUser || void 0
    };
  }
  async restoreUserFromDeletion(userId, actor) {
    const user = await this.getUserById(userId);
    if (!user) return { success: false, message: "Mtumiaji hakupatikana." };
    if (user.status !== "MARKED_FOR_DELETION") {
      return { success: false, message: "Akaunti hii haipo kwenye hatua ya MARKED_FOR_DELETION." };
    }
    await pool.query(
      `UPDATE users
       SET status = 'ACTIVE',
           marked_for_deletion_at = NULL,
           scheduled_permanent_deletion_at = NULL,
           deletion_initiated_by = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );
    await this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: "SUPER_ADMIN",
      action: "ACCOUNT_RESTORED",
      target: `USER:${userId}`,
      targetId: userId,
      details: `Super Admin ${actor.name} alirejesha akaunti ya ${user.fullName} (${user.phone}) kuwa ACTIVE.`
    });
    const updatedUser = await this.getUserById(userId);
    return {
      success: true,
      message: `Akaunti ya ${user.fullName} imerejeshwa kikamilifu kuwa ACTIVE. Mtumiaji anaweza kuingia sasa na kuendelea kutumia mfumo.`,
      user: updatedUser || void 0
    };
  }
  async permanentlyDeleteUser(userId, actor, force = false) {
    const user = await this.getUserById(userId);
    if (!user) return { success: false, message: "Mtumiaji hakupatikana." };
    if (user.role === "SUPER_ADMIN") {
      return { success: false, message: "Huwezi kufuta akaunti ya Super Admin." };
    }
    if (!force && user.status !== "MARKED_FOR_DELETION") {
      return { success: false, message: "Akaunti lazima iwe MARKED_FOR_DELETION kwanza kabla ya kufutwa kabisa." };
    }
    await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
    try {
      const normPhone = normalizePhone(user.phone);
      const restRes = await pool.query(`SELECT value FROM settings WHERE key = 'deleted_phone_restrictions'`);
      let restrictions = [];
      if (restRes.rowCount && restRes.rowCount > 0) {
        restrictions = typeof restRes.rows[0].value === "string" ? JSON.parse(restRes.rows[0].value) : restRes.rows[0].value;
      }
      restrictions = restrictions.filter(
        (r) => r.phone !== normPhone && new Date(r.expiresAt).getTime() > Date.now()
      );
      restrictions.push({
        phone: normPhone,
        deletedAt: (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString(),
        actorName: actor.name
      });
      await pool.query(
        `INSERT INTO settings (key, value, updated_at)
         VALUES ('deleted_phone_restrictions', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [JSON.stringify(restrictions)]
      );
    } catch (e) {
      console.error("[RESTRICTION SAVE ERROR]:", e);
    }
    await this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: "SUPER_ADMIN",
      action: "ACCOUNT_DELETED_PERMANENTLY",
      target: `USER:${userId}`,
      targetId: userId,
      details: `Super Admin ${actor.name} alifuta kabisa akaunti ya ${user.fullName} (${user.phone}). Ufutaji wa kudumu umekamilika.`
    });
    try {
      await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    } catch (delErr) {
      await pool.query(`UPDATE users SET status = 'DELETED', updated_at = NOW() WHERE id = $1`, [userId]);
    }
    return {
      success: true,
      message: `Akaunti ya ${user.fullName} imefutwa kabisa (PERMANENT DELETION).`
    };
  }
  async purgeExpiredMarkedForDeletionUsers() {
    try {
      const res = await pool.query(
        `SELECT id, full_name as "fullName", phone
         FROM users
         WHERE status = 'MARKED_FOR_DELETION'
           AND scheduled_permanent_deletion_at IS NOT NULL
           AND scheduled_permanent_deletion_at <= NOW()`
      );
      if (!res.rowCount || res.rowCount === 0) return 0;
      let count = 0;
      for (const row of res.rows) {
        await this.permanentlyDeleteUser(row.id, { id: "system_auto_purge", name: "Mfumo wa Kisheria (Grace Period Expired)" }, true);
        count++;
      }
      return count;
    } catch (e) {
      console.error("[PURGE EXPIRED ERROR]:", e);
      return 0;
    }
  }
  async isPhoneRestrictedByDeletion(phone) {
    const norm = normalizePhone(phone);
    try {
      const restRes = await pool.query(`SELECT value FROM settings WHERE key = 'deleted_phone_restrictions'`);
      if (restRes.rowCount && restRes.rowCount > 0) {
        const restrictions = typeof restRes.rows[0].value === "string" ? JSON.parse(restRes.rows[0].value) : restRes.rows[0].value;
        if (Array.isArray(restrictions)) {
          const match = restrictions.find((r) => r.phone === norm && new Date(r.expiresAt).getTime() > Date.now());
          if (match) {
            return { restricted: true, expiresAt: match.expiresAt };
          }
        }
      }
    } catch (e) {
    }
    return { restricted: false };
  }
  async updateAdminCreditPermission(adminId, canAddCredit, actor) {
    const user = await this.getUserById(adminId);
    if (!user) return { success: false, error: "Admin hakupatikana." };
    if (user.role !== "ADMIN") return { success: false, error: "Mtumiaji huyu si Admin." };
    let permissions = Array.isArray(user.permissions) ? [...user.permissions] : [];
    if (canAddCredit) {
      if (!permissions.includes("CAN_ADD_CREDIT")) {
        permissions.push("CAN_ADD_CREDIT");
      }
    } else {
      permissions = permissions.filter((p) => p !== "CAN_ADD_CREDIT");
    }
    const updated = await this.updateUser(adminId, { permissions });
    await this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: "SUPER_ADMIN",
      action: canAddCredit ? "ADMIN_CREDIT_PERMISSION_GRANTED" : "ADMIN_CREDIT_PERMISSION_REVOKED",
      target: `ADMIN:${adminId}`,
      targetId: adminId,
      details: `Super Admin ${actor.name} ${canAddCredit ? "alitoa" : "aliondoa"} ruhusa ya kuongeza Credit kwa Admin ${user.fullName} (${user.phone}).`
    });
    return { success: true, user: updated || void 0 };
  }
  async cleanupHistoryManual(params) {
    const cutoff = new Date(Date.now() - params.olderThanDays * 24 * 60 * 60 * 1e3);
    let count = 0;
    if (params.category === "NOTIFICATIONS") {
      const res = await pool.query(
        `DELETE FROM notifications WHERE created_at < $1`,
        [cutoff]
      );
      count = res.rowCount || 0;
    } else if (params.category === "SESSIONS") {
      const res = await pool.query(
        `DELETE FROM sessions WHERE created_at < $1 AND is_revoked = true`,
        [cutoff]
      );
      count = res.rowCount || 0;
    } else {
      return { success: false, affectedCount: 0, error: "Aina hii ya data hairuhusiwi kufutwa." };
    }
    await this.addAuditLog({
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: "SUPER_ADMIN",
      action: "MANUAL_HISTORY_CLEANUP",
      target: params.category,
      details: `Super Admin cleaned ${count} records older than ${params.olderThanDays} days from ${params.category}.`
    });
    return { success: true, affectedCount: count };
  }
  // --- CREDIT REQUESTS (PAYMENTS) ---
  async createCreditRequest(creditReq) {
    await pool.query(
      `INSERT INTO credit_requests (id, customer_id, customer_name, customer_phone, amount_tzs, payment_method, payment_reference, proof_image_url, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        creditReq.id,
        creditReq.customerId,
        creditReq.customerName,
        creditReq.customerPhone,
        creditReq.amountTzs,
        creditReq.paymentMethod,
        creditReq.paymentReference,
        creditReq.proofImageUrl || null,
        creditReq.status || "PENDING_VERIFICATION",
        new Date(creditReq.createdAt || Date.now())
      ]
    );
    return creditReq;
  }
  async getCreditRequests() {
    const res = await pool.query(
      `SELECT id, customer_id as "customerId", customer_name as "customerName",
              customer_phone as "customerPhone", amount_tzs as "amountTzs",
              payment_method as "paymentMethod", payment_reference as "paymentReference",
              proof_image_url as "proofImageUrl", status, reviewed_by as "reviewedBy",
              rejection_reason as "rejectionReason", reviewed_at as "reviewedAt", created_at as "createdAt"
       FROM credit_requests ORDER BY created_at DESC`
    );
    return res.rows.map((r) => ({
      ...r,
      reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toISOString() : void 0,
      createdAt: new Date(r.createdAt).toISOString()
    }));
  }
  async reviewCreditRequest(params) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const reqRes = await client.query(
        `SELECT * FROM credit_requests WHERE id = $1 FOR UPDATE`,
        [params.id]
      );
      if (reqRes.rowCount === 0) {
        return { success: false, error: "Ombi la Credit halikupatikana." };
      }
      const current = reqRes.rows[0];
      if (current.status !== "PENDING_VERIFICATION") {
        return { success: false, error: "Ombi hili lilikwishakaguliwa tayari." };
      }
      const now = /* @__PURE__ */ new Date();
      if (params.action === "APPROVE") {
        await client.query(
          `UPDATE credit_requests SET status = 'APPROVED', reviewed_by = $1, reviewed_at = $2 WHERE id = $3`,
          [params.reviewedBy, now, params.id]
        );
        await this.addCustomerCredit({
          userId: current.customer_id,
          amount: current.amount_tzs,
          actorId: params.reviewedBy,
          actorName: "Super Admin",
          actorRole: "SUPER_ADMIN",
          reason: `Idhini ya malipo ya Credit (Ref: ${current.payment_reference})`,
          reference: current.payment_reference
        });
      } else {
        await client.query(
          `UPDATE credit_requests SET status = 'REJECTED', reviewed_by = $1, rejection_reason = $2, reviewed_at = $3 WHERE id = $4`,
          [params.reviewedBy, params.rejectionReason || "Malipo yamekataliwa.", now, params.id]
        );
      }
      await client.query("COMMIT");
      return { success: true };
    } catch (err) {
      await client.query("ROLLBACK");
      return { success: false, error: err.message || "Hitilafu ya kukagua malipo." };
    } finally {
      client.release();
    }
  }
  // --- DEPARTMENTS ---
  async getDepartments() {
    const res = await pool.query(`SELECT id, name, code, description, permissions, created_at as "createdAt" FROM departments`);
    return res.rows.map((r) => ({
      ...r,
      permissions: Array.isArray(r.permissions) ? r.permissions : JSON.parse(r.permissions || "[]"),
      createdAt: new Date(r.createdAt).toISOString()
    }));
  }
  // --- NOTIFICATIONS ---
  async getNotifications(userId) {
    const res = await pool.query(
      `SELECT id, user_id as "userId", title, message, type, is_read as "isRead", created_at as "createdAt"
       FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    return res.rows.map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt).toISOString()
    }));
  }
  async markNotificationAsRead(id) {
    await pool.query(`UPDATE notifications SET is_read = true WHERE id = $1`, [id]);
  }
  async createNotification(notif) {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = /* @__PURE__ */ new Date();
    await pool.query(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, false, $6)`,
      [id, notif.userId, notif.title, notif.message, notif.type || "INFO", now]
    );
    pushService.sendNotificationToUser(notif.userId, {
      title: notif.title,
      message: notif.message,
      type: notif.type,
      url: notif.url || "/"
    }).catch((err) => console.warn("[PUSH DISPATCH WARNING]:", err.message));
    return {
      id,
      userId: notif.userId,
      title: notif.title,
      message: notif.message,
      type: notif.type || "REQUEST",
      read: false,
      createdAt: now.toISOString()
    };
  }
  // --- ANNOUNCEMENTS (TEXT ONLY) ---
  async getAnnouncements(onlyActive = false) {
    let sql = `SELECT id, title, message, target_type as "targetType", is_active as "isActive", created_at as "createdAt"
               FROM announcements`;
    if (onlyActive) {
      sql += ` WHERE is_active = true`;
    }
    sql += ` ORDER BY created_at DESC LIMIT 50`;
    const res = await pool.query(sql);
    return res.rows.map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt).toISOString()
    }));
  }
  async getActiveAnnouncementsForRole(role) {
    let sql = `SELECT id, title, message, target_type as "targetType", is_active as "isActive", created_at as "createdAt"
               FROM announcements
               WHERE is_active = true`;
    const params = [];
    if (role === "CUSTOMER") {
      sql += ` AND (target_type = 'ALL' OR target_type = 'ALL_CUSTOMERS')`;
    } else if (role === "ADMIN" || role === "SUPER_ADMIN") {
      sql += ` AND (target_type = 'ALL' OR target_type = 'ALL_ADMINS')`;
    }
    sql += ` ORDER BY created_at DESC LIMIT 10`;
    const res = await pool.query(sql, params);
    return res.rows.map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt).toISOString()
    }));
  }
  async createAnnouncement(announcement) {
    const isActive = announcement.isActive !== false;
    await pool.query(
      `INSERT INTO announcements (id, title, message, target_type, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        announcement.id,
        announcement.title.trim(),
        announcement.message.trim(),
        announcement.targetType || "ALL",
        isActive,
        new Date(announcement.createdAt || Date.now())
      ]
    );
    if (isActive) {
      const payload = {
        title: `Tangazo: ${announcement.title.trim()}`,
        message: announcement.message.trim(),
        type: "ANNOUNCEMENT",
        url: "/",
        eventKey: `ann_push_${announcement.id}`
      };
      if (announcement.targetType === "ALL") {
        pushService.broadcastNotification(payload).catch(
          (err) => console.warn("[PUSH ANNOUNCEMENT WARNING]:", err.message)
        );
      } else if (announcement.targetType === "ALL_CUSTOMERS") {
        pushService.sendNotificationToRole("CUSTOMER", payload).catch(
          (err) => console.warn("[PUSH ANNOUNCEMENT WARNING]:", err.message)
        );
      } else if (announcement.targetType === "ALL_ADMINS") {
        pushService.sendNotificationToRole("ADMIN", payload).catch(
          (err) => console.warn("[PUSH ANNOUNCEMENT WARNING]:", err.message)
        );
        pushService.sendNotificationToRole("SUPER_ADMIN", payload).catch(
          (err) => console.warn("[PUSH ANNOUNCEMENT WARNING]:", err.message)
        );
      } else if (announcement.targetUserId) {
        pushService.sendNotificationToUser(announcement.targetUserId, payload).catch(
          (err) => console.warn("[PUSH ANNOUNCEMENT WARNING]:", err.message)
        );
      }
    }
    return announcement;
  }
  async updateAnnouncement(id, patch) {
    const updates = [];
    const values = [];
    let idx = 1;
    if (patch.title !== void 0) {
      updates.push(`title = $${idx++}`);
      values.push(patch.title.trim());
    }
    if (patch.message !== void 0) {
      updates.push(`message = $${idx++}`);
      values.push(patch.message.trim());
    }
    if (patch.targetType !== void 0) {
      updates.push(`target_type = $${idx++}`);
      values.push(patch.targetType);
    }
    if (patch.isActive !== void 0) {
      updates.push(`is_active = $${idx++}`);
      values.push(patch.isActive);
    }
    if (updates.length === 0) return null;
    values.push(id);
    const sql = `UPDATE announcements SET ${updates.join(", ")} WHERE id = $${idx}
                 RETURNING id, title, message, target_type as "targetType", is_active as "isActive", created_at as "createdAt"`;
    const res = await pool.query(sql, values);
    if (res.rowCount === 0) return null;
    const row = res.rows[0];
    return {
      ...row,
      createdAt: new Date(row.createdAt).toISOString()
    };
  }
  async deleteAnnouncement(id) {
    const res = await pool.query(`DELETE FROM announcements WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }
  // --- ADVERTISEMENTS (MATANGAZO YA VIDEO, PICHA NA MAANDISHI) ---
  async getAdvertisements(onlyActive = false) {
    let query = `SELECT id, type, title, description, media_url as "mediaUrl",
                        cover_url as "coverUrl", start_date as "startDate", end_date as "endDate",
                        is_active as "isActive", created_by_id as "createdById",
                        created_by_name as "createdByName", created_at as "createdAt",
                        updated_at as "updatedAt"
                 FROM advertisements`;
    if (onlyActive) {
      query += ` WHERE is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW())`;
    }
    query += ` ORDER BY created_at DESC`;
    const res = await pool.query(query);
    return res.rows.map((r) => ({
      ...r,
      startDate: r.startDate ? new Date(r.startDate).toISOString() : void 0,
      endDate: r.endDate ? new Date(r.endDate).toISOString() : void 0,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString()
    }));
  }
  async getAdvertisementById(id) {
    const res = await pool.query(
      `SELECT id, type, title, description, media_url as "mediaUrl",
              cover_url as "coverUrl", start_date as "startDate", end_date as "endDate",
              is_active as "isActive", created_by_id as "createdById",
              created_by_name as "createdByName", created_at as "createdAt",
              updated_at as "updatedAt"
       FROM advertisements WHERE id = $1`,
      [id]
    );
    if (res.rowCount === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      startDate: r.startDate ? new Date(r.startDate).toISOString() : void 0,
      endDate: r.endDate ? new Date(r.endDate).toISOString() : void 0,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString()
    };
  }
  async createAdvertisement(ad) {
    const now = /* @__PURE__ */ new Date();
    await pool.query(
      `INSERT INTO advertisements (id, type, title, description, media_url, cover_url, start_date, end_date, is_active, created_by_id, created_by_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)`,
      [
        ad.id,
        ad.type,
        ad.title,
        ad.description,
        ad.mediaUrl || null,
        ad.coverUrl || null,
        ad.startDate ? new Date(ad.startDate) : null,
        ad.endDate ? new Date(ad.endDate) : null,
        ad.isActive !== false,
        ad.createdById,
        ad.createdByName,
        now
      ]
    );
    return {
      ...ad,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
  }
  async updateAdvertisement(id, patch) {
    const current = await this.getAdvertisementById(id);
    if (!current) return null;
    const updated = { ...current, ...patch, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await pool.query(
      `UPDATE advertisements SET
         type = $1, title = $2, description = $3, media_url = $4, cover_url = $5,
         start_date = $6, end_date = $7, is_active = $8, updated_at = NOW()
       WHERE id = $9`,
      [
        updated.type,
        updated.title,
        updated.description,
        updated.mediaUrl || null,
        updated.coverUrl || null,
        updated.startDate ? new Date(updated.startDate) : null,
        updated.endDate ? new Date(updated.endDate) : null,
        updated.isActive,
        id
      ]
    );
    return updated;
  }
  async deleteAdvertisement(id) {
    const res = await pool.query(`DELETE FROM advertisements WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  }
  // --- FILES (METADATA IN POSTGRESQL) ---
  async getFiles(options) {
    let query = `SELECT id, user_id as "userId", file_name as "fileName", file_url as "fileUrl",
                        file_type as "fileType", size_bytes as "sizeBytes", checksum,
                        storage_bucket as "storageBucket", is_private as "isPrivate",
                        created_at as "createdAt" FROM files`;
    const values = [];
    if (options?.ownerId && options.role !== "SUPER_ADMIN") {
      query += ` WHERE user_id = $1`;
      values.push(options.ownerId);
    }
    query += ` ORDER BY created_at DESC`;
    const res = await pool.query(query, values);
    return res.rows.map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt).toISOString()
    }));
  }
  async createFile(file) {
    await pool.query(
      `INSERT INTO files (id, user_id, file_name, file_url, file_type, size_bytes, checksum, storage_bucket, is_private, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        file.id,
        file.userId,
        file.fileName,
        file.fileUrl,
        file.fileType,
        file.sizeBytes,
        file.checksum || null,
        file.storageBucket || "cloud_storage_nmy",
        file.isPrivate !== false,
        new Date(file.createdAt || Date.now())
      ]
    );
    return file;
  }
  // --- AUDIT LOGS ---
  async addAuditLog(log) {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = /* @__PURE__ */ new Date();
    await pool.query(
      `INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target, target_id, details, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        log.actorId,
        log.actorName,
        log.actorRole,
        log.action,
        log.target,
        log.targetId || null,
        log.details,
        now
      ]
    );
    return {
      ...log,
      id,
      timestamp: now.toISOString()
    };
  }
  async getAuditLogs(limit = 100) {
    const res = await pool.query(
      `SELECT id, actor_id as "actorId", actor_name as "actorName", actor_role as "actorRole",
              action, target, target_id as "targetId", details, timestamp
       FROM audit_logs ORDER BY timestamp DESC LIMIT $1`,
      [limit]
    );
    return res.rows.map((r) => ({
      ...r,
      timestamp: new Date(r.timestamp).toISOString()
    }));
  }
  // --- SETTINGS ---
  async getSettings() {
    const res = await pool.query(`SELECT value FROM settings WHERE key = 'app_settings'`);
    if (res.rowCount === 0) {
      return {
        platformName: "NIDA MITANDAO YOTE",
        companyName: "RAVINI COMPANY LIMITED",
        supportPhone: "255748604483",
        whatsappNumber: "255748604483",
        servicePriceTzs: 100,
        appAccessOpen: true,
        publicRegistrationOpen: true,
        requestTimeoutMinutes: 15,
        paymentInstructions: "Lipa kiasi unachotaka cha Credit kupitia namba zetu za malipo hapa chini.",
        paymentMethods: []
      };
    }
    return res.rows[0].value;
  }
  async updateSettings(patch, actor) {
    const current = await this.getSettings();
    const updated = { ...current, ...patch };
    await pool.query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ('app_settings', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         updated_at = NOW()`,
      [JSON.stringify(updated)]
    );
    await this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: "SUPER_ADMIN",
      action: "SETTINGS_UPDATED",
      target: "SYSTEM_SETTINGS",
      details: `Super Admin updated system settings: ${JSON.stringify(patch)}`
    });
    return updated;
  }
  mapRequestRow(r) {
    return {
      id: r.id,
      customerId: r.customer_id,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      serviceId: r.service_id,
      serviceCode: r.service_code,
      serviceName: r.service_name,
      targetPhoneNumber: r.target_phone_number,
      chargedPriceTzs: Number(r.charged_price_tzs),
      status: r.status,
      claimedByWorkerId: r.claimed_by_worker_id || void 0,
      claimedByWorkerName: r.claimed_by_worker_name || void 0,
      claimedByWorkerRole: r.claimed_by_worker_role || void 0,
      claimedAt: r.claimed_at ? new Date(r.claimed_at).toISOString() : void 0,
      completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : void 0,
      rejectedAt: r.rejected_at ? new Date(r.rejected_at).toISOString() : void 0,
      nidaResult: r.nida_result || void 0,
      rejectionReason: r.rejection_reason || void 0,
      refundStatus: r.refund_status || "NONE",
      refundedAt: r.refunded_at ? new Date(r.refunded_at).toISOString() : void 0,
      isDeletedByCustomer: r.is_deleted_by_customer || false,
      deletedAt: r.deleted_at ? new Date(r.deleted_at).toISOString() : void 0,
      deletedBy: r.deleted_by || void 0,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString()
    };
  }
  async resetSuperAdminWorkBalance(superAdminId, actor, reason = "Kuweka salio la kazi kuwa 0 na Super Admin") {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const accRes = await client.query(
        `SELECT balance_tzs FROM super_admin_work_credit_accounts WHERE super_admin_id = $1 FOR UPDATE`,
        [superAdminId]
      );
      let balanceBefore = 0;
      if (accRes.rowCount && accRes.rowCount > 0) {
        balanceBefore = Number(accRes.rows[0].balance_tzs) || 0;
      }
      await client.query(
        `INSERT INTO super_admin_work_credit_accounts (super_admin_id, balance_tzs, updated_at)
         VALUES ($1, 0, NOW())
         ON CONFLICT (super_admin_id) DO UPDATE SET balance_tzs = 0, updated_at = NOW()`,
        [superAdminId]
      );
      if (balanceBefore !== 0) {
        await client.query(
          `INSERT INTO super_admin_work_credit_ledger
           (super_admin_id, amount, balance_before, balance_after, request_id, actor_id, actor_name, actor_role, reason, reference, timestamp)
           VALUES ($1, $2, $3, 0, NULL, $4, $5, 'SUPER_ADMIN', $6, $7, NOW())`,
          [
            superAdminId,
            -balanceBefore,
            balanceBefore,
            actor.id,
            actor.name,
            reason,
            `RESET_WORK_BAL_${Date.now()}`
          ]
        );
      }
      await client.query("COMMIT");
      await this.addAuditLog({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: "SUPER_ADMIN",
        action: "WORK_BALANCE_RESET",
        target: `SUPER_ADMIN_WORK_ACC:${superAdminId}`,
        targetId: superAdminId,
        details: `Super Admin ${actor.name} aliweka salio la kazi kuwa 0 (Kutoka TSh ${balanceBefore.toLocaleString()} hadi TSh 0). Sababu: ${reason}.`
      });
      return { success: true, balanceBefore, balanceAfter: 0 };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
  async deleteFile(fileId, actor) {
    const fileRes = await pool.query(`SELECT * FROM files WHERE id = $1`, [fileId]);
    if (fileRes.rowCount === 0) return { success: false, message: "Faili halikupatikana." };
    const file = fileRes.rows[0];
    if (actor.role !== "SUPER_ADMIN" && file.user_id !== actor.id) {
      return { success: false, message: "Huna mamlaka ya kufuta faili hili." };
    }
    await pool.query(`DELETE FROM files WHERE id = $1`, [fileId]);
    await this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "FILE_DELETED",
      target: `FILE:${fileId}`,
      targetId: fileId,
      details: `${actor.role} ${actor.name} alifuta faili "${file.file_name}" (${file.size_bytes} bytes).`
    });
    return { success: true, message: `Faili "${file.file_name}" limefutwa kikamilifu.` };
  }
  async getRawSnapshot() {
    const users2 = await this.getUsers();
    const requests2 = await this.getRequests();
    const creditRequests2 = await this.getCreditRequests();
    const ledger = await this.getAllCreditLedger();
    const auditLogs2 = await this.getAuditLogs(1e3);
    const services2 = await this.getServices();
    const settings2 = await this.getSettings();
    const creditAccounts2 = {};
    const accRows = await pool.query("SELECT user_id, balance_tzs, updated_at FROM credit_accounts");
    for (const r of accRows.rows) {
      creditAccounts2[r.user_id] = {
        balanceTzs: Number(r.balance_tzs),
        updatedAt: new Date(r.updated_at).toISOString()
      };
    }
    return {
      users: users2,
      requests: requests2,
      creditRequests: creditRequests2,
      creditAccounts: creditAccounts2,
      creditLedger: ledger,
      auditLogs: auditLogs2,
      services: services2,
      settings: settings2
    };
  }
};
var getNmyDb = () => NmyDatabase.getInstance();

// server/services/nmyBackupService.ts
var import_fs2 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var NmyBackupService = class _NmyBackupService {
  static instance;
  backupDir;
  registryFile;
  dbFilePath;
  constructor() {
    this.backupDir = import_path2.default.join(process.cwd(), "data", "backups");
    this.registryFile = import_path2.default.join(this.backupDir, "nmy_backup_registry.json");
    this.dbFilePath = import_path2.default.join(process.cwd(), "data", "nida_mitandao_yote_db.json");
    if (!import_fs2.default.existsSync(this.backupDir)) {
      import_fs2.default.mkdirSync(this.backupDir, { recursive: true });
    }
    if (!import_fs2.default.existsSync(this.registryFile)) {
      import_fs2.default.writeFileSync(this.registryFile, JSON.stringify([], null, 2), "utf-8");
    }
  }
  static getInstance() {
    if (!_NmyBackupService.instance) {
      _NmyBackupService.instance = new _NmyBackupService();
    }
    return _NmyBackupService.instance;
  }
  getRegistry() {
    try {
      if (!import_fs2.default.existsSync(this.registryFile)) return [];
      const raw = import_fs2.default.readFileSync(this.registryFile, "utf-8");
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  saveRegistry(records) {
    const tmp = `${this.registryFile}.tmp`;
    import_fs2.default.writeFileSync(tmp, JSON.stringify(records, null, 2), "utf-8");
    import_fs2.default.renameSync(tmp, this.registryFile);
  }
  // CREATE → VERIFY → STORE → RECORD
  async createVerifiedBackup(reason = "AUTOMATIC_SNAPSHOT") {
    try {
      if (!import_fs2.default.existsSync(this.dbFilePath)) {
        return { success: false, error: "Database halisi haikupatikana kwa ajili ya backup." };
      }
      const rawDb = import_fs2.default.readFileSync(this.dbFilePath, "utf-8");
      const parsedDb = JSON.parse(rawDb);
      const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
      const safeTs = timestamp2.replace(/[:.]/g, "-");
      const backupFilename = `nmy_prod_backup_${safeTs}.json`;
      const backupFilePath = import_path2.default.join(this.backupDir, backupFilename);
      import_fs2.default.writeFileSync(backupFilePath, rawDb, "utf-8");
      const readBack = import_fs2.default.readFileSync(backupFilePath, "utf-8");
      const readBackParsed = JSON.parse(readBack);
      const hasher = import_crypto.default.createHash("sha256");
      hasher.update(readBack);
      const sha256Checksum = hasher.digest("hex");
      const sourceUsersCount = Array.isArray(parsedDb.users) ? parsedDb.users.length : 0;
      const readBackUsersCount = Array.isArray(readBackParsed.users) ? readBackParsed.users.length : 0;
      const sourceReqCount = Array.isArray(parsedDb.requests) ? parsedDb.requests.length : 0;
      const readBackReqCount = Array.isArray(readBackParsed.requests) ? readBackParsed.requests.length : 0;
      const sourceLedgerCount = Array.isArray(parsedDb.creditLedger) ? parsedDb.creditLedger.length : 0;
      const readBackLedgerCount = Array.isArray(readBackParsed.creditLedger) ? readBackParsed.creditLedger.length : 0;
      const sourceCreditReqCount = Array.isArray(parsedDb.creditRequests) ? parsedDb.creditRequests.length : 0;
      const readBackCreditReqCount = Array.isArray(readBackParsed.creditRequests) ? readBackParsed.creditRequests.length : 0;
      const sourceAuditCount = Array.isArray(parsedDb.auditLogs) ? parsedDb.auditLogs.length : 0;
      const readBackAuditCount = Array.isArray(readBackParsed.auditLogs) ? readBackParsed.auditLogs.length : 0;
      const isIntegrityValid = sourceUsersCount === readBackUsersCount && sourceReqCount === readBackReqCount && sourceLedgerCount === readBackLedgerCount && sourceCreditReqCount === readBackCreditReqCount && sourceAuditCount === readBackAuditCount && readBackParsed.users?.some((u) => u.phone === "255748604483");
      if (!isIntegrityValid) {
        import_fs2.default.unlinkSync(backupFilePath);
        console.error("[NMY BACKUP CRITICAL] Backup verification failed for", backupFilename);
        return {
          success: false,
          error: "Uhakiki wa backup umeshindikana (Verification Failed). Backup haijarekodiwa."
        };
      }
      const stat = import_fs2.default.statSync(backupFilePath);
      const backupRecord = {
        id: `bup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        filename: backupFilename,
        filePath: backupFilePath,
        sizeBytes: stat.size,
        sha256Checksum,
        timestamp: timestamp2,
        environment: "PRODUCTION",
        databaseIdentity: "NIDA_MITANDAO_YOTE_PROD_DB",
        isVerified: true,
        verifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
        recordCounts: {
          users: readBackUsersCount,
          requests: readBackReqCount,
          creditLedger: readBackLedgerCount,
          creditRequests: readBackCreditReqCount,
          auditLogs: readBackAuditCount
        },
        status: "VERIFIED"
      };
      const registry = this.getRegistry();
      registry.unshift(backupRecord);
      if (registry.length > 50) {
        const toPrune = registry.slice(50);
        for (const oldRec of toPrune) {
          try {
            if (import_fs2.default.existsSync(oldRec.filePath)) {
              import_fs2.default.unlinkSync(oldRec.filePath);
            }
          } catch {
          }
        }
        this.saveRegistry(registry.slice(0, 50));
      } else {
        this.saveRegistry(registry);
      }
      console.log(`[NMY BACKUP] Verified Backup created: ${backupFilename} (${stat.size} bytes, SHA256: ${sha256Checksum.slice(0, 10)}...) Reason: ${reason}`);
      return { success: true, record: backupRecord };
    } catch (err) {
      console.error("[NMY BACKUP ERROR]:", err);
      return { success: false, error: err.message || "Hitilafu ya kuunda backup." };
    }
  }
  getBackups() {
    const list = this.getRegistry();
    return list.map((rec) => ({
      ...rec,
      isVerified: import_fs2.default.existsSync(rec.filePath) ? rec.isVerified : false
    }));
  }
  getLastBackup() {
    const list = this.getBackups();
    return list[0] || null;
  }
  getLastVerifiedBackup() {
    const list = this.getBackups();
    return list.find((b) => b.status === "VERIFIED" && import_fs2.default.existsSync(b.filePath)) || null;
  }
  // SAFE CONTROLLED RECOVERY
  // Never "delete everything -> restore everything" blindly.
  // Instead:
  // 1. Take safety snapshot of current state
  // 2. Read and verify recovery file
  // 3. Apply state
  // 4. Record audit event
  async safeRestorePoint(backupId, actor) {
    try {
      const registry = this.getRegistry();
      const targetBackup = registry.find((b) => b.id === backupId);
      if (!targetBackup) {
        return { success: false, error: "Backup uliyochagua haikupatikana." };
      }
      if (!import_fs2.default.existsSync(targetBackup.filePath)) {
        return { success: false, error: "Faili halisi la backup halipatikani kwenye hifadhi salama." };
      }
      await this.createVerifiedBackup(`PRE_RESTORE_SAFETY_SNAPSHOT_BEFORE_${targetBackup.id}`);
      const rawTarget = import_fs2.default.readFileSync(targetBackup.filePath, "utf-8");
      const parsedTarget = JSON.parse(rawTarget);
      const hasSuperAdmin = parsedTarget.users?.some((u) => u.phone === "255748604483");
      if (!hasSuperAdmin) {
        return { success: false, error: "Backup haina Super Admin anayetambulika. Urejeshaji umesimamishwa kwa usalama." };
      }
      const tempPath = `${this.dbFilePath}.restore.tmp`;
      import_fs2.default.writeFileSync(tempPath, JSON.stringify(parsedTarget, null, 2), "utf-8");
      import_fs2.default.renameSync(tempPath, this.dbFilePath);
      console.log(`[NMY RECOVERY] Controlled recovery executed successfully from ${targetBackup.filename} by ${actor.name} (${actor.role})`);
      return { success: true, restoredRecord: targetBackup };
    } catch (err) {
      console.error("[NMY RECOVERY ERROR]:", err);
      return { success: false, error: err.message || "Hitilafu ya kurejesha mfumo." };
    }
  }
  // DATA INTEGRITY & AUDIT SCANNER
  async runDataIntegrityCheck(currentDbData) {
    const discrepancies = [];
    const users2 = currentDbData?.users || [];
    const requests2 = currentDbData?.requests || [];
    const creditAccounts2 = currentDbData?.creditAccounts || {};
    const creditLedger2 = currentDbData?.creditLedger || [];
    const creditRequests2 = currentDbData?.creditRequests || [];
    const auditLogs2 = currentDbData?.auditLogs || [];
    const ledgerSumsByUser = {};
    for (const entry of creditLedger2) {
      if (!ledgerSumsByUser[entry.userId]) ledgerSumsByUser[entry.userId] = 0;
      if (entry.type === "ADD" || entry.type === "REFUND") {
        ledgerSumsByUser[entry.userId] += entry.amount;
      } else if (entry.type === "CHARGE") {
        ledgerSumsByUser[entry.userId] -= entry.amount;
      } else if (entry.type === "ADJUSTMENT") {
        ledgerSumsByUser[entry.userId] += entry.amount;
      }
    }
    for (const user of users2) {
      if (user.role === "CUSTOMER") {
        const storedBalance = creditAccounts2[user.id]?.balanceTzs || 0;
        const calculatedBalance = ledgerSumsByUser[user.id] || 0;
        if (storedBalance < 0) {
          discrepancies.push({
            type: "CREDIT_MISMATCH",
            severity: "CRITICAL",
            message: `Mteja ${user.fullName} (${user.phone}) ana salio hasi (negative balance): TSh ${storedBalance}. Salio hasi haliruhusiwi!`,
            details: { userId: user.id, storedBalance }
          });
        }
        if (storedBalance !== calculatedBalance) {
          discrepancies.push({
            type: "CREDIT_MISMATCH",
            severity: "MEDIUM",
            message: `Salio la mteja ${user.fullName} (TSh ${storedBalance}) lina tofauti na hesabu ya Ledger (TSh ${calculatedBalance}).`,
            details: { userId: user.id, storedBalance, calculatedBalance }
          });
        }
      }
    }
    const seenReqIds = /* @__PURE__ */ new Set();
    for (const req of requests2) {
      if (seenReqIds.has(req.id)) {
        discrepancies.push({
          type: "DUPLICATE_TRANSACTION",
          severity: "HIGH",
          message: `Namba ya ombi (${req.id}) imejirudia mara mbili!`,
          details: { requestId: req.id }
        });
      }
      seenReqIds.add(req.id);
    }
    for (const cr of creditRequests2) {
      if (cr.status === "APPROVED") {
        const foundInLedger = creditLedger2.some((e) => e.reference?.includes(cr.id) || e.reference === cr.paymentReference);
        if (!foundInLedger) {
          discrepancies.push({
            type: "UNRESOLVED_PAYMENT",
            severity: "HIGH",
            message: `Ombi la malipo ${cr.id} la TSh ${cr.amountTzs} limeidhinishwa lakini rekodi yake haionekani kwenye Credit Ledger.`,
            details: { creditRequestId: cr.id, amount: cr.amountTzs }
          });
        }
      }
    }
    const isHealthy = discrepancies.filter((d) => d.severity === "CRITICAL" || d.severity === "HIGH").length === 0;
    return {
      isHealthy,
      checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
      totalUsers: users2.length,
      totalRequests: requests2.length,
      totalLedgerEntries: creditLedger2.length,
      totalCreditRequests: creditRequests2.length,
      totalAuditLogs: auditLogs2.length,
      discrepancies
    };
  }
};
function getNmyBackupService() {
  return NmyBackupService.getInstance();
}

// server/services/realtimeService.ts
var RealtimeService = class _RealtimeService {
  static instance;
  clients = /* @__PURE__ */ new Map();
  pingInterval = null;
  constructor() {
    this.pingInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 25e3);
  }
  static getInstance() {
    if (!_RealtimeService.instance) {
      _RealtimeService.instance = new _RealtimeService();
    }
    return _RealtimeService.instance;
  }
  addClient(userId, role, res) {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*"
    });
    res.write(`: connection established ${clientId}

`);
    const client = {
      id: clientId,
      userId,
      role,
      res,
      connectedAt: Date.now()
    };
    this.clients.set(clientId, client);
    res.on("close", () => {
      this.clients.delete(clientId);
    });
    return clientId;
  }
  notifyUser(userId, payload) {
    const dataString = `data: ${JSON.stringify({ ...payload, timestamp: Date.now() })}

`;
    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        try {
          client.res.write(dataString);
        } catch {
          this.clients.delete(client.id);
        }
      }
    }
  }
  notifyRole(role, payload) {
    const dataString = `data: ${JSON.stringify({ ...payload, timestamp: Date.now() })}

`;
    for (const client of this.clients.values()) {
      if (client.role === role) {
        try {
          client.res.write(dataString);
        } catch {
          this.clients.delete(client.id);
        }
      }
    }
  }
  broadcast(payload) {
    const dataString = `data: ${JSON.stringify({ ...payload, timestamp: Date.now() })}

`;
    for (const client of this.clients.values()) {
      try {
        client.res.write(dataString);
      } catch {
        this.clients.delete(client.id);
      }
    }
  }
  sendHeartbeat() {
    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(": ping\n\n");
      } catch {
        this.clients.delete(id);
      }
    }
  }
  getConnectedClientsCount() {
    return this.clients.size;
  }
};
var realtimeService = RealtimeService.getInstance();

// server/middleware/rateLimiter.ts
function createRateLimiter(options) {
  const store = /* @__PURE__ */ new Map();
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetAt) {
        store.delete(key);
      }
    }
  }, options.windowMs);
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
  return (req, res, next) => {
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown-ip";
    const now = Date.now();
    const record = store.get(clientIp);
    if (!record || now > record.resetAt) {
      store.set(clientIp, {
        count: 1,
        resetAt: now + options.windowMs
      });
      return next();
    }
    record.count += 1;
    if (record.count > options.maxRequests) {
      const waitSeconds = Math.ceil((record.resetAt - now) / 1e3);
      return res.status(429).json({
        success: false,
        code: "RATE_LIMIT_EXCEEDED",
        message: options.message || `MAOMBI MENGI MNO. Tafadhali subiri sekunde ${waitSeconds} kabla ya kujaribu tena.`
      });
    }
    next();
  };
}
var authRateLimiter = createRateLimiter({
  windowMs: 60 * 1e3,
  // 1 minute
  maxRequests: 15,
  message: "MAOMBI MENGI YA KUINGIA: Kwa usalama, tafadhali subiri dakika moja kabla ya kujaribu tena."
});
var transactionRateLimiter = createRateLimiter({
  windowMs: 60 * 1e3,
  maxRequests: 30,
  message: "MAOMBI MENGI YA MIAMALA: Tafadhali subiri sekunde chache kabla ya kutuma ombi lingine."
});

// server/middleware/nmyAuth.ts
async function nmyAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (typeof req.query.token === "string") {
      token = req.query.token.trim();
    }
    if (!token) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Tafadhali ingia kwenye akaunti yako kwanza."
      });
    }
    const db3 = getNmyDb();
    const session = await db3.getSessionByToken(token);
    if (!session) {
      return res.status(401).json({
        success: false,
        code: "SESSION_EXPIRED",
        message: "SESSION IMEISHA\n\nKwa usalama, session yako imeisha.\nTafadhali ingia tena."
      });
    }
    if (session.isRevoked) {
      if (session.revokeReason === "ANOTHER_DEVICE") {
        return res.status(401).json({
          success: false,
          code: "SESSION_REVOKED_ANOTHER_DEVICE",
          message: "SESSION IMESITISHWA\n\nAkaunti yako imeingia kwenye kifaa kingine.\nTafadhali ingia tena."
        });
      }
      return res.status(401).json({
        success: false,
        code: "SESSION_EXPIRED",
        message: "SESSION IMEISHA\n\nKwa usalama, session yako imeisha.\nTafadhali ingia tena."
      });
    }
    if (session.expiresAt <= (/* @__PURE__ */ new Date()).toISOString()) {
      return res.status(401).json({
        success: false,
        code: "SESSION_EXPIRED",
        message: "SESSION IMEISHA\n\nKwa usalama, session yako imeisha.\nTafadhali ingia tena."
      });
    }
    const user = await db3.getUserById(session.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "Mtumiaji hakupatikana."
      });
    }
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_SUSPENDED",
        message: "Akaunti yako imesimamishwa. Wasiliana na Uongozi wa RAVINI COMPANY LIMITED."
      });
    }
    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    console.error("[NMY Auth Middleware Error]:", error);
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Hitilafu ya uthibitishaji kwenye mfumo."
    });
  }
}
function requireNmyRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Tafadhali ingia kwenye akaunti yako."
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Huna mamlaka ya kufungua au kutumia huduma hii."
      });
    }
    next();
  };
}

// server/routes/nmyApi.ts
var router = (0, import_express.Router)();
var db2 = getNmyDb();
var backupService = getNmyBackupService();
function normalizePhone2(input) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("255") && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return "255" + digits.substring(1);
  }
  if (digits.length === 9) {
    return "255" + digits;
  }
  return digits;
}
function maskCustomerPhone(phone) {
  if (!phone || phone.length < 8) return "****";
  return phone.slice(0, 4) + "***" + phone.slice(-3);
}
function sanitizeRequestForViewer(req, viewer) {
  if (viewer.role === "SUPER_ADMIN" || viewer.permissions?.includes("VIEW_CUSTOMER_PHONE")) {
    return req;
  }
  return {
    ...req,
    customerPhone: maskCustomerPhone(req.customerPhone)
  };
}
function generateRequestId() {
  const date = /* @__PURE__ */ new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NMY-${yyyy}${mm}${dd}-${rand}`;
}
router.get("/health", async (_req, res) => {
  try {
    const settings2 = await db2.getSettings();
    res.json({
      status: "ok",
      vision: "VISION_2",
      version: "2.1.0",
      application: "PASS",
      database: "PASS",
      auth: "PASS",
      platform: settings2.platformName,
      company: settings2.companyName,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});
router.get("/public/config", async (_req, res) => {
  try {
    const settings2 = await db2.getSettings();
    const services2 = await db2.getServices();
    const mainService = services2.find((s) => s.code === "NIDA_MITANDAO_YOTE") || services2[0];
    const terms = await db2.getLatestTerms();
    res.json({
      success: true,
      config: {
        platformName: settings2.platformName,
        companyName: settings2.companyName,
        oneSignalAppId: process.env.ONESIGNAL_APP_ID || "",
        publicRegistrationOpen: settings2.publicRegistrationOpen,
        appAccessOpen: settings2.appAccessOpen,
        requestTimeoutMinutes: settings2.requestTimeoutMinutes,
        supportPhone: settings2.supportPhone,
        whatsappNumber: settings2.whatsappNumber,
        paymentInstructions: settings2.paymentInstructions,
        paymentMethods: settings2.paymentMethods.filter((m) => m.isActive),
        service: mainService ? {
          id: mainService.id,
          code: mainService.code,
          name: mainService.name,
          description: mainService.description,
          priceTzs: mainService.priceTzs,
          isActive: mainService.isActive
        } : null,
        termsVersion: terms.version,
        termsContent: terms.content
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata taarifa za mfumo." });
  }
});
router.post("/auth/register", authRateLimiter, async (req, res) => {
  try {
    const settings2 = await db2.getSettings();
    if (!settings2.publicRegistrationOpen) {
      return res.status(403).json({
        success: false,
        code: "REGISTRATION_CLOSED",
        message: "USAJILI WA AKAUNTI MPYA HAUPO KWA SASA. TAFADHALI JARIBU TENA BAADAYE."
      });
    }
    const { fullName, phone, password, repeatPassword, termsAccepted } = req.body;
    if (!fullName || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Tafadhali jaza taarifa zote zinazohitajika."
      });
    }
    if (password !== repeatPassword) {
      return res.status(400).json({
        success: false,
        message: "Maneno ya siri hayafanani."
      });
    }
    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Neno la siri lazima liwe na angalau herufi au tarakimu 4."
      });
    }
    if (!termsAccepted) {
      return res.status(400).json({
        success: false,
        message: "Lazima ukubaliane na Vigezo na Masharti ili kujisajili."
      });
    }
    const normalizedPhone = normalizePhone2(phone);
    if (!normalizedPhone.startsWith("255") || normalizedPhone.length !== 12) {
      return res.status(400).json({
        success: false,
        message: "Weka namba sahihi ya simu ya Tanzania (mfano 0712345678 au 255712345678)."
      });
    }
    const restriction = await db2.isPhoneRestrictedByDeletion(normalizedPhone);
    if (restriction.restricted) {
      const expDate = restriction.expiresAt ? new Date(restriction.expiresAt).toLocaleDateString("sw-TZ") : "siku 7";
      return res.status(403).json({
        success: false,
        message: `Namba hii ya simu ilifutwa hivi karibuni. Kulingana na sera ya usalama ya RAVINI, usajili upya unaruhusiwa baada ya siku 7 tangu kufutwa (hadi tarehe ${expDate}).`
      });
    }
    const existingUser = await db2.getUserByPhone(normalizedPhone);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Namba hii ya simu tayari imesajiliwa kwenye mfumo. Tafadhali ingia."
      });
    }
    const salt = await import_bcryptjs.default.genSalt(10);
    const hashedPassword = await import_bcryptjs.default.hash(password, salt);
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      phone: normalizedPhone,
      fullName: fullName.trim(),
      password: hashedPassword,
      role: "CUSTOMER",
      // Strict: public registration creates CUSTOMER only
      status: "ACTIVE",
      permissions: [],
      language: "sw",
      mustChangePassword: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await db2.createUser(newUser);
    const latestTerms = await db2.getLatestTerms();
    await db2.recordTermsAcceptance(newUser.id, latestTerms.version);
    await db2.addAuditLog({
      actorId: newUser.id,
      actorName: newUser.fullName,
      actorRole: "CUSTOMER",
      action: "REGISTER",
      target: `USER:${newUser.id}`,
      targetId: newUser.id,
      details: `Customer registered successfully with phone ${newUser.phone}`
    });
    pushService.sendNotificationToRole("ADMIN", {
      title: "Mteja Mpya Amejisajili",
      message: `Mteja mpya ${newUser.fullName} (${newUser.phone}) amejisajili kwenye mfumo.`,
      type: "USER",
      url: "/profile",
      eventKey: `reg_adm_${newUser.id}`
    }).catch((err) => console.warn("[PUSH REG ADMIN ERROR]:", err.message));
    pushService.sendNotificationToRole("SUPER_ADMIN", {
      title: "Mteja Mpya Amejisajili",
      message: `Mteja mpya ${newUser.fullName} (${newUser.phone}) amejisajili kwenye mfumo.`,
      type: "USER",
      url: "/profile",
      eventKey: `reg_sa_${newUser.id}`
    }).catch((err) => console.warn("[PUSH REG SA ERROR]:", err.message));
    res.status(201).json({
      success: true,
      message: "USAJILI UMEKAMILIKA. Akaunti yako imeundwa kikamilifu. Tafadhali ingia kutumia namba yako ya simu na password.",
      userId: newUser.id
    });
  } catch (err) {
    console.error("[Register Error]:", err);
    res.status(500).json({ success: false, message: "Hitilafu ya kusajili akaunti." });
  }
});
router.post("/auth/login", authRateLimiter, async (req, res) => {
  try {
    const { phone, password, deviceName } = req.body;
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Weka namba ya simu na neno la siri."
      });
    }
    const normalizedPhone = normalizePhone2(phone);
    const user = await db2.getUserByPhone(normalizedPhone);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Namba ya simu au neno la siri si sahihi."
      });
    }
    const settings2 = await db2.getSettings();
    if (!settings2.appAccessOpen && user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        code: "APP_ACCESS_BLOCKED",
        message: "APP HAIJAPATIKANA KWA SASA. Mfumo umefungwa kwa muda. Tafadhali jaribu tena baadaye."
      });
    }
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Akaunti yako imesimamishwa. Wasiliana na Uongozi wa RAVINI COMPANY LIMITED."
      });
    }
    const isMatch = await import_bcryptjs.default.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Namba ya simu au neno la siri si sahihi."
      });
    }
    const token = `nmy_tok_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString();
    const session = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      token,
      userId: user.id,
      role: user.role,
      deviceName: deviceName || "Mobile / Web Device",
      ip: req.ip || "127.0.0.1",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      expiresAt,
      isRevoked: false
    };
    await db2.createSession(session);
    await db2.updateUser(user.id, { lastLoginAt: (/* @__PURE__ */ new Date()).toISOString() });
    await db2.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: "LOGIN",
      target: `USER:${user.id}`,
      targetId: user.id,
      details: `User logged in with role ${user.role}`
    });
    let customerCredit = 0;
    let adminWorkCredit = 0;
    let superAdminWorkCredit = 0;
    if (user.role === "CUSTOMER") {
      customerCredit = await db2.getCustomerCredit(user.id);
    } else if (user.role === "ADMIN") {
      adminWorkCredit = await db2.getAdminWorkCredit(user.id);
    } else if (user.role === "SUPER_ADMIN") {
      superAdminWorkCredit = await db2.getSuperAdminWorkCredit(user.id);
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
      message: "Umeingia kikamilifu.",
      token,
      user: safeUser,
      balances: {
        customerCredit,
        adminWorkCredit,
        superAdminWorkCredit
      }
    });
  } catch (err) {
    console.error("[Login Error]:", err);
    res.status(500).json({ success: false, message: "Hitilafu ya kuingia kwenye mfumo." });
  }
});
router.get("/auth/me", nmyAuthMiddleware, async (req, res) => {
  try {
    const user = req.user;
    let customerCredit = 0;
    let adminWorkCredit = 0;
    let superAdminWorkCredit = 0;
    if (user.role === "CUSTOMER") {
      customerCredit = await db2.getCustomerCredit(user.id);
    } else if (user.role === "ADMIN") {
      adminWorkCredit = await db2.getAdminWorkCredit(user.id);
    } else if (user.role === "SUPER_ADMIN") {
      superAdminWorkCredit = await db2.getSuperAdminWorkCredit(user.id);
    }
    const notifications2 = await db2.getNotifications(user.id);
    const unreadCount = notifications2.filter((n) => !n.read).length;
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata taarifa za mtumiaji." });
  }
});
router.post("/auth/logout", nmyAuthMiddleware, async (req, res) => {
  try {
    if (req.session) {
      await db2.revokeSession(req.session.token);
    }
    await db2.addAuditLog({
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorRole: req.user.role,
      action: "LOGOUT",
      target: `USER:${req.user.id}`,
      targetId: req.user.id,
      details: "User logged out"
    });
    res.json({ success: true, message: "Umetoka kikamilifu." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kutoka kwenye akaunti." });
  }
});
router.post("/auth/change-password", nmyAuthMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = req.user;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Weka neno la siri la sasa na jipya." });
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Maneno mapya ya siri hayafanani." });
    }
    if (newPassword === "1234") {
      return res.status(400).json({ success: false, message: "Huwezi kutumia 1234 tena. Chagua neno la siri salama." });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, message: "Neno jipya la siri lazima liwe na angalau tarakimu 4." });
    }
    const isMatch = await import_bcryptjs.default.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Neno la siri la sasa si sahihi." });
    }
    const salt = await import_bcryptjs.default.genSalt(10);
    const hashedPassword = await import_bcryptjs.default.hash(newPassword, salt);
    await db2.updateUser(user.id, {
      password: hashedPassword,
      mustChangePassword: false
    });
    await db2.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: "PASSWORD_CHANGE",
      target: `USER:${user.id}`,
      targetId: user.id,
      details: "User successfully changed account password and cleared mustChangePassword flag."
    });
    res.json({ success: true, message: "Neno la siri limebadilishwa kikamilifu." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kubadilisha neno la siri." });
  }
});
router.put("/auth/language", nmyAuthMiddleware, async (req, res) => {
  try {
    const { language } = req.body;
    if (language !== "sw" && language !== "en") {
      return res.status(400).json({ success: false, message: "Lugha lazima iwe sw au en." });
    }
    await db2.updateUser(req.user.id, { language });
    res.json({ success: true, language });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kubadili lugha." });
  }
});
router.get("/auth/sessions", nmyAuthMiddleware, async (req, res) => {
  try {
    const sessions2 = await db2.getActiveSessions(req.user.id);
    res.json({ success: true, sessions: sessions2 });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata orodha ya session." });
  }
});
router.post("/auth/sessions/revoke", nmyAuthMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "Token inahitajika." });
    await db2.revokeSession(token);
    res.json({ success: true, message: "Session imesitishwa." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kusitisha session." });
  }
});
router.get("/notifications", nmyAuthMiddleware, async (req, res) => {
  try {
    const notifications2 = await db2.getNotifications(req.user.id);
    res.json({ success: true, notifications: notifications2 });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata taarifa." });
  }
});
router.put("/notifications/:id/read", nmyAuthMiddleware, async (req, res) => {
  try {
    await db2.markNotificationAsRead(String(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kusoma taarifa." });
  }
});
router.get("/notifications/vapid-public-key", async (_req, res) => {
  try {
    const key = await pushService.getPublicKey();
    res.json({ success: true, publicKey: key });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya ufunguo wa arifa." });
  }
});
router.post(["/notifications/subscribe", "/push/register"], nmyAuthMiddleware, async (req, res) => {
  try {
    const subscription = req.body.subscription || (req.body.token ? {
      endpoint: `fcm:${req.body.token}`,
      keys: { p256dh: "fcm", auth: "fcm" }
    } : null);
    if (!subscription) {
      return res.status(400).json({ success: false, message: "Taarifa za usajili wa kifaa zinahitajika." });
    }
    await pushService.saveSubscription(req.user.id, subscription, req.headers["user-agent"]);
    res.json({ success: true, message: "Kifaa kimesajiliwa kupokea arifa moja kwa moja." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kusajili kifaa kwa arifa." });
  }
});
router.post("/notifications/unsubscribe", nmyAuthMiddleware, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await pushService.removeSubscription(endpoint);
    }
    res.json({ success: true, message: "Usajili wa arifa umeondolewa." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kuondoa arifa." });
  }
});
router.post("/notifications/test-push", nmyAuthMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const deliveredCount = await pushService.sendNotificationToUser(user.id, {
      title: "Jaribio la Arifa za Simu",
      body: `Habari ${user.fullName}, mfumo wa arifa za moja kwa moja (Mobile Push) unafanya kazi kikamilifu!`,
      url: "/"
    });
    await db2.createNotification({
      userId: user.id,
      title: "Jaribio la Arifa za Simu",
      message: "Ujumbe wa jaribio la arifa umetumwa kwenye kifaa chako.",
      type: "INFO"
    });
    res.json({
      success: true,
      deliveredDevices: deliveredCount,
      message: deliveredCount > 0 ? `Arifa halisi imetumwa kwenye vifaa ${deliveredCount} vilivyosajiliwa.` : "Hakuna kifaa kilichoruhusu arifa bado. Tafadhali bonyeza Ruhusu Arifa kwanza."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kutuma arifa ya jaribio." });
  }
});
router.get("/admin/push/status", nmyAuthMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN" && req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Huna ruhusa ya kuona hali ya arifa." });
    }
    const status = await pushService.getFcmStatus();
    res.json({ success: true, pushStatus: status });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata hali ya FCM." });
  }
});
router.post("/admin/push/configure-fcm", nmyAuthMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ success: false, message: "Super Admin pekee anaweza kuweka Service Account ya FCM." });
    }
    const { serviceAccountJson } = req.body;
    if (!serviceAccountJson) {
      return res.status(400).json({ success: false, message: "Service Account JSON inahitajika." });
    }
    const result = await pushService.updateServiceAccount(serviceAccountJson);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Hitilafu ya kusajili FCM Service Account." });
  }
});
router.delete("/admin/push/configure-fcm", nmyAuthMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ success: false, message: "Super Admin pekee anaweza kuondoa Service Account." });
    }
    const result = await pushService.removeServiceAccount();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Hitilafu ya kuondoa FCM Service Account." });
  }
});
router.get("/realtime/stream", nmyAuthMiddleware, (req, res) => {
  const user = req.user;
  realtimeService.addClient(user.id, user.role, res);
});
router.get("/files", nmyAuthMiddleware, async (req, res) => {
  try {
    const files2 = await db2.getFiles({
      ownerId: req.user.id,
      role: req.user.role,
      departmentId: req.user.departmentId
    });
    res.json({ success: true, files: files2 });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata faili." });
  }
});
router.post("/files/upload", nmyAuthMiddleware, async (req, res) => {
  try {
    const { fileName, fileDataUrl, fileType } = req.body;
    if (!fileName || !fileDataUrl) {
      return res.status(400).json({ success: false, message: "Weka faili na jina la faili." });
    }
    const base64Data = fileDataUrl.includes(",") ? fileDataUrl.split(",")[1] : fileDataUrl;
    const buffer = Buffer.from(base64Data, "base64");
    const checksum = import_crypto2.default.createHash("sha256").update(buffer).digest("hex");
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const savedFile = await db2.createFile({
      id: fileId,
      userId: req.user.id,
      fileName: fileName.trim(),
      fileUrl: `/api/files/${fileId}/download`,
      fileType: fileType || "application/octet-stream",
      sizeBytes: buffer.length,
      checksum,
      storageBucket: "cloud_sql_nmy_persistent",
      isPrivate: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    await db2.addAuditLog({
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorRole: req.user.role,
      action: "FILE_UPLOADED",
      target: `FILE:${fileId}`,
      targetId: fileId,
      details: `User uploaded private file ${fileName} (${buffer.length} bytes, SHA256: ${checksum})`
    });
    res.json({ success: true, file: savedFile });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupakia faili." });
  }
});
router.delete("/files/:id", nmyAuthMiddleware, async (req, res) => {
  try {
    const fileId = String(req.params.id);
    const actor = { id: req.user.id, name: req.user.fullName, role: req.user.role };
    const result = await db2.deleteFile(fileId, actor);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    res.json({ success: true, message: result.message });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kufuta faili." });
  }
});
router.get("/customer/dashboard", nmyAuthMiddleware, requireNmyRole("CUSTOMER"), async (req, res) => {
  try {
    const userId = req.user.id;
    const balanceTzs = await db2.getCustomerCredit(userId);
    const requests2 = await db2.getRequests({ customerId: userId });
    const services2 = await db2.getServices();
    const mainService = services2.find((s) => s.code === "NIDA_MITANDAO_YOTE") || services2[0];
    const notifications2 = await db2.getNotifications(userId);
    const pending = requests2.filter((r) => r.status === "PENDING").length;
    const processing = requests2.filter((r) => r.status === "PROCESSING").length;
    const approved = requests2.filter((r) => r.status === "APPROVED").length;
    const rejected = requests2.filter((r) => r.status === "REJECTED").length;
    res.json({
      success: true,
      balanceTzs,
      counts: { pending, processing, approved, rejected, total: requests2.length },
      recentRequests: requests2.slice(0, 10),
      service: mainService,
      notifications: notifications2.slice(0, 5)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata dashboard ya mteja." });
  }
});
router.get("/customer/credit", nmyAuthMiddleware, requireNmyRole("CUSTOMER"), async (req, res) => {
  try {
    const userId = req.user.id;
    const balanceTzs = await db2.getCustomerCredit(userId);
    const ledger = await db2.getCustomerLedger(userId);
    res.json({ success: true, balanceTzs, ledger });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata salio la Credit." });
  }
});
router.get("/customer/credit/whatsapp-payment-link", nmyAuthMiddleware, requireNmyRole("CUSTOMER"), async (req, res) => {
  try {
    const user = req.user;
    const amount = Number(req.query.amount) || 1e3;
    const settings2 = await db2.getSettings();
    const rawNumber = settings2.whatsappNumber || "255748604483";
    const cleanNumber = normalizePhone2(rawNumber);
    const message = `Habari RAVINI COMPANY LIMITED (NIDA MITANDAO YOTE),

Nahitaji kuongeza RAVINI Credit kwenye akaunti yangu.

\u{1F464} Jina: ${user.fullName}
\u{1F4F1} Namba ya Simu: ${user.phone}
\u{1F4B0} Kiasi Ninachotaka: TSh ${amount.toLocaleString()}

Tafadhali nisaidie kukamilisha malipo na kuniwekea Credit.`;
    const paymentUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    res.json({
      success: true,
      paymentUrl,
      amount,
      instructions: "Utakapofungua WhatsApp, tuma ujumbe huo ili uelekezwe kukamilisha malipo ya kiasi ulichochagua."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata kiunganishi cha malipo." });
  }
});
router.post("/customer/credit/buy", nmyAuthMiddleware, requireNmyRole("CUSTOMER"), transactionRateLimiter, async (req, res) => {
  try {
    const { amountTzs, paymentMethod, paymentReference, proofImageUrl } = req.body;
    const user = req.user;
    const amount = Number(amountTzs);
    if (!amount || amount < 100) {
      return res.status(400).json({ success: false, message: "Kiwango cha chini cha kuongeza Credit ni TSh 100." });
    }
    if (!paymentReference || !paymentMethod) {
      return res.status(400).json({ success: false, message: "Weka njia ya malipo na namba ya kumbukumbu (Reference)." });
    }
    const creditReq = await db2.createCreditRequest({
      id: `cr_req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      customerId: user.id,
      customerName: user.fullName,
      customerPhone: user.phone,
      amountTzs: amount,
      paymentMethod,
      paymentReference: paymentReference.trim(),
      proofImageUrl,
      status: "PENDING_VERIFICATION",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    await db2.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: "CUSTOMER",
      action: "CREDIT_TOPUP_REQUEST",
      target: `CREDIT_REQUEST:${creditReq.id}`,
      targetId: creditReq.id,
      details: `Customer requested top-up of TSh ${amount} via ${paymentMethod} (Ref: ${paymentReference})`
    });
    res.status(201).json({
      success: true,
      message: "Ombi lako la kuongeza Credit limepokelewa na linasubiri uhakiki wa Uongozi wa RAVINI.",
      creditRequest: creditReq
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kuomba kuongeza Credit." });
  }
});
router.get("/customer/credit/requests", nmyAuthMiddleware, requireNmyRole("CUSTOMER"), async (req, res) => {
  try {
    const all = await db2.getCreditRequests();
    const mine = all.filter((r) => r.customerId === req.user.id);
    res.json({ success: true, requests: mine });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata maombi ya Credit." });
  }
});
router.post("/customer/credit/whatsapp-action", nmyAuthMiddleware, requireNmyRole("CUSTOMER"), async (req, res) => {
  try {
    const user = req.user;
    const requestedAmount = Number(req.body.amountTzs) || 1e3;
    const settings2 = await db2.getSettings();
    const rawNumber = settings2.whatsappNumber || "255748604483";
    const cleanNumber = normalizePhone2(rawNumber);
    const message = `Habari Uongozi wa RAVINI (NIDA MITANDAO YOTE),
Naitwa: ${user.fullName}
Namba ya Simu: ${user.phone}
User ID: ${user.id}

Nahitaji kuongeza Credit ya TSh ${requestedAmount.toLocaleString()}.
Nimefanya/nafanya malipo ya fedha kwa njia ya simu. Tafadhali nipokee malipo na uniongezee Credit kwenye akaunti yangu.`;
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    res.json({
      success: true,
      whatsappUrl,
      prefilledMessage: message,
      amountTzs: requestedAmount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kuandaa mawasiliano ya WhatsApp." });
  }
});
router.post("/customer/requests", nmyAuthMiddleware, requireNmyRole("CUSTOMER"), transactionRateLimiter, async (req, res) => {
  try {
    const targetPhoneNumber = req.body.targetPhoneNumber || req.body.targetPhone;
    const user = req.user;
    if (!targetPhoneNumber) {
      return res.status(400).json({ success: false, message: "Weka namba ya simu ya mteja (tarakimu 10)." });
    }
    const cleanTargetPhone = String(targetPhoneNumber).replace(/\D/g, "");
    if (!/^0\d{9}$/.test(cleanTargetPhone)) {
      return res.status(400).json({
        success: false,
        message: "Namba ya simu lazima iwe na tarakimu 10 na ianze na 0 (mfano: 0712345678)."
      });
    }
    const settings2 = await db2.getSettings();
    if (settings2.emergencyLockActive) {
      return res.status(423).json({
        success: false,
        message: settings2.emergencyLockReason || "Huduma imesimamishwa kwa muda kwa ajili ya usalama wa mfumo (Emergency Lock)."
      });
    }
    const recentRequests = await db2.getRequests({ customerId: user.id });
    const duplicate = recentRequests.find(
      (r) => r.targetPhoneNumber === cleanTargetPhone && Date.now() - new Date(r.createdAt).getTime() < 1e4
    );
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Ombi la namba hii tayari limepokelewa sekunde chache zilizopita. Tafadhali subiri lifanyiwe kazi."
      });
    }
    const services2 = await db2.getServices();
    const service = services2.find((s) => s.code === "NIDA_MITANDAO_YOTE") || services2[0];
    if (!service || !service.isActive) {
      return res.status(503).json({
        success: false,
        message: "HUDUMA HII HAIJAPATIKANA KWA SASA. UTAPEWA TAARIFA ITAKAPOPATIKANA."
      });
    }
    const chargedPrice = service.priceTzs;
    if (chargedPrice === void 0 || chargedPrice === null) {
      return res.status(500).json({
        success: false,
        message: "HUDUMA HAJAWEKEWA BEI. Tafadhali wasiliana na Uongozi."
      });
    }
    const currentBalance = await db2.getCustomerCredit(user.id);
    if (currentBalance < chargedPrice) {
      return res.status(402).json({
        success: false,
        code: "INSUFFICIENT_CREDIT",
        message: `Huna salio la kutosha la Credit. Salio lako ni TSh ${currentBalance.toLocaleString()} wakati huduma inahitaji TSh ${chargedPrice.toLocaleString()}. Tafadhali ongeza Credit.`,
        currentBalance,
        requiredPrice: chargedPrice
      });
    }
    const requestId = generateRequestId();
    const chargeResult = await db2.chargeCustomerCredit({
      userId: user.id,
      amount: chargedPrice,
      requestId,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: "CUSTOMER",
      reason: `Malipo ya ombi la NIDA kwa namba ${cleanTargetPhone}`
    });
    const newRequest = {
      id: requestId,
      customerId: user.id,
      customerName: user.fullName,
      customerPhone: user.phone,
      serviceId: service.id,
      serviceCode: service.code,
      serviceName: service.name,
      targetPhoneNumber: cleanTargetPhone,
      chargedPriceTzs: chargedPrice,
      // Snapshot price
      status: "PENDING",
      refundStatus: "NONE",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await db2.createRequest(newRequest);
    await db2.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: "CUSTOMER",
      action: "REQUEST_CREATED",
      target: `REQUEST:${requestId}`,
      targetId: requestId,
      details: `Customer submitted request ${requestId} for ${cleanTargetPhone}. Charged: TSh ${chargedPrice}. New balance: TSh ${chargeResult.balanceAfter}.`
    });
    await db2.createNotification({
      userId: user.id,
      title: "Ombi Limepokelewa",
      message: `Ombi lako la namba ${cleanTargetPhone} limepokelewa kikamilifu na linasubiri kushughulikiwa.`,
      type: "REQUEST"
    });
    pushService.sendNotificationToUser(user.id, {
      title: "Ombi Limepokelewa",
      message: `Ombi lako la namba ${cleanTargetPhone} limepokelewa kikamilifu.`,
      type: "REQUEST",
      url: "/maombi",
      eventKey: `req_recv_${requestId}`
    }).catch((err) => console.warn("[PUSH REQ RECV ERROR]:", err.message));
    pushService.sendNotificationToRole("ADMIN", {
      title: "Ombi Jipya la NIDA",
      message: `Ombi jipya la namba ${cleanTargetPhone} kutoka kwa ${user.fullName} limeingia kwenye foleni.`,
      type: "REQUEST",
      url: "/huduma",
      eventKey: `new_req_adm_${requestId}`
    }).catch((err) => console.warn("[PUSH NEW REQ ADMIN ERROR]:", err.message));
    pushService.sendNotificationToRole("SUPER_ADMIN", {
      title: "Ombi Jipya la NIDA",
      message: `Ombi jipya la namba ${cleanTargetPhone} kutoka kwa ${user.fullName} limeingia kwenye foleni.`,
      type: "REQUEST",
      url: "/huduma",
      eventKey: `new_req_sa_${requestId}`
    }).catch((err) => console.warn("[PUSH NEW REQ SA ERROR]:", err.message));
    realtimeService.notifyRole("ADMIN", { type: "NEW_REQUEST", requestId, customerName: user.fullName });
    realtimeService.notifyRole("SUPER_ADMIN", { type: "NEW_REQUEST", requestId, customerName: user.fullName });
    realtimeService.notifyUser(user.id, { type: "REQUEST_CREATED", requestId, newBalance: chargeResult.balanceAfter });
    res.status(201).json({
      success: true,
      message: "Ombi lako limepokelewa na linasubiri usindikaji.",
      request: newRequest,
      newBalance: chargeResult.balanceAfter
    });
  } catch (err) {
    console.error("[Create Request Error]:", err);
    res.status(500).json({ success: false, message: "Hitilafu ya kutengeneza ombi." });
  }
});
router.get("/customer/requests", nmyAuthMiddleware, requireNmyRole("CUSTOMER"), async (req, res) => {
  try {
    await db2.checkAndExpireTimedOutRequests().catch(() => {
    });
    const requests2 = await db2.getRequests({ customerId: req.user.id });
    res.json({ success: true, requests: requests2 });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata maombi yako." });
  }
});
router.post("/customer/requests/:id/resubmit", nmyAuthMiddleware, requireNmyRole("CUSTOMER"), transactionRateLimiter, async (req, res) => {
  try {
    const user = req.user;
    const oldRequest = await db2.getRequestById(String(req.params.id));
    if (!oldRequest || oldRequest.customerId !== user.id) {
      return res.status(404).json({ success: false, message: "Ombi halikupatikana." });
    }
    if (oldRequest.status !== "EXPIRED" && oldRequest.status !== "REJECTED") {
      return res.status(400).json({ success: false, message: "Ombi hili haliwezi kutumwa upya kwa sababu halijaisha muda wala kukataliwa." });
    }
    const settings2 = await db2.getSettings();
    if (settings2.emergencyLockActive) {
      return res.status(423).json({ success: false, message: settings2.emergencyLockReason || "Huduma imesimamishwa kwa dharura." });
    }
    const services2 = await db2.getServices();
    const service = services2.find((s) => s.id === oldRequest.serviceId) || services2[0];
    const chargedPrice = service?.priceTzs ?? oldRequest.chargedPriceTzs;
    const currentBalance = await db2.getCustomerCredit(user.id);
    if (currentBalance < chargedPrice) {
      return res.status(402).json({
        success: false,
        code: "INSUFFICIENT_CREDIT",
        message: `Huna salio la kutosha la Credit kutuma tena ombi hili. Salio lako ni TSh ${currentBalance.toLocaleString()} wakati huduma inahitaji TSh ${chargedPrice.toLocaleString()}.`,
        currentBalance,
        requiredPrice: chargedPrice
      });
    }
    const newRequestId = generateRequestId();
    const chargeResult = await db2.chargeCustomerCredit({
      userId: user.id,
      amount: chargedPrice,
      requestId: newRequestId,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: "CUSTOMER",
      reason: `Kutuma tena ombi la NIDA kwa namba ${oldRequest.targetPhoneNumber} (Kufuatia ${oldRequest.status.toLowerCase()})`
    });
    const newReq = {
      id: newRequestId,
      customerId: user.id,
      customerName: user.fullName,
      customerPhone: user.phone,
      serviceId: service.id,
      serviceCode: service.code,
      serviceName: service.name,
      targetPhoneNumber: oldRequest.targetPhoneNumber,
      chargedPriceTzs: chargedPrice,
      status: "PENDING",
      refundStatus: "NONE",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await db2.createRequest(newReq);
    await db2.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: "CUSTOMER",
      action: "REQUEST_RESUBMITTED",
      target: `REQUEST:${newRequestId}`,
      targetId: newRequestId,
      details: `Mteja ametuma tena ombi ${newRequestId} kwa namba ${oldRequest.targetPhoneNumber} kufuatia ombi la awali ${oldRequest.id} kuwa ${oldRequest.status}. Kiasi: TSh ${chargedPrice}. Salio jipya: TSh ${chargeResult.balanceAfter}.`
    });
    pushService.sendNotificationToRole("ADMIN", {
      title: "Ombi Jipya la NIDA (Limerudiwa)",
      message: `Mteja ametuma tena ombi jipya kwa ajili ya ${oldRequest.targetPhoneNumber}.`,
      url: "/admin/requests",
      type: "INFO"
    }).catch(() => {
    });
    pushService.sendNotificationToRole("SUPER_ADMIN", {
      title: "Ombi Jipya la NIDA (Limerudiwa)",
      message: `Ombi jipya limetumwa tena kwa namba ${oldRequest.targetPhoneNumber}.`,
      url: "/super-admin/requests",
      type: "INFO"
    }).catch(() => {
    });
    realtimeService.notifyRole("ADMIN", { type: "NEW_REQUEST", requestId: newRequestId, customerName: user.fullName });
    realtimeService.notifyRole("SUPER_ADMIN", { type: "NEW_REQUEST", requestId: newRequestId, customerName: user.fullName });
    realtimeService.notifyUser(user.id, { type: "REQUEST_CREATED", requestId: newRequestId, newBalance: chargeResult.balanceAfter });
    res.status(201).json({
      success: true,
      message: "Ombi lako limetumwa upya kikamilifu na linasubiri usindikaji.",
      request: newReq,
      newBalance: chargeResult.balanceAfter
    });
  } catch (err) {
    console.error("[Resubmit Request Error]:", err);
    res.status(500).json({ success: false, message: "Hitilafu ya kutuma tena ombi." });
  }
});
router.get("/customer/requests/:id", nmyAuthMiddleware, requireNmyRole("CUSTOMER"), async (req, res) => {
  try {
    const request = await db2.getRequestById(String(req.params.id));
    if (!request || request.customerId !== req.user.id) {
      return res.status(404).json({ success: false, message: "Ombi halikupatikana." });
    }
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata ombi." });
  }
});
router.delete("/customer/requests/:id", nmyAuthMiddleware, requireNmyRole("CUSTOMER"), async (req, res) => {
  try {
    const reqId = String(req.params.id);
    const result = await db2.deleteCustomerRequest(reqId, req.user.id);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.json({
      success: true,
      message: "Ombi limefutwa kikamilifu kwenye orodha yako. Kumbukumbu za muamala zimehifadhiwa salama."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kufuta ombi." });
  }
});
router.post("/customer/requests/:id/delete", nmyAuthMiddleware, requireNmyRole("CUSTOMER"), async (req, res) => {
  try {
    const reqId = String(req.params.id);
    const result = await db2.deleteCustomerRequest(reqId, req.user.id);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.json({
      success: true,
      message: "Ombi limefutwa kikamilifu kwenye orodha yako. Kumbukumbu za muamala zimehifadhiwa salama."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kufuta ombi." });
  }
});
router.get("/admin/dashboard", nmyAuthMiddleware, requireNmyRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const user = req.user;
    const allRequests = await db2.getRequests();
    const pendingRequests = allRequests.filter((r) => r.status === "PENDING");
    const myHandled = allRequests.filter((r) => r.claimedByWorkerId === user.id);
    const myProcessing = myHandled.filter((r) => r.status === "PROCESSING");
    const myCompleted = myHandled.filter((r) => r.status === "APPROVED");
    const myRejected = myHandled.filter((r) => r.status === "REJECTED");
    const myExpired = myHandled.filter((r) => r.status === "EXPIRED");
    let workAccountBalance = 0;
    if (user.role === "ADMIN") {
      workAccountBalance = await db2.getAdminWorkCredit(user.id);
    } else {
      workAccountBalance = await db2.getSuperAdminWorkCredit(user.id);
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
      pendingRequests: pendingRequests.slice(0, 50).map((r) => sanitizeRequestForViewer(r, user)),
      processingRequests: myProcessing.map((r) => sanitizeRequestForViewer(r, user)),
      recentCompleted: myCompleted.map((r) => sanitizeRequestForViewer(r, user)),
      myAllHandled: myHandled.map((r) => sanitizeRequestForViewer(r, user))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata dashboard ya Admin." });
  }
});
router.get("/admin/work-account", nmyAuthMiddleware, requireNmyRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const user = req.user;
    let balanceTzs = 0;
    let ledger = [];
    if (user.role === "ADMIN") {
      balanceTzs = await db2.getAdminWorkCredit(user.id);
      ledger = await db2.getAdminWorkLedger(user.id);
    } else {
      balanceTzs = await db2.getSuperAdminWorkCredit(user.id);
      ledger = await db2.getSuperAdminWorkLedger(user.id);
    }
    res.json({ success: true, balanceTzs, ledger });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata akaunti ya kazi." });
  }
});
router.post("/super-admin/work-account/reset-balance", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const actor = { id: req.user.id, name: req.user.fullName };
    const { reason } = req.body;
    const result = await db2.resetSuperAdminWorkBalance(req.user.id, actor, reason);
    res.json({
      success: true,
      message: `Salio la kazi la Super Admin limewekwa kuwa TSh 0 (Lilikuwa TSh ${result.balanceBefore.toLocaleString()}).`,
      balanceBefore: result.balanceBefore,
      balanceAfter: 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kurekebisha salio la kazi kuwa 0." });
  }
});
router.get("/admin/requests", nmyAuthMiddleware, requireNmyRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const user = req.user;
    const { status } = req.query;
    const requests2 = await db2.getRequests({ status });
    const sanitized = requests2.map((r) => sanitizeRequestForViewer(r, user));
    res.json({ success: true, requests: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata maombi ya wateja." });
  }
});
router.post("/admin/requests/:id/claim", nmyAuthMiddleware, requireNmyRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const user = req.user;
    const reqId = String(req.params.id);
    const result = await db2.claimRequest({
      requestId: reqId,
      workerId: user.id,
      workerName: user.fullName,
      workerRole: user.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN"
    });
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    await db2.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: "REQUEST_CLAIMED",
      target: `REQUEST:${reqId}`,
      targetId: reqId,
      details: `${user.role} ${user.fullName} claimed request ${reqId} for processing.`
    });
    if (result.request?.customerId) {
      const targetPhone = result.request.targetPhoneNumber;
      await db2.createNotification({
        userId: result.request.customerId,
        title: "Ombi Linashughulikiwa",
        message: `Mhudumu wetu ameanza kushughulikia ombi lako la namba ${targetPhone}.`,
        type: "REQUEST"
      });
      pushService.sendNotificationToUser(result.request.customerId, {
        title: "Ombi Linashughulikiwa",
        message: `Mhudumu wetu ameanza kushughulikia ombi lako la namba ${targetPhone}.`,
        type: "REQUEST",
        url: "/maombi",
        eventKey: `req_proc_${reqId}`
      }).catch((err) => console.warn("[PUSH CLAIM ERROR]:", err.message));
      realtimeService.notifyUser(result.request.customerId, { type: "REQUEST_UPDATED", requestId: reqId, status: "PROCESSING" });
      realtimeService.notifyRole("ADMIN", { type: "REQUEST_UPDATED", requestId: reqId, status: "PROCESSING" });
      realtimeService.notifyRole("SUPER_ADMIN", { type: "REQUEST_UPDATED", requestId: reqId, status: "PROCESSING" });
    }
    res.json({
      success: true,
      message: "Umechukua ombi hili. Sasa unaweza kuingiza namba ya NIDA ili kulikamilisha.",
      request: result.request
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kuchukua ombi." });
  }
});
router.post("/admin/requests/:id/complete", nmyAuthMiddleware, requireNmyRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const nidaResult = req.body.nidaResult || req.body.nidaNumber;
    const user = req.user;
    if (!nidaResult) {
      return res.status(400).json({ success: false, message: "Weka namba ya NIDA ya tarakimu 20." });
    }
    const cleanNida = String(nidaResult).replace(/\D/g, "");
    if (!/^\d{20}$/.test(cleanNida)) {
      return res.status(400).json({
        success: false,
        message: "Namba ya NIDA lazima iwe na tarakimu 20 haswa (mfano: 19900101111010000123)."
      });
    }
    const reqId = String(req.params.id);
    const result = await db2.completeRequest({
      requestId: reqId,
      workerId: user.id,
      nidaResult: cleanNida
    });
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    await db2.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: "REQUEST_APPROVED",
      target: `REQUEST:${reqId}`,
      targetId: reqId,
      details: `${user.role} ${user.fullName} completed request ${reqId}. NIDA: ${cleanNida}. Earned: TSh ${result.request?.chargedPriceTzs}.`
    });
    if (result.request?.customerId) {
      const targetPhone = result.request.targetPhoneNumber;
      await db2.createNotification({
        userId: result.request.customerId,
        title: "Ombi Limekamilika! \u2705",
        message: `Ombi lako la namba ${targetPhone} limekamilika na namba yako ya NIDA ipo tayari.`,
        type: "REQUEST"
      });
      pushService.sendNotificationToUser(result.request.customerId, {
        title: "Ombi Limekamilika! \u2705",
        message: `Ombi lako la namba ${targetPhone} limekamilika. NIDA ipo tayari.`,
        type: "REQUEST",
        url: "/maombi",
        eventKey: `req_appr_${reqId}`
      }).catch((err) => console.warn("[PUSH COMPLETE ERROR]:", err.message));
      realtimeService.notifyUser(result.request.customerId, { type: "REQUEST_UPDATED", requestId: reqId, status: "APPROVED" });
      realtimeService.notifyRole("ADMIN", { type: "REQUEST_UPDATED", requestId: reqId, status: "APPROVED" });
      realtimeService.notifyRole("SUPER_ADMIN", { type: "REQUEST_UPDATED", requestId: reqId, status: "APPROVED" });
    }
    res.json({
      success: true,
      message: "Ombi limekamilika na kupitishwa kikamilifu. Mapato yameingizwa kwenye Salio lako la Kazi.",
      request: result.request
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kukamilisha ombi." });
  }
});
router.post("/admin/requests/:id/reject", nmyAuthMiddleware, requireNmyRole("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const { reason } = req.body;
    const user = req.user;
    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Weka sababu halisi ya kukataa ombi hili."
      });
    }
    const reqId = String(req.params.id);
    const result = await db2.rejectRequest({
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
    await db2.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: "REQUEST_REJECTED",
      target: `REQUEST:${reqId}`,
      targetId: reqId,
      details: `${user.role} ${user.fullName} rejected request ${reqId}. Reason: ${reason.trim()}. Refunded TSh ${targetReq?.chargedPriceTzs}.`
    });
    if (targetReq?.customerId) {
      const refundTzs = targetReq.chargedPriceTzs || 100;
      await db2.createNotification({
        userId: targetReq.customerId,
        title: "Ombi la NIDA Limekataliwa",
        message: `Ombi lako la namba ${targetReq.targetPhoneNumber} limekataliwa. Sababu: ${reason.trim()}. Salio la TSh ${refundTzs.toLocaleString()} limerejeshwa kwenye akaunti yako.`,
        type: "REQUEST"
      });
      pushService.sendNotificationToUser(targetReq.customerId, {
        title: "Ombi Limekataliwa",
        message: `Ombi lako la namba ${targetReq.targetPhoneNumber} limekataliwa na salio limerejeshwa. Fungua app kuona maelezo kamili.`,
        type: "REQUEST",
        url: "/maombi",
        eventKey: `req_rej_${reqId}`
      }).catch((err) => console.warn("[PUSH REJECTION ERROR]:", err.message));
      realtimeService.notifyUser(targetReq.customerId, { type: "REQUEST_UPDATED", requestId: reqId, status: "REJECTED" });
      realtimeService.notifyRole("ADMIN", { type: "REQUEST_UPDATED", requestId: reqId, status: "REJECTED" });
      realtimeService.notifyRole("SUPER_ADMIN", { type: "REQUEST_UPDATED", requestId: reqId, status: "REJECTED" });
    }
    res.json({
      success: true,
      message: "Ombi limekataliwa na mteja amerudishiwa salio lake la Credit kikamilifu.",
      request: targetReq
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kukataa ombi." });
  }
});
router.get("/super-admin/overview", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (_req, res) => {
  try {
    await db2.checkAndExpireTimedOutRequests();
    const users2 = await db2.getUsers();
    const requests2 = await db2.getRequests();
    const creditRequests2 = await db2.getCreditRequests();
    const ledger = await db2.getAllCreditLedger();
    const settings2 = await db2.getSettings();
    const customers = users2.filter((u) => u.role === "CUSTOMER");
    const admins = users2.filter((u) => u.role === "ADMIN");
    const pendingRequests = requests2.filter((r) => r.status === "PENDING").length;
    const processingRequests = requests2.filter((r) => r.status === "PROCESSING").length;
    const approvedRequests = requests2.filter((r) => r.status === "APPROVED").length;
    const rejectedRequests = requests2.filter((r) => r.status === "REJECTED").length;
    const expiredRequests = requests2.filter((r) => r.status === "EXPIRED").length;
    const pendingCreditRequests = creditRequests2.filter((r) => r.status === "PENDING_VERIFICATION").length;
    let totalCustomerBalances = 0;
    for (const c of customers) {
      totalCustomerBalances += await db2.getCustomerCredit(c.id);
    }
    res.json({
      success: true,
      stats: {
        totalCustomers: customers.length,
        totalAdmins: admins.length,
        totalRequests: requests2.length,
        pendingRequests,
        processingRequests,
        approvedRequests,
        rejectedRequests,
        expiredRequests,
        pendingCreditRequests,
        totalCustomerBalances,
        servicePriceTzs: settings2.servicePriceTzs,
        appAccessOpen: settings2.appAccessOpen,
        publicRegistrationOpen: settings2.publicRegistrationOpen
      },
      recentRequests: requests2.slice(0, 10),
      recentCreditRequests: creditRequests2.slice(0, 5),
      recentLedger: ledger.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata taarifa za Super Admin." });
  }
});
router.get("/super-admin/users", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (_req, res) => {
  try {
    const users2 = await db2.getUsers();
    const allLedger = await db2.getAllCreditLedger();
    const allRequests = await db2.getRequests();
    const list = await Promise.all(
      users2.map(async (u) => {
        const isCustomer = u.role === "CUSTOMER";
        const isAdmin = u.role === "ADMIN";
        const isSuperAdmin = u.role === "SUPER_ADMIN";
        let creditBal = 0;
        let totalAdded = 0;
        let totalCharged = 0;
        let totalRefunded = 0;
        let lastTx = null;
        if (isCustomer) {
          creditBal = await db2.getCustomerCredit(u.id);
          const cLedger = allLedger.filter((l) => l.userId === u.id);
          for (const e of cLedger) {
            if (e.type === "ADD") totalAdded += e.amount;
            else if (e.type === "CHARGE") totalCharged += e.amount;
            else if (e.type === "REFUND") totalRefunded += e.amount;
          }
          if (cLedger.length > 0) {
            const sorted = [...cLedger].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            lastTx = sorted[0];
          }
        }
        let workBal = 0;
        let totalEarnings = 0;
        let workMetrics = null;
        let recentWorkJobs = [];
        if (isAdmin || isSuperAdmin) {
          workBal = isAdmin ? await db2.getAdminWorkCredit(u.id) : await db2.getSuperAdminWorkCredit(u.id);
          const workLedger = isAdmin ? await db2.getAdminWorkLedger(u.id) : await db2.getSuperAdminWorkLedger(u.id);
          for (const w of workLedger) {
            totalEarnings += w.amount;
          }
          const assigned = allRequests.filter((r) => r.claimedByWorkerId === u.id);
          workMetrics = {
            totalClaimed: assigned.length,
            completedCount: assigned.filter((r) => r.status === "APPROVED").length,
            processingCount: assigned.filter((r) => r.status === "PROCESSING").length,
            rejectedCount: assigned.filter((r) => r.status === "REJECTED").length,
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
          creditBalance: isCustomer ? creditBal : void 0,
          creditBalanceTzs: isCustomer ? creditBal : void 0,
          totalCreditAdded: isCustomer ? totalAdded : void 0,
          totalCreditCharged: isCustomer ? totalCharged : void 0,
          totalRefunded: isCustomer ? totalRefunded : void 0,
          lastTransaction: lastTx,
          workBalance: isAdmin || isSuperAdmin ? workBal : void 0,
          workBalanceTzs: isAdmin || isSuperAdmin ? workBal : void 0,
          totalWorkEarningsTzs: isAdmin || isSuperAdmin ? totalEarnings : void 0,
          workMetrics: workMetrics || void 0,
          recentJobs: isAdmin || isSuperAdmin ? recentWorkJobs : void 0
        };
      })
    );
    res.json({ success: true, users: list });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata orodha ya watumiaji." });
  }
});
router.get("/super-admin/customers/credits", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (_req, res) => {
  try {
    const users2 = await db2.getUsers();
    const customers = users2.filter((u) => u.role === "CUSTOMER");
    const allLedger = await db2.getAllCreditLedger();
    const customerCreditList = await Promise.all(
      customers.map(async (c) => {
        const balanceTzs = await db2.getCustomerCredit(c.id);
        const cLedger = allLedger.filter((l) => l.userId === c.id);
        let totalAdded = 0;
        let totalCharged = 0;
        let totalRefunded = 0;
        let totalAdjustments = 0;
        for (const entry of cLedger) {
          if (entry.type === "ADD") totalAdded += entry.amount;
          else if (entry.type === "CHARGE") totalCharged += entry.amount;
          else if (entry.type === "REFUND") totalRefunded += entry.amount;
          else if (entry.type === "ADJUSTMENT") totalAdjustments += entry.amount;
        }
        const sorted = [...cLedger].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const lastTx = sorted[0] || null;
        return {
          id: c.id,
          fullName: c.fullName,
          phone: c.phone,
          status: c.status,
          createdAt: c.createdAt,
          lastLoginAt: c.lastLoginAt,
          currentBalanceTzs: balanceTzs,
          totalAddedTzs: totalAdded,
          totalChargedTzs: totalCharged,
          totalRefundedTzs: totalRefunded,
          totalAdjustedTzs: totalAdjustments,
          lastTransaction: lastTx ? {
            id: lastTx.id,
            amount: lastTx.amount,
            type: lastTx.type,
            reference: lastTx.reference,
            reason: lastTx.reason,
            timestamp: lastTx.timestamp
          } : null,
          ledgerCount: cLedger.length,
          recentLedger: sorted.slice(0, 10)
        };
      })
    );
    let totalOutstanding = 0;
    let totalAddedEver = 0;
    let totalChargedEver = 0;
    let totalRefundedEver = 0;
    for (const c of customerCreditList) {
      totalOutstanding += c.currentBalanceTzs;
      totalAddedEver += c.totalAddedTzs;
      totalChargedEver += c.totalChargedTzs;
      totalRefundedEver += c.totalRefundedTzs;
    }
    res.json({
      success: true,
      customers: customerCreditList,
      summary: {
        totalCustomers: customers.length,
        totalCustomersWithCredit: customerCreditList.filter((c) => c.currentBalanceTzs > 0).length,
        totalOutstandingCreditTzs: totalOutstanding,
        totalCreditAddedEverTzs: totalAddedEver,
        totalCreditChargedEverTzs: totalChargedEver,
        totalRefundedEverTzs: totalRefundedEver
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata taarifa za Credit za wateja." });
  }
});
router.get("/super-admin/work-history/admins", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (_req, res) => {
  try {
    const users2 = await db2.getUsers();
    const admins = users2.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN");
    const allRequests = await db2.getRequests();
    const adminWorkList = await Promise.all(
      admins.map(async (adm) => {
        const isSuper = adm.role === "SUPER_ADMIN";
        const workBalance = isSuper ? await db2.getSuperAdminWorkCredit(adm.id) : await db2.getAdminWorkCredit(adm.id);
        const workLedger = isSuper ? await db2.getSuperAdminWorkLedger(adm.id) : await db2.getAdminWorkLedger(adm.id);
        const assignedJobs = allRequests.filter((r) => r.claimedByWorkerId === adm.id);
        const processingJobs = assignedJobs.filter((r) => r.status === "PROCESSING");
        const completedJobs = assignedJobs.filter((r) => r.status === "APPROVED");
        const rejectedJobs = assignedJobs.filter((r) => r.status === "REJECTED");
        let totalEarnings = 0;
        for (const entry of workLedger) {
          totalEarnings += entry.amount;
        }
        const jobsWithDurations = assignedJobs.map((job) => {
          let durationMs = null;
          let durationHuman = null;
          if (job.claimedAt && (job.completedAt || job.rejectedAt)) {
            const end = new Date(job.completedAt || job.rejectedAt).getTime();
            const start = new Date(job.claimedAt).getTime();
            durationMs = Math.max(0, end - start);
            const secs = Math.floor(durationMs / 1e3);
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
          departmentId: adm.departmentId || "dept_nida_processing",
          permissions: adm.permissions || [],
          createdAt: adm.createdAt,
          lastLoginAt: adm.lastLoginAt,
          workBalanceTzs: workBalance,
          totalWorkEarningsTzs: totalEarnings,
          metrics: {
            totalClaimed: assignedJobs.length,
            processingCount: processingJobs.length,
            completedCount: completedJobs.length,
            rejectedCount: rejectedJobs.length,
            completionRate: assignedJobs.length > 0 ? Math.round(completedJobs.length / assignedJobs.length * 100) : 0
          },
          jobs: jobsWithDurations,
          workLedger
        };
      })
    );
    const totalJobsProcessed = allRequests.filter((r) => r.claimedByWorkerId).length;
    const totalJobsCompleted = allRequests.filter((r) => r.status === "APPROVED").length;
    const totalJobsRejected = allRequests.filter((r) => r.status === "REJECTED").length;
    res.json({
      success: true,
      admins: adminWorkList,
      summary: {
        totalAdmins: admins.filter((a) => a.role === "ADMIN").length,
        totalJobsProcessed,
        totalJobsCompleted,
        totalJobsRejected
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata taarifa za kazi za Admins." });
  }
});
router.get("/super-admin/work-history/all", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (_req, res) => {
  try {
    const allRequests = await db2.getRequests();
    const jobs = allRequests.map((job) => {
      let durationMs = null;
      let durationHuman = null;
      if (job.claimedAt && (job.completedAt || job.rejectedAt)) {
        const end = new Date(job.completedAt || job.rejectedAt).getTime();
        const start = new Date(job.claimedAt).getTime();
        durationMs = Math.max(0, end - start);
        const secs = Math.floor(durationMs / 1e3);
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
        pendingJobs: allRequests.filter((r) => r.status === "PENDING").length,
        processingJobs: allRequests.filter((r) => r.status === "PROCESSING").length,
        completedJobs: allRequests.filter((r) => r.status === "APPROVED").length,
        rejectedJobs: allRequests.filter((r) => r.status === "REJECTED").length,
        expiredJobs: allRequests.filter((r) => r.status === "EXPIRED").length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata historia ya kazi zote." });
  }
});
router.put(["/super-admin/users/:id/status", "/admin/users/:id/status"], nmyAuthMiddleware, async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (status !== "ACTIVE" && status !== "SUSPENDED" && status !== "DISABLED") {
      return res.status(400).json({ success: false, message: "Hali (status) si sahihi." });
    }
    const actor = req.user;
    const userId = String(req.params.id);
    const targetUser = await db2.getUserById(userId);
    if (!targetUser) return res.status(404).json({ success: false, message: "Mtumiaji hakupatikana." });
    if (actor.role === "CUSTOMER") {
      return res.status(403).json({ success: false, message: "Huna mamlaka ya kubadilisha hali ya akaunti." });
    }
    if (actor.role === "ADMIN") {
      const hasUserManagement = Array.isArray(actor.permissions) && (actor.permissions.includes("MANAGE_USERS") || actor.permissions.includes("ALL"));
      if (!hasUserManagement) {
        return res.status(403).json({ success: false, message: 'Huna mamlaka ya kubadili hali ya watumiaji. Super Admin pekee anaweza kukupa ruhusa ya "MANAGE_USERS".' });
      }
      if (targetUser.role !== "CUSTOMER") {
        return res.status(403).json({ success: false, message: "Huna mamlaka ya kubadilisha hali ya akaunti ya mtumishi au Super Admin." });
      }
    }
    if (actor.id === userId && status !== "ACTIVE") {
      return res.status(400).json({ success: false, message: "Huwezi kujifunga akaunti yako mwenyewe." });
    }
    const updated = await db2.updateUser(userId, { status });
    if (!updated) return res.status(404).json({ success: false, message: "Mtumiaji hakupatikana." });
    const isLocking = status === "SUSPENDED" || status === "DISABLED";
    if (isLocking) {
      await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
    }
    const action = isLocking ? "ACCOUNT_LOCKED" : "ACCOUNT_UNLOCKED";
    const actionDetails = isLocking ? `${actor.role} ${actor.fullName} alifunga akaunti ya ${targetUser.fullName} (${targetUser.phone}). Sababu: ${reason || "Hatua ya kiutawala/usalama"}. Data, salio na maombi vimehifadhiwa.` : `${actor.role} ${actor.fullName} alifungua akaunti ya ${targetUser.fullName} (${targetUser.phone}).`;
    await db2.addAuditLog({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action,
      target: `USER:${userId}`,
      targetId: userId,
      details: actionDetails
    });
    res.json({
      success: true,
      message: isLocking ? `Akaunti ya ${targetUser.fullName} imefungwa (LOCKED/SUSPENDED). Data na salio vimehifadhiwa salama.` : `Akaunti ya ${targetUser.fullName} imefunguliwa na kuwezeshwa (ACTIVE).`,
      user: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || "Hitilafu ya kubadili hali ya mtumiaji." });
  }
});
router.post("/super-admin/admins/:id/credit-permission", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const adminId = String(req.params.id);
    const { canAddCredit } = req.body;
    const actor = { id: req.user.id, name: req.user.fullName };
    const result = await db2.updateAdminCreditPermission(adminId, Boolean(canAddCredit), actor);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.json({
      success: true,
      message: canAddCredit ? "Ruhusa ya kuongeza Credit imetolewa kwa Admin huyu." : "Ruhusa ya kuongeza Credit imeondolewa kwa Admin huyu.",
      user: result.user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kurekebisha ruhusa ya Admin." });
  }
});
router.post("/super-admin/users/:id/mark-for-deletion", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const userId = String(req.params.id);
    const actor = { id: req.user.id, name: req.user.fullName };
    const result = await db2.markUserForDeletion(userId, actor);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    res.json({ success: true, message: result.message, user: result.user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kuweka akaunti kwenye hatua ya kufutwa." });
  }
});
router.post("/super-admin/users/:id/restore-from-deletion", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const userId = String(req.params.id);
    const actor = { id: req.user.id, name: req.user.fullName };
    const result = await db2.restoreUserFromDeletion(userId, actor);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    res.json({ success: true, message: result.message, user: result.user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kurejesha akaunti." });
  }
});
router.delete("/super-admin/users/:id/permanent", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const userId = String(req.params.id);
    const actor = { id: req.user.id, name: req.user.fullName };
    const result = await db2.permanentlyDeleteUser(userId, actor, true);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    res.json({ success: true, message: result.message });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kufuta akaunti kabisa." });
  }
});
router.delete(["/super-admin/users/:id", "/admin/users/:id"], nmyAuthMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ success: false, message: "Super Admin pekee mwenye mamlaka ya kufuta akaunti ya mtumiaji." });
    }
    const userId = String(req.params.id);
    const actor = { id: req.user.id, name: req.user.fullName };
    const force = req.query.force === "true" || req.body?.force === true;
    const user = await db2.getUserById(userId);
    if (!user) return res.status(404).json({ success: false, message: "Mtumiaji hakupatikana." });
    if (user.status === "MARKED_FOR_DELETION" || force) {
      const result = await db2.permanentlyDeleteUser(userId, actor, true);
      if (!result.success) {
        return res.status(400).json({ success: false, message: result.message });
      }
      return res.json({ success: true, message: result.message });
    }
    const markResult = await db2.markUserForDeletion(userId, actor);
    if (!markResult.success) {
      return res.status(400).json({ success: false, message: markResult.message });
    }
    res.json({ success: true, message: markResult.message, user: markResult.user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kufuta akaunti ya mtumiaji." });
  }
});
router.post("/super-admin/users/:id/reset-password", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const userId = String(req.params.id);
    const targetUser = await db2.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Mtumiaji hakupatikana." });
    }
    if (targetUser.role === "SUPER_ADMIN" && targetUser.id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Huwezi kubadilisha neno la siri la Super Admin mwingine." });
    }
    const tempPassword = req.body.newPassword && String(req.body.newPassword).trim() ? String(req.body.newPassword).trim() : "1234";
    const salt = await import_bcryptjs.default.genSalt(10);
    const hashedPassword = await import_bcryptjs.default.hash(tempPassword, salt);
    const updated = await db2.updateUser(userId, {
      password: hashedPassword,
      mustChangePassword: true
    });
    await db2.addAuditLog({
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorRole: "SUPER_ADMIN",
      action: "PASSWORD_RESET_BY_SUPER_ADMIN",
      target: `USER:${userId}`,
      targetId: userId,
      details: `Super Admin ${req.user.fullName} reset password for ${targetUser.fullName} (${targetUser.phone}) to temporary password 1234. User is strictly required to change password on next login.`
    });
    res.json({
      success: true,
      message: `Neno la siri la ${targetUser.fullName} limewekwa upya kuwa nenosiri la muda (1234). Mtumiaji atalazimika kubadilisha nenosiri akiingia.`,
      user: updated,
      temporaryPassword: "1234"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kuweka upya neno la siri." });
  }
});
router.post("/super-admin/admins", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { fullName, phone, password, permissions, departmentId } = req.body;
    if (!fullName || !phone || !password) {
      return res.status(400).json({ success: false, message: "Jaza jina, simu na password ya Admin." });
    }
    const normalizedPhone = normalizePhone2(phone);
    const existing = await db2.getUserByPhone(normalizedPhone);
    if (existing) {
      return res.status(409).json({ success: false, message: "Namba hii ya simu tayari imesajiliwa." });
    }
    const salt = await import_bcryptjs.default.genSalt(10);
    const hashedPassword = await import_bcryptjs.default.hash(password, salt);
    const newAdmin = {
      id: `usr_adm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      phone: normalizedPhone,
      fullName: fullName.trim(),
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
      departmentId: departmentId || "dept_nida_processing",
      permissions: Array.isArray(permissions) && permissions.length > 0 ? permissions : ["PROCESS_REQUESTS", "APPROVE_REQUESTS", "REJECT_REQUESTS"],
      language: "sw",
      mustChangePassword: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await db2.createUser(newAdmin);
    await db2.addAuditLog({
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorRole: "SUPER_ADMIN",
      action: "ADMIN_CREATED",
      target: `ADMIN:${newAdmin.id}`,
      targetId: newAdmin.id,
      details: `Super Admin created Admin account for ${newAdmin.fullName} (${newAdmin.phone})`
    });
    res.status(201).json({
      success: true,
      message: "Akaunti ya Admin imeundwa kikamilifu.",
      admin: {
        id: newAdmin.id,
        fullName: newAdmin.fullName,
        phone: newAdmin.phone,
        role: newAdmin.role,
        permissions: newAdmin.permissions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kuunda Admin." });
  }
});
router.get("/super-admin/credit/requests", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (_req, res) => {
  try {
    const list = await db2.getCreditRequests();
    res.json({ success: true, requests: list });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata maombi ya Credit." });
  }
});
router.post("/super-admin/credit/requests/:id/review", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;
    const user = req.user;
    if (action !== "APPROVE" && action !== "REJECT") {
      return res.status(400).json({ success: false, message: "Kitendo lazima kiwe APPROVE au REJECT." });
    }
    const credReqId = String(req.params.id);
    const result = await db2.reviewCreditRequest({
      id: credReqId,
      action,
      reviewedBy: user.fullName || user.id,
      rejectionReason
    });
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    await db2.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: "SUPER_ADMIN",
      action: action === "APPROVE" ? "CREDIT_ADDED" : "CREDIT_REQUEST_REJECTED",
      target: `CREDIT_REQUEST:${credReqId}`,
      targetId: credReqId,
      details: `Super Admin ${action === "APPROVE" ? "approved" : "rejected"} credit request for TSh ${result.creditRequest?.amountTzs}.`
    });
    res.json({
      success: true,
      message: action === "APPROVE" ? "Credit imeidhinishwa na kuongezwa kwa mteja." : "Ombi la Credit limekataliwa.",
      creditRequest: result.creditRequest
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kukagua ombi la Credit." });
  }
});
router.get(["/super-admin/customers/lookup", "/admin/customers/lookup"], nmyAuthMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Huna mamlaka ya kutafuta mteja." });
    }
    const rawQuery = String(req.query.phone || req.query.query || "").trim();
    if (!rawQuery) {
      return res.status(400).json({
        success: false,
        message: "Weka namba ya simu ya mteja (mfano 0766..., 255766..., +255766...) au User ID."
      });
    }
    const norm = normalizePhone2(rawQuery);
    let targetCustomer = null;
    if (norm) {
      targetCustomer = await db2.getUserByPhone(norm);
    }
    if (!targetCustomer) {
      targetCustomer = await db2.getUserById(rawQuery);
    }
    if (!targetCustomer) {
      const allUsers = await db2.getUsers();
      targetCustomer = allUsers.find(
        (u) => u.role === "CUSTOMER" && (u.phone === norm || u.phone.includes(norm || rawQuery) || u.fullName.toLowerCase().includes(rawQuery.toLowerCase()) || u.id.toLowerCase() === rawQuery.toLowerCase())
      ) || null;
    }
    if (!targetCustomer) {
      return res.status(404).json({
        success: false,
        message: "Hakuna mteja aliyepatikana kwa namba ya simu au utambulisho uliowekwa."
      });
    }
    const balanceTzs = await db2.getCustomerCredit(targetCustomer.id);
    const ledger = await db2.getCustomerLedger(targetCustomer.id);
    let totalAdded = 0;
    let totalUsed = 0;
    for (const l of ledger) {
      if (l.type === "ADD") totalAdded += l.amount;
      else if (l.type === "CHARGE") totalUsed += l.amount;
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kutafuta mteja." });
  }
});
router.post(["/super-admin/credit/manual-adjust", "/admin/credit/manual-adjust"], nmyAuthMiddleware, async (req, res) => {
  try {
    const { customerId, phone, amountTzs, reason } = req.body;
    const user = req.user;
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const isAdminWithPermission = user.role === "ADMIN" && Array.isArray(user.permissions) && user.permissions.includes("CAN_ADD_CREDIT");
    if (!isSuperAdmin && !isAdminWithPermission) {
      return res.status(403).json({
        success: false,
        message: 'Huna mamlaka ya kuongeza Credit. Super Admin anapaswa kukupa ruhusa ya "KUONGEZA CREDIT" kwanza.'
      });
    }
    const amount = Number(amountTzs);
    if (!customerId && !phone || !amount || !reason || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: "Weka namba ya simu au ID ya mteja, kiasi cha Credit, na sababu."
      });
    }
    if (!isSuperAdmin && amount <= 0) {
      return res.status(403).json({
        success: false,
        message: "Admin anaruhusiwa tu kuongeza Credit, si kupunguza salio la mteja."
      });
    }
    let targetCustomer = null;
    if (phone) {
      const norm = normalizePhone2(String(phone));
      targetCustomer = await db2.getUserByPhone(norm);
    }
    if (!targetCustomer && customerId) {
      const norm = normalizePhone2(String(customerId));
      targetCustomer = await db2.getUserByPhone(norm) || await db2.getUserById(String(customerId));
    }
    if (!targetCustomer) {
      return res.status(404).json({
        success: false,
        message: "Mteja hakupatikana kwa namba ya simu au ID uliyoweka. Tafadhali hakikisha mteja yupo kwenye mfumo."
      });
    }
    const currentBalance = await db2.getCustomerCredit(targetCustomer.id);
    if (amount < 0 && currentBalance + amount < 0) {
      return res.status(400).json({
        success: false,
        message: `Salio la mteja halitoshi kupunguza kiasi hiki (Negative Balance Protection). Salio la sasa ni TSh ${currentBalance.toLocaleString()}.`
      });
    }
    const recentCustLedger = await db2.getCustomerLedger(targetCustomer.id);
    const isDuplicate = recentCustLedger.some(
      (entry) => entry.amount === amount && (entry.reason === `Marekebisho ya Uongozi: ${reason}` || entry.reason === `Kuongeza Credit (Admin ${user.fullName}): ${reason}`) && Date.now() - new Date(entry.timestamp).getTime() < 5e3
    );
    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        message: "Marekebisho haya yalikwishafanyika sekunde chache zilizopita (Duplicate Operation Protected).",
        newBalance: currentBalance
      });
    }
    const actionReason = isSuperAdmin ? `Marekebisho ya Uongozi: ${reason}` : `Kuongeza Credit (Admin ${user.fullName}): ${reason}`;
    const result = await db2.addCustomerCredit({
      userId: targetCustomer.id,
      amount,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      reason: actionReason,
      reference: `ADJUST_${Date.now()}`
    });
    await db2.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: amount > 0 ? "CREDIT_ADDED" : "CREDIT_DEDUCTED",
      target: `USER:${targetCustomer.id}`,
      targetId: targetCustomer.id,
      details: `${user.role} ${user.fullName} manually adjusted credit by TSh ${amount} for ${targetCustomer.fullName} (${targetCustomer.phone}). Reason: ${reason}. New balance: TSh ${result.balanceAfter}.`
    });
    const notifTitle = amount > 0 ? "Credit Imeongezwa" : "Credit Imerekebishwa";
    const notifMsg = amount > 0 ? `Credit ya TSh ${amount.toLocaleString()} imeongezwa kwenye akaunti yako na Uongozi wa RAVINI. Salio jipya: TSh ${result.balanceAfter.toLocaleString()}.` : `Credit ya TSh ${Math.abs(amount).toLocaleString()} imepunguzwa kwenye akaunti yako. Salio jipya: TSh ${result.balanceAfter.toLocaleString()}.`;
    await db2.createNotification({
      userId: targetCustomer.id,
      title: notifTitle,
      message: notifMsg,
      type: "CREDIT"
    });
    pushService.sendNotificationToUser(targetCustomer.id, {
      title: notifTitle,
      message: notifMsg,
      type: "CREDIT",
      url: "/profile",
      eventKey: `credit_${targetCustomer.id}_${result.ledgerEntry?.id || Date.now()}`
    }).catch((err) => console.warn("[PUSH CREDIT ERROR]:", err.message));
    realtimeService.notifyUser(targetCustomer.id, { type: "CREDIT_UPDATED", newBalance: result.balanceAfter });
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
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Hitilafu ya kurekebisha Credit." });
  }
});
router.put("/super-admin/settings/whatsapp-number", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { whatsappNumber } = req.body;
    if (!whatsappNumber) {
      return res.status(400).json({ success: false, message: "Weka namba mpya ya WhatsApp ya malipo." });
    }
    const normalized = normalizePhone2(String(whatsappNumber));
    if (!normalized || normalized.length < 9) {
      return res.status(400).json({ success: false, message: "Namba ya WhatsApp si sahihi (weka 07... au 255...)." });
    }
    const currentSettings = await db2.getSettings();
    const oldNumber = currentSettings.whatsappNumber || "N/A";
    const updatedPaymentMethods = (currentSettings.paymentMethods || []).map((m) => ({
      ...m,
      accountNumber: normalized,
      instructions: m.instructions?.replace(/\b0\d{9}\b|\b255\d{9}\b/g, normalized) || m.instructions
    }));
    const updated = await db2.updateSettings({
      whatsappNumber: normalized,
      supportPhone: normalized,
      paymentMethods: updatedPaymentMethods
    }, {
      id: req.user.id,
      name: req.user.fullName
    });
    await db2.addAuditLog({
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorRole: "SUPER_ADMIN",
      action: "WHATSAPP_NUMBER_CHANGED",
      target: "SYSTEM_SETTINGS:WHATSAPP",
      details: `Super Admin ${req.user.fullName} changed central WhatsApp & support contact from ${oldNumber} to ${normalized}. All support, payment, and WhatsApp links synchronized.`
    });
    res.json({
      success: true,
      message: `Namba ya WhatsApp na Huduma imesasishwa kuwa ${normalized}. Sehemu zote za malipo, msaada na mawasiliano zitatumia namba hii mara moja.`,
      whatsappNumber: updated.whatsappNumber
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kusasisha namba ya WhatsApp." });
  }
});
router.put("/super-admin/settings/request-timeout", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { timeoutMinutes } = req.body;
    const minutes = Number(timeoutMinutes);
    if (!minutes || isNaN(minutes) || minutes < 1 || minutes > 1440) {
      return res.status(400).json({ success: false, message: "Weka muda sahihi wa dakika kati ya 1 na 1440 (masaa 24)." });
    }
    const currentSettings = await db2.getSettings();
    const oldTimeout = currentSettings.requestTimeoutMinutes || 15;
    const updated = await db2.updateSettings({ requestTimeoutMinutes: minutes }, {
      id: req.user.id,
      name: req.user.fullName
    });
    await db2.addAuditLog({
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorRole: "SUPER_ADMIN",
      action: "REQUEST_TIMEOUT_CHANGED",
      target: "SYSTEM_SETTINGS:REQUEST_TIMEOUT",
      details: `Super Admin ${req.user.fullName} alibadilisha muda wa ombi kuisha (request timeout) kutoka dakika ${oldTimeout} kuwa dakika ${minutes}.`
    });
    res.json({
      success: true,
      message: `Muda wa maombi kuisha umesasishwa kuwa dakika ${minutes}.`,
      requestTimeoutMinutes: updated.requestTimeoutMinutes
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kusasisha muda wa ombi." });
  }
});
router.get("/super-admin/admins/:id/work-payment-link", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const adminId = String(req.params.id);
    const adminUser = await db2.getUserById(adminId);
    if (!adminUser) {
      return res.status(404).json({ success: false, message: "Admin hakupatikana." });
    }
    const outstandingBalance = await db2.getAdminWorkCredit(adminId);
    const reqAmount = Number(req.query.amount);
    const amountToPay = !isNaN(reqAmount) && reqAmount > 0 ? reqAmount : outstandingBalance;
    if (amountToPay > outstandingBalance) {
      return res.status(400).json({
        success: false,
        message: `Kiasi cha malipo (TSh ${amountToPay.toLocaleString()}) hakiwezi kuzidi salio lililopo (TSh ${outstandingBalance.toLocaleString()}).`
      });
    }
    const cleanPhone = normalizePhone2(adminUser.phone);
    const remainingPreview = outstandingBalance - amountToPay;
    const message = `Habari ${adminUser.fullName},

Nimekutumia malipo ya kazi ya NIDA TSh ${amountToPay.toLocaleString()} kupitia simu yako (${adminUser.phone}).

Salio lako la kazi lililobaki ni: TSh ${remainingPreview.toLocaleString()}.

Asante kwa kazi nzuri! - RAVINI COMPANY LIMITED (NIDA MITANDAO YOTE).`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    res.json({
      success: true,
      whatsappUrl,
      prefilledMessage: message,
      admin: {
        id: adminUser.id,
        fullName: adminUser.fullName,
        phone: adminUser.phone
      },
      outstandingBalance,
      amountToPay,
      remainingBalance: remainingPreview
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kuandaa mawasiliano ya malipo." });
  }
});
router.post("/super-admin/admins/:id/work-payment", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const adminId = String(req.params.id);
    const { amount, reason } = req.body;
    const user = req.user;
    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ success: false, message: "Weka kiasi halali cha kulipa (zaidi ya 0)." });
    }
    const adminUser = await db2.getUserById(adminId);
    if (!adminUser) {
      return res.status(404).json({ success: false, message: "Admin hakupatikana." });
    }
    const currentOutstanding = await db2.getAdminWorkCredit(adminId);
    if (payAmount > currentOutstanding) {
      return res.status(400).json({
        success: false,
        message: `Kiasi cha malipo (TSh ${payAmount.toLocaleString()}) hakiwezi kuzidi salio lililopo la kazi (TSh ${currentOutstanding.toLocaleString()}).`
      });
    }
    const paymentResult = await db2.payAdminWorkBalance({
      adminId,
      amount: payAmount,
      actorId: user.id,
      actorName: user.fullName,
      reason: reason || "Malipo ya Kazi ya Admin (WhatsApp Manual Payment)"
    });
    await db2.createNotification({
      userId: adminId,
      title: "Malipo ya Kazi Yamepokelewa",
      message: `Umepokea malipo ya kazi ya TSh ${payAmount.toLocaleString()} kutoka kwa Super Admin ${user.fullName}. Salio lako jipya la kazi ni TSh ${paymentResult.balanceAfter.toLocaleString()}.`,
      type: "CREDIT"
    });
    pushService.sendNotificationToUser(adminId, {
      title: "Malipo ya Kazi Yamepokelewa",
      message: `Umepokea malipo ya TSh ${payAmount.toLocaleString()}. Salio la kazi: TSh ${paymentResult.balanceAfter.toLocaleString()}.`,
      type: "CREDIT",
      url: "/huduma"
    }).catch((err) => console.warn("[PUSH WORK PAYMENT ERROR]:", err.message));
    res.json({
      success: true,
      message: `Malipo ya TSh ${payAmount.toLocaleString()} yamethibitishwa kikamilifu kwa Admin ${adminUser.fullName}. Salio lililobaki: TSh ${paymentResult.balanceAfter.toLocaleString()}.`,
      paidAmount: payAmount,
      remainingBalance: paymentResult.balanceAfter,
      ledgerEntry: paymentResult.ledgerEntry,
      admin: {
        id: adminUser.id,
        fullName: adminUser.fullName,
        phone: adminUser.phone
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Hitilafu ya kukamilisha malipo ya kazi." });
  }
});
router.get("/super-admin/services", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (_req, res) => {
  try {
    const services2 = await db2.getServices();
    res.json({ success: true, services: services2 });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata huduma." });
  }
});
router.put("/super-admin/services/:id/price", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { priceTzs } = req.body;
    const price = Number(priceTzs);
    if (price === void 0 || isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, message: "Weka bei halali (TSh)." });
    }
    const srvId = String(req.params.id);
    const updated = await db2.updateServicePrice(srvId, price, {
      id: req.user.id,
      name: req.user.fullName
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Huduma haikupatikana." });
    }
    res.json({
      success: true,
      message: `Bei ya huduma imesasishwa kuwa TSh ${price.toLocaleString()}.`,
      service: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kubadili bei ya huduma." });
  }
});
router.get("/super-admin/settings", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (_req, res) => {
  try {
    const settings2 = await db2.getSettings();
    res.json({ success: true, settings: settings2 });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata mipangilio ya mfumo." });
  }
});
router.put("/super-admin/settings", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const patch = req.body;
    const updated = await db2.updateSettings(patch, {
      id: req.user.id,
      name: req.user.fullName
    });
    res.json({
      success: true,
      message: "Mipangilio ya mfumo imesasishwa kikamilifu.",
      settings: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kusasisha mipangilio." });
  }
});
router.get("/announcements/active", nmyAuthMiddleware, async (req, res) => {
  try {
    const userRole = req.user?.role || "CUSTOMER";
    const announcements2 = await db2.getActiveAnnouncementsForRole(userRole);
    res.json({ success: true, announcements: announcements2 });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata matangazo." });
  }
});
router.get("/super-admin/announcements", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (_req, res) => {
  try {
    const announcements2 = await db2.getAnnouncements(false);
    res.json({ success: true, announcements: announcements2 });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata matangazo." });
  }
});
router.post("/super-admin/announcements", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { title, message, targetType, targetUserId, isActive } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Weka kichwa na maelezo ya tangazo." });
    }
    const announcement = await db2.createAnnouncement({
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      message: message.trim(),
      targetType: targetType || "ALL",
      targetUserId,
      isActive: isActive !== false,
      createdById: req.user.id,
      createdByName: req.user.fullName,
      recipientCount: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    await db2.addAuditLog({
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorRole: "SUPER_ADMIN",
      action: "ANNOUNCEMENT_CREATED",
      target: `ANNOUNCEMENT:${announcement.id}`,
      targetId: announcement.id,
      details: `Super Admin created text announcement: "${announcement.title}" for ${announcement.targetType} (Active: ${announcement.isActive})`
    });
    if (announcement.isActive) {
      const pushTitle = `Tangazo: ${announcement.title}`;
      const pushBody = announcement.message.length > 120 ? `${announcement.message.substring(0, 117)}...` : announcement.message;
      if (announcement.targetType === "ALL_CUSTOMERS") {
        pushService.sendNotificationToRole("CUSTOMER", {
          title: pushTitle,
          message: pushBody,
          type: "ANNOUNCEMENT",
          url: "/",
          eventKey: `ann_cust_${announcement.id}`
        }).catch((err) => console.warn("[PUSH ANNOUNCEMENT CUST ERROR]:", err.message));
      } else if (announcement.targetType === "ALL_ADMINS") {
        pushService.sendNotificationToRole("ADMIN", {
          title: pushTitle,
          message: pushBody,
          type: "ANNOUNCEMENT",
          url: "/",
          eventKey: `ann_adm_${announcement.id}`
        }).catch((err) => console.warn("[PUSH ANNOUNCEMENT ADM ERROR]:", err.message));
      } else {
        pushService.broadcastNotification({
          title: pushTitle,
          message: pushBody,
          type: "ANNOUNCEMENT",
          url: "/",
          eventKey: `ann_all_${announcement.id}`
        }).catch((err) => console.warn("[PUSH ANNOUNCEMENT ALL ERROR]:", err.message));
      }
      realtimeService.broadcast({
        type: "ANNOUNCEMENT_CREATED",
        announcementId: announcement.id,
        title: announcement.title,
        message: announcement.message
      });
    }
    res.status(201).json({
      success: true,
      message: "Tangazo limerekodiwa na kuchapishwa kikamilifu.",
      announcement
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kutuma tangazo." });
  }
});
router.put("/super-admin/announcements/:id", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const annId = String(req.params.id);
    const { title, message, targetType, isActive } = req.body;
    const updated = await db2.updateAnnouncement(annId, {
      title,
      message,
      targetType,
      isActive
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Tangazo halikupatikana." });
    }
    await db2.addAuditLog({
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorRole: "SUPER_ADMIN",
      action: "ANNOUNCEMENT_UPDATED",
      target: `ANNOUNCEMENT:${annId}`,
      targetId: annId,
      details: `Super Admin updated announcement "${updated.title}" (Active: ${updated.isActive})`
    });
    res.json({
      success: true,
      message: "Tangazo limesasishwa kikamilifu.",
      announcement: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kusasisha tangazo." });
  }
});
router.patch("/super-admin/announcements/:id/status", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const annId = String(req.params.id);
    const { isActive } = req.body;
    const updated = await db2.updateAnnouncement(annId, { isActive: Boolean(isActive) });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Tangazo halikupatikana." });
    }
    await db2.addAuditLog({
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorRole: "SUPER_ADMIN",
      action: "ANNOUNCEMENT_STATUS_CHANGED",
      target: `ANNOUNCEMENT:${annId}`,
      targetId: annId,
      details: `Super Admin changed announcement status to ${updated.isActive ? "ACTIVE" : "INACTIVE"}`
    });
    if (updated.isActive) {
      const pushTitle = `Tangazo: ${updated.title}`;
      const pushBody = updated.message.length > 120 ? `${updated.message.substring(0, 117)}...` : updated.message;
      if (updated.targetType === "ALL_CUSTOMERS") {
        pushService.sendNotificationToRole("CUSTOMER", {
          title: pushTitle,
          message: pushBody,
          type: "ANNOUNCEMENT",
          url: "/",
          eventKey: `ann_status_cust_${updated.id}`
        }).catch((err) => console.warn("[PUSH ANNOUNCEMENT CUST ERROR]:", err.message));
      } else if (updated.targetType === "ALL_ADMINS") {
        pushService.sendNotificationToRole("ADMIN", {
          title: pushTitle,
          message: pushBody,
          type: "ANNOUNCEMENT",
          url: "/",
          eventKey: `ann_status_adm_${updated.id}`
        }).catch((err) => console.warn("[PUSH ANNOUNCEMENT ADM ERROR]:", err.message));
      } else {
        pushService.broadcastNotification({
          title: pushTitle,
          message: pushBody,
          type: "ANNOUNCEMENT",
          url: "/",
          eventKey: `ann_status_all_${updated.id}`
        }).catch((err) => console.warn("[PUSH ANNOUNCEMENT ALL ERROR]:", err.message));
      }
    }
    res.json({
      success: true,
      message: `Tangazo sasa ni ${updated.isActive ? "LINALOONEKANA (Active)" : "LILILOZIMWA (Inactive)"}.`,
      announcement: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kubadili hali ya tangazo." });
  }
});
router.delete("/super-admin/announcements/:id", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const annId = String(req.params.id);
    const deleted = await db2.deleteAnnouncement(annId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Tangazo halikupatikana." });
    }
    await db2.addAuditLog({
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorRole: "SUPER_ADMIN",
      action: "ANNOUNCEMENT_DELETED",
      target: `ANNOUNCEMENT:${annId}`,
      targetId: annId,
      details: `Super Admin deleted announcement ${annId}`
    });
    res.json({
      success: true,
      message: "Tangazo limefutwa kikamilifu."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kufuta tangazo." });
  }
});
router.get("/super-admin/audit-logs", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const logs = await db2.getAuditLogs(limit);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata audit logs." });
  }
});
router.get("/super-admin/departments", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (_req, res) => {
  try {
    const depts = await db2.getDepartments();
    res.json({ success: true, departments: depts });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata vitengo." });
  }
});
router.get("/super-admin/backups", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (_req, res) => {
  try {
    const backups = backupService.getBackups();
    const lastBackup = backupService.getLastBackup();
    const lastVerified = backupService.getLastVerifiedBackup();
    res.json({
      success: true,
      backups,
      lastBackup,
      lastVerified,
      status: lastVerified ? "HEALTHY" : "WARNING"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata orodha ya backup." });
  }
});
router.post("/super-admin/backups/create", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const user = req.user;
    const result = await backupService.createVerifiedBackup(`MANUAL_SUPER_ADMIN_${user.fullName}`);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    await db2.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: "SUPER_ADMIN",
      action: "BACKUP_CREATED_MANUAL",
      target: "BACKUP_CENTER",
      targetId: result.record?.id,
      details: `Super Admin created verified manual backup: ${result.record?.filename} (${result.record?.sizeBytes} bytes, SHA256: ${result.record?.sha256Checksum.slice(0, 10)}...).`
    });
    res.status(201).json({
      success: true,
      message: "\u2705 Backup imekamilika na kuthibitishwa kikamilifu (Verified Backup).",
      backup: result.record
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kutengeneza backup." });
  }
});
router.post("/super-admin/backups/:id/restore", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const backupId = String(req.params.id);
    const user = req.user;
    const { confirmPhrase } = req.body;
    if (confirmPhrase !== "THIBITISHA REJESHA") {
      return res.status(400).json({
        success: false,
        message: 'Tafadhali andika neno "THIBITISHA REJESHA" ili kuidhinisha urejeshaji salama.'
      });
    }
    const result = await backupService.safeRestorePoint(backupId, {
      id: user.id,
      name: user.fullName,
      role: "SUPER_ADMIN"
    });
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    await db2.initialize();
    await db2.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: "SUPER_ADMIN",
      action: "CONTROLLED_RECOVERY_RESTORE",
      target: `BACKUP:${backupId}`,
      targetId: backupId,
      details: `Super Admin executed controlled safe restore from backup ${result.restoredRecord?.filename}. Pre-restore snapshot preserved.`
    });
    res.json({
      success: true,
      message: "\u2705 Mfumo umerejeshwa salama kulingana na Recovery Point uliyochagua. Data ya sasa ilihifadhiwa kwanza kabla ya kurejesha."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kurejesha mfumo kutoka kwenye backup." });
  }
});
router.get("/super-admin/integrity-check", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const rawData = await db2.getRawSnapshot();
    const report = await backupService.runDataIntegrityCheck(rawData);
    await db2.addAuditLog({
      actorId: req.user.id,
      actorName: req.user.fullName,
      actorRole: "SUPER_ADMIN",
      action: "DATA_INTEGRITY_CHECK_RUN",
      target: "DATABASE_INTEGRITY",
      details: `Super Admin ran integrity check. Status: ${report.isHealthy ? "HEALTHY" : "DISCREPANCIES DETECTED"} (${report.discrepancies.length} alerts).`
    });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kukagua data integrity." });
  }
});
router.post("/super-admin/emergency-lock", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { active, reason } = req.body;
    const user = req.user;
    const isLocking = Boolean(active);
    const updated = await db2.updateSettings({
      emergencyLockActive: isLocking,
      emergencyLockReason: reason || (isLocking ? "Mfumo umefungwa kwa muda kwa ajili ya usalama wa data." : void 0)
    }, { id: user.id, name: user.fullName });
    await db2.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: "SUPER_ADMIN",
      action: isLocking ? "EMERGENCY_LOCK_ACTIVATED" : "EMERGENCY_LOCK_DEACTIVATED",
      target: "SYSTEM_SECURITY",
      details: `Super Admin ${user.fullName} ${isLocking ? "ACTIVATED" : "DEACTIVATED"} Emergency Lock. Reason: ${reason || "N/A"}`
    });
    res.json({
      success: true,
      message: isLocking ? "\u{1F512} Emergency Lock imewashwa kikamilifu. Vitendo hatarishi vimesitishwa kwa muda." : "\u{1F513} Emergency Lock imezimwa. Mfumo umerejea kawaida.",
      emergencyLockActive: updated.emergencyLockActive,
      emergencyLockReason: updated.emergencyLockReason
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kubadili Emergency Lock." });
  }
});
router.post("/super-admin/cleanup-history", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { olderThanDays, category, confirmation } = req.body;
    const user = req.user;
    if (confirmation !== "FUTA HISTORIA") {
      return res.status(400).json({
        success: false,
        message: 'Tafadhali andika neno "FUTA HISTORIA" ili kuthibitisha kitendo hiki.'
      });
    }
    const days = Number(olderThanDays) || 30;
    if (days < 7) {
      return res.status(400).json({ success: false, message: "Muda wa chini wa kufuta historia ni siku 7." });
    }
    const result = await db2.cleanupHistoryManual({
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
      message: `\u2705 Rekodi ${result.affectedCount} za ${category} zimefutwa kwa usalama. Akaunti, salio, na maombi ya wateja hayajaguswa.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kufanya cleanup." });
  }
});
router.post("/super-admin/customers/:id/delete", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const customerId = String(req.params.id);
    const { reason, confirmation } = req.body;
    const user = req.user;
    if (confirmation !== "FUTA AKAUNTI") {
      return res.status(400).json({
        success: false,
        message: 'Tafadhali andika neno "FUTA AKAUNTI" ili kuthibitisha kufunga/kufuta akaunti hii.'
      });
    }
    const result = await db2.deleteCustomerAccountManual({
      customerId,
      actorId: user.id,
      actorName: user.fullName,
      reason: reason || "Kufutwa na Super Admin"
    });
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.json({
      success: true,
      message: "\u2705 Akaunti ya mteja imefungwa/kufutwa kwa usalama. Kumbukumbu za muamala na vitendo zimehifadhiwa kwa ajili ya ukaguzi."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kufuta akaunti ya mteja." });
  }
});
router.get("/super-admin/global-search", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    if (!q) {
      return res.json({ success: true, results: { customers: [], admins: [], requests: [], payments: [] } });
    }
    const users2 = await db2.getUsers();
    const requests2 = await db2.getRequests();
    const creditRequests2 = await db2.getCreditRequests();
    const normalizedQ = normalizePhone2(q);
    const matchedCustomers = users2.filter((u) => u.role === "CUSTOMER").filter(
      (u) => u.fullName.toLowerCase().includes(q) || u.phone.includes(q) || normalizedQ && u.phone === normalizedQ || normalizedQ && u.phone.includes(normalizedQ) || u.id.toLowerCase().includes(q)
    ).slice(0, 10);
    const matchedAdmins = users2.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").filter(
      (u) => u.fullName.toLowerCase().includes(q) || u.phone.includes(q) || normalizedQ && u.phone === normalizedQ || normalizedQ && u.phone.includes(normalizedQ) || u.id.toLowerCase().includes(q)
    ).slice(0, 10);
    const matchedRequests = requests2.filter(
      (r) => r.id.toLowerCase().includes(q) || r.targetPhoneNumber.includes(q) || r.nidaResult && r.nidaResult.includes(q) || r.customerName.toLowerCase().includes(q) || r.customerPhone.includes(q)
    ).slice(0, 15);
    const matchedPayments = creditRequests2.filter(
      (p) => p.id.toLowerCase().includes(q) || p.paymentReference.toLowerCase().includes(q) || p.customerName.toLowerCase().includes(q) || p.customerPhone.includes(q)
    ).slice(0, 10);
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kufanya global search." });
  }
});
router.get("/super-admin/customers/:id/360", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const customerId = String(req.params.id);
    const user = await db2.getUserById(customerId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Mteja hakupatikana." });
    }
    const balanceTzs = await db2.getCustomerCredit(customerId);
    const ledger = await db2.getCustomerLedger(customerId);
    const requests2 = await db2.getRequests({ customerId });
    const allCreditRequests = await db2.getCreditRequests();
    const payments = allCreditRequests.filter((cr) => cr.customerId === customerId);
    const allAudit = await db2.getAuditLogs(500);
    const activity = allAudit.filter((a) => a.actorId === customerId || a.targetId === customerId);
    let totalAdded = 0;
    let totalCharged = 0;
    let totalRefunded = 0;
    for (const entry of ledger) {
      if (entry.type === "ADD") totalAdded += entry.amount;
      else if (entry.type === "CHARGE") totalCharged += entry.amount;
      else if (entry.type === "REFUND") totalRefunded += entry.amount;
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
      requests: requests2,
      payments,
      activity
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata Customer 360." });
  }
});
router.get("/super-admin/admins/:id/360", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const adminId = String(req.params.id);
    const user = await db2.getUserById(adminId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Admin hakupatikana." });
    }
    const workBalance = user.role === "ADMIN" ? await db2.getAdminWorkCredit(adminId) : await db2.getSuperAdminWorkCredit(adminId);
    const workLedger = user.role === "ADMIN" ? await db2.getAdminWorkLedger(adminId) : await db2.getSuperAdminWorkLedger(adminId);
    const allRequests = await db2.getRequests();
    const assignedWork = allRequests.filter((r) => r.claimedByWorkerId === adminId);
    const completedWork = assignedWork.filter((r) => r.status === "APPROVED");
    const rejectedWork = assignedWork.filter((r) => r.status === "REJECTED");
    const allAudit = await db2.getAuditLogs(500);
    const activity = allAudit.filter((a) => a.actorId === adminId || a.targetId === adminId);
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
        completionRate: assignedWork.length > 0 ? Math.round(completedWork.length / assignedWork.length * 100) : 0
      },
      recentWork: assignedWork.slice(0, 20),
      activity
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata Admin 360." });
  }
});
router.get("/super-admin/revenue-history", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const filter = String(req.query.period || "this_month");
    const ledger = await db2.getAllCreditLedger();
    const allCreditRequests = await db2.getCreditRequests();
    const now = /* @__PURE__ */ new Date();
    let startDate = /* @__PURE__ */ new Date(0);
    if (filter === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === "yesterday") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    } else if (filter === "this_week") {
      const day = now.getDay() || 7;
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
    } else if (filter === "last_week") {
      const day = now.getDay() || 7;
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day - 6);
    } else if (filter === "this_month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filter === "last_month") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else if (filter === "this_year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }
    const filteredLedger = ledger.filter((l) => new Date(l.timestamp) >= startDate);
    const filteredCreditRequests = allCreditRequests.filter((cr) => new Date(cr.createdAt) >= startDate && cr.status === "APPROVED");
    let totalRevenueTzs = 0;
    let totalRefundsTzs = 0;
    let countCharges = 0;
    for (const entry of filteredLedger) {
      if (entry.type === "CHARGE") {
        totalRevenueTzs += entry.amount;
        countCharges++;
      } else if (entry.type === "REFUND") {
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
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupata historia ya mapato." });
  }
});
router.get("/super-admin/reports/export", nmyAuthMiddleware, requireNmyRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const reportType = String(req.query.type || "revenue");
    let csvData = "";
    let filename = `nmy_${reportType}_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    if (reportType === "revenue") {
      const ledger = await db2.getAllCreditLedger();
      csvData = "Tarehe,Aina ya Muamala,Kiasi (TSh),Salio Kabla,Salio Baada,Mteja ID,Namba ya Kumbukumbu,Sababu\n" + ledger.map((l) => `"${l.timestamp}","${l.type}",${l.amount},${l.balanceBefore},${l.balanceAfter},"${l.userId}","${l.reference}","${l.reason.replace(/"/g, '""')}"`).join("\n");
    } else if (reportType === "requests") {
      const requests2 = await db2.getRequests();
      csvData = "Request ID,Mteja,Simu ya Mteja,Simu Iliyotumwa,Bei (TSh),Hali,Mhudumu,Matokeo ya NIDA,Tarehe\n" + requests2.map((r) => `"${r.id}","${r.customerName}","${r.customerPhone}","${r.targetPhoneNumber}",${r.chargedPriceTzs},"${r.status}","${r.claimedByWorkerName || "-"}","${r.nidaResult || "-"}","${r.createdAt}"`).join("\n");
    } else if (reportType === "audit") {
      const logs = await db2.getAuditLogs(1e3);
      csvData = "Tarehe,Mtendaji,Wadhifa,Kitendo,Lengo,Maelezo\n" + logs.map((l) => `"${l.timestamp}","${l.actorName}","${l.actorRole}","${l.action}","${l.target}","${l.details.replace(/"/g, '""')}"`).join("\n");
    } else {
      const users2 = await db2.getUsers();
      csvData = "User ID,Jina Kamili,Namba ya Simu,Wadhifa,Hali,Tarehe ya Kujiunga,Mwisho Kuingia\n" + users2.map((u) => `"${u.id}","${u.fullName}","${u.phone}","${u.role}","${u.status}","${u.createdAt}","${u.lastLoginAt || "-"}"`).join("\n");
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\uFEFF" + csvData);
  } catch (err) {
    res.status(500).json({ success: false, message: "Hitilafu ya kupakua ripoti." });
  }
});
var nmyApi_default = router;

// server/realtime/chatSocketServer.ts
var import_ws = require("ws");

// server/db/sqliteProductionDataStore.ts
var import_fs3 = __toESM(require("fs"), 1);
var import_path3 = __toESM(require("path"), 1);
var import_node_sqlite = require("node:sqlite");

// server/utils/passwordSecurity.ts
var import_bcryptjs2 = __toESM(require("bcryptjs"), 1);
var SALT_ROUNDS = 10;
function hashPassword(password) {
  if (!password) return "";
  if (isHashed(password)) {
    return password;
  }
  return import_bcryptjs2.default.hashSync(password, SALT_ROUNDS);
}
function isHashed(str) {
  if (!str) return false;
  return str.startsWith("$2a$") || str.startsWith("$2b$") || str.startsWith("$2y$");
}

// server/db/sqliteProductionDataStore.ts
var SqliteProductionDataStore = class {
  name = "SqliteProductionDataStore (ACID WAL Engine)";
  dbPath;
  db;
  isInitialized = false;
  constructor(dbPath) {
    this.dbPath = dbPath || import_path3.default.join(process.cwd(), "data", "ravini_production.sqlite");
  }
  async initialize() {
    if (this.isInitialized) return;
    const dir = import_path3.default.dirname(this.dbPath);
    if (!import_fs3.default.existsSync(dir)) {
      import_fs3.default.mkdirSync(dir, { recursive: true });
    }
    this.db = new import_node_sqlite.DatabaseSync(this.dbPath);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA foreign_keys = ON;
    `);
    this.createTables();
    this.reconcileAccountsAndSecurity();
    this.isInitialized = true;
    console.log(`[RAVINI SQLite Engine] Production SQLite database initialized at ${this.dbPath}`);
  }
  reconcileAccountsAndSecurity() {
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const existingRows = this.db.prepare("SELECT id, username, phone, role, data_json FROM users").all();
      const usersMap = /* @__PURE__ */ new Map();
      for (const row of existingRows) {
        try {
          const user = JSON.parse(row.data_json);
          usersMap.set(user.id, user);
        } catch {
        }
      }
      const CANONICAL_PHONE = "255748604483";
      const CANONICAL_ID = "usr_baraka_mabula";
      let superAdmin = usersMap.get(CANONICAL_ID);
      if (!superAdmin) {
        for (const u of usersMap.values()) {
          const cleanPhone = (u.phone || "").replace(/[^0-9]/g, "");
          if (cleanPhone === CANONICAL_PHONE || u.username === CANONICAL_PHONE) {
            superAdmin = u;
            break;
          }
        }
      }
      const superAdminHashedPass = superAdmin?.password && isHashed(superAdmin.password) ? superAdmin.password : hashPassword("1234");
      if (!superAdmin) {
        superAdmin = {
          id: CANONICAL_ID,
          name: "Baraka Mabula",
          username: CANONICAL_PHONE,
          email: "barakamabula82@gmail.com",
          phone: CANONICAL_PHONE,
          password: superAdminHashedPass,
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
          coverPhoto: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80",
          bio: "Mwanzilishi & Msimamizi Mkuu (Super Admin) wa RAVINI COMPANY LIMITED. Full Controller System. Karibuni sana kwenye mtandao mkuu wa kijamii wa Kitanzania! \u{1F1F9}\u{1F1FF}\u{1F680}",
          location: "Dar es Salaam, Tanzania",
          verified: true,
          role: "SUPER_ADMIN",
          walletBalance: 0,
          followersCount: 0,
          followingCount: 0,
          createdAt: "2026-01-10T08:00:00.000Z",
          isOnline: true,
          savedPosts: [],
          followingUsers: [],
          permissions: ["all"],
          mustChangePassword: false,
          accountStatus: "ACTIVE",
          isDisabled: false,
          isSuspended: false
        };
      } else {
        superAdmin.id = CANONICAL_ID;
        superAdmin.name = "Baraka Mabula";
        superAdmin.username = CANONICAL_PHONE;
        superAdmin.phone = CANONICAL_PHONE;
        superAdmin.role = "SUPER_ADMIN";
        superAdmin.password = superAdminHashedPass;
        superAdmin.mustChangePassword = false;
        superAdmin.isDisabled = false;
        superAdmin.isSuspended = false;
        superAdmin.accountStatus = "ACTIVE";
        superAdmin.permissions = ["all"];
        const LEGACY_DEMO_IDS2 = ["usr_amina_juma", "usr_juma_rashid", "usr_neema_mrosso", "usr_salim_admin", "usr_huduma_wateja"];
        superAdmin.followingUsers = (superAdmin.followingUsers || []).filter((id) => !LEGACY_DEMO_IDS2.includes(id));
        if (superAdmin.followersCount === 12450) superAdmin.followersCount = 0;
        if (superAdmin.followingCount === 320) superAdmin.followingCount = 0;
        if (superAdmin.walletBalance === 25e4) superAdmin.walletBalance = 0;
      }
      this.db.prepare(`
        INSERT INTO users (id, username, email, phone, role, verified, data_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          username=excluded.username,
          phone=excluded.phone,
          role=excluded.role,
          verified=excluded.verified,
          data_json=excluded.data_json,
          updated_at=excluded.updated_at
      `).run(
        superAdmin.id,
        superAdmin.username,
        superAdmin.email || "",
        superAdmin.phone || "",
        "SUPER_ADMIN",
        1,
        JSON.stringify(superAdmin),
        superAdmin.createdAt || now,
        now
      );
      for (const [id, u] of usersMap.entries()) {
        if (id === CANONICAL_ID) continue;
        if (u.role === "SUPER_ADMIN" || u.role === "super_admin") {
          console.warn(`[RAVINI Integrity] Revoking duplicate SUPER_ADMIN role on non-canonical account ${id}`);
          u.role = "admin";
          if (!u.permissions) u.permissions = [];
          const uJson = JSON.stringify(u);
          this.db.prepare("UPDATE users SET role = ?, data_json = ?, updated_at = ? WHERE id = ?").run("admin", uJson, now, id);
        }
      }
      const LEGACY_DEMO_IDS = ["usr_amina_juma", "usr_juma_rashid", "usr_neema_mrosso", "usr_salim_admin", "usr_huduma_wateja"];
      for (const demoId of LEGACY_DEMO_IDS) {
        this.db.prepare("DELETE FROM users WHERE id = ?").run(demoId);
        this.db.prepare("DELETE FROM posts WHERE author_id = ?").run(demoId);
        this.db.prepare("DELETE FROM post_comments WHERE author_id = ?").run(demoId);
        this.db.prepare("DELETE FROM market_items WHERE seller_id = ?").run(demoId);
        this.db.prepare("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?").run(demoId, demoId);
        this.db.prepare("DELETE FROM call_sessions WHERE caller_id = ? OR receiver_id = ?").run(demoId, demoId);
        this.db.prepare("DELETE FROM conversations WHERE participant_ids LIKE ?").run(`%"${demoId}"%`);
      }
      this.db.prepare("DELETE FROM posts WHERE id IN ('post_welcome_baraka', 'post_amina_business', 'post_neema_tech')").run();
      this.db.prepare("DELETE FROM wallet_transactions WHERE id = 'tx_init_baraka'").run();
      this.db.prepare("DELETE FROM company_ledger WHERE id = 'cld_init_001'").run();
      const allRows = this.db.prepare("SELECT id, data_json FROM users").all();
      for (const row of allRows) {
        try {
          const u = JSON.parse(row.data_json);
          if (u.password && !isHashed(u.password)) {
            u.password = hashPassword(u.password);
            this.db.prepare("UPDATE users SET data_json = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(u), now, row.id);
          }
        } catch {
        }
      }
      console.log(`[RAVINI Integrity] Account and security reconciliation completed successfully. Verified canonical Super Admin (${CANONICAL_PHONE}).`);
    } catch (err) {
      console.error("[RAVINI Integrity] Error during account reconciliation:", err);
    }
  }
  createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT,
        email TEXT,
        phone TEXT,
        role TEXT,
        verified INTEGER DEFAULT 0,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        author_id TEXT NOT NULL,
        content TEXT,
        media_url TEXT,
        media_type TEXT,
        privacy TEXT DEFAULT 'public',
        is_deleted INTEGER DEFAULT 0,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS post_comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        content TEXT,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS market_items (
        id TEXT PRIMARY KEY,
        seller_id TEXT NOT NULL,
        title TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT,
        is_deleted INTEGER DEFAULT 0,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS market_orders (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL,
        buyer_id TEXT NOT NULL,
        seller_id TEXT NOT NULL,
        status TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        receiver_id TEXT,
        content TEXT,
        media_url TEXT,
        is_delivered INTEGER DEFAULT 0,
        is_read INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT,
        participant_ids TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS message_requests (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        status TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS call_sessions (
        id TEXT PRIMARY KEY,
        caller_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        duration INTEGER DEFAULT 0,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL,
        description TEXT,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ad_campaigns (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        budget REAL DEFAULT 0,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS company_ledger (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS refund_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS rvc_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        actor_id TEXT NOT NULL,
        actor_name TEXT NOT NULL,
        action TEXT NOT NULL,
        target TEXT,
        details TEXT,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        actor_id TEXT,
        type TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS creator_applications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS business_applications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS company_applications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS system_kv (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS content_reports (
        id TEXT PRIMARY KEY,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        post_id TEXT NOT NULL,
        reporter_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        category TEXT NOT NULL,
        reason TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
      CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_user ON wallet_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_reports_status ON content_reports(status);
    `);
  }
  // --- Users ---
  async getUsers() {
    const rows = this.db.prepare("SELECT data_json FROM users ORDER BY created_at ASC").all();
    return rows.map((r) => JSON.parse(r.data_json));
  }
  async getUserById(id) {
    const row = this.db.prepare("SELECT data_json FROM users WHERE id = ?").get(id);
    return row ? JSON.parse(row.data_json) : null;
  }
  async getUserByUsername(username) {
    const clean = username.trim().toLowerCase();
    const row = this.db.prepare("SELECT data_json FROM users WHERE LOWER(username) = ?").get(clean);
    return row ? JSON.parse(row.data_json) : null;
  }
  async getUserByEmail(email) {
    const clean = email.trim().toLowerCase();
    const row = this.db.prepare("SELECT data_json FROM users WHERE LOWER(email) = ?").get(clean);
    return row ? JSON.parse(row.data_json) : null;
  }
  async getUserByPhone(phone) {
    const clean = phone.replace(/[^0-9]/g, "");
    const users2 = await this.getUsers();
    return users2.find((u) => u.phone && u.phone.replace(/[^0-9]/g, "") === clean) || null;
  }
  async saveUser(user) {
    const isCanonical = user.id === "usr_baraka_mabula" || user.phone === "255748604483" || user.username === "255748604483";
    if (isCanonical) {
      user.id = "usr_baraka_mabula";
      user.phone = "255748604483";
      user.role = "SUPER_ADMIN";
      user.isDisabled = false;
      user.isSuspended = false;
      user.permissions = ["all"];
      user.mustChangePassword = false;
      user.accountStatus = "ACTIVE";
    } else {
      if (user.role === "SUPER_ADMIN" || user.role === "super_admin") {
        throw new Error("Huwezi kumpa mtumiaji cheo cha SUPER_ADMIN. Kuna Super Admin mmoja tu anayetambulika.");
      }
    }
    if (user.password && !isHashed(user.password)) {
      user.password = hashPassword(user.password);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const json = JSON.stringify(user);
    this.db.prepare(`
      INSERT INTO users (id, username, email, phone, role, verified, data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        username=excluded.username,
        email=excluded.email,
        phone=excluded.phone,
        role=excluded.role,
        verified=excluded.verified,
        data_json=excluded.data_json,
        updated_at=excluded.updated_at
    `).run(
      user.id,
      user.username || "",
      user.email || "",
      user.phone || "",
      user.role || "user",
      user.verified ? 1 : 0,
      json,
      user.createdAt || now,
      now
    );
    return user;
  }
  async updateUser(id, updates) {
    const existing = await this.getUserById(id);
    if (!existing) return null;
    const isCanonical = existing.id === "usr_baraka_mabula" || existing.phone === "255748604483" || existing.username === "255748604483";
    if (isCanonical) {
      if (updates.role && updates.role !== "SUPER_ADMIN" && updates.role !== "super_admin") {
        throw new Error("Msimamizi Mkuu (Super Admin) hawezi kushushwa cheo.");
      }
      updates.role = "SUPER_ADMIN";
      updates.isDisabled = false;
      updates.isSuspended = false;
      updates.mustChangePassword = false;
      updates.accountStatus = "ACTIVE";
    } else {
      if (updates.role === "SUPER_ADMIN" || updates.role === "super_admin") {
        throw new Error("Huwezi kubadilisha akaunti hii kuwa Super Admin.");
      }
    }
    if (updates.password && !isHashed(updates.password)) {
      updates.password = hashPassword(updates.password);
    }
    const merged = { ...existing, ...updates };
    return this.saveUser(merged);
  }
  async purgeUser(id, actorId) {
    const actor = await this.getUserById(actorId);
    const role = (actor?.role || "").toLowerCase();
    if (role !== "super_admin" && actorId !== "usr_baraka_mabula") {
      throw new Error("Ni Super Admin pekee anayeweza kufuta akaunti ya mtumiaji kabisa.");
    }
    const target = await this.getUserById(id);
    if (!target) return false;
    if (target.id === "usr_baraka_mabula" || target.phone === "255748604483" || (target.role || "").toLowerCase() === "super_admin") {
      throw new Error("Akaunti ya Msimamizi Mkuu (Super Admin) haiwezi kufutwa.");
    }
    this.db.prepare("DELETE FROM users WHERE id = ?").run(id);
    await this.addAuditLog({
      actorId,
      actorName: actor?.name || actorId,
      actorRole: "SUPER_ADMIN",
      action: "PURGE_USER",
      target: `${target.name} (@${target.username})`,
      targetId: id,
      details: `Permanently purged user ${target.name} (${id}) from database.`
    });
    return true;
  }
  // --- Transactions ---
  async getUserTransactions(userId, options) {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;
    const rows = this.db.prepare(`
      SELECT data_json FROM wallet_transactions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);
    return rows.map((r) => JSON.parse(r.data_json));
  }
  async getAllTransactions(options) {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;
    const rows = this.db.prepare(`
      SELECT data_json FROM wallet_transactions 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset);
    return rows.map((r) => JSON.parse(r.data_json));
  }
  async recordWalletTransaction(tx) {
    const json = JSON.stringify(tx);
    this.db.prepare(`
      INSERT INTO wallet_transactions (id, user_id, type, amount, status, description, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        data_json=excluded.data_json
    `).run(tx.id, tx.userId, tx.type, tx.amount, tx.status || "completed", tx.description || "", json, tx.createdAt);
    return tx;
  }
  async atomicWalletTransfer(params) {
    const { senderId, recipientId, amountRvc, description, idempotencyKey } = params;
    if (amountRvc <= 0) {
      return { success: false, message: "Kiasi cha RVC kinapaswa kuwa zaidi ya sifuri." };
    }
    if (senderId === recipientId) {
      return { success: false, message: "Huwezi kujitumia RVC mwenyewe." };
    }
    const sender = await this.getUserById(senderId);
    const recipient = await this.getUserById(recipientId);
    if (!sender) return { success: false, message: "Mtumaji hakupatikana." };
    if (!recipient) return { success: false, message: "Mpokeaji hakupatikana." };
    if ((sender.walletBalance || 0) < amountRvc) {
      return {
        success: false,
        message: `Salio lako la RVC (${sender.walletBalance || 0} RVC) halitoshi kukamilisha muamala huu wa ${amountRvc} RVC.`
      };
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const txId = idempotencyKey || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
    sender.walletBalance = (sender.walletBalance || 0) - amountRvc;
    recipient.walletBalance = (recipient.walletBalance || 0) + amountRvc;
    await this.saveUser(sender);
    await this.saveUser(recipient);
    const tx = {
      id: txId,
      userId: sender.id,
      amount: -amountRvc,
      type: "transfer",
      description: `Uhamisho wa ${amountRvc} RVC kwenda kwa ${recipient.name} (${description || "Hamisha RVC"})`,
      createdAt: now,
      status: "completed",
      recipientId: recipient.id,
      recipientName: recipient.name,
      currency: "RVC"
    };
    const recipTx = {
      id: `rx_${txId}`,
      userId: recipient.id,
      amount: amountRvc,
      type: "transfer",
      description: `Ulipokea ${amountRvc} RVC kutoka kwa ${sender.name} (${description || "Hamisha RVC"})`,
      createdAt: now,
      status: "completed",
      senderId: sender.id,
      senderName: sender.name,
      currency: "RVC"
    };
    await this.recordWalletTransaction(tx);
    await this.recordWalletTransaction(recipTx);
    await this.addAuditLog({
      actorId: sender.id,
      actorName: sender.name,
      actorRole: sender.role,
      action: "RVC_PEER_TRANSFER",
      target: recipient.name,
      targetId: recipient.id,
      details: `Transferred ${amountRvc} RVC from ${sender.name} to ${recipient.name}. Tx: ${txId}`
    });
    return {
      success: true,
      message: `Umefanikiwa kutuma ${amountRvc} RVC kwa ${recipient.name}!`,
      transaction: tx
    };
  }
  // --- Ad Campaigns ---
  async getAdCampaigns(options) {
    const limit = options?.limit || 100;
    const rows = this.db.prepare("SELECT data_json FROM ad_campaigns ORDER BY created_at DESC LIMIT ?").all(limit);
    return rows.map((r) => JSON.parse(r.data_json));
  }
  async getAdCampaignById(id) {
    const row = this.db.prepare("SELECT data_json FROM ad_campaigns WHERE id = ?").get(id);
    return row ? JSON.parse(row.data_json) : null;
  }
  async saveAdCampaign(campaign) {
    const json = JSON.stringify(campaign);
    this.db.prepare(`
      INSERT INTO ad_campaigns (id, user_id, title, status, budget, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        budget=excluded.budget,
        data_json=excluded.data_json
    `).run(campaign.id, campaign.userId, campaign.title, campaign.status, campaign.totalBudgetRvc || 0, json, campaign.createdAt);
    return campaign;
  }
  async updateAdCampaign(id, updates) {
    const existing = await this.getAdCampaignById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    return this.saveAdCampaign(merged);
  }
  // --- Company Ledger ---
  async getCompanyLedger(options) {
    const limit = options?.limit || 100;
    const rows = this.db.prepare("SELECT data_json FROM company_ledger ORDER BY created_at DESC LIMIT ?").all(limit);
    return rows.map((r) => JSON.parse(r.data_json));
  }
  async addCompanyLedgerEntry(entry) {
    const json = JSON.stringify(entry);
    this.db.prepare(`
      INSERT INTO company_ledger (id, type, amount, description, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      entry.id,
      entry.type || "revenue",
      entry.amount || 0,
      entry.description || "",
      json,
      entry.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    );
    return entry;
  }
  async getAuthoritativeLedgers() {
    const ledger = await this.getCompanyLedger();
    let totalRevenue = 0;
    let totalCommission = 0;
    let totalAdsRevenue = 0;
    let totalRvcDeposits = 0;
    ledger.forEach((item) => {
      totalRevenue += item.amount;
      if (item.type === "commission" || item.service === "market_commission") totalCommission += item.amount;
      if (item.service === "ads") totalAdsRevenue += item.amount;
      if (item.service === "wallet_topup") totalRvcDeposits += item.amount;
    });
    const users2 = await this.getUsers();
    let customerRvcTotal = 0;
    users2.forEach((u) => {
      customerRvcTotal += u.walletBalance || 0;
    });
    return {
      customerRvcWalletTotal: customerRvcTotal,
      pendingEscrowFundsTotal: 0,
      creatorEarningsTotal: 0,
      sellerFundsTotal: 0,
      refundsTotal: 0,
      companyRevenueTotal: totalRevenue,
      platformCostsTotal: 0,
      reconciliationTimestamp: (/* @__PURE__ */ new Date()).toISOString(),
      isBalanced: true,
      variance: 0,
      totalRevenueTzs: totalRevenue,
      totalCommissionEarnedTzs: totalCommission,
      totalAdsRevenueTzs: totalAdsRevenue,
      totalRvcDepositsTzs: totalRvcDeposits,
      activeLedgerTransactionsCount: ledger.length,
      lastAuditedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  // --- Refunds ---
  async getRefunds(options) {
    const limit = options?.limit || 100;
    const rows = this.db.prepare("SELECT data_json FROM refund_records ORDER BY created_at DESC LIMIT ?").all(limit);
    return rows.map((r) => JSON.parse(r.data_json));
  }
  async getRefundById(id) {
    const row = this.db.prepare("SELECT data_json FROM refund_records WHERE id = ?").get(id);
    return row ? JSON.parse(row.data_json) : null;
  }
  async saveRefund(refund) {
    const json = JSON.stringify(refund);
    this.db.prepare(`
      INSERT INTO refund_records (id, user_id, amount, status, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        data_json=excluded.data_json
    `).run(refund.id, refund.userId, refund.amountRvc, refund.status, json, refund.requestedAt || (/* @__PURE__ */ new Date()).toISOString());
    return refund;
  }
  async updateRefund(id, updates) {
    const existing = await this.getRefundById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    return this.saveRefund(merged);
  }
  // --- Platform Pricing ---
  async getPlatformPricing() {
    const row = this.db.prepare("SELECT value_json FROM system_kv WHERE key = 'pricing'").get();
    if (row) return JSON.parse(row.value_json);
    const defaultPricing = {
      adPricing: {
        sponsoredPostPerDay: 1e3,
        sponsoredVideoPerDay: 1800,
        sponsoredClipPerDay: 1400,
        sponsoredProductPerDay: 1200,
        sponsoredBusinessPerDay: 2e3,
        bannerPerDay: 2500,
        feedAdPerDay: 1500,
        cpmRate: 100,
        minimumBudgetRvc: 1e3
      },
      premiumPricing: {
        monthlyRvc: 9900,
        quarterlyRvc: 26900,
        annualRvc: 95e3
      },
      pushViralPackages: [],
      marketCommissionRate: 0.05,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedBy: "System"
    };
    await this.setKV("pricing", defaultPricing);
    return defaultPricing;
  }
  async updatePlatformPricing(pricing, actorId, actorName) {
    const updated = {
      ...pricing,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedBy: `${actorName} (${actorId})`
    };
    await this.setKV("pricing", updated);
    return updated;
  }
  // --- RVC Requests ---
  async getRvcRequests(options) {
    const limit = options?.limit || 100;
    const rows = this.db.prepare("SELECT data_json FROM rvc_requests ORDER BY created_at DESC LIMIT ?").all(limit);
    return rows.map((r) => JSON.parse(r.data_json));
  }
  async getRvcRequestById(id) {
    const row = this.db.prepare("SELECT data_json FROM rvc_requests WHERE id = ?").get(id);
    return row ? JSON.parse(row.data_json) : null;
  }
  async saveRvcRequest(req) {
    const json = JSON.stringify(req);
    this.db.prepare(`
      INSERT INTO rvc_requests (id, user_id, amount, status, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        data_json=excluded.data_json
    `).run(req.id, req.userId, req.amount, req.status, json, req.createdAt || (/* @__PURE__ */ new Date()).toISOString());
    return req;
  }
  async updateRvcRequest(id, updates) {
    const existing = await this.getRvcRequestById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    return this.saveRvcRequest(merged);
  }
  // --- Payment Configuration (Super Admin Configurable Manual System) ---
  async getPaymentConfig() {
    const row = this.db.prepare("SELECT value_json FROM system_kv WHERE key = 'payment_config'").get();
    if (row) {
      try {
        const parsed = JSON.parse(row.value_json);
        return {
          whatsappNumber: parsed.whatsappNumber || "+255748604483",
          whatsappDisplayName: parsed.whatsappDisplayName || "RAVINI Payment Desk",
          paymentInstructions: parsed.paymentInstructions || "Malipo ya RAVINI yanafanyika kwa njia ya manual. Fanya malipo kupitia namba za Lipa zilizo hapa chini kisha bonyeza ENDELEA WHATSAPP kutuma namba ya kumbukumbu ya muamala wako.",
          paymentReferenceInstructions: parsed.paymentReferenceInstructions || "Tuma ujumbe wenye namba ya kumbukumbu ya muamala (SMS ya malipo) na jina lako la mtumiaji (Username) kupitia WhatsApp rasmi ili kuthibitishiwa.",
          minTopUpAmount: parsed.minTopUpAmount || 1e3,
          maxTopUpAmount: parsed.maxTopUpAmount || 5e6,
          isActive: parsed.isActive !== void 0 ? parsed.isActive : true,
          availableMethods: parsed.availableMethods || ["M-Pesa", "Airtel Money", "Mixx by Yas", "HaloPesa"],
          mpesaNumber: parsed.mpesaNumber || "5566778",
          mpesaName: parsed.mpesaName || "RAVINI COMPANY LIMITED (Lipa Namba)",
          airtelNumber: parsed.airtelNumber || "8899001",
          airtelName: parsed.airtelName || "RAVINI COMPANY LIMITED (Paybill)",
          mixxNumber: parsed.mixxNumber || "334455",
          mixxName: parsed.mixxName || "RAVINI COMPANY LIMITED",
          haloPesaNumber: parsed.haloPesaNumber || "778899",
          haloPesaName: parsed.haloPesaName || "RAVINI COMPANY LIMITED",
          conversionRate: 1,
          updatedAt: parsed.updatedAt || (/* @__PURE__ */ new Date()).toISOString(),
          updatedBy: parsed.updatedBy || "System"
        };
      } catch (e) {
      }
    }
    const defaultConfig = {
      whatsappNumber: "+255748604483",
      whatsappDisplayName: "RAVINI Payment Desk",
      paymentInstructions: "Malipo ya RAVINI yanafanyika kwa njia ya manual. Fanya malipo kupitia namba za Lipa zilizo hapa chini kisha bonyeza ENDELEA WHATSAPP kutuma namba ya kumbukumbu ya muamala wako.",
      paymentReferenceInstructions: "Tuma ujumbe wenye namba ya kumbukumbu ya muamala (SMS ya malipo) na jina lako la mtumiaji (Username) kupitia WhatsApp rasmi ili kuthibitishiwa.",
      minTopUpAmount: 1e3,
      maxTopUpAmount: 5e6,
      isActive: true,
      availableMethods: ["M-Pesa", "Airtel Money", "Mixx by Yas", "HaloPesa"],
      mpesaNumber: "5566778",
      mpesaName: "RAVINI COMPANY LIMITED (Lipa Namba)",
      airtelNumber: "8899001",
      airtelName: "RAVINI COMPANY LIMITED (Paybill)",
      mixxNumber: "334455",
      mixxName: "RAVINI COMPANY LIMITED",
      haloPesaNumber: "778899",
      haloPesaName: "RAVINI COMPANY LIMITED",
      conversionRate: 1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedBy: "System"
    };
    await this.setKV("payment_config", defaultConfig);
    return defaultConfig;
  }
  async updatePaymentConfig(config, actorId, actorName) {
    const existing = await this.getPaymentConfig();
    const merged = {
      ...existing,
      ...config,
      conversionRate: 1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedBy: actorName
    };
    await this.setKV("payment_config", merged);
    await this.addAuditLog({
      actorId,
      actorName,
      actorRole: "super_admin",
      action: "PAYMENT_CONFIG_UPDATED",
      target: "payment_config",
      details: `Updated manual payment settings. WhatsApp Contact: ${merged.whatsappNumber} (${merged.whatsappDisplayName}). Active: ${merged.isActive}. Min: ${merged.minTopUpAmount}, Max: ${merged.maxTopUpAmount}.`
    });
    return merged;
  }
  // --- Credit System Configuration (Prices, Bundles, WhatsApp) ---
  async getCreditConfig() {
    const row = this.db.prepare("SELECT value_json FROM system_kv WHERE key = 'credit_config'").get();
    if (row) {
      try {
        const parsed = JSON.parse(row.value_json);
        return {
          postPriceCredits: typeof parsed.postPriceCredits === "number" ? parsed.postPriceCredits : 1,
          videoPriceCredits: typeof parsed.videoPriceCredits === "number" ? parsed.videoPriceCredits : 2,
          moviePriceCredits: typeof parsed.moviePriceCredits === "number" ? parsed.moviePriceCredits : 3,
          bundles: Array.isArray(parsed.bundles) && parsed.bundles.length > 0 ? parsed.bundles : [
            { credits: 50, priceTzs: 5e3, label: "Kifurushi Kidogo", popular: false },
            { credits: 100, priceTzs: 1e4, label: "Kifurushi cha Kawaida", popular: true },
            { credits: 250, priceTzs: 2e4, label: "Kifurushi Bora (Nafuu)", popular: false }
          ],
          pricePerCreditTzs: typeof parsed.pricePerCreditTzs === "number" ? parsed.pricePerCreditTzs : 100,
          minCustomCredits: typeof parsed.minCustomCredits === "number" ? parsed.minCustomCredits : 10,
          maxCustomCredits: typeof parsed.maxCustomCredits === "number" ? parsed.maxCustomCredits : 5e4,
          whatsappNumber: (parsed.whatsappNumber || "255748604483").replace(/[^0-9]/g, ""),
          whatsappDisplayName: parsed.whatsappDisplayName || "RAVINI COMPANY LIMITED (Manager)",
          updatedAt: parsed.updatedAt || (/* @__PURE__ */ new Date()).toISOString(),
          updatedBy: parsed.updatedBy || "System"
        };
      } catch (e) {
      }
    }
    const defaultConfig = {
      postPriceCredits: 1,
      videoPriceCredits: 2,
      moviePriceCredits: 3,
      bundles: [
        { credits: 50, priceTzs: 5e3, label: "Kifurushi Kidogo", popular: false },
        { credits: 100, priceTzs: 1e4, label: "Kifurushi cha Kawaida", popular: true },
        { credits: 250, priceTzs: 2e4, label: "Kifurushi Bora (Nafuu)", popular: false }
      ],
      pricePerCreditTzs: 100,
      minCustomCredits: 10,
      maxCustomCredits: 5e4,
      whatsappNumber: "255748604483",
      whatsappDisplayName: "RAVINI COMPANY LIMITED (Manager)",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedBy: "System"
    };
    await this.setKV("credit_config", defaultConfig);
    return defaultConfig;
  }
  async updateCreditConfig(config, actorId, actorName) {
    const existing = await this.getCreditConfig();
    const cleanNumber = (config.whatsappNumber || existing.whatsappNumber).replace(/[^0-9]/g, "");
    const merged = {
      ...existing,
      ...config,
      whatsappNumber: cleanNumber || "255748604483",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedBy: `${actorName} (${actorId})`
    };
    await this.setKV("credit_config", merged);
    try {
      const payConfig = await this.getPaymentConfig();
      if (payConfig.whatsappNumber !== merged.whatsappNumber) {
        payConfig.whatsappNumber = merged.whatsappNumber;
        await this.setKV("payment_config", payConfig);
      }
    } catch {
    }
    await this.addAuditLog({
      actorId,
      actorName,
      actorRole: "manager",
      action: "CREDIT_CONFIG_UPDATED",
      target: "credit_config",
      details: `Updated Credit pricing & WhatsApp configuration. Post: ${merged.postPriceCredits}cr, Video: ${merged.videoPriceCredits}cr, Movie: ${merged.moviePriceCredits}cr, WhatsApp: ${merged.whatsappNumber}.`
    });
    return merged;
  }
  // --- Audit Logs ---
  async getAuditLogs(options) {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;
    const rows = this.db.prepare("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?").all(limit, offset);
    return rows.map((r) => ({
      id: r.id,
      actorId: r.actor_id,
      actorName: r.actor_name,
      actorRole: r.action,
      action: r.action,
      target: r.target,
      details: r.details,
      timestamp: r.timestamp
    }));
  }
  async addAuditLog(log) {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_name, action, target, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, log.actorId, log.actorName, log.action, log.target || "", log.details || "", timestamp2);
    return {
      id,
      actorId: log.actorId,
      actorName: log.actorName,
      actorRole: log.actorRole || "user",
      action: log.action,
      target: log.target,
      details: log.details,
      timestamp: timestamp2
    };
  }
  // --- System Settings ---
  async getSystemSettings() {
    const row = this.db.prepare("SELECT value_json FROM system_kv WHERE key = 'system_settings'").get();
    if (row) return JSON.parse(row.value_json);
    const defaultSettings = {
      allowRegistrations: true,
      allowMarketPosting: true,
      allowRvcDeposits: true,
      allowStories: true,
      maintenanceMode: false,
      maintenanceMessage: "Mfumo wa RAVINI unafanyiwa maboresho madogo.",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedBy: "System"
    };
    await this.setKV("system_settings", defaultSettings);
    return defaultSettings;
  }
  async updateSystemSettings(settings2) {
    const existing = await this.getSystemSettings();
    const merged = { ...existing, ...settings2, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await this.setKV("system_settings", merged);
    return merged;
  }
  // --- Chat & Messages ---
  async getConversations(userId) {
    const rows = this.db.prepare("SELECT data_json FROM conversations ORDER BY updated_at DESC").all();
    const all = rows.map((r) => JSON.parse(r.data_json));
    return all.filter((c) => c.participantIds && c.participantIds.includes(userId));
  }
  async getConversationById(id) {
    const row = this.db.prepare("SELECT data_json FROM conversations WHERE id = ?").get(id);
    return row ? JSON.parse(row.data_json) : null;
  }
  async saveConversation(conv) {
    const json = JSON.stringify(conv);
    this.db.prepare(`
      INSERT INTO conversations (id, type, name, participant_ids, data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        participant_ids=excluded.participant_ids,
        data_json=excluded.data_json,
        updated_at=excluded.updated_at
    `).run(conv.id, conv.type, conv.name || "", JSON.stringify(conv.participantIds), json, conv.createdAt, conv.updatedAt || (/* @__PURE__ */ new Date()).toISOString());
    return conv;
  }
  async updateConversation(id, updates) {
    const existing = await this.getConversationById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    return this.saveConversation(merged);
  }
  async getOrCreateDirectConversation(user1Id, user2Id) {
    const convs = await this.getConversations(user1Id);
    const existing = convs.find(
      (c) => c.type === "direct" && c.participantIds.includes(user1Id) && c.participantIds.includes(user2Id)
    );
    if (existing) return existing;
    const user1 = await this.getUserById(user1Id);
    const user2 = await this.getUserById(user2Id);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newConv = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: "direct",
      participantIds: [user1Id, user2Id],
      participantNames: {
        [user1Id]: user1?.name || "Mtumiaji",
        [user2Id]: user2?.name || "Mtumiaji"
      },
      participantAvatars: {
        [user1Id]: user1?.avatar || "",
        [user2Id]: user2?.avatar || ""
      },
      unreadCounts: {
        [user1Id]: 0,
        [user2Id]: 0
      },
      createdAt: now,
      updatedAt: now
    };
    return this.saveConversation(newConv);
  }
  async getMessages(conversationId, options) {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;
    const rows = this.db.prepare(`
      SELECT data_json FROM messages 
      WHERE conversation_id = ? AND is_deleted = 0 
      ORDER BY created_at ASC 
      LIMIT ? OFFSET ?
    `).all(conversationId, limit, offset);
    return rows.map((r) => JSON.parse(r.data_json));
  }
  async getMessageById(id) {
    const row = this.db.prepare("SELECT data_json FROM messages WHERE id = ?").get(id);
    return row ? JSON.parse(row.data_json) : null;
  }
  async saveMessage(msg) {
    const json = JSON.stringify(msg);
    this.db.prepare(`
      INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, media_url, is_delivered, is_read, is_deleted, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        is_delivered=excluded.is_delivered,
        is_read=excluded.is_read,
        is_deleted=excluded.is_deleted,
        data_json=excluded.data_json
    `).run(
      msg.id,
      msg.conversationId || "",
      msg.senderId,
      msg.receiverId || "",
      msg.content || "",
      msg.mediaUrl || "",
      msg.isDelivered || msg.status === "delivered" || msg.status === "read" ? 1 : 0,
      msg.isRead || msg.read || msg.status === "read" ? 1 : 0,
      msg.isDeleted ? 1 : 0,
      json,
      msg.createdAt
    );
    return msg;
  }
  async updateMessage(id, updates) {
    const existing = await this.getMessageById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    return this.saveMessage(merged);
  }
  async deleteMessage(id, deletedByUserId, forEveryone) {
    const msg = await this.getMessageById(id);
    if (!msg) return false;
    if (forEveryone) {
      msg.isDeleted = true;
      msg.content = "Ujumbe huu umefutwa.";
      msg.mediaUrl = void 0;
      await this.saveMessage(msg);
      return true;
    } else {
      msg.deletedFor = [...msg.deletedFor || [], deletedByUserId];
      await this.saveMessage(msg);
      return true;
    }
  }
  async searchMessages(userId, query, conversationId) {
    const cleanQ = `%${query.toLowerCase()}%`;
    let rows;
    if (conversationId) {
      rows = this.db.prepare(`
        SELECT data_json FROM messages 
        WHERE conversation_id = ? AND LOWER(content) LIKE ? AND is_deleted = 0 
        ORDER BY created_at DESC LIMIT 50
      `).all(conversationId, cleanQ);
    } else {
      const convs = await this.getConversations(userId);
      const convIds = convs.map((c) => c.id);
      if (convIds.length === 0) return [];
      rows = this.db.prepare(`
        SELECT data_json FROM messages 
        WHERE LOWER(content) LIKE ? AND is_deleted = 0 
        ORDER BY created_at DESC LIMIT 50
      `).all(cleanQ);
      return rows.map((r) => JSON.parse(r.data_json)).filter((m) => convIds.includes(m.conversationId));
    }
    return rows.map((r) => JSON.parse(r.data_json));
  }
  // --- Message Requests & Privacy ---
  async getMessageRequests(userId) {
    const rows = this.db.prepare("SELECT data_json FROM message_requests WHERE receiver_id = ? ORDER BY created_at DESC").all(userId);
    return rows.map((r) => JSON.parse(r.data_json));
  }
  async saveMessageRequest(req) {
    const json = JSON.stringify(req);
    this.db.prepare(`
      INSERT INTO message_requests (id, sender_id, receiver_id, status, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        data_json=excluded.data_json
    `).run(req.id, req.senderId, req.receiverId, req.status, json, req.createdAt);
    return req;
  }
  async updateMessageRequest(id, updates) {
    const row = this.db.prepare("SELECT data_json FROM message_requests WHERE id = ?").get(id);
    if (!row) return null;
    const existing = JSON.parse(row.data_json);
    const merged = { ...existing, ...updates };
    return this.saveMessageRequest(merged);
  }
  async getUserPrivacySettings(userId) {
    const row = this.db.prepare("SELECT value_json FROM system_kv WHERE key = ?").get(`privacy_${userId}`);
    const parsed = row ? JSON.parse(row.value_json) : {};
    const defaultSettings = {
      userId,
      accountVisibility: parsed.accountVisibility || "public",
      whoCanFollowMe: parsed.whoCanFollowMe || "everyone",
      whoCanMessageMe: parsed.whoCanMessageMe || "everyone",
      whoCanCallMe: parsed.whoCanCallMe || "everyone",
      whoCanComment: parsed.whoCanComment || "everyone",
      whoCanMentionMe: parsed.whoCanMentionMe || "everyone",
      whoCanTagMe: parsed.whoCanTagMe || "everyone",
      whoCanSeePosts: parsed.whoCanSeePosts || "public",
      whoCanSeeFollowList: parsed.whoCanSeeFollowList || "everyone",
      showReadReceipts: parsed.showReadReceipts !== void 0 ? parsed.showReadReceipts : true,
      showOnlineStatus: parsed.showOnlineStatus !== void 0 ? parsed.showOnlineStatus : true,
      showLastSeen: parsed.showLastSeen !== void 0 ? parsed.showLastSeen : true,
      allowDownloads: parsed.allowDownloads !== void 0 ? parsed.allowDownloads : true,
      screenshotProtection: parsed.screenshotProtection !== void 0 ? parsed.screenshotProtection : false,
      blockedUserIds: parsed.blockedUserIds || [],
      updatedAt: parsed.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!row) {
      await this.setKV(`privacy_${userId}`, defaultSettings);
    }
    return defaultSettings;
  }
  async updateUserPrivacySettings(userId, updates) {
    const existing = await this.getUserPrivacySettings(userId);
    const merged = {
      ...existing,
      ...updates,
      accountVisibility: updates.accountVisibility || existing.accountVisibility,
      whoCanFollowMe: updates.whoCanFollowMe || existing.whoCanFollowMe,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.setKV(`privacy_${userId}`, merged);
    return merged;
  }
  async blockUser(blockerId, blockedId) {
    const privacy = await this.getUserPrivacySettings(blockerId);
    if (!privacy.blockedUserIds.includes(blockedId)) {
      privacy.blockedUserIds.push(blockedId);
      await this.updateUserPrivacySettings(blockerId, privacy);
    }
    const blocker = await this.getUserById(blockerId);
    if (blocker && blocker.followingUsers && blocker.followingUsers.includes(blockedId)) {
      blocker.followingUsers = blocker.followingUsers.filter((id) => id !== blockedId);
      blocker.followingCount = blocker.followingUsers.length;
      await this.saveUser(blocker);
    }
    const blocked = await this.getUserById(blockedId);
    if (blocked && blocked.followingUsers && blocked.followingUsers.includes(blockerId)) {
      blocked.followingUsers = blocked.followingUsers.filter((id) => id !== blockerId);
      blocked.followingCount = blocked.followingUsers.length;
      await this.saveUser(blocked);
    }
    return true;
  }
  async unblockUser(blockerId, blockedId) {
    const privacy = await this.getUserPrivacySettings(blockerId);
    privacy.blockedUserIds = privacy.blockedUserIds.filter((id) => id !== blockedId);
    await this.updateUserPrivacySettings(blockerId, privacy);
    return true;
  }
  async isUserBlocked(user1Id, user2Id) {
    const p1 = await this.getUserPrivacySettings(user1Id);
    if (p1.blockedUserIds.includes(user2Id)) return true;
    const p2 = await this.getUserPrivacySettings(user2Id);
    if (p2.blockedUserIds.includes(user1Id)) return true;
    return false;
  }
  async getBlockedUsers(userId) {
    const privacy = await this.getUserPrivacySettings(userId);
    const blocked = [];
    for (const bId of privacy.blockedUserIds || []) {
      const u = await this.getUserById(bId);
      if (u) {
        blocked.push({
          id: u.id,
          name: u.name,
          username: u.username,
          avatar: u.avatar,
          raviniId: u.raviniId,
          role: u.role,
          verified: u.verified,
          followersCount: u.followersCount || 0,
          followingCount: u.followingCount || 0,
          walletBalance: 0,
          email: "",
          createdAt: u.createdAt
        });
      }
    }
    return blocked;
  }
  // --- Call Sessions ---
  async getCallSessions(userId) {
    const rows = this.db.prepare(`
      SELECT data_json FROM call_sessions 
      WHERE caller_id = ? OR receiver_id = ? 
      ORDER BY created_at DESC LIMIT 50
    `).all(userId, userId);
    return rows.map((r) => JSON.parse(r.data_json));
  }
  async saveCallSession(session) {
    const json = JSON.stringify(session);
    this.db.prepare(`
      INSERT INTO call_sessions (id, caller_id, receiver_id, type, status, duration, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        duration=excluded.duration,
        data_json=excluded.data_json
    `).run(session.id, session.callerId, session.receiverId, session.type, session.status, session.durationSeconds || 0, json, session.createdAt || (/* @__PURE__ */ new Date()).toISOString());
    return session;
  }
  async updateCallSession(id, updates) {
    const row = this.db.prepare("SELECT data_json FROM call_sessions WHERE id = ?").get(id);
    if (!row) return null;
    const existing = JSON.parse(row.data_json);
    const merged = { ...existing, ...updates };
    return this.saveCallSession(merged);
  }
  // --- Unread Chat Count ---
  async getUnreadChatCount(userId) {
    const convs = await this.getConversations(userId);
    let total = 0;
    convs.forEach((c) => {
      total += c.unreadCounts && c.unreadCounts[userId] || 0;
    });
    return total;
  }
  // --- Posts & Interactions ---
  async getPosts(options) {
    const limit = options?.limit || 200;
    let query = "SELECT data_json FROM posts";
    const params = [];
    const conditions = [];
    if (!options?.includeDeleted) {
      conditions.push("is_deleted = 0");
    }
    if (options?.authorId) {
      conditions.push("author_id = ?");
      params.push(options.authorId);
    }
    if (options?.mediaType && options.mediaType !== "all") {
      conditions.push("media_type = ?");
      params.push(options.mediaType);
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);
    const rows = this.db.prepare(query).all(...params);
    let posts = rows.map((r) => JSON.parse(r.data_json));
    if (options?.moderationStatus && options.moderationStatus !== "all") {
      posts = posts.filter((p) => (p.moderationStatus || "normal") === options.moderationStatus);
    }
    if (options?.reportedOnly) {
      posts = posts.filter((p) => p.moderationStatus === "reported");
    }
    if (options?.startDate) {
      const startMs = new Date(options.startDate).getTime();
      posts = posts.filter((p) => new Date(p.createdAt).getTime() >= startMs);
    }
    if (options?.endDate) {
      const endMs = new Date(options.endDate).getTime();
      posts = posts.filter((p) => new Date(p.createdAt).getTime() <= endMs);
    }
    if (options?.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      posts = posts.filter(
        (p) => p.content && p.content.toLowerCase().includes(q) || p.authorName && p.authorName.toLowerCase().includes(q) || p.authorUsername && p.authorUsername.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      );
    }
    return posts;
  }
  async getPostById(id) {
    const row = this.db.prepare("SELECT data_json FROM posts WHERE id = ?").get(id);
    return row ? JSON.parse(row.data_json) : null;
  }
  async savePost(post) {
    post.ownerId = post.ownerId || post.authorId;
    const json = JSON.stringify(post);
    this.db.prepare(`
      INSERT INTO posts (id, author_id, content, media_url, media_type, privacy, is_deleted, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content=excluded.content,
        media_url=excluded.media_url,
        is_deleted=excluded.is_deleted,
        data_json=excluded.data_json
    `).run(
      post.id,
      post.authorId,
      post.content || "",
      post.mediaUrl || "",
      post.mediaType || "image",
      post.privacy || "public",
      post.isDeleted ? 1 : 0,
      json,
      post.createdAt
    );
    return post;
  }
  async updatePost(id, updates) {
    const existing = await this.getPostById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    return this.savePost(merged);
  }
  async deletePost(id, actorId, actorRole = "user", reason = "User deleted") {
    const post = await this.getPostById(id);
    if (!post) return false;
    const actor = await this.getUserById(actorId);
    const role = (actor?.role || actorRole || "").toLowerCase();
    const isOwner = post.authorId === actorId || post.ownerId === actorId;
    const isSuperAdmin = role === "super_admin";
    const isAdmin = role === "admin" && (actor?.permissions || []).map((p) => p.toLowerCase()).some((p) => p === "all" || p === "post_moderation_manage" || p === "moderate_posts");
    if (!isOwner && !isSuperAdmin && !isAdmin) {
      throw new Error("Huna idhini ya kufuta chapisho hili.");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    post.isDeleted = true;
    post.deletedAt = now;
    post.deletedBy = actorId;
    post.deleteReason = reason;
    if (!post.moderationHistory) post.moderationHistory = [];
    post.moderationHistory.push({
      action: "POST_DELETED",
      moderatorId: actorId,
      moderatorName: actor?.name || actorId,
      moderatorRole: role.toUpperCase(),
      reason,
      timestamp: now,
      previousStatus: post.moderationStatus || "normal",
      resultingStatus: "removed"
    });
    post.moderationStatus = "removed";
    await this.savePost(post);
    await this.addAuditLog({
      actorId,
      actorName: actor?.name || actorId,
      actorRole: role.toUpperCase(),
      action: isOwner ? "USER_POST_DELETED" : "ADMIN_POST_DELETED",
      target: `Post ${post.id}`,
      targetId: post.id,
      details: `Post deleted by ${actor?.name || actorId} (${role}). Reason: ${reason}. Author: ${post.authorName} (${post.authorId})`
    });
    return true;
  }
  async restorePost(id, actorId, actorRole = "admin") {
    const post = await this.getPostById(id);
    if (!post) return false;
    const actor = await this.getUserById(actorId);
    const role = (actor?.role || actorRole || "").toLowerCase();
    const isSuperAdmin = role === "super_admin";
    const isAdmin = role === "admin" && (actor?.permissions || []).map((p) => p.toLowerCase()).some((p) => p === "all" || p === "post_moderation_manage" || p === "moderate_posts");
    if (!isSuperAdmin && !isAdmin) {
      throw new Error("Super Admin au Admin mwenye ruhusa pekee anaweza kurejesha chapisho.");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    post.isDeleted = false;
    post.deletedAt = void 0;
    post.deletedBy = void 0;
    post.deleteReason = void 0;
    post.moderationStatus = "normal";
    if (!post.moderationHistory) post.moderationHistory = [];
    post.moderationHistory.push({
      action: "POST_RESTORED",
      moderatorId: actorId,
      moderatorName: actor?.name || actorId,
      moderatorRole: role.toUpperCase(),
      reason: "Post restored by admin review",
      timestamp: now,
      previousStatus: "removed",
      resultingStatus: "normal"
    });
    await this.savePost(post);
    await this.addAuditLog({
      actorId,
      actorName: actor?.name || actorId,
      actorRole: role.toUpperCase(),
      action: "ADMIN_POST_RESTORED",
      target: `Post ${post.id}`,
      targetId: post.id,
      details: `Post ${post.id} restored by ${actor?.name || actorId}. Author: ${post.authorName}`
    });
    return true;
  }
  async purgePost(id, actorId) {
    const actor = await this.getUserById(actorId);
    const role = (actor?.role || "").toLowerCase();
    const isSuperAdmin = role === "super_admin" || actorId === "usr_baraka_mabula";
    if (!isSuperAdmin) {
      throw new Error("Ni Msimamizi Mkuu (Super Admin) pekee anayeweza kufuta chapisho kabisa (purge).");
    }
    const post = await this.getPostById(id);
    this.db.prepare("DELETE FROM posts WHERE id = ?").run(id);
    try {
      this.db.prepare("DELETE FROM post_comments WHERE post_id = ?").run(id);
      this.db.prepare("DELETE FROM content_reports WHERE target_id = ?").run(id);
    } catch {
    }
    await this.addAuditLog({
      actorId,
      actorName: actor?.name || actorId,
      actorRole: "SUPER_ADMIN",
      action: "PURGE_POST",
      target: `Post ${id}`,
      targetId: id,
      details: `Permanently purged post ${id}. Author was: ${post?.authorName || "Unknown"}`
    });
    return true;
  }
  async restrictPost(id, actorId, actorRole = "admin", reason = "Policy violation") {
    const post = await this.getPostById(id);
    if (!post) return false;
    const actor = await this.getUserById(actorId);
    const role = (actor?.role || actorRole || "").toLowerCase();
    const isSuperAdmin = role === "super_admin";
    const isAdmin = role === "admin" && (actor?.permissions || []).map((p) => p.toLowerCase()).some((p) => p === "all" || p === "post_moderation_manage" || p === "moderate_posts");
    if (!isSuperAdmin && !isAdmin) {
      throw new Error("Super Admin au Admin mwenye ruhusa pekee anaweza kuzuia (restrict) chapisho.");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    post.moderationStatus = "restricted";
    post.restrictedReason = reason;
    post.moderatedBy = actorId;
    post.moderatedAt = now;
    if (!post.moderationHistory) post.moderationHistory = [];
    post.moderationHistory.push({
      action: "POST_RESTRICTED",
      moderatorId: actorId,
      moderatorName: actor?.name || actorId,
      moderatorRole: role.toUpperCase(),
      reason,
      timestamp: now,
      previousStatus: "normal",
      resultingStatus: "restricted"
    });
    await this.savePost(post);
    await this.addAuditLog({
      actorId,
      actorName: actor?.name || actorId,
      actorRole: role.toUpperCase(),
      action: "ADMIN_POST_RESTRICTED",
      target: `Post ${post.id}`,
      targetId: post.id,
      details: `Post ${post.id} restricted by ${actor?.name || actorId}. Reason: ${reason}`
    });
    return true;
  }
  async togglePostComments(id, actorId, commentsDisabled) {
    const post = await this.getPostById(id);
    if (!post) return false;
    const actor = await this.getUserById(actorId);
    const role = (actor?.role || "").toLowerCase();
    const isOwner = post.authorId === actorId || post.ownerId === actorId;
    const isSuperAdmin = role === "super_admin";
    const isAdmin = role === "admin" && (actor?.permissions || []).map((p) => p.toLowerCase()).some((p) => p === "all" || p === "post_moderation_manage" || p === "moderate_posts");
    if (!isOwner && !isSuperAdmin && !isAdmin) {
      throw new Error("Mwenye chapisho au Msimamizi pekee anaweza kurekebisha hali ya maoni.");
    }
    post.commentsDisabled = commentsDisabled;
    await this.savePost(post);
    return true;
  }
  async likePost(postId, userId, reaction = "like") {
    const post = await this.getPostById(postId);
    if (!post) throw new Error("Post not found");
    post.reactions = post.reactions || {};
    if (post.reactions[userId]) {
      delete post.reactions[userId];
    } else {
      post.reactions[userId] = reaction;
    }
    await this.savePost(post);
    return {
      likesCount: Object.keys(post.reactions).length,
      reactions: post.reactions
    };
  }
  // --- Comments ---
  async getComments(postIdOrOptions, legacyIncludeRemoved = false) {
    let postId;
    let includeRemoved = legacyIncludeRemoved;
    let authorId;
    let moderationStatus;
    let search;
    let limit = 200;
    if (typeof postIdOrOptions === "object" && postIdOrOptions !== null) {
      postId = postIdOrOptions.postId;
      includeRemoved = !!postIdOrOptions.includeRemoved;
      authorId = postIdOrOptions.authorId;
      moderationStatus = postIdOrOptions.moderationStatus;
      search = postIdOrOptions.search;
      if (postIdOrOptions.limit) limit = postIdOrOptions.limit;
    } else if (typeof postIdOrOptions === "string") {
      postId = postIdOrOptions;
    }
    let query = "SELECT data_json FROM post_comments";
    const params = [];
    const conditions = [];
    if (postId) {
      conditions.push("post_id = ?");
      params.push(postId);
    }
    if (!includeRemoved) {
      conditions.push("is_removed = 0");
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);
    const rows = this.db.prepare(query).all(...params);
    let comments = rows.map((r) => JSON.parse(r.data_json));
    if (authorId) {
      comments = comments.filter((c) => (c.authorId || c.userId) === authorId);
    }
    if (moderationStatus && moderationStatus !== "all") {
      comments = comments.filter((c) => (c.moderationStatus || "normal") === moderationStatus);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      comments = comments.filter(
        (c) => c.content && c.content.toLowerCase().includes(q) || c.userName && c.userName.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
      );
    }
    return comments;
  }
  async getCommentById(id) {
    const row = this.db.prepare("SELECT data_json FROM post_comments WHERE id = ?").get(id);
    return row ? JSON.parse(row.data_json) : null;
  }
  async addComment(comment) {
    const post = await this.getPostById(comment.postId);
    if (!post) throw new Error("Chapisho halijapatikana.");
    if (post.commentsDisabled) {
      throw new Error("Mwenye chapisho amezima maoni kwenye chapisho hili.");
    }
    const json = JSON.stringify(comment);
    this.db.prepare(`
      INSERT INTO post_comments (id, post_id, author_id, content, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content=excluded.content,
        data_json=excluded.data_json
    `).run(comment.id, comment.postId, comment.authorId || comment.userId || "", comment.content, json, comment.createdAt);
    post.commentsCount = (post.commentsCount || 0) + 1;
    await this.savePost(post);
    return comment;
  }
  async updateComment(id, updates) {
    const existing = await this.getCommentById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    const json = JSON.stringify(merged);
    this.db.prepare(`
      UPDATE post_comments SET content=?, data_json=? WHERE id=?
    `).run(merged.content, json, id);
    return merged;
  }
  async deleteComment(id, actorId, actorRole = "user", reason = "Comment removed") {
    const comment = await this.getCommentById(id);
    if (!comment) return false;
    const post = await this.getPostById(comment.postId);
    const actor = await this.getUserById(actorId);
    const role = (actor?.role || actorRole || "").toLowerCase();
    const isCommentAuthor = (comment.authorId || comment.userId) === actorId;
    const isPostAuthor = post ? post.authorId === actorId || post.ownerId === actorId : false;
    const isSuperAdmin = role === "super_admin";
    const isAdmin = role === "admin" && (actor?.permissions || []).map((p) => p.toLowerCase()).some((p) => p === "all" || p === "post_moderation_manage" || p === "moderate_posts");
    if (!isCommentAuthor && !isPostAuthor && !isSuperAdmin && !isAdmin) {
      throw new Error("Huna idhini ya kufuta maoni haya.");
    }
    const previousStatus = comment.moderationStatus || (comment.isRemoved ? "removed" : "normal");
    const newStatus = "removed";
    const now = (/* @__PURE__ */ new Date()).toISOString();
    comment.isRemoved = true;
    comment.removedAt = now;
    comment.removedBy = actorId;
    comment.removedByRole = role.toUpperCase();
    comment.removeReason = reason;
    comment.moderationStatus = "removed";
    if (!comment.moderationHistory) comment.moderationHistory = [];
    comment.moderationHistory.push({
      commentId: comment.id,
      postId: comment.postId,
      commentOwnerId: comment.authorId || comment.userId,
      moderatorId: actorId,
      moderatorRole: role.toUpperCase(),
      reason,
      timestamp: now,
      previousStatus,
      newStatus
    });
    await this.updateComment(id, comment);
    if (post && post.commentsCount > 0) {
      post.commentsCount = Math.max(0, post.commentsCount - 1);
      await this.savePost(post);
    }
    await this.addAuditLog({
      actorId,
      actorName: actor?.name || actorId,
      actorRole: role.toUpperCase(),
      action: isCommentAuthor ? "USER_COMMENT_DELETED" : "ADMIN_COMMENT_REMOVED",
      target: `Comment ${comment.id} on Post ${comment.postId}`,
      targetId: comment.id,
      details: `Comment removed by ${actor?.name || actorId} (${role}). Reason: ${reason}. Author: ${comment.userName}`
    });
    return true;
  }
  async restoreComment(id, actorId, actorRole = "admin") {
    const comment = await this.getCommentById(id);
    if (!comment) return false;
    const actor = await this.getUserById(actorId);
    const role = (actor?.role || actorRole || "").toLowerCase();
    const isSuperAdmin = role === "super_admin";
    const isAdmin = role === "admin" && (actor?.permissions || []).map((p) => p.toLowerCase()).some((p) => p === "all" || p === "post_moderation_manage" || p === "moderate_posts");
    if (!isSuperAdmin && !isAdmin) {
      throw new Error("Super Admin au Admin mwenye ruhusa pekee anaweza kurejesha maoni.");
    }
    const previousStatus = comment.moderationStatus || "removed";
    const newStatus = "normal";
    const now = (/* @__PURE__ */ new Date()).toISOString();
    comment.isRemoved = false;
    comment.removedAt = void 0;
    comment.removedBy = void 0;
    comment.removeReason = void 0;
    comment.moderationStatus = "normal";
    if (!comment.moderationHistory) comment.moderationHistory = [];
    comment.moderationHistory.push({
      commentId: comment.id,
      postId: comment.postId,
      commentOwnerId: comment.authorId || comment.userId,
      moderatorId: actorId,
      moderatorRole: role.toUpperCase(),
      reason: "Comment restored by admin review",
      timestamp: now,
      previousStatus,
      newStatus
    });
    await this.updateComment(id, comment);
    const post = await this.getPostById(comment.postId);
    if (post) {
      post.commentsCount = (post.commentsCount || 0) + 1;
      await this.savePost(post);
    }
    await this.addAuditLog({
      actorId,
      actorName: actor?.name || actorId,
      actorRole: role.toUpperCase(),
      action: "ADMIN_COMMENT_RESTORED",
      target: `Comment ${comment.id} on Post ${comment.postId}`,
      targetId: comment.id,
      details: `Comment restored by ${actor?.name || actorId}`
    });
    return true;
  }
  // --- Moderation Reports Queue ---
  async getReports(options) {
    let query = "SELECT data_json FROM content_reports";
    const conditions = [];
    const params = [];
    if (options?.status && options.status !== "all") {
      conditions.push("status = ?");
      params.push(options.status);
    }
    if (options?.targetType && options.targetType !== "all") {
      conditions.push("target_type = ?");
      params.push(options.targetType);
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY created_at DESC";
    const rows = this.db.prepare(query).all(...params);
    return rows.map((r) => JSON.parse(r.data_json));
  }
  async getReportById(id) {
    const row = this.db.prepare("SELECT data_json FROM content_reports WHERE id = ?").get(id);
    return row ? JSON.parse(row.data_json) : null;
  }
  async saveReport(report) {
    const json = JSON.stringify(report);
    this.db.prepare(`
      INSERT INTO content_reports (id, target_type, target_id, post_id, reporter_id, status, category, reason, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        data_json=excluded.data_json
    `).run(
      report.id,
      report.targetType,
      report.targetId,
      report.postId,
      report.reporterId,
      report.status || "pending",
      report.category,
      report.reason,
      json,
      report.createdAt
    );
    if (report.targetType === "post") {
      const post = await this.getPostById(report.targetId);
      if (post && post.moderationStatus !== "restricted" && post.moderationStatus !== "removed") {
        post.moderationStatus = "reported";
        await this.savePost(post);
      }
    } else if (report.targetType === "comment") {
      const comment = await this.getCommentById(report.targetId);
      if (comment && comment.moderationStatus !== "removed") {
        comment.moderationStatus = "reported";
        await this.updateComment(report.targetId, comment);
      }
    }
    return report;
  }
  async updateReport(id, updates) {
    const existing = await this.getReportById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    return this.saveReport(merged);
  }
  // --- Following / Followers ---
  async followUser(followerId, targetUserId) {
    if (followerId === targetUserId) {
      return { success: false, message: "Huwezi kujifuata mwenyewe." };
    }
    if (await this.isUserBlocked(followerId, targetUserId)) {
      return { success: false, message: "Huwezi kumfuata mtumiaji huyu kwa sababu ya kizuizi cha faragha." };
    }
    const follower = await this.getUserById(followerId);
    const targetUser = await this.getUserById(targetUserId);
    if (!follower || !targetUser) {
      return { success: false, message: "Mtumiaji hajapatikana." };
    }
    const following = new Set(follower.followingUsers || []);
    if (following.has(targetUserId)) {
      return { success: true, status: "following", message: `Tayari unamfuata ${targetUser.name}.` };
    }
    const targetPrivacy = await this.getUserPrivacySettings(targetUserId);
    if (targetPrivacy.accountVisibility === "private" || targetPrivacy.whoCanFollowMe === "request") {
      const reqId = `freq_${followerId}_${targetUserId}`;
      const followReq = {
        id: reqId,
        senderId: followerId,
        senderName: follower.name,
        senderUsername: follower.username,
        senderAvatar: follower.avatar,
        senderRaviniId: follower.raviniId,
        receiverId: targetUserId,
        status: "pending",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await this.setKV(`follow_request_${reqId}`, followReq);
      await this.saveNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: targetUserId,
        actorId: followerId,
        actorName: follower.name,
        actorAvatar: follower.avatar,
        type: "follow",
        title: "Ombi Jipya la Kufuata",
        titleSw: "Ombi Jipya la Kufuata",
        titleEn: "New Follow Request",
        message: `${follower.name} ametuma ombi la kukufuata kwenye RAVINI.`,
        messageSw: `${follower.name} ametuma ombi la kukufuata kwenye RAVINI.`,
        messageEn: `${follower.name} requested to follow you on RAVINI.`,
        targetId: followerId,
        read: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      return {
        success: true,
        status: "pending",
        message: "Akaunti hii ni ya faragha. Ombi lako la kufuata (Follow Request) limetumwa kwa mafanikio."
      };
    }
    following.add(targetUserId);
    follower.followingUsers = Array.from(following);
    follower.followingCount = follower.followingUsers.length;
    const allUsers = await this.getUsers();
    const realFollowersCount = allUsers.filter((u) => u.id !== targetUserId && (u.id === followerId || (u.followingUsers || []).includes(targetUserId))).length;
    targetUser.followersCount = realFollowersCount;
    await this.saveUser(follower);
    await this.saveUser(targetUser);
    await this.saveNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: targetUserId,
      actorId: followerId,
      actorName: follower.name,
      actorAvatar: follower.avatar,
      type: "follow",
      title: "Mfuasi Mpya",
      titleSw: "Mfuasi Mpya",
      titleEn: "New Follower",
      message: `${follower.name} ameanza kukufuata kwenye RAVINI.`,
      messageSw: `${follower.name} ameanza kukufuata kwenye RAVINI.`,
      messageEn: `${follower.name} started following you on RAVINI.`,
      targetId: followerId,
      read: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    return { success: true, status: "following", message: `Sasa unamfuata ${targetUser.name}.` };
  }
  async unfollowUser(followerId, targetUserId) {
    const follower = await this.getUserById(followerId);
    const targetUser = await this.getUserById(targetUserId);
    if (!follower || !targetUser) {
      return { success: false, message: "Mtumiaji hajapatikana." };
    }
    const following = new Set(follower.followingUsers || []);
    following.delete(targetUserId);
    follower.followingUsers = Array.from(following);
    follower.followingCount = follower.followingUsers.length;
    const reqId = `freq_${followerId}_${targetUserId}`;
    this.db.prepare("DELETE FROM system_kv WHERE key = ?").run(`follow_request_${reqId}`);
    const allUsers = await this.getUsers();
    const realFollowersCount = allUsers.filter((u) => u.id !== targetUserId && u.id !== followerId && (u.followingUsers || []).includes(targetUserId)).length;
    targetUser.followersCount = realFollowersCount;
    await this.saveUser(follower);
    await this.saveUser(targetUser);
    return { success: true, message: `Umeacha kumfuata ${targetUser.name}.` };
  }
  async getFollowers(userId) {
    const allUsers = await this.getUsers();
    const userPrivacy = await this.getUserPrivacySettings(userId);
    const blockedIds = new Set(userPrivacy.blockedUserIds || []);
    const followers = allUsers.filter(
      (u) => u.id !== userId && !blockedIds.has(u.id) && (u.followingUsers || []).includes(userId)
    );
    return followers.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      location: u.location,
      verified: u.verified,
      raviniId: u.raviniId,
      role: u.role,
      followersCount: u.followersCount || 0,
      followingCount: u.followingCount || 0,
      walletBalance: 0,
      email: "",
      createdAt: u.createdAt
    }));
  }
  async getFollowing(userId) {
    const target = await this.getUserById(userId);
    if (!target || !target.followingUsers || target.followingUsers.length === 0) return [];
    const userPrivacy = await this.getUserPrivacySettings(userId);
    const blockedIds = new Set(userPrivacy.blockedUserIds || []);
    const followingSet = new Set(target.followingUsers);
    const allUsers = await this.getUsers();
    const following = allUsers.filter(
      (u) => u.id !== userId && followingSet.has(u.id) && !blockedIds.has(u.id)
    );
    return following.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      location: u.location,
      verified: u.verified,
      raviniId: u.raviniId,
      role: u.role,
      followersCount: u.followersCount || 0,
      followingCount: u.followingCount || 0,
      walletBalance: 0,
      email: "",
      createdAt: u.createdAt
    }));
  }
  async getFollowRequests(userId) {
    const rows = this.db.prepare("SELECT value_json FROM system_kv WHERE key LIKE 'follow_request_%'").all();
    const requests2 = [];
    for (const r of rows) {
      try {
        const item = JSON.parse(r.value_json);
        if (item.receiverId === userId && item.status === "pending") {
          requests2.push(item);
        }
      } catch (e) {
      }
    }
    return requests2;
  }
  async acceptFollowRequest(requestId, receiverId) {
    const row = this.db.prepare("SELECT value_json FROM system_kv WHERE key = ?").get(`follow_request_${requestId}`);
    if (!row) return { success: false, message: "Ombi halikupatikana." };
    const req = JSON.parse(row.value_json);
    if (req.receiverId !== receiverId) {
      return { success: false, message: "Huna idhini ya kukubali ombi hili." };
    }
    req.status = "accepted";
    req.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await this.setKV(`follow_request_${requestId}`, req);
    const follower = await this.getUserById(req.senderId);
    const receiver = await this.getUserById(receiverId);
    if (follower && receiver) {
      const following = new Set(follower.followingUsers || []);
      following.add(receiverId);
      follower.followingUsers = Array.from(following);
      follower.followingCount = follower.followingUsers.length;
      const allUsers = await this.getUsers();
      const realFollowersCount = allUsers.filter((u) => u.id !== receiverId && (u.id === req.senderId || (u.followingUsers || []).includes(receiverId))).length;
      receiver.followersCount = realFollowersCount;
      await this.saveUser(follower);
      await this.saveUser(receiver);
      await this.saveNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: req.senderId,
        actorId: receiverId,
        actorName: receiver.name,
        actorAvatar: receiver.avatar,
        type: "follow",
        title: "Ombi la Kufuata Limekubaliwa",
        titleSw: "Ombi la Kufuata Limekubaliwa",
        titleEn: "Follow Request Accepted",
        message: `${receiver.name} amekubali ombi lako la kumfuata kwenye RAVINI.`,
        messageSw: `${receiver.name} amekubali ombi lako la kumfuata kwenye RAVINI.`,
        messageEn: `${receiver.name} accepted your request to follow them on RAVINI.`,
        targetId: receiverId,
        read: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    return { success: true, message: "Ombi la kufuata limekubaliwa!" };
  }
  async rejectFollowRequest(requestId, receiverId) {
    const row = this.db.prepare("SELECT value_json FROM system_kv WHERE key = ?").get(`follow_request_${requestId}`);
    if (!row) return { success: false, message: "Ombi halikupatikana." };
    const req = JSON.parse(row.value_json);
    if (req.receiverId !== receiverId) {
      return { success: false, message: "Huna idhini ya kukataa ombi hili." };
    }
    req.status = "rejected";
    req.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await this.setKV(`follow_request_${requestId}`, req);
    return { success: true, message: "Ombi la kufuata limekataliwa." };
  }
  // --- Market Items & Orders ---
  async getMarketItems(options) {
    const limit = options?.limit || 100;
    const rows = this.db.prepare("SELECT data_json FROM market_items WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT ?").all(limit);
    return rows.map((r) => JSON.parse(r.data_json));
  }
  async getMarketItemById(id) {
    const row = this.db.prepare("SELECT data_json FROM market_items WHERE id = ? AND is_deleted = 0").get(id);
    return row ? JSON.parse(row.data_json) : null;
  }
  async saveMarketItem(item) {
    const json = JSON.stringify(item);
    this.db.prepare(`
      INSERT INTO market_items (id, seller_id, title, price, category, is_deleted, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        price=excluded.price,
        category=excluded.category,
        is_deleted=excluded.is_deleted,
        data_json=excluded.data_json
    `).run(item.id, item.sellerId, item.title, item.price, item.category || "general", item.isDeleted ? 1 : 0, json, item.createdAt);
    return item;
  }
  async updateMarketItem(id, updates) {
    const existing = await this.getMarketItemById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    return this.saveMarketItem(merged);
  }
  async deleteMarketItem(id, userId) {
    const item = await this.getMarketItemById(id);
    if (!item) return false;
    if (item.sellerId !== userId) {
      const user = await this.getUserById(userId);
      if (user?.role !== "super_admin" && user?.role !== "SUPER_ADMIN") {
        return false;
      }
    }
    item.isDeleted = true;
    await this.saveMarketItem(item);
    return true;
  }
  async getMarketOrders(userId) {
    let rows;
    if (userId) {
      rows = this.db.prepare("SELECT data_json FROM market_orders WHERE buyer_id = ? OR seller_id = ? ORDER BY created_at DESC").all(userId, userId);
    } else {
      rows = this.db.prepare("SELECT data_json FROM market_orders ORDER BY created_at DESC").all();
    }
    return rows.map((r) => JSON.parse(r.data_json));
  }
  async saveMarketOrder(order) {
    const json = JSON.stringify(order);
    this.db.prepare(`
      INSERT INTO market_orders (id, item_id, buyer_id, seller_id, status, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        data_json=excluded.data_json
    `).run(order.id, order.itemId, order.buyerId, order.sellerId, order.status, json, order.createdAt);
    return order;
  }
  async updateMarketOrder(id, updates) {
    const row = this.db.prepare("SELECT data_json FROM market_orders WHERE id = ?").get(id);
    if (!row) return null;
    const existing = JSON.parse(row.data_json);
    const merged = { ...existing, ...updates };
    return this.saveMarketOrder(merged);
  }
  // --- Notifications ---
  async getNotifications(userId) {
    const rows = this.db.prepare("SELECT data_json FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100").all(userId);
    return rows.map((r) => JSON.parse(r.data_json));
  }
  async saveNotification(n) {
    const json = JSON.stringify(n);
    this.db.prepare(`
      INSERT INTO notifications (id, user_id, actor_id, type, is_read, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        is_read=excluded.is_read,
        data_json=excluded.data_json
    `).run(n.id, n.userId, n.actorId || "", n.type, n.read ? 1 : 0, json, n.createdAt);
    return n;
  }
  async markNotificationRead(id, userId) {
    const row = this.db.prepare("SELECT data_json FROM notifications WHERE id = ? AND user_id = ?").get(id, userId);
    if (!row) return false;
    const item = JSON.parse(row.data_json);
    item.read = true;
    await this.saveNotification(item);
    return true;
  }
  async markAllNotificationsRead(userId) {
    const list = await this.getNotifications(userId);
    for (const n of list) {
      if (!n.read) {
        n.read = true;
        await this.saveNotification(n);
      }
    }
    return true;
  }
  // --- Applications ---
  async getCreatorApplications() {
    const rows = this.db.prepare("SELECT data_json FROM creator_applications ORDER BY created_at DESC").all();
    return rows.map((r) => JSON.parse(r.data_json));
  }
  async saveCreatorApplication(app) {
    const json = JSON.stringify(app);
    this.db.prepare(`
      INSERT INTO creator_applications (id, user_id, status, data_json, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        data_json=excluded.data_json
    `).run(app.id, app.userId, app.status, json, app.createdAt || app.appliedAt || (/* @__PURE__ */ new Date()).toISOString());
    return app;
  }
  async updateCreatorApplication(id, updates) {
    const row = this.db.prepare("SELECT data_json FROM creator_applications WHERE id = ?").get(id);
    if (!row) return null;
    const existing = JSON.parse(row.data_json);
    const merged = { ...existing, ...updates };
    return this.saveCreatorApplication(merged);
  }
  async getBusinessApplications() {
    const rows = this.db.prepare("SELECT data_json FROM business_applications ORDER BY created_at DESC").all();
    return rows.map((r) => JSON.parse(r.data_json));
  }
  async saveBusinessApplication(app) {
    const json = JSON.stringify(app);
    this.db.prepare(`
      INSERT INTO business_applications (id, user_id, status, data_json, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        data_json=excluded.data_json
    `).run(app.id, app.userId, app.status, json, app.createdAt || app.appliedAt || (/* @__PURE__ */ new Date()).toISOString());
    return app;
  }
  async updateBusinessApplication(id, updates) {
    const row = this.db.prepare("SELECT data_json FROM business_applications WHERE id = ?").get(id);
    if (!row) return null;
    const existing = JSON.parse(row.data_json);
    const merged = { ...existing, ...updates };
    return this.saveBusinessApplication(merged);
  }
  async getCompanyApplications() {
    const rows = this.db.prepare("SELECT data_json FROM company_applications ORDER BY created_at DESC").all();
    return rows.map((r) => JSON.parse(r.data_json));
  }
  async saveCompanyApplication(app) {
    const json = JSON.stringify(app);
    this.db.prepare(`
      INSERT INTO company_applications (id, user_id, status, data_json, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        data_json=excluded.data_json
    `).run(app.id, app.userId, app.status, json, app.createdAt || app.appliedAt || (/* @__PURE__ */ new Date()).toISOString());
    return app;
  }
  async updateCompanyApplication(id, updates) {
    const row = this.db.prepare("SELECT data_json FROM company_applications WHERE id = ?").get(id);
    if (!row) return null;
    const existing = JSON.parse(row.data_json);
    const merged = { ...existing, ...updates };
    return this.saveCompanyApplication(merged);
  }
  // --- Super Admin Global Communication Control ---
  async getGlobalCommunicationSettings() {
    const row = this.db.prepare("SELECT value_json FROM system_kv WHERE key = 'global_comm'").get();
    if (row) {
      const settings2 = JSON.parse(row.value_json);
      if (settings2.temporaryBlock && settings2.temporaryBlock.isActive && settings2.temporaryBlock.endDate) {
        const endMs = new Date(settings2.temporaryBlock.endDate).getTime();
        if (Date.now() >= endMs) {
          settings2.temporaryBlock.isActive = false;
          settings2.allEnabled = true;
          Object.keys(settings2.services).forEach((k) => {
            settings2.services[k] = true;
          });
          await this.setKV("global_comm", settings2);
        }
      }
      return settings2;
    }
    const defaultComm = {
      allEnabled: true,
      services: {
        chat: true,
        voiceCalls: true,
        videoCalls: true,
        groupChat: true,
        messageRequests: true,
        mediaSharing: true
      },
      targetScope: "all",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedBy: "usr_baraka_mabula",
      updatedByName: "Baraka Mabula (Super Admin)"
    };
    await this.setKV("global_comm", defaultComm);
    return defaultComm;
  }
  async updateGlobalCommunicationSettings(settings2, actorId, actorName) {
    const current = await this.getGlobalCommunicationSettings();
    const updated = {
      ...current,
      ...settings2,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedBy: actorId,
      updatedByName: actorName
    };
    await this.setKV("global_comm", updated);
    await this.addAuditLog({
      actorId,
      actorName,
      actorRole: "SUPER_ADMIN",
      action: "GLOBAL_COMMUNICATION_UPDATED",
      target: "COMMUNICATION_POLICY",
      details: `Updated communication policy: AllEnabled=${updated.allEnabled}, Services=${JSON.stringify(updated.services)}, BlockReason=${updated.temporaryBlock?.reason || "None"}`
    });
    return updated;
  }
  async isCommunicationServiceAllowed(service, userRole) {
    if (userRole === "super_admin" || userRole === "SUPER_ADMIN") {
      return { allowed: true };
    }
    const settings2 = await this.getGlobalCommunicationSettings();
    if (!settings2.allEnabled) {
      return {
        allowed: false,
        reason: settings2.temporaryBlock?.reason || "\u{1F512} Mawasiliano yamefungwa kwa muda. Super Admin amesitisha huduma hii kwa muda. Tafadhali jaribu tena baada ya huduma kufunguliwa."
      };
    }
    if (settings2.services && settings2.services[service] === false) {
      const serviceNames = {
        chat: "Ujumbe (Chat)",
        voiceCalls: "Simu za Sauti (Voice Calls)",
        videoCalls: "Simu za Video (Video Calls)",
        groupChat: "Makundi (Group Chat)",
        messageRequests: "Maombi ya Ujumbe (Message Requests)",
        mediaSharing: "Kutuma Faili & Picha (Media Sharing)"
      };
      return {
        allowed: false,
        reason: settings2.temporaryBlock?.reason || `\u{1F512} Mawasiliano ya ${serviceNames[service] || service} yamefungwa kwa muda na Super Admin.`
      };
    }
    return { allowed: true };
  }
  // --- Real Database Daily Reports ---
  async generateDailyReport(period, customRange) {
    const now = /* @__PURE__ */ new Date();
    let startMs = 0;
    let endMs = now.getTime();
    if (period === "today") {
      startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    } else if (period === "yesterday") {
      startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
      endMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    } else if (period === "7days") {
      startMs = now.getTime() - 7 * 864e5;
    } else if (period === "30days") {
      startMs = now.getTime() - 30 * 864e5;
    } else if (period === "custom" && customRange) {
      startMs = new Date(customRange.start).getTime() || 0;
      endMs = new Date(customRange.end).getTime() || now.getTime();
    }
    const inWindow = (dateStr) => {
      const ms = new Date(dateStr).getTime();
      return ms >= startMs && ms <= endMs;
    };
    const users2 = await this.getUsers();
    const posts = await this.getPosts();
    const comments = await this.getComments();
    const market = await this.getMarketItems();
    const transactions = await this.getAllTransactions();
    const campaigns = await this.getAdCampaigns();
    const refunds = await this.getRefunds();
    const auditLogs2 = await this.getAuditLogs();
    const commSettings = await this.getGlobalCommunicationSettings();
    const msgRows = this.db.prepare("SELECT data_json FROM messages WHERE is_deleted = 0").all();
    const messages = msgRows.map((r) => JSON.parse(r.data_json));
    const windowUsers = users2.filter((u) => inWindow(u.createdAt));
    const activeUsers = users2.filter((u) => u.isOnline || u.createdAt && inWindow(u.createdAt)).length || users2.length;
    const suspendedUsers = users2.filter((u) => u.isSuspended).length;
    const windowPosts = posts.filter((p) => inWindow(p.createdAt));
    const videosCount = windowPosts.filter((p) => p.mediaType === "video").length;
    const clipsCount = windowPosts.filter((p) => p.mediaType === "clip").length;
    const windowComments = comments.filter((c) => inWindow(c.createdAt));
    const windowMessages = messages.filter((m) => inWindow(m.createdAt));
    let totalLikes = 0;
    let totalShares = 0;
    posts.forEach((p) => {
      if (inWindow(p.createdAt)) {
        totalLikes += Object.keys(p.reactions || {}).length;
        totalShares += p.sharesCount || 0;
      }
    });
    const windowMarket = market.filter((m) => inWindow(m.createdAt));
    const windowTx = transactions.filter((t) => inWindow(t.createdAt));
    let rvcPurchased = 0;
    let rvcUsed = 0;
    windowTx.forEach((t) => {
      if (t.type === "topup" || t.amount > 0) {
        rvcPurchased += t.amount;
      } else if (t.amount < 0) {
        rvcUsed += Math.abs(t.amount);
      }
    });
    const windowCampaigns = campaigns.filter((c) => inWindow(c.createdAt));
    let viralRevenue = 0;
    let premiumRevenue = 0;
    let adsRevenue = 0;
    windowCampaigns.forEach((c) => {
      adsRevenue += c.totalBudgetRvc || 0;
    });
    const windowRefunds = refunds.filter((r) => inWindow(r.requestedAt));
    let refundsApprovedCount = 0;
    let refundsAmountTotal = 0;
    windowRefunds.forEach((r) => {
      if (r.status === "completed") {
        refundsApprovedCount++;
        refundsAmountTotal += r.amountRvc;
      }
    });
    const securityEventsCount = auditLogs2.filter(
      (l) => inWindow(l.timestamp) && (l.action.includes("BLOCK") || l.action.includes("SUSPEND") || l.action.includes("SECURITY"))
    ).length;
    const adminActCount = auditLogs2.filter((l) => inWindow(l.timestamp)).length;
    return {
      id: `report_${Date.now()}`,
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      period,
      newUsers: windowUsers.length,
      activeUsers,
      suspendedUsers,
      logins: 0,
      failedLogins: 0,
      friendRequests: 0,
      newFriends: 0,
      videos: videosCount,
      clips: clipsCount,
      liveSessions: 0,
      likes: totalLikes,
      comments: windowComments.length,
      shares: totalShares,
      marketOrders: 0,
      marketSalesRvc: 0,
      rvcTransactions: 0,
      rvcPurchasedRvc: rvcPurchased,
      rvcUsedRvc: rvcUsed,
      pushViralCampaigns: campaigns.length,
      premiumPurchases: 0,
      creatorActivity: 0,
      creatorEarningsRvc: 0,
      businessActivity: 0,
      companyActivity: 0,
      reportsComplaints: 0,
      adminActivity: adminActCount,
      adminActivityCount: adminActCount,
      companyRevenueRvc: adsRevenue + viralRevenue + premiumRevenue,
      refundsRvc: refundsAmountTotal,
      netRevenueRvc: adsRevenue + viralRevenue + premiumRevenue - refundsAmountTotal,
      users: {
        total: users2.length,
        newRegistered: windowUsers.length,
        active: activeUsers,
        suspended: suspendedUsers
      },
      posts: posts.length,
      postsSummary: {
        total: posts.length,
        newPosts: windowPosts.length,
        videos: videosCount,
        clips: clipsCount,
        likes: totalLikes,
        shares: totalShares,
        comments: windowComments.length
      },
      messages: windowMessages.length,
      messagesSummary: {
        totalSent: windowMessages.length
      },
      market: {
        totalItems: market.length,
        newItems: windowMarket.length,
        orders: 0
      },
      rvc: {
        totalPurchased: rvcPurchased,
        totalUsed: rvcUsed,
        netCirculation: rvcPurchased - rvcUsed
      },
      campaigns: {
        activeOfficialAds: windowCampaigns.length,
        totalSponsoredPosts: campaigns.length,
        impressionsDelivered: 0
      },
      revenue: {
        totalTzs: adsRevenue + viralRevenue + premiumRevenue,
        adsRevenueTzs: adsRevenue,
        commissionTzs: 0,
        rvcDepositsTzs: rvcPurchased
      },
      refunds: {
        requestsCount: windowRefunds.length,
        approvedCount: refundsApprovedCount,
        rejectedCount: windowRefunds.length - refundsApprovedCount,
        amountTotal: refundsAmountTotal
      },
      securityEvents: securityEventsCount,
      communicationControl: {
        isCommunicationActive: commSettings.allEnabled,
        chatEnabled: commSettings.services.chat,
        voiceCallsEnabled: commSettings.services.voiceCalls,
        videoCallsEnabled: commSettings.services.videoCalls,
        mediaSharingEnabled: commSettings.services.mediaSharing,
        temporaryBlockActive: commSettings.temporaryBlock?.isActive || false,
        temporaryBlockReason: commSettings.temporaryBlock?.reason || void 0,
        temporaryBlockEndDate: commSettings.temporaryBlock?.endDate || void 0
      }
    };
  }
  // --- Persistence & KV Helper ---
  async setKV(key, value) {
    const json = JSON.stringify(value);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare(`
      INSERT INTO system_kv (key, value_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value_json=excluded.value_json,
        updated_at=excluded.updated_at
    `).run(key, json, now);
  }
  async getPersistenceStatus() {
    const usersCount = this.db.prepare("SELECT COUNT(*) as c FROM users").get().c;
    const postsCount = this.db.prepare("SELECT COUNT(*) as c FROM posts").get().c;
    const messagesCount = this.db.prepare("SELECT COUNT(*) as c FROM messages").get().c;
    const txCount = this.db.prepare("SELECT COUNT(*) as c FROM wallet_transactions").get().c;
    const campaignsCount = this.db.prepare("SELECT COUNT(*) as c FROM ad_campaigns").get().c;
    const refundsCount = this.db.prepare("SELECT COUNT(*) as c FROM refund_records").get().c;
    const auditLogsCount = this.db.prepare("SELECT COUNT(*) as c FROM audit_logs").get().c;
    const stat = import_fs3.default.statSync(this.dbPath);
    return {
      activeDataStore: "sqlite",
      dbStatus: "PASS",
      persistenceFilePath: this.dbPath,
      externalGatewayStatus: "ACTIVE",
      totalUsers: usersCount,
      totalTransactions: txCount,
      totalCampaigns: campaignsCount,
      totalRefunds: refundsCount,
      totalAuditLogs: auditLogsCount,
      engine: "SqliteProductionDataStore (ACID WAL Persistence)",
      filePath: this.dbPath,
      fileSizeBytes: stat.size,
      lastPersistedAt: stat.mtime.toISOString(),
      entitiesCount: {
        users: usersCount,
        transactions: txCount,
        adCampaigns: campaignsCount,
        companyLedger: this.db.prepare("SELECT COUNT(*) as c FROM company_ledger").get().c,
        refunds: refundsCount,
        rvcRequests: this.db.prepare("SELECT COUNT(*) as c FROM rvc_requests").get().c,
        auditLogs: auditLogsCount,
        messages: messagesCount,
        conversations: this.db.prepare("SELECT COUNT(*) as c FROM conversations").get().c,
        messageRequests: this.db.prepare("SELECT COUNT(*) as c FROM message_requests").get().c,
        callSessions: this.db.prepare("SELECT COUNT(*) as c FROM call_sessions").get().c,
        posts: postsCount,
        marketItems: this.db.prepare("SELECT COUNT(*) as c FROM market_items").get().c
      },
      syncIntervalMs: 0,
      isHealthy: true
    };
  }
  async flush() {
    this.db.exec("PRAGMA wal_checkpoint(PASSIVE);");
  }
  async listBackups() {
    const backupDir = import_path3.default.join(import_path3.default.dirname(this.dbPath), "backups");
    if (!import_fs3.default.existsSync(backupDir)) return [];
    const files2 = import_fs3.default.readdirSync(backupDir).filter((f) => f.endsWith(".json") || f.endsWith(".sqlite"));
    return files2.map((filename) => {
      const filePath = import_path3.default.join(backupDir, filename);
      const stat = import_fs3.default.statSync(filePath);
      return {
        filename,
        size: stat.size,
        createdAt: stat.birthtime.toISOString(),
        path: filePath
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async createBackup(reason = "manual_super_admin") {
    const backupDir = import_path3.default.join(import_path3.default.dirname(this.dbPath), "backups");
    if (!import_fs3.default.existsSync(backupDir)) {
      import_fs3.default.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const backupFileName = `ravini_production_backup_${timestamp2}.sqlite`;
    const backupPath = import_path3.default.join(backupDir, backupFileName);
    import_fs3.default.copyFileSync(this.dbPath, backupPath);
    return { backupPath, timestamp: timestamp2 };
  }
};

// server/db/fileDataStore.ts
var DEFAULT_SUPER_ADMIN = {
  id: "usr_baraka_mabula",
  name: "Baraka Mabula",
  username: "255748604483",
  email: "barakamabula82@gmail.com",
  phone: "255748604483",
  password: hashPassword("1234"),
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  coverPhoto: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80",
  bio: "Mwanzilishi & Msimamizi Mkuu (Super Admin) wa RAVINI COMPANY LIMITED. Full Controller System. Karibuni sana kwenye mtandao mkuu wa kijamii wa Kitanzania! \u{1F1F9}\u{1F1FF}\u{1F680}",
  location: "Dar es Salaam, Tanzania",
  verified: true,
  role: "MANAGER",
  walletBalance: 0,
  followersCount: 0,
  followingCount: 0,
  createdAt: "2026-01-10T08:00:00.000Z",
  isOnline: true,
  savedPosts: [],
  followingUsers: [],
  creatorApproved: true,
  creatorApplicationStatus: "approved",
  creatorDetails: {
    category: "Teknolojia & Uongozi",
    bio: "Mwanzilishi wa mifumo ya kidijitali na mhariri wa maudhui ya maendeleo.",
    totalReach: 0,
    subscribers: 0
  },
  businessApproved: true,
  businessApplicationStatus: "approved",
  businessDetails: {
    companyName: "RAVINI COMPANY LIMITED",
    category: "Teknolojia & Mawasiliano",
    tin: "144-892-301",
    phone: "+255 748 604 483",
    email: "info@ravini.co.tz",
    address: "Ali Hassan Mwinyi Road, Dar es Salaam",
    description: "Kampuni kuu inayomiliki na kuendesha jukwaa la RAVINI nchini Tanzania.",
    productsCount: 4
  },
  permissions: ["all"],
  mustChangePassword: false,
  accountStatus: "ACTIVE",
  isDisabled: false,
  isSuspended: false
};
var instance = null;
function getDataStore() {
  if (!instance) {
    const sqliteStore = new SqliteProductionDataStore();
    sqliteStore.initialize();
    instance = sqliteStore;
  }
  return instance;
}

// server/services/chatService.ts
var ChatService = class _ChatService {
  static instance = null;
  static getInstance() {
    if (!_ChatService.instance) {
      _ChatService.instance = new _ChatService();
    }
    return _ChatService.instance;
  }
  // --- Authorization & Privacy Checks ---
  async canUserMessageRecipient(senderId, receiverId) {
    const dataStore = getDataStore();
    const isBlocked = await dataStore.isUserBlocked(senderId, receiverId);
    if (isBlocked) {
      return { allowed: false, reason: "BLOCKED_BY_USER" };
    }
    const privacy = await dataStore.getUserPrivacySettings(receiverId);
    if (privacy.whoCanMessageMe === "nobody") {
      return { allowed: false, reason: "RECIPIENT_DOES_NOT_ACCEPT_MESSAGES" };
    }
    const sender = await dataStore.getUserById(senderId);
    const receiver = await dataStore.getUserById(receiverId);
    if (!sender || !receiver) {
      return { allowed: false, reason: "USER_NOT_FOUND" };
    }
    const isFollowingOrFollower = (sender.followingUsers || []).includes(receiverId) || (receiver.followingUsers || []).includes(senderId);
    if (privacy.whoCanMessageMe === "friends_only" && !isFollowingOrFollower) {
      const requests2 = await dataStore.getMessageRequests(receiverId);
      const acceptedReq = requests2.find((r) => r.senderId === senderId && r.status === "accepted");
      if (!acceptedReq) {
        return { allowed: true, requiresRequest: true, reason: "REQUIRES_MESSAGE_REQUEST" };
      }
    }
    return { allowed: true };
  }
  // --- Send Message ---
  async sendMessage(params) {
    const dataStore = getDataStore();
    const sender = await dataStore.getUserById(params.senderId);
    if (!sender) throw new Error("Sender not found");
    const requiredService = params.groupId ? "groupChat" : params.mediaUrl ? "mediaSharing" : "chat";
    const commPerm = await dataStore.isCommunicationServiceAllowed(requiredService, sender.role);
    if (!commPerm.allowed) {
      throw new Error(commPerm.reason || "Huduma ya mawasiliano imezimwa kwa muda na Msimamizi Mkuu.");
    }
    let conv;
    if (params.groupId) {
      const groupConv = await dataStore.getConversationById(params.groupId);
      if (!groupConv) throw new Error("Group conversation not found");
      if (!groupConv.participantIds.includes(params.senderId)) {
        throw new Error("Not a member of this group");
      }
      if (groupConv.onlyAdminsCanPost && !(groupConv.groupAdminIds || []).includes(params.senderId)) {
        throw new Error("Only admins can send messages in this group");
      }
      conv = groupConv;
    } else if (params.conversationId) {
      const existingConv = await dataStore.getConversationById(params.conversationId);
      if (!existingConv) throw new Error("Conversation not found");
      if (!existingConv.participantIds.includes(params.senderId)) {
        throw new Error("Unauthorized conversation access");
      }
      conv = existingConv;
    } else if (params.receiverId) {
      const check = await this.canUserMessageRecipient(params.senderId, params.receiverId);
      if (!check.allowed) {
        throw new Error(check.reason || "Not allowed to message this user");
      }
      conv = await dataStore.getOrCreateDirectConversation(params.senderId, params.receiverId);
      if (check.requiresRequest) {
        const reqId = `req_${params.senderId}_${params.receiverId}`;
        await dataStore.saveMessageRequest({
          id: reqId,
          senderId: params.senderId,
          senderName: sender.name,
          senderAvatar: sender.avatar,
          senderRaviniId: sender.raviniId,
          receiverId: params.receiverId,
          status: "pending",
          initialMessage: params.content,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    } else {
      throw new Error("Missing conversation, receiver, or group target");
    }
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newMsg = {
      id: messageId,
      senderId: params.senderId,
      receiverId: params.receiverId || "",
      conversationId: conv.id,
      groupId: params.groupId,
      content: params.content,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      read: false,
      status: "sent",
      mediaUrl: params.mediaUrl,
      mediaType: params.mediaType,
      mediaName: params.mediaName,
      mediaSize: params.mediaSize,
      location: params.location,
      contact: params.contact,
      replyTo: params.replyTo,
      forwarded: params.forwarded,
      forwardedFrom: params.forwardedFrom,
      idempotencyKey: params.idempotencyKey
    };
    const saved = await dataStore.saveMessage(newMsg);
    const updatedConv = await dataStore.getConversationById(conv.id) || conv;
    return { message: saved, conversation: updatedConv };
  }
  // --- Mark Messages Delivered ---
  async markDelivered(messageId, recipientId) {
    const dataStore = getDataStore();
    const msg = await dataStore.getMessageById(messageId);
    if (!msg || msg.status === "read" || msg.status === "delivered") return msg;
    return await dataStore.updateMessage(messageId, {
      status: "delivered",
      deliveredAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  // --- Mark Messages Read ---
  async markConversationRead(conversationId, readerId) {
    const dataStore = getDataStore();
    const conv = await dataStore.getConversationById(conversationId);
    if (!conv) return { updatedCount: 0, messageIds: [] };
    conv.unreadCounts[readerId] = 0;
    await dataStore.updateConversation(conv.id, { unreadCounts: conv.unreadCounts });
    const messages = await dataStore.getMessages(conversationId);
    const unreadMsgs = messages.filter((m) => m.senderId !== readerId && !m.read);
    const readAt = (/* @__PURE__ */ new Date()).toISOString();
    for (const m of unreadMsgs) {
      await dataStore.updateMessage(m.id, {
        read: true,
        status: "read",
        readAt
      });
    }
    return { updatedCount: unreadMsgs.length, messageIds: unreadMsgs.map((m) => m.id) };
  }
  // --- Group Chat Management ---
  async createGroup(params) {
    const dataStore = getDataStore();
    const creator = await dataStore.getUserById(params.creatorId);
    if (!creator) throw new Error("Creator not found");
    const participantIds = Array.from(/* @__PURE__ */ new Set([params.creatorId, ...params.memberIds]));
    const initialUnreads = {};
    participantIds.forEach((id) => {
      initialUnreads[id] = 0;
    });
    const groupId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const groupConv = {
      id: groupId,
      type: "group",
      participantIds,
      groupName: params.groupName,
      groupDescription: params.groupDescription || "",
      groupPhoto: params.groupPhoto || "",
      groupAdminIds: [params.creatorId],
      groupCreatedBy: params.creatorId,
      onlyAdminsCanPost: !!params.onlyAdminsCanPost,
      unreadCounts: initialUnreads,
      pinnedByUserIds: [],
      archivedByUserIds: [],
      mutedByUserIds: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await dataStore.saveConversation(groupConv);
    const sysMsg = {
      id: `msg_sys_${Date.now()}`,
      senderId: "system",
      receiverId: "",
      conversationId: groupId,
      groupId,
      content: `${creator.name} aliunda kundi "${params.groupName}"`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      read: true,
      status: "delivered"
    };
    await dataStore.saveMessage(sysMsg);
    return groupConv;
  }
  async addGroupMembers(groupId, actorId, memberIdsToAdd) {
    const dataStore = getDataStore();
    const group = await dataStore.getConversationById(groupId);
    if (!group || group.type !== "group") throw new Error("Group not found");
    if (!(group.groupAdminIds || []).includes(actorId) && !group.participantIds.includes(actorId)) {
      throw new Error("Not authorized to add members to this group");
    }
    const updatedParticipants = Array.from(/* @__PURE__ */ new Set([...group.participantIds, ...memberIdsToAdd]));
    for (const id of memberIdsToAdd) {
      if (group.unreadCounts[id] === void 0) {
        group.unreadCounts[id] = 0;
      }
    }
    const updated = await dataStore.updateConversation(groupId, {
      participantIds: updatedParticipants,
      unreadCounts: group.unreadCounts
    });
    if (!updated) throw new Error("Failed to update group");
    return updated;
  }
  async removeGroupMember(groupId, actorId, memberIdToRemove) {
    const dataStore = getDataStore();
    const group = await dataStore.getConversationById(groupId);
    if (!group || group.type !== "group") throw new Error("Group not found");
    const isAdmin = (group.groupAdminIds || []).includes(actorId);
    const isSelfLeave = actorId === memberIdToRemove;
    if (!isAdmin && !isSelfLeave) {
      throw new Error("Only admins can remove members from this group");
    }
    const updatedParticipants = group.participantIds.filter((id) => id !== memberIdToRemove);
    const updatedAdmins = (group.groupAdminIds || []).filter((id) => id !== memberIdToRemove);
    const updated = await dataStore.updateConversation(groupId, {
      participantIds: updatedParticipants,
      groupAdminIds: updatedAdmins.length > 0 ? updatedAdmins : updatedParticipants.length > 0 ? [updatedParticipants[0]] : []
    });
    if (!updated) throw new Error("Failed to update group");
    return updated;
  }
};
var chatService = ChatService.getInstance();

// server/realtime/chatSocketServer.ts
var ChatSocketServer = class _ChatSocketServer {
  static instance = null;
  wss = null;
  userSockets = /* @__PURE__ */ new Map();
  heartbeatInterval = null;
  static getInstance() {
    if (!_ChatSocketServer.instance) {
      _ChatSocketServer.instance = new _ChatSocketServer();
    }
    return _ChatSocketServer.instance;
  }
  initialize(httpServer) {
    this.wss = new import_ws.WebSocketServer({
      server: httpServer,
      path: "/ws"
    });
    console.log("[RAVINI Realtime] WebSocket Server mounted at /ws on port 3000");
    this.wss.on("connection", (ws, req) => {
      ws.isAlive = true;
      const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
      const queryUserId = url.searchParams.get("userId");
      if (queryUserId) {
        this.registerUserSocket(queryUserId, ws);
      }
      ws.on("pong", () => {
        ws.isAlive = true;
      });
      ws.on("message", async (data) => {
        try {
          const payload = JSON.parse(data.toString());
          await this.handleClientMessage(ws, payload);
        } catch (err) {
          ws.send(JSON.stringify({
            type: "error",
            message: "Invalid message payload",
            error: err.message
          }));
        }
      });
      ws.on("close", () => {
        if (ws.userId) {
          this.removeUserSocket(ws.userId, ws);
        }
      });
      ws.on("error", (err) => {
        console.error("[RAVINI Realtime] Socket error:", err.message);
      });
    });
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((client) => {
        const authWs = client;
        if (authWs.isAlive === false) {
          return authWs.terminate();
        }
        authWs.isAlive = false;
        authWs.ping();
      });
    }, 3e4);
  }
  // --- Socket Registration & User Presence ---
  registerUserSocket(userId, ws) {
    ws.userId = userId;
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, /* @__PURE__ */ new Set());
    }
    this.userSockets.get(userId).add(ws);
    ws.send(JSON.stringify({
      type: "auth_success",
      userId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }));
    this.broadcastPresence(userId, true);
  }
  removeUserSocket(userId, ws) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(ws);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        this.broadcastPresence(userId, false);
      }
    }
  }
  async broadcastPresence(userId, isOnline) {
    const dataStore = getDataStore();
    const privacy = await dataStore.getUserPrivacySettings(userId);
    if (!privacy.showOnlineStatus && isOnline) return;
    const payload = JSON.stringify({
      type: "presence_update",
      userId,
      isOnline,
      lastSeen: (/* @__PURE__ */ new Date()).toISOString()
    });
    const convs = await dataStore.getConversations(userId);
    const peerIds = /* @__PURE__ */ new Set();
    convs.forEach((c) => {
      c.participantIds.forEach((pid) => {
        if (pid !== userId) peerIds.add(pid);
      });
    });
    peerIds.forEach((pid) => {
      this.sendToUser(pid, payload);
    });
  }
  // --- Message Handling ---
  async handleClientMessage(ws, payload) {
    const dataStore = getDataStore();
    switch (payload.type) {
      // 1. Authenticate Socket
      case "auth": {
        const { userId } = payload;
        if (!userId) {
          return ws.send(JSON.stringify({ type: "error", message: "Missing userId for auth" }));
        }
        const user = await dataStore.getUserById(userId);
        if (!user) {
          return ws.send(JSON.stringify({ type: "error", message: "User not found or revoked" }));
        }
        this.registerUserSocket(userId, ws);
        break;
      }
      // 2. Set Active Conversation (for auto-mark read)
      case "set_active_conversation": {
        ws.activeConversationId = payload.conversationId;
        if (payload.conversationId && ws.userId) {
          await chatService.markConversationRead(payload.conversationId, ws.userId);
        }
        break;
      }
      // 3. Send Message
      case "send_message": {
        if (!ws.userId) {
          return ws.send(JSON.stringify({ type: "error", message: "Unauthenticated socket" }));
        }
        try {
          const result = await chatService.sendMessage({
            senderId: ws.userId,
            receiverId: payload.receiverId,
            conversationId: payload.conversationId,
            groupId: payload.groupId,
            content: payload.content || "",
            mediaUrl: payload.mediaUrl,
            mediaType: payload.mediaType,
            mediaName: payload.mediaName,
            mediaSize: payload.mediaSize,
            location: payload.location,
            contact: payload.contact,
            replyTo: payload.replyTo,
            forwarded: payload.forwarded,
            forwardedFrom: payload.forwardedFrom,
            idempotencyKey: payload.idempotencyKey
          });
          ws.send(JSON.stringify({
            type: "message_sent",
            message: result.message,
            conversation: result.conversation,
            tempId: payload.tempId
          }));
          const recipients = result.conversation.participantIds.filter((id) => id !== ws.userId);
          let anyRecipientOnline = false;
          for (const recipientId of recipients) {
            const delivered = this.sendToUser(recipientId, JSON.stringify({
              type: "new_message",
              message: result.message,
              conversation: result.conversation
            }));
            if (delivered) {
              anyRecipientOnline = true;
              await chatService.markDelivered(result.message.id, recipientId);
            }
          }
          if (anyRecipientOnline) {
            ws.send(JSON.stringify({
              type: "message_delivered",
              messageId: result.message.id,
              deliveredAt: (/* @__PURE__ */ new Date()).toISOString()
            }));
          }
        } catch (err) {
          ws.send(JSON.stringify({
            type: "message_failed",
            tempId: payload.tempId,
            error: err.message
          }));
        }
        break;
      }
      // 4. Message Delivered Ack from Client
      case "message_delivered_ack": {
        if (!ws.userId || !payload.messageId) return;
        const updated = await chatService.markDelivered(payload.messageId, ws.userId);
        if (updated && updated.senderId) {
          this.sendToUser(updated.senderId, JSON.stringify({
            type: "message_delivered",
            messageId: updated.id,
            deliveredAt: updated.deliveredAt
          }));
        }
        break;
      }
      // 5. Message Read
      case "mark_read": {
        if (!ws.userId || !payload.conversationId) return;
        const { updatedCount, messageIds } = await chatService.markConversationRead(payload.conversationId, ws.userId);
        const conv = await dataStore.getConversationById(payload.conversationId);
        if (conv) {
          const peers = conv.participantIds.filter((id) => id !== ws.userId);
          peers.forEach((peerId) => {
            this.sendToUser(peerId, JSON.stringify({
              type: "messages_read",
              conversationId: payload.conversationId,
              readerId: ws.userId,
              messageIds,
              readAt: (/* @__PURE__ */ new Date()).toISOString()
            }));
          });
        }
        break;
      }
      // 6. Typing Indicators
      case "typing_start":
      case "typing_stop": {
        if (!ws.userId || !payload.conversationId) return;
        const conv = await dataStore.getConversationById(payload.conversationId);
        if (!conv) return;
        const sender = await dataStore.getUserById(ws.userId);
        const typingPayload = JSON.stringify({
          type: payload.type,
          conversationId: payload.conversationId,
          userId: ws.userId,
          userName: sender?.name || "Mtumiaji"
        });
        conv.participantIds.filter((id) => id !== ws.userId).forEach((peerId) => {
          this.sendToUser(peerId, typingPayload);
        });
        break;
      }
      // 7. Message Reactions
      case "reaction": {
        if (!ws.userId || !payload.messageId || !payload.emoji) return;
        const msg = await dataStore.getMessageById(payload.messageId);
        if (!msg) return;
        msg.reactions = msg.reactions || {};
        const emojiList = msg.reactions[payload.emoji] || [];
        const userIdx = emojiList.indexOf(ws.userId);
        if (userIdx >= 0) {
          emojiList.splice(userIdx, 1);
        } else {
          emojiList.push(ws.userId);
        }
        if (emojiList.length === 0) {
          delete msg.reactions[payload.emoji];
        } else {
          msg.reactions[payload.emoji] = emojiList;
        }
        await dataStore.updateMessage(msg.id, { reactions: msg.reactions });
        const conv = msg.conversationId ? await dataStore.getConversationById(msg.conversationId) : null;
        const participants = conv ? conv.participantIds : [msg.senderId, msg.receiverId];
        const reactionEvent = JSON.stringify({
          type: "message_reaction_updated",
          messageId: msg.id,
          conversationId: msg.conversationId,
          reactions: msg.reactions,
          actorId: ws.userId
        });
        participants.forEach((pid) => {
          this.sendToUser(pid, reactionEvent);
        });
        break;
      }
      // 8. Edit Message
      case "edit_message": {
        if (!ws.userId || !payload.messageId || !payload.newContent) return;
        const msg = await dataStore.getMessageById(payload.messageId);
        if (!msg || msg.senderId !== ws.userId) {
          return ws.send(JSON.stringify({ type: "error", message: "Huwezi kuhariri ujumbe huu" }));
        }
        const updated = await dataStore.updateMessage(msg.id, {
          content: payload.newContent,
          isEdited: true,
          editedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        if (updated) {
          const conv = updated.conversationId ? await dataStore.getConversationById(updated.conversationId) : null;
          const participants = conv ? conv.participantIds : [updated.senderId, updated.receiverId];
          const editEvent = JSON.stringify({
            type: "message_edited",
            message: updated
          });
          participants.forEach((pid) => {
            this.sendToUser(pid, editEvent);
          });
        }
        break;
      }
      // 9. Delete Message
      case "delete_message": {
        if (!ws.userId || !payload.messageId) return;
        const msg = await dataStore.getMessageById(payload.messageId);
        if (!msg) return;
        let allowed = msg.senderId === ws.userId;
        if (!allowed && msg.conversationId) {
          const conv2 = await dataStore.getConversationById(msg.conversationId);
          if (conv2 && (conv2.groupAdminIds || []).includes(ws.userId)) {
            allowed = true;
          }
        }
        if (!allowed) {
          return ws.send(JSON.stringify({ type: "error", message: "Huna ruhusa ya kufuta ujumbe huu" }));
        }
        await dataStore.deleteMessage(msg.id, ws.userId, !!payload.forEveryone);
        const conv = msg.conversationId ? await dataStore.getConversationById(msg.conversationId) : null;
        const participants = conv ? conv.participantIds : [msg.senderId, msg.receiverId];
        const deleteEvent = JSON.stringify({
          type: "message_deleted",
          messageId: msg.id,
          conversationId: msg.conversationId,
          forEveryone: !!payload.forEveryone,
          deletedBy: ws.userId
        });
        participants.forEach((pid) => {
          this.sendToUser(pid, deleteEvent);
        });
        break;
      }
      // 10. WebRTC Voice / Video Call Signaling
      case "call_initiate": {
        if (!ws.userId || !payload.receiverId || !payload.callType) return;
        const caller = await dataStore.getUserById(ws.userId);
        const receiver = await dataStore.getUserById(payload.receiverId);
        if (!caller || !receiver) return;
        const callService = payload.callType === "video" ? "videoCalls" : "voiceCalls";
        const commPerm = await dataStore.isCommunicationServiceAllowed(callService, caller.role);
        if (!commPerm.allowed) {
          return ws.send(JSON.stringify({
            type: "call_failed",
            reason: commPerm.reason || "Huduma ya simu imezimwa kwa muda na Msimamizi Mkuu."
          }));
        }
        const isBlocked = await dataStore.isUserBlocked(ws.userId, payload.receiverId);
        if (isBlocked) {
          return ws.send(JSON.stringify({
            type: "call_failed",
            reason: "Mtumiaji huyu amekuzuia au amezuiliwa."
          }));
        }
        const sessionId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const turnConfigured = !!(process.env.TURN_SERVER_URL && process.env.TURN_CREDENTIAL);
        const callSession = {
          id: sessionId,
          type: payload.callType,
          callerId: ws.userId,
          callerName: caller.name,
          callerAvatar: caller.avatar,
          receiverId: payload.receiverId,
          receiverName: receiver.name,
          receiverAvatar: receiver.avatar,
          status: "ringing",
          startedAt: (/* @__PURE__ */ new Date()).toISOString(),
          stunTurnConfigured: turnConfigured
        };
        await dataStore.saveCallSession(callSession);
        ws.send(JSON.stringify({
          type: "call_ringing",
          session: callSession,
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            ...turnConfigured ? [{ urls: process.env.TURN_SERVER_URL, credential: process.env.TURN_CREDENTIAL }] : []
          ]
        }));
        const delivered = this.sendToUser(payload.receiverId, JSON.stringify({
          type: "incoming_call",
          session: callSession,
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            ...turnConfigured ? [{ urls: process.env.TURN_SERVER_URL, credential: process.env.TURN_CREDENTIAL }] : []
          ]
        }));
        if (!delivered) {
          setTimeout(async () => {
            const current = (await dataStore.getCallSessions(ws.userId)).find((s) => s.id === sessionId);
            if (current && current.status === "ringing") {
              await dataStore.updateCallSession(sessionId, { status: "missed" });
              ws.send(JSON.stringify({
                type: "call_missed",
                sessionId,
                reason: "Mtumiaji hajapatikana"
              }));
            }
          }, 15e3);
        }
        break;
      }
      case "call_accept": {
        if (!ws.userId || !payload.sessionId) return;
        const dataStore2 = getDataStore();
        const session = (await dataStore2.getCallSessions(ws.userId)).find((s) => s.id === payload.sessionId);
        if (!session) return;
        const updated = await dataStore2.updateCallSession(payload.sessionId, {
          status: "connected",
          connectedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        this.sendToUser(session.callerId, JSON.stringify({
          type: "call_accepted",
          session: updated
        }));
        break;
      }
      case "call_decline": {
        if (!ws.userId || !payload.sessionId) return;
        const session = (await dataStore.getCallSessions(ws.userId)).find((s) => s.id === payload.sessionId);
        if (!session) return;
        await dataStore.updateCallSession(payload.sessionId, {
          status: "declined",
          endedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        this.sendToUser(session.callerId, JSON.stringify({
          type: "call_declined",
          sessionId: payload.sessionId
        }));
        break;
      }
      case "call_end": {
        if (!ws.userId || !payload.sessionId) return;
        const session = (await dataStore.getCallSessions(ws.userId)).find((s) => s.id === payload.sessionId);
        if (!session) return;
        const endedAt = (/* @__PURE__ */ new Date()).toISOString();
        let durationSeconds = 0;
        if (session.connectedAt) {
          durationSeconds = Math.round((new Date(endedAt).getTime() - new Date(session.connectedAt).getTime()) / 1e3);
        }
        await dataStore.updateCallSession(payload.sessionId, {
          status: "ended",
          endedAt,
          durationSeconds
        });
        const peerId = session.callerId === ws.userId ? session.receiverId : session.callerId;
        this.sendToUser(peerId, JSON.stringify({
          type: "call_ended",
          sessionId: payload.sessionId,
          durationSeconds
        }));
        break;
      }
      // 11. WebRTC Signaling Dispatch (offer, answer, candidate)
      case "webrtc_signal": {
        if (!ws.userId || !payload.targetUserId || !payload.data) return;
        this.sendToUser(payload.targetUserId, JSON.stringify({
          type: "webrtc_signal",
          senderUserId: ws.userId,
          sessionId: payload.sessionId,
          data: payload.data
        }));
        break;
      }
      // 12. Reconnect Sync
      case "sync_missed_messages": {
        if (!ws.userId) return;
        const sinceTimestamp = payload.sinceTimestamp || (/* @__PURE__ */ new Date(0)).toISOString();
        const convs = await dataStore.getConversations(ws.userId);
        let allNewMessages = [];
        for (const c of convs) {
          const msgs = await dataStore.getMessages(c.id);
          const filtered = msgs.filter((m) => new Date(m.createdAt).getTime() > new Date(sinceTimestamp).getTime());
          allNewMessages.push(...filtered);
        }
        ws.send(JSON.stringify({
          type: "sync_missed_messages_response",
          messages: allNewMessages,
          conversations: convs,
          syncedAt: (/* @__PURE__ */ new Date()).toISOString()
        }));
        break;
      }
      default:
        console.warn("[RAVINI Realtime] Unknown event type:", payload.type);
    }
  }
  // --- Send to User Helper ---
  sendToUser(userId, data) {
    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) return false;
    let sent = false;
    sockets.forEach((ws) => {
      if (ws.readyState === import_ws.WebSocket.OPEN) {
        ws.send(data);
        sent = true;
      }
    });
    return sent;
  }
  broadcastAll(eventPayload) {
    const raw = typeof eventPayload === "string" ? eventPayload : JSON.stringify(eventPayload);
    if (!this.wss) return;
    this.wss.clients.forEach((client) => {
      if (client.readyState === import_ws.WebSocket.OPEN) {
        client.send(raw);
      }
    });
  }
  broadcastToUsers(userIds, eventPayload) {
    const raw = typeof eventPayload === "string" ? eventPayload : JSON.stringify(eventPayload);
    userIds.forEach((uid) => this.sendToUser(uid, raw));
  }
  disconnectUser(userId, reason) {
    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) return false;
    const payload = JSON.stringify({
      type: "FORCE_LOGOUT",
      userId,
      reason: reason || "Msimamizi Mkuu amekatisha kipindi hiki.",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    sockets.forEach((ws) => {
      try {
        if (ws.readyState === import_ws.WebSocket.OPEN) {
          ws.send(payload);
          ws.close(4001, reason || "Session terminated");
        }
      } catch (e) {
        console.warn("Error closing socket for user", userId, e);
      }
    });
    this.userSockets.delete(userId);
    this.broadcastPresence(userId, false);
    return true;
  }
  disconnectAllExcept(exemptUserId, reason) {
    let count = 0;
    const payload = JSON.stringify({
      type: "FORCE_LOGOUT",
      reason: reason || "Msimamizi Mkuu amefunga vipindi vyote vya mfumo.",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.userSockets.forEach((sockets, uid) => {
      if (exemptUserId && uid === exemptUserId) return;
      sockets.forEach((ws) => {
        try {
          if (ws.readyState === import_ws.WebSocket.OPEN) {
            ws.send(payload);
            ws.close(4001, reason || "System-wide session reset");
          }
        } catch (e) {
          console.warn("Error closing socket for user", uid, e);
        }
      });
      this.userSockets.delete(uid);
      this.broadcastPresence(uid, false);
      count++;
    });
    return count;
  }
  isUserOnline(userId) {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }
  sendPushNotification(userId, notification) {
    const sockets = this.userSockets.get(userId);
    const payload = JSON.stringify({
      type: "PUSH_NOTIFICATION",
      notification: {
        id: notification.id || `push_${Date.now()}`,
        title: notification.title,
        message: notification.message,
        body: notification.message,
        type: notification.type || "SYSTEM",
        url: notification.url || "/",
        relatedId: notification.relatedId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    if (sockets && sockets.size > 0) {
      sockets.forEach((ws) => {
        if (ws.readyState === import_ws.WebSocket.OPEN) {
          ws.send(payload);
        }
      });
    }
  }
  broadcastPushNotification(notification) {
    if (!this.wss) return;
    const payload = JSON.stringify({
      type: "PUSH_NOTIFICATION",
      notification: {
        id: `push_broadcast_${Date.now()}`,
        title: notification.title,
        message: notification.message,
        body: notification.message,
        type: notification.type || "ANNOUNCEMENT",
        url: notification.url || "/",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    this.wss.clients.forEach((client) => {
      if (client.readyState === import_ws.WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
};
var chatSocketServer = ChatSocketServer.getInstance();

// server.ts
async function startServer() {
  const app = (0, import_express2.default)();
  const PORT = 3e3;
  const server = import_http.default.createServer(app);
  app.use((0, import_cors.default)());
  app.use(import_express2.default.json({ limit: "50mb" }));
  app.use(import_express2.default.urlencoded({ extended: true, limit: "50mb" }));
  const nmyDb = getNmyDb();
  await nmyDb.initialize();
  console.log("[NIDA MITANDAO YOTE] Authoritative Database Initialized: Cloud SQL PostgreSQL (Europe-West2)");
  nmyDb.checkAndExpireTimedOutRequests().catch(() => {
  });
  setInterval(() => {
    nmyDb.checkAndExpireTimedOutRequests().catch((err) => console.error("[EXPIRE CHECK ERROR]:", err));
  }, 3e4);
  chatSocketServer.initialize(server);
  const uploadsPath = import_path4.default.join(process.cwd(), "data", "uploads");
  if (!import_fs4.default.existsSync(uploadsPath)) {
    import_fs4.default.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use("/data/uploads", (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }
    const relativeSubPath = decodeURIComponent(req.path.replace(/^\//, ""));
    const safeFilePath = import_path4.default.normalize(import_path4.default.join(uploadsPath, relativeSubPath));
    if (!safeFilePath.startsWith(uploadsPath)) {
      return res.status(403).json({ error: "Access denied" });
    }
    if (!import_fs4.default.existsSync(safeFilePath)) {
      return next();
    }
    try {
      const stat = import_fs4.default.statSync(safeFilePath);
      if (!stat.isFile()) {
        return next();
      }
      const ext = import_path4.default.extname(safeFilePath).toLowerCase();
      const mediaMimeTypes = {
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mov": "video/quicktime",
        ".ogg": "video/ogg",
        ".ogv": "video/ogg",
        ".m4v": "video/mp4",
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".m4a": "audio/mp4",
        ".aac": "audio/aac",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp"
      };
      const contentType = mediaMimeTypes[ext] || "application/octet-stream";
      const fileSize = stat.size;
      const range = req.headers.range;
      if (range && (ext.startsWith(".mp") || ext === ".webm" || ext === ".mov" || ext === ".ogg" || ext === ".wav" || ext === ".m4v")) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        if (isNaN(start) || start >= fileSize) {
          res.status(416).set("Content-Range", `bytes */${fileSize}`).end();
          return;
        }
        const validEnd = Math.min(end, fileSize - 1);
        const chunkSize = validEnd - start + 1;
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${validEnd}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400"
        });
        if (req.method === "HEAD") {
          return res.end();
        }
        const stream2 = import_fs4.default.createReadStream(safeFilePath, { start, end: validEnd });
        stream2.pipe(res);
        return;
      }
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400"
      });
      if (req.method === "HEAD") {
        return res.end();
      }
      const stream = import_fs4.default.createReadStream(safeFilePath);
      stream.pipe(res);
    } catch (streamErr) {
      console.error("[RAVINI Media Stream Error]:", streamErr);
      next();
    }
  });
  app.use("/data/uploads", import_express2.default.static(uploadsPath));
  app.use("/api/v2", nmyApi_default);
  app.use("/api", nmyApi_default);
  app.use("/api/v1", nmyApi_default);
  app.use("/api/ravini-clean", (req, res) => {
    res.status(410).json({
      success: false,
      status: "ARCHIVED",
      message: "Legacy clean API retired. Authoritative database is Cloud SQL PostgreSQL."
    });
  });
  app.use("/api/legacy", (req, res) => {
    res.status(410).json({
      success: false,
      status: "ARCHIVED",
      message: "Legacy API retired. Authoritative database is Cloud SQL PostgreSQL."
    });
  });
  app.get("/api/health-server", async (req, res) => {
    try {
      const ping = await pool.query("SELECT current_database(), current_user, NOW() as db_time");
      res.json({
        status: "ok",
        engine: "NIDA MITANDAO YOTE Cloud SQL Server",
        databaseEngine: "Google Cloud SQL PostgreSQL",
        databaseStatus: "CONNECTED",
        databaseIdentity: "NIDA_MITANDAO_YOTE_PROD_DB",
        realtime: "WebSocket /ws ACTIVE",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      res.status(503).json({
        status: "error",
        engine: "NIDA MITANDAO YOTE Cloud SQL Server",
        databaseStatus: "DISCONNECTED",
        error: "Database connection unavailable",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path4.default.join(process.cwd(), "dist");
    app.use(import_express2.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path4.default.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[RAVINI Server] Running on http://0.0.0.0:${PORT} (HTTP & WebSocket)`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
