export default defineNuxtRouteMiddleware((to) => {
  const authToken = useCookie<string | null>('edu_auth_token')
  const activeRole = useCookie<string | null>('edu_active_role')
  const config = useRuntimeConfig()

  const isLoggedIn = Boolean(authToken.value)
  const isAdminRole = activeRole.value === 'admin'
  const isAdminArea = to.path.startsWith('/admin')

  async function isSessionValid() {
    if (!authToken.value || !isAdminRole) return false

    try {
      const res = await $fetch<{ data: { role: string; roles: string[] } }>(`${config.public.apiBase}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken.value}`,
        },
      })
      const role = res.data.role
      const roles = res.data.roles ?? []
      return role === 'admin' || roles.includes('admin')
    }
    catch {
      return false
    }
  }

  if ((!isLoggedIn || !isAdminRole) && isAdminArea) {
    authToken.value = null
    activeRole.value = null
    return navigateTo('/')
  }

  if (isLoggedIn && isAdminRole) {
    return isSessionValid().then((ok) => {
      if (!ok) {
        authToken.value = null
        activeRole.value = null
        return navigateTo('/')
      }

      if (to.path === '/') {
        return navigateTo('/admin')
      }
    })
  }

  if (isLoggedIn && to.path === '/') return navigateTo('/admin')
})
