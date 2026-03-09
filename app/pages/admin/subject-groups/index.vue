<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="8" :cols="4" />
    <template v-else>
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">กลุ่มสาระการเรียนรู้</h2>
          <p class="page-desc">จัดการกลุ่มสาระการเรียนรู้ทั้งหมดในโรงเรียน</p>
        </div>
        <button type="button" class="btn btn-primary" @click="openAdd">+ เพิ่มกลุ่มสาระ</button>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <select v-model="filterGroupId" class="filter-select">
          <option value="">ทุกกลุ่มสาระ</option>
          <option v-for="row in rows" :key="row.id" :value="row.id">{{ row.name }}</option>
        </select>
        <select v-model="filterHead" class="filter-select">
          <option value="">ทุกหัวหน้ากลุ่มสาระ</option>
          <option v-for="opt in headOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <button v-if="filterGroupId || filterHead" type="button" class="btn btn-clear" @click="clearFilters">ล้างตัวกรอง</button>
      </div>

      <!-- Table -->
      <AdminDataTable
        title="รายการกลุ่มสาระการเรียนรู้"
        :columns="cols"
        :rows="filteredRows"
      >
        <template #rowActions="{ row }">
          <div class="action-btns">
            <button type="button" class="btn btn-sm btn-edit" @click="openEdit(row as SubjectGroupRow)">แก้ไข</button>
            <button type="button" class="btn btn-sm btn-delete" @click="openDelete(row as SubjectGroupRow)">ลบ</button>
          </div>
        </template>
      </AdminDataTable>

      <!-- Add / Edit Modal -->
      <AdminAppModal
        v-model="showModal"
        :title="isEditing ? 'แก้ไขกลุ่มสาระการเรียนรู้' : 'เพิ่มกลุ่มสาระการเรียนรู้'"
        size="md"
        confirm-label="บันทึก"
        @confirm="saveRow"
      >
        <div class="form-grid">
          <div class="form-group form-group--full">
            <label class="form-label">ชื่อกลุ่มสาระ <span class="req">*</span></label>
            <input v-model="form.name" class="form-input" placeholder="เช่น กลุ่มสาระคณิตศาสตร์" />
            <span v-if="formErrors.name" class="field-error">{{ formErrors.name }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">รหัส <span class="req">*</span></label>
            <input v-model="form.code" class="form-input" placeholder="เช่น MATH" />
            <span v-if="formErrors.code" class="field-error">{{ formErrors.code }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">หัวหน้ากลุ่มสาระ (เฉพาะครู/บุคลากร)</label>
            <select v-model="form.head" class="form-input">
              <option value="">-- เลือกหัวหน้ากลุ่มสาระ (ครู/บุคลากร) --</option>
              <option v-for="opt in headOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">คำอธิบาย</label>
            <textarea v-model="form.description" class="form-input form-textarea" placeholder="อธิบายขอบเขตรายวิชาในกลุ่มสาระนี้..." />
          </div>
        </div>
      </AdminAppModal>

      <!-- Delete confirm -->
      <AdminAppConfirmModal
        v-model="showConfirm"
        title="ยืนยันการลบ?"
        :description="`ต้องการลบกลุ่มสาระ '${deleteTarget?.name}' ใช่หรือไม่?`"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

definePageMeta({ layout: 'admin' })

type BaseResponse<T> = { data: T }

type SubjectGroupApiItem = {
  id: string
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

type Option = {
  value: string
  label: string
}

type SubjectGroupRow = {
  id: string
  name: string
  code: string
  head: string
  description: string
}

const { loading } = usePageLoad()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const rows = ref<SubjectGroupRow[]>([])
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

function mapRow(item: SubjectGroupApiItem): SubjectGroupRow {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    head: (item.head || '').trim(),
    description: (item.description || '').trim(),
  }
}

async function loadRows() {
  if (!import.meta.client || !authToken.value) return

  try {
    const groupsRes = await apiFetch<BaseResponse<SubjectGroupApiItem[]>>('/subject-groups?only_active=false', { headers: authHeaders() })
    rows.value = (Array.isArray(groupsRes.data) ? groupsRes.data : []).map(mapRow)
  }
  catch {
    rows.value = []
  }
}

function displayName(item: PersonApiItem) {
  const first = (item.first_name || '').trim()
  const last = (item.last_name || '').trim()
  return `${first} ${last}`.trim()
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
  { key: 'name', label: 'ชื่อกลุ่มสาระ' },
  { key: 'head', label: 'หัวหน้ากลุ่มสาระ' },
  { key: 'description', label: 'คำอธิบาย' },
]

// ── Filters ──
const filterGroupId = ref('')
const filterHead = ref('')

function clearFilters() {
  filterGroupId.value = ''
  filterHead.value = ''
}

const filteredRows = computed(() => {
  return rows.value.filter(row => {
    if (filterGroupId.value && row.id !== filterGroupId.value) return false
    if (filterHead.value && row.head !== filterHead.value) return false
    return true
  })
})

// ── Add / Edit ──
const showModal = ref(false)
const isEditing = ref(false)
let editTarget: SubjectGroupRow | null = null

const emptyForm = (): SubjectGroupRow => ({ id: '', name: '', code: '', head: '', description: '' })
const form = ref<SubjectGroupRow>(emptyForm())
const formErrors = ref({ name: '', code: '' })

function validate() {
  formErrors.value = { name: '', code: '' }
  let ok = true
  if (!form.value.name.trim()) { formErrors.value.name = 'กรุณาระบุชื่อกลุ่มสาระ'; ok = false }
  if (!form.value.code.trim()) { formErrors.value.code = 'กรุณาระบุรหัส'; ok = false }
  return ok
}

function openAdd() {
  isEditing.value = false
  editTarget = null
  form.value = emptyForm()
  formErrors.value = { name: '', code: '' }
  showModal.value = true
}

function openEdit(row: SubjectGroupRow) {
  isEditing.value = true
  editTarget = row
  form.value = { ...row }
  formErrors.value = { name: '', code: '' }
  showModal.value = true
}

async function saveRow() {
  if (!validate()) return
  if (!authToken.value) return

  const payload = {
    code: form.value.code.trim(),
    name: form.value.name.trim(),
    head: form.value.head.trim() || null,
    description: form.value.description.trim() || null,
    is_active: true,
  }

  try {
    if (isEditing.value && editTarget) {
      const res = await apiFetch<BaseResponse<SubjectGroupApiItem>>(`/subject-groups/${editTarget.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: payload,
      })
      const idx = rows.value.findIndex(item => item.id === editTarget!.id)
      if (idx !== -1) rows.value[idx] = mapRow(res.data)
    }
    else {
      const res = await apiFetch<BaseResponse<SubjectGroupApiItem>>('/subject-groups', {
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
const deleteTarget = ref<SubjectGroupRow | null>(null)

function openDelete(row: SubjectGroupRow) {
  deleteTarget.value = row
  showConfirm.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value || !authToken.value) {
    showConfirm.value = false
    return
  }

  try {
    await apiFetch(`/subject-groups/${deleteTarget.value.id}`, {
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
.page {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 6px;
  background: radial-gradient(circle at top right, #e0f2fe 0%, #f8fafc 45%, #ffffff 100%);
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
}

.page-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.85rem; }

.filter-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
}

.filter-select {
  min-width: 220px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  background: #fff;
}

.filter-select:focus { border-color: #0ea5e9; }

.action-btns { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: nowrap; }
.btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #111827; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-primary:hover { background: #1f2937; }
.btn-sm { padding: 5px 10px; font-size: 0.8rem; }
.btn-edit { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.btn-edit:hover { background: #dbeafe; }
.btn-delete { border-color: #fecaca; background: #fff5f5; color: #dc2626; }
.btn-delete:hover { background: #fee2e2; }
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
