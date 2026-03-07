<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="5" :cols="6" />
    <template v-else>
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">ครู</h2>
        <p class="page-desc">จัดการข้อมูลครูผู้สอนทั้งหมดในโรงเรียน</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openAdd">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        เพิ่มครู
      </button>
    </div>

    <!-- Filters -->
    <div class="filter-row">
      <div class="search-wrap">
        <svg class="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="#9ca3af" stroke-width="1.4"/><path d="M10 10l3 3" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round"/></svg>
        <input
          v-model="search"
          class="input search"
          list="teacher-search-list"
          type="text"
          placeholder="ค้นหาชื่อ หรือ รหัสครู..."
          autocomplete="off"
        />
        <datalist id="teacher-search-list">
          <option v-for="r in rows" :key="r.id" :value="r.name" />
          <option v-for="r in rows" :key="r.id + '-id'" :value="r.id" />
        </datalist>
      </div>
      <select v-model="filterSubject" class="input sel">
        <option value="">กลุ่มสาระทั้งหมด</option>
        <option>ภาษาไทย</option>
        <option>คณิตศาสตร์</option>
        <option>วิทยาศาสตร์</option>
        <option>สังคมศึกษา</option>
        <option>ภาษาต่างประเทศ</option>
        <option>ศิลปะ</option>
        <option>พลศึกษา</option>
      </select>
      <button v-if="search || filterSubject" type="button" class="btn btn-clear" @click="clearFilters">ล้างตัวกรอง</button>
    </div>

    <!-- Table -->
    <AdminDataTable title="รายชื่อครู" :columns="cols" :rows="filteredRows">
      <template #cell-status="{ value }">
        <AdminStatusBadge
          :label="value as string"
          :variant="value === 'อนุมัติแล้ว' ? 'approved' : value === 'รออนุมัติ' ? 'pending' : 'default'"
        />
      </template>
      <template #rowActions="{ row }">
        <div class="action-btns">
          <button type="button" class="btn btn-sm btn-detail" @click="openDetail(row as unknown as TeacherRow)">รายละเอียด</button>
          <button type="button" class="btn btn-sm btn-edit" @click="openEdit(row as unknown as TeacherRow)">แก้ไข</button>
          <button type="button" class="btn btn-sm btn-danger" @click="openDelete(row as unknown as TeacherRow)">ลบ</button>
        </div>
      </template>
    </AdminDataTable>

    <!-- Add / Edit Modal -->
    <AdminAppModal v-model="showModal" :title="editTarget ? 'แก้ไขข้อมูลครู' : 'เพิ่มครูใหม่'" size="md" confirm-label="บันทึก" @confirm="saveRow">
      <div class="form-grid">
        <label class="field">
          <span>รหัสครู <span v-if="!editTarget" class="req">*</span></span>
          <input
            v-if="!editTarget"
            v-model="form.id"
            class="input"
            type="text"
            placeholder="T001 (กรอกเองหรือปล่อยไว้เพื่อสร้างอัตโนมัติ)"
          />
          <div v-else class="id-display">
            <span class="id-badge">{{ form.id }}</span>
            <span class="id-hint">รหัสไม่สามารถแก้ไขได้</span>
          </div>
          <span v-if="formErrors.id" class="field-error">{{ formErrors.id }}</span>
        </label>
        <label class="field">
          <span>ชื่อ-นามสกุล <span class="req">*</span></span>
          <input v-model="form.name" class="input" type="text" placeholder="นาย/นาง/นางสาว..." />
          <span v-if="formErrors.name" class="field-error">{{ formErrors.name }}</span>
        </label>
        <label class="field">
          <span>กลุ่มสาระ</span>
          <select v-model="form.subject" class="input">
            <option>ภาษาไทย</option>
            <option>คณิตศาสตร์</option>
            <option>วิทยาศาสตร์</option>
            <option>สังคมศึกษา</option>
            <option>ภาษาต่างประเทศ</option>
            <option>ศิลปะ</option>
            <option>พลศึกษา</option>
          </select>
        </label>
        <label class="field">
          <span>ครูที่ปรึกษาห้อง</span>
          <input v-model="form.class" class="input" type="text" placeholder="ม.1/1 (เว้นว่างถ้าไม่มี)" />
        </label>
        <label class="field">
          <span>จำนวนวิชาที่สอน</span>
          <input v-model.number="form.courses" class="input" type="number" min="0" placeholder="0" />
        </label>
        <label class="field">
          <span>สถานะบัญชี</span>
          <select v-model="form.status" class="input">
            <option>อนุมัติแล้ว</option>
            <option>รออนุมัติ</option>
            <option>ระงับ</option>
          </select>
        </label>
      </div>
    </AdminAppModal>

    <!-- Confirm Delete -->
    <AdminAppConfirmModal
      v-model="showConfirm"
      :description="`ต้องการลบครู '${deleteTarget?.name}' ออกจากระบบหรือไม่?`"
      @confirm="confirmDelete"
    />

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTeachersData, type TeacherRow, type EducationRecord, type WorkRecord } from '~/composables/useTeachersData'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()

