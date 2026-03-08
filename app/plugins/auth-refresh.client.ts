export default defineNuxtPlugin(() => {
  const { setupAutoRefresh } = useAdminAuth()
  setupAutoRefresh()
})
