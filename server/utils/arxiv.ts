import type { SciencePaper } from '../types/paper'

function stripAtomText(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function firstMatch(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return m ? stripAtomText(m[1]) : ''
}

function authorsFromEntry(block: string): string[] {
  const names: string[] = []
  for (const m of block.matchAll(/<author>\s*<name>([^<]+)<\/name>/gi)) {
    names.push(m[1].trim())
  }
  return names
}

function arxivIdFromEntryId(idUrl: string): string {
  const m = idUrl.match(/arxiv\.org\/abs\/([^?#]+)/i)
  return m ? m[1].replace(/v\d+$/i, '') : idUrl
}

/** Mehrere aktuelle arXiv-Kategorien, sortiert nach Einreichungsdatum */
const ARXIV_QUERY =
  '(cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:q-bio.NC OR cat:physics.soc-ph OR cat:stat.ML OR cat:econ.GN)'

export async function fetchArxivRecent(maxResults = 48): Promise<SciencePaper[]> {
  const params = new URLSearchParams({
    search_query: ARXIV_QUERY,
    sortBy: 'submittedDate',
    sortOrder: 'descending',
    max_results: String(maxResults)
  })
  const url = `http://export.arxiv.org/api/query?${params}`
  const res = await fetch(url, { headers: { 'User-Agent': 'Lnews/1.0 (science digest; contact: local)' } })
  if (!res.ok) throw new Error(`arXiv HTTP ${res.status}`)
  const xml = await res.text()
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)]
  const papers: SciencePaper[] = []
  for (const [, block] of entries) {
    if (!block) continue
    const idUrl = firstMatch(block, 'id')
    const arxivId = arxivIdFromEntryId(idUrl)
    const title = firstMatch(block, 'title')
    const summary = firstMatch(block, 'summary')
    const published = firstMatch(block, 'published')
    const pdfLink =
      block.match(/<link[^>]+title="pdf"[^>]+href="([^"]+)"/i)?.[1] ??
      `https://arxiv.org/pdf/${arxivId}.pdf`
    const primaryCategory =
      block.match(/<arxiv:primary_category[^>]+term="([^"]+)"/i)?.[1] ?? 'arxiv'
    papers.push({
      arxivId,
      title,
      abstract: summary,
      published,
      authors: authorsFromEntry(block),
      pdfUrl: pdfLink,
      absUrl: `https://arxiv.org/abs/${arxivId}`,
      primaryCategory
    })
  }
  return papers
}
