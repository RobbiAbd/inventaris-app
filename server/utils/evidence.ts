import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  EVIDENCE_ALLOWED_MIME_TYPES,
  EVIDENCE_MAX_FILE_SIZE
} from '../../shared/constants/evidence'

const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
}

export function getUploadsRoot() {
  return join(process.cwd(), 'public', 'uploads', 'barang')
}

export function evidencePublicUrl(filePath: string) {
  return `/${filePath.replace(/\\/g, '/')}`
}

export function evidenceAbsolutePath(filePath: string) {
  return join(process.cwd(), 'public', filePath)
}

export function validateEvidenceFile(part: { type?: string, data?: Buffer }) {
  const mimeType = part.type ?? ''

  if (!EVIDENCE_ALLOWED_MIME_TYPES.includes(mimeType as typeof EVIDENCE_ALLOWED_MIME_TYPES[number])) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File harus berupa gambar (JPEG, PNG, WebP, atau GIF)'
    })
  }

  const size = part.data?.length ?? 0

  if (size <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'File gambar kosong' })
  }

  if (size > EVIDENCE_MAX_FILE_SIZE) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ukuran file maksimal 5 MB per gambar'
    })
  }

  return { mimeType, size }
}

export async function saveEvidenceFile(
  barangId: number,
  part: { filename?: string | null, type?: string, data?: Buffer }
) {
  const { mimeType, size } = validateEvidenceFile(part)
  const extension = MIME_EXTENSION[mimeType] ?? (extname(part.filename ?? '') || '.jpg')
  const storedName = `${randomUUID()}${extension}`
  const relativePath = join('uploads', 'barang', String(barangId), storedName).replace(/\\/g, '/')
  const absolutePath = evidenceAbsolutePath(relativePath)

  await mkdir(join(getUploadsRoot(), String(barangId)), { recursive: true })
  await writeFile(absolutePath, part.data!)

  return {
    filePath: relativePath,
    originalName: part.filename ?? storedName,
    mimeType,
    fileSize: size
  }
}

export async function deleteEvidenceFile(filePath: string) {
  try {
    await unlink(evidenceAbsolutePath(filePath))
  } catch {
    // File may already be removed from disk
  }
}
