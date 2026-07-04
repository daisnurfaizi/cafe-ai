/**
 * Database Seed Script
 * Creates a test user with a LiteLLM API key.
 *
 * Usage: bun run db:seed
 * Requires: PostgreSQL running, LiteLLM running
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, apiKeys } from './schema';
import { eq } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://litellm_user:rahasia123@localhost:5432/cafe_ai';
const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL || 'http://localhost:4000';
const LITELLM_MASTER_KEY = process.env.LITELLM_MASTER_KEY || 'sk-master-key-admin-123';

const connection = postgres(DATABASE_URL);
const db = drizzle(connection, { schema: { users, apiKeys } });

async function seed() {
  console.log('🌱 Starting seed...');

  const testEmail = 'test@tempo.co';
  const testPassword = 'password123';
  const testFullName = 'Test User Tempo';

  // Check if user already exists
  const existing = await db.select().from(users).where(eq(users.email, testEmail));
  if (existing.length > 0) {
    console.log(`⚠ User ${testEmail} already exists. Skipping.`);
    await connection.end();
    process.exit(0);
  }

  // Hash password
  const passwordHash = await Bun.password.hash(testPassword, {
    algorithm: 'bcrypt',
    cost: 10,
  });

  // Insert user
  const [newUser] = await db
    .insert(users)
    .values({
      email: testEmail,
      passwordHash,
      fullName: testFullName,
    })
    .returning();

  console.log(`✓ User created: ${newUser.email} (${newUser.id})`);

  // Generate LiteLLM key
  try {
    const response = await fetch(`${LITELLM_BASE_URL}/key/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LITELLM_MASTER_KEY}`,
      },
      body: JSON.stringify({
        key_name: `user_${testEmail}`,
        max_parallel_requests: 5,
        metadata: { user_id: newUser.id, email: testEmail },
        tpm_limit: 1_000_000,
        rpm_limit: 60,
        models: ['sumopod'],
      }),
    });

    if (!response.ok) {
      console.error(`✗ LiteLLM key generation failed: ${response.status}`);
      console.log('  (User created but without API key. LiteLLM might not be running.)');
      await connection.end();
      process.exit(0);
    }

    const keyData = await response.json() as { key: string; token: string };

    // Store key
    const [newKey] = await db
      .insert(apiKeys)
      .values({
        userId: newUser.id,
        litellmKeyId: keyData.token || keyData.key,
        apiKey: keyData.key,
        maxTokens: 1_000_000,
      })
      .returning();

    console.log(`✓ API Key created: ${keyData.key}`);
    console.log('');
    console.log('╭─────────────────────────────────────────╮');
    console.log('│  Seed Complete!                         │');
    console.log('│                                         │');
    console.log(`│  Email:    ${testEmail}           │`);
    console.log(`│  Password: ${testPassword}              │`);
    console.log(`│  API Key:  ${keyData.key.slice(0, 20)}...│`);
    console.log('╰─────────────────────────────────────────╯');
  } catch (err) {
    console.error('✗ Could not connect to LiteLLM:', (err as Error).message);
    console.log('  (User created but without API key.)');
  }

  await connection.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
