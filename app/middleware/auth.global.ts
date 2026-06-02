export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') {
    return
  }

  const { loggedIn, fetch: refreshSession } = useUserSession()

  if (!loggedIn.value) {
    await refreshSession()
  }

  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
