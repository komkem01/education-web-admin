<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="6" :cols="5" />
    <template v-else>
      <div class="page-header">
        <div>
          <h2 class="page-title">ห้องเรียน</h2>
          <p class="page-desc">จัดการข้อมูลห้องเรียนทั้งหมดในโรงเรียน</p>
        </div>
        <button type="button" class="btn btn-primary" @click="openAdd">+ เพิ่มห้องเรียน</button>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="search-wrap">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="#9ca3af" stroke-width="1.4"/>
            <path d="M10 10l3 3" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          <input
            v-model="search"
            class="search-input"
            list="classroom-search-list"
            placeholder="ค้นหาชื่อห้อง / ครูประจำชั้น…"
            autocomplete="off"
          />
          <datalist id="classroom-search-list">
            <option v-for="r in rows" :key="r.id" :value="r.name">{{ r.teacher ? `${r.name} — ${r.teacher}` : r.name }}</option>
            <option v-for="t in uniqueTeachers" :key="t" :value="t" />
          </datalist>
        </div>
        <select v-model="filterGrade" class="filter-select">
          <option value="">ทุกระดับชั้น</option>
          <option value="ม.1">ม.1</option>
          <option value="ม.2">ม.2</option>
          <option value="ม.3">ม.3</option>
          <option value="ม.4">ม.4</option>
          <option value="ม.5">ม.5</option>
          <option value="ม.6">ม.10</option>
        </select>
        <select v-model="filterYear" class="filter-select">
          <option value="">ทุกปีการศึกษา</option>
          <option value="2568">2568</option>
          <option value="2567">2567</option>
        </select>
        <button v-if="search || filterGrade || filterYear" type="button" class="btn btn-clear" @click="clearFilters">
          ล้างตัวกรอง
        </button>
      </div>

      <!-- Table -->
      <AdminDataTable
        title="รายการห้องเรียน"
        :columns="cols"
        :rows="filteredRows"
      >
        <template #rowActions="{ row }">
          <div class="action-btns">
            <button type="button" class="btn btn-sm btn-detail" @click="openDetail(row as unknown as ClassroomRow)">รายละเอียด</button>
            <button type="button" class="btn btn-sm" @click="openEdit(row as unknown as ClassroomRow)">แก้ไข</button>
            <button type="button" class="btn btn-sm btn-danger" @click="openDelete(row as unknown as ClassroomRow)">ลบ</button>
          </div>
        </template>
      </AdminDataTable>

      <!-- Add / Edit Modal -->
      <AdminAppModal
        v-model="showModal"
        :title="isEditing ? 'แก้ไขห้องเรียน' : 'เพิ่มห้องเรียน'"
        size="md"
        confirm-label="บันทึก"
        @confirm="saveRow"
      >
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">ชื่อห้องเรียน <span class="req">*</span></label>
            <input v-model="form.name" class="form-input" placeholder="เช่น ม.1/1" />
            <span v-if="formErrors.name" class="field-error">{{ formErrors.name }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">ระดับชั้น <span class="req">*</span></label>
            <select v-model="form.grade" class="form-input">
              <option value="">— เลือก —</option>
              <option value="ม.1">ม.1</option>
              <option value="ม.2">ม.2</option>
              <option value="ม.3">ม.3</option>
              <option value="ม.4">ม.4</option>
              <option value="ม.5">ม.5</option>
              <option value="ม.6">ม.6</option>
            </select>
            <span v-if="formErrors.grade" class="field-error">{{ formErrors.grade }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">ปีการศึกษา <span class="req">*</span></label>
            <select v-model="form.year" class="form-input">
              <option value="">— เลือก —</option>
              <option value="2568">2568</option>
              <option value="2567">2567</option>
            </select>
            <span v-if="formErrors.year" class="field-error">{{ formErrors.year }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">ครูประจำชั้น</label>
            <input
              v-model="form.teacher"
              class="form-input"
              list="teacher-suggestions"
              placeholder="ชื่อครูประจำชั้น"
              autocomplete="off"
            />
            <datalist id="teacher-suggestions">
              <option v-for="t in uniqueTeachers" :key="t" :value="t" />
            </datalist>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">ห้องที่ใช้เรียน</label>
            <input
              v-model="form.room"
              class="form-input"
              list="room-suggestions"
              placeholder="เช่น อาคาร 1 ห้อง 101"
              autocomplete="off"
            />
            <datalist id="room-suggestions">
              <option v-for="r in uniqueRooms" :key="r" :value="r" />
            </datalist>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">จำนวนนักเรียน</label>
            <input v-model.number="form.studentCount" type="number" min="0" class="form-input" placeholder="0" />
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">หมายเหตุ</label>
            <textarea v-model="form.note" class="form-input form-textarea" placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)" />
          </div>
        </div>
      </AdminAppModal>

      <!-- Confirm Delete -->
      <AdminAppConfirmModal
        v-model="showConfirm"
        :title="`ลบห้องเรียน ${deleteTarget?.name ?? ''}?`"
        description="ข้อมูลห้องเรียนนี้จะถูกลบออกจากระบบ ไม่สามารถกู้คืนได้"
        @confirm="confirmDelete"
      />

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClassroomsData, type ClassroomRow } from '~/composables/useClassroomsData'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()

const { rows } = useClassroomsData()

const cols = [
  { key: 'name', label: 'ชื่อห้องเรียน' },
  { key: 'grade', label: 'ระดับชั้น' },
  { key: 'year', label: 'ปีการศึกษา' },
  { key: 'room', label: 'ห้องที่ใช้เรียน' },
  { key: 'teacher', label: 'ครูประจำชั้น' },
  { key: 'studentCount', label: 'จำนวนนักเรียน' },
]

const search = ref('')
const filterGrade = ref('')
const filterYear = ref('')

const uniqueTeachers = computed(() =>
  [...new Set(rows.value.map(r => r.teacher).filter(Boolean))]
)

const uniqueRooms = computed(() =>
  [...new Set(rows.value.map(r => r.room).filter(Boolean))]
)

function clearFilters() {
  search.value = ''
  filterGrade.value = ''
  filterYear.value = ''
}

const filteredRows = computed(() =>
  rows.value.filter(r => {
    const q = search.value.toLowerCase()
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.teacher.toLowerCase().includes(q)
    const matchGrade = !filterGrade.value || r.grade === filterGrade.value
    const matchYear = !filterYear.value || r.year === filterYear.value
    return matchSearch && matchGrade && matchYear
  }),
)

// ── Modal ──
const showModal = ref(false)
const isEditing = ref(false)
let editTarget: ClassroomRow | null = null

const emptyForm = (): ClassroomRow => ({ id: 0, name: '', grade: '', year: '2568', teacher: '', room: '', studentCount: 0, note: '' })
const form = ref<ClassroomRow>(emptyForm())
const formErrors = ref({ name: '', grade: '', year: '' })

function validate() {
  formErrors.value = { name: '', grade: '', year: '' }
  if (!form.value.name.trim()) formErrors.value.name = 'กรุณาระบุชื่อห้อง'
  if (!form.value.grade) formErrors.value.grade = 'กรุณาเลือกระดับชั้น'
  if (!form.value.year) formErrors.value.year = 'กรุณาเลือกปีการศึกษา'
  return !formErrors.value.name && !formErrors.value.grade && !formErrors.value.year
}

function openAdd() {
  isEditing.value = false
  editTarget = null
  form.value = emptyForm()
  formErrors.value = { name: '', grade: '', year: '' }
  showModal.value = true
}

function openEdit(row: ClassroomRow) {
  isEditing.value = true
  editTarget = row
  form.value = { ...row }
  formErrors.value = { name: '', grade: '', year: '' }
  showModal.value = true
}

function saveRow() {
  if (!validate()) return
  if (isEditing.value && editTarget) {
    const idx = rows.value.indexOf(editTarget)
    if (idx !== -1) rows.value[idx] = { ...form.value }
  }
  else {
    rows.value.push({ ...form.value, id: Date.now() })
  }
  showModal.value = false
}

// ── Detail ──
function openDetail(row: ClassroomRow) {
  navigateTo(`/admin/classrooms/${encodeURIComponent(String(row.id))}`)
}

// ── Delete ──
const showConfirm = ref(false)
let deleteTarget: ClassroomRow | null = null as ClassroomRow | null

function openDelete(row: ClassroomRow) {
  deleteTarget = row
  showConfirm.value = true
}

function confirmDelete() {
  if (deleteTarget) {
    rows.value = rows.value.filter(r => r !== deleteTarget)
    deleteTarget = null
  }
  showConfirm.value = false
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  color: #111827;
}

.page-desc {
  color: #6b7280;
  margin-top: 4px;
  font-size: 0.85rem;
}

.filter-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
  background: #fff;
}

.search-input:focus {
  border-color: #6366f1;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  background: #fff;
  cursor: pointer;
}

.action-btns {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s;
}

.btn-primary {
  background: #111827;
  color: #ffffff;
  border-color: #111827;
}

.btn-primary:hover {
  background: #1f2937;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 0.8rem;
}

.btn-danger {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.btn-danger:hover {
  background: #fee2e2;
}

.btn-clear {
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #6b7280;
  font-size: 0.8rem;
  padding: 7px 12px;
  white-space: nowrap;
}

.btn-clear:hover {
  background: #f9fafb;
  color: #374151;
}

.btn-detail {
  border-color: #c7d2fe;
  background: #eef2ff;
  color: #4338ca;
}

.btn-detail:hover {
  background: #e0e7ff;
}

.field-error {
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 2px;
}

/* Detail modal */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
  padding-bottom: 4px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item--full {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-value {
  font-size: 0.9rem;
  color: #111827;
  font-weight: 500;
}

.detail-footer-btns {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

/* Form */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group--full {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}

.req {
  color: #ef4444;
}

.form-input {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
  background: #fff;
}

.form-input:focus {
  border-color: #6366f1;
}

.form-textarea {
  min-height: 72px;
  resize: vertical;
}
</style>
