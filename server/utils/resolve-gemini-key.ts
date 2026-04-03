/**
 * Nuxt runtimeConfig may be empty at runtime if the key was not present at build time.
 * Vercel injects GEMINI_API_KEY at runtime; Nuxt also accepts NUXT_GEMINI_API_KEY.
 */
export function resolveGeminiApiKey(config: { geminiApiKey?: string }): string {
  return (
    config.geminiApiKey ||
    process.env.NUXT_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ''
  ).trim()
}
