export default defineNuxtRouteMiddleware(async () => {
  const { user, loggedIn, refreshSession } = useAuth()

  if (!loggedIn.value) {
    await refreshSession()
  }

  if (user.value?.role !== 'HRD') {
    return navigateTo('/barang')
  }
})
