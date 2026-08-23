import type { LocalProfile } from '~/types/profile'
import { readLocalProfile, writeLocalProfile } from '~/utils/profile-db'

let initializationPromise: Promise<void> | undefined

function createProfile(): LocalProfile {
  const now = new Date().toISOString()

  return {
    schemaVersion: 1,
    id: 'local',
    displayName: 'Estudante',
    createdAt: now,
    updatedAt: now,
    questionProgress: {}
  }
}

function normalizeProfile(profile: LocalProfile | null) {
  if (!profile || profile.schemaVersion !== 1) {
    return createProfile()
  }

  return {
    ...profile,
    questionProgress: profile.questionProgress ?? {}
  }
}

export function useLocalProfile() {
  const profile = useState<LocalProfile | null>('local-profile', () => null)
  const loading = useState('local-profile-loading', () => true)
  const initialized = useState('local-profile-initialized', () => false)
  const error = useState<string | null>('local-profile-error', () => null)

  const statistics = computed(() => {
    const progress = Object.values(profile.value?.questionProgress ?? {})
    const answered = progress.length
    const correct = progress.filter(item => item.isCorrect).length
    const attempts = progress.reduce((total, item) => total + item.attempts, 0)

    return {
      answered,
      correct,
      attempts,
      accuracy: answered ? Math.round((correct / answered) * 100) : 0
    }
  })

  async function initialize() {
    if (import.meta.server || initialized.value) {
      return
    }

    initializationPromise ??= (async () => {
      loading.value = true
      error.value = null

      try {
        const storedProfile = await readLocalProfile()
        const localProfile = normalizeProfile(storedProfile)

        if (!storedProfile) {
          await writeLocalProfile(localProfile)
        }

        profile.value = localProfile
      } catch {
        profile.value ??= createProfile()
        error.value = 'Não foi possível acessar o armazenamento local. O progresso desta sessão pode não ser salvo.'
      } finally {
        initialized.value = true
        loading.value = false
      }
    })().finally(() => {
      initializationPromise = undefined
    })

    await initializationPromise
  }

  async function persist(nextProfile: LocalProfile) {
    try {
      await writeLocalProfile(nextProfile)
      profile.value = nextProfile
      error.value = null
      return true
    } catch {
      error.value = 'Não foi possível salvar os dados no navegador.'
      return false
    }
  }

  async function updateDisplayName(displayName: string) {
    await initialize()

    if (!profile.value || !displayName.trim()) {
      return false
    }

    return persist({
      ...profile.value,
      displayName: displayName.trim(),
      updatedAt: new Date().toISOString()
    })
  }

  async function recordQuestionAttempt(questionId: string, selectedAnswer: string, correctAnswer: string) {
    await initialize()

    if (!profile.value) {
      return false
    }

    const now = new Date().toISOString()
    const previous = profile.value.questionProgress[questionId]

    return persist({
      ...profile.value,
      updatedAt: now,
      questionProgress: {
        ...profile.value.questionProgress,
        [questionId]: {
          questionId,
          selectedAnswer,
          isCorrect: selectedAnswer === correctAnswer,
          attempts: (previous?.attempts ?? 0) + 1,
          firstAnsweredAt: previous?.firstAnsweredAt ?? now,
          lastAnsweredAt: now
        }
      }
    })
  }

  async function clearQuestionProgress() {
    await initialize()

    if (!profile.value) {
      return false
    }

    return persist({
      ...profile.value,
      updatedAt: new Date().toISOString(),
      questionProgress: {}
    })
  }

  return {
    profile,
    loading,
    error,
    statistics,
    initialize,
    updateDisplayName,
    recordQuestionAttempt,
    clearQuestionProgress
  }
}
