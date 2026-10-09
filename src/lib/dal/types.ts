import { 
  User, 
  WalletTransaction, 
  AdCampaign, 
  CompanyLedgerTransaction, 
  RefundRecord, 
  PlatformPricingConfig, 
  AuditLog,
  RvcDepositRequest
} from '../../types';

export type LedgerAccountType = 
  | 'customer_wallet' 
  | 'escrow_pending' 
  | 'company_revenue' 
  | 'creator_earnings' 
  | 'seller_funds' 
  | 'refunds_pool';

export interface AuthoritativeLedgerEntry {
  id: string;
  sourceAccount: LedgerAccountType;
  destinationAccount: LedgerAccountType;
  amount: number;
  currency: 'RVC' | 'TZS';
  service: 'ads' | 'market_commission' | 'verification' | 'deposit_fee' | 'creator_tip' | 'subscription' | 'refund' | 'payout';
  userId: string;
  userRaviniId?: string;
  userName?: string;
  referenceId: string;
  idempotencyKey?: string;
  status: 'pending' | 'completed' | 'reversed' | 'failed';
  notes?: string;
  timestamp: string;
}

export interface TransactionVerificationResult {
  success: boolean;
  message: string;
  errorCode?: 'UNAUTHORIZED' | 'INSUFFICIENT_BALANCE' | 'DUPLICATE_TRANSACTION' | 'MINIMUM_BUDGET_UNMET' | 'SERVICE_BLOCKED' | 'INVALID_PARAMS';
  transaction?: WalletTransaction;
  ledgerEntry?: AuthoritativeLedgerEntry;
}

export interface RefundExecutionResult {
  success: boolean;
  message: string;
  record?: RefundRecord;
  reversalTxId?: string;
  refundedAmountRvc?: number;
}

export interface SystemDiagnosticStatus {
  database: 'PASS' | 'PARTIAL' | 'BLOCKED';
  databaseReason: string;
  wallet: 'PASS' | 'PARTIAL' | 'BLOCKED';
  walletReason: string;
  rvcTransactions: 'PASS' | 'PARTIAL' | 'BLOCKED';
  rvcTransactionsReason: string;
  ads: 'PASS' | 'PARTIAL' | 'BLOCKED';
  adsReason: string;
  refunds: 'PASS' | 'PARTIAL' | 'BLOCKED';
  refundsReason: string;
  pricing: 'PASS' | 'PARTIAL' | 'BLOCKED';
  pricingReason: string;
  revenueSegregation: 'PASS' | 'PARTIAL' | 'BLOCKED';
  revenueSegregationReason: string;
  auditLogs: 'PASS' | 'PARTIAL' | 'BLOCKED';
  auditLogsReason: string;
  adminSecurity: 'PASS' | 'PARTIAL' | 'BLOCKED';
  adminSecurityReason: string;
  persistenceAfterRestart: 'PASS' | 'PARTIAL' | 'BLOCKED';
  persistenceAfterRestartReason: string;
  build: 'PASS' | 'FAIL';
}
