<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="6" :cols="6" />
    <template v-else>
      <div class="page-header">
        <div>
          <h2 class="page-title">ประกาศและข่าวสาร</h2>
          <p class="page-desc">จัดการประกาศและข่าวสารโรงเรียน</p>
        </div>
        <button type="button" class="btn btn-primary" @click="openAdd">+ เพิ่มประกาศ</button>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="search-wrap">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="#9ca3af" stroke-width="1.4"/>
            <path d="M10 10l3 3" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          <input v-model="search" class="search-input" placeholder="ค้นหาชื่อประกาศ…" autocomplete="off" />
        </div>
        <select v-model="filterCategory" class="filter-select">
          <option value="">ทุกหมวดหมู่</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="filterTarget" class="filter-select">
          <option value="">ทุกกลุ่มเป้าหมาย</option>
          <option v-for="t in targets" :key="t" :value="t">{{ t }}</option>
        </select>
        <select v-model="filterStatus" class="filter-select">
          <option value="">ทุกสถานะ</option>
          <option value="เผยแพร่">เผยแพร่</option>
          <option value="ฉบับร่าง">ฉบับร่าง</option>
          <option value="หมดอายุ">หมดอายุ</option>
        </select>
        <button v-if="search || filterCategory || filterTarget || filterStatus" type="button" class="btn btn-clear" @click="clearFilters">ล้างตัวกรอง</button>
      </div>

      <!-- Table -->
      <AdminDataTable title="รายการประกาศ" :columns="cols" :rows="filteredRows">
        <template #cell-publishedAt="{ value }">
          {{ formatDateTH(value as string) }}
        </template>
        <template #cell-announcedAt="{ value }">
          {{ formatDateTH(value as string) }}
        </template>
        <template #cell-expiresAt="{ value }">
          {{ formatDateTH(value as string) }}
        </template>
        <template #cell-isPinned="{ value }">
          <span v-if="value" class="pin-badge">📌 ปักหมุด</span>
          <span v-else class="no-pin">—</span>
        </template>
        <template #cell-status="{ value }">
          <span class="status-badge" :class="`status--${value}`">{{ value }}</span>
        </template>
        <template #cell-category="{ value }">
          <span class="cat-badge" :class="`cat--${value}`">{{ value }}</span>
        </template>
        <template #rowActions="{ row }">
          <div class="action-btns">
            <button type="button" class="btn btn-sm btn-detail" @click="openDetail(row as AnnouncementRow)">ดู</button>
            <button type="button" class="btn btn-sm btn-edit" @click="openEdit(row as AnnouncementRow)">แก้ไข</button>
            <button type="button" class="btn btn-sm btn-danger" @click="openDelete(row as AnnouncementRow)">ลบ</button>
          </div>
        </template>
      </AdminDataTable>

      <!-- Detail Modal -->
      <AdminAppModal v-model="showDetail" :title="detailTarget?.title ?? ''" size="md">
        <template #footer>
          <button type="button" class="btn btn-ghost-sm" @click="showDetail = false">ปิด</button>
          <button type="button" class="btn btn-primary-sm" @click="showDetail = false; openEdit(detailTarget!)">แก้ไข</button>
        </template>
        <div v-if="detailTarget" class="detail-body">
          <div class="detail-meta">
            <span class="cat-badge" :class="`cat--${detailTarget.category}`">{{ detailTarget.category }}</span>
            <span class="status-badge" :class="`status--${detailTarget.status}`">{{ detailTarget.status }}</span>
            <span v-if="detailTarget.isPinned" class="pin-badge">📌 ปักหมุด</span>
          </div>
          <div class="detail-info">
            <div class="detail-row"><span class="d-label">กลุ่มเป้าหมาย</span><span class="d-val">{{ detailTarget.target }}</span></div>
            <div class="detail-row"><span class="d-label">ผู้ประกาศ</span><span class="d-val">{{ detailTarget.createdBy }}</span></div>
            <div class="detail-row"><span class="d-label">วันที่ประกาศ</span><span class="d-val">{{ formatDateTH(detailTarget.announcedAt) }}</span></div>
            <div class="detail-row"><span class="d-label">วันที่เผยแพร่</span><span class="d-val">{{ formatDateTH(detailTarget.publishedAt) }}</span></div>
            <div class="detail-row"><span class="d-label">วันหมดอายุ</span><span class="d-val">{{ formatDateTH(detailTarget.expiresAt) }}</span></div>
          </div>
          <div class="detail-content">{{ detailTarget.content }}</div>
        </div>
      </AdminAppModal>

      <!-- Add / Edit Modal -->
      <AdminAppModal
        v-model="showModal"
        :title="isEditing ? 'แก้ไขประกาศ' : 'เพิ่มประกาศใหม่'"
        size="lg"
        confirm-label="บันทึก"
        @confirm="saveRow"
      >
        <div class="form-grid">
          <div class="form-group form-group--full">
            <label class="form-label">หัวข้อประกาศ <span class="req">*</span></label>
            <input v-model="form.title" class="form-input" placeholder="ชื่อประกาศ..." />
            <span v-if="formErrors.title" class="field-error">{{ formErrors.title }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">หมวดหมู่</label>
            <select v-model="form.category" class="form-input">
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">กลุ่มเป้าหมาย</label>
            <select v-model="form.target" class="form-input">
              <option v-for="t in targets" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">วันที่ประกาศ</label>
            <input v-model="form.announcedAt" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">วันที่เผยแพร่</label>
            <input v-model="form.publishedAt" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">วันหมดอายุ</label>
            <input v-model="form.expiresAt" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">สถานะ</label>
            <select v-model="form.status" class="form-input">
              <option value="เผยแพร่">เผยแพร่</option>
              <option value="ฉบับร่าง">ฉบับร่าง</option>
              <option value="หมดอายุ">หมดอายุ</option>
            </select>
          </div>
          <div class="form-group form-check-group">
            <label class="checkbox-item">
              <input v-model="form.isPinned" type="checkbox" />
              <span>ปักหมุดประกาศนี้</span>
            </label>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">เนื้อหาประกาศ <span class="req">*</span></label>
            <textarea v-model="form.content" class="form-input form-textarea" rows="5" placeholder="รายละเอียดประกาศ..." />
            <span v-if="formErrors.content" class="field-error">{{ formErrors.content }}</span>
          </div>
        </div>
      </AdminAppModal>

      <!-- Delete Confirm -->
      <AdminAppConfirmModal
        v-model="showConfirm"
        title="ยืนยันการลบ?"
        :description="`ต้องการลบประกาศ '${deleteTarget?.title}' ใช่หรือไม่?`"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

type BaseResponse<T> = { data: T }

type AnnouncementCategory = 'ทั่วไป' | 'วิชาการ' | 'กิจกรรม' | 'งานบุคคล' | 'ฉุกเฉิน'
type AnnouncementTarget = 'ทุกคน' | 'ครู' | 'นักเรียน' | 'ผู้ปกครอง'
type AnnouncementStatus = 'เผยแพร่' | 'ฉบับร่าง' | 'หมดอายุ'

type AnnouncementRow = {
  id: string
  title: string
  content: string
  category: AnnouncementCategory
  target: AnnouncementTarget
  announcedAt: string
  publishedAt: string
  expiresAt: string
  isPinned: boolean
  status: AnnouncementStatus
  createdBy: string
}

type AnnouncementApiItem = {
  id: string
  school_id: string
  author_member_id: string
  title: string | null
  content: string | null
  category: string | null
  status: 'draft' | 'published' | 'expired'
  announced_at: string | null
  published_at: string | null
  expires_at: string | null
  created_by_name: string | null
  target_role: 'teacher' | 'student' | 'parent' | 'admin' | 'staff' | null
  is_pinned: boolean
}

definePageMeta({ layout: 'admin' })
const { loading } = usePageLoad()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const { profile } = useAdminAuth()
const rows = ref<AnnouncementRow[]>([])

const announcerDisplayName = computed(() => {
  const first = (profile.value.firstName || '').trim()
  const last = (profile.value.lastName || '').trim()
  const fullName = `${first} ${last}`.trim()
  if (fullName) return fullName
  if (profile.value.email) return profile.value.email
  if (profile.value.memberCode) return profile.value.memberCode
  if (profile.value.memberId) return profile.value.memberId.slice(0, 8)
  return 'ผู้ใช้งานระบบ'
})

const targetToApi: Record<AnnouncementTarget, AnnouncementApiItem['target_role']> = {
  'ทุกคน': null,
  ครู: 'teacher',
  นักเรียน: 'student',
  ผู้ปกครอง: 'parent',
}

const statusToApi: Record<AnnouncementStatus, AnnouncementApiItem['status']> = {
  'ฉบับร่าง': 'draft',
  เผยแพร่: 'published',
  หมดอายุ: 'expired',
}

function toTargetLabel(target: AnnouncementApiItem['target_role']): AnnouncementTarget {
  if (target === 'teacher') return 'ครู'
  if (target === 'student') return 'นักเรียน'
  if (target === 'parent') return 'ผู้ปกครอง'
  return 'ทุกคน'
}

function toStatusLabel(status: AnnouncementApiItem['status']): AnnouncementStatus {
  if (status === 'draft') return 'ฉบับร่าง'
  if (status === 'expired') return 'หมดอายุ'
  return 'เผยแพร่'
}

function formatDateTH(value: string) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
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

function mapRow(item: AnnouncementApiItem): AnnouncementRow {
  const category = (item.category || 'ทั่วไป') as AnnouncementCategory
  return {
    id: item.id,
    title: (item.title || '').trim(),
    content: (item.content || '').trim(),
    category: categories.includes(category) ? category : 'ทั่วไป',
    target: toTargetLabel(item.target_role),
    announcedAt: item.announced_at || '',
    publishedAt: item.published_at || '',
    expiresAt: item.expires_at || '',
    isPinned: item.is_pinned,
    status: toStatusLabel(item.status),
    createdBy: (item.created_by_name || '').trim(),
  }
}

async function loadRows() {
  if (!import.meta.client || !authToken.value || !profile.value.schoolId) return
  try {
    const res = await apiFetch<BaseResponse<AnnouncementApiItem[]>>(`/school-announcements?school_id=${profile.value.schoolId}&page=1&size=300&sort_by=created_at&order_by=desc`, { headers: authHeaders() })
    rows.value = (Array.isArray(res.data) ? res.data : []).map(mapRow)
  }
  catch {
    rows.value = []
  }
}

if (import.meta.client) loadRows()

const categories: AnnouncementCategory[] = ['ทั่วไป', 'วิชาการ', 'กิจกรรม', 'งานบุคคล', 'ฉุกเฉิน']
const targets: AnnouncementTarget[] = ['ทุกคน', 'ครู', 'นักเรียน', 'ผู้ปกครอง']

const cols = [
  { key: 'title', label: 'หัวข้อ' },
  { key: 'category', label: 'หมวดหมู่' },
  { key: 'target', label: 'กลุ่มเป้าหมาย' },
  { key: 'announcedAt', label: 'วันที่ประกาศ' },
  { key: 'publishedAt', label: 'วันที่เผยแพร่' },
  { key: 'expiresAt', label: 'วันหมดอายุ' },
  { key: 'isPinned', label: 'ปักหมุด' },
  { key: 'status', label: 'สถานะ' },
]

const search = ref('')
const filterCategory = ref('')
const filterTarget = ref('')
const filterStatus = ref('')

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter(r => {
    if (q && !r.title.toLowerCase().includes(q)) return false
    if (filterCategory.value && r.category !== filterCategory.value) return false
    if (filterTarget.value && r.target !== filterTarget.value) return false
    if (filterStatus.value && r.status !== filterStatus.value) return false
    return true
  })
})

