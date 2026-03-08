<template>
  <div class="page">
    <AdminAppSkeletonLoader v-if="loading" :rows="5" :cols="7" />
    <template v-else>
      <div class="page-header">
        <div>
          <h2 class="page-title">คิวคำขออนุมัติ</h2>
          <p class="page-desc">คำขอแก้ไขข้อมูลโปรไฟล์จากครูที่รอการพิจารณา</p>
        </div>
        <div class="header-actions">
          <span class="total-badge">รออนุมัติ {{ pendingCount }} รายการ</span>
        </div>
      </div>

      <div class="summary-strip">
        <div v-for="s in summary" :key="s.label" class="summary-item">
          <span class="s-value" :style="s.color ? `color:${s.color}` : ''">{{ s.value }}</span>
          <span class="s-label">{{ s.label }}</span>
        </div>
      </div>

      <div class="toolbar">
        <div class="search-wrap">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="#9ca3af" stroke-width="1.4"/><path d="M10 10l3 3" stroke="#9ca3af" stroke-width="1.4" stroke-linecap="round"/></svg>
          <input v-model="search" class="input search" type="text" placeholder="ค้นหาผู้ยื่นคำขอหรือรายละเอียด..." autocomplete="off" />
        </div>
        <div class="tab-row">
          <button v-for="tab in tabs" :key="tab.key" type="button" class="tab" :class="{ 'tab--active': activeTab === tab.key }" @click="activeTab = tab.key">
            {{ tab.label }}
            <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
          </button>
        </div>
      </div>

      <AdminDataTable :columns="cols" :rows="pagedRows">
        <template #cell-type="{ value }">
          <span class="type-cell">{{ value }}</span>
        </template>

        <template #cell-status="{ value }">
          <AdminStatusBadge :label="value as string" :variant="value === 'รออนุมัติ' ? 'pending' : value === 'อนุมัติแล้ว' ? 'approved' : 'rejected'" />
        </template>

        <template #rowActions="{ row }">
          <div class="action-btns">
            <button v-if="(row as ApprovalRow).status === 'รออนุมัติ'" type="button" class="btn-action btn-edit" @click="openApproveConfirm(row as ApprovalRow)">อนุมัติ</button>
            <button v-if="(row as ApprovalRow).status === 'รออนุมัติ'" type="button" class="btn-action btn-delete" @click="openReject(row as ApprovalRow)">ปฏิเสธ</button>
            <button type="button" class="btn-action btn-detail" @click="openDetail(row as ApprovalRow)">รายละเอียด</button>
          </div>
        </template>
      </AdminDataTable>

      <div class="pagination">
        <span class="page-info">{{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filteredRows.length) }} จาก {{ filteredRows.length }} รายการ</span>
        <div class="page-btns">
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage = 1">«</button>
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">‹</button>
          <button
            v-for="p in pageNumbers"
            :key="p"
            class="page-btn"
            :class="{ 'page-btn--active': p === currentPage, 'page-btn--ellipsis': p === '...' }"
            :disabled="p === '...'"
            @click="typeof p === 'number' && (currentPage = p)"
          >
            {{ p }}
          </button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">›</button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages">»</button>
        </div>
        <select v-model="pageSize" class="input page-size-select">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>
      </div>

      <AdminAppConfirmModal
        v-model="showApproveModal"
        title="ยืนยันการอนุมัติ?"
        :description="`ต้องการอนุมัติคำขอของ ${approveTarget?.requester} ใช่หรือไม่?`"
        confirm-label="ยืนยันอนุมัติ"
        @confirm="confirmApprove"
      />

      <AdminAppModal
        v-model="showRejectModal"
        title="ระบุเหตุผลการปฏิเสธ"
        size="sm"
        confirm-label="ยืนยันปฏิเสธ"
        @confirm="confirmReject"
      >
        <div class="field">
          <span>เหตุผล / หมายเหตุ <span class="req">*</span></span>
          <textarea v-model="rejectNote" class="input form-textarea" placeholder="ระบุเหตุผลสำหรับผู้ยื่นคำขอ..." />
          <span v-if="rejectNoteError" class="field-error">{{ rejectNoteError }}</span>
        </div>
      </AdminAppModal>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

definePageMeta({ layout: 'admin' })

type BaseResponse<T> = { data: T }

type ReportsApprovalApiItem = {
  id: string
  type: string
  requester_name: string
  requester_role: string
  title: string
  detail: string
  status: 'pending' | 'approved' | 'rejected'
  comment: string | null
  created_at: string
}

