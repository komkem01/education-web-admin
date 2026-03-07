<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="4" :cols="6" />
    <template v-else>
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">บุคลากร</h2>
        <p class="page-desc">จัดการข้อมูลบุคลากรในโรงเรียน</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openAdd">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        เพิ่มบุคลากร
      </button>
    </div>

    <!-- Filters -->
    <div class="filter-row">
      <div class="search-wrap">
        <svg class="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="#9ca3af" stroke-width="1.4"/><path d="M10 10l3 3" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round"/></svg>
        <input
          v-model="search"
          class="input search"
          list="personnel-search-list"
          type="text"
          placeholder="ค้นหาชื่อ หรือ รหัสประจำตัว..."
          autocomplete="off"
        />
        <datalist id="personnel-search-list">
          <option v-for="r in rows" :key="r.id" :value="r.name" />
          <option v-for="r in rows" :key="r.id + '-id'" :value="r.id" />
        </datalist>
      </div>
      <select v-model="filterDept" class="input sel">
        <option value="">ฝ่ายงานทั้งหมด</option>
        <option v-for="d in deptRows" :key="d.id" :value="d.name">{{ d.name }}</option>
      </select>
      <button v-if="search || filterDept" type="button" class="btn btn-clear" @click="clearFilters">ล้างตัวกรอง</button>
    </div>

    <!-- Table -->
    <AdminDataTable title="รายชื่อบุคลากร" :columns="cols" :rows="filteredRows">
      <template #cell-roles="{ value }">
        <div class="tag-list">
          <span v-for="r in (value as string[])" :key="r" class="tag">{{ r }}</span>
        </div>
      </template>
      <template #cell-status="{ value }">
        <AdminStatusBadge :label="value as string" :variant="value === 'ใช้งาน' ? 'approved' : 'default'" />
      </template>
      <template #rowActions="{ row }">
        <div class="action-btns">
          <button type="button" class="btn btn-sm btn-detail" @click="openDetail(row as unknown as PersonnelRow)">รายละเอียด</button>
          <button type="button" class="btn btn-sm btn-edit" @click="openEdit(row as unknown as PersonnelRow)">แก้ไข</button>
          <button type="button" class="btn btn-sm btn-danger" @click="openDelete(row as unknown as PersonnelRow)">ลบ</button>
        </div>
      </template>
    </AdminDataTable>

    <!-- Add / Edit Modal -->
    <AdminAppModal v-model="showModal" :title="editTarget ? 'แก้ไขข้อมูลบุคลากร' : 'เพิ่มบุคลากรใหม่'" size="md" confirm-label="บันทึก" @confirm="saveRow">
      <div class="form-grid">
        <label class="field">
          <span>รหัสประจำตัว</span>
          <div class="id-display">
            <span class="id-badge">{{ form.id || '—' }}</span>
            <span class="id-hint">{{ editTarget ? 'รหัสประจำตัวไม่สามารถแก้ไขได้' : 'ระบบสร้างให้อัตโนมัติ' }}</span>
          </div>
        </label>
        <label class="field">
          <span>ชื่อ-นามสกุล <span class="req">*</span></span>
          <input v-model="form.name" class="input" type="text" placeholder="นาย/นาง/นางสาว..." />
          <span v-if="formErrors.name" class="field-error">{{ formErrors.name }}</span>
        </label>
        <label class="field">
          <span>ฝ่ายงาน</span>
          <select v-model="form.dept" class="input">
            <option v-for="d in deptRows" :key="d.id" :value="d.name">{{ d.name }}</option>
          </select>
        </label>
        <label class="field">
          <span>เบอร์โทร</span>
          <input v-model="form.phone" class="input" type="text" placeholder="08x-xxx-xxxx" />
        </label>
        <label class="field field--full">
          <span>บทบาทในระบบ (เลือกได้หลายรายการ)</span>
          <div class="checkbox-row">
            <label v-for="r in roleOptions" :key="r" class="checkbox-item">
              <input type="checkbox" :value="r" :checked="form.roles.includes(r)" @change="toggleRole(r)" />
              {{ r }}
            </label>
          </div>
        </label>
        <label class="field">
          <span>สถานะ</span>
          <select v-model="form.status" class="input">
            <option>ใช้งาน</option>
            <option>ไม่ใช้งาน</option>
          </select>
        </label>
      </div>
    </AdminAppModal>

    <!-- Confirm Delete -->
    <AdminAppConfirmModal
      v-model="showConfirm"
      :description="`ต้องการลบ '${deleteTarget?.name}' ออกจากระบบหรือไม่?`"
      @confirm="confirmDelete"
    />

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePersonnelsData, type PersonnelRow } from '~/composables/usePersonnelsData'
import { useDepartmentsData } from '~/composables/useDepartmentsData'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()

const cols = [
  { key: 'id', label: 'รหัส' },
  { key: 'name', label: 'ชื่อ-นามสกุล' },
  { key: 'dept', label: 'ฝ่ายงาน' },
  { key: 'roles', label: 'บทบาทในระบบ' },
  { key: 'phone', label: 'เบอร์โทร' },
  { key: 'status', label: 'สถานะ' },
]

const roleOptions = ['บุคลากร', 'ครู', 'แอดมิน', 'ฝ่ายวิชาการ', 'ฝ่ายทะเบียน']

const { rows } = usePersonnelsData()
const { rows: deptRows } = useDepartmentsData()

