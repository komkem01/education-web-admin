<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="6" :cols="7" />
    <template v-else>
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">ผลการเรียน</h2>
          <p class="page-desc">บันทึกและตรวจสอบคะแนน-เกรดนักเรียนรายวิชา</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="search-wrap">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="#9ca3af" stroke-width="1.4" />
            <path d="M10 10l3 3" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round" />
          </svg>
          <input v-model="search" class="search-input" placeholder="ค้นหาชื่อ / รหัสนักเรียน…" autocomplete="off" />
        </div>
        <select v-model="filterClassroom" class="filter-select">
          <option value="">ทุกห้องเรียน</option>
          <option v-for="c in classroomOptions" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="filterCourse" class="filter-select">
          <option value="">ทุกวิชา</option>
          <option v-for="c in courseOptions" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="filterSemester" class="filter-select">
          <option value="">ทุกเทอม</option>
          <option value="1">เทอม 1</option>
          <option value="2">เทอม 2</option>
        </select>
        <button v-if="search || filterClassroom || filterCourse || filterSemester" type="button" class="btn btn-clear" @click="clearFilters">ล้างตัวกรอง</button>
      </div>

      <!-- Summary strip -->
      <div v-if="filteredRows.length" class="summary-strip">
        <div class="summary-item">
          <span class="s-value">{{ filteredRows.length }}</span>
          <span class="s-label">ทั้งหมด</span>
        </div>
        <div class="summary-item summary-item--pass">
          <span class="s-value">{{ passCount }}</span>
          <span class="s-label">ผ่าน</span>
        </div>
        <div class="summary-item summary-item--fail">
          <span class="s-value">{{ failCount }}</span>
          <span class="s-label">ไม่ผ่าน</span>
        </div>
        <div class="summary-item summary-item--pending">
          <span class="s-value">{{ pendingCount }}</span>
          <span class="s-label">รอผล</span>
        </div>
        <div class="summary-item">
          <span class="s-value">{{ avgTotal }}</span>
          <span class="s-label">คะแนนเฉลี่ย</span>
        </div>
      </div>

      <!-- Grade Table -->
      <div class="table-card">
        <div class="table-header">
          <span class="table-title">รายการผลการเรียน ({{ filteredRows.length }} รายการ)</span>
          <div class="table-header-right">
            <span v-if="totalPages > 1" class="page-info-inline">หน้า {{ currentPage }}/{{ totalPages }}</span>
            <div class="page-size-wrap">
              <span class="page-size-label">แสดง</span>
              <select v-model="pageSize" class="page-size-sel" @change="currentPage = 1">
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
              <span class="page-size-label">รายการ/หน้า</span>
            </div>
          </div>
        </div>
        <div class="table-scroll">
          <table class="grade-table">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ชื่อนักเรียน</th>
                <th>ห้อง</th>
                <th>วิชา</th>
                <th class="score-col">กลางภาค<br><span class="max-score">/30</span></th>
                <th class="score-col">ปลายภาค<br><span class="max-score">/40</span></th>
                <th class="score-col">กิจกรรม<br><span class="max-score">/20</span></th>
                <th class="score-col">รวม<br><span class="max-score">/100</span></th>
                <th>เกรด</th>
                <th>สถานะ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in pagedRows" :key="row.id" class="grade-row">
                <td class="td-id">{{ row.studentId }}</td>
                <td class="td-name">{{ row.studentName }}</td>
                <td>{{ row.classroom }}</td>
                <td class="td-course">{{ row.courseName }}</td>
                <td class="td-score">{{ row.midScore ?? '—' }}</td>
                <td class="td-score">{{ row.finalScore ?? '—' }}</td>
                <td class="td-score">{{ row.activityScore ?? '—' }}</td>
                <td class="td-score td-total">{{ getTotal(row) ?? '—' }}</td>
                <td><span class="grade-badge" :class="`grade-${getGrade(row)}`">{{ getGrade(row) }}</span></td>
                <td><span class="status-badge" :class="`status-${getStatus(row)}`">{{ getStatus(row) }}</span></td>
                <td class="actions-td">
                  <button type="button" class="act-btn act-btn--edit" @click="openEdit(row)">แก้ไข</button>
                </td>
              </tr>
              <tr v-if="!filteredRows.length">
                <td colspan="11" class="empty-td">ไม่พบข้อมูลที่ตรงเงื่อนไข</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="totalPages > 1" class="pagination">
          <span class="page-info">{{ rangeStart }}–{{ rangeEnd }} จาก {{ filteredRows.length }} รายการ</span>
          <div class="page-btns">
            <button type="button" class="page-btn" :disabled="currentPage === 1" @click="currentPage = 1">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 10.5L5.5 7 9 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 3.5v7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
            <button type="button" class="page-btn" :disabled="currentPage === 1" @click="currentPage--">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 10.5L5 7l3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button v-for="p in pageNumbers" :key="p" type="button" class="page-btn" :class="{ 'page-btn--active': p === currentPage, 'page-btn--dots': p === '\u2026' }" :disabled="p === '\u2026'" @click="typeof p === 'number' && (currentPage = p)">{{ p }}</button>
            <button type="button" class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 10.5L9 7 5.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button type="button" class="page-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 10.5L8.5 7 5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 3.5v7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Edit modal -->
      <AdminAppModal
        v-model="showModal"
        title="แก้ไขคะแนน"
        size="sm"
        confirm-label="บันทึก"
        @confirm="saveScore"
      >
        <div class="score-form">
          <div class="score-student">
            <span class="score-name">{{ editTarget?.studentName }}</span>
            <span class="score-course">{{ editTarget?.courseName }}</span>
          </div>
          <div class="score-fields">
            <div class="form-group">
              <label class="form-label">กลางภาค (เต็ม 30)</label>
              <input v-model.number="scoreForm.midScore" class="form-input" type="number" min="0" max="30" placeholder="0–30" />
            </div>
            <div class="form-group">
              <label class="form-label">ปลายภาค (เต็ม 40)</label>
              <input v-model.number="scoreForm.finalScore" class="form-input" type="number" min="0" max="40" placeholder="0–40" />
            </div>
            <div class="form-group">
              <label class="form-label">กิจกรรม (เต็ม 20)</label>
              <input v-model.number="scoreForm.activityScore" class="form-input" type="number" min="0" max="20" placeholder="0–20" />
            </div>
          </div>
          <div v-if="scoreForm.midScore !== null || scoreForm.finalScore !== null || scoreForm.activityScore !== null" class="score-preview">
            <span>รวม: <strong>{{ (scoreForm.midScore ?? 0) + (scoreForm.finalScore ?? 0) + (scoreForm.activityScore ?? 0) }}</strong> / 100</span>
          </div>
        </div>
      </AdminAppModal>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

