<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="8" :cols="5" />
    <template v-else>
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">กลุ่มย่อยสาระการเรียนรู้</h2>
          <p class="page-desc">จัดการกลุ่มย่อยสาระการเรียนรู้ภายใต้กลุ่มสาระหลัก</p>
        </div>
        <button type="button" class="btn btn-primary" @click="openAdd">+ เพิ่มกลุ่มย่อย</button>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <select v-model="filterSubgroup" class="filter-select">
          <option value="">ทุกกลุ่มย่อย</option>
          <option v-for="row in rows" :key="row.id" :value="row.id">{{ row.name }}</option>
        </select>
        <select v-model="filterParent" class="filter-select">
          <option value="">ทุกกลุ่มสาระหลัก</option>
          <option v-for="g in parentGroupOptions" :key="g.value" :value="g.value">{{ g.label }}</option>
        </select>
        <button v-if="filterSubgroup || filterParent" type="button" class="btn btn-clear" @click="clearFilters">ล้างตัวกรอง</button>
      </div>

      <!-- Table -->
      <AdminDataTable
        title="รายการกลุ่มย่อยสาระการเรียนรู้"
        :columns="cols"
        :rows="filteredRows"
      >
        <template #rowActions="{ row }">
          <div class="action-btns">
            <button type="button" class="btn btn-sm btn-edit" @click="openEdit(row as SubjectSubGroupRow)">แก้ไข</button>
            <button type="button" class="btn btn-sm btn-delete" @click="openDelete(row as SubjectSubGroupRow)">ลบ</button>
          </div>
        </template>
      </AdminDataTable>

      <!-- Add / Edit Modal -->
      <AdminAppModal
        v-model="showModal"
        :title="isEditing ? 'แก้ไขกลุ่มย่อยสาระ' : 'เพิ่มกลุ่มย่อยสาระ'"
        size="md"
        confirm-label="บันทึก"
        @confirm="saveRow"
      >
        <div class="form-grid">
          <div class="form-group form-group--full">
            <label class="form-label">ชื่อกลุ่มย่อย <span class="req">*</span></label>
            <input v-model="form.name" class="form-input" placeholder="เช่น ฟิสิกส์" />
            <span v-if="formErrors.name" class="field-error">{{ formErrors.name }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">รหัส <span class="req">*</span></label>
            <input v-model="form.code" class="form-input" placeholder="เช่น SCI-02" />
            <span v-if="formErrors.code" class="field-error">{{ formErrors.code }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">กลุ่มสาระหลัก <span class="req">*</span></label>
            <select v-model="form.parentGroupId" class="form-input">
              <option value="">-- เลือกกลุ่มสาระหลัก --</option>
              <option v-for="g in parentGroupOptions" :key="g.value" :value="g.value">{{ g.label }}</option>
            </select>
            <span v-if="formErrors.parentGroupId" class="field-error">{{ formErrors.parentGroupId }}</span>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">คำอธิบาย</label>
            <textarea v-model="form.description" class="form-input form-textarea" placeholder="อธิบายขอบเขตกลุ่มย่อยนี้..." />
          </div>
        </div>
      </AdminAppModal>

      <!-- Delete confirm -->
      <AdminAppConfirmModal
        v-model="showConfirm"
        title="ยืนยันการลบ?"
        :description="`ต้องการลบกลุ่มย่อย '${deleteTarget?.name}' ใช่หรือไม่?`"
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
  name: string
}

type SubjectSubgroupApiItem = {
  id: string
  subject_group_id: string
  code: string
  name: string
  description: string | null
}

type SubjectSubGroupRow = {
  id: string
  code: string
  name: string
  parentGroupId: string
  parentGroup: string
  description: string
}

const { loading } = usePageLoad()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const rows = ref<SubjectSubGroupRow[]>([])
const subjectGroupRows = ref<SubjectGroupApiItem[]>([])

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

function mapRow(item: SubjectSubgroupApiItem): SubjectSubGroupRow {
  const parent = subjectGroupRows.value.find(group => group.id === item.subject_group_id)
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    parentGroupId: item.subject_group_id,
    parentGroup: parent?.name || '-',
    description: (item.description || '').trim(),
  }
}

