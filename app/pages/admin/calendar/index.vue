<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="5" :cols="7" />
    <template v-else>
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">ปฏิทินการศึกษา</h2>
          <p class="page-desc">กิจกรรม วันสอบ และวันหยุดโรงเรียน</p>
        </div>
        <button type="button" class="btn btn-primary" @click="openAdd">+ เพิ่มกิจกรรม</button>
      </div>

      <!-- Month navigator -->
      <div class="cal-toolbar">
        <button type="button" class="nav-btn" @click="prevMonth">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 10.5L5 7l3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <span class="month-label">{{ monthLabel }}</span>
        <button type="button" class="nav-btn" @click="nextMonth">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 10.5L9 7 5.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button type="button" class="btn btn-today" @click="goToday">วันนี้</button>

        <!-- Legend -->
        <div class="legend">
          <span v-for="t in eventTypes" :key="t.type" class="legend-item">
            <span class="legend-dot" :class="`dot--${t.type}`" />{{ t.label }}
          </span>
        </div>
      </div>

      <!-- Calendar grid -->
      <div class="cal-card">
        <div class="cal-weekdays">
          <div v-for="d in weekdays" :key="d" class="cal-weekday">{{ d }}</div>
        </div>
        <div class="cal-grid">
          <div
            v-for="cell in calendarCells"
            :key="cell.key"
            class="cal-cell"
            :class="{
              'cal-cell--other': cell.otherMonth,
              'cal-cell--today': cell.isToday,
              'cal-cell--weekend': cell.isWeekend,
            }"
            @click="cell.day && openAddOnDate(cell.dateStr)"
          >
            <span v-if="cell.day" class="cell-day">{{ cell.day }}</span>
            <div class="cell-events">
              <div
                v-for="ev in cell.events.slice(0, 3)"
                :key="ev.id"
                class="cell-event"
                :class="`ev--${ev.type}`"
                :title="ev.title"
                @click.stop="openDetail(ev)"
              >
                {{ ev.title }}
              </div>
              <div v-if="cell.events.length > 3" class="cell-more" @click.stop="openDayList(cell.dateStr, cell.events)">
                +{{ cell.events.length - 3 }} เพิ่มเติม
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming events list -->
      <div class="upcoming-card">
        <div class="upcoming-header">
          <span class="upcoming-title">กิจกรรมที่กำลังมาถึง</span>
        </div>
        <div class="upcoming-list">
          <div v-for="ev in upcomingEvents" :key="ev.id" class="upcoming-row">
            <div class="upcoming-dot" :class="`dot--${ev.type}`" />
            <div class="upcoming-info">
              <span class="upcoming-name">{{ ev.title }}</span>
              <span class="upcoming-date">{{ formatDate(ev.date) }}{{ ev.endDate && ev.endDate !== ev.date ? ' – ' + formatDate(ev.endDate) : '' }}</span>
            </div>
            <div v-if="canManageEvent(ev)" class="upcoming-actions">
              <button type="button" class="btn btn-sm btn-edit" @click="openEdit(ev)">แก้ไข</button>
              <button type="button" class="btn btn-sm btn-danger" @click="openDelete(ev)">ลบ</button>
            </div>
          </div>
          <div v-if="!upcomingEvents.length" class="upcoming-empty">ไม่มีกิจกรรมที่กำลังมาถึง</div>
        </div>
      </div>

      <!-- Day list modal -->
      <AdminAppModal v-model="showDayModal" :title="`กิจกรรมวันที่ ${dayModalTitle}`" size="sm">
        <template #footer>
          <button type="button" class="btn btn-ghost-sm" @click="showDayModal = false">ปิด</button>
        </template>
        <div class="day-event-list">
          <div v-for="ev in dayModalEvents" :key="ev.id" class="day-event-row" @click="showDayModal = false; openDetail(ev)">
            <span class="legend-dot" :class="`dot--${ev.type}`" />
            <span class="day-event-title">{{ ev.title }}</span>
          </div>
        </div>
      </AdminAppModal>

      <!-- Detail modal -->
      <AdminAppModal v-model="showDetail" :title="detailEvent?.title ?? ''" size="sm">
        <template #footer>
          <button type="button" class="btn btn-ghost-sm" @click="showDetail = false">ปิด</button>
          <button v-if="canManageEvent(detailEvent)" type="button" class="btn btn-primary-sm" @click="showDetail = false; openEdit(detailEvent!)">แก้ไข</button>
        </template>
        <div v-if="detailEvent" class="detail-body">
          <div class="detail-row"><span class="d-label">ประเภท</span><span class="ev-type-badge" :class="`ev-badge--${detailEvent.type}`">{{ eventTypeLabel(detailEvent.type) }}</span></div>
          <div class="detail-row"><span class="d-label">วันที่</span><span class="d-val">{{ formatDate(detailEvent.date) }}{{ detailEvent.endDate && detailEvent.endDate !== detailEvent.date ? ' – ' + formatDate(detailEvent.endDate) : '' }}</span></div>
          <div v-if="detailEvent.source === 'announcement'" class="detail-note">รายการนี้มาจากประกาศข่าว แก้ไขได้ที่หน้า "ประกาศและข่าวสาร"</div>
          <div v-if="detailEvent.description" class="detail-desc">{{ detailEvent.description }}</div>
        </div>
      </AdminAppModal>

      <!-- Add / Edit modal -->
      <AdminAppModal
        v-model="showModal"
        :title="isEditing ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรม'"
        size="sm"
        confirm-label="บันทึก"
        @confirm="saveEvent"
      >
        <div class="form-col">
          <div class="form-group">
            <label class="form-label">ชื่อกิจกรรม <span class="req">*</span></label>
            <input v-model="form.title" class="form-input" placeholder="ชื่อกิจกรรม..." />
            <span v-if="formErrors.title" class="field-error">{{ formErrors.title }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">ประเภท</label>
            <select v-model="form.type" class="form-input">
              <option v-for="t in editableEventTypes" :key="t.type" :value="t.type">{{ t.label }}</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">วันที่เริ่ม <span class="req">*</span></label>
              <input v-model="form.date" type="date" class="form-input" />
              <span v-if="formErrors.date" class="field-error">{{ formErrors.date }}</span>
            </div>
            <div class="form-group">
              <label class="form-label">วันที่สิ้นสุด</label>
              <input v-model="form.endDate" type="date" class="form-input" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">รายละเอียด</label>
            <textarea v-model="form.description" class="form-input form-textarea" placeholder="รายละเอียดเพิ่มเติม..." />
          </div>
        </div>
      </AdminAppModal>

      <!-- Delete confirm -->
      <AdminAppConfirmModal
        v-model="showConfirm"
        title="ยืนยันการลบ?"
        :description="`ต้องการลบ '${deleteTarget?.title}' ใช่หรือไม่?`"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

type BaseResponse<T> = { data: T }
type EventType = 'holiday' | 'exam' | 'activity' | 'meeting' | 'other'
type EventSource = 'calendar' | 'announcement'

type CalendarEvent = {
  id: string
  title: string
  date: string
  endDate?: string
  type: EventType
  description?: string
  source: EventSource
}

type CalendarEventApiItem = {
  id: string
  school_id: string
  created_by_member_id: string | null
  title: string
  description: string | null
  event_type: EventType
  start_date: string
  end_date: string | null
  is_active: boolean
}

type AnnouncementApiItem = {
  id: string
  title: string | null
  content: string | null
  category: string | null
  status: 'draft' | 'published' | 'expired'
  announced_at: string | null
  published_at: string | null
  expires_at: string | null
}

definePageMeta({ layout: 'admin' })
const { loading } = usePageLoad()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const { profile } = useAdminAuth()
const events = ref<CalendarEvent[]>([])

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

function mapEvent(item: CalendarEventApiItem): CalendarEvent {
  return {
    id: item.id,
    title: item.title,
    date: item.start_date,
    endDate: item.end_date || undefined,
    type: item.event_type,
    description: item.description || undefined,
    source: 'calendar',
  }
}

function mapAnnouncementToEvents(item: AnnouncementApiItem): CalendarEvent[] {
  if (item.status !== 'published') return []
  const title = (item.title || '').trim()
  if (!title) return []

  const announcementType = mapAnnouncementCategoryToEventType(item.category)

  const effectiveDate = toDateOnly(item.published_at)
  if (!effectiveDate) return []

  const endDate = toDateOnly(item.expires_at)
  return [{
    id: `ann-${item.id}`,
    title,
    date: effectiveDate,
    endDate: endDate || undefined,
    type: announcementType,
    description: item.content || undefined,
    source: 'announcement',
  }]
}

function mapAnnouncementCategoryToEventType(category: string | null): EventType {
  const normalized = (category || '').trim()
  if (normalized === 'วิชาการ') return 'exam'
  if (normalized === 'กิจกรรม') return 'activity'
  if (normalized === 'งานบุคคล') return 'meeting'
  if (normalized === 'ฉุกเฉิน') return 'holiday'
  return 'other'
}

function toDateOnly(value: string | null): string | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

async function loadEvents() {
  if (!import.meta.client || !authToken.value || !profile.value.schoolId) return
  try {
    const [calendarRes, announcementRes] = await Promise.all([
      apiFetch<BaseResponse<CalendarEventApiItem[]>>(`/school-calendar-events?school_id=${profile.value.schoolId}&only_active=true`, { headers: authHeaders() }),
      apiFetch<BaseResponse<AnnouncementApiItem[]>>(`/school-announcements?school_id=${profile.value.schoolId}&page=1&size=300&sort_by=published_at&order_by=desc`, { headers: authHeaders() }),
    ])

    const calendarItems = (Array.isArray(calendarRes.data) ? calendarRes.data : []).map(mapEvent)
    const announcementItems = (Array.isArray(announcementRes.data) ? announcementRes.data : [])
      .flatMap(mapAnnouncementToEvents)

    events.value = [...calendarItems, ...announcementItems]
  }
  catch {
    events.value = []
  }
}

if (import.meta.client) loadEvents()

const TODAY = new Date()
const viewYear = ref(TODAY.getFullYear())
const viewMonth = ref(TODAY.getMonth())

const weekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

const eventTypes = [
  { type: 'holiday' as EventType, label: 'วันหยุด' },
  { type: 'exam' as EventType, label: 'สอบ' },
  { type: 'activity' as EventType, label: 'กิจกรรม' },
  { type: 'meeting' as EventType, label: 'ประชุม' },
  { type: 'other' as EventType, label: 'อื่นๆ' },
]

const editableEventTypes = eventTypes

function eventTypeLabel(type: EventType) {
  return eventTypes.find(t => t.type === type)?.label ?? type
}

const monthLabel = computed(() => {
  const d = new Date(viewYear.value, viewMonth.value, 1)
  return d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
})

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}

