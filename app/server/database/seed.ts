/**
 * Database Seed Script
 * Creates an admin user with a LiteLLM API key.
 *
 * Usage: bun run db:seed
 * Requires: MySQL running
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { users, apiKeys } from './schema';
import { eq } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://cafe:cafeai2026@localhost:3306/cafe_ai';
const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL || 'http://localhost:4000';
const LITELLM_MASTER_KEY = process.env.LITELLM_MASTER_KEY || 'sk-cafe-ai-master-key';

const db = drizzle(DATABASE_URL, { schema: { users, apiKeys }, mode: 'default' });

async function seed() {
  console.log('🌱 Starting seed...');

  const adminEmail = 'admin@daisailabs.my.id';
  const adminPassword = 'Admin123!';
  const adminFullName = 'Admin Daisailabs';

  // Check if admin already exists
  const existing = await db.select().from(users).where(eq(users.email, adminEmail));
  if (existing.length > 0) {
    console.log(`⚠ Admin ${adminEmail} already exists. Skipping.`);
    process.exit(0);
  }

  // Hash password
  const passwordHash = await Bun.password.hash(adminPassword, {
    algorithm: 'bcrypt',
    cost: 10,
  });

  // Insert admin user
  const userId = crypto.randomUUID();
  await db
    .insert(users)
    .values({
      id: userId,
      email: adminEmail,
      passwordHash,
      fullName: adminFullName,
      role: 'admin',
    });

  const [admin] = await db.select().from(users).where(eq(users.email, adminEmail));
  console.log(`✓ Admin created: ${admin.email} (${admin.id}) [role: ${admin.role}]`);

  // Generate LiteLLM key
  try {
    const response = await fetch(`${LITELLM_BASE_URL}/key/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LITELLM_MASTER_KEY}`,
      },
      body: JSON.stringify({
        key_name: `admin_${adminEmail}`,
        max_parallel_requests: 10,
        metadata: { user_id: admin.id, email: adminEmail, role: 'admin' },
        tpm_limit: 2_000_000,
        rpm_limit: 120,
        models: ['sumopod', 'gemini'],
      }),
    });

    if (!response.ok) {
      console.error(`✗ LiteLLM key generation failed: ${response.status}`);
      console.log('  (Admin created but without API key.)');
      process.exit(0);
    }

    const keyData = await response.json() as { key: string; token: string };

    const keyId = crypto.randomUUID();
    await db
      .insert(apiKeys)
      .values({
        id: keyId,
        userId: admin.id,
        litellmKeyId: keyData.token || keyData.key,
        apiKey: keyData.key,
        maxTokens: 2_000_000,
      });

    console.log(`✓ API Key created: ${keyData.key}`);
    console.log('');
    console.log('╭─────────────────────────────────────────────╮');
    console.log('│  ✅ Seed Complete!                          │');
    console.log('│                                             │');
    console.log(`│  Email:    ${adminEmail}         │`);
    console.log(`│  Password: ${adminPassword}              │`);
    console.log(`│  Role:     admin                            │`);
    console.log(`│  API Key:  ${keyData.key.slice(0, 20)}...│`);
    console.log('╰─────────────────────────────────────────────╯');
  } catch (err) {
    console.error('✗ Could not connect to LiteLLM:', (err as Error).message);
    console.log('  (Admin created but without API key.)');
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
