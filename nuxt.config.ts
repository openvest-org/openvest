// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      siteUrl: 'http://localhost:3000'
    }
  },

  routeRules: {
    '/': { prerender: true },
    '/questoes': { prerender: true },
    '/perfil': { prerender: true }
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    publicAssets: [
      {
        dir: new URL('./content', import.meta.url).pathname,
        baseURL: '/data',
        maxAge: 0
      }
    ]
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
