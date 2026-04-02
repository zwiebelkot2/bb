import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const DEFAULT_FILE = join(process.cwd(), 'prompts', 'gemini-web.txt')

/**
 * Prompt-Reihenfolge: 1) NUXT_GEMINI_WEB_PROMPT aus der Umgebung, 2) Datei prompts/gemini-web.txt
 */
export async function resolveGeminiWebPrompt(fromEnv: string | undefined): Promise<string> {
  const env = fromEnv?.trim()
  if (env) return env
  try {
    return (await readFile(DEFAULT_FILE, 'utf-8')).trim()
  } catch {
    return ''
  }
}
