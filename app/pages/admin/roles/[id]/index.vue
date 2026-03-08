<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="3" :cols="2" />
    <template v-else>
      <h2 class="page-title">รายละเอียดสิทธิ์และบทบาท</h2>
      <p class="page-desc">Member ID: {{ id }}</p>

      <div class="card">
        <p class="card-title">บทบาทที่ได้รับ</p>
        <div v-if="roles.length" class="chips">
          <AdminStatusBadge v-for="role in roles" :key="role" :label="toRoleLabel(role)" variant="info" />
        </div>
        <p v-else class="empty">ไม่พบบทบาท</p>
      </div>

      <button type="button" class="btn btn-detail" @click="navigateTo('/admin/roles')">กลับหน้ารายการ</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()
const route = useRoute()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const id = String(route.params.id ?? '')
const roles = ref<string[]>([])

type BaseResponse<T> = { data: T }
type RolesApi = { member_id: string; roles: string[] }

function authHeaders() {
  return { Authorization: `Bearer ${authToken.value}` }
}

async function apiFetch<T>(path: string, options?: Parameters<typeof $fetch<T>>[1]) {
  try {
    return await $fetch<T>(`${config.public.apiBase}/back-office${path}`, options)
  }
  catch {
    return await $fetch<T>(`${config.public.apiBase}${path}`, options)
  }
}

function toRoleLabel(role: string) {
  const map: Record<string, string> = {
    admin: 'แอดมิน',
    staff: 'บุคลากร',
    teacher: 'ครู',
    student: 'นักเรียน',
    parent: 'ผู้ปกครอง',
  }
  return map[role] || role
}

async function load() {
  if (!import.meta.client || !authToken.value || !id) return
  try {
    const res = await apiFetch<BaseResponse<RolesApi>>(`/members/${id}/roles`, { headers: authHeaders() })
    roles.value = res.data?.roles || []
  }
  catch {
    roles.value = []
  }
}

if (import.meta.client) {
  load()
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 12px; }
.page-title { margin: 0; font-size: 1.1rem; font-weight: 700; color: #111827; }
.page-desc { margin: 0; color: #6b7280; font-size: 0.9rem; }
.card { background: #fff; border: 1px solid #e8eaed; border-radius: 12px; padding: 14px; }
.card-title { margin: 0 0 10px; font-size: 0.9rem; font-weight: 600; color: #111827; }
.chips { display: flex; gap: 8px; flex-wrap: wrap; }
.empty { margin: 0; color: #9ca3af; font-size: 0.86rem; }
.btn { border-radius: 8px; padding: 8px 14px; border: 1px solid #e5e7eb; background: #fff; color: #374151; width: fit-content; cursor: pointer; }
.btn-detail:hover { background: #f9fafb; }
</style>