<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="5" :cols="5" />
    <template v-else>
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">ฝ่ายงาน</h2>
          <p class="page-desc">จัดการข้อมูลฝ่ายงานทั้งหมดในโรงเรียน</p>
        </div>
        <button type="button" class="btn btn-primary" @click="openAdd">+ เพิ่มฝ่ายงาน</button>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <select v-model="filterDepartmentId" class="filter-select">
          <option value="">ทุกฝ่ายงาน</option>
          <option v-for="r in rows" :key="r.id" :value="r.id">{{ r.name }}</option>
        </select>
        <select v-model="filterHead" class="filter-select">
          <option value="">ทุกหัวหน้าฝ่าย</option>
          <option v-for="opt in headOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <button v-if="filterDepartmentId || filterHead" type="button" class="btn btn-clear" @click="clearFilters">ล้างตัวกรอง</button>
      </div>

      <!-- Table -->
      <AdminDataTable
        title="รายการฝ่ายงาน"
        :columns="cols"
        :rows="filteredRows"
      >
        <template #rowActions="{ row }">
          <div class="action-btns">
            <button type="button" class="btn btn-sm btn-edit" @click="openEdit(row as DepartmentRow)">แก้ไข</button>
            <button type="button" class="btn btn-sm btn-delete" @click="openDelete(row as DepartmentRow)">ลบ</button>
          </div>
        </template>
      </AdminDataTable>

      <!-- Add / Edit Modal -->
      <AdminAppModal
        v-model="showModal"
        :title="isEditing ? 'แก้ไขฝ่ายงาน' : 'เพิ่มฝ่ายงาน'"
        size="md"
        confirm-label="บันทึก"
        @confirm="saveRow"
      >
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">ชื่อฝ่ายงาน <span class="req">*</span></label>
            <input v-model="form.name" class="form-input" placeholder="เช่น ฝ่ายวิชาการ" />
            <span v-if="formErrors.name" class="field-error">{{ formErrors.name }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">รหัสฝ่าย <span class="req">*</span></label>
            <input v-model="form.code" class="form-input" placeholder="เช่น ACAD" />
            <span v-if="formErrors.code" class="field-error">{{ formErrors.code }}</span>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">หัวหน้าฝ่าย (เฉพาะครู/บุคลากร)</label>
            <select v-model="form.head" class="form-input">
              <option value="">-- เลือกหัวหน้าฝ่าย (ครู/บุคลากร) --</option>
              <option v-for="opt in headOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">คำอธิบาย</label>
            <textarea v-model="form.description" class="form-input form-textarea" placeholder="อธิบายหน้าที่ความรับผิดชอบ..." />
          </div>
        </div>
      </AdminAppModal>

      <!-- Delete confirm -->
      <AdminAppConfirmModal
        v-model="showConfirm"
        title="ยืนยันการลบ?"
        :description="`ต้องการลบฝ่ายงาน '${deleteTarget?.name}' ใช่หรือไม่?`"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

type BaseResponse<T> = { data: T }

type DepartmentApiItem = {
  id: string
  school_id: string
  code: string
  name: string
  head: string | null
  description: string | null
  is_active: boolean
}

type PersonApiItem = {
  id: string
  first_name: string | null
  last_name: string | null
}

type DepartmentRow = {
  id: string
  name: string
  code: string
  head: string
  description: string
}

type Option = {
  value: string
  label: string
}

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const { profile } = useAdminAuth()
const rows = ref<DepartmentRow[]>([])
const headOptions = ref<Option[]>([])

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

function displayName(item: PersonApiItem) {
  const first = (item.first_name || '').trim()
  const last = (item.last_name || '').trim()
  return `${first} ${last}`.trim()
}

function mapRow(item: DepartmentApiItem): DepartmentRow {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    head: (item.head || '').trim(),
    description: (item.description || '').trim(),
  }
}

async function loadRows() {
  if (!import.meta.client || !authToken.value || !profile.value.schoolId) return
  try {
    const res = await apiFetch<BaseResponse<DepartmentApiItem[]>>(`/departments?school_id=${profile.value.schoolId}&only_active=false`, { headers: authHeaders() })
    rows.value = (Array.isArray(res.data) ? res.data : []).map(mapRow)
  }
  catch {
    rows.value = []
  }
}

async function loadHeadOptions() {
  if (!import.meta.client || !authToken.value) return
  try {
    const [staffsRes, teachersRes] = await Promise.all([
      apiFetch<BaseResponse<PersonApiItem[]>>('/staffs?only_active=true', { headers: authHeaders() }),
      apiFetch<BaseResponse<PersonApiItem[]>>('/teachers?only_active=true', { headers: authHeaders() }),
    ])

    const merged = [
      ...(Array.isArray(staffsRes.data) ? staffsRes.data : []),
      ...(Array.isArray(teachersRes.data) ? teachersRes.data : []),
    ]

    const seen = new Set<string>()
    const options: Option[] = []
    for (const item of merged) {
      const name = displayName(item)
      if (!name || seen.has(name)) continue
      seen.add(name)
      options.push({ value: name, label: name })
    }
    headOptions.value = options.sort((a, b) => a.label.localeCompare(b.label, 'th'))
  }
  catch {
    headOptions.value = []
  }
}

