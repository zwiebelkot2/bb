<template>
  <article class="border-b border-rule pb-5 sm:pb-0 sm:border-0">
    <NuxtLink
      :to="detailPath"
      class="group -mx-2 block rounded-lg px-2 py-1.5 no-underline active:bg-accent/5 sm:mx-0 sm:px-0 sm:py-0 sm:active:bg-transparent"
    >
      <h3
        class="font-serif text-lg font-bold leading-snug text-ink group-hover:text-accent sm:text-xl md:text-[1.35rem]"
      >
        {{ paper.title }}
      </h3>
    </NuxtLink>
    <p v-if="paper.abstract" class="mt-2 sm:mt-3 text-[13px] sm:text-sm leading-relaxed text-muted line-clamp-3">
      {{ paper.abstract }}
    </p>
    <p class="mt-2 sm:mt-3 text-[11px] sm:text-xs text-muted truncate">
      {{ authorLine }}
      <span v-if="yearLabel" class="ml-1">({{ yearLabel }})</span>
    </p>
  </article>
</template>

<script setup lang="ts">
import type { Paper } from '~/types/frontend'

const props = defineProps<{ paper: Paper }>()

const detailPath = computed(() => {
  const id = encodeURIComponent(props.paper.arxivId)
  const src = props.paper.source || 'arxiv'
  return `/paper/${src}/${id}`
})

const yearLabel = computed(() => {
  if (!props.paper.published) return ''
  const y = props.paper.published.slice(0, 4)
  return y !== 'NaN' ? y : ''
})

const authorLine = computed(() => {
  const a = props.paper.authors ?? []
  if (!a.length) return ''
  const shown = a.slice(0, 3).join(', ')
  return a.length > 3 ? `${shown} et al.` : shown
})
</script>