definePageMeta({ layout: 'admin' })

type BaseResponse<T> = { data: T }

type StudentApiItem = {
  id: string
  current_classroom_id: string | null
  student_code: string | null
  first_name: string | null
  last_name: string | null
}

type ClassroomApiItem = {
  id: string
  name: string
  grade_level: string | null
  room_no: string | null
}

type SubjectApiItem = {
  id: string
  subject_code: string | null
  name: string
}

type SubjectAssignmentApiItem = {
  id: string
  subject_id: string
  classroom_id: string
  semester_no: number
}

type StudentEnrollmentApiItem = {
  id: string
  subject_assignment_id: string
}

type GradeItemApiItem = {
  id: string
  subject_assignment_id: string
  name: string | null
}

type GradeRecordApiItem = {
  id: string
  enrollment_id: string
  grade_item_id: string
  score: number | null
}

type GradeRow = {
  id: string
  studentUUID: string
  studentId: string
  studentName: string
  classroom: string
  courseCode: string
  courseName: string
  semester: string
  year: string
  subjectAssignmentId: string
  enrollmentId: string
  midItemId: string
  finalItemId: string
  activityItemId: string
  midRecordId: string
  finalRecordId: string
  activityRecordId: string
  midScore: number | null
  finalScore: number | null
  activityScore: number | null
}

const { loading } = usePageLoad()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const { profile } = useAdminAuth()

const rows = ref<GradeRow[]>([])
const pageLoading = ref(false)
const errorMessage = ref('')

function getTotal(r: GradeRow): number | null {
  if (r.midScore === null && r.finalScore === null && r.activityScore === null) return null
  return (r.midScore ?? 0) + (r.finalScore ?? 0) + (r.activityScore ?? 0)
}

function getGrade(r: GradeRow): string {
  const total = getTotal(r)
  if (total === null) return 'รอผล'
  if (total >= 80) return '4'
  if (total >= 75) return '3.5'
  if (total >= 70) return '3'
  if (total >= 65) return '2.5'
  if (total >= 60) return '2'
  if (total >= 55) return '1.5'
  if (total >= 50) return '1'
  return '0'
}

