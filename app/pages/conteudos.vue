<script setup lang="ts">
import {
  loadStudyContentCatalog,
  normalizeStudySearchTerm
} from '~/data/study-content'
import type {
  StudyArea,
  StudyContentCatalog,
  StudyTopic
} from '~/types/study-content'

useSeoMeta({
  title: 'Conteúdos — OpenVest',
  description: 'Assuntos de vestibulares e recursos externos selecionados para estudo.'
})

const catalog = ref<StudyContentCatalog | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)
const selectedExam = ref('')
const selectedArea = ref('all')
const selectedKind = ref('all')
const searchQuery = ref('')

const examOptions = computed(() => {
  return (catalog.value?.exams ?? []).map(exam => ({
    label: exam.title,
    value: exam.id
  }))
})
const activeExam = computed(() => {
  return catalog.value?.exams.find(exam => exam.id === selectedExam.value) ?? null
})
const areaOptions = computed(() => [
  { label: 'Todas as áreas', value: 'all' },
  ...(activeExam.value?.areas.map(area => ({
    label: area.title,
    value: area.id
  })) ?? [])
])
const kindOptions = [
  { label: 'Todos os formatos', value: 'all' },
  { label: 'Textos', value: 'article' },
  { label: 'Vídeos', value: 'video' },
  { label: 'Cursos', value: 'course' },
  { label: 'Referências oficiais', value: 'reference' }
]
const normalizedQuery = computed(() => normalizeStudySearchTerm(searchQuery.value))
const groupedAreas = computed(() => {
  return (activeExam.value?.areas ?? [])
    .filter(area => selectedArea.value === 'all' || area.id === selectedArea.value)
    .map(area => ({
      ...area,
      topics: area.topics.filter(topic => topicMatchesFilters(topic, area))
    }))
    .filter(area => area.topics.length)
})
const visibleTopicCount = computed(() => {
  return groupedAreas.value.reduce((total, area) => total + area.topics.length, 0)
})
const visibleResourceCount = computed(() => {
  return groupedAreas.value.reduce((total, area) => {
    return total + area.topics.reduce((topicTotal, topic) => {
      return topicTotal + visibleResources(topic).length
    }, 0)
  }, 0)
})
const filtersActive = computed(() => {
  return selectedArea.value !== 'all'
    || selectedKind.value !== 'all'
    || Boolean(normalizedQuery.value)
})
const reviewedAt = computed(() => {
  if (!catalog.value) {
    return ''
  }

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })
    .format(new Date(`${catalog.value.reviewedAt}T12:00:00`))
})

watch(selectedExam, () => {
  selectedArea.value = 'all'
})

onMounted(async () => {
  try {
    catalog.value = await loadStudyContentCatalog()
    selectedExam.value = catalog.value.exams[0]?.id ?? ''
  } catch {
    loadError.value = 'Não foi possível carregar o catálogo de conteúdos.'
  } finally {
    loading.value = false
  }
})

function topicMatchesFilters(topic: StudyTopic, area: StudyArea) {
  const resources = visibleResources(topic)

  if (!resources.length) {
    return false
  }

  if (!normalizedQuery.value) {
    return true
  }

  const searchableText = normalizeStudySearchTerm([
    topic.title,
    topic.description,
    area.title,
    ...topic.tags,
    ...topic.resources.flatMap(resource => [resource.title, resource.provider])
  ].join(' '))

  return normalizedQuery.value
    .split(' ')
    .every(term => searchableText.includes(term))
}

function visibleResources(topic: StudyTopic) {
  if (selectedKind.value === 'all') {
    return topic.resources
  }

  return topic.resources.filter(resource => resource.kind === selectedKind.value)
}

function resetFilters() {
  selectedArea.value = 'all'
  selectedKind.value = 'all'
  searchQuery.value = ''
}
</script>

<template>
  <AppPage
    headline="Biblioteca de estudo"
    title="Conteúdos"
    description="Encontre os principais assuntos dos vestibulares e materiais externos selecionados para aprofundar seus estudos."
  >
    <UEmpty
      v-if="loading"
      loading
      title="Carregando conteúdos"
      description="Preparando os assuntos e materiais de estudo."
    />

    <UAlert
      v-else-if="loadError"
      title="Catálogo indisponível"
      :description="loadError"
      icon="i-lucide-library-big"
      color="error"
      variant="subtle"
    />

    <template v-else-if="catalog && activeExam">
      <UAlert
        title="Curadoria inicial do ENEM"
        :description="`Os assuntos seguem a matriz oficial do exame. Os links foram revisados em ${reviewedAt} e abrem em sites externos.`"
        icon="i-lucide-sparkles"
        color="primary"
        variant="subtle"
      >
        <template #actions>
          <UButton
            label="Ver matriz oficial"
            icon="i-lucide-external-link"
            :to="activeExam.officialReference.url"
            target="_blank"
            rel="noopener noreferrer"
            color="neutral"
            variant="outline"
          />
        </template>
      </UAlert>

      <CatalogFilterCard
        v-model:search="searchQuery"
        title="Explorar assuntos"
        :description="`${visibleTopicCount} assuntos e ${visibleResourceCount} recursos encontrados.`"
        search-label="Buscar por assunto:"
        search-placeholder="Ex.: ecologia, funções ou cidadania"
        search-aria-label="Buscar assuntos de estudo"
        :filters-active="filtersActive"
        @reset="resetFilters"
      >
        <template #filters>
          <UFormField label="Vestibular:">
            <USelect
              v-model="selectedExam"
              :items="examOptions"
              aria-label="Selecionar vestibular"
            />
          </UFormField>

          <UFormField label="Área do conhecimento:">
            <USelect
              v-model="selectedArea"
              :items="areaOptions"
              aria-label="Filtrar área do conhecimento"
            />
          </UFormField>

          <UFormField label="Formato do material:">
            <USelect
              v-model="selectedKind"
              :items="kindOptions"
              aria-label="Filtrar formato do material"
            />
          </UFormField>
        </template>
      </CatalogFilterCard>

      <UEmpty
        v-if="!groupedAreas.length"
        icon="i-lucide-search-x"
        title="Nenhum assunto encontrado"
        description="Altere a busca ou limpe os filtros para visualizar outros conteúdos."
      />

      <section
        v-for="area in groupedAreas"
        v-else
        :key="area.id"
        class="space-y-5"
      >
        <div class="flex items-start gap-3">
          <UIcon
            :name="area.icon"
            class="mt-1 size-6 shrink-0 text-primary"
          />

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-xl font-semibold text-highlighted">
                {{ area.title }}
              </h2>
              <UBadge
                :label="`${area.topics.length} assuntos`"
                color="neutral"
                variant="soft"
              />
            </div>
            <p class="mt-1 text-sm text-muted">
              {{ area.description }}
            </p>
          </div>
        </div>

        <UPageGrid class="sm:grid-cols-2 xl:grid-cols-3">
          <StudyTopicCard
            v-for="topic in area.topics"
            :key="topic.id"
            :topic="topic"
            :resources="visibleResources(topic)"
          />
        </UPageGrid>
      </section>
    </template>
  </AppPage>
</template>
