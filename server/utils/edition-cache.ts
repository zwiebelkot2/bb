import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { EditionPayload } from '../types/paper'

const CACHE_DIR =
  process.env.LNEWS_CACHE_DIR?.trim() ||
  (process.env.VERCEL ? '/tmp/lnews-data' : join(process.cwd(), '.data'))

function editionFile(dateKey: string) {
  return join(CACHE_DIR, `edition-${dateKey}.json`)
}

export function editionDateKey(d = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' })
}

export async function readCachedEdition(dateKey?: string): Promise<EditionPayload | null> {
  const key = dateKey ?? editionDateKey()
  try {
    const raw = await readFile(editionFile(key), 'utf-8')
    return JSON.parse(raw) as EditionPayload
  } catch {
    return null
  }
}

export async function writeEdition(payload: EditionPayload): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true })
  await writeFile(editionFile(payload.dateKey), JSON.stringify(payload, null, 2), 'utf-8')
}

export function isSameEditionDay(cached: EditionPayload | null, dateKey: string): boolean {
  return cached !== null && cached.dateKey === dateKey
}

/** Returns available edition date keys, newest first. */
export async function listEditionDates(): Promise<string[]> {
  try {
    const files = await readdir(CACHE_DIR)
    return files
      .filter((f) => f.startsWith('edition-') && f.endsWith('.json'))
      .map((f) => f.replace('edition-', '').replace('.json', ''))
      .sort()
      .reverse()
  } catch {
    return []
  }
}
