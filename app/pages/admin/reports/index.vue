<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="4" :cols="5" />
    <template v-else>
      <div class="page-header">
        <div>
          <h2 class="page-title">รายงานและสรุปข้อมูล</h2>
          <p class="page-desc">สรุปภาพรวมจากข้อมูลจริงในระบบ</p>
        </div>
        <div class="filters">
          <select v-model="selectedAcademicYearId" class="input filter-input">
            <option value="">ทุกปีการศึกษา</option>
            <option v-for="item in filterAcademicYears" :key="item.id" :value="item.id">{{ item.label }}</option>
          </select>
          <select v-model="selectedSemesterNo" class="input filter-input">
            <option value="">ทุกเทอม</option>
            <option v-for="no in filterSemesters" :key="no" :value="String(no)">เทอม {{ no }}</option>
          </select>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon stat-icon--blue">👩‍🏫</div>
          <div class="stat-body">
            <div class="stat-value">{{ summary.teachers_total }}</div>
            <div class="stat-label">ครูทั้งหมด</div>
            <div class="stat-sub">ใช้งานอยู่ {{ summary.teachers_active }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--green">🎒</div>
          <div class="stat-body">
            <div class="stat-value">{{ summary.students_total }}</div>
            <div class="stat-label">นักเรียนทั้งหมด</div>
            <div class="stat-sub">สถานะปกติ {{ summary.students_active }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--purple">📚</div>
          <div class="stat-body">
            <div class="stat-value">{{ summary.subjects_total }}</div>
            <div class="stat-label">รายวิชา</div>
            <div class="stat-sub">ข้อมูลจากหลังบ้าน</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--amber">📊</div>
          <div class="stat-body">
            <div class="stat-value">{{ summary.grade_records_total }}</div>
            <div class="stat-label">บันทึกผลการเรียน</div>
            <div class="stat-sub">ผ่าน {{ summary.grade_pass_total }} / ไม่ผ่าน {{ summary.grade_fail_total }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--teal">📋</div>
          <div class="stat-body">
            <div class="stat-value">{{ summary.attendance_total }}</div>
            <div class="stat-label">บันทึกการเข้าเรียน</div>
            <div class="stat-sub">มาเรียน {{ summary.attendance_present }} / ขาด {{ summary.attendance_absent }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--red">⚡</div>
          <div class="stat-body">
            <div class="stat-value">{{ summary.behavior_total }}</div>
            <div class="stat-label">บันทึกพฤติกรรม</div>
            <div class="stat-sub">ดี {{ summary.behavior_good }} / โทษ {{ summary.behavior_bad }}</div>
          </div>
        </div>
      </div>

      <div class="reports-grid">
        <div v-for="r in reportTypes" :key="r.id" class="report-card">
          <div class="report-icon">{{ r.icon }}</div>
          <div class="report-info">
            <div class="report-title">{{ r.title }}</div>
            <div class="report-desc">{{ r.desc }}</div>
          </div>
          <div class="report-actions">
            <button type="button" class="format-btn format-btn--excel" @click="exportReport(r.id)">Export CSV</button>
          </div>
        </div>
      </div>

      <Transition name="toast">
        <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
      </Transition>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

definePageMeta({ layout: 'admin' })

type BaseResponse<T> = { data: T }

type SummaryData = {
  teachers_total: number
  teachers_active: number
  students_total: number
  students_active: number
  subjects_total: number
  courses_total: number
  grade_records_total: number
  grade_pass_total: number
  grade_fail_total: number
  attendance_total: number
  attendance_present: number
  attendance_absent: number
  behavior_total: number
  behavior_good: number
  behavior_bad: number
}

type AcademicYearFilter = {
  id: string
  year: string
  term: string
  label: string
}

type FilterData = {
  academic_years: AcademicYearFilter[]
  semesters: number[]
}

const { loading } = usePageLoad()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')

const summary = ref<SummaryData>({
  teachers_total: 0,
  teachers_active: 0,
  students_total: 0,
  students_active: 0,
  subjects_total: 0,
  courses_total: 0,
  grade_records_total: 0,
  grade_pass_total: 0,
  grade_fail_total: 0,
  attendance_total: 0,
  attendance_present: 0,
  attendance_absent: 0,
  behavior_total: 0,
  behavior_good: 0,
  behavior_bad: 0,
})
const filterAcademicYears = ref<AcademicYearFilter[]>([])
const filterSemesters = ref<number[]>([1, 2])
const selectedAcademicYearId = ref('')
const selectedSemesterNo = ref('')

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

async function loadFilters() {
  if (!import.meta.client || !authToken.value) return
  const res = await apiFetch<BaseResponse<FilterData>>('/reports/filters', { headers: authHeaders() })
  filterAcademicYears.value = res.data?.academic_years || []
  filterSemesters.value = res.data?.semesters || [1, 2]
}

async function loadSummary() {
  if (!import.meta.client || !authToken.value) return

  const query = new URLSearchParams()
  if (selectedAcademicYearId.value) query.set('academic_year_id', selectedAcademicYearId.value)
  if (selectedSemesterNo.value) query.set('semester_no', selectedSemesterNo.value)

  const suffix = query.toString() ? `?${query.toString()}` : ''
  const res = await apiFetch<BaseResponse<{ summary: SummaryData }>>(`/reports/summary${suffix}`, { headers: authHeaders() })
  summary.value = res.data?.summary || summary.value
}

if (import.meta.client) {
  loadFilters()
  loadSummary()
}

watch([selectedAcademicYearId, selectedSemesterNo], () => {
  loadSummary()
})

const reportTypes = [
  { id: 'teacher-summary', icon: '👩‍🏫', title: 'สรุปข้อมูลครู', desc: 'จำนวนครูและสถานะการใช้งาน' },
  { id: 'student-summary', icon: '🎒', title: 'สรุปข้อมูลนักเรียน', desc: 'จำนวนนักเรียนและสถานะการใช้งาน' },
  { id: 'grade-report', icon: '📊', title: 'รายงานผลการเรียน', desc: 'จำนวนผลการเรียนผ่าน/ไม่ผ่าน' },
  { id: 'attendance-report', icon: '📋', title: 'รายงานการเข้าเรียน', desc: 'สถิติการมาเรียนและขาดเรียน' },
  { id: 'behavior-report', icon: '⚡', title: 'รายงานพฤติกรรม', desc: 'สถิติพฤติกรรมเชิงบวกและเชิงลบ' },
]

const toastMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
  const csv = [headers.map(escape).join(','), ...rows.map(item => item.map(escape).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function exportReport(type: string) {
  if (type === 'teacher-summary') {
    downloadCsv('teacher-summary.csv', ['teachers_total', 'teachers_active'], [[summary.value.teachers_total, summary.value.teachers_active]])
  }
  else if (type === 'student-summary') {
    downloadCsv('student-summary.csv', ['students_total', 'students_active'], [[summary.value.students_total, summary.value.students_active]])
  }
  else if (type === 'grade-report') {
    downloadCsv('grade-report.csv', ['grade_records_total', 'pass', 'fail'], [[summary.value.grade_records_total, summary.value.grade_pass_total, summary.value.grade_fail_total]])
  }
  else if (type === 'attendance-report') {
    downloadCsv('attendance-report.csv', ['attendance_total', 'present', 'absent'], [[summary.value.attendance_total, summary.value.attendance_present, summary.value.attendance_absent]])
  }
  else {
    downloadCsv('behavior-report.csv', ['behaviors_total', 'positive', 'negative'], [[summary.value.behavior_total, summary.value.behavior_good, summary.value.behavior_bad]])
  }

  toastMsg.value = 'Export สำเร็จ'
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 1800)
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 22px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.85rem; }
.filters { display: flex; gap: 10px; flex-wrap: wrap; }
.input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 10px; font-size: 0.85rem; background: #fff; color: #111827; font-family: inherit; }
.filter-input { min-width: 150px; }

.stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
@media (max-width: 1100px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .stat-grid { grid-template-columns: 1fr; } }

.stat-card { background: #fff; border: 1px solid #e8eaed; border-radius: 12px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,.03); }
.stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
.stat-icon--blue { background: #dbeafe; }
.stat-icon--green { background: #d1fae5; }
.stat-icon--purple { background: #ede9fe; }
.stat-icon--amber { background: #fef3c7; }
.stat-icon--teal { background: #ccfbf1; }
.stat-icon--red { background: #fee2e2; }
.stat-body { flex: 1; }
.stat-value { font-size: 1.6rem; font-weight: 700; color: #111827; line-height: 1.1; }
.stat-label { font-size: 0.82rem; font-weight: 600; color: #374151; margin-top: 2px; }
.stat-sub { font-size: 0.75rem; color: #9ca3af; margin-top: 2px; }

.reports-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
@media (max-width: 740px) { .reports-grid { grid-template-columns: 1fr; } }

.report-card { background: #fff; border: 1px solid #e8eaed; border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; gap: 14px; transition: box-shadow 0.1s; }
.report-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.06); }
.report-icon { font-size: 1.5rem; flex-shrink: 0; }
.report-info { flex: 1; }
.report-title { font-size: 0.9rem; font-weight: 600; color: #111827; }
.report-desc { font-size: 0.78rem; color: #6b7280; margin-top: 2px; }
.report-actions { display: flex; gap: 6px; flex-shrink: 0; }
.format-btn { padding: 5px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; border: 1px solid #bbf7d0; background: #f0fdf4; color: #15803d; cursor: pointer; font-family: inherit; transition: background 0.1s; }
.format-btn:hover { background: #dcfce7; }

.toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); background: #111827; color: #fff; padding: 10px 20px; border-radius: 10px; font-size: 0.875rem; font-weight: 500; box-shadow: 0 4px 16px rgba(0,0,0,.2); z-index: 9999; white-space: nowrap; }
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
</style>