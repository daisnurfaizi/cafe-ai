import { users, apiKeys } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  // Fetch all users with their API keys
  const allUsers = await db.query.users.findMany({
    with: {
      apiKeys: true,
    },
  });

  // Enrich with LiteLLM data
  const enrichedUsers = await Promise.all(
    allUsers.map(async (user) => {
      const keys = await Promise.all(
        user.apiKeys.map(async (key) => {
          let usedTokens = 0;
          let allowedModels: string[] = ['sumopod'];
          
          try {
            const info = await getKeyInfo(key.apiKey);
            const estimatedTokens = Math.floor((info.info?.spend || 0) * 1000);
            usedTokens = estimatedTokens;
            allowedModels = info.info?.models || ['sumopod'];
          } catch {}

          return {
            id: key.id,
            apiKey: key.apiKey,
            maxTokens: key.maxTokens,
            usedTokens,
            allowedModels,
          };
        })
      );
      
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        keys,
      };
    })
  );

  return enrichedUsers;
});
