<script setup lang="ts">
import type {
  StudyResource,
  StudyResourceKind,
  StudyTopic
} from '~/types/study-content'

defineProps<{
  topic: StudyTopic
  resources: StudyResource[]
}>()

const resourceLabels: Record<StudyResourceKind, string> = {
  article: 'Texto',
  video: 'Vídeo',
  course: 'Curso',
  reference: 'Referência'
}

const resourceIcons: Record<StudyResourceKind, string> = {
  article: 'i-lucide-file-text',
  video: 'i-lucide-circle-play',
  course: 'i-lucide-graduation-cap',
  reference: 'i-lucide-badge-info'
}
</script>

<template>
  <UCard
    :title="topic.title"
    :description="topic.description"
    variant="subtle"
  >
    <UPageList>
      <div
        v-for="resource in resources"
        :key="resource.url"
        class="rounded-lg border border-default p-3"
      >
        <div class="mb-2 flex items-center justify-between gap-2">
          <UBadge
            :label="resourceLabels[resource.kind]"
            color="neutral"
            variant="soft"
            size="sm"
          />
          <span class="text-xs text-muted">
            {{ resource.provider }}
          </span>
        </div>

        <UButton
          :label="resource.title"
          :icon="resourceIcons[resource.kind]"
          trailing-icon="i-lucide-external-link"
          :to="resource.url"
          target="_blank"
          rel="noopener noreferrer"
          color="neutral"
          variant="link"
          class="h-auto w-full justify-between px-0 text-left"
        />
      </div>
    </UPageList>
  </UCard>
</template>