const cols = [
  { key: 'id', label: 'รหัสครู' },
  { key: 'name', label: 'ชื่อ-นามสกุล' },
  { key: 'subject', label: 'กลุ่มสาระ' },
  { key: 'class', label: 'ครูที่ปรึกษา' },
  { key: 'courses', label: 'วิชาที่สอน' },
  { key: 'status', label: 'สถานะบัญชี' },
]

const { rows } = useTeachersData()

const search = ref('')
const filterSubject = ref('')

const filteredRows = computed(() =>
  rows.value.filter(r => {
    const matchSearch = !search.value || r.name.includes(search.value) || r.id.includes(search.value)
    const matchSubject = !filterSubject.value || r.subject === filterSubject.value
    return matchSearch && matchSubject
  }),
)

// ── Tabs ──
const formTabs = [
  { key: 'general', label: 'ข้อมูลทั่วไป' },
  { key: 'education', label: 'ประวัติการศึกษา' },
  { key: 'work', label: 'ประวัติการทำงาน' },
]
const activeFormTab = ref('general')

// ── CRUD ──
const showModal = ref(false)
const editTarget = ref<TeacherRow | null>(null)
const emptyForm = (): TeacherRow => ({
  id: '', name: '', subject: 'ภาษาไทย', class: '', courses: 0, status: 'รออนุมัติ',
  idCard: '', birthdate: '', phone: '', email: '', address: '',
  education: [], workHistory: [],
})
const form = ref<TeacherRow>(emptyForm())
const formErrors = ref({ id: '', name: '' })

function clearFilters() {
  search.value = ''
  filterSubject.value = ''
}

function generateId() {
  const nums = rows.value.map(r => parseInt(r.id.replace(/\D/g, '')) || 0)
  const next = (Math.max(0, ...nums) + 1).toString().padStart(3, '0')
  return `T${next}`
}

const openAdd = () => {
  editTarget.value = null
  form.value = { ...emptyForm(), id: generateId() }
  formErrors.value = { id: '', name: '' }
  activeFormTab.value = 'general'
  showModal.value = true
}

const openEdit = (row: TeacherRow) => {
  editTarget.value = row
  form.value = {
    ...row,
    education: row.education.map(e => ({ ...e })),
    workHistory: row.workHistory.map(w => ({ ...w })),
  }
  formErrors.value = { id: '', name: '' }
  activeFormTab.value = 'general'
  showModal.value = true
}

const emptyEdu = (): EducationRecord => ({ degree: 'ปริญญาตรี', major: '', institution: '', year: '', gpa: '' })
const emptyWork = (): WorkRecord => ({ position: '', organization: '', startYear: '', endYear: 'ปัจจุบัน', note: '' })

function addEducation() { form.value.education.push(emptyEdu()) }
function removeEducation(idx: number) { form.value.education.splice(idx, 1) }
function addWork() { form.value.workHistory.push(emptyWork()) }
function removeWork(idx: number) { form.value.workHistory.splice(idx, 1) }

function validate() {
  formErrors.value = { id: '', name: '' }
  if (!form.value.id.trim()) formErrors.value.id = 'กรุณาระบุรหัสครู'
  if (!form.value.name.trim()) formErrors.value.name = 'กรุณาระบุชื่อ-นามสกุล'
  return !formErrors.value.id && !formErrors.value.name
}

const saveRow = () => {
  if (!validate()) { activeFormTab.value = 'general'; return }
  if (editTarget.value) {
    const idx = rows.value.indexOf(editTarget.value)
    if (idx >= 0) rows.value[idx] = {
      ...form.value,
      education: form.value.education.map(e => ({ ...e })),
      workHistory: form.value.workHistory.map(w => ({ ...w })),
    }
  } else {
    rows.value.push({
      ...form.value,
      education: form.value.education.map(e => ({ ...e })),
      workHistory: form.value.workHistory.map(w => ({ ...w })),
    })
  }
  showModal.value = false
}

