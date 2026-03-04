import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue'

/**
 * Simulates a brief async page load.
 * Usage: const { loading } = usePageLoad()
 */
export const usePageLoad = (ms = 700) => {
  const loading = ref(true)
  let timer: ReturnType<typeof setTimeout>
  onMounted(() => {
    timer = setTimeout(() => { loading.value = false }, ms)
  })
  onUnmounted(() => clearTimeout(timer))
  return { loading }
}
