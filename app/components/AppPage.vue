<script setup lang="ts">
defineProps<{
  headline: string
  title: string
  description: string
}>()
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :headline="headline"
        :title="title"
        :description="description"
      >
        <template
          v-if="$slots.links"
          #links
        >
          <slot name="links" />
        </template>
      </UPageHeader>

      <UPageBody>
        <slot />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
