import { eq } from 'drizzle-orm';
import { users, apiKeys } from '~~/server/database/schema';

/**
 * POST /api/auth/register
 * Creates a new user, generates a LiteLLM API key with 1M token limit,
 * and stores both in PostgreSQL.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    email?: string;
    password?: string;
    fullName?: string;
  }>(event);

  // ─── Validation ────────────────────────────────────────
  if (!body.email || !body.password || !body.fullName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email, password, dan nama lengkap wajib diisi.',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Format email tidak valid.',
    });
  }

  if (body.password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password minimal 8 karakter.',
    });
  }

  // ─── Check duplicate email ─────────────────────────────
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, body.email),
  });

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Email sudah terdaftar.',
    });
  }

  // ─── Hash password (Bun built-in) ─────────────────────
  const passwordHash = await Bun.password.hash(body.password, {
    algorithm: 'bcrypt',
    cost: 10,
  });

  // ─── Insert user ───────────────────────────────────────
  const [newUser] = await db
    .insert(users)
    .values({
      email: body.email,
      passwordHash,
      fullName: body.fullName,
    })
    .returning();

  // ─── Generate LiteLLM key ─────────────────────────────
  let litellmResponse;
  try {
    litellmResponse = await generateLiteLLMKey(newUser.id, newUser.email);
  } catch (err) {
    // Rollback: delete user if LiteLLM fails
    await db.delete(users).where(eq(users.id, newUser.id));
    throw createError({
      statusCode: 502,
      statusMessage: 'Gagal membuat API key dari LiteLLM. User dibatalkan.',
    });
  }

  // ─── Store API key ────────────────────────────────────
  const [newApiKey] = await db
    .insert(apiKeys)
    .values({
      userId: newUser.id,
      litellmKeyId: litellmResponse.token || litellmResponse.key,
      apiKey: litellmResponse.key,
      maxTokens: 1_000_000,
    })
    .returning();

  // ─── Set session ──────────────────────────────────────
  const session = await useSession(event, {
    password: env.SESSION_SECRET,
  });
  await session.update({ userId: newUser.id });

  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
    },
    apiKey: litellmResponse.key,
    message: 'Registrasi berhasil. Simpan API key Anda dengan aman.',
  };
});
