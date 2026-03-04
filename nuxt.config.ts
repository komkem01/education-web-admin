// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: 'app/',
  compatibilityDate: '2025-07-15',
  nitro: {
    compatibilityDate: '2026-03-04'
  },
  devtools: { enabled: true },
  // Explicitly use 'pages' mode with 'admin' layout
  pages: true
})
