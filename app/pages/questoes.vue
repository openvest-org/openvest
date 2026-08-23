<script setup lang="ts">
import {
  areaLabel,
  loadQuestionCatalog,
  loadQuestionSearchIndex,
  loadQuestions,
  normalizeQuestionSearchTerm,
  questionDescription,
  questionTitle
} from '~/data/questions'
import type { AlternativeId, LoadedQuestion, QuestionSummary } from '~/types/question'

useSeoMeta({
  title: 'Questões — OpenVest',
  description: 'Questões adaptadas para a experiência de estudo do OpenVest.'
})

const PAGE_SIZE = 10
const answers = ref<Record<string, AlternativeId | undefined>>({})
const revealed = ref<Record<string, boolean>>({})
const savingQuestion = ref<string | null>(null)
const questionCatalog = ref<QuestionSummary[]>([])
const loadedQuestions = ref<LoadedQuestion[]>([])
const catalogLoading = ref(true)
const loadingQuestions = ref(false)
const loadError = ref<string | null>(null)
const selectedYear = ref('all')
const selectedArea = ref('all')
const selectedLanguage = ref('all')
const searchQuery = ref('')
const searchIndex = shallowRef<Map<string, string> | null>(null)
const searchTerms = ref<string[]>([])
const appliedSearch = ref('')
const searchLoading = ref(false)
const searchError = ref<string | null>(null)
const page = ref(1)
const mounted = ref(false)
let loadSequence = 0
let searchSequence = 0
let searchTimer: ReturnType<typeof setTimeout> | undefined

const {
  profile,
  error: profileError,
  initialize,
  recordQuestionAttempt
} = useLocalProfile()

const yearOptions = computed(() => [
  { label: 'Todos os anos', value: 'all' },
  ...[...new Set(questionCatalog.value.map(question => question.source.year))]
    .sort((a, b) => b - a)
    .map(year => ({ label: String(year), value: String(year) }))
])
const areaOptions = computed(() => [
  { label: 'Todas as áreas', value: 'all' },
  ...[...new Set(questionCatalog.value.map(question => question.area))]
    .sort((a, b) => areaLabel(a).localeCompare(areaLabel(b)))
    .map(area => ({ label: areaLabel(area), value: area }))
])
const languageOptions = [
  { label: 'Todos os idiomas', value: 'all' },
  { label: 'Sem variante', value: 'none' },
  { label: 'Inglês', value: 'en' },
  { label: 'Espanhol', value: 'es' }
]
const normalizedSearchQuery = computed(() => normalizeQuestionSearchTerm(searchQuery.value))
const filteredSummaries = computed(() => {
  return questionCatalog.value.filter((question) => {
    const matchesYear = selectedYear.value === 'all'
      || question.source.year === Number(selectedYear.value)
    const matchesArea = selectedArea.value === 'all'
      || question.area === selectedArea.value
    const matchesLanguage = selectedLanguage.value === 'all'
      || (selectedLanguage.value === 'none' && question.source.language === null)
      || question.source.language === selectedLanguage.value
    const matchesSearch = !normalizedSearchQuery.value
      || (
        appliedSearch.value === normalizedSearchQuery.value
        && searchTerms.value.every(term => searchIndex.value?.get(question.id)?.includes(term))
      )

    return matchesYear && matchesArea && matchesLanguage && matchesSearch
  })
})
const paginatedSummaries = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filteredSummaries.value.slice(start, start + PAGE_SIZE)
})
const filtersActive = computed(() => {
  return selectedYear.value !== 'all'
    || selectedArea.value !== 'all'
    || selectedLanguage.value !== 'all'
    || Boolean(normalizedSearchQuery.value)
})

onMounted(async () => {
  await initialize()

  for (const progress of Object.values(profile.value?.questionProgress ?? {})) {
    if (isAlternativeId(progress.selectedAnswer)) {
      answers.value[progress.questionId] = progress.selectedAnswer
      revealed.value[progress.questionId] = true
    }
  }

  try {
    questionCatalog.value = await loadQuestionCatalog()
  } catch {
    loadError.value = 'Não foi possível carregar o catálogo de questões.'
    catalogLoading.value = false
    return
  }

  catalogLoading.value = false
  mounted.value = true
  await loadCurrentPage()
})

watch([selectedYear, selectedArea, selectedLanguage, searchQuery], () => {
  page.value = 1
})