function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}

function goToday() {
  viewYear.value = TODAY.getFullYear()
  viewMonth.value = TODAY.getMonth()
}

function eventsOnDate(dateStr: string) {
  return events.value.filter(ev => {
    if (!ev.endDate) return ev.date === dateStr
    return dateStr >= ev.date && dateStr <= ev.endDate
  })
}

const calendarCells = computed(() => {
  const year = viewYear.value
  const month = viewMonth.value
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: { key: string; day: number | null; dateStr: string; otherMonth: boolean; isToday: boolean; isWeekend: boolean; events: CalendarEvent[] }[] = []

  const todayStr = TODAY.toISOString().slice(0, 10)
  const prevDays = new Date(year, month, 0).getDate()
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevDays - i
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dow = new Date(prevYear, prevMonth, d).getDay()
    cells.push({ key: 'p' + dateStr, day: d, dateStr, otherMonth: true, isToday: false, isWeekend: dow === 0 || dow === 6, events: eventsOnDate(dateStr) })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dow = new Date(year, month, d).getDay()
    cells.push({ key: dateStr, day: d, dateStr, otherMonth: false, isToday: dateStr === todayStr, isWeekend: dow === 0 || dow === 6, events: eventsOnDate(dateStr) })
  }

  let nextD = 1
  while (cells.length < 42) {
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(nextD).padStart(2, '0')}`
    const dow = new Date(nextYear, nextMonth, nextD).getDay()
    cells.push({ key: 'n' + dateStr, day: nextD, dateStr, otherMonth: true, isToday: false, isWeekend: dow === 0 || dow === 6, events: eventsOnDate(dateStr) })
    nextD++
  }

  return cells
})

const upcomingEvents = computed(() => {
  const todayStr = TODAY.toISOString().slice(0, 10)
  return [...events.value]
    .filter(ev => (ev.endDate ?? ev.date) >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8)
})

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

const showDayModal = ref(false)
const dayModalTitle = ref('')
const dayModalEvents = ref<CalendarEvent[]>([])
function openDayList(dateStr: string, evs: CalendarEvent[]) {
  dayModalTitle.value = formatDate(dateStr)
  dayModalEvents.value = evs
  showDayModal.value = true
}

const showDetail = ref(false)
const detailEvent = ref<CalendarEvent | null>(null)
function openDetail(ev: CalendarEvent) {
  detailEvent.value = ev
  showDetail.value = true
}

function canManageEvent(ev: CalendarEvent | null) {
  return !!ev && ev.source === 'calendar'
}

const showModal = ref(false)
const isEditing = ref(false)
let editTarget: CalendarEvent | null = null

const emptyForm = (): CalendarEvent => ({
  id: '', title: '', date: new Date().toISOString().slice(0, 10),
  endDate: '', type: 'activity', description: '',
})
const form = ref<CalendarEvent>(emptyForm())
const formErrors = ref({ title: '', date: '' })

function validate() {
  formErrors.value = { title: '', date: '' }
  if (!form.value.title.trim()) formErrors.value.title = 'กรุณาระบุชื่อกิจกรรม'
  if (!form.value.date) formErrors.value.date = 'กรุณาเลือกวันที่'
  return !formErrors.value.title && !formErrors.value.date
}

function openAdd() {
  isEditing.value = false
  editTarget = null
  form.value = emptyForm()
  formErrors.value = { title: '', date: '' }
  showModal.value = true
}

function openAddOnDate(dateStr: string) {
  openAdd()
  form.value.date = dateStr
}

function openEdit(ev: CalendarEvent) {
  if (!canManageEvent(ev)) return
  isEditing.value = true
  editTarget = ev
  form.value = { ...ev }
  formErrors.value = { title: '', date: '' }
  showModal.value = true
}

async function saveEvent() {
  if (!validate()) return
  if (!authToken.value || !profile.value.schoolId) {
    formErrors.value.title = 'ไม่พบข้อมูลโรงเรียนสำหรับบันทึก'
    return
  }

  const payload = {
    school_id: profile.value.schoolId,
    created_by_member_id: profile.value.memberId || null,
    title: form.value.title.trim(),
    description: form.value.description?.trim() || null,
    event_type: form.value.type,
    start_date: form.value.date,
    end_date: form.value.endDate || null,
    is_active: true,
  }

  try {
    if (isEditing.value && editTarget) {
      const res = await apiFetch<BaseResponse<CalendarEventApiItem>>(`/school-calendar-events/${editTarget.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: payload,
      })
      const idx = events.value.findIndex(item => item.id === editTarget!.id)
      if (idx !== -1) events.value[idx] = mapEvent(res.data)
    }
    else {
      const res = await apiFetch<BaseResponse<CalendarEventApiItem>>('/school-calendar-events', {
        method: 'POST',
        headers: authHeaders(),
        body: payload,
      })
      events.value.push(mapEvent(res.data))
    }
    showModal.value = false
  }
  catch {
    formErrors.value.title = formErrors.value.title || 'บันทึกกิจกรรมไม่สำเร็จ'
  }
}

