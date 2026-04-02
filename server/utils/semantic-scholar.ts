import type { SciencePaper } from '../types/paper'

const S2_BASE = 'https://api.semanticscholar.org/graph/v1/paper/search'
const S2_FIELDS = 'title,abstract,authors,year,externalIds,url,publicationTypes,fieldsOfStudy,openAccessPdf'

const HCI_QUERIES = [
  'human computer interaction',
  'interaction design usability',
  'HCI user experience research'
]

interface S2Paper {
  paperId: string
  title?: string
  abstract?: string
  authors?: { name?: string }[]
  year?: number
  externalIds?: { DOI?: string; ArXiv?: string }
  url?: string
  fieldsOfStudy?: string[]
  openAccessPdf?: { url?: string }
}

interface S2Response {
  total?: number
  data?: S2Paper[]
}

export async function fetchSemanticScholarHCI(count = 25): Promise<SciencePaper[]> {
  const perQuery = Math.ceil(count / HCI_QUERIES.length)
  const all: SciencePaper[] = []
  const seen = new Set<string>()

  for (let qi = 0; qi < HCI_QUERIES.length; qi++) {
    if (all.length >= count) break
    if (qi > 0) await new Promise((r) => setTimeout(r, 5000))
    const q = HCI_QUERIES[qi]
    try {
      const params = new URLSearchParams({
        query: q,
        limit: String(Math.min(perQuery + 5, 50)),
        fields: S2_FIELDS,
        year: '2024-',
        fieldsOfStudy: 'Computer Science'
      })

      let res: Response | null = null
      for (let attempt = 0; attempt < 3; attempt++) {
        res = await fetch(`${S2_BASE}?${params}`, {
          headers: { 'User-Agent': 'Lnews/1.0' }
        })
        if (res.status !== 429) break
        console.warn(`[semantic-scholar] HTTP 429 on "${q}", retry ${attempt + 1}/3`)
        await new Promise((r) => setTimeout(r, 6000 * (attempt + 1)))
      }
      if (!res || !res.ok) {
        console.warn('[semantic-scholar] HTTP', res?.status ?? 'no response')
        continue
      }
      const data = (await res.json()) as S2Response
      for (const p of data.data ?? []) {
        if (!p.title?.trim() || !p.abstract?.trim()) continue
        const id = p.paperId || p.title
        if (seen.has(id)) continue
        seen.add(id)

        const doi = p.externalIds?.DOI
        const arxivId = p.externalIds?.ArXiv
        const absUrl = doi
          ? `https://doi.org/${doi}`
          : arxivId
            ? `https://arxiv.org/abs/${arxivId}`
            : p.url ?? ''
        const pdfUrl = p.openAccessPdf?.url ??
          (arxivId ? `https://arxiv.org/pdf/${arxivId}.pdf` : absUrl)

        all.push({
          arxivId: arxivId || p.paperId || '',
          title: p.title.trim(),
          abstract: p.abstract.trim(),
          published: p.year ? `${p.year}-01-01` : '',
          authors: (p.authors ?? []).map((a) => a.name ?? '').filter(Boolean),
          pdfUrl,
          absUrl,
          primaryCategory: 'cs.HC'
        })
        if (all.length >= count) break
      }
    } catch (e) {
      console.warn('[semantic-scholar]', e)
    }
  }
  return all.slice(0, count)
}