watch(searchQuery, (value) => {
  const normalized = normalizeQuestionSearchTerm(value)
  const sequence = ++searchSequence

  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  appliedSearch.value = ''
  searchTerms.value = []
  searchError.value = null

  if (!normalized) {
    searchLoading.value = false
    return
  }

  searchLoading.value = true
  searchTimer = setTimeout(async () => {
    try {
      searchIndex.value ??= await loadQuestionSearchIndex()

      if (sequence === searchSequence) {
        searchTerms.value = normalized.split(' ')
        appliedSearch.value = normalized
      }
    } catch {
      if (sequence === searchSequence) {
        searchError.value = 'Não foi possível carregar a busca textual.'
      }
    } finally {
      if (sequence === searchSequence) {
        searchLoading.value = false
      }
    }
  }, 250)
})

watch(paginatedSummaries, () => {
  if (mounted.value) {
    void loadCurrentPage()
  }
})

onBeforeUnmount(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
})

function isAlternativeId(value: string): value is AlternativeId {
  return ['A', 'B', 'C', 'D', 'E'].includes(value)
}

async function loadCurrentPage() {
  const sequence = ++loadSequence

  if (!paginatedSummaries.value.length) {
    loadedQuestions.value = []
    loadingQuestions.value = false
    return
  }

  loadingQuestions.value = true
  loadError.value = null

  try {
    const questions = await loadQuestions(paginatedSummaries.value)

    if (sequence === loadSequence) {
      loadedQuestions.value = questions
    }
  } catch {
    if (sequence === loadSequence) {
      loadedQuestions.value = []
      loadError.value = 'Não foi possível carregar as questões desta página.'
    }
  } finally {
    if (sequence === loadSequence) {
      loadingQuestions.value = false
    }
  }
}

function resetFilters() {
  selectedYear.value = 'all'
  selectedArea.value = 'all'
  selectedLanguage.value = 'all'
  searchQuery.value = ''
}

async function showAnswer(question: LoadedQuestion) {
  const selectedAnswer = answers.value[question.id]

  if (!selectedAnswer) {
    return
  }

  savingQuestion.value = question.id
  await recordQuestionAttempt(question.id, selectedAnswer, question.correctAlternative)
  revealed.value[question.id] = true
  savingQuestion.value = null
}

function isCorrect(question: LoadedQuestion) {
  return answers.value[question.id] === question.correctAlternative
}

function alternativeItems(question: LoadedQuestion) {
  return question.alternatives.map(alternative => ({
    label: `${alternative.id} — ${alternative.text}`,
    value: alternative.id
  }))
}

function correctAlternativeLabel(question: LoadedQuestion) {
  const alternative = question.alternatives.find(item => item.id === question.correctAlternative)
  return alternative ? `${alternative.id} — ${alternative.text}` : question.correctAlternative
}

