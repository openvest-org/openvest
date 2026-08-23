<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import {
  loadQuestionCatalog,
  questionDescription,
  questionTitle
} from '~/data/questions'
import type { QuestionSummary } from '~/types/question'

interface ProgressRow {
  question: string
  area: string
  result: string
  attempts: number
  lastAttempt: string
}

useSeoMeta({
  title: 'Perfil — OpenVest',
  description: 'Perfil local e progresso de estudos no OpenVest.'
})

const {
  profile,
  loading,
  error,
  initialize,
  updateDisplayName,
  clearQuestionProgress
} = useLocalProfile()

const toast = useToast()
const displayName = ref('')
const saving = ref(false)
const saved = ref(false)
const resetModalOpen = ref(false)
const resettingHistory = ref(false)
const questionCatalog = ref<QuestionSummary[]>([])
const catalogLoading = ref(true)
const catalogError = ref<string | null>(null)
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short'
})

const pageLinks = [
  {
    label: 'Resolver questões',
    to: '/questoes',
    icon: 'i-lucide-list-checks'
  }
]

const columns: TableColumn<ProgressRow>[] = [
  { accessorKey: 'question', header: 'Questão' },
  { accessorKey: 'area', header: 'Área' },
  { accessorKey: 'result', header: 'Resultado' },
  { accessorKey: 'attempts', header: 'Tentativas' },
  { accessorKey: 'lastAttempt', header: 'Última tentativa' }
]

const initials = computed(() => {
  return (profile.value?.displayName ?? 'Estudante')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
})

const availableQuestionIds = computed(() => {
  return new Set(questionCatalog.value.map(question => question.id))
})
const progressRecords = computed(() => {
  return Object.values(profile.value?.questionProgress ?? {})
    .filter(progress => availableQuestionIds.value.has(progress.questionId))
})
const hasQuestionHistory = computed(() => {
  return Boolean(Object.keys(profile.value?.questionProgress ?? {}).length)
})
const profileStatistics = computed(() => {
  const answered = progressRecords.value.length
  const correct = progressRecords.value.filter(progress => progress.isCorrect).length

  return {
    answered,
    attempts: progressRecords.value.reduce((total, progress) => total + progress.attempts, 0),
    accuracy: answered ? Math.round((correct / answered) * 100) : 0
  }
})

const statCards = computed(() => [
  {
    icon: 'i-lucide-circle-check-big',
    value: profileStatistics.value.answered,
    label: 'Questões respondidas'
  },
  {
    icon: 'i-lucide-target',
    value: `${profileStatistics.value.accuracy}%`,
    label: 'Taxa de acerto'
  },
  {
    icon: 'i-lucide-refresh-cw',
    value: profileStatistics.value.attempts,
    label: 'Tentativas registradas'
  }
])

const progressRows = computed<ProgressRow[]>(() => {
  return [...progressRecords.value]
    .sort((a, b) => b.lastAnsweredAt.localeCompare(a.lastAnsweredAt))
    .map((progress) => {
      const question = questionCatalog.value.find(item => item.id === progress.questionId)

      return {
        question: question ? questionTitle(question) : progress.questionId,
        area: question ? questionDescription(question) : 'Questão indisponível',
        result: progress.isCorrect ? 'Correta' : 'Incorreta',
        attempts: progress.attempts,
        lastAttempt: dateFormatter.format(new Date(progress.lastAnsweredAt))
      }
    })
})

watch(profile, (value) => {
  if (value) {
    displayName.value = value.displayName
  }
}, { immediate: true })

watch(displayName, () => {
  saved.value = false
})

onMounted(async () => {
  await Promise.all([initialize(), initializeCatalog()])
})

async function initializeCatalog() {
  try {
    questionCatalog.value = await loadQuestionCatalog()
  } catch {
    catalogError.value = 'Não foi possível carregar o catálogo de questões.'
  } finally {
    catalogLoading.value = false
  }
}

