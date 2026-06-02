export const notDeleted = { deletedAt: null } as const

export function releaseUniqueValue(value: string | null | undefined, id: number) {
  if (!value) return null
  return `__deleted_${id}__${value}`
}

export function restoreUniqueValue(value: string | null | undefined) {
  if (!value) return null
  const match = value.match(/^__deleted_\d+__(.+)$/)
  return match ? match[1] : value
}

export const activeBarangCountSelect = {
  barang: { where: { deletedAt: null } }
} as const

export function isNotDeleted<T extends { deletedAt?: Date | null }>(record: T | null) {
  return !!record && record.deletedAt == null
}

export function assertActive<T>(
  record: T | null,
  message = 'Data tidak ditemukan'
): T {
  if (!record) {
    throw createError({ statusCode: 404, statusMessage: message })
  }
  return record
}