function getStatus(r: GradeRow): 'ผ่าน' | 'ไม่ผ่าน' | 'รอผล' {
  const total = getTotal(r)
  if (total === null) return 'รอผล'
  return total >= 50 ? 'ผ่าน' : 'ไม่ผ่าน'
}

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

function itemCategory(name: string): 'mid' | 'final' | 'activity' | 'other' {
  const key = name.trim().toLowerCase()
  if (!key) return 'other'
  if (key.includes('กลาง') || key.includes('mid')) return 'mid'
  if (key.includes('ปลาย') || key.includes('final')) return 'final'
  if (key.includes('กิจกรรม') || key.includes('activity') || key.includes('เก็บ')) return 'activity'
  return 'other'
}

async function loadRows() {
  if (!import.meta.client || !authToken.value) return

  pageLoading.value = true
  errorMessage.value = ''

  try {
    const schoolID = profile.value.schoolId
    const schoolQuery = schoolID ? `?school_id=${schoolID}` : ''
    const [studentsRes, classroomsRes, subjectsRes, assignmentsRes] = await Promise.all([
      apiFetch<BaseResponse<StudentApiItem[]>>('/students?only_active=true', { headers: authHeaders() }),
      apiFetch<BaseResponse<ClassroomApiItem[]>>(`/classrooms${schoolQuery}`, { headers: authHeaders() }),
      apiFetch<BaseResponse<SubjectApiItem[]>>(`/subjects${schoolQuery}`, { headers: authHeaders() }),
      apiFetch<BaseResponse<SubjectAssignmentApiItem[]>>('/subject-assignments?only_active=true', { headers: authHeaders() }),
    ])

    const students = Array.isArray(studentsRes.data) ? studentsRes.data : []
    const classrooms = Array.isArray(classroomsRes.data) ? classroomsRes.data : []
    const subjects = Array.isArray(subjectsRes.data) ? subjectsRes.data : []
    const assignments = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []

    const classroomNameByID = new Map(classrooms.map(item => [item.id, item.name || `${item.grade_level || ''} ${item.room_no || ''}`.trim() || item.id] as const))
    const subjectByID = new Map(subjects.map(item => [item.id, item] as const))
    const assignmentByID = new Map(assignments.map(item => [item.id, item] as const))

    const rowsByStudent = await Promise.all(students.map(async (student) => {
      const [enrollmentsRes, gradeItemsRes, gradeRecordsRes] = await Promise.all([
        apiFetch<BaseResponse<StudentEnrollmentApiItem[]>>(`/students/${student.id}/enrollments`, { headers: authHeaders() }),
        apiFetch<BaseResponse<GradeItemApiItem[]>>(`/students/${student.id}/grade-items`, { headers: authHeaders() }),
        apiFetch<BaseResponse<GradeRecordApiItem[]>>(`/students/${student.id}/grade-records`, { headers: authHeaders() }),
      ])

      const enrollments = Array.isArray(enrollmentsRes.data) ? enrollmentsRes.data : []
      const gradeItems = Array.isArray(gradeItemsRes.data) ? gradeItemsRes.data : []
      const gradeRecords = Array.isArray(gradeRecordsRes.data) ? gradeRecordsRes.data : []

      const enrollmentByAssignmentID = new Map(enrollments.map(item => [item.subject_assignment_id, item] as const))
      const recordsByItemID = new Map(gradeRecords.map(item => [item.grade_item_id, item] as const))
      const studentName = `${(student.first_name || '').trim()} ${(student.last_name || '').trim()}`.trim() || '-'
      const studentCode = (student.student_code || '').trim() || student.id
      const classroom = (student.current_classroom_id && classroomNameByID.get(student.current_classroom_id)) || '-'

      return enrollments
        .map((enrollment) => {
          const assignment = assignmentByID.get(enrollment.subject_assignment_id)
          if (!assignment) return null

          const subject = subjectByID.get(assignment.subject_id)
          const itemByCategory = new Map<'mid' | 'final' | 'activity', GradeItemApiItem>()
          gradeItems
            .filter(item => item.subject_assignment_id === assignment.id)
            .forEach((item) => {
              const category = itemCategory(item.name || '')
              if (category !== 'other' && !itemByCategory.has(category)) itemByCategory.set(category, item)
            })

          const midItem = itemByCategory.get('mid')
          const finalItem = itemByCategory.get('final')
          const activityItem = itemByCategory.get('activity')
          const midRecord = midItem ? recordsByItemID.get(midItem.id) : undefined
          const finalRecord = finalItem ? recordsByItemID.get(finalItem.id) : undefined
          const activityRecord = activityItem ? recordsByItemID.get(activityItem.id) : undefined

          return {
            id: `${student.id}:${assignment.id}`,
            studentUUID: student.id,
            studentId: studentCode,
            studentName,
            classroom,
            courseCode: (subject?.subject_code || '').trim() || assignment.subject_id,
            courseName: (subject?.name || '-').trim(),
            semester: String(assignment.semester_no || 1),
            year: '-',
            subjectAssignmentId: assignment.id,
            enrollmentId: enrollment.id,
            midItemId: midItem?.id || '',
            finalItemId: finalItem?.id || '',
            activityItemId: activityItem?.id || '',
            midRecordId: midRecord?.id || '',
            finalRecordId: finalRecord?.id || '',
            activityRecordId: activityRecord?.id || '',
            midScore: midRecord?.score ?? null,
            finalScore: finalRecord?.score ?? null,
            activityScore: activityRecord?.score ?? null,
          } as GradeRow
        })
        .filter((item): item is GradeRow => Boolean(item))
    }))

    rows.value = rowsByStudent.flat()
  }
  catch {
    errorMessage.value = 'ไม่สามารถโหลดข้อมูลผลการเรียนได้'
    rows.value = []
  }
  finally {
    pageLoading.value = false
  }
}

