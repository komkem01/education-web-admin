<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="6" :cols="5" />
    <template v-else>
      <div class="page-header">
        <div>
          <h2 class="page-title">Role Matrix & การจัดการสิทธิ์</h2>
          <p class="page-desc">1 คนมีได้หลายบทบาท (ยกเว้นนักเรียน) · เลือก Switch Role ขณะใช้งาน</p>
        </div>
        <button type="button" class="btn btn-primary" @click="openAssign">+ มอบหมาย Role</button>
      </div>

      <div class="card">
        <h3 class="card-title">ตารางสิทธิ์การใช้งาน (Role Permission Matrix)</h3>
        <div class="matrix-scroll">
          <table class="matrix-table">
            <thead>
              <tr>
                <th class="feature-col">ฟีเจอร์ / สิทธิ์</th>
                <th v-for="role in roles" :key="role">{{ role }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="feat in features" :key="feat.label">
                <td class="feat-name">{{ feat.label }}</td>
                <td v-for="role in roles" :key="role" class="perm-cell">
                  <span v-if="feat.perms[role] === 'full'" class="perm perm-full" title="ทำได้ทันที">✓</span>
                  <span v-else-if="feat.perms[role] === 'approve'" class="perm perm-approve" title="ต้องรออนุมัติ">⏳</span>
                  <span v-else class="perm perm-none" title="ไม่มีสิทธิ์">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="legend">
          <span><span class="perm perm-full">✓</span> ทำได้ทันที</span>
          <span><span class="perm perm-approve">⏳</span> รออนุมัติจากบุคลากร</span>
          <span><span class="perm perm-none">-</span> ไม่มีสิทธิ์</span>
        </div>
      </div>

      <AdminDataTable title="ผู้ใช้ที่มีหลายบทบาท" :columns="userCols" :rows="userRows">
        <template #cell-roles="{ row }">
          <div class="role-tags">
            <AdminStatusBadge v-for="r in (row as UserRow).roles" :key="r" :label="toRoleLabel(r)" variant="info" />
          </div>
        </template>

        <template #cell-activeRole="{ row }">
          <AdminStatusBadge :label="toRoleLabel((row as UserRow).activeRole)" variant="default" />
        </template>

        <template #rowActions="{ row }">
          <div class="action-btns">
            <button type="button" class="btn btn-sm btn-detail" @click="openManage(row as UserRow)">จัดการ Role</button>
          </div>
        </template>
      </AdminDataTable>

      <div class="card combo-card">
        <h3 class="card-title">การผสมบทบาทที่รองรับ</h3>
        <div class="combo-grid">
          <div v-for="combo in combos" :key="combo.a + combo.b" class="combo-item">
            <div class="combo-chips">
              <span class="chip">{{ combo.a }}</span>
              <span class="arrow">↔</span>
              <span class="chip">{{ combo.b }}</span>
            </div>
            <div class="combo-note">{{ combo.note }}</div>
          </div>
        </div>
      </div>

      <AdminAppModal
        v-model="showAssignModal"
        title="มอบหมาย Role ให้ผู้ใช้"
        size="sm"
        confirm-label="บันทึก"
        @confirm="submitAssign"
      >
        <div class="form-group">
          <label class="form-label">ผู้ใช้ <span class="req">*</span></label>
          <select v-model="assignForm.memberId" class="form-input">
            <option value="">-- เลือกผู้ใช้ --</option>
            <option v-for="member in assignableMembers" :key="member.id" :value="member.id">
              {{ member.display }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Role <span class="req">*</span></label>
          <select v-model="assignForm.role" class="form-input">
            <option value="">-- เลือกบทบาท --</option>
            <option v-for="role in roleOptions" :key="role" :value="role">{{ toRoleLabel(role) }}</option>
          </select>
        </div>
        <p v-if="assignError" class="field-error">{{ assignError }}</p>
      </AdminAppModal>

      <AdminAppModal
        v-model="showManageModal"
        :title="`จัดการ Role: ${manageTarget?.name || '-'}`"
        size="sm"
        confirm-label="ปิด"
      >
        <div class="manage-roles">
          <div v-for="role in roleOptions" :key="role" class="manage-row">
            <span>{{ toRoleLabel(role) }}</span>
            <button
              v-if="hasRole(role)"
              type="button"
              class="btn btn-sm btn-delete"
              @click="removeRole(role)"
            >
              ถอนสิทธิ์
            </button>
            <button
              v-else
              type="button"
              class="btn btn-sm btn-edit"
              @click="addRole(role)"
            >
              เพิ่มสิทธิ์
            </button>
          </div>
        </div>
        <p v-if="manageError" class="field-error">{{ manageError }}</p>
      </AdminAppModal>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

definePageMeta({ layout: 'admin' })

type BaseResponse<T> = { data: T }

type RoleMemberApiItem = {
  id: string
  email: string
  active_role: string
  name: string
  roles: string[]
}

type UserRow = {
  id: string
  name: string
  email: string
  roles: string[]
  activeRole: string
  lastLogin: string
}

type Perm = 'full' | 'approve' | 'none'
type Feature = { label: string; perms: Record<string, Perm> }

const { loading } = usePageLoad()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const members = ref<UserRow[]>([])

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

async function loadMembers() {
  if (!authToken.value) return
  const res = await apiFetch<BaseResponse<{ items: RoleMemberApiItem[] }>>('/reports/roles-members', { headers: authHeaders() })
  const rows = (res.data?.items || []).map(item => ({
    id: item.id,
    name: item.name || item.email,
    email: item.email,
    roles: (item.roles || []).slice(),
    activeRole: item.active_role,
    lastLogin: '-',
  }))
  members.value = rows
}

async function bootstrap() {
  if (!import.meta.client || !authToken.value) return
  try {
    await loadMembers()
  }
  catch {
    members.value = []
  }
}

if (import.meta.client) {
  bootstrap()
}

const roles = ['แอดมิน', 'บุคลากร', 'ครู', 'นักเรียน']

const features: Feature[] = [
  { label: 'จัดการข้อมูลโรงเรียน', perms: { แอดมิน: 'full', บุคลากร: 'none', ครู: 'none', นักเรียน: 'none' } },
  { label: 'เพิ่ม/ลบ บุคลากร', perms: { แอดมิน: 'full', บุคลากร: 'none', ครู: 'none', นักเรียน: 'none' } },
  { label: 'เพิ่ม/ลบ ครู', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'none', นักเรียน: 'none' } },
  { label: 'เพิ่ม/ลบ นักเรียน', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'approve', นักเรียน: 'none' } },
  { label: 'จัดการผู้ปกครอง', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'none', นักเรียน: 'none' } },
  { label: 'อนุมัติคำขอ', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'none', นักเรียน: 'none' } },
  { label: 'เปิด/แก้ไข รายวิชา', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'approve', นักเรียน: 'none' } },
  { label: 'แก้ไขข้อมูลนักเรียน', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'approve', นักเรียน: 'none' } },
  { label: 'ขอเอกสาร', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'approve', นักเรียน: 'none' } },
  { label: 'แก้ไขข้อมูลส่วนตัว', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'approve', นักเรียน: 'none' } },
  { label: 'ดูตารางเรียน', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'full', นักเรียน: 'full' } },
  { label: 'ดูผลการเรียน', perms: { แอดมิน: 'full', บุคลากร: 'full', ครู: 'full', นักเรียน: 'full' } },
]