function clearFilters() {
  search.value = ''
  filterCategory.value = ''
  filterTarget.value = ''
  filterStatus.value = ''
}

// ── Detail ──
const showDetail = ref(false)
const detailTarget = ref<AnnouncementRow | null>(null)
function openDetail(row: AnnouncementRow) {
  detailTarget.value = row
  showDetail.value = true
}

// ── Add / Edit ──
const showModal = ref(false)
const isEditing = ref(false)
let editTarget: AnnouncementRow | null = null

const emptyForm = (): AnnouncementRow => ({
  id: '', title: '', content: '', category: 'ทั่วไป', target: 'ทุกคน',
  announcedAt: new Date().toISOString().slice(0, 10),
  publishedAt: new Date().toISOString().slice(0, 10), expiresAt: '',
  isPinned: false, status: 'เผยแพร่', createdBy: announcerDisplayName.value,
})
const form = ref<AnnouncementRow>(emptyForm())
const formErrors = ref({ title: '', content: '' })

function validate() {
  formErrors.value = { title: '', content: '' }
  if (!form.value.title.trim()) formErrors.value.title = 'กรุณาระบุหัวข้อประกาศ'
  if (!form.value.content.trim()) formErrors.value.content = 'กรุณาระบุเนื้อหาประกาศ'
  return !formErrors.value.title && !formErrors.value.content
}

