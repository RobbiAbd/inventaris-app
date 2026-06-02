<script setup lang="ts">
import type { PaginationMeta } from '../../shared/types/pagination'

const page = defineModel<number>('page', { required: true })

defineProps<{
  pagination: PaginationMeta
  label?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-3 border-t border-default p-4 sm:flex-row sm:items-center sm:justify-between">
    <p class="text-sm text-muted">
      Total {{ pagination.total }} {{ label ?? 'data' }}
      <span v-if="pagination.totalPages > 1">
        · halaman {{ pagination.page }} / {{ pagination.totalPages }}
      </span>
    </p>
    <UPagination
      v-if="pagination.totalPages > 1"
      v-model:page="page"
      :total="pagination.total"
      :items-per-page="pagination.limit"
    />
  </div>
</template>
