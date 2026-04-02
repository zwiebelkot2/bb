import type { SciencePaper } from '../types/paper'

interface CurateResult {
  papers: SciencePaper[]
  usedLLM: boolean
}

/**
 * Optional: with OPENAI_API_KEY + prompt from runtime config, pick a subset
 * and generate short one-line summaries (dek).
 */
export async function curateWithOptionalLLM(
  papers: SciencePaper[],
  apiKey: string | undefined,
  userPrompt: string | undefined
): Promise<CurateResult> {
  if (!apiKey || !userPrompt?.trim()) {
    return { papers: papers.slice(0, 18), usedLLM: false }
  }

  const shortList = papers.slice(0, 36).map((p, i) => ({
    i,
    title: p.title,
    abstract: p.abstract.slice(0, 500),
    category: p.primaryCategory
  }))

  const body = {
    model: 'gpt-4o-mini',
    temperature: 0.3,
    response_format: { type: 'json_object' as const },
    messages: [
      {
        role: 'system' as const,
        content:
          'You are a science editor. Respond only with valid JSON: {"items":[{"index":number,"dek":"one-line English summary, max 140 chars"}]} — at most 16 items, only serious research.'
      },
      {
        role: 'user' as const,
        content: `${userPrompt}\n\nPapers (index, title, abstract excerpt, category):\n${JSON.stringify(shortList)}`
      }
    ]
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      console.warn('[curate-llm] OpenAI error', res.status, await res.text())
      return { papers: papers.slice(0, 18), usedLLM: false }
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const text = data.choices?.[0]?.message?.content
    if (!text) return { papers: papers.slice(0, 18), usedLLM: false }
    const parsed = JSON.parse(text) as {
      items?: { index: number; dek?: string }[]
    }
    const items = parsed.items ?? []
    const out: SciencePaper[] = []
    const seen = new Set<number>()
    for (const it of items) {
      if (typeof it.index !== 'number' || seen.has(it.index)) continue
      const p = papers[it.index]
      if (!p) continue
      seen.add(it.index)
      out.push({ ...p, dek: it.dek?.slice(0, 200) })
      if (out.length >= 16) break
    }
    if (out.length >= 8) return { papers: out, usedLLM: true }
  } catch (e) {
    console.warn('[curate-llm]', e)
  }
  return { papers: papers.slice(0, 18), usedLLM: false }
}