async function loadRows() {
  if (!import.meta.client || !authToken.value) return

  try {
    const [groupsRes, subgroupsRes] = await Promise.all([
      apiFetch<BaseResponse<SubjectGroupApiItem[]>>('/subject-groups?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<SubjectSubgroupApiItem[]>>('/subject-subgroups?only_active=false', { headers: authHeaders() }),
    ])
    const groups = Array.isArray(groupsRes.data) ? groupsRes.data : []
    subjectGroupRows.value = groups
    rows.value = (Array.isArray(subgroupsRes.data) ? subgroupsRes.data : []).map(mapRow)
  }
  catch {
    subjectGroupRows.value = []
    rows.value = []
  }
}

if (import.meta.client) loadRows()

const cols = [
  { key: 'code', label: 'รหัส' },
  { key: 'name', label: 'ชื่อกลุ่มย่อย' },
  { key: 'parentGroup', label: 'กลุ่มสาระหลัก' },
  { key: 'description', label: 'คำอธิบาย' },
]

// ── Parent group options (from subject groups composable) ──
const parentGroupOptions = computed(() => subjectGroupRows.value.map(r => ({ value: r.id, label: r.name })))

// ── Filters ──
const filterSubgroup = ref('')
const filterParent = ref('')

const filteredRows = computed(() => {
  return rows.value.filter(row => {
    if (filterSubgroup.value && row.id !== filterSubgroup.value) return false
    if (filterParent.value && row.parentGroupId !== filterParent.value) return false
    return true
  })
})

function clearFilters() {
  filterSubgroup.value = ''
  filterParent.value = ''
}

// ── Add / Edit ──
const showModal = ref(false)
const isEditing = ref(false)
let editTarget: SubjectSubGroupRow | null = null

const emptyForm = (): SubjectSubGroupRow => ({ id: '', name: '', code: '', parentGroupId: '', parentGroup: '', description: '' })
const form = ref<SubjectSubGroupRow>(emptyForm())
const formErrors = ref({ name: '', code: '', parentGroupId: '' })

function validate() {
  formErrors.value = { name: '', code: '', parentGroupId: '' }
  let ok = true
  if (!form.value.name.trim()) { formErrors.value.name = 'กรุณาระบุชื่อกลุ่มย่อย'; ok = false }
  if (!form.value.code.trim()) { formErrors.value.code = 'กรุณาระบุรหัส'; ok = false }
  if (!form.value.parentGroupId) { formErrors.value.parentGroupId = 'กรุณาเลือกกลุ่มสาระหลัก'; ok = false }
  return ok
}

function openAdd() {
  isEditing.value = false
  editTarget = null
  form.value = emptyForm()
  formErrors.value = { name: '', code: '', parentGroupId: '' }
  showModal.value = true
}

function openEdit(row: SubjectSubGroupRow) {
  isEditing.value = true
  editTarget = row
  form.value = { ...row }
  formErrors.value = { name: '', code: '', parentGroupId: '' }
  showModal.value = true
}

async function saveRow() {
  if (!validate()) return

  if (!authToken.value) return

  const payload = {
    subject_group_id: form.value.parentGroupId,
    code: form.value.code.trim(),
    name: form.value.name.trim(),
    description: form.value.description.trim() || null,
    is_active: true,
  }

  try {
    if (isEditing.value && editTarget) {
      const res = await apiFetch<BaseResponse<SubjectSubgroupApiItem>>(`/subject-subgroups/${editTarget.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: payload,
      })
      const idx = rows.value.findIndex(item => item.id === editTarget!.id)
      if (idx !== -1) rows.value[idx] = mapRow(res.data)
    }
    else {
      const res = await apiFetch<BaseResponse<SubjectSubgroupApiItem>>('/subject-subgroups', {
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
const deleteTarget = ref<SubjectSubGroupRow | null>(null)

function openDelete(row: SubjectSubGroupRow) {
  deleteTarget.value = row
  showConfirm.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value || !authToken.value) {
    showConfirm.value = false
    return
  }

  try {
    await apiFetch(`/subject-subgroups/${deleteTarget.value.id}`, {
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
  background: radial-gradient(circle at top right, #ccfbf1 0%, #f8fafc 50%, #ffffff 100%);
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid #d1fae5;
  background: linear-gradient(135deg, #ffffff 0%, #ecfeff 100%);
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
  background: #fff;
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
  cursor: pointer;
}

.filter-select:focus { border-color: #14b8a6; }

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
