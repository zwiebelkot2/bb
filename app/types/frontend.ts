export interface Paper {
  arxivId: string
  title: string
  abstract: string
  published: string
  authors: string[]
  pdfUrl: string
  absUrl: string
  primaryCategory: string
  dek?: string
  source?: string
}

export interface Edition {
  dateKey: string
  fetchedAt: string
  papers: Paper[]
  curatedWithLLM: boolean
  geminiPapers?: Paper[]
  geminiStatus?: 'ok' | 'not-configured' | 'unavailable'
  hciPapers?: Paper[]
  hciStatus?: 'ok' | 'unavailable'
  geminiSearchQueries?: string[]
}
