import { eq } from 'drizzle-orm';
import { users } from '~~/server/database/schema';

/**
 * POST /api/auth/login
 * Authenticates user via email/password and sets a session cookie.
 */
// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map<string, { count: number; timestamp: number }>();

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event) || 'unknown';
  const now = Date.now();
  const limitWindow = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const attempt = loginAttempts.get(ip);
  if (attempt) {
    if (now - attempt.timestamp > limitWindow) {
      // Reset window
      loginAttempts.set(ip, { count: 1, timestamp: now });
    } else {
      if (attempt.count >= maxAttempts) {
        throw createError({
          statusCode: 429,
          statusMessage: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.',
        });
      }
      attempt.count += 1;
    }
  } else {
    loginAttempts.set(ip, { count: 1, timestamp: now });
  }

  const body = await readBody<{
    email?: string;
    password?: string;
  }>(event);

  // ─── Validation ────────────────────────────────────────
  if (!body.email || !body.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email dan password wajib diisi.',
    });
  }

  // ─── Find user ─────────────────────────────────────────
  const user = await db.query.users.findFirst({
    where: eq(users.email, body.email),
  });

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Kredensial tidak valid.',
    });
  }

  // ─── Verify password (Bun built-in) ───────────────────
  const isValid = await Bun.password.verify(body.password, user.passwordHash);

  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Kredensial tidak valid.',
    });
  }

  // ─── Set session ──────────────────────────────────────
  const session = await useSession(event, {
    password: env.SESSION_SECRET,
  });
  await session.update({ userId: user.id });

  // Reset rate limiter on successful login
  loginAttempts.delete(ip);

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    },
  };
});
