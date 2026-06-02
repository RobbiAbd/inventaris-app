export const EVIDENCE_MAX_FILES = 10
export const EVIDENCE_MAX_FILE_SIZE = 5 * 1024 * 1024

export const EVIDENCE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
] as const

export type EvidenceMimeType = typeof EVIDENCE_ALLOWED_MIME_TYPES[number]
