export function successResponse<T>(message: string, data?: T) {
  return {
    success: true,
    message,
    data
  }
}

export function errorResponse(message: string, errors?: Record<string, string[]>) {
  return {
    success: false,
    message,
    errors
  }
}
