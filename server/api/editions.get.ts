import { listEditionDates } from '../utils/edition-cache'

/** Returns all available edition dates, newest first. */
export default defineEventHandler(async () => {
  return { dates: await listEditionDates() }
})
