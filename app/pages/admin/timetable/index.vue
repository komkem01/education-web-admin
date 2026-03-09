<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading || pageLoading" :rows="9" :cols="6" />
    <template v-else>
      <div class="page-header">
        <div>
          <h2 class="page-title">ตารางสอน</h2>
          <p class="page-desc">จัดการตารางสอนรายห้องเรียน ปีการศึกษา {{ currentYearLabel }} เทอม {{ filterSemester }}</p>
          <p v-if="errorMessage" class="field-error">{{ errorMessage }}</p>
        </div>
        <button type="button" class="btn btn-primary" @click="openAdd()">+ เพิ่มคาบเรียน</button>
      </div>

      <div class="filter-bar">
        <select v-model="filterClassroom" class="filter-select filter-select--wide">
          <option value="">-- เลือกห้องเรียน --</option>
          <option v-for="c in classroomOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
        <select v-model="filterSemester" class="filter-select">
          <option value="1">เทอม 1</option>
          <option value="2">เทอม 2</option>
        </select>
        <select v-model="filterYear" class="filter-select">
          <option value="">-- เลือกปีการศึกษา --</option>
          <option v-for="y in academicYearOptions" :key="y.value" :value="y.value">{{ y.label }}</option>
        </select>
        <span class="slot-count">{{ classroomSlots.length }} คาบ</span>
      </div>

      <div class="timetable-wrap">
        <table class="timetable">
          <thead>
            <tr>
              <th class="th-day-side">วัน</th>
              <template v-for="period in periodOptions" :key="`head-${period.num}`">
                <th v-if="period.num === 5" class="th-lunch-top">พักกลางวัน</th>
                <th class="th-period-top">
                  <div class="th-period-label">คาบ {{ period.num }}</div>
                </th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in DAYS" :key="day" class="td-row">
              <td class="td-day-side">{{ day }}</td>
              <template v-for="period in periodOptions" :key="`${day}-${period.num}`">
                <td v-if="period.num === 5" class="td-lunch">พักกลางวัน</td>
                <td
                  class="td-slot"
                  :class="{ 'td-slot--empty': !getSlot(day, period.num) }"
                  @click="getSlot(day, period.num) ? openEdit(getSlot(day, period.num)!) : openAdd(day, period.num)"
                >
                  <template v-if="getSlot(day, period.num)">
                    <div class="slot-card" :style="{ borderLeftColor: subjectColor(getSlot(day, period.num)!.courseCode) }">
                      <div class="slot-actions">
                        <button type="button" class="btn-action btn-edit" @click.stop="openEdit(getSlot(day, period.num)!)">แก้ไข</button>
                        <button type="button" class="btn-action btn-delete" @click.stop="openDelete(getSlot(day, period.num)!)">ลบ</button>
                      </div>
                      <span class="slot-course">{{ getSlot(day, period.num)!.courseName }}</span>
                      <span class="slot-teacher">{{ getSlot(day, period.num)!.teacherName }}</span>
                      <span class="slot-time">{{ getSlot(day, period.num)!.startTime || '--:--' }} - {{ getSlot(day, period.num)!.endTime || '--:--' }}</span>
                      <span class="slot-room">{{ getSlot(day, period.num)!.room }}</span>
                    </div>
                  </template>
                  <template v-else>
                    <span class="slot-empty">+ เพิ่ม</span>
                  </template>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>

      <AdminAppModal
        v-model="showModal"
        :title="editSlot ? 'แก้ไขคาบเรียน' : 'เพิ่มคาบเรียน'"
        size="md"
        confirm-label="บันทึก"
        @confirm="saveSlot"
      >
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">วัน <span class="req">*</span></label>
            <select v-model="form.day" class="form-input">
              <option v-for="d in DAYS" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">คาบที่ <span class="req">*</span></label>
            <select v-model.number="form.period" class="form-input">
              <option v-for="p in periodOptions" :key="p.num" :value="p.num">คาบ {{ p.num }} ({{ p.start }}-{{ p.end }})</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">เวลาเริ่ม <span class="req">*</span></label>
            <input v-model="form.startTime" type="time" class="form-input">
            <span v-if="formErrors.startTime" class="field-error">{{ formErrors.startTime }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">เวลาสิ้นสุด <span class="req">*</span></label>
            <input v-model="form.endTime" type="time" class="form-input">
            <span v-if="formErrors.endTime" class="field-error">{{ formErrors.endTime }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">รายวิชา <span class="req">*</span></label>
            <select v-model="form.subjectId" class="form-input">
              <option value="">-- เลือกวิชา --</option>
              <option v-for="c in subjectOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
            <span v-if="formErrors.subjectId" class="field-error">{{ formErrors.subjectId }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">ครูผู้สอน <span class="req">*</span></label>
            <select v-model="form.teacherId" class="form-input">
              <option value="">-- เลือกครูผู้สอน --</option>
              <option v-for="t in teacherOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
            <span v-if="formErrors.teacherId" class="field-error">{{ formErrors.teacherId }}</span>
          </div>
        </div>
        <template #footer>
          <div class="modal-footer-split">
            <div class="footer-left">
              <button v-if="editSlot" type="button" class="btn btn-delete" @click="openDelete(editSlot)">ลบคาบนี้</button>
            </div>
            <div class="footer-right">
              <button type="button" class="btn btn-ghost" @click="showModal = false">ยกเลิก</button>
              <button type="button" class="btn btn-primary" @click="saveSlot">บันทึก</button>
            </div>
          </div>
        </template>
      </AdminAppModal>

      <AdminAppConfirmModal
        v-model="showConfirm"
        title="ลบคาบเรียนนี้?"
        :description="`${editSlot?.courseName} - ${editSlot?.day} คาบ ${editSlot?.period}`"
        required-text="ลบ"
        required-text-label="ลบ"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DAYS, type DayName } from '~/composables/useTimetableData'

definePageMeta({ layout: 'admin' })

type BaseResponse<T> = { data: T }
type SubjectApiItem = { id: string; subject_code: string | null; name: string }
type TeacherApiItem = { id: string; teacher_code: string | null; first_name: string | null; last_name: string | null }
type ClassroomApiItem = { id: string; name: string; grade_level: string | null; room_no: string | null }
type AcademicYearApiItem = { id: string; year: string; term: string; is_current: boolean }
type SubjectAssignmentApiItem = { id: string; subject_id: string; teacher_id: string; classroom_id: string; academic_year_id: string; semester_no: number; is_active: boolean }
type ScheduleApiItem = { id: string; subject_assignment_id: string; day_of_week: string; period_no: number | null; start_time: string | null; end_time: string | null; is_active: boolean }
type PeriodOption = { num: number; start: string; end: string }

type TimetableSlot = {
  id: string
  subjectAssignmentId: string
  subjectId: string
  teacherId: string
  classroomId: string
  academicYearId: string
  semesterNo: number
  day: DayName
  period: number
  startTime: string
  endTime: string
  courseName: string
  courseCode: string
  teacherName: string
  room: string
}

const { loading } = usePageLoad()
const { profile } = useAdminAuth()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')

const pageLoading = ref(false)
const errorMessage = ref('')
const slots = ref<TimetableSlot[]>([])
const subjectRows = ref<SubjectApiItem[]>([])
const teacherRows = ref<TeacherApiItem[]>([])
const classroomRows = ref<ClassroomApiItem[]>([])
const academicYearRows = ref<AcademicYearApiItem[]>([])
const assignmentRows = ref<SubjectAssignmentApiItem[]>([])
const scheduleRows = ref<ScheduleApiItem[]>([])

const classroomOptions = computed(() => classroomRows.value.map(item => ({ value: item.id, label: item.name || `${item.grade_level || ''} ${item.room_no || ''}`.trim() || item.id })))
const subjectOptions = computed(() => subjectRows.value.map(item => ({ value: item.id, label: `${(item.subject_code || '').trim() || item.id} - ${item.name}` })))
const teacherOptions = computed(() => teacherRows.value.map(item => ({ value: item.id, label: `${(item.first_name || '').trim()} ${(item.last_name || '').trim()}`.trim() || item.teacher_code || item.id })).sort((a, b) => a.label.localeCompare(b.label, 'th')))
const academicYearOptions = computed(() => academicYearRows.value.map(item => ({ value: item.id, label: `${item.year} / ${item.term}` })))

const filterClassroom = ref('')
const filterSemester = ref('1')
const filterYear = ref('')

const defaultPeriodOptions: PeriodOption[] = [
  { num: 1, start: '08:00', end: '08:50' },
  { num: 2, start: '08:50', end: '09:40' },
  { num: 3, start: '09:50', end: '10:40' },
  { num: 4, start: '10:40', end: '11:30' },
  { num: 5, start: '12:20', end: '13:10' },
  { num: 6, start: '13:10', end: '14:00' },
  { num: 7, start: '14:10', end: '15:00' },
  { num: 8, start: '15:00', end: '15:50' },
]

const classroomSlots = computed(() =>
  slots.value.filter(s => s.classroomId === filterClassroom.value && s.academicYearId === filterYear.value && String(s.semesterNo) === filterSemester.value),
)

const periodOptions = computed(() => {
  const byPeriod = new Map<number, PeriodOption>()
  for (const base of defaultPeriodOptions) byPeriod.set(base.num, { ...base })

  for (const slot of classroomSlots.value) {
    const num = slot.period || 0
    if (num <= 0) continue
    const existing = byPeriod.get(num) || { num, start: '--:--', end: '--:--' }
    const start = (slot.startTime || '').slice(0, 5)
    const end = (slot.endTime || '').slice(0, 5)
    byPeriod.set(num, { num, start: start || existing.start, end: end || existing.end })
  }

  return Array.from(byPeriod.values()).sort((a, b) => a.num - b.num)
})

const currentYearLabel = computed(() => {
  const found = academicYearRows.value.find(item => item.id === filterYear.value)
  return found ? `${found.year} / ${found.term}` : '-'
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

function toThaiDay(day: string): DayName {
  if (day === 'monday') return 'จันทร์'
  if (day === 'tuesday') return 'อังคาร'
  if (day === 'wednesday') return 'พุธ'
  if (day === 'thursday') return 'พฤหัสบดี'
  if (day === 'friday') return 'ศุกร์'
  if (day === 'saturday') return 'เสาร์'
  return 'อาทิตย์'
}

function toApiDay(day: DayName): string {
  if (day === 'จันทร์') return 'monday'
  if (day === 'อังคาร') return 'tuesday'
  if (day === 'พุธ') return 'wednesday'
  if (day === 'พฤหัสบดี') return 'thursday'
  if (day === 'ศุกร์') return 'friday'
  if (day === 'เสาร์') return 'saturday'
  return 'sunday'
}

async function loadRows() {
  if (!import.meta.client || !authToken.value) return
  pageLoading.value = true
  errorMessage.value = ''

  try {
    const schoolID = profile.value.schoolId
    const schoolQuery = schoolID ? `?school_id=${schoolID}` : ''
    const [subjectsRes, teachersRes, classroomsRes, academicYearsRes, assignmentsRes, schedulesRes] = await Promise.all([
      apiFetch<BaseResponse<SubjectApiItem[]>>(`/subjects${schoolQuery}`, { headers: authHeaders() }),
      apiFetch<BaseResponse<TeacherApiItem[]>>('/teachers?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<ClassroomApiItem[]>>(`/classrooms${schoolQuery}`, { headers: authHeaders() }),
      apiFetch<BaseResponse<AcademicYearApiItem[]>>('/academic-years?only_active=false', { headers: authHeaders() }),
      apiFetch<BaseResponse<SubjectAssignmentApiItem[]>>('/subject-assignments?only_active=true', { headers: authHeaders() }),
      apiFetch<BaseResponse<ScheduleApiItem[]>>('/schedules?only_active=true', { headers: authHeaders() }),
    ])

    subjectRows.value = Array.isArray(subjectsRes.data) ? subjectsRes.data : []
    teacherRows.value = Array.isArray(teachersRes.data) ? teachersRes.data : []
    classroomRows.value = Array.isArray(classroomsRes.data) ? classroomsRes.data : []
    academicYearRows.value = Array.isArray(academicYearsRes.data) ? academicYearsRes.data : []
    assignmentRows.value = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []
    scheduleRows.value = Array.isArray(schedulesRes.data) ? schedulesRes.data : []

    if (!filterClassroom.value) filterClassroom.value = classroomRows.value[0]?.id || ''
    if (!filterYear.value) filterYear.value = academicYearRows.value.find(item => item.is_current)?.id || academicYearRows.value[0]?.id || ''

    const subjectByID = new Map(subjectRows.value.map(item => [item.id, item] as const))
    const teacherLabelByID = new Map(teacherRows.value.map(item => [item.id, `${(item.first_name || '').trim()} ${(item.last_name || '').trim()}`.trim() || item.teacher_code || item.id] as const))
    const classroomLabelByID = new Map(classroomRows.value.map(item => [item.id, item.name || `${item.grade_level || ''} ${item.room_no || ''}`.trim() || item.id] as const))
    const assignmentByID = new Map(assignmentRows.value.map(item => [item.id, item] as const))

    slots.value = scheduleRows.value
      .map(item => {
        const assignment = assignmentByID.get(item.subject_assignment_id)
        if (!assignment || !item.period_no) return null
        const subject = subjectByID.get(assignment.subject_id)
        return {
          id: item.id,
          subjectAssignmentId: assignment.id,
          subjectId: assignment.subject_id,
          teacherId: assignment.teacher_id,
          classroomId: assignment.classroom_id,
          academicYearId: assignment.academic_year_id,
          semesterNo: assignment.semester_no,
          day: toThaiDay(item.day_of_week),
          period: item.period_no,
          startTime: (item.start_time || '').slice(0, 5),
          endTime: (item.end_time || '').slice(0, 5),
          courseName: subject?.name || '-',
          courseCode: (subject?.subject_code || '').trim() || assignment.subject_id,
          teacherName: teacherLabelByID.get(assignment.teacher_id) || '-',
          room: classroomLabelByID.get(assignment.classroom_id) || '-',
        } as TimetableSlot
      })
      .filter((item): item is TimetableSlot => Boolean(item))
  }
  catch {
    errorMessage.value = 'ไม่สามารถโหลดข้อมูลตารางสอนได้'
    slots.value = []
  }
  finally {
    pageLoading.value = false
  }
}

if (import.meta.client) loadRows()

function getSlot(day: DayName, period: number): TimetableSlot | undefined {
  return classroomSlots.value.find(s => s.day === day && s.period === period)
}

const colorMap: Record<string, string> = { M: '#6366f1', T: '#f59e0b', S: '#10b981', L: '#0ea5e9', P: '#ef4444', SO: '#8b5cf6', A: '#ec4899', W: '#f97316' }
function subjectColor(code: string): string {
  const prefix = code.replace(/[0-9]/g, '')
  return colorMap[prefix] ?? '#9ca3af'
}

const showModal = ref(false)
const showConfirm = ref(false)
const editSlot = ref<TimetableSlot | null>(null)
const form = ref({ day: 'จันทร์' as DayName, period: 1, startTime: '08:00', endTime: '08:50', subjectId: '', teacherId: '' })
const formErrors = ref({ subjectId: '', teacherId: '', startTime: '', endTime: '' })

function getPeriodRange(period: number): PeriodOption {
  return periodOptions.value.find(item => item.num === period)
    || defaultPeriodOptions.find(item => item.num === period)
    || { num: period, start: '08:00', end: '08:50' }
}

function openAdd(day?: DayName, period?: number) {
  const selectedPeriod = period ?? (periodOptions.value[0]?.num || 1)
  const range = getPeriodRange(selectedPeriod)
  editSlot.value = null
  form.value = {
    day: day ?? 'จันทร์',
    period: selectedPeriod,
    startTime: range.start,
    endTime: range.end,
    subjectId: '',
    teacherId: '',
  }
  formErrors.value = { subjectId: '', teacherId: '', startTime: '', endTime: '' }
  showModal.value = true
}

function openEdit(slot: TimetableSlot) {
  const range = getPeriodRange(slot.period)
  editSlot.value = slot
  form.value = {
    day: slot.day,
    period: slot.period,
    startTime: slot.startTime || range.start,
    endTime: slot.endTime || range.end,
    subjectId: slot.subjectId,
    teacherId: slot.teacherId,
  }
  formErrors.value = { subjectId: '', teacherId: '', startTime: '', endTime: '' }
  showModal.value = true
}

function openDelete(slot: TimetableSlot) {
  editSlot.value = slot
  showConfirm.value = true
}

async function saveSlot() {
  if (!filterClassroom.value || !filterYear.value || !authToken.value) return
  formErrors.value = { subjectId: '', teacherId: '', startTime: '', endTime: '' }
  if (!form.value.subjectId) { formErrors.value.subjectId = 'กรุณาเลือกวิชา'; return }
  if (!form.value.teacherId) { formErrors.value.teacherId = 'กรุณาเลือกครูผู้สอน'; return }
  if (!form.value.startTime) { formErrors.value.startTime = 'กรุณาเลือกเวลาเริ่ม'; return }
  if (!form.value.endTime) { formErrors.value.endTime = 'กรุณาเลือกเวลาสิ้นสุด'; return }
  if (form.value.startTime >= form.value.endTime) {
    formErrors.value.endTime = 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม'
    return
  }

  const semesterNo = Number.parseInt(filterSemester.value, 10) || 1
  const conflict = slots.value.find(s =>
    s.classroomId === filterClassroom.value &&
    s.academicYearId === filterYear.value &&
    s.semesterNo === semesterNo &&
    s.day === form.value.day &&
    s.period === form.value.period &&
    (!editSlot.value || s.id !== editSlot.value.id),
  )

  if (conflict) {
    formErrors.value.subjectId = `คาบนี้มีวิชา '${conflict.courseName}' อยู่แล้ว`
    return
  }

  try {
    const assignmentQuery = `?subject_id=${form.value.subjectId}&teacher_id=${form.value.teacherId}&classroom_id=${filterClassroom.value}&academic_year_id=${filterYear.value}&semester_no=${semesterNo}&only_active=true`
    const assignmentRes = await apiFetch<BaseResponse<SubjectAssignmentApiItem[]>>(`/subject-assignments${assignmentQuery}`, { headers: authHeaders() })
    const existing = Array.isArray(assignmentRes.data) ? assignmentRes.data[0] : undefined
    let assignmentID = existing?.id || ''

    if (!assignmentID) {
      const created = await apiFetch<BaseResponse<SubjectAssignmentApiItem>>('/subject-assignments', {
        method: 'POST',
        headers: authHeaders(),
        body: {
          subject_id: form.value.subjectId,
          teacher_id: form.value.teacherId,
          classroom_id: filterClassroom.value,
          academic_year_id: filterYear.value,
          semester_no: semesterNo,
          is_active: true,
        },
      })
      assignmentID = created.data.id
    }

    const payload = {
      subject_assignment_id: assignmentID,
      day_of_week: toApiDay(form.value.day),
      period_no: form.value.period,
      start_time: form.value.startTime,
      end_time: form.value.endTime,
      is_active: true,
    }

    if (editSlot.value) {
      await apiFetch(`/schedules/${editSlot.value.id}`, { method: 'PATCH', headers: authHeaders(), body: payload })
    }
    else {
      await apiFetch('/schedules', { method: 'POST', headers: authHeaders(), body: payload })
    }

    showModal.value = false
    await loadRows()
  }
  catch {
    errorMessage.value = 'บันทึกคาบเรียนไม่สำเร็จ'
  }
}

async function confirmDelete() {
  if (!editSlot.value || !authToken.value) {
    showConfirm.value = false
    showModal.value = false
    return
  }

  try {
    await apiFetch(`/schedules/${editSlot.value.id}`, { method: 'DELETE', headers: authHeaders() })
    editSlot.value = null
    showConfirm.value = false
    showModal.value = false
    await loadRows()
  }
  catch {
    errorMessage.value = 'ลบคาบเรียนไม่สำเร็จ'
    showConfirm.value = false
  }
}

watch([filterClassroom, filterYear, filterSemester], () => {
  if (showModal.value) showModal.value = false
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.85rem; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.filter-select { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; background: #fff; cursor: pointer; }
.filter-select--wide { min-width: 130px; }
.slot-count { font-size: 0.82rem; color: #9ca3af; }

.timetable-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #e8eaed; }
.timetable { width: 100%; border-collapse: collapse; background: #fff; min-width: 1200px; }

thead tr { background: #111827; }
.th-day-side { color: #9ca3af; font-size: 0.76rem; font-weight: 700; padding: 10px 12px; text-align: center; white-space: nowrap; min-width: 92px; }
.th-period-top { color: #fff; font-size: 0.8rem; font-weight: 600; padding: 10px 10px; text-align: center; min-width: 130px; }
.th-period-label { font-size: 0.8rem; line-height: 1.1; }
.th-lunch-top { color: #fde68a; font-size: 0.74rem; font-weight: 700; padding: 10px 8px; text-align: center; min-width: 110px; border-left: 1px solid rgba(255,255,255,0.08); border-right: 1px solid rgba(255,255,255,0.08); }

.td-row:hover { background: #f9fafb; }
.td-day-side { text-align: center; font-size: 0.82rem; font-weight: 700; color: #6b7280; padding: 10px 8px; background: #f9fafb; border-right: 1px solid #e8eaed; white-space: nowrap; }
.td-slot { padding: 6px 8px; border: 1px solid #f0f1f3; vertical-align: top; cursor: pointer; min-height: 64px; transition: background 0.12s; }
.td-slot:hover { background: #f0f4ff; }
.td-slot--empty:hover { background: #f9fbff; }
.td-lunch { text-align: center; font-size: 0.72rem; font-weight: 600; color: #92400e; background: #fffbeb; border: 1px dashed #fde68a; min-width: 110px; }

.slot-card { border-left: 3px solid #6366f1; background: #f8f9ff; border-radius: 6px; padding: 6px 8px; display: flex; flex-direction: column; gap: 2px; }
.slot-actions { display: flex; gap: 6px; justify-content: flex-end; margin-bottom: 2px; }
.btn-action { border-radius: 6px; font-size: 0.65rem; line-height: 1.2; padding: 2px 8px; cursor: pointer; border: 1px solid #e5e7eb; }
.slot-course { font-size: 0.8rem; font-weight: 600; color: #111827; line-height: 1.2; }
.slot-teacher { font-size: 0.72rem; color: #6b7280; }
.slot-time { font-size: 0.7rem; color: #4b5563; }
.slot-room { font-size: 0.7rem; color: #9ca3af; }
.slot-empty { display: flex; align-items: center; justify-content: center; height: 52px; color: #d1d5db; font-size: 0.78rem; }

.btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #111827; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-primary:hover { background: #1f2937; }
.btn-ghost { background: #fff; color: #374151; border-color: #e5e7eb; }
.btn-ghost:hover { background: #f9fafb; }

.btn-edit { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
.btn-edit:hover { background: #dbeafe; }

.btn-delete { background: #fff5f5; color: #dc2626; border-color: #fecaca; }
.btn-delete:hover { background: #fee2e2; }

.modal-footer-split { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.footer-left { display: flex; align-items: center; }
.footer-right { display: flex; align-items: center; gap: 8px; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group--full { grid-column: 1 / -1; }
.form-label { font-size: 0.85rem; font-weight: 500; color: #374151; }
.req { color: #ef4444; }
.form-input { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; transition: border-color 0.15s; background: #fff; }
.form-input:focus { border-color: #6366f1; }
.field-error { font-size: 0.75rem; color: #ef4444; }
</style>