const userCols = [
  { key: 'name', label: 'ชื่อ' },
  { key: 'roles', label: 'บทบาทที่ได้รับ' },
  { key: 'activeRole', label: 'โหมดใช้งานปัจจุบัน' },
  { key: 'email', label: 'อีเมล' },
]

const userRows = computed(() => members.value.filter(item => item.roles.length > 1))

const combos = [
  { a: 'แอดมิน', b: 'บุคลากร', note: 'ดูแลระบบโรงเรียนพร้อมจัดการเอกสาร' },
  { a: 'แอดมิน', b: 'ครู', note: 'บริหารระบบพร้อมสอนนักเรียน' },
  { a: 'บุคลากร', b: 'ครู', note: 'สอนและอนุมัติคำขอได้ในคนเดียวกัน' },
]

const roleOptions = ['admin', 'staff', 'teacher', 'student', 'parent']

const showAssignModal = ref(false)
const assignForm = ref({ memberId: '', role: '' })
const assignError = ref('')

const showManageModal = ref(false)
const manageTarget = ref<UserRow | null>(null)
const manageError = ref('')

const assignableMembers = computed(() =>
  members.value.map(item => ({
    id: item.id,
    display: `${item.name} (${item.email})`,
  })),
)

function openAssign() {
  assignForm.value = { memberId: '', role: '' }
  assignError.value = ''
  showAssignModal.value = true
}

