<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="6" :cols="7" />
    <template v-else>
      <div class="page-header">
        <div>
          <h2 class="page-title">บันทึกพฤติกรรม</h2>
          <p class="page-desc">บันทึกและติดตามพฤติกรรมนักเรียนรายคน</p>
        </div>
        <button type="button" class="btn btn-primary" @click="openAdd">+ บันทึกพฤติกรรม</button>
      </div>

      <!-- Summary strip -->
      <div class="summary-strip">
        <div class="summary-item summary-item--good">
          <span class="s-value">{{ goodCount }}</span>
          <span class="s-label">บันทึกดี</span>
        </div>
        <div class="summary-item summary-item--bad">
          <span class="s-value">{{ badCount }}</span>
          <span class="s-label">บันทึกโทษ</span>
        </div>
        <div class="summary-item summary-item--points">
          <span class="s-value">{{ totalPoints > 0 ? '+' : '' }}{{ totalPoints }}</span>
          <span class="s-label">คะแนนสุทธิ (filter)</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="search-wrap">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="#9ca3af" stroke-width="1.4"/>
            <path d="M10 10l3 3" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          <input v-model="search" class="search-input" placeholder="ค้นหาชื่อ / รหัสนักเรียน…" autocomplete="off" />
        </div>
        <select v-model="filterType" class="filter-select">
          <option value="">ทุกประเภท</option>
          <option value="ดี">บันทึกดี</option>
          <option value="ไม่ดี">บันทึกโทษ</option>
        </select>
        <select v-model="filterClassroom" class="filter-select">
          <option value="">ทุกห้องเรียน</option>
          <option v-for="c in classroomOptions" :key="c" :value="c">{{ c }}</option>
        </select>
        <input v-model="filterDate" type="date" class="filter-input" />
        <button v-if="search || filterType || filterClassroom || filterDate" type="button" class="btn btn-clear" @click="clearFilters">ล้างตัวกรอง</button>
      </div>

      <!-- Table -->
      <AdminDataTable title="รายการบันทึกพฤติกรรม" :columns="cols" :rows="filteredRows">
        <template #cell-type="{ value }">
          <span class="type-badge" :class="value === 'ดี' ? 'type--good' : 'type--bad'">
            {{ value === 'ดี' ? '⭐ ดี' : '⚠ โทษ' }}
          </span>
        </template>
        <template #cell-points="{ value }">
          <span class="points-val" :class="(value as number) >= 0 ? 'points--pos' : 'points--neg'">
            {{ (value as number) > 0 ? '+' : '' }}{{ value }}
          </span>
        </template>
        <template #rowActions="{ row }">
          <div class="action-btns">
            <button type="button" class="btn btn-sm btn-edit" @click="openEdit(row as BehaviorRow)">แก้ไข</button>
            <button type="button" class="btn btn-sm btn-danger" @click="openDelete(row as BehaviorRow)">ลบ</button>
          </div>
        </template>
      </AdminDataTable>

      <!-- Add / Edit Modal -->
      <AdminAppModal
        v-model="showModal"
        :title="isEditing ? 'แก้ไขบันทึกพฤติกรรม' : 'บันทึกพฤติกรรม'"
        size="md"
        confirm-label="บันทึก"
        @confirm="saveRow"
      >
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">รหัสนักเรียน <span class="req">*</span></label>
            <input
              v-model="form.studentId"
              class="form-input"
              list="student-list"
              placeholder="รหัสนักเรียน"
              autocomplete="off"
              @change="fillStudent"
            />
            <datalist id="student-list">
              <option v-for="s in studentRows" :key="s.id" :value="s.id">{{ s.name }}</option>
            </datalist>
            <span v-if="formErrors.studentId" class="field-error">{{ formErrors.studentId }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">ชื่อนักเรียน</label>
            <input v-model="form.studentName" class="form-input" placeholder="ชื่อ-นามสกุล" readonly />
          </div>
          <div class="form-group">
            <label class="form-label">ห้องเรียน</label>
            <input v-model="form.classroom" class="form-input" placeholder="เช่น ม.1/1" />
          </div>
          <div class="form-group">
            <label class="form-label">ประเภท</label>
            <select v-model="form.type" class="form-input" @change="form.category = ''">
              <option value="ดี">บันทึกดี</option>
              <option value="ไม่ดี">บันทึกโทษ</option>
            </select>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">หมวดหมู่</label>
            <select v-model="form.category" class="form-input">
              <option value="">— เลือกหมวดหมู่ —</option>
              <option v-for="c in (form.type === 'ดี' ? goodCategories : badCategories)" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">รายละเอียด <span class="req">*</span></label>
            <textarea v-model="form.description" class="form-input form-textarea" placeholder="บรรยายพฤติกรรมโดยละเอียด..." />
            <span v-if="formErrors.description" class="field-error">{{ formErrors.description }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">คะแนน</label>
            <input v-model.number="form.points" type="number" class="form-input" :placeholder="form.type === 'ดี' ? 'เช่น 5' : 'เช่น -3'" />
            <span class="field-hint">{{ form.type === 'ดี' ? 'ใส่ค่าบวก' : 'ใส่ค่าลบ' }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">วันที่ <span class="req">*</span></label>
            <input v-model="form.date" type="date" class="form-input" />
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">ผู้บันทึก</label>
            <input v-model="form.recordedBy" class="form-input" placeholder="ชื่อครูผู้บันทึก" />
          </div>
        </div>
      </AdminAppModal>

      <!-- Delete Confirm -->
      <AdminAppConfirmModal
        v-model="showConfirm"
        title="ยืนยันการลบ?"
        :description="`ต้องการลบบันทึกพฤติกรรมของ '${deleteTarget?.studentName}' ใช่หรือไม่?`"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBehaviorData, type BehaviorRow, GOOD_CATEGORIES, BAD_CATEGORIES } from '~/composables/useBehaviorData'
import { useStudentsData } from '~/composables/useStudentsData'

definePageMeta({ layout: 'admin' })
const { loading } = usePageLoad()
const { rows } = useBehaviorData()
const { rows: studentRows } = useStudentsData()

const goodCategories = GOOD_CATEGORIES
const badCategories = BAD_CATEGORIES

const cols = [
  { key: 'date', label: 'วันที่' },
  { key: 'studentId', label: 'รหัส' },
  { key: 'studentName', label: 'ชื่อนักเรียน' },
  { key: 'classroom', label: 'ห้อง' },
  { key: 'type', label: 'ประเภท' },
  { key: 'category', label: 'หมวดหมู่' },
  { key: 'points', label: 'คะแนน' },
  { key: 'recordedBy', label: 'ผู้บันทึก' },
]

const classroomOptions = computed(() => [...new Set(rows.value.map(r => r.classroom))].sort())

const search = ref('')
const filterType = ref('')
const filterClassroom = ref('')
const filterDate = ref('')

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter(r => {
    if (q && !r.studentName.toLowerCase().includes(q) && !r.studentId.includes(q)) return false
    if (filterType.value && r.type !== filterType.value) return false
    if (filterClassroom.value && r.classroom !== filterClassroom.value) return false
    if (filterDate.value && r.date !== filterDate.value) return false
    return true
  })
})

