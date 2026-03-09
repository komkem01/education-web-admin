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
        <template #cell-date="{ value }">
          {{ formatDateTH(value as string) }}
        </template>
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
            <button type="button" class="btn btn-sm btn-delete" @click="openDelete(row as BehaviorRow)">ลบ</button>
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
            <select v-model="form.studentId" class="form-input" @change="fillStudent">
              <option value="">-- เลือกนักเรียน --</option>
              <option v-for="s in studentRows" :key="s.id" :value="s.code">{{ s.code }} - {{ s.name }}</option>
            </select>
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
            <input v-model="form.recordedBy" class="form-input" placeholder="ชื่อครูผู้บันทึก" readonly />
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

type BaseResponse<T> = { data: T }
type BehaviorType = 'ดี' | 'ไม่ดี'

type BehaviorRow = {
  id: string
  studentUUID: string
  studentId: string
  studentName: string
  classroom: string
  type: BehaviorType
  category: string
  description: string
  points: number
  date: string
  recordedBy: string
}

type StudentApiItem = {
  id: string
  student_code: string | null
  first_name: string | null
  last_name: string | null
  current_classroom_id: string | null
}

type ClassroomApiItem = {
  id: string
  name: string
}

type BehaviorApiItem = {
  id: string
  school_id: string
  student_id: string
  recorded_by_member_id: string
  behavior_type: 'good' | 'bad'
  category: string | null
  description: string | null
  points: number
  recorded_on: string
  is_active: boolean
}

type StudentOption = {
  id: string
  code: string
  name: string
  classroom: string
}

const GOOD_CATEGORIES = ['ช่วยเหลือผู้อื่น', 'มีจิตอาสา', 'เรียนดีเด่น', 'กีฬาเด่น', 'รักษาความสะอาด', 'ประพฤติดีเด่น']
const BAD_CATEGORIES = ['ทะเลาะวิวาท', 'แต่งกายผิดระเบียบ', 'หนีเรียน', 'ใช้โทรศัพท์ในห้องเรียน', 'ทำลายทรัพย์สิน', 'มาสาย']

definePageMeta({ layout: 'admin' })
const { loading } = usePageLoad()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const { profile } = useAdminAuth()
const rows = ref<BehaviorRow[]>([])
const studentRows = ref<StudentOption[]>([])
const studentsByID = ref<Record<string, StudentOption>>({})

const goodCategories = GOOD_CATEGORIES
const badCategories = BAD_CATEGORIES

const recorderDisplayName = computed(() => {
  const first = (profile.value.firstName || '').trim()
  const last = (profile.value.lastName || '').trim()
  const fullName = `${first} ${last}`.trim()
  if (fullName) return fullName
  if (profile.value.email) return profile.value.email
  if (profile.value.memberCode) return profile.value.memberCode
  if (profile.value.memberId) return profile.value.memberId.slice(0, 8)
  return 'ผู้ใช้งานระบบ'
})

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

function behaviorTypeLabel(type: BehaviorApiItem['behavior_type']): BehaviorType {
  return type === 'bad' ? 'ไม่ดี' : 'ดี'
}

function behaviorTypeApi(type: BehaviorType): BehaviorApiItem['behavior_type'] {
  return type === 'ไม่ดี' ? 'bad' : 'good'
}

function resolveRecorderName(memberID: string) {
  if (profile.value.memberId && memberID === profile.value.memberId) {
    return recorderDisplayName.value
  }
  return memberID.slice(0, 8)
}

function formatDateTH(value: string) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function mapBehaviorRow(item: BehaviorApiItem): BehaviorRow {
  const student = studentsByID.value[item.student_id]
  return {
    id: item.id,
    studentUUID: item.student_id,
    studentId: student?.code || item.student_id.slice(0, 8),
    studentName: student?.name || 'ไม่พบข้อมูลนักเรียน',
    classroom: student?.classroom || '-',
    type: behaviorTypeLabel(item.behavior_type),
    category: (item.category || '').trim(),
    description: (item.description || '').trim(),
    points: item.points,
    date: item.recorded_on,
    recordedBy: resolveRecorderName(item.recorded_by_member_id),
  }
}

