<template>
  <div>
    <NuxtLink
      to="/"
      class="mb-6 sm:mb-8 inline-flex items-center gap-1 rounded-md py-1.5 text-sm font-semibold text-accent underline-offset-4 hover:underline active:opacity-70"
    >
      <span aria-hidden="true">←</span> Back to today's edition
    </NuxtLink>

    <div v-if="pending" class="font-serif text-muted">Loading…</div>
    <div v-else-if="!paper" class="text-muted">Paper not found.</div>

    <article v-else class="max-w-measure">
      <h1 class="font-serif text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
        {{ paper.title }}
      </h1>

      <p class="mt-3 sm:mt-4 text-[13px] sm:text-sm text-muted leading-relaxed">
        {{ paper.authors?.join(', ') }}
        <span v-if="yearLabel" class="ml-1">({{ yearLabel }})</span>
      </p>

      <div class="mt-6 sm:mt-10">
        <h2 class="font-sans text-[11px] sm:text-xs font-bold uppercase tracking-widest text-muted">Summary</h2>
        <p class="mt-2 sm:mt-3 whitespace-pre-line text-[15px] sm:text-deck leading-relaxed text-ink">
          {{ paper.abstract }}
        </p>
      </div>

      <div class="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-6 border-t border-rule pt-6 sm:pt-8">
        <a
          v-if="paper.absUrl"
          :href="paper.absUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-5 py-3 sm:py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent/90 active:bg-accent/80"
        >
          View original paper ↗
        </a>
        <a
          v-if="paper.pdfUrl && paper.pdfUrl !== paper.absUrl"
          :href="paper.pdfUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-2 rounded-md border border-ink px-5 py-3 sm:py-2.5 text-sm font-semibold text-ink hover:bg-ink hover:text-paper active:opacity-80"
        >
          Download PDF ↗
        </a>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { Paper, Edition } from '~/types/frontend'

const route = useRoute()
const paperId = computed(() => decodeURIComponent(route.params.id as string))
const source = computed(() => route.params.source as string)

const { data: edition, pending } = await useFetch<Edition>('/api/edition', {
  key: 'daily-edition'
})

const paper = computed((): Paper | undefined => {
  if (!edition.value) return undefined
  const pool = poolForSource(source.value)
  return pool.find((p) => p.arxivId === paperId.value)
})

function poolForSource(src: string): Paper[] {
  if (!edition.value) return []
  switch (src) {
    case 'semantic-scholar':
      return edition.value.hciPapers ?? []
    default:
      return edition.value.papers ?? []
  }
}

const yearLabel = computed(() => {
  if (!paper.value?.published) return ''
  const y = paper.value.published.slice(0, 4)
  return y !== 'NaN' ? y : ''
})

watchEffect(() => {
  if (paper.value) {
    const t = paper.value.title
    const short = t.length > 72 ? `${t.slice(0, 72)}…` : t
    useHead({ title: `${short} — Lnews` })
  }
})
</script>
