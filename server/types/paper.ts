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
  /** Quelle: 'arxiv' | 'gemini' | 'semantic-scholar' */
  source?: string
}

export interface EditionPayload {
  dateKey: string
  fetchedAt: string
  papers: SciencePaper[]
  curatedWithLLM: boolean
  /** Gemini-Websuche: strukturierte Paper */
  geminiPapers?: SciencePaper[]
  /** Gemini-Status: ok | not-configured | unavailable */
  geminiStatus?: 'ok' | 'not-configured' | 'unavailable'
  /** Semantic Scholar HCI-Papers */
  hciPapers?: SciencePaper[]
  /** HCI-Status: ok | unavailable */
  hciStatus?: 'ok' | 'unavailable'
  /** Suchanfragen die Gemini ausgeführt hat */
  geminiSearchQueries?: string[]
}
