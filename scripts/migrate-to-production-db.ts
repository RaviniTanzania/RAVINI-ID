import fs from 'fs';
import path from 'path';
import { SqliteProductionDataStore } from '../server/db/sqliteProductionDataStore';
import { User, Post, MarketItem } from '../src/types';

async function runMigration() {
  console.log('====================================================');
  console.log('🚀 RAVINI PRODUCTION DATABASE MIGRATION STARTING');
  console.log('====================================================');

  const jsonDbPath = path.join(process.cwd(), 'data', 'ravini_db.json');
  const backupDir = path.join(process.cwd(), 'data', 'backups');
  const sqliteDbPath = path.join(process.cwd(), 'data', 'ravini_production.sqlite');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // STEP 1: VERIFY & BACKUP EXISTING DATA
  console.log('\n[STEP 1/4] Backing up existing JSON database...');
  if (!fs.existsSync(jsonDbPath)) {
    throw new Error(`Source database file not found at ${jsonDbPath}`);
  }

  const rawJson = fs.readFileSync(jsonDbPath, 'utf-8');
  const existingData = JSON.parse(rawJson);
  const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, `ravini_db_backup_${backupTimestamp}.json`);

  fs.writeFileSync(backupFilePath, rawJson, 'utf-8');
  console.log(`✅ Backup successfully created at: ${backupFilePath}`);
  console.log(`   Size: ${fs.statSync(backupFilePath).size} bytes`);

  // STEP 2: ENSURE CANONICAL SUPER ADMIN COMPLIANCE
  console.log('\n[STEP 2/4] Verifying Canonical Super Admin account (255748604483)...');
  const users: User[] = existingData.users || [];
  let superAdmin = users.find(u => 
    u.id === 'usr_baraka_mabula' || 
    u.username === '255748604483' || 
    (u.phone && u.phone.replace(/[^0-9]/g, '') === '255748604483')
  );

  if (superAdmin) {
    console.log(`   Found existing Super Admin account (${superAdmin.id}). Updating canonical details...`);
    superAdmin.id = 'usr_baraka_mabula';
    superAdmin.username = '255748604483';
    superAdmin.phone = '255748604483';
    superAdmin.role = 'SUPER_ADMIN';
    superAdmin.verified = true;
    superAdmin.creatorApproved = true;
    superAdmin.businessApproved = true;
    superAdmin.companyApproved = true;
    superAdmin.permissions = ['all'];
    // Preserve if already customized or set to 1234
    if (!superAdmin.password || superAdmin.password === '1212' || superAdmin.password === 'admin123') {
      superAdmin.password = '1234';
    }
  } else {
    console.log('   Creating canonical Super Admin account (255748604483)...');
    superAdmin = {
      id: 'usr_baraka_mabula',
      name: 'Baraka Mabula',
      username: '255748604483',
      phone: '255748604483',
      email: 'barakamabula82@gmail.com',
      password: '1234',
      role: 'SUPER_ADMIN',
      verified: true,
      bio: 'Msimamizi Mkuu wa RAVINI (Super Administrator & Founder).',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      walletBalance: 2500000,
      followersCount: 0,
      followingCount: 0,
      isOnline: true,
      creatorApproved: true,
      businessApproved: true,
      companyApproved: true,
      permissions: ['all'],
      createdAt: new Date().toISOString()
    };
    users.unshift(superAdmin);
  }

  // Write updated canonical admin back to JSON as well
  existingData.users = users;
  fs.writeFileSync(jsonDbPath, JSON.stringify(existingData, null, 2), 'utf-8');

  // STEP 3: MIGRATE DATA TO SQLITE
  console.log('\n[STEP 3/4] Migrating records to SQLite production engine...');
  const store = new SqliteProductionDataStore(sqliteDbPath);
  await store.initialize();

  // 3a. Users
  console.log(`   Migrating ${users.length} users...`);
  for (const user of users) {
    await store.saveUser(user);
  }

  // 3b. Conversations
  const conversations = existingData.conversations || [];
  console.log(`   Migrating ${conversations.length} conversations...`);
  for (const conv of conversations) {
    await store.saveConversation(conv);
  }

  // 3c. Messages
  const messages = existingData.messages || [];
  console.log(`   Migrating ${messages.length} chat messages...`);
  for (const msg of messages) {
    await store.saveMessage(msg);
  }

  // 3d. Call Sessions
  const callSessions = existingData.callSessions || [];
  console.log(`   Migrating ${callSessions.length} call sessions...`);
  for (const call of callSessions) {
    await store.saveCallSession(call);
  }

  // 3e. Transactions
  const transactions = existingData.transactions || [];
  console.log(`   Migrating ${transactions.length} wallet transactions...`);
  for (const tx of transactions) {
    await store.recordWalletTransaction(tx);
  }

  // 3f. Ad Campaigns
  const adCampaigns = existingData.adCampaigns || [];
  console.log(`   Migrating ${adCampaigns.length} ad campaigns...`);
  for (const ad of adCampaigns) {
    await store.saveAdCampaign(ad);
  }

  // 3g. Company Ledger
  const companyLedger = existingData.companyLedger || [];
  console.log(`   Migrating ${companyLedger.length} company ledger transactions...`);
  for (const ledger of companyLedger) {
    await store.addCompanyLedgerEntry(ledger);
  }

  // 3h. Refunds
  const refunds = existingData.refunds || [];
  console.log(`   Migrating ${refunds.length} refund records...`);
  for (const ref of refunds) {
    await store.saveRefund(ref);
  }

  // 3i. RVC Requests
  const rvcRequests = existingData.rvcRequests || [];
  console.log(`   Migrating ${rvcRequests.length} RVC deposit requests...`);
  for (const req of rvcRequests) {
    await store.saveRvcRequest(req);
  }

  // 3j. Audit Logs
  const auditLogs = existingData.auditLogs || [];
  console.log(`   Migrating ${auditLogs.length} audit logs...`);
  for (const log of auditLogs) {
    await store.addAuditLog(log);
  }

  // 3k. Seed Starter Posts if posts table is empty
  const existingPosts = await store.getPosts();
  if (existingPosts.length === 0) {
    console.log('   Populating starter posts into production database...');
    const starterPosts: Post[] = [
      {
        id: 'post_welcome_baraka',
        authorId: 'usr_baraka_mabula',
        authorName: 'Baraka Mabula',
        authorUsername: '255748604483',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        authorVerified: true,
        content: 'Habari za wakati huu ndugu zangu! 🌟 Karibuni sana kwenye mfumo ulioboreshwa wa RAVINI. Machapisho yote sasa yanakwenda MUBASHARA (Real-time) kwa watumiaji wote bila kukatika. Taarifa za akaunti zenu kuanzia mlipojisajili ziko salama na zimehifadhiwa milele kwenye hifadhidata ya kudumu. Tuendelee kujenga mfumo wenye nguvu kwa ajili yetu sote! 🇹🇿🤝',
        mediaUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
        mediaType: 'image',
        feeling: 'mwenye shukrani na matumaini makubwa',
        location: 'Dar es Salaam, Tanzania',
        privacy: 'public',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        reactions: {
          'usr_amina_juma': 'love',
          'usr_juma_rashid': 'like',
          'usr_neema_mrosso': 'like',
        },
        commentsCount: 3,
        sharesCount: 14,
        viewsCount: 1890,
      },
      {
        id: 'post_amina_business',
        authorId: 'usr_amina_juma',
        authorName: 'Amina Juma',
        authorUsername: 'aminajuma',
        authorAvatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
        authorVerified: true,
        content: 'Mzigo mpya wa batiki asilia na magauni ya kisasa umewasili leo! Unaweza kuagiza moja kwa moja kupitia RAVINI Sokoni au nitumie ujumbe hapa hapa kwa Messenger. Malipo yanakubaliwa kwa RAVINI Wallet, M-Pesa na Tigo Pesa. Bei nafuu kabisa kwa wote! 🛍️✨',
        mediaUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
        mediaType: 'image',
        feeling: 'mwenye furaha kazini',
        location: 'Kariakoo, Dar es Salaam',
        privacy: 'public',
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        reactions: {
          'usr_baraka_mabula': 'love',
          'usr_neema_mrosso': 'like',
        },
        commentsCount: 2,
        sharesCount: 6,
        viewsCount: 940,
      },
      {
        id: 'post_neema_tech',
        authorId: 'usr_neema_mrosso',
        authorName: 'Neema Mrosso',
        authorUsername: 'neemamrosso',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        authorVerified: true,
        content: 'Mafunzo ya kielektroniki kwa wakulima wa Mwanza yamefanikiwa kwa asilimia 100! Ushirikiano wa teknolojia na kilimo unafungua fursa kwa mamilioni ya vijana. Asanteni wote mliohudhuria live stream yetu leo! 🌾📱',
        mediaUrl: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80',
        mediaType: 'image',
        feeling: 'mwenye ari ya maendeleo',
        location: 'Mwanza, Tanzania',
        privacy: 'public',
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        reactions: {
          'usr_baraka_mabula': 'like',
          'usr_amina_juma': 'care',
          'usr_juma_rashid': 'like',
        },
        commentsCount: 1,
        sharesCount: 8,
        viewsCount: 1120,
      }
    ];

    for (const p of starterPosts) {
      await store.savePost(p);
    }
  }

  // 3l. Seed Starter Market Items if empty
  const existingMarket = await store.getMarketItems();
  if (existingMarket.length === 0) {
    console.log('   Populating starter market items into production database...');
    const starterMarket: MarketItem[] = [
      {
        id: 'market_item_batiki',
        sellerId: 'usr_amina_juma',
        sellerName: 'Amina Juma',
        sellerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        sellerPhone: '+255 712 345 678',
        title: 'Batiki za Kisasa (Cotton Pure)',
        description: 'Batiki asilia zilizotengenezwa kwa mikono, hazipauki na zinafaa kwa mavazi rasmi na ya sherehe.',
        price: 35000,
        currency: 'TZS',
        category: 'fashion',
        imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80',
        location: 'Dar es Salaam',
        condition: 'new',
        createdAt: new Date().toISOString()
      },
      {
        id: 'market_item_coffee',
        sellerId: 'usr_juma_rashid',
        sellerName: 'Juma Rashid',
        sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        sellerPhone: '+255 754 987 654',
        title: 'Kahawa Asilia ya Kilimanjaro (Arabica 500g)',
        description: 'Kahawa safi iliyochomwa vizuri kutoka milima ya Kilimanjaro. Harufu nzuri na ladha halisi ya Kitanzania.',
        price: 15000,
        currency: 'TZS',
        category: 'other',
        imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=1000&q=80',
        location: 'Moshi / Arusha',
        condition: 'new',
        createdAt: new Date().toISOString()
      }
    ];
    for (const m of starterMarket) {
      await store.saveMarketItem(m);
    }
  }

  // STEP 4: VERIFICATION
  console.log('\n[STEP 4/4] Verifying migrated database integrity...');
  const status = await store.getPersistenceStatus();
  console.log('----------------------------------------------------');
  console.log('📊 MIGRATION VERIFICATION AUDIT:');
  console.log(`- Engine: ${status.engine}`);
  console.log(`- Database file: ${status.filePath}`);
  console.log(`- Database size: ${status.fileSizeBytes} bytes`);
  console.log(`- Users migrated: ${status.entitiesCount?.users ?? status.totalUsers}`);
  console.log(`- Messages migrated: ${status.entitiesCount?.messages ?? 0}`);
  console.log(`- Conversations migrated: ${status.entitiesCount?.conversations ?? 0}`);
  console.log(`- Transactions migrated: ${status.entitiesCount?.transactions ?? status.totalTransactions}`);
  console.log(`- Posts migrated: ${status.entitiesCount?.posts ?? 0}`);
  console.log(`- Market items migrated: ${status.entitiesCount?.marketItems ?? 0}`);
  console.log(`- Ad campaigns migrated: ${status.entitiesCount?.adCampaigns ?? status.totalCampaigns}`);
  console.log(`- Company ledger entries: ${status.entitiesCount?.companyLedger ?? 0}`);
  console.log(`- Audit logs: ${status.entitiesCount?.auditLogs ?? status.totalAuditLogs}`);

  // Test retrieval of canonical Super Admin
  const verifiedAdmin = await store.getUserById('usr_baraka_mabula');
  if (!verifiedAdmin || verifiedAdmin.role !== 'SUPER_ADMIN' || verifiedAdmin.username !== '255748604483') {
    throw new Error('Super Admin verification failed in SQLite database!');
  }
  console.log(`✅ Super Admin Verified: ${verifiedAdmin.name} (${verifiedAdmin.username}) Role: ${verifiedAdmin.role}`);

  console.log('====================================================');
  console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
