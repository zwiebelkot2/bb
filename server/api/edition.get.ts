import { editionDateKey, isSameEditionDay, readCachedEdition, writeEdition } from '../utils/edition-cache'
import { buildAndStoreEdition } from '../utils/build-edition'
import { fetchGeminiWebDigest } from '../utils/gemini-web-digest'
import { resolveGeminiWebPrompt } from '../utils/load-gemini-prompt'
import { resolveGeminiApiKey } from '../utils/resolve-gemini-key'

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  const timeout = new Promise<T>((resolve) => {
    setTimeout(() => resolve(fallback), timeoutMs)
  })
  return Promise.race([promise, timeout]).catch(() => fallback)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const query = getQuery(event)
  const requestedDate = typeof query.date === 'string' ? query.date : undefined
  const force = query.refresh === '1'

  if (requestedDate) {
    const archived = await readCachedEdition(requestedDate)
    if (archived) return archived
    throw createError({ statusCode: 404, message: 'Edition not found' })
  }

  const dateKey = editionDateKey()

  if (force) {
    const okDev = import.meta.dev
    const secret = getHeader(event, 'x-lnews-secret')
    const okSecret = config.refreshSecret && secret === config.refreshSecret
    if (!okDev && !okSecret) {
      throw createError({ statusCode: 403, message: 'Refresh not allowed' })
    }
  }

  const cached = await readCachedEdition(dateKey)
  if (!force && isSameEditionDay(cached, dateKey) && cached) {
    const gKey = resolveGeminiApiKey(config)
    const gPrompt = await resolveGeminiWebPrompt(config.geminiWebPrompt)
    const missingGemini = !cached.geminiPapers?.length
    if (gKey && gPrompt && missingGemini) {
      const model = (config.geminiModel || 'gemini-2.5-flash').trim()
      const result = await withTimeout(fetchGeminiWebDigest(gKey, model, gPrompt), 3000, null)
      if (result?.papers?.length) {
        const merged = {
          ...cached,
          geminiPapers: result.papers.map((p) => ({ ...p, source: 'gemini' as const })),
          geminiStatus: 'ok' as const,
          geminiSearchQueries: result.searchQueries
        }
        try {
          await writeEdition(merged)
        } catch (e) {
          console.warn('[edition] cache update failed:', e)
        }
        return merged
      }
    }
    return cached
  }

  return buildAndStoreEdition({
    openaiApiKey: config.openaiApiKey,
    scienceCuratorPrompt: config.scienceCuratorPrompt,
    geminiApiKey: resolveGeminiApiKey(config),
    geminiModel: config.geminiModel,
    geminiWebPrompt: config.geminiWebPrompt
  })
})