function resultLabel(question: LoadedQuestion) {
  if (!revealed.value[question.id]) {
    return 'Ver resposta'
  }

  return isCorrect(question)
    ? `Resposta correta: ${correctAlternativeLabel(question)}`
    : `Resposta incorreta · Correta: ${correctAlternativeLabel(question)}`
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        headline="Banco de questões"
        title="Questões"
        description="Pratique com questões organizadas por vestibular e área do conhecimento."
      />

      <UPageBody>
        <UAlert
          title="Catálogo inicial"
          :description="`${questionCatalog.length} questões disponíveis neste dispositivo.`"
          icon="i-lucide-file-check-2"
          color="neutral"
          variant="subtle"
        />

        <UAlert
          v-if="profileError"
          title="O progresso pode não ser salvo"
          :description="profileError"
          icon="i-lucide-database-zap"
          color="warning"
          variant="subtle"
        />

        <UCard
          title="Filtros"
          :description="searchLoading
            ? 'Buscando no conteúdo das questões.'
            : `${filteredSummaries.length} questões encontradas.`"
        >
          <UPageList>
            <UFormField
              label="Buscar por texto:"
            >
              <UInput
                v-model="searchQuery"
                type="search"
                icon="i-lucide-search"
                placeholder="Digite uma palavra ou expressão"
                aria-label="Buscar questões por texto"
                class="w-full"
              />
            </UFormField>

            <UPageGrid class="mt-4">
              <UFormField label="Ano:">
                <USelect
                  v-model="selectedYear"
                  :items="yearOptions"
                  aria-label="Filtrar por ano"
                />
              </UFormField>

              <UFormField label="Área do conhecimento:">
                <USelect
                  v-model="selectedArea"
                  :items="areaOptions"
                  aria-label="Filtrar por área do conhecimento"
                />
              </UFormField>

              <UFormField label="Idioma:">
                <USelect
                  v-model="selectedLanguage"
                  :items="languageOptions"
                  aria-label="Filtrar por idioma"
                />
              </UFormField>
            </UPageGrid>

            <UAlert
              v-if="searchError"
              title="Busca indisponível"
              :description="searchError"
              icon="i-lucide-search-x"
              color="warning"
              variant="subtle"
            />
          </UPageList>

          <template
            v-if="filtersActive"
            #footer
          >
            <UButton
              label="Limpar filtros"
              icon="i-lucide-filter-x"
              color="neutral"
              variant="ghost"
              @click="resetFilters"
            />
          </template>
        </UCard>

        <UEmpty
          v-if="catalogLoading || searchLoading || loadingQuestions"
          loading
          title="Carregando questões"
          :description="catalogLoading
            ? 'Carregando o catálogo disponível neste dispositivo.'
            : searchLoading
              ? 'Pesquisando no conteúdo das questões.'
              : 'Apenas as questões desta página estão sendo carregadas.'"
        />

        <UAlert
          v-else-if="loadError"
          title="Falha ao carregar"
          :description="loadError"
          icon="i-lucide-triangle-alert"
          color="error"
          variant="subtle"
        />

        <UEmpty
          v-else-if="!loadedQuestions.length"
          icon="i-lucide-search-x"
          title="Nenhuma questão encontrada"
          description="Altere ou limpe os filtros para visualizar outras questões."
        />

        <UCard
          v-for="question in loadedQuestions"
          v-else
          :key="question.id"
          :title="questionTitle(question)"
          :description="questionDescription(question)"
        >
          <UPageList>
            <UCard
              v-for="stimulus in question.sharedStimuli"
              :key="stimulus.id"
              title="Texto de apoio compartilhado"
              :description="stimulus.text"
              variant="subtle"
            >
              <img
                v-for="media in stimulus.media"
                :key="media.id"
                :src="publicPath(media.path)"
                :alt="media.alt"
                width="560"
                loading="lazy"
                class="mx-auto h-auto max-h-96 max-w-full object-contain"
              >
            </UCard>

            <UAlert
              v-if="question.supportText"
              title="Texto de apoio"
              :description="question.supportText"
              icon="i-lucide-book-open"
              color="neutral"
              variant="subtle"
            />

            <UCard
              v-for="media in question.media"
              :key="media.id"
              variant="subtle"
            >
              <img
                :src="publicPath(media.path)"
                :alt="media.alt"
                width="560"
                loading="lazy"
                class="mx-auto h-auto max-h-96 max-w-full object-contain"
              >
            </UCard>

            <UAlert
              title="Enunciado"
              :description="question.statement"
              icon="i-lucide-circle-help"
              color="primary"
              variant="subtle"
            />

            <URadioGroup
              v-model="answers[question.id]"
              :items="alternativeItems(question)"
              :aria-label="question.statement"
              variant="card"
              size="lg"
              :disabled="revealed[question.id]"
            />

            <UAlert
              v-if="question.references.length"
              title="Fonte"
              :description="question.references.join(' ')"
              icon="i-lucide-library"
              color="neutral"
              variant="subtle"
            />
          </UPageList>

          <template #footer>
            <UButton
              :label="resultLabel(question)"
              :icon="revealed[question.id] ? (isCorrect(question) ? 'i-lucide-circle-check' : 'i-lucide-circle-x') : 'i-lucide-eye'"
              :color="revealed[question.id] ? (isCorrect(question) ? 'success' : 'error') : 'neutral'"
              :variant="revealed[question.id] ? 'soft' : 'outline'"
              :loading="savingQuestion === question.id"
              :disabled="!answers[question.id] || revealed[question.id]"
              @click="showAnswer(question)"
            />
          </template>
        </UCard>

        <UPagination
          v-if="filteredSummaries.length > PAGE_SIZE"
          v-model:page="page"
          :total="filteredSummaries.length"
          :items-per-page="PAGE_SIZE"
          show-edges
        />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
