import { buildAndStoreEdition } from '../utils/build-edition'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secret = getHeader(event, 'x-lnews-secret')
  if (config.refreshSecret && secret !== config.refreshSecret) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  const edition = await buildAndStoreEdition({
    openaiApiKey: config.openaiApiKey,
    scienceCuratorPrompt: config.scienceCuratorPrompt,
    geminiApiKey: config.geminiApiKey,
    geminiModel: config.geminiModel,
    geminiWebPrompt: config.geminiWebPrompt
  })
  return { ok: true, edition }
})