const search = ref('')
const filterDept = ref('')

const filteredRows = computed(() =>
  rows.value.filter(r => {
    const matchSearch = !search.value || r.name.includes(search.value) || r.id.includes(search.value)
    const matchDept = !filterDept.value || r.dept === filterDept.value
    return matchSearch && matchDept
  }),
)

// ── CRUD ──
const showModal = ref(false)
const editTarget = ref<PersonnelRow | null>(null)
const emptyForm = (): PersonnelRow => ({ id: '', name: '', dept: deptRows.value[0]?.name ?? '', roles: ['บุคลากร'], phone: '', status: 'ใช้งาน' })
const form = ref<PersonnelRow>(emptyForm())
const formErrors = ref({ id: '', name: '' })

function generateId() {
  const nums = rows.value.map(r => parseInt(r.id.replace(/\D/g, '')) || 0)
  const next = (Math.max(0, ...nums) + 1).toString().padStart(3, '0')
  return `P${next}`
}

function clearFilters() {
  search.value = ''
  filterDept.value = ''
}

const openAdd = () => {
  editTarget.value = null
  form.value = { ...emptyForm(), id: generateId() }
  formErrors.value = { id: '', name: '' }
  showModal.value = true
}

const openEdit = (row: PersonnelRow) => {
  editTarget.value = row
  form.value = { ...row, roles: [...row.roles] }
  formErrors.value = { id: '', name: '' }
  showModal.value = true
}

const toggleRole = (role: string) => {
  const idx = form.value.roles.indexOf(role)
  if (idx >= 0) form.value.roles.splice(idx, 1)
  else form.value.roles.push(role)
}

function validate() {
  formErrors.value = { id: '', name: '' }
  if (!form.value.name.trim()) formErrors.value.name = 'กรุณาระบุชื่อ-นามสกุล'
  return !formErrors.value.name
}

const saveRow = () => {
  if (!validate()) return
  if (editTarget.value) {
    const idx = rows.value.indexOf(editTarget.value)
    if (idx >= 0) rows.value[idx] = { ...form.value }
  } else {
    rows.value.push({ ...form.value })
  }
  showModal.value = false
}

// ── Detail ──
function openDetail(row: PersonnelRow) {
  navigateTo(`/admin/personnels/${encodeURIComponent(row.id)}`)
}

// ── Delete ──
const showConfirm = ref(false)
const deleteTarget = ref<PersonnelRow | null>(null)

const openDelete = (row: PersonnelRow) => {
  deleteTarget.value = row
  showConfirm.value = true
}

const confirmDelete = () => {
  if (deleteTarget.value) {
    rows.value = rows.value.filter(r => r !== deleteTarget.value)
  }
  showConfirm.value = false
  deleteTarget.value = null
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.page-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.85rem; }

.filter-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-wrap { position: relative; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 0.875rem; font-family: inherit; background: #fff; color: #111827; outline: none; transition: border-color 0.12s; }
.input:focus { border-color: #6366f1; }
.search { width: 260px; padding-left: 32px; }
.sel { cursor: pointer; }

.btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid transparent; background: #fff; color: #111827; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-primary:hover { background: #1f2937; }

.action-btns { display: flex; gap: 6px; justify-content: flex-end; }
.btn-sm { padding: 5px 10px; font-size: 0.8rem; }
.btn-edit { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.btn-edit:hover { background: #dbeafe; border-color: #93c5fd; }
.btn-detail { border-color: #e5e7eb; background: #fff; color: #374151; }
.btn-detail:hover { background: #f9fafb; }
.btn-danger { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
.btn-danger:hover { background: #fee2e2; }
.btn-clear { border: 1px solid #e5e7eb; background: #fff; color: #6b7280; font-size: 0.8rem; padding: 7px 12px; white-space: nowrap; font-family: inherit; cursor: pointer; border-radius: 8px; font-weight: 500; }
.btn-clear:hover { background: #f9fafb; color: #374151; }

.tag-list { display: flex; gap: 4px; flex-wrap: wrap; }
.tag { font-size: 0.72rem; font-weight: 500; background: #f3f4f6; color: #374151; border-radius: 999px; padding: 2px 8px; }

/* Form */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 5px; font-size: 0.83rem; font-weight: 500; color: #374151; }
.field--full { grid-column: 1 / -1; }
.checkbox-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 2px; }
.checkbox-item { display: flex; align-items: center; gap: 5px; font-size: 0.85rem; cursor: pointer; color: #374151; }
.req { color: #ef4444; }
.field-error { font-size: 0.75rem; color: #ef4444; margin-top: 2px; }
.input--disabled { background: #f9fafb !important; color: #6b7280 !important; cursor: not-allowed !important; }
.id-display { display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
.id-badge { font-size: 0.875rem; font-weight: 600; color: #374151; font-family: monospace; letter-spacing: 0.05em; }
.id-hint { font-size: 0.75rem; color: #9ca3af; }

/* Detail modal */
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; padding-bottom: 4px; }
.detail-item { display: flex; flex-direction: column; gap: 4px; }
.detail-item--full { grid-column: 1 / -1; }
.detail-label { font-size: 0.75rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.04em; }
.detail-value { font-size: 0.9rem; color: #111827; font-weight: 500; }
.detail-footer-btns { display: flex; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f3f4f6; }
</style>