async function saveProfile() {
  if (!displayName.value.trim()) {
    return
  }

  saving.value = true
  saved.value = await updateDisplayName(displayName.value)
  saving.value = false
}

async function resetHistory() {
  resettingHistory.value = true
  const cleared = await clearQuestionProgress()
  resettingHistory.value = false

  if (!cleared) {
    return
  }

  resetModalOpen.value = false
  toast.add({
    title: 'Histórico apagado',
    description: 'O progresso das questões foi removido deste navegador.',
    icon: 'i-lucide-trash-2',
    color: 'success'
  })
}
</script>

<template>
  <AppPage
    headline="Dados locais"
    title="Perfil"
    description="Acompanhe seu progresso e personalize sua experiência neste navegador."
  >
    <UEmpty
      v-if="loading || catalogLoading"
      loading
      title="Carregando perfil local"
      description="Lendo seus dados salvos neste navegador."
    />

    <UAlert
      v-if="error"
      title="Problema no armazenamento local"
      :description="error"
      icon="i-lucide-database-zap"
      color="warning"
      variant="subtle"
    />

    <UAlert
      v-if="catalogError"
      title="Catálogo indisponível"
      :description="catalogError"
      icon="i-lucide-file-warning"
      color="warning"
      variant="subtle"
    />

    <template v-if="profile && !loading && !catalogLoading">
      <UCard>
        <template #header>
          <UUser
            :name="profile.displayName"
            description="Perfil local do OpenVest"
            :avatar="{ text: initials }"
            size="xl"
          />
        </template>

        <UFormField
          label="Nome de exibição:"
          :error="displayName.trim() ? undefined : 'Informe um nome.'"
        >
          <UInput
            v-model="displayName"
            name="displayName"
            placeholder="Seu nome ou apelido"
            autocomplete="nickname"
            class="w-80"
          />
        </UFormField>

        <template #footer>
          <UButton
            :label="saved ? 'Perfil salvo' : 'Salvar perfil'"
            :icon="saved ? 'i-lucide-check' : 'i-lucide-save'"
            :loading="saving"
            :disabled="!displayName.trim()"
            @click="saveProfile"
          />
        </template>
      </UCard>

      <StatGrid :items="statCards" />

      <UCard
        v-if="progressRows.length"
        title="Progresso em questões"
        description="Histórico registrado neste dispositivo."
      >
        <UTable
          :data="progressRows"
          :columns="columns"
        />
      </UCard>

      <UEmpty
        v-else
        icon="i-lucide-notebook-tabs"
        title="Nenhuma questão respondida"
        description="Seu progresso aparecerá aqui depois que você responder sua primeira questão."
        :actions="pageLinks"
        variant="outline"
      />

      <UCard
        title="Gerenciar histórico"
        description="Apague tentativas, respostas e estatísticas registradas neste navegador."
      >
        <UButton
          label="Resetar histórico"
          icon="i-lucide-trash-2"
          color="error"
          variant="soft"
          :disabled="!hasQuestionHistory"
          @click="resetModalOpen = true"
        />
      </UCard>

      <UModal
        v-model:open="resetModalOpen"
        title="Apagar o histórico de questões?"
        description="Esta ação removerá todas as tentativas, respostas e estatísticas deste navegador. Seu nome de perfil será mantido."
      >
        <template #footer>
          <UButton
            label="Cancelar"
            color="neutral"
            variant="ghost"
            :disabled="resettingHistory"
            @click="resetModalOpen = false"
          />
          <UButton
            label="Apagar histórico"
            icon="i-lucide-trash-2"
            color="error"
            :loading="resettingHistory"
            @click="resetHistory"
          />
        </template>
      </UModal>

      <UAlert
        title="Seus dados permanecem com você"
        description="O perfil e o progresso são armazenados no navegador. Eles ainda não são sincronizados entre dispositivos."
        icon="i-lucide-shield-check"
        color="neutral"
        variant="subtle"
      />
    </template>
  </AppPage>
</template>
