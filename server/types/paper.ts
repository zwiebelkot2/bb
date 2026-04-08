export interface SciencePaper {
  arxivId: string
  title: string
  abstract: string
  published: string
  authors: string[]
  pdfUrl: string
  absUrl: string
  primaryCategory: string
  /** Kurzzeile, ggf. von KI gesetzt */
  dek?: string
  /** Quelle: z.B. 'arxiv' | 'semantic-scholar' */
  source?: string
}

export interface EditionPayload {
  dateKey: string
  fetchedAt: string
  papers: SciencePaper[]
  curatedWithLLM: boolean
  /** Semantic Scholar HCI-Papers */
  hciPapers?: SciencePaper[]
  /** HCI-Status: ok | unavailable */
  hciStatus?: 'ok' | 'unavailable'
}
