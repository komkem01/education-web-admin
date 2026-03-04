<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="6" :cols="6" />
    <template v-else>
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">การเข้าเรียน</h2>
          <p class="page-desc">บันทึกและตรวจสอบการเข้าเรียนของนักเรียนรายวัน</p>
        </div>
        <button type="button" class="btn btn-primary" @click="openAddSession">+ บันทึกรายวัน</button>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <input v-model="filterDate" type="date" class="filter-input" />
        <select v-model="filterClassroom" class="filter-select">
          <option value="">ทุกห้องเรียน</option>
          <option v-for="c in classroomOptions" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="filterStatus" class="filter-select">
          <option value="">ทุกสถานะ</option>
          <option value="มาเรียน">มาเรียน</option>
          <option value="ขาด">ขาด</option>
          <option value="ลา">ลา</option>
          <option value="สาย">สาย</option>
        </select>
        <button v-if="filterDate || filterClassroom || filterStatus" type="button" class="btn btn-clear" @click="clearFilters">ล้างตัวกรอง</button>
      </div>

      <!-- Summary -->
      <div v-if="filteredRows.length" class="summary-strip">
        <div class="summary-item summary-item--present">
          <span class="s-value">{{ statusCount('มาเรียน') }}</span>
          <span class="s-label">มาเรียน</span>
        </div>
        <div class="summary-item summary-item--absent">
          <span class="s-value">{{ statusCount('ขาด') }}</span>
          <span class="s-label">ขาด</span>
        </div>
        <div class="summary-item summary-item--leave">
          <span class="s-value">{{ statusCount('ลา') }}</span>
          <span class="s-label">ลา</span>
        </div>
        <div class="summary-item summary-item--late">
          <span class="s-value">{{ statusCount('สาย') }}</span>
          <span class="s-label">สาย</span>
        </div>
        <div class="summary-item">
          <span class="s-value">{{ presentPct }}%</span>
          <span class="s-label">% มาเรียน</span>
        </div>
      </div>

      <!-- Table -->
      <div class="table-card">
        <div class="table-header">
          <span class="table-title">บันทึกการเข้าเรียน ({{ filteredRows.length }} รายการ)</span>
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
          <table class="att-table">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ชื่อนักเรียน</th>
                <th>ห้อง</th>
                <th>วันที่</th>
                <th>คาบ</th>
                <th>วิชา</th>
                <th>สถานะ</th>
                <th>หมายเหตุ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in pagedRows" :key="row.id">
                <td class="td-id">{{ row.studentId }}</td>
                <td class="td-name">{{ row.studentName }}</td>
                <td>{{ row.classroom }}</td>
                <td class="td-date">{{ formatDate(row.date) }}</td>
                <td class="td-center">{{ row.period }}</td>
                <td class="td-course">{{ row.courseName }}</td>
                <td>
                  <select
                    :value="row.status"
                    class="status-select"
                    :class="`status-select--${row.status}`"
                    @change="updateStatus(row, ($event.target as HTMLSelectElement).value as AttendanceStatus)"
                  >
                    <option value="มาเรียน">มาเรียน</option>
                    <option value="ขาด">ขาด</option>
                    <option value="ลา">ลา</option>
                    <option value="สาย">สาย</option>
                  </select>
                </td>
                <td class="td-note">
                  <input
                    :value="row.note"
                    class="note-input"
                    placeholder="หมายเหตุ..."
                    @blur="updateNote(row, ($event.target as HTMLInputElement).value)"
                  />
                </td>
                <td>
                  <button type="button" class="act-btn act-btn--danger" @click="deleteRow(row)">ลบ</button>
                </td>
              </tr>
              <tr v-if="!filteredRows.length">
                <td colspan="9" class="empty-td">ไม่พบข้อมูลที่ตรงเงื่อนไข</td>
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

      <!-- Add session modal -->
      <AdminAppModal
        v-model="showModal"
        title="บันทึกการเข้าเรียนรายวัน"
        size="lg"
        confirm-label="บันทึก"
        @confirm="saveSession"
      >
        <div class="session-form">
          <div class="session-row">
            <div class="form-group">
              <label class="form-label">วันที่ <span class="req">*</span></label>
              <input v-model="sessionForm.date" type="date" class="form-input" />
              <span v-if="formErrors.date" class="field-error">{{ formErrors.date }}</span>
            </div>
            <div class="form-group">
              <label class="form-label">ห้องเรียน <span class="req">*</span></label>
              <select v-model="sessionForm.classroom" class="form-input" @change="loadStudents">
                <option value="">-- เลือกห้อง --</option>
                <option v-for="c in classroomOptions" :key="c" :value="c">{{ c }}</option>
              </select>
              <span v-if="formErrors.classroom" class="field-error">{{ formErrors.classroom }}</span>
            </div>
            <div class="form-group">
              <label class="form-label">คาบที่</label>
              <select v-model.number="sessionForm.period" class="form-input">
                <option v-for="p in 8" :key="p" :value="p">คาบ {{ p }}</option>
              </select>
            </div>
            <div class="form-group form-group--wide">
              <label class="form-label">วิชา</label>
              <input v-model="sessionForm.courseName" class="form-input" placeholder="ชื่อรายวิชา" />
            </div>
          </div>

          <!-- Student list quick entry -->
          <div v-if="sessionStudents.length" class="student-att">
            <div class="student-att-header">
              <span class="student-att-title">รายชื่อนักเรียน ({{ sessionStudents.length }} คน)</span>
              <div class="bulk-btns">
                <button type="button" class="btn-bulk btn-bulk--present" @click="markAll('มาเรียน')">มาทั้งหมด</button>
                <button type="button" class="btn-bulk btn-bulk--absent" @click="markAll('ขาด')">ขาดทั้งหมด</button>
              </div>
            </div>
            <div class="student-att-list">
              <div v-for="s in sessionStudents" :key="s.studentId" class="student-att-row">
                <span class="att-name">{{ s.studentName }}</span>
                <div class="att-status-btns">
                  <button
                    v-for="st in ['มาเรียน','ขาด','ลา','สาย']"
                    :key="st"
                    type="button"
                    class="att-btn"
                    :class="[`att-btn--${st}`, { 'att-btn--active': s.status === st }]"
                    @click="s.status = st as AttendanceStatus"
                  >{{ st }}</button>
                </div>
                <input v-model="s.note" class="att-note" placeholder="หมายเหตุ..." />
              </div>
            </div>
          </div>
          <p v-else-if="sessionForm.classroom" class="no-students">ไม่พบข้อมูลนักเรียนในห้องนี้</p>
        </div>
      </AdminAppModal>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAttendanceData, type AttendanceRow, type AttendanceStatus } from '~/composables/useAttendanceData'
