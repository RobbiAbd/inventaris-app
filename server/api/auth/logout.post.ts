import { successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  return successResponse('Logout berhasil')
})
