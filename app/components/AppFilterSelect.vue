<script setup lang="ts">
const model = defineModel<string>()

defineProps<{
  items: Array<{ label: string, value: string }>
  placeholder?: string
}>()

const selectContent = {
  bodyLock: false,
  side: 'bottom' as const,
  sideOffset: 8,
  collisionPadding: 8,
  position: 'popper' as const
}
</script>

<template>
  <USelect
    v-model="model"
    :items="items"
    value-key="value"
    :placeholder="placeholder"
    class="w-full"
    :content="selectContent"
  />
</template>