import { useStudentsData } from '~/composables/useStudentsData'
import { useClassroomsData } from '~/composables/useClassroomsData'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()
const { rows } = useAttendanceData()
const { rows: studentRows } = useStudentsData()
const { rows: classroomRows } = useClassroomsData()

const classroomOptions = computed(() => classroomRows.value.map(r => r.name))

// ── Filters ──
const filterDate = ref('')
const filterClassroom = ref('')
const filterStatus = ref('')

const filteredRows = computed(() => {
  return rows.value.filter(r => {
    if (filterDate.value && r.date !== filterDate.value) return false
    if (filterClassroom.value && r.classroom !== filterClassroom.value) return false
    if (filterStatus.value && r.status !== filterStatus.value) return false
    return true
  })
})

function clearFilters() { filterDate.value = ''; filterClassroom.value = ''; filterStatus.value = '' }

// ── Pagination ──
const pageSize = ref(10)
const currentPage = ref(1)
watch(() => filteredRows.value, () => { currentPage.value = 1 })
watch(pageSize, () => { currentPage.value = 1 })
const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)))
const rangeStart = computed(() => filteredRows.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1)
const rangeEnd = computed(() => Math.min(currentPage.value * pageSize.value, filteredRows.value.length))
const pagedRows = computed(() => filteredRows.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))
const pageNumbers = computed<(number | '\u2026')[]>(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '\u2026')[] = []
  const add = (n: number | '\u2026') => { if (pages[pages.length - 1] !== n) pages.push(n) }
  add(1)
  if (cur > 3) add('\u2026')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) add(i)
  if (cur < total - 2) add('\u2026')
  add(total)
  return pages
})
function statusCount(s: AttendanceStatus) { return filteredRows.value.filter(r => r.status === s).length }
const presentPct = computed(() => {
  if (!filteredRows.value.length) return 0
  return Math.round((statusCount('มาเรียน') / filteredRows.value.length) * 100)
})

function formatDate(d: string) {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })
}

