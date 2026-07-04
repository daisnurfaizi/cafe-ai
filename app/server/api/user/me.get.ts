import { eq } from 'drizzle-orm';
import { users, apiKeys } from '~~/server/database/schema';

/**
 * GET /api/user/me
 * Returns current user profile + API key info with live token usage from LiteLLM.
 */
export default defineEventHandler(async (event) => {
  // ─── Auth check ───────────────────────────────────────
  const session = await useSession(event, {
    password: env.SESSION_SECRET,
  });

  if (!session.data?.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sesi tidak ditemukan. Silakan login.',
    });
  }

  const userId = session.data.userId as string;

  // ─── Fetch user + keys ────────────────────────────────
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      apiKeys: true,
    },
  });

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User tidak ditemukan.',
    });
  }

  // ─── Enrich with LiteLLM usage data ──────────────────
  const enrichedKeys = await Promise.all(
    user.apiKeys.map(async (key) => {
      let usedTokens = 0;
      let remainingTokens = key.maxTokens;
      let allowedModels: string[] = ['sumopod'];

      try {
        const info = await getKeyInfo(key.apiKey);
        
        // LiteLLM tracks usage via `spend` (USD cost).
        // Karena cost per token di litellm_config sekitar ~0.001 USD, 
        // kita estimasi: 1 token = $0.001 -> jadi tokens = spend * 1000
        const estimatedTokens = Math.floor((info.info?.spend || 0) * 1000);
        
        usedTokens = estimatedTokens;
        remainingTokens = Math.max(0, key.maxTokens - usedTokens);
        allowedModels = info.info?.models || ['sumopod'];
      } catch (err: any) {
        console.error('Failed to get key info:', err.message);
      }

      return {
        id: key.id,
        key: key.apiKey,
        maxTokens: key.maxTokens,
        usedTokens: Math.max(0, usedTokens),
        remainingTokens: Math.max(0, remainingTokens),
        allowedModels: allowedModels,
        isActive: key.isActive,
        createdAt: key.createdAt,
      };
    })
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
    },
    apiKeys: enrichedKeys,
  };
});
