<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="6" :cols="5" />
    <template v-else>
      <div class="page-header">
        <div>
          <h2 class="page-title">ห้องเรียน</h2>
          <p class="page-desc">จัดการข้อมูลห้องเรียนทั้งหมดในโรงเรียน</p>
          <p v-if="errorMessage" class="inline-error">{{ errorMessage }}</p>
          <p v-if="pageLoading" class="inline-loading">กำลังโหลดข้อมูลห้องเรียน...</p>
        </div>
        <button type="button" class="btn btn-primary" @click="openAdd">+ เพิ่มห้องเรียน</button>
      </div>

      <div class="filter-bar">
        <select v-model="filterClassroomId" class="filter-select">
          <option value="">ทุกห้องเรียน</option>
          <option v-for="r in rows" :key="r.id" :value="r.id">{{ r.name }}</option>
        </select>
        <select v-model="filterGrade" class="filter-select">
          <option value="">ทุกระดับชั้น</option>
          <option v-for="g in gradeOptions" :key="g" :value="g">{{ g }}</option>
        </select>
        <button v-if="filterClassroomId || filterGrade" type="button" class="btn btn-clear" @click="clearFilters">
          ล้างตัวกรอง
        </button>
      </div>

      <AdminDataTable title="รายการห้องเรียน" :columns="cols" :rows="filteredRows">
        <template #rowActions="{ row }">
          <div class="action-btns">
            <button type="button" class="btn btn-sm btn-detail" @click="openDetail(row as unknown as ClassroomRow)">รายละเอียด</button>
            <button type="button" class="btn btn-sm btn-edit" @click="openEdit(row as unknown as ClassroomRow)">แก้ไข</button>
            <button type="button" class="btn btn-sm btn-delete" @click="openDelete(row as unknown as ClassroomRow)">ลบ</button>
          </div>
        </template>
      </AdminDataTable>

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
            <label class="form-label">ระดับชั้น</label>
            <select v-model="form.grade" class="form-input">
              <option value="">— ไม่ระบุ —</option>
              <option v-for="g in gradeOptions" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">ห้องที่ใช้เรียน</label>
            <input v-model="form.room" class="form-input" placeholder="เช่น อาคาร 1 ห้อง 101" />
            <span class="field-hint">หากยังไม่มีข้อมูลตั้งค่า สามารถพิมพ์ห้องที่ใช้เรียนได้ทันที</span>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">ครูประจำชั้น</label>
            <select v-model="form.advisorTeacherId" class="form-input">
              <option value="">-- เลือกครูประจำชั้น --</option>
              <option v-for="t in teacherOptions" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
        </div>
      </AdminAppModal>

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
import { computed, ref, watch } from 'vue'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const { profile } = useAdminAuth()

type ClassroomApiItem = {
  id: string
  school_id: string
  name: string
  grade_level: string | null
  room_no: string | null
  advisor_teacher_id: string | null
}

type ClassroomListResponse = {
  data: ClassroomApiItem[]
}

type ClassroomSingleResponse = {
  data: ClassroomApiItem
}

type ClassroomRow = {
  id: string
  name: string
  grade: string
  room: string
  advisorTeacherId: string
  advisorTeacherName: string
}

type TeacherApiItem = {
  id: string
  first_name: string | null
  last_name: string | null
  is_active: boolean
}

type TeacherListResponse = {
  data: TeacherApiItem[]
}

type TeacherOption = {
  id: string
  name: string
}

const rows = ref<ClassroomRow[]>([])
const teacherOptions = ref<TeacherOption[]>([])
const pageLoading = ref(false)
const errorMessage = ref('')

const cols = [
  { key: 'name', label: 'ชื่อห้องเรียน' },
  { key: 'grade', label: 'ระดับชั้น' },
  { key: 'room', label: 'ห้องที่ใช้เรียน' },
  { key: 'advisorTeacherName', label: 'ครูประจำชั้น' },
]

const gradeOptions = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6']

const filterClassroomId = ref('')
const filterGrade = ref('')

