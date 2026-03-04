export default defineNuxtRouteMiddleware((to) => {
  const authToken = useCookie<string | null>('edu_auth_token')
  const activeRole = useCookie<string | null>('edu_active_role')

  const isLoggedIn = Boolean(authToken.value)
  const isAdminRole = activeRole.value === 'admin'
  const isAdminArea = to.path.startsWith('/admin')

  if ((!isLoggedIn || !isAdminRole) && isAdminArea) {
    authToken.value = null
    activeRole.value = null
    return navigateTo('/')
  }

  if (isLoggedIn && to.path === '/') {
    if (!isAdminRole) {
      authToken.value = null
      activeRole.value = null
      return navigateTo('/')
    }

    return navigateTo('/admin')
  }
})