if (import.meta.client) {
  loadRows()
  loadHeadOptions()
}

const cols = [
  { key: 'code', label: 'รหัส' },
  { key: 'name', label: 'ชื่อฝ่ายงาน' },
  { key: 'head', label: 'หัวหน้าฝ่าย' },
  { key: 'description', label: 'คำอธิบาย' },
]

// ── Filters ──
const filterDepartmentId = ref('')
const filterHead = ref('')

function clearFilters() {
  filterDepartmentId.value = ''
  filterHead.value = ''
}

const filteredRows = computed(() => {
  return rows.value.filter(row => {
    if (filterDepartmentId.value && row.id !== filterDepartmentId.value) return false
    if (filterHead.value && row.head !== filterHead.value) return false
    return true
  })
})

// ── Add / Edit ──
const showModal = ref(false)
const isEditing = ref(false)
let editTarget: DepartmentRow | null = null

const emptyForm = (): DepartmentRow => ({ id: '', name: '', code: '', head: '', description: '' })
const form = ref<DepartmentRow>(emptyForm())
const formErrors = ref({ name: '', code: '' })

function validate() {
  formErrors.value = { name: '', code: '' }
  let ok = true
  if (!form.value.name.trim()) { formErrors.value.name = 'กรุณาระบุชื่อฝ่ายงาน'; ok = false }
  if (!form.value.code.trim()) { formErrors.value.code = 'กรุณาระบุรหัสฝ่าย'; ok = false }
  return ok
}

function openAdd() {
  isEditing.value = false
  editTarget = null
  form.value = emptyForm()
  formErrors.value = { name: '', code: '' }
  showModal.value = true
}

function openEdit(row: DepartmentRow) {
  isEditing.value = true
  editTarget = row
  form.value = { ...row }
  formErrors.value = { name: '', code: '' }
  showModal.value = true
}

async function saveRow() {
  if (!validate()) return
  if (!authToken.value || !profile.value.schoolId) return

  const payload = {
    school_id: profile.value.schoolId,
    code: form.value.code.trim(),
    name: form.value.name.trim(),
    head: form.value.head.trim() || null,
    description: form.value.description.trim() || null,
    is_active: true,
  }

  try {
    if (isEditing.value && editTarget) {
      const res = await apiFetch<BaseResponse<DepartmentApiItem>>(`/departments/${editTarget.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: payload,
      })
      const idx = rows.value.findIndex(item => item.id === editTarget!.id)
      if (idx !== -1) rows.value[idx] = mapRow(res.data)
    }
    else {
      const res = await apiFetch<BaseResponse<DepartmentApiItem>>('/departments', {
        method: 'POST',
        headers: authHeaders(),
        body: payload,
      })
      rows.value.push(mapRow(res.data))
    }
    showModal.value = false
  }
  catch {
    formErrors.value.code = formErrors.value.code || 'บันทึกข้อมูลไม่สำเร็จ'
  }
}

// ── Delete ──
const showConfirm = ref(false)
const deleteTarget = ref<DepartmentRow | null>(null)

function openDelete(row: DepartmentRow) {
  deleteTarget.value = row
  showConfirm.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value || !authToken.value) {
    showConfirm.value = false
    return
  }

  try {
    await apiFetch(`/departments/${deleteTarget.value.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    rows.value = rows.value.filter(r => r.id !== deleteTarget.value!.id)
    deleteTarget.value = null
  }
  finally {
    showConfirm.value = false
  }
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 22px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.85rem; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-wrap { position: relative; flex: 1; min-width: 220px; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.search-input { width: 100%; padding: 8px 12px 8px 32px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; box-sizing: border-box; transition: border-color 0.15s; background: #fff; }
.search-input:focus { border-color: #6366f1; }

.action-btns { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: nowrap; }
.btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #111827; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-primary:hover { background: #1f2937; }
.btn-sm { padding: 5px 10px; font-size: 0.8rem; }
.btn-edit { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.btn-edit:hover { background: #dbeafe; }
.btn-danger { border-color: #fecaca; background: #fff5f5; color: #dc2626; }
.btn-danger:hover { background: #fee2e2; }
.btn-clear { border: 1px solid #e5e7eb; background: #fff; color: #6b7280; font-size: 0.8rem; padding: 7px 12px; white-space: nowrap; }
.btn-clear:hover { background: #f9fafb; color: #374151; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group--full { grid-column: 1 / -1; }
.form-label { font-size: 0.85rem; font-weight: 500; color: #374151; }
.req { color: #ef4444; }
.form-input { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; transition: border-color 0.15s; background: #fff; }
.form-input:focus { border-color: #6366f1; }
.form-textarea { min-height: 72px; resize: vertical; }
.field-error { font-size: 0.75rem; color: #ef4444; margin-top: 2px; }
</style>