const filteredRows = computed(() =>
  rows.value.filter((r) => {
    const matchClassroom = !filterClassroomId.value || r.id === filterClassroomId.value
    const matchGrade = !filterGrade.value || r.grade === filterGrade.value
    return matchClassroom && matchGrade
  }),
)

function clearFilters() {
  filterClassroomId.value = ''
  filterGrade.value = ''
}

function authHeaders() {
  return { Authorization: `Bearer ${authToken.value}` }
}

function mapClassroom(item: ClassroomApiItem): ClassroomRow {
  const foundTeacher = teacherOptions.value.find(t => t.id === (item.advisor_teacher_id || ''))
  return {
    id: String(item.id || ''),
    name: String(item.name || ''),
    grade: String(item.grade_level || ''),
    room: String(item.room_no || ''),
    advisorTeacherId: String(item.advisor_teacher_id || ''),
    advisorTeacherName: foundTeacher?.name || '',
  }
}

function mapTeacherName(item: TeacherApiItem) {
  const first = String(item.first_name || '').trim()
  const last = String(item.last_name || '').trim()
  const fullName = `${first} ${last}`.trim()
  return fullName || String(item.id || '')
}

function syncAdvisorDisplayNames() {
  rows.value = rows.value.map((row) => {
    const foundTeacher = teacherOptions.value.find(t => t.id === row.advisorTeacherId)
    return {
      ...row,
      advisorTeacherName: foundTeacher?.name || row.advisorTeacherName,
    }
  })
}

async function loadTeachers() {
  if (!import.meta.client || !authToken.value) return

  try {
    const res = await $fetch<TeacherListResponse>(`${config.public.apiBase}/back-office/teachers?only_active=true`, {
      headers: authHeaders(),
    })
    const list = Array.isArray(res.data) ? res.data : []
    teacherOptions.value = list.map(item => ({ id: item.id, name: mapTeacherName(item) }))
  }
  catch {
    try {
      const res = await $fetch<TeacherListResponse>(`${config.public.apiBase}/teachers?only_active=true`, {
        headers: authHeaders(),
      })
      const list = Array.isArray(res.data) ? res.data : []
      teacherOptions.value = list.map(item => ({ id: item.id, name: mapTeacherName(item) }))
    }
    catch {
      teacherOptions.value = []
    }
  }

  syncAdvisorDisplayNames()
}

async function loadClassrooms() {
  if (!import.meta.client || !authToken.value) return

  const schoolId = profile.value.schoolId
  if (!schoolId) {
    errorMessage.value = 'ไม่พบ school_id ใน session'
    rows.value = []
    return
  }

  pageLoading.value = true
  errorMessage.value = ''

  try {
    const res = await $fetch<ClassroomListResponse>(`${config.public.apiBase}/back-office/classrooms?school_id=${schoolId}`, {
      headers: authHeaders(),
    })
    const list = Array.isArray(res.data) ? res.data : []
    rows.value = list.map(mapClassroom)
  }
  catch {
    try {
      const res = await $fetch<ClassroomListResponse>(`${config.public.apiBase}/classrooms?school_id=${schoolId}`, {
        headers: authHeaders(),
      })
      const list = Array.isArray(res.data) ? res.data : []
      rows.value = list.map(mapClassroom)
    }
    catch {
      errorMessage.value = 'ไม่สามารถโหลดข้อมูลห้องเรียนได้'
      rows.value = []
    }
  }
  finally {
    pageLoading.value = false
  }
}

watch(() => profile.value.schoolId, () => {
  loadTeachers()
  loadClassrooms()
}, { immediate: true })

const showModal = ref(false)
const isEditing = ref(false)
const showConfirm = ref(false)

let editTarget: ClassroomRow | null = null
let deleteTarget = ref<ClassroomRow | null>(null)

const emptyForm = (): ClassroomRow => ({
  id: '',
  name: '',
  grade: '',
  room: '',
  advisorTeacherId: '',
  advisorTeacherName: '',
})

const form = ref<ClassroomRow>(emptyForm())
const formErrors = ref({ name: '' })