const goodCount = computed(() => filteredRows.value.filter(r => r.type === 'ดี').length)
const badCount = computed(() => filteredRows.value.filter(r => r.type === 'ไม่ดี').length)
const totalPoints = computed(() => filteredRows.value.reduce((sum, r) => sum + r.points, 0))

function clearFilters() {
  search.value = ''
  filterType.value = ''
  filterClassroom.value = ''
  filterDate.value = ''
}

// ── Add / Edit ──
const showModal = ref(false)
const isEditing = ref(false)
let editTarget: BehaviorRow | null = null

const emptyForm = (): BehaviorRow => ({
  id: 0, studentId: '', studentName: '', classroom: '',
  type: 'ดี', category: '', description: '', points: 5,
  date: new Date().toISOString().slice(0, 10), recordedBy: '',
})
const form = ref<BehaviorRow>(emptyForm())
const formErrors = ref({ studentId: '', description: '' })

function fillStudent() {
  const found = studentRows.value.find(s => s.id === form.value.studentId)
  if (found) {
    form.value.studentName = found.name
    form.value.classroom = found.class
  }
}

function validate() {
  formErrors.value = { studentId: '', description: '' }
  if (!form.value.studentId.trim()) formErrors.value.studentId = 'กรุณาระบุรหัสนักเรียน'
  if (!form.value.description.trim()) formErrors.value.description = 'กรุณาระบุรายละเอียด'
  return !formErrors.value.studentId && !formErrors.value.description
}

