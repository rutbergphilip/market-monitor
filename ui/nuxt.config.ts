// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: true },

  runtimeConfig: {
    apiBaseUrl: 'http://localhost:8080',
  },

  srcDir: 'app',
  serverDir: 'server',

  devServer: {
    port: process.env.UI_PORT ? parseInt(process.env.UI_PORT) : 3000,
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/scripts',
    '@nuxt/ui',
    '@nuxtjs/color-mode',
    'nuxt-auth-utils',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@vueuse/nuxt',
  ],

  colorMode: {
    preference: 'system',
    fallback: 'light',
    hid: 'nuxt-color-mode-script',
    globalName: '__MARKET_MONITOR_COLOR_MODE__',
    componentName: 'ColorScheme',
    classPrefix: '',
    classSuffix: '',
    storageKey: 'market-monitor-color-mode-v2',
    dataValue: 'theme',
    storage: 'localStorage',
  },

  css: ['~/assets/css/main.css'],

  pinia: {
    storesDirs: ['./app/stores/**'],
  },

  imports: {
    dirs: ['composables/**', 'stores/**', 'utils/**', 'interceptors/**'],
  },

  typescript: {
    typeCheck: true,
  },
});