if (import.meta.client) {
  loadRows()
}

const classroomOptions = computed(() => [...new Set(rows.value.map(r => r.classroom))].sort())
const courseOptions = computed(() => [...new Set(rows.value.map(r => r.courseName))].sort())

const search = ref('')
const filterClassroom = ref('')
const filterCourse = ref('')
const filterSemester = ref('')

const filteredRows = computed(() => {
  const q = search.value.toLowerCase().trim()
  return rows.value.filter((r) => {
    if (q && !r.studentName.toLowerCase().includes(q) && !r.studentId.toLowerCase().includes(q)) return false
    if (filterClassroom.value && r.classroom !== filterClassroom.value) return false
    if (filterCourse.value && r.courseName !== filterCourse.value) return false
    if (filterSemester.value && r.semester !== filterSemester.value) return false
    return true
  })
})

const passCount = computed(() => filteredRows.value.filter(r => getStatus(r) === 'ผ่าน').length)
const failCount = computed(() => filteredRows.value.filter(r => getStatus(r) === 'ไม่ผ่าน').length)
const pendingCount = computed(() => filteredRows.value.filter(r => getStatus(r) === 'รอผล').length)
const avgTotal = computed(() => {
  const scored = filteredRows.value.filter(r => getTotal(r) !== null)
  if (!scored.length) return '—'
  const sum = scored.reduce((acc, r) => acc + (getTotal(r) ?? 0), 0)
  return (sum / scored.length).toFixed(1)
})

function clearFilters() {
  search.value = ''
  filterClassroom.value = ''
  filterCourse.value = ''
  filterSemester.value = ''
}

const pageSize = ref(10)
const currentPage = ref(1)
watch(() => filteredRows.value, () => { currentPage.value = 1 })
watch(pageSize, () => { currentPage.value = 1 })
const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)))
const rangeStart = computed(() => (filteredRows.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1))
const rangeEnd = computed(() => Math.min(currentPage.value * pageSize.value, filteredRows.value.length))
const pagedRows = computed(() => filteredRows.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))
const pageNumbers = computed<(number | '…')[]>(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = []
  const add = (n: number | '…') => { if (pages[pages.length - 1] !== n) pages.push(n) }
  add(1)
  if (cur > 3) add('…')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) add(i)
  if (cur < total - 2) add('…')
  add(total)
  return pages
})

const showModal = ref(false)
const editTarget = ref<GradeRow | null>(null)
const scoreForm = ref({ midScore: null as number | null, finalScore: null as number | null, activityScore: null as number | null })

function openEdit(row: GradeRow) {
  editTarget.value = row
  scoreForm.value = { midScore: row.midScore, finalScore: row.finalScore, activityScore: row.activityScore }
  showModal.value = true
}

