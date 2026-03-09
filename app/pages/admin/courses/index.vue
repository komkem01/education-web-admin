<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading || pageLoading" :rows="8" :cols="6" />
    <template v-else>
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">รายวิชา</h2>
          <p class="page-desc">จัดการรายวิชาและหลักสูตรทั้งหมดในโรงเรียน</p>
          <p v-if="errorMessage" class="inline-error">{{ errorMessage }}</p>
        </div>
        <button type="button" class="btn btn-primary" @click="openAdd">+ เพิ่มรายวิชา</button>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <select v-model="filterCourseId" class="filter-select">
          <option value="">ทุกรายวิชา</option>
          <option v-for="r in rows" :key="r.id" :value="r.id">{{ r.code }} - {{ r.name }}</option>
        </select>
        <select v-model="filterGroup" class="filter-select">
          <option value="">ทุกกลุ่มสาระ</option>
          <option v-for="g in groupOptions" :key="g.value" :value="g.value">{{ g.label }}</option>
        </select>
        <select v-model="filterLevel" class="filter-select">
          <option value="">ทุกระดับชั้น</option>
          <option v-for="l in levelOptions" :key="l" :value="l">{{ l }}</option>
        </select>
        <select v-model="filterSemester" class="filter-select">
          <option value="">ทุกเทอม</option>
          <option value="1">เทอม 1</option>
          <option value="2">เทอม 2</option>
        </select>
        <button v-if="filterCourseId || filterGroup || filterLevel || filterSemester" type="button" class="btn btn-clear" @click="clearFilters">ล้างตัวกรอง</button>
      </div>

      <!-- Table -->
      <AdminDataTable
        title="รายการวิชา"
        :columns="cols"
        :rows="filteredRows"
      >
        <template #rowActions="{ row }">
          <div class="action-btns">
            <button type="button" class="btn btn-sm btn-edit" @click="openEdit(row as CourseRow)">แก้ไข</button>
            <button type="button" class="btn btn-sm btn-delete" @click="openDelete(row as CourseRow)">ลบ</button>
          </div>
        </template>
      </AdminDataTable>

      <!-- Add / Edit Modal -->
      <AdminAppModal
        v-model="showModal"
        :title="isEditing ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชา'"
        size="lg"
        confirm-label="บันทึก"
        @confirm="saveRow"
      >
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">รหัสวิชา <span class="req">*</span></label>
            <input v-model="form.code" class="form-input" placeholder="เช่น M101" />
            <span v-if="formErrors.code" class="field-error">{{ formErrors.code }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">ชื่อวิชา <span class="req">*</span></label>
            <input v-model="form.name" class="form-input" placeholder="เช่น คณิตศาสตร์พื้นฐาน 1" />
            <span v-if="formErrors.name" class="field-error">{{ formErrors.name }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">กลุ่มสาระ <span class="req">*</span></label>
            <select v-model="form.subjectGroupId" class="form-input">
              <option value="">-- เลือกกลุ่มสาระ --</option>
              <option v-for="g in groupOptions" :key="g.value" :value="g.value">{{ g.label }}</option>
            </select>
            <span v-if="formErrors.subjectGroupId" class="field-error">{{ formErrors.subjectGroupId }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">กลุ่มย่อยสาระ</label>
            <select v-model="form.subjectSubgroupId" class="form-input" :disabled="!form.subjectGroupId">
              <option value="">-- เลือกกลุ่มย่อยสาระ --</option>
              <option v-for="g in subgroupOptions" :key="g.value" :value="g.value">{{ g.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">ระดับชั้น <span class="req">*</span></label>
            <select v-model="form.level" class="form-input">
              <option v-for="l in ['ม.1','ม.2','ม.3','ม.4','ม.5','ม.6']" :key="l" :value="l">{{ l }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">หน่วยกิต</label>
            <input v-model.number="form.credits" class="form-input" type="number" min="0.5" step="0.5" />
          </div>
          <div class="form-group">
            <label class="form-label">ชม./สัปดาห์</label>
            <input v-model.number="form.hoursPerWeek" class="form-input" type="number" min="1" />
          </div>
          <div class="form-group">
            <label class="form-label">เทอม</label>
            <select v-model="form.semester" class="form-input">
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">ปีการศึกษา</label>
            <select v-model="form.yearId" class="form-input">
              <option value="">-- เลือกปีการศึกษา --</option>
              <option v-for="y in academicYearOptions" :key="y.value" :value="y.value">{{ y.label }}</option>
            </select>
            <span v-if="formErrors.yearId" class="field-error">{{ formErrors.yearId }}</span>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">ครูผู้สอน</label>
            <select v-model="form.teacherId" class="form-input">
              <option value="">-- เลือกครูผู้สอน --</option>
              <option v-for="t in teacherOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
            <span v-if="formErrors.teacherId" class="field-error">{{ formErrors.teacherId }}</span>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">ห้องเรียน</label>
            <select v-model="form.classroomId" class="form-input">
              <option value="">-- เลือกห้องเรียน --</option>
              <option v-for="c in classroomOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
            <span v-if="formErrors.classroomId" class="field-error">{{ formErrors.classroomId }}</span>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">คำอธิบายรายวิชา</label>
            <textarea v-model="form.description" class="form-input form-textarea" placeholder="อธิบายเนื้อหาโดยสรุป..." />
          </div>
        </div>
      </AdminAppModal>

      <!-- Delete confirm -->
      <AdminAppConfirmModal
        v-model="showConfirm"
        title="ยืนยันการลบ?"
        :description="`ต้องการลบวิชา '${deleteTarget?.name}' ใช่หรือไม่?`"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

definePageMeta({ layout: 'admin' })

type BaseResponse<T> = { data: T }

type SubjectApiItem = {
  id: string
  school_id: string
  subject_code: string | null
  name: string
  name_en: string | null
  description: string | null
  learning_objectives: string | null
  learning_outcomes: string | null
  assessment_criteria: string | null
  grade_level: string | null
  category: string | null
  subject_group_id: string | null
  subject_subgroup_id: string | null
  credits: number | null
  hours_per_week: number | null
  semester: number | null
  academic_year_id: string | null
  teacher_name: string | null
  type: 'core' | 'elective' | 'activity'
  is_active: boolean
}

type SubjectGroupApiItem = {
  id: string
  code: string
  name: string
}

type SubjectSubgroupApiItem = {
  id: string
  subject_group_id: string
  code: string
  name: string
}

type AcademicYearApiItem = {
  id: string
  year: string
  term: string
  is_current: boolean
  is_active: boolean
  start_date: string
  end_date: string
}

type TeacherApiItem = {
  id: string
  teacher_code: string | null
  first_name: string | null
  last_name: string | null
}

type ClassroomApiItem = {
  id: string
  name: string
  grade_level: string | null
  room_no: string | null
}

type SubjectAssignmentApiItem = {
  id: string
  subject_id: string
  teacher_id: string
  classroom_id: string
  academic_year_id: string
  semester_no: number
  is_active: boolean
}

type CourseRow = {
  id: string
  assignmentId: string
  code: string
  name: string
  subjectGroup: string
  subjectGroupId: string
  subjectSubgroup: string
  subjectSubgroupId: string
  level: string
  credits: number
  hoursPerWeek: number
  semester: string
  yearId: string
  year: string
  teacherId: string
  teacherName: string
  classroomId: string
  classroomName: string
  description: string
}

const { loading } = usePageLoad()
const { profile } = useAdminAuth()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const pageLoading = ref(false)
const errorMessage = ref('')
const rows = ref<CourseRow[]>([])
const academicYearRows = ref<AcademicYearApiItem[]>([])
const teacherRows = ref<TeacherApiItem[]>([])
const classroomRows = ref<ClassroomApiItem[]>([])
const subjectGroupRows = ref<SubjectGroupApiItem[]>([])
const subjectSubgroupRows = ref<SubjectSubgroupApiItem[]>([])

const cols = [
  { key: 'code', label: 'รหัสวิชา' },
  { key: 'name', label: 'ชื่อวิชา' },
  { key: 'subjectGroup', label: 'กลุ่มสาระ' },
  { key: 'subjectSubgroup', label: 'กลุ่มย่อยสาระ' },
  { key: 'level', label: 'ระดับชั้น' },
  { key: 'credits', label: 'หน่วยกิต' },
  { key: 'semester', label: 'เทอม' },
  { key: 'classroomName', label: 'ห้องเรียน' },
  { key: 'teacherName', label: 'ครูผู้สอน' },
]

const groupOptions = computed(() => {
  return subjectGroupRows.value
    .map(item => ({ value: item.id, label: item.name }))
    .sort((a, b) => a.label.localeCompare(b.label, 'th'))
})

const subgroupOptions = computed(() => {
  if (!form.value.subjectGroupId) return []
  return subjectSubgroupRows.value
    .filter(item => item.subject_group_id === form.value.subjectGroupId)
    .map(item => ({ value: item.id, label: item.name }))
    .sort((a, b) => a.label.localeCompare(b.label, 'th'))
})

const levelOptions = computed(() => [...new Set(rows.value.map(r => r.level))].sort())
const academicYearOptions = computed(() =>
  academicYearRows.value.map(item => ({ value: item.id, label: `${item.year} / ${item.term}` })),
)
const classroomOptions = computed(() =>
  classroomRows.value.map(item => ({ value: item.id, label: item.name || `${item.grade_level || ''} ${item.room_no || ''}`.trim() || item.id })),
)
const teacherOptions = computed(() => {
  return teacherRows.value
    .map(item => {
      const label = `${(item.first_name || '').trim()} ${(item.last_name || '').trim()}`.trim() || item.teacher_code || item.id
      return { value: item.id, label }
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'th'))
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

function toNumberOr(defaultValue: number, value: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return defaultValue
  return value
}

function mapRow(
  item: SubjectApiItem,
  academicYearLabelByID: Map<string, string>,
  assignmentByKey: Map<string, SubjectAssignmentApiItem>,
  subjectGroupNameByID: Map<string, string>,
  subjectSubgroupNameByID: Map<string, string>,
  teacherNameByID: Map<string, string>,
  classroomNameByID: Map<string, string>,
): CourseRow {
  const yearID = (item.academic_year_id || '').trim()
  const semesterNo = item.semester || 1
  const assignmentKey = `${item.id}|${yearID}|${semesterNo}`
  const assignment = assignmentByKey.get(assignmentKey)
  const teacherID = assignment?.teacher_id || ''
  const classroomID = assignment?.classroom_id || ''
  const subjectGroupID = (item.subject_group_id || '').trim()
  const subjectSubgroupID = (item.subject_subgroup_id || '').trim()
  return {
    id: item.id,
    assignmentId: assignment?.id || '',
    code: (item.subject_code || '').trim() || item.id,
    name: item.name,
    subjectGroup: subjectGroupID ? (subjectGroupNameByID.get(subjectGroupID) || '-') : ((item.category || '').trim() || '-'),
    subjectGroupId: subjectGroupID,
    subjectSubgroup: subjectSubgroupID ? (subjectSubgroupNameByID.get(subjectSubgroupID) || '-') : '-',
    subjectSubgroupId: subjectSubgroupID,
    level: (item.grade_level || '').trim(),
    credits: toNumberOr(0, item.credits),
    hoursPerWeek: toNumberOr(0, item.hours_per_week),
    semester: String(semesterNo),
    yearId: yearID,
    year: yearID ? (academicYearLabelByID.get(yearID) || '') : '',
    teacherId: teacherID,
    teacherName: teacherID ? (teacherNameByID.get(teacherID) || '-') : ((item.teacher_name || '').trim() || '-'),
    classroomId: classroomID,
    classroomName: classroomID ? (classroomNameByID.get(classroomID) || '-') : '-',
    description: (item.description || '').trim(),
  }
}

async function loadRows() {
  if (!import.meta.client || !authToken.value) return

  pageLoading.value = true
  errorMessage.value = ''

  try {
    const schoolID = profile.value.schoolId
    const query = schoolID ? `?school_id=${schoolID}` : ''

    const [subjectsRes, academicYearsRes, teachersRes, classroomsRes, assignmentsRes, subjectGroupsRes, subjectSubgroupsRes] = await Promise.all([
      apiFetch<BaseResponse<SubjectApiItem[]>>(`/subjects${query}`, { headers: authHeaders() }),
      apiFetch<BaseResponse<AcademicYearApiItem[]>>('/academic-years?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<TeacherApiItem[]>>('/teachers?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<ClassroomApiItem[]>>(`/classrooms${query}`, { headers: authHeaders() }),
      apiFetch<BaseResponse<SubjectAssignmentApiItem[]>>('/subject-assignments?only_active=true', { headers: authHeaders() }),
      apiFetch<BaseResponse<SubjectGroupApiItem[]>>('/subject-groups?only_active=true', { headers: authHeaders() }),
      apiFetch<BaseResponse<SubjectSubgroupApiItem[]>>('/subject-subgroups?only_active=true', { headers: authHeaders() }),
    ])

    academicYearRows.value = Array.isArray(academicYearsRes.data) ? academicYearsRes.data : []
    teacherRows.value = Array.isArray(teachersRes.data) ? teachersRes.data : []
    classroomRows.value = Array.isArray(classroomsRes.data) ? classroomsRes.data : []
    subjectGroupRows.value = Array.isArray(subjectGroupsRes.data) ? subjectGroupsRes.data : []
    subjectSubgroupRows.value = Array.isArray(subjectSubgroupsRes.data) ? subjectSubgroupsRes.data : []

    const assignments = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []
    const assignmentByKey = new Map<string, SubjectAssignmentApiItem>()
    for (const item of assignments) {
      const key = `${item.subject_id}|${item.academic_year_id}|${item.semester_no}`
      if (!assignmentByKey.has(key)) assignmentByKey.set(key, item)
    }

    const academicYearLabelByID = new Map(academicYearRows.value.map(item => [item.id, `${item.year} / ${item.term}`] as const))
    const subjectGroupNameByID = new Map(subjectGroupRows.value.map(item => [item.id, item.name] as const))
    const subjectSubgroupNameByID = new Map(subjectSubgroupRows.value.map(item => [item.id, item.name] as const))
    const teacherNameByID = new Map(teacherRows.value.map(item => {
      const label = `${(item.first_name || '').trim()} ${(item.last_name || '').trim()}`.trim() || item.teacher_code || item.id
      return [item.id, label] as const
    }))
    const classroomNameByID = new Map(classroomRows.value.map(item => [item.id, item.name || `${item.grade_level || ''} ${item.room_no || ''}`.trim() || item.id] as const))

    rows.value = (Array.isArray(subjectsRes.data) ? subjectsRes.data : []).map(item => mapRow(item, academicYearLabelByID, assignmentByKey, subjectGroupNameByID, subjectSubgroupNameByID, teacherNameByID, classroomNameByID))
  }
  catch {
    rows.value = []
    academicYearRows.value = []
    teacherRows.value = []
    classroomRows.value = []
    subjectGroupRows.value = []
    subjectSubgroupRows.value = []
    errorMessage.value = 'ไม่สามารถโหลดข้อมูลรายวิชาได้'
  }
  finally {
    pageLoading.value = false
  }
}

if (import.meta.client) {
  loadRows()
}

// ── Filters ──
const filterCourseId = ref('')
const filterGroup = ref('')
const filterLevel = ref('')
const filterSemester = ref('')

const filteredRows = computed(() => {
  return rows.value.filter(r => {
    if (filterCourseId.value && r.id !== filterCourseId.value) return false
    if (filterGroup.value && r.subjectGroupId !== filterGroup.value) return false
    if (filterLevel.value && r.level !== filterLevel.value) return false
    if (filterSemester.value && r.semester !== filterSemester.value) return false
    return true
  })
})

function clearFilters() {
  filterCourseId.value = ''
  filterGroup.value = ''
  filterLevel.value = ''
  filterSemester.value = ''
}

// ── Add / Edit ──
const showModal = ref(false)
const isEditing = ref(false)
let editTarget: CourseRow | null = null

const emptyForm = (): CourseRow => ({
  id: '', assignmentId: '', code: '', name: '', subjectGroup: '', subjectGroupId: '', subjectSubgroup: '', subjectSubgroupId: '', level: 'ม.1',
  credits: 1.5, hoursPerWeek: 3, semester: '1', yearId: '', year: '',
  teacherId: '', teacherName: '', classroomId: '', classroomName: '', description: '',
})
const form = ref<CourseRow>(emptyForm())
const formErrors = ref({ code: '', name: '', subjectGroupId: '', yearId: '', teacherId: '', classroomId: '' })

function validate() {
  formErrors.value = { code: '', name: '', subjectGroupId: '', yearId: '', teacherId: '', classroomId: '' }
  let ok = true
  if (!form.value.code.trim()) { formErrors.value.code = 'กรุณาระบุรหัสวิชา'; ok = false }
  if (!form.value.name.trim()) { formErrors.value.name = 'กรุณาระบุชื่อวิชา'; ok = false }
  if (!form.value.subjectGroupId) { formErrors.value.subjectGroupId = 'กรุณาเลือกกลุ่มสาระ'; ok = false }
  if (!form.value.yearId) { formErrors.value.yearId = 'กรุณาเลือกปีการศึกษา'; ok = false }
  if (!form.value.teacherId) { formErrors.value.teacherId = 'กรุณาเลือกครูผู้สอน'; ok = false }
  if (!form.value.classroomId) { formErrors.value.classroomId = 'กรุณาเลือกห้องเรียน'; ok = false }
  return ok
}

function openAdd() {
  isEditing.value = false
  editTarget = null
  form.value = emptyForm()
  const currentAcademicYear = academicYearRows.value.find(item => item.is_current)
  if (currentAcademicYear) {
    form.value.yearId = currentAcademicYear.id
  }
  formErrors.value = { code: '', name: '', subjectGroupId: '', yearId: '', teacherId: '', classroomId: '' }
  showModal.value = true
}

function openEdit(row: CourseRow) {
  isEditing.value = true
  editTarget = row
  form.value = { ...row }
  syncFormAcademicYearLabel()
  formErrors.value = { code: '', name: '', subjectGroupId: '', yearId: '', teacherId: '', classroomId: '' }
  showModal.value = true
}

function syncFormAcademicYearLabel() {
  if (!form.value.yearId) {
    form.value.year = ''
    return
  }

  const selected = academicYearRows.value.find(item => item.id === form.value.yearId)
  form.value.year = selected ? `${selected.year} / ${selected.term}` : ''
}

function syncFormTeacherLabel() {
  if (!form.value.teacherId) {
    form.value.teacherName = ''
    return
  }

  const selected = teacherRows.value.find(item => item.id === form.value.teacherId)
  form.value.teacherName = selected
    ? (`${(selected.first_name || '').trim()} ${(selected.last_name || '').trim()}`.trim() || selected.teacher_code || selected.id)
    : ''
}

function syncFormClassroomLabel() {
  if (!form.value.classroomId) {
    form.value.classroomName = ''
    return
  }

  const selected = classroomRows.value.find(item => item.id === form.value.classroomId)
  form.value.classroomName = selected
    ? (selected.name || `${selected.grade_level || ''} ${selected.room_no || ''}`.trim() || selected.id)
    : ''
}

function toNullableNumber(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  return value
}

function toNullableTrimmed(value: string) {
  const trimmed = value.trim()
  return trimmed || null
}

function toNullableSemester(value: string) {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 2) return null
  return parsed
}

async function saveRow() {
  if (!validate() || !authToken.value) return

  const schoolID = profile.value.schoolId
  if (!schoolID) {
    errorMessage.value = 'ไม่พบข้อมูลโรงเรียนของผู้ใช้งาน'
    return
  }

  try {
    const payload = {
      school_id: schoolID,
      subject_code: toNullableTrimmed(form.value.code),
      name: form.value.name.trim(),
      description: toNullableTrimmed(form.value.description),
      grade_level: toNullableTrimmed(form.value.level),
      category: toNullableTrimmed(form.value.subjectGroup),
      subject_group_id: toNullableTrimmed(form.value.subjectGroupId),
      subject_subgroup_id: toNullableTrimmed(form.value.subjectSubgroupId),
      credits: toNullableNumber(form.value.credits),
      hours_per_week: toNullableNumber(form.value.hoursPerWeek),
      semester: toNullableSemester(form.value.semester),
      academic_year_id: toNullableTrimmed(form.value.yearId),
      teacher_name: null,
      type: 'core' as const,
      is_active: true,
    }

    let subjectID = ''

    if (isEditing.value && editTarget) {
      const res = await apiFetch<BaseResponse<SubjectApiItem>>(`/subjects/${editTarget.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: payload,
      })
      subjectID = res.data.id
    }
    else {
      const res = await apiFetch<BaseResponse<SubjectApiItem>>('/subjects', {
        method: 'POST',
        headers: authHeaders(),
        body: payload,
      })
      subjectID = res.data.id
    }

    const assignmentPayload = {
      subject_id: subjectID,
      teacher_id: form.value.teacherId,
      classroom_id: form.value.classroomId,
      academic_year_id: form.value.yearId,
      semester_no: Number.parseInt(form.value.semester, 10) || 1,
      is_active: true,
    }

    const assignmentQuery = `?subject_id=${subjectID}&academic_year_id=${form.value.yearId}&semester_no=${assignmentPayload.semester_no}`
    const assignmentRes = await apiFetch<BaseResponse<SubjectAssignmentApiItem[]>>(`/subject-assignments${assignmentQuery}`, { headers: authHeaders() })
    const assignmentRows = Array.isArray(assignmentRes.data) ? assignmentRes.data : []
    const targetAssignment = assignmentRows.find(item => item.classroom_id === form.value.classroomId)

    if (targetAssignment) {
      await apiFetch(`/subject-assignments/${targetAssignment.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: assignmentPayload,
      })
    }
    else {
      await apiFetch('/subject-assignments', {
        method: 'POST',
        headers: authHeaders(),
        body: assignmentPayload,
      })
    }

    showModal.value = false
    await loadRows()
  }
  catch {
    errorMessage.value = 'บันทึกข้อมูลรายวิชาไม่สำเร็จ'
  }
}

// ── Delete ──
const showConfirm = ref(false)
const deleteTarget = ref<CourseRow | null>(null)

function openDelete(row: CourseRow) {
  deleteTarget.value = row
  showConfirm.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value || !authToken.value) {
    showConfirm.value = false
    return
  }

  try {
    await apiFetch(`/subjects/${deleteTarget.value.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    deleteTarget.value = null
    showConfirm.value = false
    await loadRows()
  }
  catch {
    errorMessage.value = 'ลบข้อมูลรายวิชาไม่สำเร็จ'
    showConfirm.value = false
  }
}

watch(() => form.value.yearId, () => {
  syncFormAcademicYearLabel()
})

watch(() => form.value.subjectGroupId, () => {
  const selectedGroup = subjectGroupRows.value.find(item => item.id === form.value.subjectGroupId)
  form.value.subjectGroup = selectedGroup?.name || ''

  if (!form.value.subjectSubgroupId) return
  const stillValid = subjectSubgroupRows.value.some(item => item.id === form.value.subjectSubgroupId && item.subject_group_id === form.value.subjectGroupId)
  if (!stillValid) {
    form.value.subjectSubgroupId = ''
    form.value.subjectSubgroup = ''
  }
})

watch(() => form.value.subjectSubgroupId, () => {
  const selectedSubgroup = subjectSubgroupRows.value.find(item => item.id === form.value.subjectSubgroupId)
  form.value.subjectSubgroup = selectedSubgroup?.name || ''
})

watch(() => form.value.teacherId, () => {
  syncFormTeacherLabel()
})

watch(() => form.value.classroomId, () => {
  syncFormClassroomLabel()
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 22px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.85rem; }
.inline-error { margin-top: 6px; color: #dc2626; font-size: 0.82rem; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-wrap { position: relative; flex: 1; min-width: 200px; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.search-input { width: 100%; padding: 8px 12px 8px 32px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; box-sizing: border-box; transition: border-color 0.15s; background: #fff; }
.search-input:focus { border-color: #6366f1; }
.filter-select { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; background: #fff; cursor: pointer; }

.action-btns { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: nowrap; }
.btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #111827; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-primary:hover { background: #1f2937; }
.btn-sm { padding: 5px 10px; font-size: 0.8rem; }
.btn-edit { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.btn-edit:hover { background: #dbeafe; }
.btn-danger { border-color: #fecaca; background: #fff5f5; color: #dc2626; }
.btn-danger:hover { background: #fee2e2; }
.btn-clear { border: 1px solid #e5e7eb; background: #fff; color: #6b7280; font-size: 0.8rem; padding: 7px 12px; }
.btn-clear:hover { background: #f9fafb; color: #374151; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group--full { grid-column: 1 / -1; }
.form-label { font-size: 0.85rem; font-weight: 500; color: #374151; }
.req { color: #ef4444; }
.form-input { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; transition: border-color 0.15s; background: #fff; }
.form-input:focus { border-color: #6366f1; }
.form-textarea { min-height: 68px; resize: vertical; }
.field-error { font-size: 0.75rem; color: #ef4444; }
</style>
