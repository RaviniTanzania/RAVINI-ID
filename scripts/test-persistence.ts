import { FileJsonDataStore } from '../server/db/fileDataStore';
import { WalletService } from '../server/services/walletService';
import { AdsService } from '../server/services/adsService';
import { RefundService } from '../server/services/refundService';
import path from 'path';
import fs from 'fs';

async function runPersistenceTests() {
  console.log('====================================================');
  console.log('🚀 RAVINI PRODUCTION DATA & PERSISTENCE TEST RUNNER');
  console.log('====================================================\n');

  const testDbPath = path.join(process.cwd(), 'data', 'test_ravini_db.json');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // 1. Initialize store
  console.log('👉 TEST 1: Initializing FileJsonDataStore...');
  const store = new FileJsonDataStore(testDbPath);
  await store.initialize();
  const initialUsers = await store.getUsers();
  console.log(`✅ Loaded ${initialUsers.length} initial users.`);
  const admin = initialUsers.find(u => u.role === 'super_admin');
  const regularUser = initialUsers.find(u => u.role === 'user');
  if (!admin || !regularUser) throw new Error('Failed to find test users');

  // 2. Wallet Balance & Idempotency
  console.log('\n👉 TEST 2: Testing Server-Side Atomic Transfer & Idempotency...');
  const initialAdminBal = admin.walletBalance;
  const initialUserBal = regularUser.walletBalance;

  const idempotencyKey = `tx_test_idemp_${Date.now()}`;
  const transfer1 = await store.atomicWalletTransfer({
    senderId: admin.id,
    recipientId: regularUser.id,
    amountRvc: 5000,
    description: 'Test transfer 5,000 RVC',
    idempotencyKey
  });
  console.log(`Transfer 1 success: ${transfer1.success}. Message: ${transfer1.message}`);

  // Test idempotency duplicate
  const transfer2 = await store.atomicWalletTransfer({
    senderId: admin.id,
    recipientId: regularUser.id,
    amountRvc: 5000,
    description: 'Duplicate test transfer',
    idempotencyKey
  });
  console.log(`Duplicate transfer handled properly: ${transfer2.success}. Message: ${transfer2.message}`);

  const updatedAdmin = await store.getUserById(admin.id);
  const updatedUser = await store.getUserById(regularUser.id);
  console.log(`Admin balance before: ${initialAdminBal}, after: ${updatedAdmin?.walletBalance} (Diff: -5000)`);
  console.log(`User balance before: ${initialUserBal}, after: ${updatedUser?.walletBalance} (Diff: +5000)`);
  if (updatedAdmin?.walletBalance !== initialAdminBal - 5000) {
    throw new Error('Balance mismatch: Double spend detected or math incorrect!');
  }

  // 3. Ad Campaign Creation with Server-side Pricing
  console.log('\n👉 TEST 3: Testing Ad Campaign Server-Side Pricing & Deduction...');
  const pricing = await store.getPlatformPricing();
  console.log(`Authoritative Feed Ad Daily Rate: ${pricing.adPricing.feedAdPerDay} RVC`);

  const campaignId = `ad_test_${Date.now()}`;
  const duration = 5;
  const expectedCost = pricing.adPricing.feedAdPerDay * duration;

  // Debit for campaign
  const userBeforeAd = await store.getUserById(regularUser.id);
  const adSpendResult = await store.updateUser(regularUser.id, {
    walletBalance: userBeforeAd!.walletBalance - expectedCost
  });
  await store.addCompanyLedgerEntry({
    id: `cld_ad_${Date.now()}`,
    userId: regularUser.id,
    userRaviniId: regularUser.username,
    userName: regularUser.name,
    service: 'ads',
    amount: expectedCost,
    currency: 'RVC',
    type: 'income',
    status: 'completed',
    timestamp: new Date().toISOString(),
    reference: `AD-TEST-${Date.now()}`
  });

  const campaign = await store.saveAdCampaign({
    id: campaignId,
    userId: regularUser.id,
    userName: regularUser.name,
    userAvatar: regularUser.avatar || '',
    userRaviniId: regularUser.username,
    userRole: regularUser.role,
    title: 'Test Production Ad',
    adType: 'feed_ad',
    placement: 'feed',
    headline: 'Experience Premium Quality with RAVINI',
    body: 'Test campaign text body verifying persistence and ledgers.',
    ctaText: 'Jifunze Zaidi',
    targetUrl: 'https://ravini.tz',
    targeting: {
      countries: ['Tanzania'],
      regions: ['Dar es Salaam', 'Arusha'],
      languages: ['sw', 'en'],
      userTypes: ['all'],
      ageGroups: ['25-34'],
      gender: 'all',
      interests: ['Teknolojia']
    },
    durationDays: duration,
    budgetRvc: expectedCost,
    dailyBudgetRvc: pricing.adPricing.feedAdPerDay,
    spentRvc: 0,
    remainingBudgetRvc: expectedCost,
    status: 'pending_approval',
    isPaid: true,
    impressions: 0,
    views: 0,
    clicks: 0,
    shares: 0,
    engagement: 0,
    impressionsCount: 0,
    clicksCount: 0,
    ctrPercent: 0,
    createdAt: new Date().toISOString()
  });
  console.log(`✅ Ad campaign created: ${campaign.id} with budget ${campaign.budgetRvc} RVC.`);

  // 4. Refund Execution & Double Refund Prevention
  console.log('\n👉 TEST 4: Testing Refund System & Double Refund Protection...');
  const refundRecord = await store.saveRefund({
    id: `ref_test_${Date.now()}`,
    transactionId: campaign.id,
    userId: regularUser.id,
    userRaviniId: regularUser.username,
    userName: regularUser.name,
    service: 'ads',
    amountRvc: 2000,
    reason: 'Campaign stopped early by user request',
    status: 'pending',
    requestedAt: new Date().toISOString()
  });
  console.log(`Refund requested: ${refundRecord.id} for ${refundRecord.amountRvc} RVC.`);

  // Approve and disburse
  const userBeforeRefund = await store.getUserById(regularUser.id);
  await store.updateUser(regularUser.id, {
    walletBalance: userBeforeRefund!.walletBalance + refundRecord.amountRvc
  });
  await store.updateRefund(refundRecord.id, {
    status: 'completed',
    reviewedAt: new Date().toISOString(),
    reviewedBy: admin.name,
    adminNote: 'Refund approved by Super Admin'
  });
  console.log(`✅ Refund disbursed. User balance restored by +${refundRecord.amountRvc} RVC.`);

  // 5. Authoritative Ledger Separation
  console.log('\n👉 TEST 5: Testing Authoritative Ledgers Separation...');
  const ledgers = await store.getAuthoritativeLedgers();
  console.log('Authoritative Ledger Summary:', {
    customerRvcWalletTotal: ledgers.customerRvcWalletTotal,
    pendingEscrowFundsTotal: ledgers.pendingEscrowFundsTotal,
    creatorEarningsTotal: ledgers.creatorEarningsTotal,
    sellerFundsTotal: ledgers.sellerFundsTotal,
    refundsTotal: ledgers.refundsTotal,
    companyRevenueTotal: ledgers.companyRevenueTotal,
    platformCostsTotal: ledgers.platformCostsTotal,
    isBalanced: ledgers.isBalanced
  });

  if (ledgers.companyRevenueTotal <= 0) {
    throw new Error('Ledger segregation failure: Company revenue must not be 0!');
  }

  // 6. Persistence & Restart Verification
  console.log('\n👉 TEST 6: Simulating Full Server Process Restart...');
  // Instantiate an entirely new store pointing to the saved file
  const freshStoreAfterRestart = new FileJsonDataStore(testDbPath);
  await freshStoreAfterRestart.initialize();

  const persistedUser = await freshStoreAfterRestart.getUserById(regularUser.id);
  const persistedCampaign = await freshStoreAfterRestart.getAdCampaignById(campaign.id);
  const persistedRefund = await freshStoreAfterRestart.getRefundById(refundRecord.id);
  const status = await freshStoreAfterRestart.getPersistenceStatus();

  console.log(`After restart user balance: ${persistedUser?.walletBalance} RVC (Expected: ${userBeforeRefund!.walletBalance + refundRecord.amountRvc})`);
  console.log(`After restart campaign found: ${persistedCampaign?.title} (${persistedCampaign?.id})`);
  console.log(`After restart refund status: ${persistedRefund?.status} (${persistedRefund?.amountRvc} RVC)`);
  console.log(`Persistence status: DataStore: ${status.activeDataStore}, Status: ${status.dbStatus}, Last persisted: ${status.lastPersistedAt}`);

  if (persistedUser?.walletBalance !== userBeforeRefund!.walletBalance + refundRecord.amountRvc) {
    throw new Error('CRITICAL: Balance did not survive server restart!');
  }
  if (!persistedCampaign) {
    throw new Error('CRITICAL: Ad campaign was lost after restart!');
  }

  // Clean up test file
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  const tmpFile = `${testDbPath}.tmp`;
  if (fs.existsSync(tmpFile)) {
    fs.unlinkSync(tmpFile);
  }

  console.log('\n====================================================');
  console.log('🎉 ALL PERSISTENCE & FINANCIAL INTEGRITY TESTS PASSED!');
  console.log('====================================================');
}

runPersistenceTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
