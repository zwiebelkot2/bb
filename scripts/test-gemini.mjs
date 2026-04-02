/**
 * Kurztest: Gemini + Google Search Grounding.
 * Aufruf: node scripts/test-gemini.mjs
 * Lädt optional Werte aus .env im Projektroot (einfaches KEY=value pro Zeile).
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadDotEnv() {
  const p = join(root, '.env')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    let v = t.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (k && process.env[k] === undefined) process.env[k] = v
  }
}

loadDotEnv()

const apiKey = process.env.GEMINI_API_KEY || process.env.NUXT_GEMINI_API_KEY
const model = (process.env.NUXT_GEMINI_MODEL || 'gemini-2.5-flash').trim()

if (!apiKey) {
  console.error(
    'Kein API-Key: Lege im Projektroot eine Datei .env an mit\n  GEMINI_API_KEY=…\n  oder\n  NUXT_GEMINI_API_KEY=…'
  )
  process.exit(1)
}

// Kurzer Such-Test (weniger Tokens als der volle Redaktions-Prompt)
const testPrompt =
  'Use Google Search: Name one very recent scientific preprint or paper from arXiv or a major journal (last few days), with author and title. One short paragraph. Only cite if found via search.'

const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey
  },
  body: JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: testPrompt }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
  })
})

const bodyText = await res.text()
if (!res.ok) {
  console.error('HTTP', res.status)
  console.error(bodyText.slice(0, 1500))
  process.exit(1)
}

let data
try {
  data = JSON.parse(bodyText)
} catch {
  console.error('Ungültige JSON-Antwort:', bodyText.slice(0, 500))
  process.exit(1)
}

const parts = data.candidates?.[0]?.content?.parts ?? []
const text = parts.map((p) => p.text ?? '').join('').trim()
const chunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []

console.log('--- Modell-Antwort ---\n')
console.log(text || '(leer)')
console.log('\n--- Quellen (Grounding) ---')
if (!chunks.length) console.log('(keine — evtl. keine Suche ausgelöst oder Metadaten fehlen)')
else {
  for (const c of chunks.slice(0, 8)) {
    const w = c.web
    if (w?.uri) console.log('-', w.title || '?', '\n ', w.uri)
  }
}
console.log('\nOK — Gemini + Websuche antwortet.')
