import bcrypt from 'bcrypt'
import { profileUpdateSchema } from '../../../shared/types/profile'
import { prisma } from '../../utils/db'
import { requireSession } from '../../utils/auth'
import { notDeleted } from '../../utils/softDelete'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireSession(event)
  const body = await readBody(event)
  const parsed = profileUpdateSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Data profil tidak valid'
    })
  }

  const existing = await prisma.user.findFirst({
    where: { id: sessionUser.id, ...notDeleted }
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan' })
  }

  if (parsed.data.email !== existing.email) {
    const emailTaken = await prisma.user.findFirst({
      where: {
        email: parsed.data.email,
        id: { not: existing.id },
        ...notDeleted
      }
    })
    if (emailTaken) {
      throw createError({ statusCode: 400, statusMessage: 'Email sudah digunakan' })
    }
  }

  const updateData: { nama: string, email: string, password?: string } = {
    nama: parsed.data.nama.trim(),
    email: parsed.data.email.trim().toLowerCase()
  }

  if (parsed.data.passwordBaru) {
    const valid = await bcrypt.compare(parsed.data.passwordSaatIni ?? '', existing.password)
    if (!valid) {
      throw createError({ statusCode: 400, statusMessage: 'Password saat ini salah' })
    }
    updateData.password = await bcrypt.hash(parsed.data.passwordBaru, 10)
  }

  const user = await prisma.user.update({
    where: { id: existing.id },
    data: updateData,
    select: { id: true, nama: true, email: true, role: true }
  })

  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      nama: user.nama,
      role: user.role
    }
  })

  return successResponse('Profil berhasil diperbarui', { user })
})
