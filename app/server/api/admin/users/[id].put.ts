import { eq } from 'drizzle-orm';
import { apiKeys } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id');
  if (!userId) throw createError({ statusCode: 400 });

  const body = await readBody(event);
  const { maxTokens, models } = body;

  if (maxTokens === undefined || !models) {
    throw createError({ statusCode: 400, statusMessage: 'Missing fields' });
  }

  // Find user's API Key in DB
  const keyRecord = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.userId, userId),
  });

  if (!keyRecord) {
    throw createError({ statusCode: 404, statusMessage: 'Key not found' });
  }

  // Update maxTokens in DB
  await db.update(apiKeys)
    .set({ maxTokens })
    .where(eq(apiKeys.id, keyRecord.id));

  // Update models in LiteLLM
  await updateLiteLLMKey(keyRecord.apiKey, models, maxTokens);

  return { success: true };
});
