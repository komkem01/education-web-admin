<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="5" :cols="7" />
    <template v-else>
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">นักเรียน</h2>
          <p class="page-desc">จัดการข้อมูลนักเรียน, การย้ายเข้า/ออก และการเลื่อนชั้นปี</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-outline">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            เลื่อนชั้นปี (Bulk)
          </button>
          <button type="button" class="btn btn-primary" @click="openAdd">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            เพิ่มนักเรียน
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-row">
        <div class="search-wrap">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="#9ca3af" stroke-width="1.4"/><path d="M10 10l3 3" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round"/></svg>
          <input
            v-model="search"
            class="input search"
            list="student-search-list"
            type="text"
            placeholder="ค้นหาชื่อ หรือ เลขประจำตัวนักเรียน..."
            autocomplete="off"
          />
          <datalist id="student-search-list">
            <option v-for="r in rows" :key="r.id" :value="r.name" />
            <option v-for="r in rows" :key="r.id + '-id'" :value="r.id" />
          </datalist>
        </div>
        <select v-model="filterClass" class="input sel">
          <option value="">ทุกระดับชั้น</option>
          <option>ม.1</option>
          <option>ม.2</option>
          <option>ม.3</option>
          <option>ม.4</option>
          <option>ม.5</option>
          <option>ม.6</option>
        </select>
        <select v-model="filterStatus" class="input sel">
          <option value="">ทุกสถานะ</option>
          <option>ปกติ</option>
          <option>รออนุมัติ</option>
          <option>ย้ายออก</option>
          <option>ลาออก</option>
        </select>
        <button v-if="search || filterClass || filterStatus" type="button" class="btn btn-clear" @click="clearFilters">ล้างตัวกรอง</button>
      </div>

      <!-- Table -->
      <AdminDataTable title="รายชื่อนักเรียน" :columns="cols" :rows="filteredRows">
        <template #cell-status="{ value }">
          <AdminStatusBadge
            :label="value as string"
            :variant="value === 'ปกติ' ? 'approved' : value === 'รออนุมัติ' ? 'pending' : 'default'"
          />
        </template>
        <template #rowActions="{ row }">
          <div class="action-btns">
            <button type="button" class="btn btn-sm btn-detail" @click="openDetail(row as unknown as StudentRow)">รายละเอียด</button>
            <button type="button" class="btn btn-sm btn-edit" @click="openEdit(row as unknown as StudentRow)">แก้ไข</button>
            <button type="button" class="btn btn-sm btn-danger" @click="openDelete(row as unknown as StudentRow)">ลบ</button>
          </div>
        </template>
      </AdminDataTable>

      <!-- Add / Edit Modal -->
      <AdminAppModal
        v-model="showModal"
        :title="editTarget ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่'"
        size="md"
        confirm-label="บันทึก"
        @confirm="saveRow"
      >
        <div class="form-grid">
          <label class="field">
            <span>เลขประจำตัวนักเรียน <span v-if="!editTarget" class="req">*</span></span>
            <input
              v-if="!editTarget"
              v-model="form.id"
              class="input"
              type="text"
              placeholder="66100001"
            />
            <div v-else class="id-display">
              <span class="id-badge">{{ form.id }}</span>
              <span class="id-hint">รหัสไม่สามารถแก้ไขได้</span>
            </div>
            <span v-if="formErrors.id" class="field-error">{{ formErrors.id }}</span>
          </label>
          <label class="field">
            <span>ชื่อ-นามสกุล <span class="req">*</span></span>
            <input v-model="form.name" class="input" type="text" placeholder="เด็กชาย/เด็กหญิง/นาย/นางสาว..." />
            <span v-if="formErrors.name" class="field-error">{{ formErrors.name }}</span>
          </label>
          <label class="field">
            <span>ชั้น/ห้อง</span>
            <input v-model="form.class" class="input" type="text" placeholder="ม.1/1" />
          </label>
          <label class="field">
            <span>ครูที่ปรึกษา</span>
            <input v-model="form.advisor" class="input" type="text" placeholder="ชื่อครูที่ปรึกษา" />
          </label>
          <label class="field">
            <span>GPA</span>
            <input v-model="form.gpa" class="input" type="text" placeholder="0.00" />
          </label>
          <label class="field">
            <span>คะแนนประพฤติ</span>
            <input v-model.number="form.discipline" class="input" type="number" min="0" max="100" placeholder="100" />
          </label>
          <label class="field field--full">
            <span>สถานะ</span>
            <select v-model="form.status" class="input">
              <option>ปกติ</option>
              <option>รออนุมัติ</option>
              <option>ย้ายออก</option>
              <option>ลาออก</option>
            </select>
          </label>
        </div>
      </AdminAppModal>

      <!-- Confirm Delete -->
      <AdminAppConfirmModal
        v-model="showConfirm"
        :description="`ต้องการลบนักเรียน '${deleteTarget?.name}' ออกจากระบบหรือไม่?`"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStudentsData, type StudentRow } from '~/composables/useStudentsData'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()