// ── Inline edit ──
function updateStatus(row: AttendanceRow, status: AttendanceStatus) {
  const idx = rows.value.findIndex(r => r.id === row.id)
  if (idx !== -1) rows.value[idx] = { ...rows.value[idx], status }
}
function updateNote(row: AttendanceRow, note: string) {
  const idx = rows.value.findIndex(r => r.id === row.id)
  if (idx !== -1) rows.value[idx] = { ...rows.value[idx], note }
}
function deleteRow(row: AttendanceRow) {
  rows.value = rows.value.filter(r => r.id !== row.id)
}

// ── Add session ──
const showModal = ref(false)
const sessionForm = ref({ date: '', classroom: '', period: 1, courseName: '' })
const formErrors = ref({ date: '', classroom: '' })

interface SessionStudent { studentId: string; studentName: string; status: AttendanceStatus; note: string }
const sessionStudents = ref<SessionStudent[]>([])

function loadStudents() {
  const cls = sessionForm.value.classroom
  sessionStudents.value = studentRows.value
    .filter(s => s.class === cls)
    .map(s => ({ studentId: s.id, studentName: s.name, status: 'มาเรียน' as AttendanceStatus, note: '' }))
}

function openAddSession() {
  sessionForm.value = { date: new Date().toISOString().slice(0, 10), classroom: '', period: 1, courseName: '' }
  formErrors.value = { date: '', classroom: '' }
  sessionStudents.value = []
  showModal.value = true
}

function markAll(status: AttendanceStatus) {
  sessionStudents.value.forEach(s => s.status = status)
}

function saveSession() {
  formErrors.value = { date: '', classroom: '' }
  if (!sessionForm.value.date) { formErrors.value.date = 'กรุณาเลือกวันที่'; return }
  if (!sessionForm.value.classroom) { formErrors.value.classroom = 'กรุณาเลือกห้องเรียน'; return }
  sessionStudents.value.forEach(s => {
    rows.value.push({
      id: Date.now() + Math.random(),
      studentId: s.studentId,
      studentName: s.studentName,
      classroom: sessionForm.value.classroom,
      date: sessionForm.value.date,
      period: sessionForm.value.period,
      courseName: sessionForm.value.courseName,
      status: s.status,
      note: s.note,
    })
  })
  showModal.value = false
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.85rem; }

