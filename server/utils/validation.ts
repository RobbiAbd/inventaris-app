import { buildBarangSchema } from '../../shared/types/barang'
import { MASTER_GROUPS } from '../../shared/types/master'
import { getMasterOptionsMap } from './master'

export async function parseAndValidateBarang(body: unknown) {
  const master = await getMasterOptionsMap()

  const schema = buildBarangSchema(
    master[MASTER_GROUPS.KATEGORI_BARANG],
    master[MASTER_GROUPS.STATUS_BARANG],
    master[MASTER_GROUPS.TIPE_PEROLEHAN]
  )

  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Data barang tidak valid'
    })
  }

  return parsed.data
}

export async function parseAndValidateVendor(body: unknown) {
  const { buildVendorSchema } = await import('../../shared/types/vendor')
  const master = await getMasterOptionsMap()
  const schema = buildVendorSchema(master[MASTER_GROUPS.JENIS_VENDOR])
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Data vendor tidak valid'
    })
  }

  return parsed.data
}
