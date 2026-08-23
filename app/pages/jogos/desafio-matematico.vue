<script setup lang="ts">
import {
  CORRECT_ANSWERS_PER_LEVEL,
  generateMathChallenge,
  mathDifficulty,
  mathGameLevel
} from '~/utils/math-game'
import type { MathChallenge } from '~/utils/math-game'

useSeoMeta({
  title: 'Desafio matemático — OpenVest',
  description: 'Um jogo de operações matemáticas com dificuldade progressiva.'
})

const BEST_SCORE_KEY = 'openvest:math-game:best-score'
const gameStarted = ref(false)
const challenge = ref<MathChallenge | null>(null)
const selectedAnswer = ref<number | null>(null)
const answered = ref(false)
const correctAnswers = ref(0)
const attempts = ref(0)
const score = ref(0)
const bestScore = ref(0)
const streak = ref(0)
const bestStreak = ref(0)

const introFeatures = [
  { icon: 'i-lucide-gauge', label: 'Dificuldade progressiva' },
  { icon: 'i-lucide-flame', label: 'Bônus por sequência' },
  { icon: 'i-lucide-trophy', label: 'Recorde local' }
]

const level = computed(() => mathGameLevel(correctAnswers.value))
const difficulty = computed(() => mathDifficulty(level.value))
const levelProgress = computed(() => correctAnswers.value % CORRECT_ANSWERS_PER_LEVEL)
const accuracy = computed(() => {
  return attempts.value ? Math.round((correctAnswers.value / attempts.value) * 100) : 0
})
const feedback = computed(() => {
  if (!answered.value || !challenge.value) {
    return ''
  }

  return selectedAnswer.value === challenge.value.answer
    ? 'Muito bem! Você acertou.'
    : `A resposta correta era ${challenge.value.answer}.`
})
const feedbackColor = computed(() => {
  return selectedAnswer.value === challenge.value?.answer ? 'success' : 'error'
})
const gameStats = computed(() => [
  { icon: 'i-lucide-star', value: score.value, label: 'Pontuação' },
  { icon: 'i-lucide-trophy', value: bestScore.value, label: 'Recorde' },
  { icon: 'i-lucide-flame', value: streak.value, label: 'Sequência' },
  { icon: 'i-lucide-target', value: `${accuracy.value}%`, label: 'Aproveitamento' }
])

onMounted(() => {
  const savedBestScore = Number.parseInt(localStorage.getItem(BEST_SCORE_KEY) ?? '0', 10)
  bestScore.value = Number.isFinite(savedBestScore) ? Math.max(0, savedBestScore) : 0
})

function startGame() {
  correctAnswers.value = 0
  attempts.value = 0
  score.value = 0
  streak.value = 0
  bestStreak.value = 0
  gameStarted.value = true
  nextChallenge()
}

function selectAnswer(answer: number) {
  if (answered.value || !challenge.value) {
    return
  }

  selectedAnswer.value = answer
  answered.value = true
  attempts.value += 1

  if (answer === challenge.value.answer) {
    const answeredLevel = level.value
    const nextStreak = streak.value + 1
    correctAnswers.value += 1
    streak.value = nextStreak
    bestStreak.value = Math.max(bestStreak.value, nextStreak)
    score.value += answeredLevel * 100 + nextStreak * 10

    if (score.value > bestScore.value) {
      bestScore.value = score.value
      localStorage.setItem(BEST_SCORE_KEY, String(bestScore.value))
    }
  } else {
    streak.value = 0
  }
}

function nextChallenge() {
  selectedAnswer.value = null
  answered.value = false
  challenge.value = generateMathChallenge(level.value)
}

function answerColor(answer: number) {
  if (!answered.value || !challenge.value) {
    return 'neutral'
  }

  if (answer === challenge.value.answer) {
    return 'success'
  }

  return answer === selectedAnswer.value ? 'error' : 'neutral'
}
</script>

<template>
  <AppPage
    headline="Matemática"
    title="Desafio matemático"
    description="Resolva operações, mantenha sua sequência de acertos e avance por desafios cada vez maiores."
  >
    <template #links>
      <UButton
        label="Todos os jogos"
        icon="i-lucide-arrow-left"
        to="/jogos"
        color="neutral"
        variant="outline"
      />
    </template>

    <UCard
      v-if="!gameStarted"
      title="Pronto para começar?"
      description="Você avança de nível a cada três acertos. Não há limite de tempo: resolva cada operação no seu ritmo."
      variant="subtle"
      class="mx-auto w-full max-w-2xl"
    >
      <div class="grid gap-3 sm:grid-cols-3">
        <div
          v-for="feature in introFeatures"
          :key="feature.label"
          class="rounded-lg border border-default p-4 text-center"
        >
          <UIcon
            :name="feature.icon"
            class="mx-auto mb-2 size-6 text-primary"
          />
          <p class="font-medium text-highlighted">
            {{ feature.label }}
          </p>
        </div>
      </div>

      <template #footer>
        <UButton
          label="Começar desafio"
          icon="i-lucide-play"
          size="xl"
          block
          @click="startGame"
        />
      </template>
    </UCard>

    <template v-else-if="challenge">
      <StatGrid
        :items="gameStats"
        columns-class="sm:grid-cols-2 xl:grid-cols-4"
      />

      <UCard
        :title="`Nível ${level} · ${difficulty.label}`"
        :description="difficulty.description"
        class="mx-auto w-full max-w-3xl"
      >
        <div class="mb-8">
          <div class="mb-2 flex items-center justify-between gap-3 text-sm">
            <span class="text-muted">Progresso para o próximo nível</span>
            <span class="font-medium text-highlighted">
              {{ levelProgress }}/{{ CORRECT_ANSWERS_PER_LEVEL }} acertos
            </span>
          </div>
          <UProgress
            :model-value="levelProgress"
            :max="CORRECT_ANSWERS_PER_LEVEL"
            aria-label="Progresso para o próximo nível"
          />
        </div>

        <div class="text-center">
          <p class="text-sm font-medium tracking-wide text-muted uppercase">
            Quanto é?
          </p>
          <p
            class="my-5 text-5xl font-bold tracking-tight text-highlighted sm:text-6xl"
            aria-live="polite"
          >
            {{ challenge.expression }}
          </p>

          <div
            class="mx-auto grid max-w-xl grid-cols-2 gap-3"
            aria-label="Alternativas"
          >
            <UButton
              v-for="answer in challenge.choices"
              :key="answer"
              :label="String(answer)"
              :color="answerColor(answer)"
              :variant="answered && answer === challenge.answer ? 'solid' : 'outline'"
              size="xl"
              block
              :disabled="answered"
              @click="selectAnswer(answer)"
            />
          </div>
        </div>

        <UAlert
          v-if="answered"
          :title="feedback"
          :icon="feedbackColor === 'success' ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
          :color="feedbackColor"
          variant="subtle"
          class="mt-6"
          aria-live="assertive"
        />

        <template #footer>
          <div class="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <UButton
              label="Recomeçar"
              icon="i-lucide-rotate-ccw"
              color="neutral"
              variant="ghost"
              @click="startGame"
            />
            <UButton
              v-if="answered"
              label="Próximo desafio"
              trailing-icon="i-lucide-arrow-right"
              @click="nextChallenge"
            />
          </div>
        </template>
      </UCard>

      <p class="text-center text-sm text-muted">
        Melhor sequência nesta partida: {{ bestStreak }}
      </p>
    </template>
  </AppPage>
</template>
