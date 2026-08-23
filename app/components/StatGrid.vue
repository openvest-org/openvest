<script setup lang="ts">
export interface StatGridItem {
  label: string
  value: string | number
  icon?: string
}

withDefaults(defineProps<{
  items: StatGridItem[]
  columnsClass?: string
}>(), {
  columnsClass: 'sm:grid-cols-2 lg:grid-cols-3'
})
</script>

<template>
  <div
    class="grid gap-4"
    :class="columnsClass"
  >
    <UPageCard
      v-for="item in items"
      :key="item.label"
      :icon="item.icon"
      :title="String(item.value)"
      :description="item.label"
      variant="subtle"
    />
  </div>
</template>
