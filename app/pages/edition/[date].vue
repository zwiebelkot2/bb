<template>
  <div>
    <NuxtLink
      to="/archive"
      class="mb-4 sm:mb-6 inline-flex items-center gap-1 rounded-md py-1.5 text-sm font-semibold text-accent hover:underline active:opacity-70"
    >
      <span aria-hidden="true">←</span> Back to Archive
    </NuxtLink>
    <h2 class="mb-6 sm:mb-8 font-serif text-2xl sm:text-3xl font-bold">
      {{ formattedDate }}
    </h2>

    <div v-if="pending" class="text-muted">Loading…</div>
    <div v-else-if="error" class="text-muted">Edition not found.</div>
    <template v-else-if="edition">
      <div
        v-if="geminiNotice"
        class="mb-4 rounded border border-rule bg-white px-4 py-3 text-sm text-muted"
      >
        {{ geminiNotice }}
      </div>

      <template v-if="edition.geminiPapers?.length">
        <h3 class="mb-3 sm:mb-4 font-sans text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-accent">
          Daily Research · Web Search
        </h3>
        <div class="mb-8 sm:mb-14 grid gap-6 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
          <PaperCard v-for="p in edition.geminiPapers" :key="p.arxivId" :paper="p" />
        </div>
        <hr class="mb-8 sm:mb-14 border-double border-ink" />
      </template>

      <div
        v-if="hciNotice"
        class="mb-4 rounded border border-rule bg-white px-4 py-3 text-sm text-muted"
      >
        {{ hciNotice }}
      </div>

      <template v-if="edition.hciPapers?.length">
        <h3 class="mb-3 sm:mb-4 font-sans text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-accent">
          Human–Computer Interaction
        </h3>
        <div class="mb-8 sm:mb-14 grid gap-6 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
          <PaperCard v-for="p in edition.hciPapers" :key="p.arxivId" :paper="p" />
        </div>
        <hr class="mb-8 sm:mb-14 border-double border-ink" />
      </template>

      <template v-if="edition.papers?.length">
        <h3 class="mb-3 sm:mb-4 font-sans text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-accent">
          Preprints · arXiv
        </h3>
        <div class="grid gap-6 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
          <PaperCard v-for="p in edition.papers" :key="p.arxivId" :paper="p" />
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Edition } from '~/types/frontend'

const route = useRoute()
const dateKey = computed(() => route.params.date as string)

const { data: edition, pending, error } = await useFetch<Edition>(
  () => `/api/edition?date=${dateKey.value}`,
  { key: `edition-${dateKey.value}` }
)

const formattedDate = computed(() => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(dateKey.value + 'T12:00:00'))
  } catch {
    return dateKey.value
  }
})

const geminiNotice = computed(() => {
  if (!edition.value || edition.value.geminiPapers?.length) return ''
  if (edition.value.geminiStatus === 'not-configured') {
    return 'Gemini web source was not configured on this edition.'
  }
  if (edition.value.geminiStatus === 'unavailable') {
    return 'Gemini web source was unavailable for this edition.'
  }
  return ''
})

const hciNotice = computed(() => {
  if (!edition.value || edition.value.hciPapers?.length) return ''
  if (edition.value.hciStatus === 'unavailable') {
    return 'Semantic Scholar source was unavailable for this edition.'
  }
  return ''
})
</script>