type ApprovalRow = {
  id: string
  typeKey: string
  type: string
  requester: string
  role: string
  detail: string
  date: string
  status: 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ปฏิเสธ'
  note?: string
  raw: ReportsApprovalApiItem
}

const { loading } = usePageLoad()
const config = useRuntimeConfig()
const authToken = useCookie<string | null>('edu_auth_token')
const rows = ref<ApprovalRow[]>([])

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

function toThaiStatus(status: string): ApprovalRow['status'] {
  if (status === 'approved') return 'อนุมัติแล้ว'
  if (status === 'rejected') return 'ปฏิเสธ'
  return 'รออนุมัติ'
}

function toThaiRole(role: string) {
  const map: Record<string, string> = {
    admin: 'แอดมิน',
    staff: 'บุคลากร',
    teacher: 'ครู',
    student: 'นักเรียน',
    parent: 'ผู้ปกครอง',
  }
  return map[role] || role
}

function toDateText(value: string) {
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('th-TH')
}

async function loadRows() {
  if (!import.meta.client || !authToken.value) return
  try {
    const res = await apiFetch<BaseResponse<{ items: ReportsApprovalApiItem[] }>>('/reports/approvals', { headers: authHeaders() })
    rows.value = (res.data?.items || []).map(item => ({
      id: item.id,
      typeKey: item.type,
      type: item.title,
      requester: item.requester_name,
      role: toThaiRole(item.requester_role),
      detail: item.detail,
      date: toDateText(item.created_at),
      status: toThaiStatus(item.status),
      note: item.comment || undefined,
      raw: item,
    }))
  }
  catch {
    rows.value = []
  }
}

if (import.meta.client) {
  loadRows()
}

const pendingCount = computed(() => rows.value.filter(r => r.status === 'รออนุมัติ').length)
const approvedCount = computed(() => rows.value.filter(r => r.status === 'อนุมัติแล้ว').length)
const rejectedCount = computed(() => rows.value.filter(r => r.status === 'ปฏิเสธ').length)

const summary = computed(() => [
  { value: pendingCount.value, label: 'รออนุมัติ', color: '#d97706' },
  { value: approvedCount.value, label: 'อนุมัติแล้ว', color: '#15803d' },
  { value: rejectedCount.value, label: 'ปฏิเสธ', color: '#b91c1c' },
  { value: rows.value.length, label: 'ทั้งหมด', color: '' },
])

const TAB_KEYS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รออนุมัติ' },
  { key: 'approved', label: 'อนุมัติแล้ว' },
  { key: 'rejected', label: 'ปฏิเสธ' },
]
const activeTab = ref('all')
const tabs = computed(() =>
  TAB_KEYS.map(tab => ({
    ...tab,
    count: tab.key === 'all' ? 0 : rows.value.filter(item => item.raw.status === tab.key).length,
  })),
)

const cols = [
  { key: 'id', label: '#' },
  { key: 'type', label: 'ประเภทคำขอ' },
  { key: 'requester', label: 'ผู้ยื่นคำขอ' },
  { key: 'role', label: 'บทบาท' },
  { key: 'detail', label: 'รายละเอียด' },
  { key: 'date', label: 'วันที่' },
  { key: 'status', label: 'สถานะ' },
]

const search = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
watch([search, activeTab], () => { currentPage.value = 1 })
watch(pageSize, () => { currentPage.value = 1 })

const filteredRows = computed(() => {
  let base = rows.value
  if (activeTab.value !== 'all') {
    base = base.filter(item => item.raw.status === activeTab.value)
  }
  if (search.value.trim()) {
    const query = search.value.toLowerCase().trim()
    base = base.filter(item =>
      item.requester.toLowerCase().includes(query)
      || item.type.toLowerCase().includes(query)
      || item.detail.toLowerCase().includes(query),
    )
  }
  return base
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)))
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})
const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | string)[] = [1]
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

function openDetail(row: ApprovalRow) {
  navigateTo(`/admin/approvals/${encodeURIComponent(row.id)}?type=${encodeURIComponent(row.typeKey)}`)
}

const showApproveModal = ref(false)
const approveTarget = ref<ApprovalRow | null>(null)

function openApproveConfirm(row: ApprovalRow) {
  approveTarget.value = row
  showApproveModal.value = true
}

