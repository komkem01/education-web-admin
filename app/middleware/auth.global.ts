export default defineNuxtRouteMiddleware((to) => {
  const { authToken, activeRole, fetchMe, clearSession } = useAdminAuth()

  const isLoggedIn = Boolean(authToken.value)
  const isAdminRole = activeRole.value === 'admin'
  const isAdminArea = to.path.startsWith('/admin')

  async function isSessionValid() {
    if (!authToken.value || !isAdminRole) return false

    try {
      const me = await fetchMe()
      const role = me.role
      const roles = me.roles ?? []
      return role === 'admin' || roles.includes('admin')
    }
    catch {
      return false
    }
  }

  if ((!isLoggedIn || !isAdminRole) && isAdminArea) {
    clearSession()
    return navigateTo('/')
  }

  if (isLoggedIn && isAdminRole) {
    return isSessionValid().then((ok) => {
      if (!ok) {
        clearSession()
        return navigateTo('/')
      }

      if (to.path === '/') {
        return navigateTo('/admin')
      }
    })
  }

  if (isLoggedIn && to.path === '/') return navigateTo('/admin')
})
