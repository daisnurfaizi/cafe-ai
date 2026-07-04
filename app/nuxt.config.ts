// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  debug: false,

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Server-only (not exposed to client)
    sessionSecret: process.env.NUXT_SESSION_SECRET,

    // Public (exposed to client)
    public: {
      litellmUrl: process.env.LITELLM_BASE_URL || 'http://localhost:4000',
    },
  },
});
