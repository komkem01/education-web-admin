export default defineNuxtRouteMiddleware((to) => {
  const { authToken, activeRole, fetchMe, clearSession } = useAdminAuth()

  const isLoggedIn = Boolean(authToken.value)
  const isAdminRole = activeRole.value === 'admin' || activeRole.value === 'super_admin'
  const isSuperAdminRole = activeRole.value === 'super_admin'
  const isAdminArea = to.path.startsWith('/admin')
  const superAdminAllowedPaths = ['/admin/schools', '/admin/personnels']

  function isAllowedForSuperAdmin(path: string) {
    if (path === '/admin') return false
    return superAdminAllowedPaths.some((allowedPath) => path === allowedPath || path.startsWith(`${allowedPath}/`))
  }

  async function isSessionValid() {
    if (!authToken.value || !isAdminRole) return false

    try {
      const me = await fetchMe()
      const role = me.role
      const roles = me.roles ?? []
      return role === 'admin' || role === 'super_admin' || roles.includes('admin') || roles.includes('super_admin')
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

      if (activeRole.value === 'super_admin' && isAdminArea && !isAllowedForSuperAdmin(to.path)) {
        return navigateTo('/admin/schools')
      }

      if (to.path === '/') {
        return navigateTo(activeRole.value === 'super_admin' ? '/admin/schools' : '/admin')
      }
    })
  }

  if (isLoggedIn && to.path === '/') {
    if (isSuperAdminRole) return navigateTo('/admin/schools')
    return navigateTo('/admin')
  }
})