async function loadStudentsAndClassrooms() {
  if (!authToken.value || !profile.value.schoolId) return

  const [studentsRes, classroomsRes] = await Promise.all([
    apiFetch<BaseResponse<StudentApiItem[]>>('/students?only_active=true', { headers: authHeaders() }),
    apiFetch<BaseResponse<ClassroomApiItem[]>>(`/classrooms?school_id=${profile.value.schoolId}`, { headers: authHeaders() }),
  ])

  const classroomMap: Record<string, string> = {}
  for (const c of (Array.isArray(classroomsRes.data) ? classroomsRes.data : [])) {
    classroomMap[c.id] = c.name
  }

  const students = (Array.isArray(studentsRes.data) ? studentsRes.data : []).map((s) => {
    const first = (s.first_name || '').trim()
    const last = (s.last_name || '').trim()
    const fullName = `${first} ${last}`.trim() || 'ไม่ระบุชื่อ'
    const code = (s.student_code || '').trim() || s.id.slice(0, 8)
    const classroom = s.current_classroom_id ? (classroomMap[s.current_classroom_id] || '-') : '-'
    return { id: s.id, code, name: fullName, classroom }
  })

  studentRows.value = students
  studentsByID.value = Object.fromEntries(students.map(s => [s.id, s]))
}

async function loadRows() {
  if (!authToken.value || !profile.value.schoolId) return
  const res = await apiFetch<BaseResponse<BehaviorApiItem[]>>(`/student-behaviors?school_id=${profile.value.schoolId}&only_active=true`, { headers: authHeaders() })
  rows.value = (Array.isArray(res.data) ? res.data : []).map(mapBehaviorRow)
}

if (import.meta.client) {
  ;(async () => {
    try {
      await loadStudentsAndClassrooms()
      await loadRows()
    }
    catch {
      rows.value = []
      studentRows.value = []
      studentsByID.value = {}
    }
  })()
}

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
    if (q && !r.studentName.toLowerCase().includes(q) && !r.studentId.toLowerCase().includes(q)) return false
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

const showModal = ref(false)
const isEditing = ref(false)
let editTarget: BehaviorRow | null = null

const emptyForm = (): BehaviorRow => ({
  id: '', studentUUID: '', studentId: '', studentName: '', classroom: '',
  type: 'ดี', category: '', description: '', points: 5,
  date: new Date().toISOString().slice(0, 10), recordedBy: recorderDisplayName.value,
})
const form = ref<BehaviorRow>(emptyForm())
const formErrors = ref({ studentId: '', description: '' })

function fillStudent() {
  const found = studentRows.value.find(s => s.code === form.value.studentId.trim())
  if (found) {
    form.value.studentUUID = found.id
    form.value.studentName = found.name
    form.value.classroom = found.classroom
  }
  else {
    form.value.studentUUID = ''
  }
}

function validate() {
  formErrors.value = { studentId: '', description: '' }
  if (!form.value.studentId.trim() || !form.value.studentUUID) formErrors.value.studentId = 'กรุณาระบุรหัสนักเรียนให้ถูกต้อง'
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

async function saveRow() {
  if (!validate()) return
  if (!authToken.value || !profile.value.schoolId || !profile.value.memberId) {
    formErrors.value.studentId = 'ไม่พบข้อมูลผู้ใช้สำหรับบันทึก'
    return
  }

  const payload = {
    school_id: profile.value.schoolId,
    student_id: form.value.studentUUID,
    recorded_by_member_id: profile.value.memberId,
    behavior_type: behaviorTypeApi(form.value.type),
    category: form.value.category.trim() || null,
    description: form.value.description.trim(),
    points: Number.isFinite(form.value.points) ? form.value.points : 0,
    recorded_on: form.value.date,
    is_active: true,
  }

  try {
    if (isEditing.value && editTarget) {
      const res = await apiFetch<BaseResponse<BehaviorApiItem>>(`/student-behaviors/${editTarget.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: payload,
      })
      const idx = rows.value.findIndex(item => item.id === editTarget!.id)
      if (idx !== -1) rows.value[idx] = mapBehaviorRow(res.data)
    }
    else {
      const res = await apiFetch<BaseResponse<BehaviorApiItem>>('/student-behaviors', {
        method: 'POST',
        headers: authHeaders(),
        body: payload,
      })
      rows.value.unshift(mapBehaviorRow(res.data))
    }
    showModal.value = false
  }
  catch {
    formErrors.value.description = formErrors.value.description || 'บันทึกข้อมูลไม่สำเร็จ'
  }
}

const showConfirm = ref(false)
const deleteTarget = ref<BehaviorRow | null>(null)

function openDelete(row: BehaviorRow) {
  deleteTarget.value = row
  showConfirm.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value || !authToken.value) {
    showConfirm.value = false
    return
  }
  try {
    await apiFetch(`/student-behaviors/${deleteTarget.value.id}`, {
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

.action-btns { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: nowrap; }
.btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #111827; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-primary:hover { background: #1f2937; }
.btn-sm { padding: 5px 10px; font-size: 0.78rem; }
.btn-edit { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.btn-edit:hover { background: #dbeafe; }
.btn-danger { border-color: #fecaca; background: #fff5f5; color: #dc2626; }
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
