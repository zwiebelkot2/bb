export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
  nitro: {
    preset: 'vercel',
    // Keep maxDuration generous for slower upstreams.
    vercel: {
      functions: {
        maxDuration: 60
      }
    }
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Lnews — Research Daily',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'A daily digest of cutting-edge research papers from arXiv and Semantic Scholar.'
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
    // Secrets & prompt-driven logic intentionally removed for now.
  }
})
