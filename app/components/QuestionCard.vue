<script setup lang="ts">
import {
  questionDescription,
  questionTitle
} from '~/data/questions'
import type { AlternativeId, LoadedQuestion } from '~/types/question'

const props = defineProps<{
  question: LoadedQuestion
  revealed: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  reveal: []
}>()

const answer = defineModel<AlternativeId | undefined>('answer')
const isCorrect = computed(() => answer.value === props.question.correctAlternative)
const alternativeItems = computed(() => {
  return props.question.alternatives.map(alternative => ({
    label: `${alternative.id} — ${alternative.text}`,
    value: alternative.id
  }))
})
const correctAlternativeLabel = computed(() => {
  const alternative = props.question.alternatives
    .find(item => item.id === props.question.correctAlternative)

  return alternative
    ? `${alternative.id} — ${alternative.text}`
    : props.question.correctAlternative
})
const resultLabel = computed(() => {
  if (!props.revealed) {
    return 'Ver resposta'
  }

  return isCorrect.value
    ? `Resposta correta: ${correctAlternativeLabel.value}`
    : `Resposta incorreta · Correta: ${correctAlternativeLabel.value}`
})
</script>

<template>
  <UCard
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
        v-model="answer"
        :items="alternativeItems"
        :aria-label="question.statement"
        variant="card"
        size="lg"
        :disabled="revealed"
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
        :label="resultLabel"
        :icon="revealed ? (isCorrect ? 'i-lucide-circle-check' : 'i-lucide-circle-x') : 'i-lucide-eye'"
        :color="revealed ? (isCorrect ? 'success' : 'error') : 'neutral'"
        :variant="revealed ? 'soft' : 'outline'"
        :loading="saving"
        :disabled="!answer || revealed"
        @click="emit('reveal')"
      />
    </template>
  </UCard>
</template>
