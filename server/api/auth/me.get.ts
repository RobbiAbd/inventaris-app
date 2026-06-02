import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Belum login'
    })
  }

  return successResponse('Data sesi berhasil diambil', {
    user: session.user
  })
})
