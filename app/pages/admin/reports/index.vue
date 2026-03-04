<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="4" :cols="5" />
    <template v-else>
      <div class="page-header">
        <div>
          <h2 class="page-title">รายงานและสรุปข้อมูล</h2>
          <p class="page-desc">สรุปภาพรวมและ Export ข้อมูลจากระบบ</p>
        </div>
        <div class="header-filters">
          <select v-model="filterSemester" class="filter-select">
            <option value="1">ภาคเรียนที่ 1</option>
            <option value="2">ภาคเรียนที่ 2</option>
          </select>
          <select v-model="filterYear" class="filter-select">
            <option value="2568">ปีการศึกษา 2568</option>
            <option value="2567">ปีการศึกษา 2567</option>
          </select>
        </div>
      </div>

      <!-- Overview cards -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon stat-icon--blue">👩‍🏫</div>
          <div class="stat-body">
            <div class="stat-value">{{ teacherRows.length }}</div>
            <div class="stat-label">ครูทั้งหมด</div>
            <div class="stat-sub">อนุมัติแล้ว {{ approvedTeachers }}</div>
          </div>
          <button type="button" class="export-btn" @click="exportReport('teachers')">Export</button>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--green">🎒</div>
          <div class="stat-body">
            <div class="stat-value">{{ studentRows.length }}</div>
            <div class="stat-label">นักเรียนทั้งหมด</div>
            <div class="stat-sub">สถานะปกติ {{ normalStudents }}</div>
          </div>
          <button type="button" class="export-btn" @click="exportReport('students')">Export</button>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--purple">📚</div>
          <div class="stat-body">
            <div class="stat-value">{{ courseRows.length }}</div>
            <div class="stat-label">รายวิชา</div>
            <div class="stat-sub">เทอม {{ filterSemester }}/{{ filterYear }}</div>
          </div>
          <button type="button" class="export-btn" @click="exportReport('courses')">Export</button>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--amber">📊</div>
          <div class="stat-body">
            <div class="stat-value">{{ gradeRows.length }}</div>
            <div class="stat-label">บันทึกผลการเรียน</div>
            <div class="stat-sub">ผ่าน {{ passGrades }} / ไม่ผ่าน {{ failGrades }}</div>
          </div>
          <button type="button" class="export-btn" @click="exportReport('grades')">Export</button>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--teal">📋</div>
          <div class="stat-body">
            <div class="stat-value">{{ attendanceRows.length }}</div>
            <div class="stat-label">บันทึกการเข้าเรียน</div>
            <div class="stat-sub">มาเรียน {{ presentAttendance }} / ขาด {{ absentAttendance }}</div>
          </div>
          <button type="button" class="export-btn" @click="exportReport('attendance')">Export</button>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon--red">⚡</div>
          <div class="stat-body">
            <div class="stat-value">{{ behaviorRows.length }}</div>
            <div class="stat-label">บันทึกพฤติกรรม</div>
            <div class="stat-sub">ดี {{ goodBehavior }} / โทษ {{ badBehavior }}</div>
          </div>
          <button type="button" class="export-btn" @click="exportReport('behavior')">Export</button>
        </div>
      </div>

      <!-- Report types -->
      <div class="reports-grid">
        <div v-for="r in reportTypes" :key="r.id" class="report-card">
          <div class="report-icon">{{ r.icon }}</div>
          <div class="report-info">
            <div class="report-title">{{ r.title }}</div>
            <div class="report-desc">{{ r.desc }}</div>
          </div>
          <div class="report-actions">
            <button type="button" class="format-btn format-btn--pdf" @click="exportReport(r.id, 'pdf')">PDF</button>
            <button type="button" class="format-btn format-btn--excel" @click="exportReport(r.id, 'excel')">Excel</button>
          </div>
        </div>
      </div>

      <!-- Toast notification -->
      <Transition name="toast">
        <div v-if="toastMsg" class="toast">✅ {{ toastMsg }}</div>
      </Transition>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTeachersData } from '~/composables/useTeachersData'
import { useStudentsData } from '~/composables/useStudentsData'
import { useCoursesData } from '~/composables/useCoursesData'
import { useGradesData, getGrade, getStatus } from '~/composables/useGradesData'
import { useAttendanceData } from '~/composables/useAttendanceData'
import { useBehaviorData } from '~/composables/useBehaviorData'

definePageMeta({ layout: 'admin' })
const { loading } = usePageLoad()

