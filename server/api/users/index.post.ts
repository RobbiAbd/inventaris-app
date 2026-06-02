import bcrypt from 'bcrypt'
import { createUserSchema } from '../../../shared/types/user'
import { prisma } from '../../utils/db'
import { requireHrd } from '../../utils/auth'
import { logUserCreate } from '../../utils/history'
import { parseUserCreateInput, serializeUser } from '../../utils/user'
import { activeBarangCountSelect, notDeleted } from '../../utils/softDelete'
import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const actor = await requireHrd(event)

  const body = await readBody(event)
  const parsed = createUserSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Data pengguna tidak valid'
    })
  }

  const input = parseUserCreateInput(parsed.data)

  const existing = await prisma.user.findFirst({
    where: { email: input.email, ...notDeleted }
  })

  if (existing) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email sudah digunakan'
    })
  }

  const hashedPassword = await bcrypt.hash(input.password, 10)

  const user = await prisma.user.create({
    data: {
      nama: input.nama,
      email: input.email,
      password: hashedPassword,
      role: input.role
    },
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

  await logUserCreate(actor, user)

  return successResponse('Pengguna berhasil ditambahkan', serializeUser(user))
})
