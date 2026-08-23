<script setup lang="ts">
useSeoMeta({
  title: 'Jogos — OpenVest',
  description: 'Jogos educativos para praticar diferentes áreas do conhecimento.'
})

const games = [
  {
    title: 'Desafio matemático',
    description: 'Resolva operações, acumule pontos e avance por níveis cada vez mais difíceis.',
    icon: 'i-lucide-calculator',
    area: 'Matemática',
    status: 'Disponível',
    to: '/jogos/desafio-matematico'
  }
]
</script>

<template>
  <AppPage
    headline="Aprender jogando"
    title="Jogos"
    description="Desafios rápidos para praticar habilidades de diferentes áreas do conhecimento."
  >
    <UAlert
      title="Uma nova forma de praticar"
      description="Os jogos começam simples e aumentam o desafio conforme seu desempenho. Novas áreas serão adicionadas ao catálogo."
      icon="i-lucide-sparkles"
      color="primary"
      variant="subtle"
    />

    <UPageGrid class="sm:grid-cols-2 xl:grid-cols-3">
      <UCard
        v-for="game in games"
        :key="game.to"
        :title="game.title"
        :description="game.description"
        variant="subtle"
      >
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div class="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UIcon
                :name="game.icon"
                class="size-6"
              />
            </div>

            <UBadge
              :label="game.status"
              color="success"
              variant="soft"
            />
          </div>
        </template>

        <div class="flex items-center gap-2 text-sm text-muted">
          <UIcon
            name="i-lucide-book-open"
            class="size-4"
          />
          <span>{{ game.area }}</span>
        </div>

        <template #footer>
          <UButton
            label="Jogar agora"
            icon="i-lucide-play"
            :to="game.to"
            block
          />
        </template>
      </UCard>
    </UPageGrid>
  </AppPage>
</template>
