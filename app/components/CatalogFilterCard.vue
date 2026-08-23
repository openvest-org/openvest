<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  description: string
  searchLabel: string
  searchPlaceholder: string
  searchAriaLabel: string
  filtersActive?: boolean
}>(), {
  title: 'Filtros',
  filtersActive: false
})

const emit = defineEmits<{
  reset: []
}>()

const search = defineModel<string>('search', { default: '' })
</script>

<template>
  <UCard
    :title="title"
    :description="description"
  >
    <UPageList>
      <UFormField :label="searchLabel">
        <UInput
          v-model="search"
          type="search"
          icon="i-lucide-search"
          :placeholder="searchPlaceholder"
          :aria-label="searchAriaLabel"
          class="w-full"
        />
      </UFormField>

      <UPageGrid class="mt-4">
        <slot name="filters" />
      </UPageGrid>

      <slot name="messages" />
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
        @click="emit('reset')"
      />
    </template>
  </UCard>
</template>
