import bcrypt from 'bcrypt'
import { z } from 'zod'
import { prisma } from '../../utils/db'
import { notDeleted } from '../../utils/softDelete'
import { successResponse } from '../../utils/response'

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi')
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Data login tidak valid'
    })
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findFirst({
    where: { email, ...notDeleted }
  })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Email atau password salah'
    })
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      nama: user.nama,
      role: user.role
    }
  })

  return successResponse('Login berhasil', {
    user: {
      id: user.id,
      email: user.email,
      nama: user.nama,
      role: user.role
    }
  })
})
