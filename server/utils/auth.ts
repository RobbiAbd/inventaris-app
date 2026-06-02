export async function requireSession(event: Parameters<typeof getUserSession>[0]) {
  const session = await getUserSession(event)

  if (!session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Belum login'
    })
  }

  return session.user
}

export async function requireHrd(event: Parameters<typeof getUserSession>[0]) {
  const user = await requireSession(event)

  if (user.role !== 'HRD') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Akses ditolak. Hanya HRD yang dapat melakukan aksi ini.'
    })
  }

  return user
}

export function isHrd(role?: string) {
  return role === 'HRD'
}

export function barangScopeForUser(user: { id: number, role: string }) {
  if (isHrd(user.role)) {
    return {}
  }

  return { userId: user.id }
}

export function assertBarangAccess(
  user: { id: number, role: string },
  barang: { userId: number | null }
) {
  if (!isHrd(user.role) && barang.userId !== user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Akses ditolak. Anda hanya dapat melihat barang yang ditugaskan ke Anda.'
    })
  }
}
