// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8080',
    },
  },

  srcDir: 'app',

  devServer: {
    port: process.env.UI_PORT ? parseInt(process.env.UI_PORT) : 3000,
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/scripts',
    '@nuxt/ui',
    'nuxt-auth-utils',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@vueuse/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  pinia: {
    storesDirs: ['./app/stores/**'],
  },

  imports: {
    dirs: ['interceptors/**'],
  },
});
