import { editionDateKey, isSameEditionDay, readCachedEdition } from '../utils/edition-cache'
import { buildAndStoreEdition } from '../utils/build-edition'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const requestedDate = typeof query.date === 'string' ? query.date : undefined
  const force = query.refresh === '1'

  if (requestedDate) {
    const archived = await readCachedEdition(requestedDate)
    if (archived) return archived
    throw createError({ statusCode: 404, message: 'Edition not found' })
  }

  const dateKey = editionDateKey()

  // Refresh-Auth / Secrets sind bewusst entfernt; `refresh=1` erzwingt nur ein Rebuild.

  const cached = await readCachedEdition(dateKey)
  if (!force && isSameEditionDay(cached, dateKey) && cached) {
    return cached
  }

  return buildAndStoreEdition({
    // aktuell keine Prompt/LLM/Cron-Logik
  })
})
