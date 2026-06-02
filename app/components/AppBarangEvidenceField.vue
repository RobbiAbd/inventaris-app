<script setup lang="ts">
import type { BarangEvidenceItem } from '../../shared/types/barang'
import { EVIDENCE_ALLOWED_MIME_TYPES, EVIDENCE_MAX_FILES, EVIDENCE_MAX_FILE_SIZE } from '../../shared/constants/evidence'

const props = defineProps<{
  existing?: BarangEvidenceItem[]
  disabled?: boolean
}>()

const toast = useToast()
const fileInputRef = ref<HTMLInputElement | null>(null)

const existingItems = computed(() => props.existing ?? [])
const removeIds = ref<number[]>([])
const newFiles = ref<File[]>([])
const previewUrls = ref<string[]>([])

const visibleExisting = computed(() =>
  existingItems.value.filter(item => !removeIds.value.includes(item.id))
)

const totalCount = computed(() => visibleExisting.value.length + newFiles.value.length)
const canAddMore = computed(() => totalCount.value < EVIDENCE_MAX_FILES)

function revokePreviews() {
  previewUrls.value.forEach(url => URL.revokeObjectURL(url))
  previewUrls.value = []
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const selected = Array.from(input.files ?? [])
  input.value = ''

  if (!selected.length) return

  const remainingSlots = EVIDENCE_MAX_FILES - totalCount.value

  if (remainingSlots <= 0) {
    toast.add({
      title: 'Batas tercapai',
      description: `Maksimal ${EVIDENCE_MAX_FILES} gambar per barang`,
      color: 'warning'
    })
    return
  }

  let skipped = 0

  for (const file of selected.slice(0, remainingSlots)) {
    if (!EVIDENCE_ALLOWED_MIME_TYPES.includes(file.type as typeof EVIDENCE_ALLOWED_MIME_TYPES[number])) {
      skipped++
      continue
    }
    if (file.size > EVIDENCE_MAX_FILE_SIZE) {
      skipped++
      continue
    }
    newFiles.value.push(file)
    previewUrls.value.push(URL.createObjectURL(file))
  }

  if (skipped > 0) {
    toast.add({
      title: 'Beberapa file dilewati',
      description: 'Gunakan gambar JPEG/PNG/WebP/GIF maks. 5 MB',
      color: 'warning'
    })
  }
}

function removeNewFile(index: number) {
  URL.revokeObjectURL(previewUrls.value[index]!)
  newFiles.value.splice(index, 1)
  previewUrls.value.splice(index, 1)
}

function markRemove(id: number) {
  removeIds.value.push(id)
}

function undoRemove(id: number) {
  removeIds.value = removeIds.value.filter(item => item !== id)
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

defineExpose({
  getPayload: () => ({
    newEvidenceFiles: [...newFiles.value],
    removeEvidenceIds: [...removeIds.value]
  }),
  reset: () => {
    revokePreviews()
    newFiles.value = []
    removeIds.value = []
  }
})

onBeforeUnmount(revokePreviews)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <h3 class="font-medium">Evidence Gambar</h3>
        <p class="text-sm text-muted mt-1">
          Unggah foto bukti kondisi barang. Maks. {{ EVIDENCE_MAX_FILES }} gambar, 5 MB per file (JPEG, PNG, WebP, GIF).
        </p>
      </div>
      <p class="text-sm text-muted shrink-0">{{ totalCount }} / {{ EVIDENCE_MAX_FILES }} gambar</p>
    </div>

    <div
      v-if="visibleExisting.length || newFiles.length"
      class="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div
        v-for="item in visibleExisting"
        :key="`existing-${item.id}`"
        class="min-w-0 rounded-lg border border-default overflow-hidden bg-default"
      >
        <div class="aspect-[4/3] bg-muted/30">
          <img :src="item.url" :alt="item.originalName" class="h-full w-full object-cover">
        </div>
        <div class="p-3 space-y-2">
          <p class="text-sm font-medium truncate" :title="item.originalName">{{ item.originalName }}</p>
          <p class="text-xs text-muted">{{ formatSize(item.fileSize) }}</p>
          <UButton
            v-if="!disabled"
            type="button"
            size="xs"
            color="error"
            variant="soft"
            icon="i-lucide-trash-2"
            label="Hapus"
            block
            @click="markRemove(item.id)"
          />
        </div>
      </div>

      <div
        v-for="(file, index) in newFiles"
        :key="`new-${file.name}-${index}`"
        class="min-w-0 rounded-lg border border-dashed border-primary/40 overflow-hidden bg-default"
      >
        <div class="aspect-[4/3] bg-muted/30">
          <img :src="previewUrls[index]" :alt="file.name" class="h-full w-full object-cover">
        </div>
        <div class="p-3 space-y-2">
          <p class="text-sm font-medium truncate" :title="file.name">{{ file.name }}</p>
          <p class="text-xs text-muted">{{ formatSize(file.size) }} · baru</p>
          <UButton
            v-if="!disabled"
            type="button"
            size="xs"
            color="neutral"
            variant="soft"
            icon="i-lucide-x"
            label="Batal"
            block
            @click="removeNewFile(index)"
          />
        </div>
      </div>
    </div>

    <div v-if="removeIds.length" class="space-y-2">
      <p class="text-sm text-muted">Akan dihapus saat disimpan:</p>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="id in removeIds"
          :key="id"
          type="button"
          size="xs"
          color="neutral"
          variant="outline"
          icon="i-lucide-undo-2"
          :label="`Batalkan hapus #${id}`"
          @click="undoRemove(id)"
        />
      </div>
    </div>

    <div v-if="canAddMore && !disabled">
      <input
        ref="fileInputRef"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        class="hidden"
        tabindex="-1"
        aria-hidden="true"
        @change="onFilesSelected"
      >
      <UButton
        type="button"
        icon="i-lucide-image-plus"
        label="Pilih Gambar"
        color="neutral"
        variant="outline"
        @click="openFilePicker"
      />
    </div>
  </div>
</template>
