import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { GEMINI_WEB_PROMPT_DEFAULT } from '../prompts/gemini-web-default'

const DEFAULT_FILE = join(process.cwd(), 'prompts', 'gemini-web.txt')

/**
 * Order: 1) NUXT_GEMINI_WEB_PROMPT env, 2) prompts/gemini-web.txt on disk,
 * 3) bundled default (required on Vercel — serverless bundle often has no prompts/ folder).
 */
export async function resolveGeminiWebPrompt(fromEnv: string | undefined): Promise<string> {
  const env = fromEnv?.trim()
  if (env) return env
  try {
    return (await readFile(DEFAULT_FILE, 'utf-8')).trim()
  } catch {
    return GEMINI_WEB_PROMPT_DEFAULT
  }
}
