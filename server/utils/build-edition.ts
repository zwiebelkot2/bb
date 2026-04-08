import { fetchArxivRecent } from './arxiv'
import { editionDateKey, writeEdition } from './edition-cache'
import { fetchSemanticScholarHCI } from './semantic-scholar'
import type { EditionPayload, SciencePaper } from '../types/paper'

const SEMANTIC_SCHOLAR_TIMEOUT_MS = 22_000

type CuratorConfig = {
  // bewusst leer: Cron/Prompt/LLM-Logik wird später wieder integriert
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
  fallback: T
): Promise<T> {
  const timeout = new Promise<T>((resolve) => {
    setTimeout(() => {
      console.warn(`[build-edition] ${label} timed out after ${timeoutMs}ms`)
      resolve(fallback)
    }, timeoutMs)
  })
  return Promise.race([promise, timeout]).catch((e) => {
    console.warn(`[build-edition] ${label} failed:`, e)
    return fallback
  })
}

export async function buildAndStoreEdition(config: CuratorConfig): Promise<EditionPayload> {
  const dateKey = editionDateKey()

  // Run arXiv and Semantic Scholar in parallel.
  const [raw, hciRaw] = await Promise.all([
    fetchArxivRecent(48),
    withTimeout(fetchSemanticScholarHCI(25), SEMANTIC_SCHOLAR_TIMEOUT_MS, 'Semantic Scholar', [] as SciencePaper[])
  ])

  // Keine LLM-Curation: deterministische Shortlist.
  const papers = raw.slice(0, 18)
  const usedLLM = false

  const hciPapers = hciRaw.map((p) => ({ ...p, source: 'semantic-scholar' }))
  const hciStatus: EditionPayload['hciStatus'] = hciPapers.length ? 'ok' : 'unavailable'

  const payload: EditionPayload = {
    dateKey,
    fetchedAt: new Date().toISOString(),
    papers: papers.map((p) => ({ ...p, source: 'arxiv' })),
    curatedWithLLM: usedLLM,
    hciPapers: hciPapers.length ? hciPapers : undefined,
    hciStatus
  }
  try {
    await writeEdition(payload)
  } catch (e) {
    // Do not fail the request if cache write is unavailable in serverless runtime.
    console.warn('[build-edition] cache write failed:', e)
  }
  return payload
}
