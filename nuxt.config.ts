export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
  nitro: {
    preset: 'vercel'
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Lnews — Research Daily',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'A daily digest of cutting-edge research papers from arXiv, Semantic Scholar, and web search — curated by AI.'
        }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:wght@400;500;600;700&display=swap'
        }
      ]
    }
  },
  runtimeConfig: {
    openaiApiKey: process.env.NUXT_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '',
    scienceCuratorPrompt: process.env.NUXT_SCIENCE_CURATOR_PROMPT || '',
    refreshSecret: process.env.NUXT_REFRESH_SECRET || '',
    geminiApiKey: process.env.NUXT_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.NUXT_GEMINI_MODEL || 'gemini-2.5-flash',
    geminiWebPrompt: process.env.NUXT_GEMINI_WEB_PROMPT || '',
    cronSecret: process.env.CRON_SECRET || ''
  }
})
