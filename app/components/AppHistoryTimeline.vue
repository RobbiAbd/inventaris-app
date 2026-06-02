<script setup lang="ts">
import type { ActivityLogItem, EntityType } from '../../shared/types/history'
import { ACTION_LABELS, ENTITY_TYPE_LABELS } from '../../shared/types/history'

const props = withDefaults(defineProps<{
  entityType?: EntityType
  entityId?: number
  limit?: number
  title?: string
}>(), {
  limit: 10,
  title: 'Riwayat Perubahan'
})

const { fetchHistory } = useHistory()

const page = ref(1)

const { data, pending, refresh } = await useAuthenticatedAsyncData(
  () => `history-${props.entityType ?? 'all'}-${props.entityId ?? 'all'}-${page.value}`,
  () => fetchHistory({
    entityType: props.entityType,
    entityId: props.entityId,
    page: page.value,
    limit: props.limit
  }),
  { watch: [page, () => props.entityType, () => props.entityId] }
)

watch([() => props.entityType, () => props.entityId], () => {
  page.value = 1
})

const items = computed(() => data.value?.data.items ?? [])
const pagination = computed(() => data.value?.data.pagination)

function actionColor(action: ActivityLogItem['action']) {
  if (action === 'create') return 'success'
  if (action === 'delete') return 'error'
  return 'info'
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

defineExpose({ refresh })
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-history" class="size-5 text-primary" />
        <h3 class="font-semibold">{{ title }}</h3>
      </div>
    </template>

    <div v-if="pending" class="py-8 text-center text-muted text-sm">Memuat riwayat...</div>
    <div v-else-if="items.length === 0" class="py-8 text-center text-muted text-sm">
      Belum ada riwayat perubahan.
    </div>
    <div v-else class="space-y-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="border border-default rounded-lg p-4 space-y-2"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge :color="actionColor(item.action)" variant="subtle" :label="ACTION_LABELS[item.action]" />
              <UBadge v-if="!entityType" color="neutral" variant="subtle" :label="ENTITY_TYPE_LABELS[item.entityType]" />
            </div>
            <p class="font-medium text-sm">{{ item.summary }}</p>
            <p v-if="!entityId" class="text-xs text-muted">{{ item.entityLabel }}</p>
          </div>
          <p class="text-xs text-muted shrink-0">{{ formatDateTime(item.createdAt) }}</p>
        </div>

        <p class="text-xs text-muted">
          Oleh: {{ item.actorNama ?? 'Sistem' }}
        </p>

        <div v-if="item.changes?.length" class="mt-2 space-y-1">
          <p class="text-xs font-medium text-muted">Detail perubahan:</p>
          <ul class="text-xs space-y-1">
            <li
              v-for="change in item.changes"
              :key="`${item.id}-${change.field}`"
              class="rounded bg-muted/40 px-2 py-1"
            >
              <span class="font-medium">{{ change.label }}:</span>
              {{ change.oldValue ?? '-' }}
              <UIcon name="i-lucide-arrow-right" class="size-3 inline mx-1" />
              {{ change.newValue ?? '-' }}
            </li>
          </ul>
        </div>
      </div>

      <div
        v-if="pagination"
        class="pt-2"
      >
        <AppTablePagination
          v-model:page="page"
          :pagination="pagination"
          label="riwayat"
        />
      </div>
    </div>
  </UCard>
</template>
