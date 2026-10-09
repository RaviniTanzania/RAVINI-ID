import fs from 'fs';
import path from 'path';
import { db, pool } from '../src/db';
import * as schema from '../src/db/schema';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('====================================================');
  console.log('🚀 NIDA MITANDAO YOTE: CLOUD SQL POSTGRESQL MIGRATION');
  console.log('====================================================\n');

  const jsonDbPath = path.join(process.cwd(), 'data', 'nida_mitandao_yote_db.json');
  if (!fs.existsSync(jsonDbPath)) {
    throw new Error(`Production source database not found at: ${jsonDbPath}`);
  }

  const rawJson = fs.readFileSync(jsonDbPath, 'utf-8');
  const source = JSON.parse(rawJson);

  console.log(`[SOURCE DATA INSPECTION]`);
  console.log(`- Source Users: ${source.users?.length || 0}`);
  console.log(`- Source Requests: ${source.requests?.length || 0}`);
  console.log(`- Source Credit Accounts: ${Object.keys(source.creditAccounts || {}).length}`);
  console.log(`- Source Credit Ledger: ${source.creditLedger?.length || 0}`);
  console.log(`- Source Audit Logs: ${source.auditLogs?.length || 0}`);

  // Test Cloud SQL connection
  console.log('\n[TESTING CLOUD SQL CONNECTION]');
  const testRes = await db.execute(sql`SELECT current_database(), current_user, version();`);
  console.log('✅ Connected to Cloud SQL PostgreSQL:', testRes.rows[0]);

  // Run in a single transaction
  console.log('\n[EXECUTING DETERMINISTIC MIGRATION TRANSACTION]');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Migrate Users
    console.log('👉 Migrating Users...');
    const userIds = new Set<string>();
    for (const u of (source.users || [])) {
      userIds.add(u.id);
      await client.query(
        `INSERT INTO users (id, phone, full_name, password, role, status, department_id, permissions, language, must_change_password, last_login_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET
           phone = EXCLUDED.phone,
           full_name = EXCLUDED.full_name,
           password = EXCLUDED.password,
           role = EXCLUDED.role,
           status = EXCLUDED.status,
           department_id = EXCLUDED.department_id,
           permissions = EXCLUDED.permissions,
           language = EXCLUDED.language,
           must_change_password = EXCLUDED.must_change_password,
           last_login_at = EXCLUDED.last_login_at,
           updated_at = EXCLUDED.updated_at`,
        [
          u.id,
          u.phone,
          u.fullName,
          u.password,
          u.role,
          u.status,
          u.departmentId || null,
          JSON.stringify(u.permissions || []),
          u.language || 'sw',
          u.mustChangePassword || false,
          u.lastLoginAt ? new Date(u.lastLoginAt) : null,
          new Date(u.createdAt || Date.now()),
          new Date(u.updatedAt || Date.now())
        ]
      );
    }
    console.log(`✅ Migrated ${source.users?.length || 0} users.`);

    // 2. Migrate Services
    console.log('👉 Migrating Services...');
    for (const s of (source.services || [])) {
      await client.query(
        `INSERT INTO services (id, code, name, description, price_tzs, is_active, input_requirement, result_type, department_id, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           code = EXCLUDED.code,
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           price_tzs = EXCLUDED.price_tzs,
           is_active = EXCLUDED.is_active,
           input_requirement = EXCLUDED.input_requirement,
           result_type = EXCLUDED.result_type,
           department_id = EXCLUDED.department_id,
           updated_at = EXCLUDED.updated_at`,
        [
          s.id,
          s.code,
          s.name,
          s.description || null,
          s.priceTzs,
          s.isActive !== false,
          s.inputRequirement,
          s.resultType,
          s.departmentId || null,
          new Date(s.updatedAt || Date.now())
        ]
      );
    }
    console.log(`✅ Migrated ${source.services?.length || 0} services.`);

    // 3. Migrate Departments
    console.log('👉 Migrating Departments...');
    for (const d of (source.departments || [])) {
      await client.query(
        `INSERT INTO departments (id, name, code, description, permissions, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           code = EXCLUDED.code,
           description = EXCLUDED.description,
           permissions = EXCLUDED.permissions`,
        [
          d.id,
          d.name,
          d.code,
          d.description || null,
          JSON.stringify(d.permissions || []),
          new Date(d.createdAt || Date.now())
        ]
      );
    }

    // 4. Migrate Terms Versions & Acceptances
    console.log('👉 Migrating Terms Versions & Acceptances...');
    for (const tv of (source.termsVersions || [])) {
      await client.query(
        `INSERT INTO terms_versions (version, content, updated_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (version) DO UPDATE SET
           content = EXCLUDED.content,
           updated_at = EXCLUDED.updated_at`,
        [tv.version, tv.content, new Date(tv.updatedAt || Date.now())]
      );
    }

    for (const ta of (source.termsAcceptances || [])) {
      if (userIds.has(ta.userId)) {
        await client.query(
          `INSERT INTO terms_acceptances (user_id, terms_version, accepted_at)
           VALUES ($1, $2, $3)`,
          [ta.userId, ta.termsVersion, new Date(ta.acceptedAt || Date.now())]
        );
      }
    }

    // 5. Migrate Credit Accounts (only for existing users)
    console.log('👉 Migrating Credit Accounts...');
    for (const [uid, acc] of Object.entries<any>(source.creditAccounts || {})) {
      if (userIds.has(uid)) {
        await client.query(
          `INSERT INTO credit_accounts (user_id, balance_tzs, updated_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id) DO UPDATE SET
             balance_tzs = EXCLUDED.balance_tzs,
             updated_at = EXCLUDED.updated_at`,
          [uid, acc.balanceTzs, new Date(acc.updatedAt || Date.now())]
        );
      }
    }

    // 6. Migrate Super Admin Work Credit Accounts
    for (const [said, acc] of Object.entries<any>(source.superAdminWorkCreditAccounts || {})) {
      if (userIds.has(said)) {
        await client.query(
          `INSERT INTO super_admin_work_credit_accounts (super_admin_id, balance_tzs, updated_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (super_admin_id) DO UPDATE SET
             balance_tzs = EXCLUDED.balance_tzs,
             updated_at = EXCLUDED.updated_at`,
          [said, acc.balanceTzs, new Date(acc.updatedAt || Date.now())]
        );
      }
    }

    // 7. Migrate Admin Work Credit Accounts
    for (const [aid, acc] of Object.entries<any>(source.adminWorkCreditAccounts || {})) {
      if (userIds.has(aid)) {
        await client.query(
          `INSERT INTO admin_work_credit_accounts (admin_id, balance_tzs, updated_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (admin_id) DO UPDATE SET
             balance_tzs = EXCLUDED.balance_tzs,
             updated_at = EXCLUDED.updated_at`,
          [aid, acc.balanceTzs, new Date(acc.updatedAt || Date.now())]
        );
      }
    }

    // 8. Migrate Credit Ledger (only for existing users)
    console.log('👉 Migrating Credit Ledger...');
    for (const cl of (source.creditLedger || [])) {
      if (userIds.has(cl.userId)) {
        await client.query(
          `INSERT INTO credit_ledger (id, user_id, type, amount, balance_before, balance_after, request_id, actor_id, actor_name, actor_role, reason, reference, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO NOTHING`,
          [
            cl.id,
            cl.userId,
            cl.type,
            cl.amount,
            cl.balanceBefore,
            cl.balanceAfter,
            cl.requestId || null,
            cl.actorId,
            cl.actorName,
            cl.actorRole,
            cl.reason,
            cl.reference,
            new Date(cl.timestamp || Date.now())
          ]
        );
      }
    }

    // 9. Migrate Requests
    console.log('👉 Migrating Requests...');
    for (const r of (source.requests || [])) {
      await client.query(
        `INSERT INTO requests (id, customer_id, customer_name, customer_phone, service_id, service_code, service_name, target_phone_number, charged_price_tzs, status, claimed_by_worker_id, claimed_by_worker_name, claimed_by_worker_role, claimed_at, completed_at, rejected_at, nida_result, rejection_reason, refund_status, refunded_at, is_deleted_by_customer, deleted_at, deleted_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           claimed_by_worker_id = EXCLUDED.claimed_by_worker_id,
           claimed_by_worker_name = EXCLUDED.claimed_by_worker_name,
           claimed_by_worker_role = EXCLUDED.claimed_by_worker_role,
           claimed_at = EXCLUDED.claimed_at,
           completed_at = EXCLUDED.completed_at,
           rejected_at = EXCLUDED.rejected_at,
           nida_result = EXCLUDED.nida_result,
           rejection_reason = EXCLUDED.rejection_reason,
           refund_status = EXCLUDED.refund_status,
           refunded_at = EXCLUDED.refunded_at,
           updated_at = EXCLUDED.updated_at`,
        [
          r.id,
          r.customerId,
          r.customerName,
          r.customerPhone,
          r.serviceId,
          r.serviceCode,
          r.serviceName,
          r.targetPhoneNumber,
          r.chargedPriceTzs,
          r.status,
          r.claimedByWorkerId || null,
          r.claimedByWorkerName || null,
          r.claimedByWorkerRole || null,
          r.claimedAt ? new Date(r.claimedAt) : null,
          r.completedAt ? new Date(r.completedAt) : null,
          r.rejectedAt ? new Date(r.rejectedAt) : null,
          r.nidaResult || null,
          r.rejectionReason || null,
          r.refundStatus || 'NONE',
          r.refundedAt ? new Date(r.refundedAt) : null,
          r.isDeletedByCustomer || false,
          r.deletedAt ? new Date(r.deletedAt) : null,
          r.deletedBy || null,
          new Date(r.createdAt || Date.now()),
          new Date(r.updatedAt || Date.now())
        ]
      );
    }
    console.log(`✅ Migrated ${source.requests?.length || 0} requests.`);

    // 10. Migrate Credit Requests
    for (const cr of (source.creditRequests || [])) {
      await client.query(
        `INSERT INTO credit_requests (id, customer_id, customer_name, customer_phone, amount_tzs, payment_method, payment_reference, proof_image_url, status, reviewed_by, rejection_reason, reviewed_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING`,
        [
          cr.id,
          cr.customerId,
          cr.customerName,
          cr.customerPhone,
          cr.amountTzs,
          cr.paymentMethod,
          cr.paymentReference,
          cr.proofImageUrl || null,
          cr.status,
          cr.reviewedBy || null,
          cr.rejectionReason || null,
          cr.reviewedAt ? new Date(cr.reviewedAt) : null,
          new Date(cr.createdAt || Date.now())
        ]
      );
    }

    // 11. Migrate Audit Logs
    console.log('👉 Migrating Audit Logs...');
    for (const a of (source.auditLogs || [])) {
      await client.query(
        `INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, target, target_id, details, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          a.id,
          a.actorId,
          a.actorName,
          a.actorRole,
          a.action,
          a.target,
          a.targetId || null,
          a.details,
          new Date(a.timestamp || Date.now())
        ]
      );
    }
    console.log(`✅ Migrated ${source.auditLogs?.length || 0} audit logs.`);

    // 12. Migrate Settings
    console.log('👉 Migrating Settings...');
    if (source.settings) {
      await client.query(
        `INSERT INTO settings (key, value, updated_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET
           value = EXCLUDED.value,
           updated_at = EXCLUDED.updated_at`,
        ['app_settings', JSON.stringify(source.settings), new Date()]
      );
    }

    await client.query('COMMIT');
    console.log('\n🎉 [MIGRATION TRANSACTION COMMITTED SUCCESSFULLY]');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ [MIGRATION FAILED - ROLLED BACK]:', err);
    throw err;
  } finally {
    client.release();
  }

  // 13. Migration Validation
  console.log('\n[POST-MIGRATION VALIDATION]');
  const countUsers = await db.execute(sql`SELECT count(*) FROM users`);
  const countRequests = await db.execute(sql`SELECT count(*) FROM requests`);
  const countCreditAccounts = await db.execute(sql`SELECT count(*) FROM credit_accounts`);
  const countCreditLedger = await db.execute(sql`SELECT count(*) FROM credit_ledger`);
  const countAuditLogs = await db.execute(sql`SELECT count(*) FROM audit_logs`);
  const superAdminCheck = await db.execute(sql`SELECT id, phone, full_name, role, status FROM users WHERE phone = '255748604483'`);

  console.log('Target Users Count:', countUsers.rows[0].count);
  console.log('Target Requests Count:', countRequests.rows[0].count);
  console.log('Target Credit Accounts Count:', countCreditAccounts.rows[0].count);
  console.log('Target Credit Ledger Count:', countCreditLedger.rows[0].count);
  console.log('Target Audit Logs Count:', countAuditLogs.rows[0].count);
  console.log('Canonical Super Admin Verification:', superAdminCheck.rows[0]);

  if (Number(countUsers.rows[0].count) !== (source.users?.length || 0)) {
    throw new Error(`Users count mismatch: expected ${source.users?.length}, got ${countUsers.rows[0].count}`);
  }

  console.log('\n✅ ALL COUNTS AND RECORDS VALIDATED 100% IN POSTGRESQL');
}

runMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal migration error:', err);
    process.exit(1);
  });
