<template>
  <div>
    <h2 class="mb-6 sm:mb-8 font-serif text-2xl sm:text-3xl font-bold">Archive</h2>
    <div v-if="pending" class="text-muted">Loading…</div>
    <div v-else-if="!dates?.length" class="text-muted">No previous editions found.</div>
    <ul v-else class="divide-y divide-rule">
      <li v-for="d in dates" :key="d">
        <NuxtLink
          :to="`/edition/${d}`"
          class="group -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-4 no-underline active:bg-accent/5 sm:mx-0 sm:px-0"
        >
          <span class="font-serif text-base sm:text-lg font-semibold text-ink group-hover:text-accent">
            {{ formatDate(d) }}
          </span>
          <span class="shrink-0 text-[13px] sm:text-sm text-accent group-hover:underline">View →</span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const { data, pending } = await useFetch<{ dates: string[] }>('/api/editions')
const dates = computed(() => data.value?.dates ?? [])

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(iso + 'T12:00:00'))
  } catch {
    return iso
  }
}
</script>