const showConfirm = ref(false)
const deleteTarget = ref<CalendarEvent | null>(null)
function openDelete(ev: CalendarEvent) { deleteTarget.value = ev; showConfirm.value = true }
async function confirmDelete() {
  if (!deleteTarget.value || !authToken.value) {
    showConfirm.value = false
    return
  }

  try {
    await apiFetch(`/school-calendar-events/${deleteTarget.value.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    events.value = events.value.filter(e => e.id !== deleteTarget.value!.id)
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

.cal-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.nav-btn { width: 32px; height: 32px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; color: #374151; transition: background 0.1s; }
.nav-btn:hover { background: #f3f4f6; }
.month-label { font-size: 1rem; font-weight: 700; color: #111827; min-width: 180px; text-align: center; }
.btn { display: inline-flex; align-items: center; border-radius: 8px; padding: 7px 14px; font-size: 0.85rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #111827; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn-today { font-size: 0.82rem; padding: 6px 12px; }
.btn-today:hover { background: #f3f4f6; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-primary:hover { background: #1f2937; }
.btn-sm { padding: 5px 10px; font-size: 0.78rem; }
.btn-edit { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.btn-edit:hover { background: #dbeafe; }
.btn-danger { border-color: #fecaca; background: #fff5f5; color: #dc2626; }
.btn-danger:hover { background: #fee2e2; }
.btn-ghost-sm { padding: 7px 14px; font-size: 0.85rem; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; color: #374151; cursor: pointer; font-family: inherit; }
.btn-primary-sm { padding: 7px 14px; font-size: 0.85rem; border: 1px solid #111827; border-radius: 8px; background: #111827; color: #fff; cursor: pointer; font-family: inherit; }

.legend { display: flex; gap: 12px; margin-left: auto; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 0.78rem; color: #6b7280; }
.legend-dot, .upcoming-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot--holiday { background: #f87171; }
.dot--exam { background: #fb923c; }
.dot--activity { background: #34d399; }
.dot--meeting { background: #60a5fa; }
.dot--other { background: #a78bfa; }

.cal-card { background: #fff; border: 1px solid #e8eaed; border-radius: 12px; overflow: hidden; }
.cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid #f1f3f4; }
.cal-weekday { padding: 8px 4px; text-align: center; font-size: 0.75rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
.cal-cell { min-height: 90px; border-right: 1px solid #f1f3f4; border-bottom: 1px solid #f1f3f4; padding: 6px; cursor: pointer; transition: background 0.1s; overflow: hidden; }
.cal-cell:hover { background: #fafafa; }
.cal-cell:nth-child(7n) { border-right: none; }
.cal-cell--other { background: #fafafa; }
.cal-cell--other .cell-day { color: #d1d5db; }
.cal-cell--today .cell-day { background: #111827; color: #fff; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; }
.cal-cell--weekend .cell-day { color: #ef4444; }
.cal-cell--today.cal-cell--weekend .cell-day { background: #ef4444; color: #fff; }
.cell-day { font-size: 0.82rem; font-weight: 600; color: #374151; display: block; margin-bottom: 4px; line-height: 1; }
.cell-events { display: flex; flex-direction: column; gap: 2px; }
.cell-event { font-size: 0.68rem; padding: 1px 5px; border-radius: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; font-weight: 500; transition: opacity 0.1s; }
.cell-event:hover { opacity: 0.8; }
.ev--holiday { background: #fee2e2; color: #991b1b; }
.ev--exam { background: #ffedd5; color: #9a3412; }
.ev--activity { background: #d1fae5; color: #065f46; }
.ev--meeting { background: #dbeafe; color: #1e40af; }
.ev--other { background: #ede9fe; color: #5b21b6; }
.cell-more { font-size: 0.65rem; color: #6366f1; cursor: pointer; font-weight: 500; padding-left: 4px; }

/* Upcoming */
.upcoming-card { background: #fff; border: 1px solid #e8eaed; border-radius: 12px; overflow: hidden; }
.upcoming-header { padding: 14px 20px; border-bottom: 1px solid #f1f3f4; }
.upcoming-title { font-size: 0.95rem; font-weight: 600; color: #111827; }
.upcoming-list { display: flex; flex-direction: column; }
.upcoming-row { display: flex; align-items: center; gap: 12px; padding: 10px 20px; border-bottom: 1px solid #f9fafb; }
.upcoming-row:last-child { border-bottom: none; }
.upcoming-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.upcoming-name { font-size: 0.875rem; font-weight: 500; color: #111827; }
.upcoming-date { font-size: 0.78rem; color: #6b7280; }
.upcoming-actions { display: flex; gap: 6px; flex-wrap: nowrap; }
.upcoming-empty { padding: 20px; text-align: center; color: #9ca3af; font-size: 0.85rem; }

/* Detail modal */
.detail-body { display: flex; flex-direction: column; gap: 10px; }
.detail-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 0.875rem; }
.d-label { color: #6b7280; font-size: 0.82rem; }
.d-val { font-weight: 500; color: #111827; }
.detail-desc { font-size: 0.875rem; color: #374151; background: #f9fafb; border-radius: 8px; padding: 10px 14px; line-height: 1.6; }
.ev-type-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
.ev-badge--holiday { background: #fee2e2; color: #991b1b; }
.ev-badge--exam { background: #ffedd5; color: #9a3412; }
.ev-badge--activity { background: #d1fae5; color: #065f46; }
.ev-badge--meeting { background: #dbeafe; color: #1e40af; }
.ev-badge--other { background: #ede9fe; color: #5b21b6; }
.detail-note { font-size: 0.78rem; color: #0f766e; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 8px 10px; }

/* Day modal */
.day-event-list { display: flex; flex-direction: column; gap: 8px; }
.day-event-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; cursor: pointer; transition: background 0.1s; }
.day-event-row:hover { background: #f9fafb; }
.day-event-title { font-size: 0.875rem; color: #111827; }

/* Form */
.form-col { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-label { font-size: 0.85rem; font-weight: 500; color: #374151; }
.req { color: #ef4444; }
.form-input { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; background: #fff; }
.form-input:focus { border-color: #6366f1; }
.form-textarea { min-height: 68px; resize: vertical; }
.field-error { font-size: 0.75rem; color: #ef4444; }
</style>