// ── Detail ──
function openDetail(row: TeacherRow) {
  navigateTo(`/admin/teachers/${encodeURIComponent(row.id)}`)
}

// ── Delete ──
const showConfirm = ref(false)
const deleteTarget = ref<TeacherRow | null>(null)

const openDelete = (row: TeacherRow) => { deleteTarget.value = row; showConfirm.value = true }
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
.filter-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-wrap { position: relative; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 0.875rem; font-family: inherit; background: #fff; color: #111827; outline: none; transition: border-color 0.12s; }
.input:focus { border-color: #6366f1; }
.search { width: 260px; padding-left: 32px; }
.sel { cursor: pointer; }
.btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid transparent; background: #fff; color: #111827; cursor: pointer; font-family: inherit; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-primary:hover { background: #1f2937; }
.btn-clear { border: 1px solid #e5e7eb; background: #fff; color: #6b7280; font-size: 0.8rem; padding: 7px 12px; white-space: nowrap; font-family: inherit; cursor: pointer; border-radius: 8px; font-weight: 500; }
.btn-clear:hover { background: #f9fafb; color: #374151; }
.action-btns { display: flex; gap: 6px; justify-content: flex-end; }
.btn-sm { padding: 5px 10px; font-size: 0.8rem; }
.btn-detail { border-color: #e5e7eb; background: #fff; color: #374151; }
.btn-detail:hover { background: #f9fafb; }
.btn-edit { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.btn-edit:hover { background: #dbeafe; border-color: #93c5fd; }
.btn-danger { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
.btn-danger:hover { background: #fee2e2; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 5px; font-size: 0.83rem; font-weight: 500; color: #374151; }
.req { color: #ef4444; }
.field-error { font-size: 0.75rem; color: #ef4444; margin-top: 2px; }
.id-display { display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
.id-badge { font-size: 0.875rem; font-weight: 600; color: #374151; font-family: monospace; letter-spacing: 0.05em; }
.id-hint { font-size: 0.75rem; color: #9ca3af; }
.form-textarea { min-height: 68px; resize: vertical; }

/* Tabs */
.tab-bar { display: flex; gap: 2px; border-bottom: 2px solid #e5e7eb; margin-bottom: 20px; }
.tab-btn { padding: 8px 16px; font-size: 0.875rem; font-weight: 500; color: #6b7280; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; font-family: inherit; transition: color 0.12s, border-color 0.12s; }
.tab-btn:hover { color: #374151; }
.tab-btn--active { color: #4f46e5; border-bottom-color: #4f46e5; }

/* History cards (form) */
.history-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin-bottom: 12px; background: #fafafa; }
.history-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.history-card-no { font-size: 0.8rem; font-weight: 600; color: #6b7280; }
.btn-remove { font-size: 0.75rem; padding: 3px 8px; border-radius: 6px; border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; cursor: pointer; font-family: inherit; }
.btn-remove:hover { background: #fee2e2; }
.btn-add-history { width: 100%; padding: 9px; border: 1px dashed #d1d5db; border-radius: 8px; background: #f9fafb; color: #6b7280; font-size: 0.875rem; font-family: inherit; cursor: pointer; transition: all 0.12s; }
.btn-add-history:hover { border-color: #6366f1; color: #4f46e5; background: #eef2ff; }

/* Detail */
.detail-section { margin-bottom: 20px; }
.detail-section-title { font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 12px; padding-bottom: 6px; border-bottom: 1px solid #f3f4f6; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 24px; }
.detail-item { display: flex; flex-direction: column; gap: 4px; }
.detail-item--full { grid-column: 1 / -1; }
.detail-label { font-size: 0.72rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.04em; }
.detail-value { font-size: 0.9rem; color: #111827; font-weight: 500; }
.detail-value.mono { font-family: monospace; letter-spacing: 0.04em; }
.detail-footer-btns { display: flex; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f3f4f6; }

/* History view cards (detail) */
.history-view-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; background: #fff; }
.hvc-degree { font-size: 0.875rem; font-weight: 700; color: #111827; }
.hvc-major { font-size: 0.85rem; color: #4f46e5; font-weight: 500; margin-top: 2px; }
.hvc-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.hvc-inst { font-size: 0.82rem; color: #374151; }
.hvc-meta { font-size: 0.78rem; color: #6b7280; background: #f3f4f6; border-radius: 999px; padding: 2px 8px; }
.hvc-note { font-size: 0.78rem; color: #9ca3af; }
.empty-state { text-align: center; padding: 32px 0; color: #9ca3af; font-size: 0.875rem; }
</style>

