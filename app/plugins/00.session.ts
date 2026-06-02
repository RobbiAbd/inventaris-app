export default defineNuxtPlugin(async () => {
  const { fetch: refreshSession } = useUserSession()
  await refreshSession()
})
