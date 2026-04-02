<template>
  <div class="min-h-screen font-sans text-ink">
    <header class="border-b border-rule bg-paper">
      <div class="mx-auto max-w-edition px-4 py-3 sm:px-6">
        <div
          class="flex items-center justify-between gap-2 border-b border-rule pb-2 text-[11px] sm:text-xs uppercase tracking-widest text-muted"
        >
          <time :datetime="todayIso" class="shrink-0">{{ todayLabel }}</time>
          <nav class="flex gap-1 sm:gap-4">
            <NuxtLink
              to="/"
              class="rounded-md px-2.5 py-1.5 text-accent hover:bg-accent/5 active:bg-accent/10"
            >
              Today
            </NuxtLink>
            <NuxtLink
              to="/archive"
              class="rounded-md px-2.5 py-1.5 text-accent hover:bg-accent/5 active:bg-accent/10"
            >
              Archive
            </NuxtLink>
          </nav>
        </div>
        <div class="pt-4 pb-2 text-center sm:pt-6">
          <NuxtLink to="/" class="inline-block no-underline">
            <h1 class="font-serif text-masthead-sm sm:text-masthead font-bold tracking-tight text-ink">Lnews</h1>
          </NuxtLink>
          <p class="mt-1 font-sans text-[11px] sm:text-sm font-medium uppercase tracking-[0.25em] sm:tracking-[0.35em] text-muted">
            Research Daily
          </p>
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-edition px-4 py-6 sm:px-6 sm:py-10">
      <slot />
    </main>
    <footer class="border-t border-double border-ink bg-paper px-4 py-6 sm:py-8 pb-safe-bottom text-center text-xs sm:text-sm text-muted">
      <p class="font-serif text-ink">Lnews</p>
      <p class="mt-2 max-w-measure mx-auto px-2 leading-relaxed">
        Sources: arXiv, Semantic Scholar, Gemini web search. Not a peer-review substitute; original papers linked.
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
const todayLabel = computed(() =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Berlin'
  }).format(new Date())
)
const todayIso = computed(() => new Date().toISOString().slice(0, 10))
</script>