function validate() {
  formErrors.value = { name: '' }
  if (!form.value.name.trim()) formErrors.value.name = 'กรุณาระบุชื่อห้อง'
  return !formErrors.value.name
}

function openAdd() {
  isEditing.value = false
  editTarget = null
  form.value = emptyForm()
  formErrors.value = { name: '' }
  showModal.value = true
}

function openEdit(row: ClassroomRow) {
  isEditing.value = true
  editTarget = row
  form.value = { ...row }
  formErrors.value = { name: '' }
  showModal.value = true
}

async function saveRow() {
  if (!validate() || !authToken.value) return

  const schoolId = profile.value.schoolId
  if (!schoolId) {
    errorMessage.value = 'ไม่พบ school_id ใน session'
    return
  }

  const payload = {
    school_id: schoolId,
    name: form.value.name.trim(),
    grade_level: form.value.grade.trim() || null,
    room_no: form.value.room.trim() || null,
    advisor_teacher_id: form.value.advisorTeacherId.trim() || null,
  }

  try {
    if (isEditing.value && editTarget) {
      await $fetch<ClassroomSingleResponse>(`${config.public.apiBase}/back-office/classrooms/${editTarget.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: payload,
      })
    }
    else {
      await $fetch<ClassroomSingleResponse>(`${config.public.apiBase}/back-office/classrooms`, {
        method: 'POST',
        headers: authHeaders(),
        body: payload,
      })
    }
  }
  catch {
    try {
      if (isEditing.value && editTarget) {
        await $fetch<ClassroomSingleResponse>(`${config.public.apiBase}/classrooms/${editTarget.id}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: payload,
        })
      }
      else {
        await $fetch<ClassroomSingleResponse>(`${config.public.apiBase}/classrooms`, {
          method: 'POST',
          headers: authHeaders(),
          body: payload,
        })
      }
    }
    catch {
      errorMessage.value = 'บันทึกข้อมูลห้องเรียนไม่สำเร็จ'
      return
    }
  }

  showModal.value = false
  await loadClassrooms()
}

function openDetail(row: ClassroomRow) {
  navigateTo(`/admin/classrooms/${encodeURIComponent(row.id)}`)
}

function openDelete(row: ClassroomRow) {
  deleteTarget.value = row
  showConfirm.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value || !authToken.value) {
    showConfirm.value = false
    return
  }

  try {
    await $fetch(`${config.public.apiBase}/back-office/classrooms/${deleteTarget.value.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  }
  catch {
    try {
      await $fetch(`${config.public.apiBase}/classrooms/${deleteTarget.value.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
    }
    catch {
      errorMessage.value = 'ลบข้อมูลห้องเรียนไม่สำเร็จ'
      showConfirm.value = false
      return
    }
  }

  deleteTarget.value = null
  showConfirm.value = false
  await loadClassrooms()
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

.inline-loading {
  margin-top: 6px;
  color: #1d4ed8;
  font-size: 0.82rem;
}

.inline-error {
  margin-top: 6px;
  color: #dc2626;
  font-size: 0.82rem;
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
  flex-wrap: nowrap;
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
  border-color: #e5e7eb;
  background: #fff;
  color: #374151;
}

.btn-detail:hover {
  background: #f9fafb;
}

.btn-edit {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}

.btn-edit:hover {
  background: #dbeafe;
}

.btn-delete {
  border-color: #fecaca;
  background: #fff5f5;
  color: #dc2626;
}

.btn-delete:hover {
  background: #fee2e2;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group--full {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.82rem;
  font-weight: 500;
  color: #374151;
}

.req {
  color: #ef4444;
}

.form-input {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.875rem;
  font-family: inherit;
  background: #fff;
  color: #111827;
  outline: none;
  transition: border-color 0.12s;
  width: 100%;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #6366f1;
}

.field-error {
  font-size: 0.75rem;
  color: #ef4444;
}

.field-hint {
  font-size: 0.75rem;
  color: #6b7280;
}

@media (max-width: 760px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
