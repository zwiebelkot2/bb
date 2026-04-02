<template>
  <div>
    <div v-if="pending" class="font-serif text-xl text-muted" role="status">
      Loading today's edition…
    </div>
    <div v-else-if="error" class="rounded border border-rule bg-white p-6 text-deck text-muted">
      Could not load today's edition. Please try again later.
    </div>
    <template v-else-if="edition">
      <p class="mb-6 sm:mb-8 border-b border-rule pb-3 sm:pb-4 text-center text-[11px] sm:text-xs uppercase tracking-widest text-muted">
        Updated
        <time :datetime="edition.fetchedAt" class="text-ink">{{ fetchedLabel }}</time>
      </p>

      <template v-if="edition.geminiPapers?.length">
        <div class="mb-3 sm:mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="font-sans text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-accent">
            Daily Research · Web Search
          </h2>
          <span class="text-[10px] uppercase tracking-wide text-muted">
            {{ edition.geminiPapers.length }} papers · 2024+
          </span>
        </div>
        <div class="mb-8 sm:mb-14 grid gap-6 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
          <PaperCard v-for="p in edition.geminiPapers" :key="p.arxivId" :paper="p" />
        </div>
        <hr class="mb-8 sm:mb-14 border-double border-ink" />
      </template>

      <template v-if="edition.hciPapers?.length">
        <div class="mb-3 sm:mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="font-sans text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-accent">
            Human–Computer Interaction
          </h2>
          <span class="text-[10px] uppercase tracking-wide text-muted">
            Semantic Scholar · {{ edition.hciPapers.length }} papers
          </span>
        </div>
        <div class="mb-8 sm:mb-14 grid gap-6 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
          <PaperCard v-for="p in edition.hciPapers" :key="p.arxivId" :paper="p" />
        </div>
        <hr class="mb-8 sm:mb-14 border-double border-ink" />
      </template>

      <template v-if="edition.papers?.length">
        <div class="mb-3 sm:mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="font-sans text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-accent">
            Preprints · arXiv
          </h2>
          <span class="text-[10px] uppercase tracking-wide text-muted">
            {{ edition.papers.length }} papers
          </span>
        </div>
        <div class="grid gap-6 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
          <PaperCard v-for="p in edition.papers" :key="p.arxivId" :paper="p" />
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Edition } from '~/types/frontend'

const { data: edition, pending, error } = await useFetch<Edition>('/api/edition', {
  key: 'daily-edition'
})

const fetchedLabel = computed(() => {
  if (!edition.value?.fetchedAt) return ''
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Berlin'
  }).format(new Date(edition.value.fetchedAt))
})
</script>
