import type {
  MasterGroup,
  MasterOptionInput,
  MasterOptionItem,
  MasterOptionsMap
} from '../../shared/types/master'
import {
  MASTER_GROUPS,
  getKategoriConfig,
  getMasterLabel,
  getStatusColor
} from '../../shared/types/master'
import { buildBarangSchema } from '../../shared/types/barang'
import { buildVendorSchema } from '../../shared/types/vendor'

const EMPTY_MAP: MasterOptionsMap = {
  [MASTER_GROUPS.JENIS_VENDOR]: [],
  [MASTER_GROUPS.KATEGORI_BARANG]: [],
  [MASTER_GROUPS.STATUS_BARANG]: [],
  [MASTER_GROUPS.TIPE_PEROLEHAN]: []
}

export function useMasterOptions(includeInactive = false) {
  const cacheKey = includeInactive ? 'master-options-all' : 'master-options'

  const { data, refresh, pending } = useAuthenticatedAsyncData(cacheKey, async () => {
    const response = await $fetch<{
      success: boolean
      data: MasterOptionItem[]
    }>('/api/master-options', {
      query: includeInactive ? { includeInactive: 'true' } : undefined
    })

    const items = response.data
    const map: MasterOptionsMap = {
      [MASTER_GROUPS.JENIS_VENDOR]: items.filter(o => o.group === MASTER_GROUPS.JENIS_VENDOR),
      [MASTER_GROUPS.KATEGORI_BARANG]: items.filter(o => o.group === MASTER_GROUPS.KATEGORI_BARANG),
      [MASTER_GROUPS.STATUS_BARANG]: items.filter(o => o.group === MASTER_GROUPS.STATUS_BARANG),
      [MASTER_GROUPS.TIPE_PEROLEHAN]: items.filter(o => o.group === MASTER_GROUPS.TIPE_PEROLEHAN)
    }

    return { items, map }
  })

  const items = computed(() => data.value?.items ?? [])
  const map = computed(() => data.value?.map ?? EMPTY_MAP)

  function optionsFor(group: MasterGroup, activeOnly = !includeInactive) {
    const list = map.value[group] ?? []
    return activeOnly ? list.filter(o => o.isActive) : list
  }

  function toSelectItems(group: MasterGroup) {
    return optionsFor(group).map(o => ({ label: o.label, value: o.kode }))
  }

  function labelFor(group: MasterGroup, kode: string) {
    return getMasterLabel(optionsFor(group, false), kode)
  }

  function kategoriConfig(kode: string) {
    const option = map.value[MASTER_GROUPS.KATEGORI_BARANG].find(o => o.kode === kode)
    return getKategoriConfig(option)
  }

  function statusColor(kode: string) {
    const option = map.value[MASTER_GROUPS.STATUS_BARANG].find(o => o.kode === kode)
    return getStatusColor(option)
  }

  function validateBarangForm(form: Record<string, unknown>) {
    try {
      const schema = buildBarangSchema(
        optionsFor(MASTER_GROUPS.KATEGORI_BARANG),
        optionsFor(MASTER_GROUPS.STATUS_BARANG),
        optionsFor(MASTER_GROUPS.TIPE_PEROLEHAN)
      )
      return schema.safeParse(form)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Master data belum lengkap'
      return { success: false as const, error: { issues: [{ message }] } }
    }
  }

  function validateVendorForm(form: Record<string, unknown>) {
    try {
      const schema = buildVendorSchema(optionsFor(MASTER_GROUPS.JENIS_VENDOR))
      return schema.safeParse(form)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Master data belum lengkap'
      return { success: false as const, error: { issues: [{ message }] } }
    }
  }

  async function createOption(input: MasterOptionInput) {
    await $fetch('/api/master-options', { method: 'POST', body: input })
    await refresh()
  }

  async function updateOption(id: number, input: Partial<MasterOptionInput>) {
    await $fetch(`/api/master-options/${id}`, { method: 'PUT', body: input })
    await refresh()
  }

  async function deleteOption(id: number) {
    await $fetch(`/api/master-options/${id}`, { method: 'DELETE' })
    await refresh()
  }

  return {
    items,
    map,
    pending,
    refresh,
    optionsFor,
    toSelectItems,
    labelFor,
    kategoriConfig,
    statusColor,
    validateBarangForm,
    validateVendorForm,
    createOption,
    updateOption,
    deleteOption,
    MASTER_GROUPS
  }
}
