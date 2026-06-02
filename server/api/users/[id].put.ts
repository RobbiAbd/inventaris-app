import bcrypt from 'bcrypt'
import { updateUserSchema } from '../../../shared/types/user'
import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { logUserUpdate } from '../../utils/history'
import { parseUserUpdateInput, serializeUser } from '../../utils/user'
import { activeBarangCountSelect, assertActive, notDeleted } from '../../utils/softDelete'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const currentUser = await requireHrd(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID pengguna tidak valid' })
  }

  const body = await readBody(event)
  const parsed = updateUserSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Data pengguna tidak valid'
    })
  }

  const existing = assertActive(
    await prisma.user.findFirst({ where: { id, ...notDeleted } }),
    'Pengguna tidak ditemukan'
  )

  const input = parseUserUpdateInput(parsed.data)

  if (input.email !== existing.email) {
    const emailTaken = await prisma.user.findFirst({
      where: { email: input.email, ...notDeleted }
    })
    if (emailTaken) {
      throw createError({ statusCode: 400, statusMessage: 'Email sudah digunakan' })
    }
  }

  if (existing.role === 'HRD' && input.role !== 'HRD') {
    const hrdCount = await prisma.user.count({ where: { role: 'HRD', ...notDeleted } })
    if (hrdCount <= 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Tidak dapat mengubah role. Minimal harus ada satu pengguna HRD.'
      })
    }
  }

  const updateData: {
    nama: string
    email: string
    role: typeof input.role
    password?: string
  } = {
    nama: input.nama,
    email: input.email,
    role: input.role
  }

  if ('password' in input && input.password) {
    updateData.password = await bcrypt.hash(input.password, 10)
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: activeBarangCountSelect }
    }
  })

  await logUserUpdate(actorFrom(currentUser), existing, user)

  if (currentUser.id === id && input.role !== currentUser.role) {
    await setUserSession(event, {
      user: {
        id: user.id,
        email: user.email,
        nama: user.nama,
        role: user.role
      }
    })
  }

  return successResponse('Pengguna berhasil diperbarui', serializeUser(user))
})

function actorFrom(user: { id: number, nama: string }) {
  return { id: user.id, nama: user.nama }
}
