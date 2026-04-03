import { buildAndStoreEdition } from '../utils/build-edition'
import { resolveGeminiApiKey } from '../utils/resolve-gemini-key'

/**
 * Vercel Cron: runs daily at 9:00 AM UTC.
 * Vercel automatically sends CRON_SECRET in the Authorization header.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  if (!import.meta.dev) {
    const auth = getHeader(event, 'authorization')
    if (config.cronSecret && auth !== `Bearer ${config.cronSecret}`) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }
  }

  const edition = await buildAndStoreEdition({
    openaiApiKey: config.openaiApiKey,
    scienceCuratorPrompt: config.scienceCuratorPrompt,
    geminiApiKey: resolveGeminiApiKey(config),
    geminiModel: config.geminiModel,
    geminiWebPrompt: config.geminiWebPrompt
  })

  return { ok: true, dateKey: edition.dateKey, papers: edition.papers.length }
})