function openAdd() {
  isEditing.value = false
  editTarget = null
  form.value = emptyForm()
  formErrors.value = { studentId: '', description: '' }
  showModal.value = true
}

function openEdit(row: BehaviorRow) {
  isEditing.value = true
  editTarget = row
  form.value = { ...row }
  formErrors.value = { studentId: '', description: '' }
  showModal.value = true
}

function saveRow() {
  if (!validate()) return
  if (isEditing.value && editTarget) {
    const idx = rows.value.indexOf(editTarget)
    if (idx !== -1) rows.value[idx] = { ...form.value }
  } else {
    rows.value.unshift({ ...form.value, id: Date.now() })
  }
  showModal.value = false
}

// ── Delete ──
const showConfirm = ref(false)
const deleteTarget = ref<BehaviorRow | null>(null)

function openDelete(row: BehaviorRow) {
  deleteTarget.value = row
  showConfirm.value = true
}

function confirmDelete() {
  if (deleteTarget.value) rows.value = rows.value.filter(r => r !== deleteTarget.value)
  showConfirm.value = false
  deleteTarget.value = null
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 22px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.85rem; }

.summary-strip { display: flex; gap: 12px; flex-wrap: wrap; }
.summary-item { background: #fff; border: 1px solid #e8eaed; border-radius: 12px; padding: 12px 20px; display: flex; flex-direction: column; gap: 2px; min-width: 110px; }
.summary-item--good { border-color: #bbf7d0; background: #f0fdf4; }
.summary-item--bad { border-color: #fecaca; background: #fef2f2; }
.summary-item--points { border-color: #bfdbfe; background: #eff6ff; }
.s-value { font-size: 1.5rem; font-weight: 700; color: #111827; line-height: 1.1; }
.s-label { font-size: 0.78rem; color: #6b7280; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-wrap { position: relative; flex: 1; min-width: 200px; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.search-input { width: 100%; padding: 8px 12px 8px 32px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; box-sizing: border-box; background: #fff; }
.search-input:focus { border-color: #6366f1; }
.filter-select, .filter-input { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; background: #fff; cursor: pointer; }

.action-btns { display: flex; gap: 6px; justify-content: flex-end; }
.btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #111827; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-primary:hover { background: #1f2937; }
.btn-sm { padding: 5px 10px; font-size: 0.78rem; }
.btn-edit { border-color: #e5e7eb; background: #f9fafb; color: #374151; }
.btn-edit:hover { background: #f3f4f6; }
.btn-danger { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
.btn-danger:hover { background: #fee2e2; }
.btn-clear { border: 1px solid #e5e7eb; background: #fff; color: #6b7280; font-size: 0.8rem; padding: 7px 12px; border-radius: 8px; font-family: inherit; cursor: pointer; }
.btn-clear:hover { background: #f9fafb; }

.type-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; }
.type--good { background: #d1fae5; color: #065f46; }
.type--bad { background: #fee2e2; color: #991b1b; }
.points-val { font-weight: 700; font-variant-numeric: tabular-nums; font-size: 0.9rem; }
.points--pos { color: #15803d; }
.points--neg { color: #b91c1c; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group--full { grid-column: 1 / -1; }
.form-label { font-size: 0.85rem; font-weight: 500; color: #374151; }
.req { color: #ef4444; }
.form-input { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; background: #fff; }
.form-input:focus { border-color: #6366f1; }
.form-textarea { min-height: 80px; resize: vertical; }
.field-error { font-size: 0.75rem; color: #ef4444; }
.field-hint { font-size: 0.72rem; color: #9ca3af; }
</style>