async function ensureGradeItem(studentID: string, assignmentID: string, currentItemID: string, name: string, maxScore: number, weightPercentage: number) {
  if (currentItemID) return currentItemID
  const created = await apiFetch<BaseResponse<GradeItemApiItem>>(`/students/${studentID}/grade-items`, {
    method: 'POST',
    headers: authHeaders(),
    body: {
      subject_assignment_id: assignmentID,
      name,
      max_score: maxScore,
      weight_percentage: weightPercentage,
    },
  })
  return created.data.id
}

async function upsertGradeRecord(studentID: string, enrollmentID: string, itemID: string, recordID: string, score: number | null) {
  const payload = {
    enrollment_id: enrollmentID,
    grade_item_id: itemID,
    score,
    teacher_note: null,
  }
  if (recordID) {
    const updated = await apiFetch<BaseResponse<GradeRecordApiItem>>(`/students/${studentID}/grade-records/${recordID}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: payload,
    })
    return updated.data
  }
  const created = await apiFetch<BaseResponse<GradeRecordApiItem>>(`/students/${studentID}/grade-records`, {
    method: 'POST',
    headers: authHeaders(),
    body: payload,
  })
  return created.data
}

async function saveScore() {
  if (!editTarget.value || !authToken.value) return

  const target = editTarget.value
  if (!target.enrollmentId || !target.subjectAssignmentId) return

  try {
    const midItemID = await ensureGradeItem(target.studentUUID, target.subjectAssignmentId, target.midItemId, 'กลางภาค', 30, 30)
    const finalItemID = await ensureGradeItem(target.studentUUID, target.subjectAssignmentId, target.finalItemId, 'ปลายภาค', 40, 40)
    const activityItemID = await ensureGradeItem(target.studentUUID, target.subjectAssignmentId, target.activityItemId, 'กิจกรรม', 20, 20)

    const [midRecord, finalRecord, activityRecord] = await Promise.all([
      upsertGradeRecord(target.studentUUID, target.enrollmentId, midItemID, target.midRecordId, scoreForm.value.midScore),
      upsertGradeRecord(target.studentUUID, target.enrollmentId, finalItemID, target.finalRecordId, scoreForm.value.finalScore),
      upsertGradeRecord(target.studentUUID, target.enrollmentId, activityItemID, target.activityRecordId, scoreForm.value.activityScore),
    ])

    const idx = rows.value.findIndex(item => item.id === target.id)
    if (idx !== -1) {
      rows.value[idx] = {
        ...rows.value[idx],
        midItemId: midItemID,
        finalItemId: finalItemID,
        activityItemId: activityItemID,
        midRecordId: midRecord.id,
        finalRecordId: finalRecord.id,
        activityRecordId: activityRecord.id,
        midScore: midRecord.score ?? null,
        finalScore: finalRecord.score ?? null,
        activityScore: activityRecord.score ?? null,
      }
    }

    showModal.value = false
  }
  catch {
    errorMessage.value = 'บันทึกคะแนนไม่สำเร็จ'
  }
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.85rem; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-wrap { position: relative; flex: 1; min-width: 200px; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.search-input { width: 100%; padding: 8px 12px 8px 32px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; box-sizing: border-box; transition: border-color 0.15s; background: #fff; }
.search-input:focus { border-color: #6366f1; }
.filter-select { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; background: #fff; cursor: pointer; }
.btn-clear { border: 1px solid #e5e7eb; background: #fff; color: #6b7280; font-size: 0.8rem; padding: 7px 12px; border-radius: 8px; font-family: inherit; cursor: pointer; }
.btn-clear:hover { background: #f9fafb; }

.summary-strip { display: flex; gap: 12px; flex-wrap: wrap; }
.summary-item { background: #fff; border: 1px solid #e8eaed; border-radius: 12px; padding: 12px 20px; display: flex; flex-direction: column; gap: 2px; min-width: 90px; }
.summary-item--pass { border-color: #bbf7d0; background: #f0fdf4; }
.summary-item--fail { border-color: #fecaca; background: #fef2f2; }
.summary-item--pending { border-color: #fde68a; background: #fffbeb; }
.s-value { font-size: 1.4rem; font-weight: 700; color: #111827; line-height: 1.1; }
.s-label { font-size: 0.78rem; color: #6b7280; }

.table-card { background: #fff; border: 1px solid #e8eaed; border-radius: 12px; overflow: hidden; }
.table-header { padding: 14px 20px; border-bottom: 1px solid #f3f4f6; }
.table-title { font-size: 0.9rem; font-weight: 600; color: #111827; }
.table-scroll { overflow-x: auto; }
.grade-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.grade-table th { background: #f9fafb; padding: 10px 14px; text-align: center; font-weight: 600; color: #374151; font-size: 0.78rem; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
.grade-table td { padding: 10px 14px; border-bottom: 1px solid #f3f4f6; color: #374151; }
.grade-row:last-child td { border-bottom: none; }
.td-id { font-size: 0.78rem; color: #9ca3af; white-space: nowrap; }
.td-name { font-weight: 500; white-space: nowrap; }
.td-course { max-width: 160px; }
.td-score { text-align: center; font-variant-numeric: tabular-nums; }
.td-total { font-weight: 600; }
.score-col { min-width: 72px; }
.max-score { font-weight: 400; color: #9ca3af; }
.empty-td { text-align: center; color: #9ca3af; padding: 32px; }

.grade-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; background: #f3f4f6; color: #374151; }
.grade-4, .grade-3\.5, .grade-3 { background: #dcfce7; color: #15803d; }
.grade-2\.5, .grade-2 { background: #dbeafe; color: #1d4ed8; }
.grade-1\.5, .grade-1 { background: #fef9c3; color: #a16207; }
.grade-0 { background: #fee2e2; color: #b91c1c; }
.grade-รอผล { background: #f3f4f6; color: #9ca3af; }

.status-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 0.78rem; font-weight: 500; }
.status-ผ่าน { background: #dcfce7; color: #15803d; }
.status-ไม่ผ่าน { background: #fee2e2; color: #b91c1c; }
.status-รอผล { background: #f3f4f6; color: #9ca3af; }

.actions-td { text-align: right; padding-right: 14px; white-space: nowrap; }
.act-btn { padding: 5px 10px; border-radius: 7px; font-size: 0.78rem; font-weight: 500; border: 1px solid; cursor: pointer; font-family: inherit; transition: background 0.1s; }
.act-btn--edit { border-color: #e5e7eb; background: #f9fafb; color: #374151; }
.act-btn--edit:hover { background: #f3f4f6; }
.table-header { padding: 12px 20px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.table-header-right { display: flex; align-items: center; gap: 12px; }
.page-info-inline { font-size: 0.78rem; color: #9ca3af; white-space: nowrap; }
.page-size-wrap { display: flex; align-items: center; gap: 6px; }
.page-size-label { font-size: 0.78rem; color: #9ca3af; white-space: nowrap; }
.page-size-sel { border: 1px solid #e5e7eb; border-radius: 6px; padding: 3px 6px; font-size: 0.78rem; font-family: inherit; background: #fff; color: #374151; cursor: pointer; outline: none; }
.page-size-sel:focus { border-color: #6366f1; }
.pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-top: 1px solid #e8eaed; gap: 12px; flex-wrap: wrap; }
.page-info { font-size: 0.8rem; color: #9ca3af; white-space: nowrap; }
.page-btns { display: flex; align-items: center; gap: 3px; }
.page-btn { min-width: 30px; height: 30px; padding: 0 6px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; color: #374151; font-size: 0.8rem; font-family: inherit; cursor: pointer; transition: background 0.1s; font-weight: 500; }
.page-btn:hover:not(:disabled):not(.page-btn--dots) { background: #f3f4f6; }
.page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.page-btn--active { background: #111827 !important; border-color: #111827 !important; color: #fff !important; }
.page-btn--dots { border-color: transparent; background: transparent; cursor: default; color: #9ca3af; }

/* Modal */
.score-form { display: flex; flex-direction: column; gap: 14px; }
.score-student { display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; background: #f9fafb; border-radius: 8px; }
.score-name { font-weight: 600; color: #111827; }
.score-course { font-size: 0.82rem; color: #6b7280; }
.score-fields { display: flex; flex-direction: column; gap: 10px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-label { font-size: 0.85rem; font-weight: 500; color: #374151; }
.form-input { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; background: #fff; }
.form-input:focus { border-color: #6366f1; }
.score-preview { text-align: center; font-size: 0.9rem; color: #374151; padding: 8px; background: #f0f4ff; border-radius: 8px; }
</style>
