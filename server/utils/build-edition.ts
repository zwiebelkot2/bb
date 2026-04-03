import { fetchArxivRecent } from './arxiv'
import { editionDateKey, writeEdition } from './edition-cache'
import { curateWithOptionalLLM } from './curate-llm'
import { fetchGeminiWebDigest } from './gemini-web-digest'
import { fetchSemanticScholarHCI } from './semantic-scholar'
import { resolveGeminiWebPrompt } from './load-gemini-prompt'
import { resolveGeminiApiKey } from './resolve-gemini-key'
import type { EditionPayload, SciencePaper } from '../types/paper'

/** Must stay below Nitro `vercel.functions.maxDuration` (see nuxt.config). */
const GEMINI_FETCH_TIMEOUT_MS = 55_000
const SEMANTIC_SCHOLAR_TIMEOUT_MS = 22_000

type CuratorConfig = {
  openaiApiKey?: string
  scienceCuratorPrompt?: string
  geminiApiKey?: string
  geminiModel?: string
  geminiWebPrompt?: string
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

  const gKey = resolveGeminiApiKey(config)
  const gPrompt = await resolveGeminiWebPrompt(config.geminiWebPrompt)
  let geminiStatus: EditionPayload['geminiStatus'] = gKey ? 'unavailable' : 'not-configured'

  const model = (config.geminiModel || 'gemini-2.5-flash').trim()
  const geminiPromise =
    gKey && gPrompt
      ? withTimeout(
          fetchGeminiWebDigest(gKey, model, gPrompt),
          GEMINI_FETCH_TIMEOUT_MS,
          'Gemini web digest',
          null
        )
      : Promise.resolve(null)

  // Run arXiv, Semantic Scholar, and Gemini in parallel so total wall time fits Vercel maxDuration.
  const [raw, hciRaw, geminiResult] = await Promise.all([
    fetchArxivRecent(48),
    withTimeout(fetchSemanticScholarHCI(25), SEMANTIC_SCHOLAR_TIMEOUT_MS, 'Semantic Scholar', [] as SciencePaper[]),
    geminiPromise
  ])

  const { papers, usedLLM } = await curateWithOptionalLLM(
    raw,
    config.openaiApiKey,
    config.scienceCuratorPrompt
  )

  let geminiPapers: SciencePaper[] = []
  let geminiSearchQueries: string[] | undefined
  if (geminiResult?.papers?.length) {
    geminiPapers = geminiResult.papers.map((p) => ({ ...p, source: 'gemini' }))
    geminiSearchQueries = geminiResult.searchQueries
    geminiStatus = 'ok'
  }

  const hciPapers = hciRaw.map((p) => ({ ...p, source: 'semantic-scholar' }))
  const hciStatus: EditionPayload['hciStatus'] = hciPapers.length ? 'ok' : 'unavailable'

  const payload: EditionPayload = {
    dateKey,
    fetchedAt: new Date().toISOString(),
    papers: papers.map((p) => ({ ...p, source: 'arxiv' })),
    curatedWithLLM: usedLLM,
    geminiPapers: geminiPapers.length ? geminiPapers : undefined,
    geminiStatus,
    hciPapers: hciPapers.length ? hciPapers : undefined,
    hciStatus,
    geminiSearchQueries
  }
  try {
    await writeEdition(payload)
  } catch (e) {
    // Do not fail the request if cache write is unavailable in serverless runtime.
    console.warn('[build-edition] cache write failed:', e)
  }
  return payload
}
