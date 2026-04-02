import type { SciencePaper } from '../types/paper'

export interface GeminiPaper {
  title: string
  titleDe: string
  authors: string[]
  year: number
  abstract: string
  source: string
  url: string
  category: string
}

export interface WebDigestResult {
  papers: SciencePaper[]
  searchQueries?: string[]
}

type GeminiPart = { text?: string }

type GeminiCandidate = {
  content?: { parts?: GeminiPart[] }
  groundingMetadata?: {
    webSearchQueries?: string[]
    groundingChunks?: Array<{
      web?: { uri?: string; title?: string }
    }>
  }
}

export async function fetchGeminiWebDigest(
  apiKey: string,
  model: string,
  userPrompt: string
): Promise<WebDigestResult | null> {
  const trimmed = userPrompt.trim()
  if (!trimmed) return null

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const systemHint =
    'You are a science editor. Use Google web search to find real, recent papers (2024 or newer) ' +
    'from leading universities and journals. ' +
    'Respond ONLY with valid JSON in the format the user describes. ' +
    'No prose, no explanations outside the JSON. ' +
    'Do not invent titles, authors, or DOIs — only include what you can verify via search.'

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemHint}\n\n---\n\n${trimmed}` }]
          }
        ],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 16384
        }
      })
    })

    const raw = await res.text()
    if (!res.ok) {
      console.warn('[gemini-web] HTTP', res.status, raw.slice(0, 500))
      return null
    }

    const data = JSON.parse(raw) as {
      candidates?: GeminiCandidate[]
      error?: { message?: string }
    }
    if (data.error?.message) {
      console.warn('[gemini-web]', data.error.message)
      return null
    }

    const candidate = data.candidates?.[0]
    const parts = candidate?.content?.parts ?? []
    const text = parts.map((p) => p.text ?? '').join('').trim()
    if (!text) return null

    const meta = candidate?.groundingMetadata
    const searchQueries = (meta?.webSearchQueries ?? []).map((q) => q.trim()).filter(Boolean)

    const parsed = parseGeminiJson(text)
    if (!parsed.length) {
      console.warn('[gemini-web] Could not parse paper array from response:', text.slice(0, 400))
      return null
    }

    const papers = geminiPapersToSciencePapers(parsed)
    return {
      papers,
      searchQueries: searchQueries.length ? searchQueries : undefined
    }
  } catch (e) {
    console.warn('[gemini-web]', e)
    return null
  }
}

function parseGeminiJson(text: string): GeminiPaper[] {
  let cleaned = text.trim()

  // Strip all markdown code fences (there may be multiple)
  cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```/g, '').trim()

  // Find the outermost JSON object or array
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    const braceIdx = cleaned.indexOf('{')
    const bracketIdx = cleaned.indexOf('[')
    const startIdx = braceIdx >= 0 && bracketIdx >= 0
      ? Math.min(braceIdx, bracketIdx)
      : Math.max(braceIdx, bracketIdx)
    if (startIdx >= 0) cleaned = cleaned.slice(startIdx)
  }

  // Strategy 1: direct parse (possibly with bracket repair for truncated JSON)
  let attempt = cleaned
  for (let tries = 0; tries < 8; tries++) {
    try {
      const obj = JSON.parse(attempt)
      if (Array.isArray(obj)) return obj
      if (Array.isArray(obj?.papers)) return obj.papers
      return []
    } catch (e) {
      const msg = String(e)
      if (msg.includes('Unexpected end of JSON')) {
        // Truncated inside a string value — close the string, then close structures
        if (tries === 0) attempt += '"'
        attempt += '}]}'
      } else {
        break
      }
    }
  }

  // Strategy 2: extract individual paper objects via regex
  const paperRegex = /\{[^{}]*"title"\s*:\s*"[^"]+?"[^{}]*\}/g
  const matches = cleaned.match(paperRegex)
  if (matches?.length) {
    const papers: GeminiPaper[] = []
    for (const m of matches) {
      try {
        papers.push(JSON.parse(m))
      } catch { /* skip malformed */ }
    }
    if (papers.length) return papers
  }

  // Strategy 3: find the largest [...] block
  const arrMatch = cleaned.match(/\[[\s\S]*\]/)
  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]) } catch { /* noop */ }
  }

  return []
}

function geminiPapersToSciencePapers(items: GeminiPaper[]): SciencePaper[] {
  const out: SciencePaper[] = []
  const seen = new Set<string>()
  for (const p of items) {
    const title = (p.titleDe || p.title || '').trim()
    if (!title) continue
    const key = title.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    const catMap: Record<string, string> = {
      hci: 'cs.HC',
      design: 'design',
      governance: 'governance',
      'computer science': 'cs.AI',
      biology: 'q-bio',
      chemistry: 'chem',
      physics: 'physics'
    }
    const cat = catMap[p.category?.toLowerCase()] ?? p.category ?? 'other'

    out.push({
      arxivId: `gemini-${out.length}`,
      title: p.title || p.titleDe,
      abstract: p.abstract || '',
      published: p.year ? `${p.year}-01-01` : '',
      authors: p.authors ?? [],
      pdfUrl: p.url || '',
      absUrl: p.url || '',
      primaryCategory: cat
    })
  }
  return out
}