const cols = [
  { key: 'id', label: 'เลขประจำตัว' },
  { key: 'name', label: 'ชื่อ-นามสกุล' },
  { key: 'class', label: 'ชั้น/ห้อง' },
  { key: 'advisor', label: 'ครูที่ปรึกษา' },
  { key: 'gpa', label: 'GPA' },
  { key: 'discipline', label: 'คะแนนประพฤติ' },
  { key: 'status', label: 'สถานะ' },
]

const { rows } = useStudentsData()

const search = ref('')
const filterClass = ref('')
const filterStatus = ref('')

const filteredRows = computed(() =>
  rows.value.filter(r => {
    const matchSearch = !search.value || r.name.includes(search.value) || r.id.includes(search.value)
    const matchClass = !filterClass.value || r.class.startsWith(filterClass.value)
    const matchStatus = !filterStatus.value || r.status === filterStatus.value
    return matchSearch && matchClass && matchStatus
  }),
)

function clearFilters() {
  search.value = ''
  filterClass.value = ''
  filterStatus.value = ''
}

function generateId() {
  const nums = rows.value.map(r => parseInt(r.id.replace(/\D/g, '')) || 0)
  return (Math.max(0, ...nums) + 1).toString().padStart(8, '0')
}

// ── CRUD ──
const showModal = ref(false)
const editTarget = ref<StudentRow | null>(null)
const emptyForm = (): StudentRow => ({
  id: '', name: '', class: '', advisor: '', gpa: '0.00', discipline: 100, status: 'ปกติ',
  idCard: '', birthdate: '', phone: '', address: '',
  parentName: '', parentPhone: '', parentRelation: '',
})
const form = ref<StudentRow>(emptyForm())
const formErrors = ref({ id: '', name: '' })

const openAdd = () => {
  editTarget.value = null
  form.value = { ...emptyForm(), id: generateId() }
  formErrors.value = { id: '', name: '' }
  showModal.value = true
}

const openEdit = (row: StudentRow) => {
  editTarget.value = row
  form.value = { ...row }
  formErrors.value = { id: '', name: '' }
  showModal.value = true
}

function validate() {
  formErrors.value = { id: '', name: '' }
  if (!form.value.id.trim()) formErrors.value.id = 'กรุณาระบุเลขประจำตัว'
  if (!form.value.name.trim()) formErrors.value.name = 'กรุณาระบุชื่อ-นามสกุล'
  return !formErrors.value.id && !formErrors.value.name
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
function openDetail(row: StudentRow) {
  navigateTo(`/admin/students/${encodeURIComponent(row.id)}`)
}

// ── Delete ──
const showConfirm = ref(false)
const deleteTarget = ref<StudentRow | null>(null)

const openDelete = (row: StudentRow) => { deleteTarget.value = row; showConfirm.value = true }
const confirmDelete = () => {
  if (deleteTarget.value) rows.value = rows.value.filter(r => r !== deleteTarget.value)
  showConfirm.value = false
  deleteTarget.value = null
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.page-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.85rem; }
.header-actions { display: flex; gap: 8px; }
.filter-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-wrap { position: relative; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 0.875rem; font-family: inherit; background: #fff; color: #111827; outline: none; transition: border-color 0.12s; }
.input:focus { border-color: #6366f1; }
.search { width: 280px; padding-left: 32px; }
.sel { cursor: pointer; }
.btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid transparent; background: #fff; color: #111827; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-primary:hover { background: #1f2937; }
.btn-outline { border-color: #e5e7eb; }
.btn-outline:hover { background: #f9fafb; }
.btn-clear { border: 1px solid #e5e7eb; background: #fff; color: #6b7280; font-size: 0.8rem; padding: 7px 12px; white-space: nowrap; font-family: inherit; cursor: pointer; border-radius: 8px; font-weight: 500; }
.btn-clear:hover { background: #f9fafb; color: #374151; }
.action-btns { display: flex; gap: 6px; justify-content: flex-end; }
.btn-sm { padding: 5px 10px; font-size: 0.8rem; }
.btn-detail { border-color: #c7d2fe; background: #eef2ff; color: #4338ca; }
.btn-detail:hover { background: #e0e7ff; }
.btn-edit { border-color: #d1d5db; background: #f9fafb; color: #374151; }
.btn-edit:hover { background: #f3f4f6; border-color: #9ca3af; }
.btn-danger { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
.btn-danger:hover { background: #fee2e2; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 5px; font-size: 0.83rem; font-weight: 500; color: #374151; }
.field--full { grid-column: 1 / -1; }
.req { color: #ef4444; }
.field-error { font-size: 0.75rem; color: #ef4444; }
.id-display { display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
.id-badge { font-size: 0.875rem; font-weight: 600; color: #374151; font-family: monospace; letter-spacing: 0.05em; }
.id-hint { font-size: 0.75rem; color: #9ca3af; }
</style>