async function patchRequest(target: ApprovalRow, status: 'approved' | 'rejected', comment: string | null) {
  await apiFetch(`/reports/approvals/${encodeURIComponent(target.typeKey)}/${target.id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: {
      status,
      comment,
    },
  })
}

async function confirmApprove() {
  if (!approveTarget.value) return
  await patchRequest(approveTarget.value, 'approved', null)
  showApproveModal.value = false
  approveTarget.value = null
  await loadRows()
}

const showRejectModal = ref(false)
const rejectTarget = ref<ApprovalRow | null>(null)
const rejectNote = ref('')
const rejectNoteError = ref('')

function openReject(row: ApprovalRow) {
  rejectTarget.value = row
  rejectNote.value = ''
  rejectNoteError.value = ''
  showRejectModal.value = true
}

async function confirmReject() {
  if (!rejectNote.value.trim()) {
    rejectNoteError.value = 'กรุณาระบุเหตุผล'
    return
  }
  if (!rejectTarget.value) return

  await patchRequest(rejectTarget.value, 'rejected', rejectNote.value.trim())
  showRejectModal.value = false
  rejectTarget.value = null
  rejectNote.value = ''
  rejectNoteError.value = ''
  await loadRows()
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.page-title { font-size: 1.2rem; font-weight: 700; margin: 0; color: #111827; }
.page-desc { color: #6b7280; margin-top: 4px; font-size: 0.88rem; }
.header-actions { display: flex; align-items: center; }
.total-badge { background: #fefce8; color: #92400e; border: 1px solid #fde68a; border-radius: 999px; padding: 4px 14px; font-size: 0.85rem; font-weight: 500; }

.summary-strip { display: flex; gap: 12px; flex-wrap: wrap; }
.summary-item { background: #fff; border: 1px solid #e8eaed; border-radius: 12px; padding: 14px 20px; display: flex; flex-direction: column; gap: 3px; min-width: 110px; }
.s-value { font-size: 1.5rem; font-weight: 700; line-height: 1.1; color: #111827; }
.s-label { font-size: 0.8rem; color: #6b7280; }

.toolbar { display: flex; flex-direction: column; gap: 10px; }
.search-wrap { position: relative; width: fit-content; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 0.875rem; font-family: inherit; background: #fff; color: #111827; outline: none; transition: border-color 0.12s; }
.input:focus { border-color: #6366f1; }
.search { width: 280px; padding-left: 32px; }

.tab-row { display: flex; gap: 4px; flex-wrap: wrap; }
.tab { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #e5e7eb; border-radius: 9px; padding: 7px 14px; font-size: 0.86rem; background: #fff; color: #374151; cursor: pointer; font-family: inherit; transition: background 0.12s, border-color 0.12s; }
.tab:hover:not(.tab--active) { background: #f9fafb; }
.tab--active { background: #111827; color: #fff; border-color: #111827; }
.tab-count { background: #ef4444; color: #fff; border-radius: 999px; font-size: 0.7rem; font-weight: 700; min-width: 18px; padding: 1px 5px; text-align: center; line-height: 1.4; }

.type-cell { font-weight: 500; font-size: 0.88rem; }
.action-btns { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: nowrap; }
.btn-action { border-radius: 7px; padding: 4px 9px; font-size: 0.78rem; border: 1px solid #d1d5db; background: #f9fafb; color: #374151; cursor: pointer; font-family: inherit; transition: background 0.1s; }
.btn-detail { border-color: #e5e7eb; background: #fff; color: #374151; }
.btn-detail:hover { background: #f9fafb; }
.btn-edit { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.btn-edit:hover { background: #dbeafe; }
.btn-delete { border-color: #fecaca; background: #fff5f5; color: #dc2626; }
.btn-delete:hover { background: #fee2e2; }

.field { display: flex; flex-direction: column; gap: 5px; font-size: 0.83rem; font-weight: 500; color: #374151; }
.req { color: #ef4444; }
.field-error { font-size: 0.75rem; color: #ef4444; }
.form-textarea { min-height: 90px; resize: vertical; }

.pagination { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.page-info { font-size: 0.82rem; color: #6b7280; white-space: nowrap; margin-right: 4px; }
.page-btns { display: flex; gap: 3px; }
.page-btn { min-width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #e5e7eb; border-radius: 7px; background: #fff; color: #374151; font-size: 0.82rem; font-weight: 500; font-family: inherit; cursor: pointer; padding: 0 6px; transition: all 0.1s; }
.page-btn:hover:not(:disabled) { background: #f3f4f6; border-color: #d1d5db; }
.page-btn:disabled { opacity: 0.35; cursor: default; }
.page-btn--active { background: #111827; color: #fff; border-color: #111827; }
.page-btn--ellipsis { border-color: transparent; background: transparent; cursor: default; }
.page-size-select { padding: 6px 10px; font-size: 0.82rem; cursor: pointer; height: 32px; }
</style>