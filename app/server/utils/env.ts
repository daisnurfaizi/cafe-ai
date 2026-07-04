/**
 * Typed environment variables.
 * Auto-imported in Nitro server routes via server/utils/ convention.
 */
export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  LITELLM_BASE_URL: process.env.LITELLM_BASE_URL!,
  LITELLM_MASTER_KEY: process.env.LITELLM_MASTER_KEY!,
  SESSION_SECRET: process.env.NUXT_SESSION_SECRET || 'fallback-dev-secret-min-32-characters!!',
} as const;
