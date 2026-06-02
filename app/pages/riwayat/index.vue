<script setup lang="ts">
import { ENTITY_TYPES, ENTITY_TYPE_LABELS } from '../../../shared/types/history'
import type { EntityType } from '../../../shared/types/history'
import { FILTER_ALL, toFilterValue } from '../../../shared/constants/filter'

definePageMeta({ layout: 'default' })

useSeoMeta({ title: 'Riwayat - Inventaris App' })

const entityType = ref<string>((useRoute().query.entityType as string) || FILTER_ALL)

const entityFilterItems = computed(() => [
  { label: 'Semua Jenis', value: FILTER_ALL },
  ...Object.values(ENTITY_TYPES).map(type => ({
    label: ENTITY_TYPE_LABELS[type],
    value: type
  }))
])

const filteredEntityType = computed(() => toFilterValue(entityType.value) as EntityType | undefined)
</script>

<template>
  <AppDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Riwayat Aktivitas" />
    </template>

    <div class="space-y-4">
      <UAlert
        icon="i-lucide-history"
        color="info"
        variant="subtle"
        title="Log perubahan data"
        description="Semua penambahan, pengubahan, dan penghapusan (soft delete) barang, vendor, pengguna, dan master data tercatat di sini."
      />

      <UCard :ui="{ root: 'overflow-visible relative z-10' }">
        <div class="mb-4 max-w-sm">
          <AppFilterSelect
            v-model="entityType"
            :items="entityFilterItems"
            placeholder="Filter jenis data"
          />
        </div>
      </UCard>

      <AppHistoryTimeline
        :key="filteredEntityType || 'all'"
        :entity-type="filteredEntityType"
        :limit="20"
      />
    </div>
  </AppDashboardPanel>
</template>