const { rows: teacherRows } = useTeachersData()
const { rows: studentRows } = useStudentsData()
const { rows: courseRows } = useCoursesData()
const { rows: gradeRows } = useGradesData()
const { rows: attendanceRows } = useAttendanceData()
const { rows: behaviorRows } = useBehaviorData()

const filterSemester = ref('1')
const filterYear = ref('2568')

// Computed stats
const approvedTeachers = computed(() => teacherRows.value.filter(r => r.status === 'อนุมัติแล้ว').length)
const normalStudents = computed(() => studentRows.value.filter(r => r.status === 'ปกติ').length)
const passGrades = computed(() => gradeRows.value.filter(r => getStatus(r) === 'ผ่าน').length)
const failGrades = computed(() => gradeRows.value.filter(r => getStatus(r) === 'ไม่ผ่าน').length)
const presentAttendance = computed(() => attendanceRows.value.filter(r => r.status === 'มาเรียน').length)
const absentAttendance = computed(() => attendanceRows.value.filter(r => r.status === 'ขาด').length)
const goodBehavior = computed(() => behaviorRows.value.filter(r => r.type === 'ดี').length)
const badBehavior = computed(() => behaviorRows.value.filter(r => r.type === 'ไม่ดี').length)

const reportTypes = [
  { id: 'student-summary', icon: '🎒', title: 'สรุปข้อมูลนักเรียน', desc: 'รายชื่อ ชั้น คะแนน GPA สถานะทั้งหมด' },
  { id: 'teacher-summary', icon: '👩‍🏫', title: 'สรุปข้อมูลครู', desc: 'รายชื่อ วิชาที่สอน จำนวนคาบ ประวัติการศึกษา' },
  { id: 'grade-report', icon: '📊', title: 'รายงานผลการเรียน', desc: 'คะแนนกลางภาค ปลายภาค เกรด สถานะรายวิชา' },
  { id: 'attendance-report', icon: '📋', title: 'รายงานการเข้าเรียน', desc: 'สถิติการมาเรียน ขาด ลา สาย รายห้อง/รายวิชา' },
  { id: 'behavior-report', icon: '⚡', title: 'รายงานพฤติกรรมนักเรียน', desc: 'คะแนนดี โทษ สรุปรายบุคคล' },
  { id: 'school-summary', icon: '🏫', title: 'รายงานสรุปโรงเรียน', desc: 'ภาพรวมทุกด้าน สำหรับผู้บริหาร' },
]

// Toast
const toastMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function exportReport(type: string, format = 'excel') {
  const label = reportTypes.find(r => r.id === type)?.title ?? type
  toastMsg.value = `กำลัง Export ${label} (${format.toUpperCase()})…`
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 3000)
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 22px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.85rem; }
.header-filters { display: flex; gap: 8px; flex-wrap: wrap; }
.filter-select { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; background: #fff; cursor: pointer; }

/* Stat cards */
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
.export-btn { padding: 5px 10px; border: 1px solid #e5e7eb; border-radius: 7px; background: #f9fafb; color: #374151; font-size: 0.75rem; cursor: pointer; font-family: inherit; white-space: nowrap; transition: background 0.1s; }
.export-btn:hover { background: #f3f4f6; }

/* Report types */
.reports-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
@media (max-width: 740px) { .reports-grid { grid-template-columns: 1fr; } }

.report-card { background: #fff; border: 1px solid #e8eaed; border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; gap: 14px; transition: box-shadow 0.1s; }
.report-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.06); }
.report-icon { font-size: 1.5rem; flex-shrink: 0; }
.report-info { flex: 1; }
.report-title { font-size: 0.9rem; font-weight: 600; color: #111827; }
.report-desc { font-size: 0.78rem; color: #6b7280; margin-top: 2px; }
.report-actions { display: flex; gap: 6px; flex-shrink: 0; }
.format-btn { padding: 5px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; border: 1px solid; cursor: pointer; font-family: inherit; transition: background 0.1s; }
.format-btn--pdf { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
.format-btn--pdf:hover { background: #fee2e2; }
.format-btn--excel { border-color: #bbf7d0; background: #f0fdf4; color: #15803d; }
.format-btn--excel:hover { background: #dcfce7; }

/* Toast */
.toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); background: #111827; color: #fff; padding: 10px 20px; border-radius: 10px; font-size: 0.875rem; font-weight: 500; box-shadow: 0 4px 16px rgba(0,0,0,.2); z-index: 9999; white-space: nowrap; }
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
</style>