.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.filter-input { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; background: #fff; }
.filter-select { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; background: #fff; cursor: pointer; }
.btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #111827; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-primary:hover { background: #1f2937; }
.btn-clear { border: 1px solid #e5e7eb; background: #fff; color: #6b7280; font-size: 0.8rem; padding: 7px 12px; border-radius: 8px; font-family: inherit; cursor: pointer; }
.btn-clear:hover { background: #f9fafb; }

.summary-strip { display: flex; gap: 12px; flex-wrap: wrap; }
.summary-item { background: #fff; border: 1px solid #e8eaed; border-radius: 12px; padding: 12px 20px; display: flex; flex-direction: column; gap: 2px; min-width: 90px; }
.summary-item--present { border-color: #bbf7d0; background: #f0fdf4; }
.summary-item--absent { border-color: #fecaca; background: #fef2f2; }
.summary-item--leave { border-color: #e9d5ff; background: #faf5ff; }
.summary-item--late { border-color: #fde68a; background: #fffbeb; }
.s-value { font-size: 1.4rem; font-weight: 700; color: #111827; line-height: 1.1; }
.s-label { font-size: 0.78rem; color: #6b7280; }

.table-card { background: #fff; border: 1px solid #e8eaed; border-radius: 12px; overflow: hidden; }
.table-header { padding: 14px 20px; border-bottom: 1px solid #f3f4f6; }
.table-title { font-size: 0.9rem; font-weight: 600; color: #111827; }
.table-scroll { overflow-x: auto; }
.att-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.att-table th { background: #f9fafb; padding: 10px 14px; text-align: left; font-weight: 600; color: #374151; font-size: 0.78rem; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
.att-table td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; }
.att-table tr:last-child td { border-bottom: none; }
.td-id { font-size: 0.78rem; color: #9ca3af; white-space: nowrap; }
.td-name { font-weight: 500; white-space: nowrap; }
.td-date { white-space: nowrap; font-size: 0.82rem; }
.td-center { text-align: center; }
.td-course { max-width: 140px; font-size: 0.82rem; }
.empty-td { text-align: center; color: #9ca3af; padding: 32px; }

.status-select { padding: 3px 8px; border-radius: 6px; font-size: 0.8rem; font-family: inherit; border: 1px solid #e5e7eb; cursor: pointer; outline: none; }
.status-select--มาเรียน { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
.status-select--ขาด { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
.status-select--ลา { background: #faf5ff; color: #7c3aed; border-color: #e9d5ff; }
.status-select--สาย { background: #fffbeb; color: #b45309; border-color: #fde68a; }

.note-input { padding: 3px 8px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.78rem; font-family: inherit; outline: none; width: 120px; background: #fff; }
.note-input:focus { border-color: #6366f1; }

.table-header { padding: 12px 20px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.table-header-right { display: flex; align-items: center; gap: 12px; }
.page-info-inline { font-size: 0.78rem; color: #9ca3af; white-space: nowrap; }
.page-size-wrap { display: flex; align-items: center; gap: 6px; }
.page-size-label { font-size: 0.78rem; color: #9ca3af; white-space: nowrap; }
.page-size-sel { border: 1px solid #e5e7eb; border-radius: 6px; padding: 3px 6px; font-size: 0.78rem; font-family: inherit; background: #fff; color: #374151; cursor: pointer; outline: none; }
.page-size-sel:focus { border-color: #6366f1; }
.act-btn { padding: 5px 10px; border-radius: 7px; font-size: 0.78rem; font-weight: 500; border: 1px solid; cursor: pointer; font-family: inherit; transition: background 0.1s; }
.act-btn--danger { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
.act-btn--danger:hover { background: #fee2e2; }
.pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-top: 1px solid #e8eaed; gap: 12px; flex-wrap: wrap; }
.page-info { font-size: 0.8rem; color: #9ca3af; white-space: nowrap; }
.page-btns { display: flex; align-items: center; gap: 3px; }
.page-btn { min-width: 30px; height: 30px; padding: 0 6px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; color: #374151; font-size: 0.8rem; font-family: inherit; cursor: pointer; transition: background 0.1s; font-weight: 500; }
.page-btn:hover:not(:disabled):not(.page-btn--dots) { background: #f3f4f6; }
.page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.page-btn--active { background: #111827 !important; border-color: #111827 !important; color: #fff !important; }
.page-btn--dots { border-color: transparent; background: transparent; cursor: default; color: #9ca3af; }

/* session modal */
.session-form { display: flex; flex-direction: column; gap: 16px; }
.session-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1.5fr; gap: 12px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group--wide { grid-column: span 1; }
.form-label { font-size: 0.82rem; font-weight: 500; color: #374151; }
.req { color: #ef4444; }
.form-input { padding: 7px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; background: #fff; }
.form-input:focus { border-color: #6366f1; }
.field-error { font-size: 0.72rem; color: #ef4444; }
.no-students { color: #9ca3af; font-size: 0.85rem; text-align: center; padding: 12px; }

.student-att { display: flex; flex-direction: column; gap: 8px; border: 1px solid #e8eaed; border-radius: 10px; overflow: hidden; }
.student-att-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: #f9fafb; border-bottom: 1px solid #e8eaed; }
.student-att-title { font-size: 0.85rem; font-weight: 600; color: #374151; }
.bulk-btns { display: flex; gap: 6px; }
.btn-bulk { padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; border: 1px solid; cursor: pointer; font-family: inherit; }
.btn-bulk--present { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
.btn-bulk--absent { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
.student-att-list { max-height: 300px; overflow-y: auto; }
.student-att-row { display: flex; align-items: center; gap: 10px; padding: 8px 16px; border-bottom: 1px solid #f3f4f6; }
.student-att-row:last-child { border-bottom: none; }
.att-name { flex: 1; font-size: 0.85rem; font-weight: 500; color: #111827; white-space: nowrap; min-width: 160px; }
.att-status-btns { display: flex; gap: 4px; }
.att-btn { padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; border: 1px solid #e5e7eb; background: #f9fafb; color: #6b7280; cursor: pointer; font-family: inherit; transition: all 0.1s; }
.att-btn--active.att-btn--มาเรียน { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; font-weight: 600; }
.att-btn--active.att-btn--ขาด { background: #fef2f2; color: #b91c1c; border-color: #fecaca; font-weight: 600; }
.att-btn--active.att-btn--ลา { background: #faf5ff; color: #7c3aed; border-color: #e9d5ff; font-weight: 600; }
.att-btn--active.att-btn--สาย { background: #fffbeb; color: #b45309; border-color: #fde68a; font-weight: 600; }
.att-note { flex: 1; padding: 3px 8px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.78rem; font-family: inherit; outline: none; background: #fff; max-width: 160px; }
</style>
