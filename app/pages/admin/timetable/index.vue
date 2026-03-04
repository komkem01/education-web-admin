<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="9" :cols="6" />
    <template v-else>
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">ตารางสอน</h2>
          <p class="page-desc">จัดการตารางสอนรายห้องเรียน ปีการศึกษา {{ filterYear }} เทอม {{ filterSemester }}</p>
        </div>
        <button type="button" class="btn btn-primary" @click="openAdd()">+ เพิ่มคาบเรียน</button>
      </div>

      <!-- Selectors -->
      <div class="filter-bar">
        <select v-model="filterClassroom" class="filter-select filter-select--wide">
          <option v-for="c in classroomOptions" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="filterSemester" class="filter-select">
          <option value="1">เทอม 1</option>
          <option value="2">เทอม 2</option>
        </select>
        <select v-model="filterYear" class="filter-select">
          <option value="2568">2568</option>
          <option value="2567">2567</option>
        </select>
        <span class="slot-count">{{ classroomSlots.length }} คาบ</span>
      </div>

      <!-- Timetable Grid -->
      <div class="timetable-wrap">
        <table class="timetable">
          <thead>
            <tr>
              <th class="th-period">คาบ</th>
              <th class="th-time">เวลา</th>
              <th v-for="day in DAYS" :key="day" class="th-day">{{ day }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(period, pi) in PERIODS" :key="period.num">
              <!-- Lunch break separator between period 4 and 5 -->
              <tr v-if="pi === 4" class="lunch-row">
                <td colspan="7" class="lunch-cell">🍽 พักกลางวัน 11:20 – 12:00</td>
              </tr>
              <tr class="td-row">
                <td class="td-period">{{ period.num }}</td>
                <td class="td-time">{{ period.start }}<br><span class="time-end">{{ period.end }}</span></td>
                <td
                  v-for="day in DAYS"
                  :key="day"
                  class="td-slot"
                  :class="{ 'td-slot--empty': !getSlot(day, period.num) }"
                  @click="getSlot(day, period.num) ? openEdit(getSlot(day, period.num)!) : openAdd(day, period.num)"
                >
                  <template v-if="getSlot(day, period.num)">
                    <div class="slot-card" :style="{ borderLeftColor: subjectColor(getSlot(day, period.num)!.courseCode) }">
                      <span class="slot-course">{{ getSlot(day, period.num)!.courseName }}</span>
                      <span class="slot-teacher">{{ getSlot(day, period.num)!.teacherName }}</span>
                      <span class="slot-room">ห้อง {{ getSlot(day, period.num)!.room }}</span>
                    </div>
                  </template>
                  <template v-else>
                    <span class="slot-empty">+ เพิ่ม</span>
                  </template>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Add / Edit slot modal -->
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
              <option v-for="p in PERIODS" :key="p.num" :value="p.num">คาบ {{ p.num }} ({{ p.start }}–{{ p.end }})</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">รายวิชา <span class="req">*</span></label>
            <select v-model="form.courseCode" class="form-input" @change="onCourseChange">
              <option value="">-- เลือกวิชา --</option>
              <option v-for="c in courseRows" :key="c.code" :value="c.code">{{ c.code }} – {{ c.name }}</option>
            </select>
            <span v-if="formErrors.courseCode" class="field-error">{{ formErrors.courseCode }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">ครูผู้สอน</label>
            <input v-model="form.teacherName" class="form-input" placeholder="ชื่อครู" />
          </div>
          <div class="form-group">
            <label class="form-label">ห้อง/สถานที่</label>
            <input v-model="form.room" class="form-input" placeholder="เช่น 101, วิทย์ 1, สนาม" />
          </div>
        </div>
      </AdminAppModal>

      <!-- Delete slot -->
      <AdminAppConfirmModal
        v-model="showConfirm"
        title="ลบคาบเรียนนี้?"
        :description="`${editSlot?.courseName} — ${editSlot?.day} คาบ ${editSlot?.period}`"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTimetableData, DAYS, PERIODS, type TimetableSlot, type DayName } from '~/composables/useTimetableData'
import { useCoursesData } from '~/composables/useCoursesData'
import { useClassroomsData } from '~/composables/useClassroomsData'

definePageMeta({ layout: 'admin' })

const { loading } = usePageLoad()
const { slots } = useTimetableData()
const { rows: courseRows } = useCoursesData()
const { rows: classroomRows } = useClassroomsData()

const classroomOptions = computed(() => classroomRows.value.map(r => r.name))
const filterClassroom = ref('ม.1/1')
const filterSemester = ref('1')
const filterYear = ref('2568')

const classroomSlots = computed(() =>
  slots.value.filter(s => s.classroom === filterClassroom.value),
)

function getSlot(day: DayName, period: number): TimetableSlot | undefined {
  return classroomSlots.value.find(s => s.day === day && s.period === period)
}

// Color per subject code prefix
const colorMap: Record<string, string> = {
  M: '#6366f1', T: '#f59e0b', S: '#10b981', L: '#0ea5e9', P: '#ef4444', SO: '#8b5cf6', A: '#ec4899', W: '#f97316',
}
function subjectColor(code: string): string {
  const prefix = code.replace(/[0-9]/g, '')
  return colorMap[prefix] ?? '#9ca3af'
}

// ── Add / Edit ──
const showModal = ref(false)
const editSlot = ref<TimetableSlot | null>(null)

const emptyForm = (day?: DayName, period?: number): Omit<TimetableSlot, 'id'> => ({
  classroom: filterClassroom.value,
  day: day ?? 'จันทร์',
  period: period ?? 1,
  courseCode: '',
  courseName: '',
  teacherName: '',
  room: '',
})
const form = ref(emptyForm())
const formErrors = ref({ courseCode: '' })

function onCourseChange() {
  const found = courseRows.value.find(c => c.code === form.value.courseCode)
  if (found) {
    form.value.courseName = found.name
    form.value.teacherName = found.teacherName
  }
}

function openAdd(day?: DayName, period?: number) {
  editSlot.value = null
  form.value = emptyForm(day, period)
  formErrors.value = { courseCode: '' }
  showModal.value = true
}

function openEdit(slot: TimetableSlot) {
  editSlot.value = slot
  form.value = { ...slot }
  formErrors.value = { courseCode: '' }
  showModal.value = true
}

function saveSlot() {
  if (!form.value.courseCode) { formErrors.value.courseCode = 'กรุณาเลือกวิชา'; return }
  // Check conflict
  const conflict = slots.value.find(s =>
    s.classroom === filterClassroom.value
    && s.day === form.value.day
    && s.period === form.value.period
    && (!editSlot.value || s.id !== editSlot.value.id),
  )
  if (conflict) { formErrors.value.courseCode = `คาบนี้มีวิชา '${conflict.courseName}' อยู่แล้ว`; return }

  if (editSlot.value) {
    const idx = slots.value.findIndex(s => s.id === editSlot.value!.id)
    if (idx !== -1) slots.value[idx] = { ...editSlot.value, ...form.value }
  }
  else {
    slots.value.push({ id: Date.now(), ...form.value, classroom: filterClassroom.value })
  }
  showModal.value = false
}

// ── Delete ──
const showConfirm = ref(false)

function confirmDelete() {
  if (editSlot.value) {
    slots.value = slots.value.filter(s => s.id !== editSlot.value!.id)
    editSlot.value = null
  }
  showConfirm.value = false
  showModal.value = false
}
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

/* Grid */
.timetable-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #e8eaed; }
.timetable { width: 100%; border-collapse: collapse; background: #fff; min-width: 700px; }

thead tr { background: #111827; }
.th-period, .th-time { color: #9ca3af; font-size: 0.75rem; font-weight: 600; padding: 10px 12px; text-align: center; white-space: nowrap; }
.th-day { color: #fff; font-size: 0.82rem; font-weight: 600; padding: 10px 16px; text-align: center; min-width: 130px; }

.td-row:hover { background: #f9fafb; }
.td-period { text-align: center; font-size: 0.8rem; font-weight: 700; color: #6b7280; padding: 6px 10px; background: #f9fafb; border-right: 1px solid #e8eaed; white-space: nowrap; }
.td-time { text-align: center; font-size: 0.72rem; color: #9ca3af; padding: 6px 10px; background: #f9fafb; border-right: 1px solid #e8eaed; white-space: nowrap; }
.time-end { color: #c4c8cc; }
.td-slot { padding: 6px 8px; border: 1px solid #f0f1f3; vertical-align: top; cursor: pointer; min-height: 64px; transition: background 0.12s; }
.td-slot:hover { background: #f0f4ff; }
.td-slot--empty:hover { background: #f9fbff; }

.slot-card { border-left: 3px solid #6366f1; background: #f8f9ff; border-radius: 6px; padding: 6px 8px; display: flex; flex-direction: column; gap: 2px; }
.slot-course { font-size: 0.8rem; font-weight: 600; color: #111827; line-height: 1.2; }
.slot-teacher { font-size: 0.72rem; color: #6b7280; }
.slot-room { font-size: 0.7rem; color: #9ca3af; }
.slot-empty { display: flex; align-items: center; justify-content: center; height: 52px; color: #d1d5db; font-size: 0.78rem; }

.lunch-row .lunch-cell { text-align: center; font-size: 0.78rem; color: #9ca3af; background: #fffbeb; border-top: 1px dashed #fde68a; border-bottom: 1px dashed #fde68a; padding: 6px; }

.btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #111827; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-primary:hover { background: #1f2937; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group--full { grid-column: 1 / -1; }
.form-label { font-size: 0.85rem; font-weight: 500; color: #374151; }
.req { color: #ef4444; }
.form-input { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; transition: border-color 0.15s; background: #fff; }
.form-input:focus { border-color: #6366f1; }
.field-error { font-size: 0.75rem; color: #ef4444; }
</style>