function openAdd() {
  isEditing.value = false
  editTarget = null
  form.value = emptyForm()
  formErrors.value = { title: '', content: '' }
  showModal.value = true
}

function openEdit(row: AnnouncementRow) {
  isEditing.value = true
  editTarget = row
  form.value = { ...row, createdBy: announcerDisplayName.value }
  formErrors.value = { title: '', content: '' }
  showModal.value = true
}

async function saveRow() {
  if (!validate()) return

  if (!authToken.value || !profile.value.schoolId || !profile.value.memberId) {
    formErrors.value.title = 'ไม่พบข้อมูลผู้ใช้สำหรับบันทึกประกาศ'
    return
  }

  const payload = {
    school_id: profile.value.schoolId,
    author_member_id: profile.value.memberId,
    title: form.value.title.trim() || null,
    content: form.value.content.trim() || null,
    category: form.value.category,
    status: statusToApi[form.value.status],
    announced_at: form.value.announcedAt || null,
    published_at: form.value.publishedAt || null,
    expires_at: form.value.expiresAt || null,
    created_by_name: announcerDisplayName.value,
    target_role: targetToApi[form.value.target],
    is_pinned: form.value.isPinned,
  }

  try {
    if (isEditing.value && editTarget) {
      const res = await apiFetch<BaseResponse<AnnouncementApiItem>>(`/school-announcements/${editTarget.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: payload,
      })
      const idx = rows.value.findIndex(item => item.id === editTarget!.id)
      if (idx !== -1) rows.value[idx] = mapRow(res.data)
    }
    else {
      const res = await apiFetch<BaseResponse<AnnouncementApiItem>>('/school-announcements', {
        method: 'POST',
        headers: authHeaders(),
        body: payload,
      })
      rows.value.unshift(mapRow(res.data))
    }
    showModal.value = false
  }
  catch {
    formErrors.value.title = formErrors.value.title || 'บันทึกประกาศไม่สำเร็จ'
  }
}

// ── Delete ──
const showConfirm = ref(false)
const deleteTarget = ref<AnnouncementRow | null>(null)

function openDelete(row: AnnouncementRow) {
  deleteTarget.value = row
  showConfirm.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value || !authToken.value) {
    showConfirm.value = false
    return
  }

  try {
    await apiFetch(`/school-announcements/${deleteTarget.value.id}`, {
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
.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-wrap { position: relative; flex: 1; min-width: 200px; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.search-input { width: 100%; padding: 8px 12px 8px 32px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; box-sizing: border-box; background: #fff; }
.search-input:focus { border-color: #6366f1; }
.filter-select { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; background: #fff; cursor: pointer; }
.action-btns { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: nowrap; }
.btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 8px 14px; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #111827; cursor: pointer; font-family: inherit; transition: background 0.12s; }
.btn-primary { background: #111827; color: #fff; border-color: #111827; }
.btn-primary:hover { background: #1f2937; }
.btn-sm { padding: 5px 10px; font-size: 0.78rem; }
.btn-detail { border-color: #e5e7eb; background: #fff; color: #374151; }
.btn-detail:hover { background: #f9fafb; }
.btn-edit { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.btn-edit:hover { background: #dbeafe; }
.btn-danger { border-color: #fecaca; background: #fff5f5; color: #dc2626; }
.btn-danger:hover { background: #fee2e2; }
.btn-clear { border: 1px solid #e5e7eb; background: #fff; color: #6b7280; font-size: 0.8rem; padding: 7px 12px; border-radius: 8px; font-family: inherit; cursor: pointer; }
.btn-clear:hover { background: #f9fafb; }
.btn-ghost-sm { padding: 7px 14px; font-size: 0.85rem; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; color: #374151; cursor: pointer; font-family: inherit; }
.btn-primary-sm { padding: 7px 14px; font-size: 0.85rem; border: 1px solid #111827; border-radius: 8px; background: #111827; color: #fff; cursor: pointer; font-family: inherit; }

.pin-badge { font-size: 0.75rem; font-weight: 600; color: #92400e; background: #fef3c7; border-radius: 6px; padding: 2px 7px; }
.no-pin { color: #d1d5db; }

.status-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 500; }
.status--เผยแพร่ { background: #d1fae5; color: #065f46; }
.status--ฉบับร่าง { background: #f3f4f6; color: #6b7280; }
.status--หมดอายุ { background: #fee2e2; color: #991b1b; }

.cat-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 500; }
.cat--ทั่วไป { background: #e0e7ff; color: #3730a3; }
.cat--วิชาการ { background: #dbeafe; color: #1e40af; }
.cat--กิจกรรม { background: #d1fae5; color: #065f46; }
.cat--งานบุคคล { background: #fce7f3; color: #9d174d; }
.cat--ฉุกเฉิน { background: #fee2e2; color: #991b1b; }

/* Detail modal */
.detail-body { display: flex; flex-direction: column; gap: 14px; }
.detail-meta { display: flex; gap: 6px; flex-wrap: wrap; }
.detail-info { display: flex; flex-direction: column; gap: 6px; background: #f9fafb; border-radius: 8px; padding: 12px 16px; }
.detail-row { display: flex; justify-content: space-between; font-size: 0.85rem; }
.d-label { color: #6b7280; }
.d-val { font-weight: 500; color: #111827; }
.detail-content { font-size: 0.875rem; color: #374151; line-height: 1.7; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; white-space: pre-wrap; }

/* Form */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group--full { grid-column: 1 / -1; }
.form-check-group { justify-content: flex-end; }
.form-label { font-size: 0.85rem; font-weight: 500; color: #374151; }
.req { color: #ef4444; }
.form-input { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; font-family: inherit; outline: none; background: #fff; }
.form-input:focus { border-color: #6366f1; }
.form-textarea { min-height: 110px; resize: vertical; }
.field-error { font-size: 0.75rem; color: #ef4444; }
.checkbox-item { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: #374151; cursor: pointer; padding: 8px 0; }
</style>