async function submitAssign() {
  assignError.value = ''
  if (!assignForm.value.memberId || !assignForm.value.role) {
    assignError.value = 'กรุณาเลือกผู้ใช้และบทบาท'
    return
  }

  try {
    await apiFetch(`/members/${assignForm.value.memberId}/roles`, {
      method: 'POST',
      headers: authHeaders(),
      body: { role: assignForm.value.role },
    })
    showAssignModal.value = false
    await loadMembers()
  }
  catch {
    assignError.value = 'ไม่สามารถมอบหมายบทบาทได้'
  }
}

function openManage(row: UserRow) {
  manageTarget.value = row
  manageError.value = ''
  showManageModal.value = true
}

function hasRole(role: string) {
  return !!manageTarget.value?.roles.includes(role)
}

async function addRole(role: string) {
  if (!manageTarget.value) return
  manageError.value = ''
  try {
    await apiFetch(`/members/${manageTarget.value.id}/roles`, {
      method: 'POST',
      headers: authHeaders(),
      body: { role },
    })
    await loadMembers()
    manageTarget.value = members.value.find(item => item.id === manageTarget.value?.id) || null
  }
  catch {
    manageError.value = 'เพิ่มบทบาทไม่สำเร็จ'
  }
}

async function removeRole(role: string) {
  if (!manageTarget.value) return
  manageError.value = ''
  try {
    await apiFetch(`/members/${manageTarget.value.id}/roles/${role}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    await loadMembers()
    manageTarget.value = members.value.find(item => item.id === manageTarget.value?.id) || null
  }
  catch {
    manageError.value = 'ลบบทบาทไม่สำเร็จ'
  }
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.page-title { font-size: 1.2rem; font-weight: 700; margin: 0; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.88rem; }
.btn { border-radius: 9px; padding: 8px 14px; font-size: 0.88rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #111827; cursor: pointer; font-family: inherit; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }

.card { background: #fff; border: 1px solid #e8eaed; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.card-title { font-size: 1rem; font-weight: 600; margin: 0; }

.matrix-scroll { overflow-x: auto; }
.matrix-table { width: 100%; border-collapse: collapse; }
.matrix-table th, .matrix-table td { border: 1px solid #f1f3f4; padding: 9px 14px; text-align: center; font-size: 0.88rem; }
.matrix-table th { background: #fafafa; font-weight: 600; color: #374151; }
.feature-col { text-align: left !important; min-width: 200px; }
.feat-name { text-align: left !important; color: #111827; font-size: 0.88rem; }
.perm-cell { white-space: nowrap; }
.perm { display: inline-block; border-radius: 50%; width: 22px; height: 22px; line-height: 22px; font-size: 0.78rem; text-align: center; }
.perm-full { background: #f0fdf4; color: #15803d; }
.perm-approve { background: #fefce8; color: #92400e; }
.perm-none { color: #d1d5db; }
.legend { display: flex; gap: 18px; font-size: 0.82rem; color: #6b7280; flex-wrap: wrap; }
.legend span { display: flex; align-items: center; gap: 5px; }

.role-tags { display: flex; gap: 5px; flex-wrap: wrap; }
.action-btns { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: nowrap; }
.btn-sm { padding: 5px 10px; font-size: 0.8rem; }
.btn-edit { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.btn-edit:hover { background: #dbeafe; }
.btn-delete { border-color: #fecaca; background: #fff5f5; color: #dc2626; }
.btn-delete:hover { background: #fee2e2; }
.btn-detail { border-color: #e5e7eb; background: #fff; color: #374151; }
.btn-detail:hover { background: #f9fafb; }

.combo-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.combo-item { border: 1px solid #f1f3f4; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.combo-chips { display: flex; align-items: center; gap: 8px; }
.chip { background: #f3f4f6; border-radius: 7px; padding: 4px 10px; font-size: 0.85rem; font-weight: 500; }
.arrow { color: #9ca3af; font-size: 1rem; }
.combo-note { font-size: 0.82rem; color: #6b7280; line-height: 1.4; }

.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.form-label { font-size: 0.84rem; color: #374151; }
.form-input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 10px; font-size: 0.86rem; font-family: inherit; }
.req { color: #ef4444; }
.field-error { font-size: 0.78rem; color: #dc2626; margin: 4px 0 0; }
.manage-roles { display: flex; flex-direction: column; gap: 10px; }
.manage-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }

@media (max-width: 740px) { .combo-grid { grid-template-columns: 1fr; } }
</style>