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

export async function buildAndStoreEdition(config: CuratorConfig): Promise<EditionPayload> {
  const dateKey = editionDateKey()

  const [raw, hciRaw] = await Promise.all([
    fetchArxivRecent(48),
    fetchSemanticScholarHCI(25).catch((e) => {
      console.warn('[build-edition] Semantic Scholar failed:', e)
      return [] as SciencePaper[]
    })
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
    const result = await fetchGeminiWebDigest(gKey, model, gPrompt)
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
  await writeEdition(payload)
  return payload
}
