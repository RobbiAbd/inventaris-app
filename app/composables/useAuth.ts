export function useAuth() {
  const { loggedIn, user, fetch: refreshSession, clear } = useUserSession()

  async function login(email: string, password: string) {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    await refreshSession()
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clear()
    await navigateTo('/login')
  }

  return {
    loggedIn,
    user,
    refreshSession,
    login,
    logout
  }
}
