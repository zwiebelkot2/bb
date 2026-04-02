import { fetchArxivRecent } from './arxiv'
import { editionDateKey, writeEdition } from './edition-cache'
import { curateWithOptionalLLM } from './curate-llm'
import { fetchGeminiWebDigest } from './gemini-web-digest'
import { fetchSemanticScholarHCI } from './semantic-scholar'
import { resolveGeminiWebPrompt } from './load-gemini-prompt'
import type { EditionPayload, SciencePaper } from '../types/paper'

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

  const [raw, hciRaw] = await Promise.all([
    fetchArxivRecent(48),
    withTimeout(fetchSemanticScholarHCI(25), 8000, 'Semantic Scholar', [] as SciencePaper[])
  ])

  const { papers, usedLLM } = await curateWithOptionalLLM(
    raw,
    config.openaiApiKey,
    config.scienceCuratorPrompt
  )

  let geminiPapers: SciencePaper[] = []
  let geminiSearchQueries: string[] | undefined
  const gKey = config.geminiApiKey?.trim()
  const gPrompt = await resolveGeminiWebPrompt(config.geminiWebPrompt)
  if (gKey && gPrompt) {
    const model = (config.geminiModel || 'gemini-2.5-flash').trim()
    const result = await withTimeout(
      fetchGeminiWebDigest(gKey, model, gPrompt),
      10000,
      'Gemini web digest',
      null
    )
    if (result) {
      geminiPapers = result.papers.map((p) => ({ ...p, source: 'gemini' }))
      geminiSearchQueries = result.searchQueries
    }
  }

  const hciPapers = hciRaw.map((p) => ({ ...p, source: 'semantic-scholar' }))

  const payload: EditionPayload = {
    dateKey,
    fetchedAt: new Date().toISOString(),
    papers: papers.map((p) => ({ ...p, source: 'arxiv' })),
    curatedWithLLM: usedLLM,
    geminiPapers: geminiPapers.length ? geminiPapers : undefined,
    hciPapers: hciPapers.length ? hciPapers : undefined,
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
