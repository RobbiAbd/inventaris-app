import type { AsyncDataOptions } from '#app'

type AsyncDataKey = string | (() => string)

export function useAuthenticatedAsyncData<T>(
  key: AsyncDataKey,
  handler: () => Promise<T>,
  options?: AsyncDataOptions<T>
) {
  const { user, loggedIn, refreshSession } = useAuth()
  const { watch: extraWatch, ...restOptions } = options ?? {}

  const cacheKey = () => {
    const base = typeof key === 'function' ? key() : key
    return `${base}-${user.value?.id ?? 'guest'}`
  }

  const result = useAsyncData(
    cacheKey,
    async () => {
      if (!loggedIn.value) {
        await refreshSession()
      }
      if (!loggedIn.value) {
        return null as T
      }
      return handler()
    },
    {
      ...restOptions,
      watch: [loggedIn, () => user.value?.id, ...(extraWatch ?? [])]
    }
  )

  watch(loggedIn, async (isLoggedIn) => {
    if (isLoggedIn && result.data.value == null && !result.pending.value) {
      await result.refresh()
    }
  }, { immediate: true })

  onMounted(async () => {
    if (loggedIn.value && result.data.value == null && !result.pending.value) {
      await result.refresh()
    }
  })

  return result
}
